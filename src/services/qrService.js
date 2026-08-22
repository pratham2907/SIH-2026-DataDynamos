const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const qrDataUrl = await QRCode.toDataURL(stringData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#0E2A47',
        light: '#FFFFFF'
      },
      width: 256
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR Generation error:', err);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateQRCode
};
