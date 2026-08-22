const {
  Queues, Bookings, Farmers, Centers, Users, AuditLogs, generateId
} = require('../models/dbStore');
const { predictWaitTime } = require('../services/aiService');
const { sendNotification } = require('../services/notificationService');
const { emitToCenter, emitToFarmer, emitToAll } = require('../services/socketService');

/**
 * QR Scanner / Gate Check-in
 */
const checkIn = async (req, res) => {
  try {
    const { qrData, bookingNumber, centerId, isPriority, priorityReason } = req.body;
    let bkgNo = bookingNumber;

    if (qrData) {
      try {
        const parsed = typeof qrData === 'object' ? qrData : JSON.parse(qrData);
        bkgNo = parsed.bookingNumber || parsed.bookingId;
      } catch (e) {
        bkgNo = qrData;
      }
    }

    if (!bkgNo) {
      return res.status(400).json({ success: false, message: 'Valid QR data or Booking Number is required' });
    }

    const booking = await Bookings.findOne({
      $or: [{ bookingNumber: bkgNo }, { _id: bkgNo }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid QR / Booking record not found in system.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This booking has been cancelled.' });
    }

    // Check if already checked in
    const existingQueue = await Queues.findOne({
      bookingNumber: booking.bookingNumber,
      status: { $in: ['waiting', 'called', 'processing', 'completed'] }
    });

    if (existingQueue) {
      return res.status(400).json({
        success: false,
        message: `Farmer has already checked in with Token ${existingQueue.tokenNumber} (Status: ${existingQueue.status.toUpperCase()}).`,
        token: existingQueue
      });
    }

    const farmer = await Farmers.findOne({ farmerId: booking.farmerId }) || { fullName: booking.farmerName, mobile: '' };
    const center = await Centers.findOne({ centerId: booking.centerId }) || { countersCount: 4, name: 'APMC Mandi' };

    // Generate daily running token (e.g. A001, A002...)
    const today = new Date().toISOString().split('T')[0];
    const todayQueuesCount = await Queues.countDocuments({ centerId: booking.centerId });
    const tokenPrefix = booking.centerId ? booking.centerId.replace('CTR-', 'A') : 'A';
    const tokenNumber = `${tokenPrefix}${String(todayQueuesCount + 1).padStart(3, '0')}`;

    // Auto assign counter (e.g. Counter 1, Counter 2..)
    const counterIndex = (todayQueuesCount % (center.countersCount || 4)) + 1;
    const assignedCounter = `Counter ${counterIndex}`;

    // Priority category check
    const isPrio = isPriority === true || isPriority === 'true' || !!farmer.isPriorityCategory;
    const prioReason = priorityReason || farmer.priorityReason || (isPrio ? 'Special Priority' : '');

    const newQueueEntry = await Queues.create({
      tokenNumber,
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      farmerId: booking.farmerId,
      farmerName: farmer.fullName || booking.farmerName,
      centerId: booking.centerId,
      counterNumber: assignedCounter,
      officerId: req.user ? req.user.officerId : null,
      status: 'waiting',
      checkInTime: new Date().toISOString(),
      isPriority: isPrio,
      priorityReason: prioReason,
      cropName: booking.cropName,
      quantity: booking.quantity
    });

    // Update Booking status & timeline
    const timeline = booking.timeline || [];
    const checkinIdx = timeline.findIndex(t => t.stage === 'Checked In');
    if (checkinIdx !== -1) {
      timeline[checkinIdx].done = true;
      timeline[checkinIdx].timestamp = new Date().toISOString();
    }
    await Bookings.findByIdAndUpdate(booking._id, { status: 'Checked In', timeline });

    // Calculate dynamic wait estimation
    const waitEst = await predictWaitTime(booking.centerId);

    // Notify farmer
    await sendNotification({
      userId: booking.userId,
      role: 'farmer',
      title: `Gate Check-In Successful: Token ${tokenNumber}`,
      message: `You are checked in at ${center.name}. Your Token is ${tokenNumber} (${assignedCounter}). Estimated Wait: ${waitEst.estimatedWaitMinutes} mins.`,
      type: 'queue',
      metadata: { tokenNumber, assignedCounter, mobile: farmer.mobile }
    });

    // Emit live real-time events to all displays and dashboards
    emitToCenter(booking.centerId, 'queue:new_token', {
      tokenNumber,
      farmerName: farmer.fullName,
      assignedCounter,
      status: 'waiting',
      crop: booking.cropName
    });

    return res.status(201).json({
      success: true,
      message: `Check-in successful! Token ${tokenNumber} generated.`,
      data: {
        tokenNumber,
        assignedCounter,
        farmerName: farmer.fullName,
        cropName: booking.cropName,
        quantity: booking.quantity,
        estimatedWait: `${waitEst.estimatedWaitMinutes} minutes`,
        checkInTime: new Date().toLocaleTimeString('en-IN')
      }
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ success: false, message: 'Check-in failed', error: err.message });
  }
};

/**
 * Get Live Queue List for an Officer / Center
 */
const getLiveQueue = async (req, res) => {
  try {
    const centerId = req.query.centerId || (req.user && req.user.assignedCenterId) || 'CTR-01';
    const queues = await Queues.find({ centerId });
    const waitEst = await predictWaitTime(centerId);

    return res.json({
      success: true,
      centerId,
      stats: {
        totalToday: queues.length,
        waiting: queues.filter(q => q.status === 'waiting').length,
        called: queues.filter(q => q.status === 'called').length,
        processing: queues.filter(q => q.status === 'processing').length,
        completed: queues.filter(q => q.status === 'completed').length,
        skipped: queues.filter(q => q.status === 'skipped').length,
        estimatedWait: `${waitEst.estimatedWaitMinutes} mins`,
        congestionLevel: waitEst.congestionLevel
      },
      queues: queues.reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Farmer's Current Live Queue Status
 */
const getFarmerQueueStatus = async (req, res) => {
  try {
    const farmer = await Farmers.findById(req.user.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    }

    const myActiveQueue = await Queues.findOne({
      farmerId: farmer.farmerId,
      status: { $in: ['waiting', 'called', 'processing'] }
    });

    if (!myActiveQueue) {
      return res.json({
        success: true,
        hasActiveQueue: false,
        message: 'No active queue token found for today.'
      });
    }

    // Calculate farmers ahead
    const centerId = myActiveQueue.centerId;
    const allWaiting = await Queues.find({ centerId, status: 'waiting' });
    const myIndex = allWaiting.findIndex(q => q._id === myActiveQueue._id || q.tokenNumber === myActiveQueue.tokenNumber);
    const farmersAhead = myIndex >= 0 ? myIndex : 0;

    // Currently serving token
    const currentlyServing = await Queues.findOne({
      centerId,
      status: { $in: ['called', 'processing'] }
    });

    const waitEst = await predictWaitTime(centerId);

    return res.json({
      success: true,
      hasActiveQueue: true,
      queue: myActiveQueue,
      farmersAhead,
      currentlyServingToken: currentlyServing ? currentlyServing.tokenNumber : 'None',
      currentlyServingCounter: currentlyServing ? currentlyServing.counterNumber : '-',
      estimatedWaitMinutes: Math.max(5, (farmersAhead + 1) * 10),
      congestionLevel: waitEst.congestionLevel
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Officer Action: Call Next Farmer
 */
const callNext = async (req, res) => {
  try {
    const { centerId, counterNumber } = req.body;
    const activeCenterId = centerId || req.user.assignedCenterId || 'CTR-01';
    const activeCounter = counterNumber || req.user.assignedCounter || 'Counter 1';

    // Find first priority waiting, otherwise first waiting
    const waitingTokens = await Queues.find({ centerId: activeCenterId, status: 'waiting' });
    if (waitingTokens.length === 0) {
      return res.status(404).json({ success: false, message: 'No waiting farmers in queue.' });
    }

    // Priority sort: priority farmers first
    waitingTokens.sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
    const targetToken = waitingTokens[0];

    const updated = await Queues.findByIdAndUpdate(targetToken._id, {
      status: 'called',
      counterNumber: activeCounter,
      officerId: req.user ? req.user.officerId : 'OFF-01',
      calledTime: new Date().toISOString()
    });

    // Notify farmer
    const booking = await Bookings.findById(targetToken.bookingId);
    if (booking) {
      await sendNotification({
        userId: booking.userId,
        role: 'farmer',
        title: `Your Turn! Proceed to ${activeCounter}`,
        message: `Token ${targetToken.tokenNumber}: Please proceed immediately to ${activeCounter} for quality inspection.`,
        type: 'queue'
      });
    }

    // Emit live sound chime & screen announcement
    emitToCenter(activeCenterId, 'queue:called', {
      tokenNumber: targetToken.tokenNumber,
      farmerName: targetToken.farmerName,
      counterNumber: activeCounter
    });

    return res.json({
      success: true,
      message: `Token ${targetToken.tokenNumber} called to ${activeCounter}!`,
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Officer Action: Start Processing
 */
const startProcessing = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await Queues.findById(tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });

    const updated = await Queues.findByIdAndUpdate(tokenId, {
      status: 'processing',
      startTime: new Date().toISOString()
    });

    emitToCenter(token.centerId, 'queue:processing', { tokenNumber: token.tokenNumber });

    return res.json({ success: true, message: `Processing started for Token ${token.tokenNumber}`, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Officer Action: Complete
 */
const completeToken = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await Queues.findById(tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });

    const updated = await Queues.findByIdAndUpdate(tokenId, {
      status: 'completed',
      completionTime: new Date().toISOString()
    });

    emitToCenter(token.centerId, 'queue:completed', { tokenNumber: token.tokenNumber });

    return res.json({ success: true, message: `Token ${token.tokenNumber} marked completed`, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Officer Action: Skip
 */
const skipToken = async (req, res) => {
  try {
    const { tokenId, reason } = req.body;
    const token = await Queues.findById(tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });

    const updated = await Queues.findByIdAndUpdate(tokenId, {
      status: 'skipped',
      skipReason: reason || 'Farmer not present at counter',
      skippedTime: new Date().toISOString()
    });

    emitToCenter(token.centerId, 'queue:skipped', { tokenNumber: token.tokenNumber });

    return res.json({ success: true, message: `Token ${token.tokenNumber} moved to skipped list`, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Officer Action: Recall
 */
const recallToken = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await Queues.findById(tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });

    const updated = await Queues.findByIdAndUpdate(tokenId, {
      status: 'waiting',
      recalledTime: new Date().toISOString()
    });

    emitToCenter(token.centerId, 'queue:recalled', { tokenNumber: token.tokenNumber });

    return res.json({ success: true, message: `Token ${token.tokenNumber} recalled into active queue!`, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Fullscreen Digital Display Board Data
 */
const getDisplayBoardData = async (req, res) => {
  try {
    const centerId = req.query.centerId || 'CTR-01';
    const center = await Centers.findOne({ centerId }) || { name: 'APMC Mandi Central' };

    const queues = await Queues.find({ centerId });
    const currentlyServing = queues.filter(q => q.status === 'called' || q.status === 'processing');
    const waitingTokens = queues.filter(q => q.status === 'waiting').slice(0, 10);
    const completedCount = queues.filter(q => q.status === 'completed').length;

    const waitEst = await predictWaitTime(centerId);

    return res.json({
      success: true,
      center,
      currentlyServing,
      nextInLine: waitingTokens,
      stats: {
        totalCheckedIn: queues.length,
        waitingCount: waitingTokens.length,
        completedCount,
        averageWait: `${waitEst.estimatedWaitMinutes} Mins`
      },
      currentTime: new Date().toLocaleTimeString('en-IN')
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  checkIn,
  getLiveQueue,
  getFarmerQueueStatus,
  callNext,
  startProcessing,
  completeToken,
  skipToken,
  recallToken,
  getDisplayBoardData
};
