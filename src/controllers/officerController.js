const {
  Centers, Queues, Bookings, Farmers, Procurements, Payments, Inventory, Announcements, Users
} = require('../models/dbStore');
const { predictWaitTime } = require('../services/aiService');
const { emitToCenter } = require('../services/socketService');

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
        congestionLevel: waitEst.congestionLevel
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
 * Universal Farmer Search for Officers
 */
const searchFarmers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      const all = await Farmers.find({});
      return res.json({ success: true, data: all.slice(0, 15) });
    }

    const queryStr = q.trim();
    const farmers = await Farmers.find({
      $or: [
        { fullName: { $regex: queryStr, $options: 'i' } },
        { farmerId: { $regex: queryStr, $options: 'i' } },
        { mobile: { $regex: queryStr } },
        { aadhaarNumber: { $regex: queryStr } },
        { village: { $regex: queryStr, $options: 'i' } }
      ]
    });

    return res.json({ success: true, data: farmers });
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

module.exports = {
  getOfficerDashboard,
  searchFarmers,
  postAnnouncement,
  getInventory
};
