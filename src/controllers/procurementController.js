const {
  Procurements, Bookings, Farmers, Centers, Queues, Payments, Inventory, generateId
} = require('../models/dbStore');
const { generatePaymentReceiptPDF } = require('../services/pdfService');
const { sendNotification } = require('../services/notificationService');
const { emitToCenter } = require('../services/socketService');

// Standard Government MSP Rates (2025-26 Season)
const MSP_RATES = {
  'Wheat': 2275,
  'Wheat (Sharbati)': 2275,
  'Paddy (Common)': 2300,
  'Paddy (Grade A)': 2320,
  'Gram (Chana)': 5440,
  'Mustard (Sarson)': 5650,
  'Soyabean (Yellow)': 4892,
  'Maize': 2090,
  'Cotton (Medium Staple)': 7121,
  'Moong (Green Gram)': 8682
};

/**
 * Get Pre-filled Procurement Context
 */
const getProcurementContext = async (req, res) => {
  try {
    const { tokenNumber, bookingNumber } = req.query;
    let query = {};
    if (tokenNumber) query.tokenNumber = tokenNumber;
    if (bookingNumber) query.bookingNumber = bookingNumber;

    const queue = await Queues.findOne(query);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue or Booking record not found' });
    }

    const booking = await Bookings.findOne({ bookingNumber: queue.bookingNumber });
    const farmer = await Farmers.findOne({ farmerId: queue.farmerId });
    const center = await Centers.findOne({ centerId: queue.centerId });

    const cropName = (booking && booking.cropName) || queue.cropName || 'Wheat (Sharbati)';
    const msp = MSP_RATES[cropName] || 2275;

    return res.json({
      success: true,
      data: {
        queue,
        booking,
        farmer,
        center,
        suggestedMSP: msp,
        cropName,
        declaredQuantity: booking ? booking.quantity : queue.quantity
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Finalize Procurement Acceptance & Trigger Receipt + Payment DBT pipeline
 */
const acceptProcurement = async (req, res) => {
  try {
    const {
      bookingNumber,
      farmerId,
      centerId,
      cropName,
      variety,
      // Quality Inspection
      moisturePercentage,
      foreignMaterial,
      brokenGrain,
      damagedGrain,
      color,
      odor,
      grade,
      inspectionNotes,
      // Weighbridge measurement
      grossWeight,
      tareWeight,
      netWeight,
      acceptedQuantity,
      rejectedQuantity,
      // Pricing
      msp,
      bonus,
      deductions,
      totalAmount,
      // Signatures
      officerSignature,
      farmerSignature,
      officerRemarks
    } = req.body;

    const farmer = await Farmers.findOne({ farmerId }) || { fullName: 'Farmer', mobile: '', email: '' };
    const center = await Centers.findOne({ centerId }) || { name: 'APMC Mandi' };

    const procCount = await Procurements.countDocuments();
    const procurementId = `PROC-${new Date().getFullYear()}-${String(procCount + 101).padStart(4, '0')}`;
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(procCount + 501).padStart(4, '0')}`;

    const numAccepted = parseFloat(acceptedQuantity) || parseFloat(netWeight) || 50;
    const numRejected = parseFloat(rejectedQuantity) || 0;
    const unitMSP = parseFloat(msp) || MSP_RATES[cropName] || 2275;
    const numBonus = parseFloat(bonus) || 0;
    const numDeductions = parseFloat(deductions) || 0;
    const finalPayable = (numAccepted * unitMSP) + numBonus - numDeductions;

    // 1. Create Procurement Record
    const procRecord = await Procurements.create({
      procurementId,
      receiptNumber,
      bookingNumber: bookingNumber || '',
      farmerId,
      farmerName: farmer.fullName,
      centerId,
      officerId: req.user ? req.user.officerId : 'OFF-01',
      cropName: cropName || 'Wheat',
      variety: variety || 'Standard',
      grade: grade || 'A',
      moisturePercentage: parseFloat(moisturePercentage) || 11.5,
      foreignMaterial: parseFloat(foreignMaterial) || 0.5,
      brokenGrain: parseFloat(brokenGrain) || 1.0,
      damagedGrain: parseFloat(damagedGrain) || 0.5,
      color: color || 'Good',
      odor: odor || 'Normal',
      inspectionNotes: inspectionNotes || '',
      grossWeight: parseFloat(grossWeight) || 52,
      tareWeight: parseFloat(tareWeight) || 2,
      netWeight: parseFloat(netWeight) || 50,
      acceptedQuantity: numAccepted,
      rejectedQuantity: numRejected,
      msp: unitMSP,
      bonus: numBonus,
      deductions: numDeductions,
      totalAmount: finalPayable,
      status: 'Accepted',
      officerSignature: officerSignature || '',
      farmerSignature: farmerSignature || '',
      officerRemarks: officerRemarks || '',
      date: new Date().toISOString().split('T')[0]
    });

    // 2. Automatically create Payment DBT request
    const payCount = await Payments.countDocuments();
    const paymentId = `PAY-${new Date().getFullYear()}-${String(payCount + 201).padStart(4, '0')}`;
    const txnId = `TXN-DBT-${Date.now().toString().slice(-8)}`;
    const utrNo = `SBIN${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const paymentRecord = await Payments.create({
      paymentId,
      transactionId: txnId,
      utrNumber: utrNo,
      receiptNumber,
      farmerId,
      farmerName: farmer.fullName,
      procurementId,
      centerId,
      officerId: req.user ? req.user.officerId : 'OFF-01',
      acceptedQuantity: numAccepted,
      msp: unitMSP,
      bonus: numBonus,
      deductions: numDeductions,
      amount: finalPayable,
      bankName: farmer.bankName || 'State Bank of India',
      accountNumber: farmer.accountNumber || '30294819284',
      ifscCode: farmer.ifscCode || 'SBIN0001234',
      status: 'Verified', // Ready for Admin release
      createdDate: new Date().toISOString().split('T')[0],
      timeline: [
        { stage: 'Requested', timestamp: new Date().toISOString(), done: true },
        { stage: 'Verified', timestamp: new Date().toISOString(), done: true },
        { stage: 'Approved', timestamp: null, done: false },
        { stage: 'Released', timestamp: null, done: false },
        { stage: 'Completed', timestamp: null, done: false }
      ]
    });

    // 3. Update Inventory
    const existingInventory = await Inventory.findOne({ centerId, cropName });
    if (existingInventory) {
      await Inventory.updateOne(
        { centerId, cropName },
        {
          $set: {
            totalStockQuintals: (existingInventory.totalStockQuintals || 0) + numAccepted,
            acceptedToday: (existingInventory.acceptedToday || 0) + numAccepted,
            rejectedToday: (existingInventory.rejectedToday || 0) + numRejected
          }
        }
      );
    } else {
      await Inventory.create({
        centerId,
        cropName,
        totalStockQuintals: numAccepted,
        warehouseCapacity: 5000,
        acceptedToday: numAccepted,
        rejectedToday: numRejected
      });
    }

    // 4. Update Booking & Queue State
    if (bookingNumber) {
      const bkg = await Bookings.findOne({ bookingNumber });
      if (bkg) {
        const timeline = bkg.timeline || [];
        timeline.forEach(t => {
          if (t.stage === 'Quality Inspection' || t.stage === 'Weight Verification' || t.stage === 'Procurement Complete') {
            t.done = true;
            t.timestamp = new Date().toISOString();
          }
        });
        await Bookings.findByIdAndUpdate(bkg._id, { status: 'Procurement Complete', timeline });
      }
      await Queues.updateOne({ bookingNumber }, { $set: { status: 'completed', completionTime: new Date().toISOString() } });
    }

    // 5. Notify Farmer
    await sendNotification({
      userId: farmer.userId || farmer._id,
      role: 'farmer',
      title: 'Procurement Completed & Payment DBT Initiated',
      message: `Your ${cropName} (${numAccepted} Q) was accepted (Grade ${grade || 'A'}). Voucher ${receiptNumber} generated for ₹${finalPayable.toLocaleString('en-IN')}. DBT initiated.`,
      type: 'procurement',
      metadata: { receiptNumber, amount: finalPayable, mobile: farmer.mobile, email: farmer.email }
    });

    // Emit live event
    emitToCenter(centerId, 'procurement:accepted', {
      procurementId,
      receiptNumber,
      farmerName: farmer.fullName,
      cropName,
      acceptedQuantity: numAccepted,
      amount: finalPayable
    });

    return res.status(201).json({
      success: true,
      message: 'Procurement completed successfully! Receipt generated & DBT payment initiated.',
      data: {
        procurement: procRecord,
        payment: paymentRecord,
        receiptNumber
      }
    });
  } catch (err) {
    console.error('Procurement accept error:', err);
    return res.status(500).json({ success: false, message: 'Procurement submission failed', error: err.message });
  }
};

/**
 * Reject Procurement
 */
const rejectProcurement = async (req, res) => {
  try {
    const { bookingNumber, farmerId, centerId, cropName, rejectionReason, remarks } = req.body;

    const farmer = await Farmers.findOne({ farmerId });
    const procCount = await Procurements.countDocuments();
    const procurementId = `PROC-REJ-${Date.now()}`;

    await Procurements.create({
      procurementId,
      bookingNumber,
      farmerId,
      farmerName: farmer ? farmer.fullName : 'Farmer',
      centerId,
      cropName,
      status: 'Rejected',
      rejectionReason: rejectionReason || 'High Moisture Content / Quality Standards not met',
      officerRemarks: remarks || '',
      date: new Date().toISOString().split('T')[0]
    });

    if (bookingNumber) {
      await Bookings.updateOne({ bookingNumber }, { $set: { status: 'Rejected' } });
      await Queues.updateOne({ bookingNumber }, { $set: { status: 'completed' } });
    }

    await sendNotification({
      userId: farmer ? farmer.userId : null,
      role: 'farmer',
      title: 'Procurement Notice: Produce Not Accepted',
      message: `Your produce could not be accepted due to: ${rejectionReason || 'Quality parameters not meeting FAQ specifications'}.`,
      type: 'procurement'
    });

    return res.json({ success: true, message: 'Rejection logged and farmer notified.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Procurement History
 */
const getProcurementHistory = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'farmer') {
      const farmer = await Farmers.findById(req.user.id);
      if (farmer) query.farmerId = farmer.farmerId;
    } else if (req.user.role === 'officer' && req.user.assignedCenterId) {
      query.centerId = req.user.assignedCenterId;
    }

    const records = await Procurements.find(query);
    return res.json({ success: true, data: records.reverse() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Download Procurement & Payment Receipt PDF
 */
const downloadReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const procurement = await Procurements.findOne({
      $or: [{ _id: id }, { procurementId: id }, { receiptNumber: id }]
    });

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement receipt not found' });
    }

    const farmer = await Farmers.findOne({ farmerId: procurement.farmerId }) || { fullName: procurement.farmerName || 'Farmer' };
    const center = await Centers.findOne({ centerId: procurement.centerId }) || { name: 'APMC Mandi' };
    const payment = await Payments.findOne({ receiptNumber: procurement.receiptNumber }) || {
      receiptNumber: procurement.receiptNumber,
      amount: procurement.totalAmount,
      utrNumber: 'SBIN00293847291',
      status: 'Verified'
    };

    const pdfBuffer = await generatePaymentReceiptPDF(payment, farmer, center, procurement);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=KPMS_Voucher_${procurement.receiptNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Receipt PDF error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt PDF', error: err.message });
  }
};

module.exports = {
  getProcurementContext,
  acceptProcurement,
  rejectProcurement,
  getProcurementHistory,
  downloadReceiptPDF
};
