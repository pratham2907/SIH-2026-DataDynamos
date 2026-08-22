const {
  Payments, Farmers, Centers, Complaints, AuditLogs, generateId
} = require('../models/dbStore');
const { sendNotification } = require('../services/notificationService');

/**
 * Get Logged-in Farmer Payments
 */
const getFarmerPayments = async (req, res) => {
  try {
    const farmer = await Farmers.findById(req.user.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    }

    const payments = await Payments.find({ farmerId: farmer.farmerId });

    const totalEarned = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status !== 'Completed' && p.status !== 'Rejected').reduce((sum, p) => sum + p.amount, 0);

    return res.json({
      success: true,
      stats: {
        totalEarned,
        pendingAmount,
        completedCount: payments.filter(p => p.status === 'Completed').length,
        pendingCount: payments.filter(p => p.status !== 'Completed').length
      },
      payments: payments.reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get All Payments (Admin / Officer portal)
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, centerId } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (centerId && centerId !== 'all') query.centerId = centerId;

    const payments = await Payments.find(query);
    return res.json({
      success: true,
      totalCount: payments.length,
      totalValue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      data: payments.reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Officer / Admin: Approve Payment
 */
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const payment = await Payments.findOne({
      $or: [{ _id: id }, { paymentId: id }]
    });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const timeline = payment.timeline || [];
    const appIdx = timeline.findIndex(t => t.stage === 'Approved');
    if (appIdx !== -1) {
      timeline[appIdx].done = true;
      timeline[appIdx].timestamp = new Date().toISOString();
    }

    const updated = await Payments.findByIdAndUpdate(payment._id, {
      status: 'Approved',
      approvedBy: req.user.name,
      approvalRemarks: remarks || 'Documents & weighbridge verified',
      timeline
    });

    const farmer = await Farmers.findOne({ farmerId: payment.farmerId });
    if (farmer) {
      await sendNotification({
        userId: farmer.userId || farmer._id,
        role: 'farmer',
        title: 'Payment Approved by Officer',
        message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} (Voucher ${payment.receiptNumber}) has been approved for treasury release.`,
        type: 'payment'
      });
    }

    return res.json({ success: true, message: 'Payment approved successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Super Admin: Release Direct Benefit Transfer (DBT) Funds
 */
const releasePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payments.findOne({
      $or: [{ _id: id }, { paymentId: id }]
    });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const timeline = (payment.timeline || []).map(t => {
      t.done = true;
      if (!t.timestamp) t.timestamp = new Date().toISOString();
      return t;
    });

    const updated = await Payments.findByIdAndUpdate(payment._id, {
      status: 'Completed',
      releasedBy: req.user.name,
      paymentDate: new Date().toISOString().split('T')[0],
      timeline
    });

    const farmer = await Farmers.findOne({ farmerId: payment.farmerId });
    if (farmer) {
      await sendNotification({
        userId: farmer.userId || farmer._id,
        role: 'farmer',
        title: 'DBT Payment Transferred to Bank Account',
        message: `₹${payment.amount.toLocaleString('en-IN')} successfully credited to your ${farmer.bankName} account (UTR: ${payment.utrNumber}).`,
        type: 'payment',
        metadata: { utr: payment.utrNumber, amount: payment.amount, mobile: farmer.mobile, email: farmer.email }
      });
    }

    // Audit Log
    await AuditLogs.create({
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'PAYMENT_RELEASED',
      details: `Released DBT payout of ₹${payment.amount} for Farmer ${payment.farmerId} (UTR: ${payment.utrNumber})`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `DBT Payment of ₹${payment.amount} released successfully! UTR: ${payment.utrNumber}`,
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Raise Payment Delay Grievance / Complaint
 */
const raisePaymentComplaint = async (req, res) => {
  try {
    const { paymentId, receiptNumber, subject, description } = req.body;
    const farmer = await Farmers.findById(req.user.id);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer profile not found' });

    const complaintId = `CMP-${Date.now().toString().slice(-6)}`;

    const newComplaint = await Complaints.create({
      complaintId,
      farmerId: farmer.farmerId,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobile,
      category: 'Payment Delay / DBT Issue',
      paymentId: paymentId || '',
      receiptNumber: receiptNumber || '',
      subject: subject || 'Payment Not Received in Account',
      description: description || 'Procurement done but DBT credit pending.',
      status: 'Open',
      createdAt: new Date().toISOString(),
      timeline: [
        { stage: 'Submitted', timestamp: new Date().toISOString(), note: 'Grievance registered in KPMS system.' }
      ]
    });

    await sendNotification({
      userId: req.user.id,
      role: 'farmer',
      title: 'Complaint Registered',
      message: `Your grievance ${complaintId} has been escalated to the District Agri Grievance Officer.`,
      type: 'complaint'
    });

    return res.status(201).json({
      success: true,
      message: `Grievance ticket ${complaintId} raised successfully!`,
      data: newComplaint
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getFarmerPayments,
  getAllPayments,
  approvePayment,
  releasePayment,
  raisePaymentComplaint
};
