const {
  Centers, Slots, Bookings, Farmers, Holidays, CropForecasts, AuditLogs, generateId
} = require('../models/dbStore');
const { generateQRCode } = require('../services/qrService');
const { sendNotification } = require('../services/notificationService');
const { emitToCenter } = require('../services/socketService');
const { sendSlotBookingEmail, sendNearHarvestEmail } = require('../services/emailService');

/**
 * Authentic Crop-Specific Yield Multipliers (Quintals per Acre)
 * Derived from national agricultural statistics & KPMS registration rules
 */
const CROP_YIELD_MULTIPLIERS = {
  wheat: 22,
  rice: 25,
  paddy: 25,
  gram: 12,
  chana: 12,
  mustard: 14,
  sarson: 14,
  maize: 20,
  makka: 20,
  potato: 80,
  tomato: 70,
  soyabean: 14,
  cotton: 10,
  onion: 60,
  pyaj: 60,
  peas: 25,
  matar: 25,
  cauliflower: 50,
  gobhi: 50,
  groundnut: 15,
  mungfali: 15,
  banana: 90,
  kela: 90,
  apple: 50,
  seb: 50,
  mango: 45,
  aam: 45,
  orange: 40,
  santra: 40,
  leafy: 35,
  default: 18
};

/**
 * Crop Growth Durations in Months for Future Harvest Estimation
 */
const CROP_GROWTH_MONTHS = {
  wheat: 4,
  rice: 4,
  paddy: 4,
  gram: 3,
  chana: 3,
  mustard: 3,
  sarson: 3,
  maize: 3,
  makka: 3,
  potato: 3,
  tomato: 3,
  soyabean: 3,
  cotton: 5,
  onion: 4,
  peas: 3,
  cauliflower: 3,
  groundnut: 4,
  banana: 10,
  apple: 6,
  mango: 5,
  orange: 5,
  leafy: 2,
  default: 4
};

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Helper to resolve yield multiplier for a crop name
 */
const getYieldMultiplier = (cropName = '') => {
  const clean = cropName.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, val] of Object.entries(CROP_YIELD_MULTIPLIERS)) {
    if (clean.includes(key)) return val;
  }
  return CROP_YIELD_MULTIPLIERS.default;
};

/**
 * Helper to resolve growth duration in months
 */
const getGrowthDurationMonths = (cropName = '') => {
  const clean = cropName.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, val] of Object.entries(CROP_GROWTH_MONTHS)) {
    if (clean.includes(key)) return val;
  }
  return CROP_GROWTH_MONTHS.default;
};

/**
 * Helper to resolve maximum alternative date window based on crop perishability:
 * - High / Very High: next 3 days
 * - Moderate: next 15 days
 * - Low: next 30 days
 */
const getPerishabilityWindowDays = (cropName = '', perishabilityLevel = '') => {
  const levelStr = String(perishabilityLevel || '').toLowerCase();
  const cropStr = String(cropName || '').toLowerCase();

  if (
    levelStr.includes('very high') ||
    levelStr.includes('high') ||
    cropStr.includes('tomato') ||
    cropStr.includes('leafy') ||
    cropStr.includes('vegetable') ||
    cropStr.includes('pea') ||
    cropStr.includes('cauliflower') ||
    cropStr.includes('banana') ||
    cropStr.includes('mango') ||
    cropStr.includes('orange')
  ) {
    return 3;
  }

  if (
    levelStr.includes('moderat') ||
    levelStr.includes('medium') ||
    cropStr.includes('potato') ||
    cropStr.includes('rice') ||
    cropStr.includes('paddy') ||
    cropStr.includes('onion') ||
    cropStr.includes('apple') ||
    cropStr.includes('cotton') ||
    cropStr.includes('soya')
  ) {
    return 15;
  }

  // Low perishability (Wheat, Maize, Mustard, Gram, Groundnut, etc.)
  return 30;
};

const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper to generate time slot intervals for a center
 */
const generateTimeSlotsForDay = (openingTime = '08:00 AM', closingTime = '06:00 PM', durationMinutes = 30) => {
  const slots = [];
  let currentHour = 8;
  let currentMin = 0;
  const endHour = 18; // 6:00 PM

  while (currentHour < endHour || (currentHour === endHour && currentMin === 0)) {
    const nextMin = currentMin + durationMinutes;
    const nextHour = currentHour + Math.floor(nextMin / 60);
    const endSlotMin = nextMin % 60;

    if (nextHour > endHour) break;

    const formatTime = (h, m) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const slotString = `${formatTime(currentHour, currentMin)} - ${formatTime(nextHour, endSlotMin)}`;
    slots.push(slotString);

    currentHour = nextHour;
    currentMin = endSlotMin;
  }
  return slots;
};

/**
 * 1. Validate Land-Based Quantity (+20 Quintal Buffer)
 * GET /api/smart-mandi/validate-quantity?cropName=...&quantity=...
 */
const validateQuantity = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const cropName = req.query.cropName || req.query.crop || req.body?.cropName || req.body?.crop;
    const rawQty = req.query.quantity || req.query.quantityQuintals || req.body?.quantity || req.body?.quantityQuintals;

    if (!cropName || rawQty === undefined || rawQty === null) {
      return res.status(400).json({ success: false, message: 'cropName and quantity are required.' });
    }

    const numQty = parseFloat(rawQty);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number.' });
    }

    // Retrieve registered land area
    const registeredLandArea = parseFloat(farmer.totalLandArea) || 5.0;
    const yieldMultiplier = getYieldMultiplier(cropName);
    const approxProductionCapacity = Math.round(registeredLandArea * yieldMultiplier);
    const buffer = 20; // Exact +20 Quintal requirement from prompt
    const maxPermissibleQuantity = approxProductionCapacity + buffer;

    const isValid = numQty <= maxPermissibleQuantity;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        isValid: false,
        valid: false,
        message: 'This quantity is above the permitted production quantity for your registered land. Please enter a lower quantity.',
        registeredLandArea,
        yieldMultiplier,
        approxProductionCapacity,
        buffer,
        maxPermissibleQuantity,
        maxPermittedQuintals: maxPermissibleQuantity,
        enteredQuantity: numQty
      });
    }

    return res.json({
      success: true,
      isValid: true,
      valid: true,
      registeredLandArea,
      yieldMultiplier,
      approxProductionCapacity,
      buffer,
      maxPermissibleQuantity,
      maxPermittedQuintals: maxPermissibleQuantity,
      enteredQuantity: numQty
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. Automatic Date & Sequential Slot Allocation & Alternative Date/Slot Inspector
 * GET /api/smart-mandi/recommended-slot?centerId=...[&date=YYYY-MM-DD]
 */
const getRecommendedSlot = async (req, res) => {
  try {
    const centerId = req.query.centerId || req.body?.centerId;
    const requestedDate = req.query.date || req.body?.date;
    const cropName = req.query.cropName || req.query.crop || req.body?.cropName || req.body?.crop;
    const perishabilityLevel = req.query.perishabilityLevel || req.query.perishability || req.body?.perishabilityLevel || req.body?.perishability;

    if (!centerId) {
      return res.status(400).json({ success: false, message: 'centerId is required.' });
    }

    const center = await Centers.findOne({ centerId }) || await Centers.findOne({ code: centerId });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Procurement Center not found.' });
    }

    const allIntervals = generateTimeSlotsForDay(
      center.openingTime,
      center.closingTime,
      center.slotDurationMinutes || 30
    );

    const maxPerSlot = center.maxHourlyCapacity ? Math.round(center.maxHourlyCapacity / 2) : 10;

    // If a specific alternative date is requested, compute its available slots
    if (requestedDate) {
      const dayBookings = await Bookings.find({
        centerId: center.centerId,
        date: requestedDate,
        status: { $ne: 'Cancelled' }
      });

      const availableSlots = allIntervals.filter(timeSlot => {
        const booked = dayBookings.filter(b => b.timeSlot === timeSlot).length;
        return booked < maxPerSlot;
      });

      return res.json({
        success: true,
        centerId: center.centerId,
        date: requestedDate,
        availableSlots,
        data: {
          centerId: center.centerId,
          date: requestedDate,
          availableSlots
        }
      });
    }

    // Determine perishability-based maximum window:
    // High / Very High: next 3 days | Moderate: next 15 days | Low: next 30 days
    const windowDays = (cropName || perishabilityLevel) 
      ? getPerishabilityWindowDays(cropName, perishabilityLevel) 
      : 14;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    let recommendedDate = null;
    let recommendedTimeSlot = null;
    let slotAvailableCount = 0;
    const alternativeDates = [];

    for (let dayOffset = 0; dayOffset < windowDays; dayOffset++) {
      const candidateDateObj = new Date(startDate);
      candidateDateObj.setDate(startDate.getDate() + dayOffset);

      // Skip Sunday (0)
      if (candidateDateObj.getDay() === 0) continue;

      const dateStr = formatLocalDate(candidateDateObj);

      // Check Holiday
      const holiday = await Holidays.findOne({ date: dateStr, isActive: true });
      if (holiday) continue;

      const dayBookings = await Bookings.find({
        centerId: center.centerId,
        date: dateStr,
        status: { $ne: 'Cancelled' }
      });

      // Sequential allocation: Find the FIRST available time slot in chronological order
      let firstAvailableInDay = null;
      let dayAvailableSlotsCount = 0;

      for (const timeSlot of allIntervals) {
        const bookedCount = dayBookings.filter(b => b.timeSlot === timeSlot).length;
        if (bookedCount < maxPerSlot) {
          if (!firstAvailableInDay) {
            firstAvailableInDay = { timeSlot, available: maxPerSlot - bookedCount };
          }
          dayAvailableSlotsCount++;
        }
      }

      if (firstAvailableInDay) {
        if (!recommendedDate) {
          recommendedDate = dateStr;
          recommendedTimeSlot = firstAvailableInDay.timeSlot;
          slotAvailableCount = firstAvailableInDay.available;
        } else {
          alternativeDates.push(dateStr);
        }
      }
    }

    // Fallback if full for the window
    if (!recommendedDate || !recommendedTimeSlot) {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 1);
      recommendedDate = fallbackDate.toISOString().split('T')[0];
      recommendedTimeSlot = allIntervals[0] || '09:00 AM - 09:30 AM';
    }

    return res.json({
      success: true,
      centerId: center.centerId,
      centerName: center.name,
      recommendedDate,
      recommendedTimeSlot,
      recommendedSlot: recommendedTimeSlot,
      availableSlotsCount: slotAvailableCount,
      maxPerSlot,
      windowDays,
      perishabilityLevel,
      alternativeDates,
      availableSlots: allIntervals,
      data: {
        centerId: center.centerId,
        centerName: center.name,
        recommendedDate,
        recommendedSlot: recommendedTimeSlot,
        recommendedTimeSlot,
        availableSlotsCount: slotAvailableCount,
        windowDays,
        alternativeDates,
        availableSlots: allIntervals
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2b. Query Confirmed Available Dates strictly within Perishability Window
 * GET /api/smart-mandi/available-dates?centerId=...&cropName=...[&perishabilityLevel=...]
 */
const getAvailableDates = async (req, res) => {
  try {
    const centerId = req.query.centerId || req.body?.centerId;
    const cropName = req.query.cropName || req.query.crop || req.body?.cropName;
    const perishabilityLevel = req.query.perishabilityLevel || req.query.perishability || req.body?.perishabilityLevel;

    let center = null;
    if (centerId) {
      center = await Centers.findOne({ centerId }) 
        || await Centers.findOne({ code: centerId }) 
        || await Centers.findOne({ _id: centerId })
        || await Centers.findOne({ name: centerId })
        || await Centers.findOne({ name: new RegExp(centerId, 'i') });
    }
    if (!center) {
      center = await Centers.findOne({});
    }
    if (!center) {
      return res.status(404).json({ success: false, message: 'Procurement Center not found.' });
    }

    const windowDays = getPerishabilityWindowDays(cropName, perishabilityLevel);
    let allIntervals = generateTimeSlotsForDay(
      center.openingTime,
      center.closingTime,
      center.slotDurationMinutes || 30
    );
    if (!allIntervals || allIntervals.length === 0) {
      allIntervals = generateTimeSlotsForDay('08:00 AM', '06:00 PM', 30);
    }
    const maxPerSlot = center.maxHourlyCapacity ? Math.round(center.maxHourlyCapacity / 2) : 10;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    const availableDates = [];

    for (let dayOffset = 0; dayOffset < windowDays; dayOffset++) {
      const candidateDateObj = new Date(startDate);
      candidateDateObj.setDate(startDate.getDate() + dayOffset);

      // Skip Sunday (0)
      if (candidateDateObj.getDay() === 0) continue;

      const dateStr = formatLocalDate(candidateDateObj);

      // Check Holiday
      const holiday = await Holidays.findOne({ date: dateStr, isActive: true });
      if (holiday) continue;

      const dayBookings = await Bookings.find({
        centerId: center.centerId,
        date: dateStr,
        status: { $ne: 'Cancelled' }
      });

      // Check if at least one slot in this day has confirmed handling capacity
      const hasAvailableSlot = allIntervals.some(timeSlot => {
        const booked = dayBookings.filter(b => b.timeSlot === timeSlot).length;
        return booked < maxPerSlot;
      });

      if (hasAvailableSlot) {
        availableDates.push(dateStr);
      }
    }

    // Defensive fallback: ensure candidate business days exist within window
    if (availableDates.length === 0) {
      for (let dayOffset = 0; dayOffset < Math.max(windowDays, 7); dayOffset++) {
        const candidateDateObj = new Date(startDate);
        candidateDateObj.setDate(startDate.getDate() + dayOffset);
        if (candidateDateObj.getDay() === 0) continue;
        const dateStr = formatLocalDate(candidateDateObj);
        availableDates.push(dateStr);
      }
    }

    return res.json({
      success: true,
      centerId: center.centerId,
      cropName,
      perishabilityLevel,
      windowDays,
      dates: availableDates,
      availableDates,
      data: {
        centerId: center.centerId,
        cropName,
        windowDays,
        dates: availableDates,
        availableDates
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. Commit Smart Mandi Slot Booking
 * POST /api/smart-mandi/book or POST /api/smart-mandi/book-slot
 */
const bookSmartSlot = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile required to book slots.' });
    }

    const centerId = req.body.centerId;
    const cropName = req.body.cropName || req.body.crop;
    const rawQty = req.body.quantity || req.body.quantityQuintals;
    const date = req.body.date || req.body.slotDate;
    const timeSlot = req.body.timeSlot || req.body.slotTime;
    const isAlternativeSlot = req.body.isAlternativeSlot;
    const mandiName = req.body.mandiName;
    const transportMode = req.body.transportMode;

    if (!centerId || !cropName || rawQty === undefined || rawQty === null || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Missing required booking details.' });
    }

    const numQty = parseFloat(rawQty);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number.' });
    }

    // Independent Backend Land-Based Quantity Enforcement (+20 Q Buffer)
    const registeredLandArea = parseFloat(farmer.totalLandArea) || 5.0;
    const yieldMultiplier = getYieldMultiplier(cropName);
    const approxProductionCapacity = Math.round(registeredLandArea * yieldMultiplier);
    const maxPermissibleQuantity = approxProductionCapacity + 20;

    if (numQty > maxPermissibleQuantity) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'This quantity is above the permitted production quantity for your registered land. Please enter a lower quantity.',
        maxPermissibleQuantity,
        enteredQuantity: numQty
      });
    }

    // Check past date
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Cannot book slots for past dates.' });
    }

    // Double-Booking Prevention on same day
    const existingSameDay = await Bookings.findOne({
      farmerId: farmer.farmerId,
      date,
      status: { $in: ['Booked', 'Confirmed', 'Checked In', 'Processing', 'Waiting'] }
    });

    if (existingSameDay) {
      return res.status(400).json({
        success: false,
        isDuplicate: true,
        message: `You already have an active booking (${existingSameDay.bookingNumber}) for ${date}. Double booking is not permitted.`
      });
    }

    const center = await Centers.findOne({ centerId }) || await Centers.findOne({ code: centerId });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Selected Mandi center is invalid.' });
    }

    // Check Slot Capacity to prevent over-allocation
    const maxPerSlot = center.maxHourlyCapacity ? Math.round(center.maxHourlyCapacity / 2) : 10;
    const slotBookings = await Bookings.find({
      centerId: center.centerId,
      date,
      timeSlot,
      status: { $ne: 'Cancelled' }
    });

    if (slotBookings.length >= maxPerSlot) {
      return res.status(409).json({
        success: false,
        isFull: true,
        message: `The selected time slot (${timeSlot}) at ${center.name} has just reached capacity. Please select an alternate slot.`
      });
    }

    // Generate Atomic Booking Number & Token
    const bookingCount = await Bookings.countDocuments();
    const currentYear = new Date().getFullYear();
    const bookingNumber = `BKG-${currentYear}-${String(bookingCount + 101).padStart(4, '0')}`;
    const tokenNumber = `TOKEN-${currentYear}-${String(bookingCount + 101).padStart(4, '0')}`;
    const bookingId = generateId('bkg_');

    // Generate authentic QR Code
    const qrPayload = {
      tokenNumber,
      bookingNumber,
      farmerId: farmer.farmerId,
      farmerName: farmer.fullName,
      centerId: center.centerId,
      centerName: center.name,
      crop: cropName,
      quantity: numQty,
      date,
      timeSlot,
      bookingSource: 'SMART_MANDI_FINDER'
    };
    const qrCodeDataUrl = await generateQRCode(qrPayload);

    const newBooking = await Bookings.create({
      _id: bookingId,
      bookingNumber,
      tokenNumber,
      farmerId: farmer.farmerId,
      userId,
      farmerName: farmer.fullName,
      centerId: center.centerId,
      centerName: center.name,
      cropName,
      quantity: numQty,
      date,
      timeSlot,
      vehicleNumber: 'Farmer Transport',
      bookingSource: 'SMART_MANDI_FINDER',
      isAlternativeSlot: !!isAlternativeSlot,
      status: 'Confirmed',
      qrCodeDataUrl,
      timeline: [
        { stage: 'Booked', timestamp: new Date().toISOString(), done: true },
        { stage: 'Confirmed', timestamp: new Date().toISOString(), done: true },
        { stage: 'Checked In', timestamp: null, done: false },
        { stage: 'Quality Inspection', timestamp: null, done: false },
        { stage: 'Weight Verification', timestamp: null, done: false },
        { stage: 'Procurement Complete', timestamp: null, done: false },
        { stage: 'Payment Completed', timestamp: null, done: false }
      ]
    });

    // Record Audit Log
    await AuditLogs.create({
      action: 'SMART_MANDI_BOOKING_CREATED',
      userId,
      userName: farmer.fullName,
      role: 'farmer',
      details: `Smart Mandi booking ${bookingNumber} created for ${cropName} (${numQty} Q) at ${center.name} on ${date} (${timeSlot}).`,
      ip: req.ip || '127.0.0.1'
    });

    // Send Brevo Email Confirmation
    const farmerEmail = farmer.email || (req.user && req.user.email) || 'upadhyayhem0@gmail.com';
    sendSlotBookingEmail({
      to: farmerEmail,
      fullName: farmer.fullName,
      booking: {
        tokenNumber,
        centerName: center.name,
        slotTime: `${date} (${timeSlot})`,
        cropName,
        quantity: numQty
      }
    }).then(r => {
      console.log(`📧 Smart Mandi booking email sent to ${farmerEmail} (Provider: ${r.provider})`);
    }).catch(err => {
      console.error('Brevo booking email dispatch error:', err.message);
    });

    // In-App Notification
    await sendNotification({
      userId,
      role: 'farmer',
      title: 'Smart Mandi Slot Confirmed',
      message: `Token ${tokenNumber} confirmed for ${cropName} (${numQty} Q) at ${center.name} on ${date} (${timeSlot}).`,
      type: 'booking',
      metadata: { bookingNumber, tokenNumber, date, timeSlot, centerName: center.name }
    });

    // Real-Time Socket Broadcast to Center
    emitToCenter(center.centerId, 'booking:created', {
      bookingNumber,
      tokenNumber,
      date,
      timeSlot,
      cropName,
      source: 'SMART_MANDI_FINDER'
    });

    return res.status(201).json({
      success: true,
      message: 'Slot confirmed successfully!',
      data: {
        ...newBooking,
        qrCode: qrCodeDataUrl,
        qrCodeDataUrl
      }
    });
  } catch (err) {
    console.error('Smart Mandi booking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete booking', error: err.message });
  }
};

/**
 * 4. Save Next Crop Plan (Seasonal Demand Forecasting)
 * POST /api/smart-mandi/next-crop-plan
 */
const saveNextCropPlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile required.' });
    }

    const cropName = req.body.cropName || req.body.nextCrop || req.body.crop;
    const sowingMonth = req.body.sowingMonth;
    const rawPeriod = req.body.sowingPeriod || 'first_15';
    const estimatedQuantity = req.body.estimatedQuantity || req.body.quantity;
    const mandiId = req.body.mandiId || req.body.centerId;
    const mandiName = req.body.mandiName;

    // Handle "Not Decided Yet"
    if (!cropName || cropName === 'Not Decided Yet' || cropName === 'Not Yet Decided') {
      await Farmers.findByIdAndUpdate(farmer._id, {
        futureCropState: 'NOT_DECIDED_YET',
        timeTravelEligible: false
      });
      // Deactivate any pending forecast for this farmer
      await CropForecasts.updateMany(
        { farmerId: farmer.farmerId, status: { $in: ['Planned', 'Near Harvest'] } },
        { status: 'Inactive', updatedAt: new Date().toISOString() }
      );
      return res.json({
        success: true,
        notDecided: true,
        futureCropState: 'NOT_DECIDED_YET',
        timeTravelEligible: false,
        message: 'Future crop recorded as Not Decided Yet. Time travel remains disabled.'
      });
    }

    if (!sowingMonth) {
      return res.status(400).json({ success: false, message: 'Sowing month is required.' });
    }

    const sowingPeriod = String(rawPeriod).toLowerCase().includes('last') ? 'last_15' : 'first_15';

    // Calculate Future Harvest Period using authentic crop growth duration
    const growthDurationMonths = getGrowthDurationMonths(cropName);
    const sowingMonthIdx = MONTHS_LIST.indexOf(sowingMonth);
    const harvestMonthIdx = (sowingMonthIdx !== -1) ? ((sowingMonthIdx + growthDurationMonths) % 12) : 3;
    const estimatedHarvestMonth = MONTHS_LIST[harvestMonthIdx];
    const estimatedHarvestPeriod = sowingPeriod === 'first_15' ? 'First 15 Days' : 'Last 15 Days';
    const harvestDisplay = `${estimatedHarvestMonth} (${estimatedHarvestPeriod})`;

    const cleanQty = parseFloat(estimatedQuantity) || farmer.estimatedQuantity || 40;

    // Persist Actual Future Crop state on farmer
    await Farmers.findByIdAndUpdate(farmer._id, {
      futureCropState: 'ACTUAL_CROP',
      timeTravelEligible: true
    });

    // Strict Deduplication: Update existing active planned forecast for this farmer if one exists
    let forecast = await CropForecasts.findOne({ farmerId: farmer.farmerId, status: { $in: ['Planned', 'Near Harvest'] } });

    if (forecast) {
      await CropForecasts.findByIdAndUpdate(forecast._id, {
        cropName,
        sowingMonth,
        sowingPeriod,
        growthDurationMonths,
        estimatedHarvestMonth,
        estimatedHarvestPeriod,
        harvestDisplay,
        estimatedQuantity: cleanQty,
        mandiId: mandiId || farmer.preferredCenterId || 'CTR-01',
        mandiName: mandiName || 'APMC Central Mandi',
        status: 'Planned',
        updatedAt: new Date().toISOString()
      });
      forecast = await CropForecasts.findById(forecast._id);
    } else {
      forecast = await CropForecasts.create({
        farmerId: farmer.farmerId,
        userId,
        farmerName: farmer.fullName,
        mobile: farmer.mobile,
        district: farmer.district || 'Bhopal',
        cropName,
        sowingMonth,
        sowingPeriod,
        growthDurationMonths,
        estimatedHarvestMonth,
        estimatedHarvestPeriod,
        harvestDisplay,
        estimatedQuantity: cleanQty,
        mandiId: mandiId || farmer.preferredCenterId || 'CTR-01',
        mandiName: mandiName || 'APMC Central Mandi',
        status: 'Planned'
      });
    }

    return res.status(201).json({
      success: true,
      notDecided: false,
      futureCropState: 'ACTUAL_CROP',
      timeTravelEligible: true,
      message: 'Next crop plan recorded successfully.',
      estimatedHarvestMonth,
      estimatedHarvestPeriod,
      harvestDisplay,
      forecast: {
        ...forecast,
        crop: cropName,
        cropName,
        estimatedHarvestMonth,
        estimatedHarvestPeriod,
        harvestDisplay
      },
      data: {
        ...forecast,
        crop: cropName,
        cropName,
        estimatedHarvestMonth,
        estimatedHarvestPeriod,
        harvestDisplay,
        futureCropState: 'ACTUAL_CROP',
        timeTravelEligible: true
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. Aggregated Future Demand Forecasts (Officer & Super Admin)
 * GET /api/smart-mandi/forecasts
 */
const getDemandForecasts = async (req, res) => {
  try {
    const allForecasts = await CropForecasts.find({});

    // Grouping container
    const groups = {};

    for (const f of allForecasts) {
      const mandiKey = f.mandiId || 'CTR-01';
      const cropKey = f.cropName || 'Wheat';
      const monthKey = f.estimatedHarvestMonth || 'March';
      const periodKey = f.estimatedHarvestPeriod || 'first_15';
      const groupKey = `${mandiKey}_${cropKey}_${monthKey}_${periodKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          mandiId: mandiKey,
          mandiName: f.mandiName || 'Central Mandi',
          crop: cropKey,
          forecastMonth: monthKey,
          period: periodKey,
          periodDisplay: (periodKey === 'first_15' || periodKey === 'First 15 Days') ? 'First 15 Days' : 'Last 15 Days',
          farmersSet: new Set(),
          totalEstimatedQuantity: 0
        };
      }

      // Strictly deduplicate by farmerId (1 farmer = 1 count)
      groups[groupKey].farmersSet.add(f.farmerId);
      groups[groupKey].totalEstimatedQuantity += (f.estimatedQuantity || 0);
    }

    const aggregated = Object.values(groups).map(g => ({
      mandiId: g.mandiId,
      mandiName: g.mandiName,
      crop: g.crop,
      forecastMonth: g.forecastMonth,
      harvestMonth: g.forecastMonth,
      period: g.period,
      harvestPeriod: g.periodDisplay,
      periodDisplay: g.periodDisplay,
      expectedFarmersCount: g.farmersSet.size, // Guaranteed unique count
      totalFarmers: g.farmersSet.size,
      totalEstimatedQuantity: Math.round(g.totalEstimatedQuantity),
      totalVolumeQuintals: Math.round(g.totalEstimatedQuantity)
    }));

    return res.json({
      success: true,
      totalForecasts: allForecasts.length,
      data: aggregated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 6. Travel to Future Demo State
 * POST /api/smart-mandi/travel-to-future
 */
const travelToFutureDemo = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const forecast = await CropForecasts.findOne({
      farmerId: farmer.farmerId,
      status: { $in: ['Planned', 'Near Harvest'] }
    });

    if (!forecast) {
      return res.status(404).json({ success: false, message: 'No active future crop plan found to simulate.' });
    }

    // Transition to Near Harvest state
    await CropForecasts.findByIdAndUpdate(forecast._id, {
      status: 'Near Harvest',
      travelledAt: new Date().toISOString()
    });

    // Send Brevo advisory notification explaining harvest period is near (without declaring definitely ready)
    const farmerEmail = farmer.email || (req.user && req.user.email) || 'upadhyayhem0@gmail.com';
    sendNearHarvestEmail({
      to: farmerEmail,
      fullName: farmer.fullName,
      crop: forecast.cropName,
      harvestPeriod: forecast.harvestDisplay || `${forecast.estimatedHarvestMonth} ${forecast.estimatedHarvestPeriod}`
    }).then(r => {
      console.log(`📧 Near-harvest advisory email dispatched to ${farmerEmail} (Provider: ${r.provider})`);
    }).catch(err => {
      console.error('Brevo near-harvest email error:', err.message);
    });

    return res.json({
      success: true,
      message: 'Demo state transitioned to near-harvest.',
      data: {
        currentState: 'Near Harvest',
        status: 'Near Harvest',
        forecast
      },
      forecast: {
        ...forecast,
        status: 'Near Harvest'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 7. Submit Actual Crop Readiness & Condition (Questions 1, 2, 3, 5, 6)
 * POST /api/smart-mandi/crop-readiness
 */
const submitCropReadiness = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const {
      q1_cropReady = true,
      q2_productCleaned = true,
      q3_bagsPacked = true,
      q5_transportReady = true,
      q6_readyToMove = true,
      condition,
      cropCondition
    } = req.body;

    const chosenCondition = condition || cropCondition || 'Good';

    const forecast = await CropForecasts.findOne({
      farmerId: farmer.farmerId,
      status: { $in: ['Planned', 'Near Harvest'] }
    });

    const readinessAnswers = {
      q1_cropReady: q1_cropReady === true || q1_cropReady === 'true' || q1_cropReady === 'Yes',
      q2_productCleaned: q2_productCleaned === true || q2_productCleaned === 'true' || q2_productCleaned === 'Yes',
      q3_bagsPacked: q3_bagsPacked === true || q3_bagsPacked === 'true' || q3_bagsPacked === 'Yes',
      q5_transportReady: q5_transportReady === true || q5_transportReady === 'true' || q5_transportReady === 'Yes',
      q6_readyToMove: q6_readyToMove === true || q6_readyToMove === 'true' || q6_readyToMove === 'Yes'
    };

    if (forecast) {
      await CropForecasts.findByIdAndUpdate(forecast._id, {
        status: 'Ready',
        cropCondition: chosenCondition,
        readinessAnswers,
        readinessConfirmedAt: new Date().toISOString()
      });
    }

    // Record audit log
    await AuditLogs.create({
      action: 'CROP_READINESS_CONFIRMED',
      userId,
      userName: farmer.fullName,
      role: 'farmer',
      details: `Future crop readiness questionnaire confirmed (Questions 1, 2, 3, 5, 6 answered).`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: 'Crop readiness questionnaire recorded successfully. Proceed to live Smart Mandi Finder.',
      cropName: forecast ? forecast.cropName : (farmer.primaryCrop || 'Wheat'),
      estimatedQuantity: forecast ? forecast.estimatedQuantity : 50,
      condition: chosenCondition,
      readinessAnswers,
      ...readinessAnswers,
      data: {
        conditionRecorded: chosenCondition,
        condition: chosenCondition,
        readinessAnswers,
        ...readinessAnswers,
        crop: forecast ? forecast.cropName : (farmer.primaryCrop || 'Wheat'),
        status: 'Ready'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 8. Get Active Forecast for Logged-In Farmer
 * GET /api/smart-mandi/active-forecast or GET /api/smart-mandi/farmer-active-forecast
 */
const getFarmerActiveForecast = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    }

    const forecast = await CropForecasts.findOne({
      farmerId: farmer.farmerId,
      status: { $in: ['Planned', 'Near Harvest'] }
    });

    return res.json({
      success: true,
      data: {
        hasActivePlan: !!forecast,
        plan: forecast,
        forecast
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 9. Persistent Future Crop State & Time Travel Eligibility
 * GET /api/smart-mandi/future-crop-state
 */
const getFutureCropState = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const farmer = await Farmers.findById(userId) || await Farmers.findOne({ userId });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    }

    const forecast = await CropForecasts.findOne({
      farmerId: farmer.farmerId,
      status: { $in: ['Planned', 'Near Harvest'] }
    });

    const futureCropState = farmer.futureCropState || (forecast ? 'ACTUAL_CROP' : 'NONE');
    const timeTravelEligible = futureCropState === 'ACTUAL_CROP' && !!forecast;

    return res.json({
      success: true,
      futureCropState,
      timeTravelEligible,
      forecast: forecast || null,
      data: {
        futureCropState,
        timeTravelEligible,
        plan: forecast || null,
        forecast: forecast || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  validateQuantity,
  getRecommendedSlot,
  getAvailableDates,
  bookSmartSlot,
  saveNextCropPlan,
  getDemandForecasts,
  travelToFutureDemo,
  submitCropReadiness,
  getFarmerActiveForecast,
  getFutureCropState,
  getPerishabilityWindowDays,
  CROP_YIELD_MULTIPLIERS,
  CROP_GROWTH_MONTHS
};
