const {
  Centers, Queues, Bookings, Farmers, Procurements, Payments, Inventory, Announcements, Users, AuditLogs, generateId, generateFarmerId
} = require('../models/dbStore');
const { predictWaitTime } = require('../services/aiService');
const { emitToCenter } = require('../services/socketService');
const { generateQRCode } = require('../services/qrService');
const { sendNotification } = require('../services/notificationService');
const bcrypt = require('bcryptjs');

/**
 * Officer Operations Dashboard
 */
const getOfficerDashboard = async (req, res) => {
  try {
    const centerId = req.user.assignedCenterId || 'CTR-01';
    const center = await Centers.findOne({ centerId }) || { name: 'APMC Mandi Central', maxDailyCapacity: 300 };

    const queues = await Queues.find({ centerId });
    const todayBookings = await Bookings.find({ centerId });
    const procurements = await Procurements.find({ centerId });
    const inventoryList = await Inventory.find({ centerId });

    const totalAcceptedQuintals = procurements.reduce((sum, p) => sum + (p.acceptedQuantity || 0), 0);
    const totalProcurementValue = procurements.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const waitEst = await predictWaitTime(centerId);

    // Assisted Bookings Metrics (Real-time from Database)
    const today = new Date().toISOString().split('T')[0];
    const allAssisted = await Bookings.find({
      $or: [
        { bookingSource: 'OFFICER_ASSISTED' },
        { assistedByOfficerId: { $exists: true, $ne: null } }
      ]
    });

    const centerAssisted = allAssisted.filter(b => !centerId || b.centerId === centerId || b.assistedByOfficerId === req.user.id);
    const assistedToday = centerAssisted.filter(b => b.date === today);
    const pendingAssisted = centerAssisted.filter(b => b.status === 'Confirmed' || b.status === 'Booked');
    const completedAssisted = centerAssisted.filter(b => b.status === 'Completed' || b.status === 'Procurement Complete');
    const cancelledAssisted = centerAssisted.filter(b => b.status === 'Cancelled');

    return res.json({
      success: true,
      center,
      stats: {
        todayBookings: todayBookings.length,
        checkedInFarmers: queues.length,
        waitingInQueue: queues.filter(q => q.status === 'waiting').length,
        currentlyProcessing: queues.filter(q => q.status === 'processing' || q.status === 'called').length,
        completedToday: procurements.length,
        totalCropCollectedQuintals: totalAcceptedQuintals,
        totalProcurementValue,
        estimatedWaitTime: `${waitEst.estimatedWaitMinutes} Mins`,
        congestionLevel: waitEst.congestionLevel,
        // Assisted KPIs
        assistedBookingsToday: assistedToday.length,
        totalAssistedBookings: centerAssisted.length,
        pendingAssistedVisits: pendingAssisted.length,
        completedAssisted: completedAssisted.length,
        cancelledAssisted: cancelledAssisted.length
      },
      currentQueue: queues.slice(-10).reverse(),
      inventory: inventoryList,
      recentProcurements: procurements.slice(-5).reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Universal Farmer Search for Officers (with Privacy Masking)
 */
const searchFarmers = async (req, res) => {
  try {
    const { q } = req.query;
    let farmers = [];
    if (!q || q.trim() === '') {
      farmers = (await Farmers.find({})).slice(0, 15);
    } else {
      const queryStr = q.trim();
      farmers = await Farmers.find({
        $or: [
          { fullName: { $regex: queryStr, $options: 'i' } },
          { farmerId: { $regex: queryStr, $options: 'i' } },
          { mobile: { $regex: queryStr } },
          { aadhaarNumber: { $regex: queryStr } },
          { village: { $regex: queryStr, $options: 'i' } },
          { district: { $regex: queryStr, $options: 'i' } }
        ]
      });
    }

    // Mask sensitive Aadhaar & augment with active booking count
    const masked = await Promise.all(farmers.map(async (f) => {
      const activeBookings = await Bookings.find({
        farmerId: f.farmerId,
        status: { $in: ['Booked', 'Confirmed', 'Checked In', 'Processing', 'Waiting'] }
      });

      const rawAadhaar = f.aadhaarNumber || '1234';
      const maskedAadhaar = `XXXX-XXXX-${rawAadhaar.slice(-4)}`;
      const rawMobile = f.mobile || '';
      const maskedMobile = rawMobile.length >= 10 ? `${rawMobile.slice(0, 2)}XXXXXX${rawMobile.slice(-2)}` : rawMobile;

      return {
        _id: f._id,
        farmerId: f.farmerId,
        fullName: f.fullName,
        fatherName: f.fatherName || 'N/A',
        mobile: f.mobile, // preserved for officer direct contact verification
        maskedMobile,
        maskedAadhaar,
        state: f.state || 'Madhya Pradesh',
        district: f.district || 'Bhopal',
        taluka: f.taluka || '',
        village: f.village || '',
        pinCode: f.pinCode || '',
        bankName: f.bankName || 'State Bank of India',
        ifscCode: f.ifscCode || 'SBIN0001234',
        totalLandArea: f.totalLandArea || 5,
        primaryCrop: f.primaryCrop || 'Wheat',
        verificationStatus: f.verificationStatus || 'Approved',
        isEligibleForBooking: (f.verificationStatus || 'Approved') === 'Approved',
        activeBookingsCount: activeBookings.length
      };
    }));

    return res.json({ success: true, count: masked.length, data: masked });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Register Farmer via Officer Assistance (when farmer not found)
 */
const createAssistedFarmerRegistration = async (req, res) => {
  try {
    const {
      fullName, fatherName, mobile, email, aadhaarNumber,
      state, district, taluka, village, pinCode, address,
      bankName, ifscCode, accountNumber,
      totalLandArea, primaryCrop
    } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Farmer full name is required.' });
    }
    if (!mobile || !/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required.' });
    }

    const cleanMobile = String(mobile).trim();
    const cleanAadhaar = aadhaarNumber ? String(aadhaarNumber).trim() : '';

    // Check duplicate mobile or aadhaar
    const existingUser = await Users.findOne({ mobile: cleanMobile });
    const existingFarmer = await Farmers.findOne({
      $or: [
        { mobile: cleanMobile },
        ...(cleanAadhaar ? [{ aadhaarNumber: cleanAadhaar }] : [])
      ]
    });

    if (existingUser || existingFarmer) {
      const match = existingFarmer || existingUser;
      return res.status(400).json({
        success: false,
        isDuplicate: true,
        message: `Farmer record already exists for mobile ${cleanMobile} (Farmer ID: ${match.farmerId || 'Existing Record'}). Please search for this farmer.`
      });
    }

    const farmerId = await generateFarmerId();
    const userId = generateId('usr_');
    const defaultPassword = await bcrypt.hash('Kisan@123', 10);

    // Create User record
    await Users.create({
      _id: userId,
      name: fullName.trim(),
      mobile: cleanMobile,
      email: email ? email.trim() : `${farmerId.toLowerCase()}@smartprocure.nic.in`,
      role: 'farmer',
      isVerified: true,
      farmerId,
      password: defaultPassword,
      registeredBy: 'OFFICER_ASSISTED',
      assistedByOfficerId: req.user.id,
      createdAt: new Date().toISOString()
    });

    // Create Farmer profile
    const farmer = await Farmers.create({
      _id: userId,
      userId,
      farmerId,
      fullName: fullName.trim(),
      fatherName: fatherName ? fatherName.trim() : '',
      mobile: cleanMobile,
      email: email ? email.trim() : `${farmerId.toLowerCase()}@smartprocure.nic.in`,
      aadhaarNumber: cleanAadhaar || '123456789012',
      state: state || 'Madhya Pradesh',
      district: district || 'Bhopal',
      taluka: taluka || '',
      village: village || '',
      pinCode: pinCode || '',
      address: address || `${village || ''}, ${district || ''}`,
      bankName: bankName || 'State Bank of India',
      ifscCode: ifscCode || 'SBIN0001234',
      accountNumber: accountNumber || '12345678901',
      totalLandArea: parseFloat(totalLandArea) || 5,
      primaryCrop: primaryCrop || 'Wheat',
      isVerified: true,
      verificationStatus: 'Approved',
      registeredBy: 'OFFICER_ASSISTED',
      assistedByOfficerId: req.user.id,
      registeredAt: new Date().toISOString()
    });

    // Record government audit log
    await AuditLogs.create({
      action: 'ASSISTED_FARMER_REGISTERED',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      details: `Officer ${req.user.name} registered farmer ${farmer.fullName} with new Farmer ID ${farmerId}.`,
      metadata: { farmerId, fullName: farmer.fullName, mobile: cleanMobile },
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: `Farmer ${farmer.fullName} registered successfully! Assigned Farmer ID: ${farmerId}`,
      data: {
        _id: farmer._id,
        farmerId: farmer.farmerId,
        fullName: farmer.fullName,
        mobile: farmer.mobile,
        maskedAadhaar: `XXXX-XXXX-${(farmer.aadhaarNumber || '1234').slice(-4)}`,
        village: farmer.village,
        district: farmer.district,
        verificationStatus: 'Approved',
        isEligibleForBooking: true
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register farmer: ' + err.message });
  }
};

/**
 * Create Officer-Assisted Booking on behalf of Farmer
 */
const createAssistedBooking = async (req, res) => {
  try {
    const {
      farmerId, centerId, cropName, quantity, date, timeSlot,
      vehicleNumber, remarks, overrideReason, farmerConsentConfirmed
    } = req.body;

    if (!farmerConsentConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Farmer consent confirmation is required to proceed with assisted booking."
      });
    }

    if (!farmerId || !centerId || !cropName || !quantity || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory booking parameters (farmerId, centerId, cropName, quantity, date, timeSlot).'
      });
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Procurement quantity must be a positive number greater than 0.'
      });
    }

    // Verify Farmer exists and is eligible
    const farmer = await Farmers.findOne({
      $or: [{ farmerId }, { _id: farmerId }, { userId: farmerId }]
    });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile record not found in system.' });
    }

    if (farmer.verificationStatus && farmer.verificationStatus !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: `Farmer is currently '${farmer.verificationStatus}'. Only 'Approved' farmers are eligible for procurement booking.`
      });
    }

    // Date check (prevent past dates)
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Cannot book slots for past dates.' });
    }

    // DUPLICATE BOOKING PREVENTION (same farmer, same crop, same date)
    const existingBooking = await Bookings.findOne({
      farmerId: farmer.farmerId,
      date,
      cropName,
      status: { $in: ['Booked', 'Confirmed', 'Checked In', 'Processing', 'Waiting'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        isDuplicate: true,
        existingBooking,
        message: `Existing active booking found (${existingBooking.bookingNumber}) for farmer ${farmer.fullName} on ${date} for ${cropName}. Accidental duplicate bookings are strictly prevented.`
      });
    }

    // Verify Center
    const center = await Centers.findOne({ centerId });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Selected Mandi procurement center is invalid.' });
    }

    // CONCURRENCY & CAPACITY VALIDATION (at commit time)
    const centerBookingsOnDate = await Bookings.find({
      centerId,
      date,
      status: { $ne: 'Cancelled' }
    });

    const slotBookings = centerBookingsOnDate.filter(b => b.timeSlot === timeSlot);
    const maxPerSlot = center.maxHourlyCapacity ? Math.round(center.maxHourlyCapacity / 2) : 15;

    if (slotBookings.length >= maxPerSlot) {
      return res.status(400).json({
        success: false,
        message: `Selected slot (${timeSlot}) at ${center.name} is fully booked (${slotBookings.length}/${maxPerSlot} slots filled). Please select another time slot.`
      });
    }

    const currentBookedVolume = centerBookingsOnDate.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const maxDailyCap = center.maxDailyCapacity || 300;
    const remainingCap = Math.max(0, maxDailyCap - currentBookedVolume);

    if (numQty > remainingCap) {
      return res.status(400).json({
        success: false,
        isOverCapacity: true,
        message: `Requested quantity (${numQty} Q) exceeds remaining daily capacity (${remainingCap} Q) at ${center.name} on ${date}. Please select another date or Mandi.`
      });
    }

    // Atomic Booking & Token Generation
    const bookingCount = await Bookings.countDocuments();
    const bookingSeq = String(bookingCount + 101).padStart(4, '0');
    const bookingNumber = `BKG-${new Date().getFullYear()}-${bookingSeq}`;
    const tokenNumber = `TOKEN-${new Date().getFullYear()}-${bookingSeq}`;
    const bookingId = generateId('bkg_');

    const officerId = req.user.officerId || req.user.id;
    const officerName = req.user.name || 'Procurement Officer';

    // QR Code Generation
    const qrPayload = {
      bookingNumber,
      tokenNumber,
      bookingId,
      farmerId: farmer.farmerId,
      farmerName: farmer.fullName,
      centerId,
      centerName: center.name,
      date,
      timeSlot,
      crop: cropName,
      quantity: numQty,
      bookingSource: 'OFFICER_ASSISTED',
      assistedByOfficerId: officerId,
      assistedByOfficerName: officerName
    };
    const qrCodeDataUrl = await generateQRCode(qrPayload);

    const booking = await Bookings.create({
      _id: bookingId,
      bookingNumber,
      tokenNumber,
      farmerId: farmer.farmerId,
      userId: farmer.userId || farmer._id,
      farmerName: farmer.fullName,
      centerId,
      centerName: center.name,
      cropName,
      quantity: numQty,
      date,
      timeSlot,
      vehicleNumber: vehicleNumber || 'Farmer Transport',
      remarks: remarks || '',
      status: 'Confirmed',
      qrCodeDataUrl,
      // Assisted Booking Metadata
      bookingSource: 'OFFICER_ASSISTED',
      bookedByUserId: req.user.id,
      bookedByRole: req.user.role,
      assistedByOfficerId: officerId,
      assistedByOfficerName: officerName,
      farmerConsentConfirmed: true,
      consentMethod: 'OFFICER_ATTESTATION',
      consentTimestamp: new Date().toISOString(),
      overrideReason: overrideReason || '',
      timeline: [
        { stage: 'Booked', timestamp: new Date().toISOString(), done: true },
        { stage: 'Confirmed', timestamp: new Date().toISOString(), done: true },
        { stage: 'Checked In', timestamp: null, done: false },
        { stage: 'Quality Inspection', timestamp: null, done: false },
        { stage: 'Weight Verification', timestamp: null, done: false },
        { stage: 'Procurement Complete', timestamp: null, done: false },
        { stage: 'Payment Completed', timestamp: null, done: false }
      ],
      createdAt: new Date().toISOString()
    });

    // In-App Notification to Farmer
    await sendNotification({
      userId: farmer.userId || farmer._id,
      role: 'farmer',
      title: `Officer Assisted Token Generated: ${tokenNumber}`,
      message: `Your procurement slot for ${cropName} (${numQty} Q) at ${center.name} on ${date} (${timeSlot}) was booked with assistance from Officer ${officerName}. Token: ${tokenNumber}`,
      type: 'booking',
      metadata: { bookingNumber, tokenNumber, date, timeSlot, mobile: farmer.mobile, fullName: farmer.fullName }
    });

    // Immutable Audit Trail
    await AuditLogs.create({
      action: 'ASSISTED_BOOKING_CREATED',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      details: `Officer ${officerName} created assisted booking ${bookingNumber} (Token: ${tokenNumber}) for farmer ${farmer.fullName} (${farmer.farmerId}): ${cropName} ${numQty}Q at ${center.name} on ${date} (${timeSlot}).`,
      metadata: {
        bookingId,
        bookingNumber,
        tokenNumber,
        farmerId: farmer.farmerId,
        centerId,
        date,
        timeSlot,
        quantity: numQty,
        overrideReason: overrideReason || 'None'
      },
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    // Real-time broadcast to center officer desk
    emitToCenter(centerId, 'booking:created', {
      bookingNumber,
      tokenNumber,
      date,
      timeSlot,
      cropName,
      bookingSource: 'OFFICER_ASSISTED',
      farmerName: farmer.fullName
    });

    return res.status(201).json({
      success: true,
      message: `Token booking successful! Generated Token: ${tokenNumber}`,
      data: booking
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Assisted booking failed: ' + err.message });
  }
};

/**
 * Get Officer Assisted Bookings List & Statistics
 */
const getAssistedBookings = async (req, res) => {
  try {
    const { centerId, date, status, search } = req.query;
    const assignedCenter = req.user.assignedCenterId || 'CTR-01';

    let allBookings = await Bookings.find({
      $or: [
        { bookingSource: 'OFFICER_ASSISTED' },
        { assistedByOfficerId: { $exists: true, $ne: null } }
      ]
    });

    // Filter by center
    if (centerId && centerId !== 'ALL') {
      allBookings = allBookings.filter(b => b.centerId === centerId);
    }

    // Filter by date
    if (date) {
      allBookings = allBookings.filter(b => b.date === date);
    }

    // Filter by status
    if (status && status !== 'ALL') {
      allBookings = allBookings.filter(b => b.status === status);
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allBookings = allBookings.filter(b =>
        (b.tokenNumber && b.tokenNumber.toLowerCase().includes(q)) ||
        (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
        (b.farmerName && b.farmerName.toLowerCase().includes(q)) ||
        (b.farmerId && b.farmerId.toLowerCase().includes(q)) ||
        (b.cropName && b.cropName.toLowerCase().includes(q)) ||
        (b.centerName && b.centerName.toLowerCase().includes(q))
      );
    }

    const sorted = allBookings.reverse();
    const today = new Date().toISOString().split('T')[0];

    return res.json({
      success: true,
      count: sorted.length,
      metrics: {
        total: allBookings.length,
        today: allBookings.filter(b => b.date === today).length,
        pending: allBookings.filter(b => b.status === 'Confirmed' || b.status === 'Booked').length,
        completed: allBookings.filter(b => b.status === 'Completed' || b.status === 'Procurement Complete').length,
        cancelled: allBookings.filter(b => b.status === 'Cancelled').length
      },
      data: sorted
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Cancel Assisted Booking
 */
const cancelAssistedBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'A valid cancellation reason is mandatory.' });
    }

    const booking = await Bookings.findOne({
      $or: [{ _id: id }, { bookingNumber: id }, { tokenNumber: id }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    if (booking.status === 'Completed' || booking.status === 'Procurement Complete' || booking.status === 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already '${booking.status}'.`
      });
    }

    const updated = await Bookings.findByIdAndUpdate(booking._id, {
      status: 'Cancelled',
      cancelReason: reason.trim(),
      cancelledBy: req.user.id,
      cancelledByRole: req.user.role,
      cancelledAt: new Date().toISOString()
    });

    // Audit trail
    await AuditLogs.create({
      action: 'ASSISTED_BOOKING_CANCELLED',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      details: `Officer ${req.user.name} cancelled assisted booking ${booking.bookingNumber} (${booking.tokenNumber || ''}). Reason: ${reason.trim()}`,
      metadata: { bookingId: booking._id, bookingNumber: booking.bookingNumber, reason: reason.trim() },
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    // Notify farmer
    await sendNotification({
      userId: booking.userId,
      role: 'farmer',
      title: 'Assisted Booking Cancelled',
      message: `Your procurement slot ${booking.bookingNumber} was cancelled by officer ${req.user.name}. Reason: ${reason.trim()}`,
      type: 'booking'
    });

    return res.json({
      success: true,
      message: `Booking ${booking.bookingNumber} cancelled successfully.`,
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Post Mandi Public Announcement
 */
const postAnnouncement = async (req, res) => {
  try {
    const { title, message, category, priority } = req.body;
    const centerId = req.user.assignedCenterId || 'CTR-01';

    const announcement = await Announcements.create({
      title,
      message,
      category: category || 'Operations',
      priority: priority || 'Medium',
      centerId,
      createdBy: req.user.name,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    emitToCenter(centerId, 'announcement:new', announcement);

    return res.status(201).json({
      success: true,
      message: 'Announcement broadcasted to Mandi screens and farmer apps!',
      data: announcement
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Center Inventory
 */
const getInventory = async (req, res) => {
  try {
    const centerId = req.query.centerId || req.user.assignedCenterId || 'CTR-01';
    const inventory = await Inventory.find({ centerId });
    return res.json({ success: true, data: inventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Pending Bookings for Gate Check-in
 */
const getPendingBookings = async (req, res) => {
  try {
    const centerId = req.query.centerId || (req.user && req.user.assignedCenterId) || 'CTR-01';
    const allBookings = await Bookings.find({ centerId });
    const existingQueues = await Queues.find({
      centerId,
      status: { $in: ['waiting', 'called', 'processing', 'completed'] }
    });
    const checkedInBkgNos = new Set(existingQueues.map(q => q.bookingNumber));

    // Pending bookings that haven't been checked in yet
    const pending = allBookings.filter(b => b.status !== 'Cancelled' && !checkedInBkgNos.has(b.bookingNumber));

    return res.json({
      success: true,
      centerId,
      count: pending.length,
      data: pending
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getOfficerDashboard,
  searchFarmers,
  createAssistedFarmerRegistration,
  createAssistedBooking,
  getAssistedBookings,
  cancelAssistedBooking,
  postAnnouncement,
  getInventory,
  getPendingBookings
};

