const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Controllers
const authCtrl = require('../controllers/authController');
const farmerCtrl = require('../controllers/farmerController');
const bookingCtrl = require('../controllers/bookingController');
const queueCtrl = require('../controllers/queueController');
const procurementCtrl = require('../controllers/procurementController');
const paymentCtrl = require('../controllers/paymentController');
const officerCtrl = require('../controllers/officerController');
const adminCtrl = require('../controllers/adminController');
const aiCtrl = require('../controllers/aiController');
const demoCtrl = require('../controllers/demoController');
const mandiPriceCtrl = require('../controllers/mandiPriceController');
const emailCtrl = require('../controllers/emailController');

// ----------------------------------------------------
// 1. AUTHENTICATION & KYC ROUTES
// ----------------------------------------------------
router.post('/auth/register', upload.any(), authCtrl.registerFarmer);
router.post('/auth/verify-otp', authCtrl.verifyOTP);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', verifyToken, authCtrl.getMe);
router.post('/auth/reset-password', authCtrl.resetPassword);

// ----------------------------------------------------
// 2. FARMER PORTAL ROUTES
// ----------------------------------------------------
router.get('/farmer/dashboard', verifyToken, requireRole('farmer', 'admin'), farmerCtrl.getDashboardSummary);
router.get('/farmer/profile', verifyToken, farmerCtrl.getProfile);
router.put('/farmer/profile', verifyToken, farmerCtrl.updateProfile);
router.post('/farmer/documents', verifyToken, upload.single('document'), farmerCtrl.uploadDocument);
router.delete('/farmer/documents/:docId', verifyToken, farmerCtrl.deleteDocument);

// Farms CRUD
router.get('/farmer/farms', verifyToken, farmerCtrl.getFarms);
router.post('/farmer/farms', verifyToken, farmerCtrl.addFarm);
router.put('/farmer/farms/:id', verifyToken, farmerCtrl.updateFarm);
router.delete('/farmer/farms/:id', verifyToken, farmerCtrl.deleteFarm);

// Crops CRUD
router.get('/farmer/crops', verifyToken, farmerCtrl.getCrops);
router.post('/farmer/crops', verifyToken, farmerCtrl.addCrop);
router.put('/farmer/crops/:id', verifyToken, farmerCtrl.updateCrop);
router.delete('/farmer/crops/:id', verifyToken, farmerCtrl.deleteCrop);

// Notifications
router.get('/farmer/notifications', verifyToken, farmerCtrl.getNotifications);
router.patch('/farmer/notifications/read', verifyToken, farmerCtrl.markNotificationsRead);
router.delete('/farmer/notifications/:id', verifyToken, farmerCtrl.deleteNotification);

// ----------------------------------------------------
// 3. SMART SLOT BOOKING ROUTES
// ----------------------------------------------------
router.get('/bookings/centers', bookingCtrl.getCenters);
router.get('/bookings/slots', bookingCtrl.getAvailableSlots);
router.post('/bookings/book-slot', verifyToken, bookingCtrl.bookSlot);
router.get('/bookings/my-bookings', verifyToken, bookingCtrl.getMyBookings);
router.get('/bookings/:id', verifyToken, bookingCtrl.getBookingById);
router.put('/bookings/:id/reschedule', verifyToken, bookingCtrl.rescheduleBooking);
router.delete('/bookings/:id/cancel', verifyToken, bookingCtrl.cancelBooking);
router.get('/bookings/:id/pdf', bookingCtrl.downloadBookingPDF);

// ----------------------------------------------------
// 4. REAL-TIME QUEUE & QR CHECK-IN ROUTES
// ----------------------------------------------------
router.post('/queue/check-in', verifyToken, queueCtrl.checkIn);
router.get('/queue/live', verifyToken, queueCtrl.getLiveQueue);
router.get('/queue/farmer-status', verifyToken, queueCtrl.getFarmerQueueStatus);
router.post('/queue/call-next', verifyToken, requireRole('officer', 'admin'), queueCtrl.callNext);
router.post('/queue/start', verifyToken, requireRole('officer', 'admin'), queueCtrl.startProcessing);
router.post('/queue/complete', verifyToken, requireRole('officer', 'admin'), queueCtrl.completeToken);
router.post('/queue/skip', verifyToken, requireRole('officer', 'admin'), queueCtrl.skipToken);
router.post('/queue/recall', verifyToken, requireRole('officer', 'admin'), queueCtrl.recallToken);
router.get('/queue/display-board', queueCtrl.getDisplayBoardData); // Public TV Display screen

// ----------------------------------------------------
// 5. PROCUREMENT WORKFLOW & WEIGHBRIDGE ROUTES
// ----------------------------------------------------
router.get('/procurement/context', verifyToken, procurementCtrl.getProcurementContext);
router.post('/procurement/accept', verifyToken, requireRole('officer', 'admin'), procurementCtrl.acceptProcurement);
router.post('/procurement/reject', verifyToken, requireRole('officer', 'admin'), procurementCtrl.rejectProcurement);
router.get('/procurement/history', verifyToken, procurementCtrl.getProcurementHistory);
router.get('/procurement/:id/receipt-pdf', procurementCtrl.downloadReceiptPDF);

// ----------------------------------------------------
// 6. PAYMENT MANAGEMENT & GRIEVANCE ROUTES
// ----------------------------------------------------
router.get('/payments/farmer', verifyToken, paymentCtrl.getFarmerPayments);
router.get('/payments/all', verifyToken, requireRole('officer', 'admin'), paymentCtrl.getAllPayments);
router.post('/payments/:id/approve', verifyToken, requireRole('officer', 'admin'), paymentCtrl.approvePayment);
router.post('/payments/:id/release', verifyToken, requireRole('admin'), paymentCtrl.releasePayment);
router.post('/payments/complaint', verifyToken, paymentCtrl.raisePaymentComplaint);

// ----------------------------------------------------
// 7. OFFICER PORTAL ROUTES
// ----------------------------------------------------
router.get('/officer/dashboard', verifyToken, requireRole('officer', 'admin'), officerCtrl.getOfficerDashboard);
router.get('/officer/farmers/search', verifyToken, requireRole('officer', 'admin'), officerCtrl.searchFarmers);
router.post('/officer/announcements', verifyToken, requireRole('officer', 'admin'), officerCtrl.postAnnouncement);
router.get('/officer/inventory', verifyToken, requireRole('officer', 'admin'), officerCtrl.getInventory);

// ----------------------------------------------------
// 8. SUPER ADMIN & GOVERNMENT CONTROL ROUTES
// ----------------------------------------------------
router.get('/admin/dashboard', verifyToken, requireRole('admin'), adminCtrl.getGovernmentDashboard);
router.get('/admin/map-data', adminCtrl.getNationalMapData); // Accessible for national live map
router.post('/admin/centers', verifyToken, requireRole('admin'), adminCtrl.createCenter);
router.put('/admin/centers/:id', verifyToken, requireRole('admin'), adminCtrl.updateCenter);
router.delete('/admin/centers/:id', verifyToken, requireRole('admin'), adminCtrl.deleteCenter);
router.get('/admin/officers', verifyToken, requireRole('admin'), adminCtrl.getOfficers);
router.post('/admin/officers', verifyToken, requireRole('admin'), adminCtrl.createOfficer);
router.put('/admin/farmers/:farmerId/moderate', verifyToken, requireRole('admin'), adminCtrl.moderateFarmer);
router.get('/admin/analytics', verifyToken, requireRole('admin'), adminCtrl.getSystemAnalytics);
router.get('/admin/audit-logs', verifyToken, requireRole('admin'), adminCtrl.getAuditLogs);
router.post('/admin/backup', verifyToken, requireRole('admin'), adminCtrl.backupDatabase);

// ----------------------------------------------------
// 9. AI, RECOMMENDATION & CHATBOT ROUTES
// ----------------------------------------------------
router.get('/ai/dashboard', aiCtrl.getAIDashboard);
router.get('/ai/recommendations', aiCtrl.getSlotRecommendations);
router.post('/ai/chat', aiCtrl.chatWithAI);
router.post('/ai/voice', aiCtrl.handleVoiceIntent);

// ----------------------------------------------------
// 10. DEMO & SIH SIMULATION ROUTES
// ----------------------------------------------------
router.post('/demo/reset', demoCtrl.resetDemo);
router.post('/demo/simulate', demoCtrl.simulateLiveCycle);

// ----------------------------------------------------
// 11. NEARBY MANDI PRICES & LEAFLET GEOSPATIAL ROUTES
// ----------------------------------------------------
router.get('/mandi-prices/commodities', mandiPriceCtrl.getCommoditiesList);
router.get('/mandi-prices', mandiPriceCtrl.getNearbyMandiPrices);

// ----------------------------------------------------
// 12. BREVO TRANSACTIONAL EMAIL ROUTES
// ----------------------------------------------------
router.get('/email/status', emailCtrl.getEmailConfigStatus);
router.post('/email/send-test', emailCtrl.sendTestEmail);
router.post('/email/send', emailCtrl.sendCustomEmailEndpoint);

module.exports = router;
