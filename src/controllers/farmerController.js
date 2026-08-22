const {
  Farmers, Farms, Crops, Bookings, Queues, Payments, Notifications, generateId
} = require('../models/dbStore');

const getFarmerRecord = async (user) => {
  if (!user) return null;
  let farmer = await Farmers.findById(user.id);
  if (!farmer) {
    farmer = await Farmers.findOne({
      $or: [
        { _id: user.id },
        { userId: user.id },
        { farmerId: user.farmerId || user.id },
        { email: user.email },
        { mobile: user.mobile }
      ]
    });
  }
  return farmer;
};

/**
 * Get Farmer Dashboard Overview
 */
const getDashboardSummary = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    }

    const userId = req.user.id;
    const farmerId = farmer.farmerId;
    const today = new Date().toISOString().split('T')[0];

    // Upcoming or active bookings
    const bookings = await Bookings.find({ farmerId });
    const activeBooking = bookings.find(b => b.status !== 'Completed' && b.status !== 'Cancelled') || null;

    // Live Queue Token
    const queueEntry = await Queues.findOne({
      farmerId,
      status: { $in: ['waiting', 'called', 'processing'] }
    });

    // Payments summary
    const payments = await Payments.find({ farmerId });
    const totalEarnings = payments
      .filter(p => p.status === 'Completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingEarnings = payments
      .filter(p => p.status !== 'Completed' && p.status !== 'Rejected')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Crops & Farms count
    const farmsCount = await Farms.countDocuments({ farmerId });
    const cropsList = await Crops.find({ farmerId });

    // Unread notifications count
    const unreadNotifs = await Notifications.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      data: {
        farmer,
        activeBooking,
        queueEntry,
        stats: {
          totalBookings: bookings.length,
          totalEarnings,
          pendingEarnings,
          farmsCount,
          registeredCrops: cropsList.length,
          unreadNotifications: unreadNotifs
        },
        recentBookings: bookings.slice(-5).reverse(),
        recentPayments: payments.slice(-5).reverse()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Profile CRUD
 */
const getProfile = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });
    return res.json({ success: true, data: farmer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });
    const updated = await Farmers.findByIdAndUpdate(farmer._id || farmer.id, { $set: req.body });
    return res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Documents CRUD
 */
const uploadDocument = async (req, res) => {
  try {
    const { docType } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const farmer = await getFarmerRecord(req.user);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    const newDoc = {
      id: generateId('doc_'),
      docType: docType || 'Supporting Document',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      status: 'Pending',
      uploadDate: new Date().toISOString().split('T')[0]
    };

    const docs = farmer.documents || [];
    docs.push(newDoc);
    await Farmers.findByIdAndUpdate(farmer._id || farmer.id, { documents: docs });

    return res.json({ success: true, message: 'Document uploaded successfully', document: newDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const farmer = await getFarmerRecord(req.user);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });
    const docs = (farmer.documents || []).filter(d => d.id !== docId && d._id !== docId);
    await Farmers.findByIdAndUpdate(farmer._id || farmer.id, { documents: docs });
    return res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Multi-Farms CRUD
 */
const getFarms = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    const farmerId = farmer ? farmer.farmerId : 'FARM000001';
    let farms = await Farms.find({ farmerId });

    // Seed default farm if empty for demo farmer
    if (farms.length === 0 && farmer) {
      const defaultFarm = await Farms.create({
        farmerId: farmer.farmerId,
        farmName: `${farmer.fullName || 'Ramesh'}'s Main Acre`,
        surveyNumber: 'SRV-894/2',
        area: farmer.totalLandArea || 5.0,
        village: farmer.village || 'Ratibad',
        crop: farmer.primaryCrop || 'Wheat (Sharbati)',
        estimatedQuantity: farmer.estimatedQuantity || 50,
        procurementCenter: farmer.preferredCenterId || 'CTR-01'
      });
      farms = [defaultFarm];
    }

    return res.json({ success: true, data: farms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addFarm = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    const farm = await Farms.create({
      farmerId: farmer ? farmer.farmerId : 'FARM000001',
      ...req.body
    });
    return res.status(201).json({ success: true, message: 'Farm added successfully', data: farm });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateFarm = async (req, res) => {
  try {
    const updated = await Farms.findByIdAndUpdate(req.params.id, { $set: req.body });
    return res.json({ success: true, message: 'Farm updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFarm = async (req, res) => {
  try {
    await Farms.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Farm deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Multi-Crops CRUD
 */
const getCrops = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    const farmerId = farmer ? farmer.farmerId : 'FARM000001';
    let crops = await Crops.find({ farmerId });

    // Seed default crops if empty
    if (crops.length === 0 && farmer) {
      const defaultCrop = await Crops.create({
        farmerId: farmer.farmerId,
        cropName: farmer.primaryCrop || 'Wheat (Sharbati)',
        season: 'Rabi 2025-26',
        quantity: farmer.estimatedQuantity || 50,
        expectedHarvestDate: '2026-08-25',
        supportPrice: 2275,
        status: 'Active'
      });
      crops = [defaultCrop];
    }

    return res.json({ success: true, data: crops });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addCrop = async (req, res) => {
  try {
    const farmer = await getFarmerRecord(req.user);
    const crop = await Crops.create({
      farmerId: farmer ? farmer.farmerId : 'FARM000001',
      status: 'Active',
      ...req.body
    });
    return res.status(201).json({ success: true, message: 'Crop registered successfully', data: crop });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateCrop = async (req, res) => {
  try {
    const updated = await Crops.findByIdAndUpdate(req.params.id, { $set: req.body });
    return res.json({ success: true, message: 'Crop details updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCrop = async (req, res) => {
  try {
    await Crops.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Crop removed' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * In-App Notifications
 */
const getNotifications = async (req, res) => {
  try {
    const notifs = await Notifications.find({
      $or: [{ userId: req.user.id }, { role: req.user.role }, { role: 'all' }]
    });
    return res.json({ success: true, data: notifs.reverse() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await Notifications.updateMany({ userId: req.user.id }, { $set: { isRead: true } });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await Notifications.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardSummary,
  getProfile,
  updateProfile,
  uploadDocument,
  deleteDocument,
  getFarms,
  addFarm,
  updateFarm,
  deleteFarm,
  getCrops,
  addCrop,
  updateCrop,
  deleteCrop,
  getNotifications,
  markNotificationsRead,
  deleteNotification
};
