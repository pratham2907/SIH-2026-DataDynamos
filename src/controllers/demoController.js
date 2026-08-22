const { seedDemoData } = require('../services/demoService');
const { Queues, Bookings, Procurements, Payments, Farmers, Centers } = require('../models/dbStore');
const { emitToCenter } = require('../services/socketService');

/**
 * 1-Click SIH Hackathon Demo Reset
 */
const resetDemo = async (req, res) => {
  try {
    await seedDemoData(true);
    return res.json({
      success: true,
      message: 'Demo dataset successfully refreshed with realistic Farmers, Officers, Mandis, Bookings, and Live Queues!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset demo', error: err.message });
  }
};

/**
 * Live SIH Hackathon Procurement Simulation Engine
 */
const simulateLiveCycle = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const farmer = await Farmers.findOne({ farmerId: 'FARM000003' }) || await Farmers.findOne({});
    const center = await Centers.findOne({ centerId: 'CTR-01' }) || await Centers.findOne({});

    // 1. Create simulated booking
    const bkgNo = `BKG-SIM-${Date.now().toString().slice(-4)}`;
    const booking = await Bookings.create({
      bookingNumber: bkgNo,
      farmerId: farmer.farmerId,
      userId: farmer.userId || farmer._id,
      farmerName: farmer.fullName,
      centerId: center.centerId,
      centerName: center.name,
      cropName: 'Wheat (Sharbati)',
      quantity: 45,
      date: today,
      timeSlot: '11:00 AM - 11:30 AM',
      status: 'Confirmed',
      timeline: [{ stage: 'Booked', timestamp: new Date().toISOString(), done: true }]
    });

    // 2. Simulate Check-In & Token A099
    const queueEntry = await Queues.create({
      tokenNumber: 'A099',
      bookingId: booking._id,
      bookingNumber: bkgNo,
      farmerId: farmer.farmerId,
      farmerName: farmer.fullName,
      centerId: center.centerId,
      counterNumber: 'Counter 1',
      status: 'waiting',
      checkInTime: new Date().toISOString(),
      cropName: 'Wheat (Sharbati)',
      quantity: 45
    });

    emitToCenter(center.centerId, 'queue:new_token', {
      tokenNumber: 'A099',
      farmerName: farmer.fullName,
      assignedCounter: 'Counter 1'
    });

    return res.json({
      success: true,
      message: 'Simulation initialized: Booking created & Token A099 checked in!',
      data: {
        bookingNumber: bkgNo,
        tokenNumber: 'A099',
        farmer: farmer.fullName,
        center: center.name
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  resetDemo,
  simulateLiveCycle
};
