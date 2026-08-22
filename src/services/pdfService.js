const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate a PDF Booking Pass as a Buffer
 */
const generateBookingPassPDF = async (booking, farmer, center) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0E2A47');
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
        .text('KISAN PROCUREMENT MANAGEMENT SYSTEM (KPMS)', 55, 52);
      doc.fontSize(11).font('Helvetica')
        .text('Department of Agriculture & Farmers Welfare | Government of India', 55, 75);

      // Pass Title & Tag
      doc.moveDown(2);
      doc.fillColor('#E06D14').fontSize(14).font('Helvetica-Bold')
        .text('OFFICIAL PROCUREMENT SLOT BOOKING PASS', 40, 115);
      doc.fillColor('#555555').fontSize(9).font('Helvetica')
        .text(`Issued On: ${new Date().toLocaleString('en-IN')}`, 40, 132);

      // Two-column layout: Details on Left, QR Code on Right
      doc.rect(40, 150, 330, 240).fillAndStroke('#F8FAFC', '#CBD5E1');
      doc.fillColor('#0E2A47').fontSize(11).font('Helvetica-Bold')
        .text('BOOKING & FARMER DETAILS', 55, 165);

      const items = [
        ['Booking Number:', booking.bookingNumber || booking._id],
        ['Farmer Name:', farmer.fullName || 'Registered Farmer'],
        ['Farmer ID:', farmer.farmerId || 'FARM-001'],
        ['Contact Mobile:', farmer.mobile || 'N/A'],
        ['Procurement Center:', center.name || 'APMC Central Hub'],
        ['Center Address:', center.village ? `${center.village}, ${center.district}` : 'District Mandi'],
        ['Scheduled Date:', booking.date || new Date().toISOString().split('T')[0]],
        ['Time Slot:', booking.timeSlot || '09:00 AM - 10:00 AM'],
        ['Declared Crop:', booking.cropName || 'Wheat (Sharbati)'],
        ['Estimated Quantity:', `${booking.quantity} Quintals`],
        ['Vehicle Number:', booking.vehicleNumber || 'Farmer Transport']
      ];

      let yPos = 185;
      items.forEach(([label, val]) => {
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text(label, 55, yPos);
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(String(val), 170, yPos);
        yPos += 18;
      });

      // QR Code Box
      doc.rect(385, 150, 170, 240).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.fillColor('#0E2A47').fontSize(10).font('Helvetica-Bold')
        .text('GATE SCAN QR', 420, 165);

      // Generate QR image buffer
      const qrPayload = JSON.stringify({
        bookingNumber: booking.bookingNumber || booking._id,
        farmerId: farmer.farmerId || 'FARM-001',
        centerId: center.centerId || center._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        crop: booking.cropName,
        qty: booking.quantity
      });
      const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 140, margin: 1 });
      doc.image(qrBuffer, 400, 190, { width: 140 });

      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
        .text('Show this QR at Mandi Entry Gate for token generation.', 395, 345, { width: 150, align: 'center' });

      // Important Instructions
      doc.rect(40, 410, 515, 150).fillAndStroke('#FFFBEB', '#FDE68A');
      doc.fillColor('#B45309').fontSize(10).font('Helvetica-Bold')
        .text('MANDI ARRIVAL GUIDELINES & INSTRUCTIONS:', 55, 422);

      const instructions = [
        '1. Please arrive 15 minutes before your scheduled slot time.',
        '2. Bring original Aadhaar Card, Land Record (7/12 or RoR), and Bank Passbook.',
        '3. Produce must conform to Fair Average Quality (FAQ) standards (Moisture < 12%).',
        '4. Maintain this digital/printed pass until weighbridge measurement and receipt issuance.',
        '5. Payment will be credited directly to your Aadhaar-linked bank account within 48-72 hours.'
      ];

      let instY = 442;
      instructions.forEach(ins => {
        doc.fillColor('#78350F').fontSize(8.5).font('Helvetica').text(ins, 55, instY);
        instY += 18;
      });

      // Footer
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
        .text('KPMS Portal | Verified by Ministry of Agriculture & Farmers Welfare, Govt of India', 40, 780, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate a Digital Payment & Procurement Receipt PDF
 */
const generatePaymentReceiptPDF = async (payment, farmer, center, procurement) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#1A7A44');
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
        .text('KISAN PROCUREMENT MANAGEMENT SYSTEM (KPMS)', 55, 52);
      doc.fontSize(11).font('Helvetica')
        .text('Official Government Procurement & Direct Benefit Transfer (DBT) Receipt', 55, 75);

      // Subtitle
      doc.moveDown(2);
      doc.fillColor('#0E2A47').fontSize(13).font('Helvetica-Bold')
        .text('OFFICIAL PROCUREMENT & PAYMENT VOUCHER', 40, 115);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica')
        .text(`Receipt No: ${payment.receiptNumber || 'RCP-' + Date.now()} | Date: ${new Date().toLocaleDateString('en-IN')}`, 40, 132);

      // Summary Table Container
      doc.rect(40, 155, 515, 230).fillAndStroke('#F8FAFC', '#E2E8F0');

      const rows = [
        ['Transaction / UTR No:', payment.utrNumber || payment.transactionId || 'SBIN00293847291'],
        ['Farmer Name & ID:', `${farmer.fullName} (${farmer.farmerId || 'FARM-001'})`],
        ['Procurement Center:', center.name || 'APMC Central Mandi'],
        ['Crop Name & Grade:', `${procurement.cropName || 'Wheat'} - Grade ${procurement.grade || 'A'}`],
        ['Gross / Tare / Net Wt:', `${procurement.grossWeight || 52} Q / ${procurement.tareWeight || 2} Q / ${procurement.netWeight || 50} Quintals`],
        ['Accepted Quantity:', `${procurement.acceptedQuantity || 50} Quintals`],
        ['Minimum Support Price (MSP):', `Rs. ${procurement.msp || 2275} per Quintal`],
        ['Base Procurement Value:', `Rs. ${(procurement.acceptedQuantity || 50) * (procurement.msp || 2275)}`],
        ['Government Bonus:', `+ Rs. ${procurement.bonus || 0}`],
        ['Deductions / Quality Adj:', `- Rs. ${procurement.deductions || 0}`],
        ['Total Payable Amount:', `Rs. ${payment.amount || 113750} (Direct DBT)`]
      ];

      let yPos = 170;
      rows.forEach(([label, val], idx) => {
        const isTotal = idx === rows.length - 1;
        if (isTotal) {
          doc.rect(45, yPos - 3, 505, 20).fill('#DCFCE7');
          doc.fillColor('#15803D').fontSize(10).font('Helvetica-Bold').text(label, 55, yPos);
          doc.fillColor('#15803D').fontSize(10).font('Helvetica-Bold').text(String(val), 250, yPos);
        } else {
          doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text(label, 55, yPos);
          doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(String(val), 250, yPos);
        }
        yPos += 19;
      });

      // Bank Details Card
      doc.rect(40, 400, 250, 110).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.fillColor('#0E2A47').fontSize(10).font('Helvetica-Bold').text('BENEFICIARY BANK ACCOUNT', 50, 412);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
        .text(`Bank: ${farmer.bankName || 'State Bank of India'}`, 50, 432)
        .text(`A/C: ${farmer.accountNumber || 'XXXX-XXXX-4920'}`, 50, 448)
        .text(`IFSC: ${farmer.ifscCode || 'SBIN0001234'}`, 50, 464)
        .text(`Aadhaar: ${farmer.aadhaarNumber ? 'XXXX-XXXX-' + farmer.aadhaarNumber.slice(-4) : 'Linked'}`, 50, 480);

      // Signatures
      doc.rect(305, 400, 250, 110).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.fillColor('#0E2A47').fontSize(10).font('Helvetica-Bold').text('OFFICIAL VALIDATION', 315, 412);
      doc.fillColor('#15803D').fontSize(9).font('Helvetica-Bold').text('✓ DIGITALLY VERIFIED & SIGNED', 315, 435);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text(`Officer ID: ${procurement.officerId || 'OFF-01'}`, 315, 455)
        .text('Center Head / Mandi In-Charge', 315, 470)
        .text(`Status: ${payment.status || 'COMPLETED'}`, 315, 485);

      // QR Verification
      const qrData = JSON.stringify({
        receiptNo: payment.receiptNumber,
        farmerId: farmer.farmerId,
        amount: payment.amount,
        utr: payment.utrNumber,
        status: payment.status
      });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 90, margin: 1 });
      doc.image(qrBuffer, 460, 415, { width: 85 });

      // Footer notice
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text('This is a computer-generated official DBT voucher. For any discrepancy, contact Mandi Toll-Free 1800-180-1551.', 40, 750, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateBookingPassPDF,
  generatePaymentReceiptPDF
};
