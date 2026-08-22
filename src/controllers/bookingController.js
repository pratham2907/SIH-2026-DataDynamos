const {
  Centers, Slots, Bookings, Farmers, Holidays, generateId
} = require('../models/dbStore');
const { generateQRCode } = require('../services/qrService');
const { generateBookingPassPDF } = require('../services/pdfService');
const { sendNotification } = require('../services/notificationService');
const { emitToCenter } = require('../services/socketService');

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

/**
 * Get All Active Procurement Centers
 */
const getCenters = async (req, res) => {
  try {
    const centers = await Centers.find({ isActive: true });
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

    const center = await Centers.findOne({ centerId });
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

    // Send Notification
    await sendNotification({
      userId,
      role: 'farmer',
      title: 'Slot Booking Confirmed',
      message: `Your slot for ${cropName} (${quantity} Q) at ${center.name} on ${date} (${timeSlot}) is confirmed. Booking No: ${bookingNumber}`,
      type: 'booking',
      metadata: { bookingNumber, date, timeSlot, mobile: farmer.mobile, email: farmer.email }
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
