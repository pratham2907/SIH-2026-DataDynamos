const {
  Centers, Slots, Bookings, Farmers, Holidays, generateId
} = require('../models/dbStore');
const { generateQRCode } = require('../services/qrService');
const { generateBookingPassPDF } = require('../services/pdfService');
const { sendNotification } = require('../services/notificationService');
const { emitToCenter } = require('../services/socketService');
const { sendSlotBookingEmail } = require('../services/emailService');

/**
 * Helper to generate time slot intervals
 */
const generateTimeSlotsForDay = (openingTime = '08:00 AM', closingTime = '06:00 PM', durationMinutes = 30) => {
  const slots = [];
  let currentHour = 8;
  let currentMin = 0;
  const endHour = 18; // 6 PM

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

// Master Nationwide Procurement Centres Directory
const ENSURED_NATIONAL_CENTERS = [
  {
    centerId: 'CTR-01',
    name: 'APMC Central Mandi Bhopal',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    taluka: 'Huzur',
    village: 'Karond Mandi Complex',
    fullAddress: 'Gate No. 3, APMC Yard, Karond, Bhopal, MP - 462038',
    latitude: 23.2599,
    longitude: 77.4126,
    maxDailyCapacity: 300,
    availableCapacity: 100,
    maxHourlyCapacity: 30,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Medium'
  },
  {
    centerId: 'CTR-02',
    name: 'Sehore Krishak Mega Mandi',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    taluka: 'Sehore',
    village: 'Mandi Yard',
    fullAddress: 'National Highway 86, Mandi Complex, Sehore, MP - 466001',
    latitude: 23.2032,
    longitude: 77.0844,
    maxDailyCapacity: 450,
    availableCapacity: 120,
    maxHourlyCapacity: 45,
    countersCount: 5,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-03',
    name: 'Vidisha Agro Procurement Terminal',
    state: 'Madhya Pradesh',
    district: 'Vidisha',
    taluka: 'Vidisha',
    village: 'Ahmedpur Road Yard',
    fullAddress: 'Ahmedpur By-pass Road, Vidisha, MP - 464001',
    latitude: 23.5251,
    longitude: 77.8081,
    maxDailyCapacity: 280,
    availableCapacity: 150,
    maxHourlyCapacity: 30,
    countersCount: 3,
    slotDurationMinutes: 30,
    openingTime: '08:30 AM',
    closingTime: '05:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-04',
    name: 'Hoshangabad Krishak Mandi',
    state: 'Madhya Pradesh',
    district: 'Hoshangabad',
    taluka: 'Hoshangabad',
    village: 'Rasulia Yard',
    fullAddress: 'Rasulia Mandi Complex, Narmadapuram, MP - 461001',
    latitude: 22.7519,
    longitude: 77.7289,
    maxDailyCapacity: 320,
    availableCapacity: 200,
    maxHourlyCapacity: 35,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Medium'
  },
  {
    centerId: 'CTR-05',
    name: 'Raisen Kisan Procurement Hub',
    state: 'Madhya Pradesh',
    district: 'Raisen',
    taluka: 'Raisen',
    village: 'Sanchi Road Yard',
    fullAddress: 'Sanchi Road, Near Industrial Area, Raisen, MP - 464551',
    latitude: 23.3315,
    longitude: 77.7818,
    maxDailyCapacity: 250,
    availableCapacity: 100,
    maxHourlyCapacity: 25,
    countersCount: 3,
    slotDurationMinutes: 30,
    openingTime: '08:30 AM',
    closingTime: '05:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-06',
    name: 'Karnal Grain Procurement Mandi',
    state: 'Haryana',
    district: 'Karnal',
    taluka: 'Karnal',
    village: 'GT Road Grain Yard',
    fullAddress: 'New Anaj Mandi, GT Road, Karnal, Haryana - 132001',
    latitude: 29.6857,
    longitude: 76.9905,
    maxDailyCapacity: 450,
    availableCapacity: 180,
    maxHourlyCapacity: 45,
    countersCount: 5,
    slotDurationMinutes: 30,
    openingTime: '08:30 AM',
    closingTime: '06:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'High'
  },
  {
    centerId: 'CTR-07',
    name: 'Nashik Krishi Utpanna Bazar',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Nashik',
    village: 'Dindori Road Yard',
    fullAddress: 'Market Yard Complex, Panchavati, Nashik - 422003',
    latitude: 19.9975,
    longitude: 73.7898,
    maxDailyCapacity: 280,
    availableCapacity: 130,
    maxHourlyCapacity: 25,
    countersCount: 3,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '05:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-08',
    name: 'Guntur Agri Procurement Terminal',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    taluka: 'Guntur Rural',
    village: 'Autonagar Terminal',
    fullAddress: 'Spices & Grain Complex, Ring Road, Guntur - 522004',
    latitude: 16.3067,
    longitude: 80.4365,
    maxDailyCapacity: 350,
    availableCapacity: 150,
    maxHourlyCapacity: 35,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-09',
    name: 'Ahmedabad Krishi Bazar Terminal',
    state: 'Gujarat',
    district: 'Ahmedabad',
    taluka: 'Ahmedabad City',
    village: 'Jamalpur APMC Yard',
    fullAddress: 'APMC Market Complex, Jamalpur, Ahmedabad, Gujarat - 380022',
    latitude: 23.0225,
    longitude: 72.5714,
    maxDailyCapacity: 400,
    availableCapacity: 170,
    maxHourlyCapacity: 40,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '07:30 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Medium'
  },
  {
    centerId: 'CTR-10',
    name: 'Jaipur Anaj & Krishi Upaj Mandi',
    state: 'Rajasthan',
    district: 'Jaipur',
    taluka: 'Sanganer',
    village: 'Muhana Mandi Yard',
    fullAddress: 'Muhana Terminal Mandi, Sanganer, Jaipur, Rajasthan - 302029',
    latitude: 26.9124,
    longitude: 75.7873,
    maxDailyCapacity: 360,
    availableCapacity: 140,
    maxHourlyCapacity: 35,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-11',
    name: 'Azadpur APMC National Terminal',
    state: 'Delhi',
    district: 'North Delhi',
    taluka: 'Model Town',
    village: 'Azadpur Yard',
    fullAddress: 'New Subzi Mandi, Azadpur, Delhi - 110033',
    latitude: 28.7041,
    longitude: 77.1734,
    maxDailyCapacity: 600,
    availableCapacity: 250,
    maxHourlyCapacity: 60,
    countersCount: 6,
    slotDurationMinutes: 30,
    openingTime: '06:00 AM',
    closingTime: '08:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Medium'
  },
  {
    centerId: 'CTR-12',
    name: 'Devi Ahilya Mega APMC Terminal Indore',
    state: 'Madhya Pradesh',
    district: 'Indore',
    taluka: 'Indore',
    village: 'Choithram Mandi Complex',
    fullAddress: 'Choithram Square, Dhar Road, Indore, MP - 452014',
    latitude: 22.7196,
    longitude: 75.8577,
    maxDailyCapacity: 450,
    availableCapacity: 190,
    maxHourlyCapacity: 45,
    countersCount: 5,
    slotDurationMinutes: 30,
    openingTime: '07:00 AM',
    closingTime: '07:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Medium'
  },
  {
    centerId: 'CTR-13',
    name: 'Ludhiana Central Grain Terminal',
    state: 'Punjab',
    district: 'Ludhiana',
    taluka: 'Ludhiana West',
    village: 'Gill Road Grain Yard',
    fullAddress: 'New Dana Mandi, Gill Road, Ludhiana, Punjab - 141003',
    latitude: 30.9010,
    longitude: 75.8573,
    maxDailyCapacity: 500,
    availableCapacity: 220,
    maxHourlyCapacity: 50,
    countersCount: 5,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-14',
    name: 'Lucknow Kisan Mandi Terminal',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    taluka: 'Sarojini Nagar',
    village: 'Dubagga Mandi Yard',
    fullAddress: 'Hardoi Bypass Road, Dubagga, Lucknow, UP - 226003',
    latitude: 26.8467,
    longitude: 80.9462,
    maxDailyCapacity: 380,
    availableCapacity: 160,
    maxHourlyCapacity: 38,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '07:30 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-15',
    name: 'Vijayawada Krishna Procurement Hub',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada Urban',
    village: 'Gollapudi Terminal',
    fullAddress: 'Bhavanipuram APMC Yard, Vijayawada, AP - 520012',
    latitude: 16.5062,
    longitude: 80.6480,
    maxDailyCapacity: 320,
    availableCapacity: 140,
    maxHourlyCapacity: 32,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-16',
    name: 'Vadodara Agro Procurement Terminal',
    state: 'Gujarat',
    district: 'Vadodara',
    taluka: 'Vadodara Urban',
    village: 'Sayajipura APMC Yard',
    fullAddress: 'National Highway 8, Sayajipura, Vadodara, Gujarat - 390019',
    latitude: 22.3072,
    longitude: 73.1812,
    maxDailyCapacity: 400,
    availableCapacity: 180,
    maxHourlyCapacity: 40,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '07:30 AM',
    closingTime: '06:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-17',
    name: 'Mehsana North Gujarat Krishi Hub',
    state: 'Gujarat',
    district: 'Mehsana',
    taluka: 'Mehsana',
    village: 'Radhanpur Road Yard',
    fullAddress: 'APMC Market Yard, Radhanpur Road, Mehsana, Gujarat - 384002',
    latitude: 23.5880,
    longitude: 72.3693,
    maxDailyCapacity: 380,
    availableCapacity: 160,
    maxHourlyCapacity: 35,
    countersCount: 4,
    slotDurationMinutes: 30,
    openingTime: '08:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  },
  {
    centerId: 'CTR-18',
    name: 'Surat Central APMC Mega Terminal',
    state: 'Gujarat',
    district: 'Surat',
    taluka: 'Chorasi',
    village: 'Sahara Darwaja Terminal',
    fullAddress: 'APMC Market, Ring Road, Sahara Darwaja, Surat, Gujarat - 395003',
    latitude: 21.1702,
    longitude: 72.8311,
    maxDailyCapacity: 450,
    availableCapacity: 200,
    maxHourlyCapacity: 45,
    countersCount: 5,
    slotDurationMinutes: 30,
    openingTime: '07:00 AM',
    closingTime: '07:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Medium'
  },
  {
    centerId: 'CTR-19',
    name: 'Rajkot Saurashtra Krishi Mandi',
    state: 'Gujarat',
    district: 'Rajkot',
    taluka: 'Rajkot Urban',
    village: 'Bedi Yard',
    fullAddress: 'APMC Market Yard, Bedi Village Road, Rajkot, Gujarat - 360003',
    latitude: 22.3039,
    longitude: 70.8022,
    maxDailyCapacity: 420,
    availableCapacity: 190,
    maxHourlyCapacity: 40,
    countersCount: 5,
    slotDurationMinutes: 30,
    openingTime: '07:30 AM',
    closingTime: '06:30 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    isActive: true,
    currentCrowdLevel: 'Low'
  }
];

/**
 * Get All Active Procurement Centers (with optional location-based proximity sorting)
 */
const getCenters = async (req, res) => {
  try {
    let centers = await Centers.find({ isActive: true });
    
    // Auto-seed any missing national centers into database for full nationwide coverage
    if (!centers || centers.length < ENSURED_NATIONAL_CENTERS.length) {
      for (const enc of ENSURED_NATIONAL_CENTERS) {
        const exists = centers.find(c => c.centerId === enc.centerId);
        if (!exists) {
          try {
            await Centers.create({ ...enc });
          } catch (e) {}
        }
      }
      centers = await Centers.find({ isActive: true });
    }

    // Optional geospatial sorting if farmer coordinates are provided
    const userLat = parseFloat(req.query.lat);
    const userLon = parseFloat(req.query.lon || req.query.lng);
    const radius = parseFloat(req.query.radius);

    if (!isNaN(userLat) && !isNaN(userLon)) {
      centers = centers.map(c => {
        const cLat = c.latitude || 23.2599;
        const cLon = c.longitude || 77.4126;
        const dLat = (cLat - userLat) * (Math.PI / 180);
        const dLon = (cLon - userLon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * (Math.PI / 180)) *
            Math.cos(cLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
        return {
          ...c,
          distanceKm
        };
      });

      // Sort by proximity
      centers.sort((a, b) => a.distanceKm - b.distanceKm);

      if (!isNaN(radius) && radius > 0) {
        const inRadius = centers.filter(c => c.distanceKm <= radius);
        if (inRadius.length >= 2) {
          centers = inRadius;
        } else {
          // Always maintain at least top 3-4 nearest candidate centres so farmers can genuinely compare two options
          centers = centers.slice(0, Math.max(3, inRadius.length));
        }
      }
    }

    return res.json({ success: true, data: centers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Available Slots for a given Center & Date
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { centerId, date } = req.query;
    if (!centerId || !date) {
      return res.status(400).json({ success: false, message: 'centerId and date are required' });
    }

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
      return res.status(404).json({ success: false, message: 'Procurement Center not found' });
    }

    // Check holiday
    const holiday = await Holidays.findOne({ date, isActive: true });
    if (holiday) {
      return res.json({
        success: true,
        isHoliday: true,
        holidayName: holiday.title,
        slots: []
      });
    }

    const allIntervals = generateTimeSlotsForDay(
      center.openingTime,
      center.closingTime,
      center.slotDurationMinutes || 30
    );

    const maxPerSlot = center.maxHourlyCapacity ? Math.round(center.maxHourlyCapacity / 2) : 10;
    const existingBookings = await Bookings.find({
      centerId,
      date,
      status: { $ne: 'Cancelled' }
    });

    const slotAvailability = allIntervals.map(timeSlot => {
      const bookedCount = existingBookings.filter(b => b.timeSlot === timeSlot).length;
      const available = Math.max(0, maxPerSlot - bookedCount);
      return {
        timeSlot,
        maxCapacity: maxPerSlot,
        bookedCount,
        availableSlots: available,
        isFull: available === 0,
        status: available > 0 ? (available <= 3 ? 'Fast Filling' : 'Available') : 'Full'
      };
    });

    return res.json({
      success: true,
      center,
      date,
      totalBookedToday: existingBookings.length,
      maxDailyCapacity: center.maxDailyCapacity || 300,
      slots: slotAvailability
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Book a Procurement Slot
 */
const bookSlot = async (req, res) => {
  try {
    const userId = req.user.id;
    const farmer = await Farmers.findById(userId);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile required to book slots.' });
    }

    const { centerId, cropName, quantity, date, timeSlot, vehicleNumber, remarks } = req.body;

    if (!centerId || !cropName || !quantity || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Missing required booking details.' });
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Procurement quantity must be a positive number greater than 0.' });
    }

    // Check past date
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Cannot book slots for past dates.' });
    }

    // Prevent double booking on same day
    const existingSameDay = await Bookings.findOne({
      farmerId: farmer.farmerId,
      date,
      status: { $in: ['Booked', 'Confirmed', 'Checked In', 'Processing', 'Waiting'] }
    });

    if (existingSameDay) {
      return res.status(400).json({
        success: false,
        message: `You already have an active booking (${existingSameDay.bookingNumber}) for ${date}. Double booking is not permitted.`
      });
    }

    const center = await Centers.findOne({ centerId });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Selected Mandi center is invalid.' });
    }

    // Generate unique Booking ID & Number
    const bookingCount = await Bookings.countDocuments();
    const bookingNumber = `BKG-${new Date().getFullYear()}-${String(bookingCount + 101).padStart(4, '0')}`;
    const bookingId = generateId('bkg_');

    // Generate QR Code
    const qrPayload = {
      bookingNumber,
      bookingId,
      farmerId: farmer.farmerId,
      farmerName: farmer.fullName,
      centerId,
      date,
      timeSlot,
      crop: cropName,
      quantity: parseFloat(quantity)
    };
    const qrCodeDataUrl = await generateQRCode(qrPayload);

    const booking = await Bookings.create({
      _id: bookingId,
      bookingNumber,
      farmerId: farmer.farmerId,
      userId,
      farmerName: farmer.fullName,
      centerId,
      centerName: center.name,
      cropName,
      quantity: parseFloat(quantity),
      date,
      timeSlot,
      vehicleNumber: vehicleNumber || 'Farmer Transport',
      remarks: remarks || '',
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

    const farmerEmail = farmer.email || (req.user && req.user.email) || 'upadhyayhem0@gmail.com';

    // Dispatch dedicated Brevo email confirmation to the logged in farmer
    sendSlotBookingEmail({
      to: farmerEmail,
      fullName: farmer.fullName,
      booking: {
        tokenNumber: bookingNumber,
        centerName: center.name,
        slotTime: `${date} (${timeSlot})`,
        cropName,
        quantity
      }
    }).then(res => {
      console.log(`📧 Slot booking confirmation email dispatched to ${farmerEmail} (Provider: ${res.provider})`);
    }).catch(err => {
      console.error('Booking confirmation email error:', err);
    });

    // Send In-App Notification & SMS log
    await sendNotification({
      userId,
      role: 'farmer',
      title: 'Slot Booking Confirmed',
      message: `Your slot for ${cropName} (${quantity} Q) at ${center.name} on ${date} (${timeSlot}) is confirmed. Booking No: ${bookingNumber}`,
      type: 'booking',
      metadata: { bookingNumber, date, timeSlot, mobile: farmer.mobile, email: farmerEmail, fullName: farmer.fullName }
    });

    // Real-time update for center officer dashboard
    emitToCenter(centerId, 'booking:created', { bookingNumber, date, timeSlot, cropName });

    return res.status(201).json({
      success: true,
      message: 'Slot booked successfully! Download your QR pass below.',
      data: booking
    });
  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete booking', error: err.message });
  }
};

/**
 * Get Logged In Farmer's Bookings
 */
const getMyBookings = async (req, res) => {
  try {
    const farmer = await Farmers.findById(req.user.id);
    if (!farmer) {
      return res.json({ success: true, data: [] });
    }
    const bookings = await Bookings.find({ farmerId: farmer.farmerId });
    return res.json({ success: true, data: bookings.reverse() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Booking By ID / Number
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await Bookings.findOne({
      $or: [{ _id: req.params.id }, { bookingNumber: req.params.id }]
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    return res.json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Reschedule Booking
 */
const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTimeSlot } = req.body;

    const booking = await Bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Checked In' || booking.status === 'Processing' || booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: `Cannot reschedule a booking that is already '${booking.status}'.` });
    }

    const updated = await Bookings.findByIdAndUpdate(id, {
      date: newDate,
      timeSlot: newTimeSlot,
      status: 'Confirmed'
    });

    await sendNotification({
      userId: req.user.id,
      role: 'farmer',
      title: 'Booking Rescheduled',
      message: `Your booking ${booking.bookingNumber} has been moved to ${newDate} (${newTimeSlot}).`,
      type: 'booking'
    });

    return res.json({ success: true, message: 'Booking rescheduled successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Cancel Booking
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Completed' || booking.status === 'Processing') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an in-progress or completed procurement.' });
    }

    const updated = await Bookings.findByIdAndUpdate(id, {
      status: 'Cancelled',
      cancelReason: reason || 'Farmer requested cancellation'
    });

    await sendNotification({
      userId: req.user.id,
      role: 'farmer',
      title: 'Booking Cancelled',
      message: `Your slot booking ${booking.bookingNumber} was cancelled.`,
      type: 'booking'
    });

    return res.json({ success: true, message: 'Booking cancelled successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Download Booking Pass PDF
 */
const downloadBookingPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Bookings.findOne({
      $or: [{ _id: id }, { bookingNumber: id }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const farmer = (await Farmers.findOne({ farmerId: booking.farmerId })) || { fullName: booking.farmerName || 'Farmer' };
    const center = (await Centers.findOne({ centerId: booking.centerId })) || { name: booking.centerName || 'APMC Mandi' };

    const pdfBuffer = await generateBookingPassPDF(booking, farmer, center);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=KPMS_Booking_${booking.bookingNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF pass', error: err.message });
  }
};

module.exports = {
  getCenters,
  getAvailableSlots,
  bookSlot,
  getMyBookings,
  getBookingById,
  rescheduleBooking,
  cancelBooking,
  downloadBookingPDF
};
