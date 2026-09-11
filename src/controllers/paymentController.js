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

/**
 * ----------------------------------------------------
 * RAZORPAY TEST GATEWAY INTEGRATION
 * ----------------------------------------------------
 */
const razorpayService = require('../services/razorpayService');

/**
 * Get Public Razorpay Configuration (Key ID for frontend checkout)
 */
const getRazorpayConfig = (req, res) => {
  return res.json({
    success: true,
    data: razorpayService.getPublicConfig()
  });
};

/**
 * Create a Razorpay Order
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const { paymentId, amount, notes = {} } = req.body;

    let targetPayment = null;
    if (paymentId) {
      targetPayment = await Payments.findOne({
        $or: [{ _id: paymentId }, { paymentId: paymentId }]
      });
    }

    const orderAmount = targetPayment ? targetPayment.amount : (Number(amount) || 100);
    const receiptId = targetPayment ? (targetPayment.receiptNumber || targetPayment.paymentId) : `order_${Date.now().toString().slice(-8)}`;

    const order = await razorpayService.createOrder({
      amount: orderAmount,
      receipt: receiptId,
      notes: {
        paymentId: targetPayment ? targetPayment.paymentId : 'DEMO',
        farmerId: targetPayment ? targetPayment.farmerId : (req.user ? req.user.id : 'GUEST'),
        ...notes
      }
    });

    if (targetPayment) {
      await Payments.findByIdAndUpdate(targetPayment._id, {
        razorpayOrderId: order.id
      });
    }

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayService.getPublicConfig().keyId,
        receipt: order.receipt
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create Razorpay order'
    });
  }
};

/**
 * Verify Razorpay Payment Signature and Complete Payment Settlement
 */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment credentials for verification'
      });
    }

    // Verify cryptographic signature
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay payment signature verification failed. Untrusted payload.'
      });
    }

    let updated = null;
    let farmer = null;

    if (paymentId) {
      const payment = await Payments.findOne({
        $or: [{ _id: paymentId }, { paymentId: paymentId }, { razorpayOrderId }]
      });

      if (payment) {
        const timeline = (payment.timeline || []).map(t => {
          t.done = true;
          if (!t.timestamp) t.timestamp = new Date().toISOString();
          return t;
        });

        updated = await Payments.findByIdAndUpdate(payment._id, {
          status: 'Completed',
          utrNumber: `RZP-${razorpayPaymentId}`,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          paymentDate: new Date().toISOString().split('T')[0],
          releasedBy: req.user ? req.user.name : 'Razorpay Gateway',
          timeline
        });

        farmer = await Farmers.findOne({ farmerId: payment.farmerId });
        if (farmer) {
          await sendNotification({
            userId: farmer.userId || farmer._id,
            role: 'farmer',
            title: 'Payment Settlement Complete via Razorpay',
            message: `₹${payment.amount.toLocaleString('en-IN')} disbursed successfully via Razorpay (Txn ID: ${razorpayPaymentId}).`,
            type: 'payment',
            metadata: {
              utr: `RZP-${razorpayPaymentId}`,
              amount: payment.amount,
              paymentId: razorpayPaymentId
            }
          });
        }
      }
    }

    // Audit Log
    if (req.user) {
      await AuditLogs.create({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role || 'system',
        action: 'RAZORPAY_PAYMENT_VERIFIED',
        details: `Verified Razorpay payment ${razorpayPaymentId} for order ${razorpayOrderId}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: `Razorpay payment verified successfully! Transaction ID: ${razorpayPaymentId}`,
      data: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        status: 'Completed',
        paymentRecord: updated
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error verifying Razorpay payment'
    });
  }
};

module.exports = {
  getFarmerPayments,
  getAllPayments,
  approvePayment,
  releasePayment,
  raisePaymentComplaint,
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment
};
