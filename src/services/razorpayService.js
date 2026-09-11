const https = require('https');
const crypto = require('crypto');

/**
 * 💳 Razorpay Payment Gateway Integration Service
 * Supports Test & Live modes via Razorpay REST API
 */

const getCredentials = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return { keyId, keySecret };
};

/**
 * Create an Order on Razorpay
 * @param {Object} params - { amount: Number (in INR), receipt: String, notes: Object }
 */
const createOrder = async ({ amount, receipt, notes = {}, currency = 'INR' }) => {
  const { keyId, keySecret } = getCredentials();

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in .env');
  }

  // Razorpay expects amount in smallest currency unit (paise for INR, 1 INR = 100 paise)
  const amountInPaise = Math.round(Number(amount) * 100);

  const payload = JSON.stringify({
    amount: amountInPaise,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes: {
      portal: 'KPMS Agri-Procurement Management System',
      ...notes
    }
  });

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.razorpay.com',
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': authHeader
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const msg = parsed.error ? `${parsed.error.description || parsed.error.code}` : `Razorpay error HTTP ${res.statusCode}`;
            reject(new Error(`Razorpay Order Failed: ${msg}`));
          }
        } catch (e) {
          reject(new Error('Invalid response from Razorpay API'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Razorpay order creation timed out'));
    });
    req.write(payload);
    req.end();
  });
};

/**
 * Verify Razorpay Payment Signature
 * HMAC SHA256(order_id + "|" + payment_id, secret) === signature
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const { keySecret } = getCredentials();
  if (!keySecret) {
    throw new Error('Razorpay Key Secret is not configured in .env');
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Fetch Payment details from Razorpay
 */
const fetchPayment = async (paymentId) => {
  const { keyId, keySecret } = getCredentials();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured in .env');
  }

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.razorpay.com',
      path: `/v1/payments/${paymentId}`,
      method: 'GET',
      headers: { 'Authorization': authHeader }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Razorpay fetch failed: ${parsed.error ? parsed.error.description : res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Invalid response from Razorpay'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Razorpay payment fetch timed out'));
    });
    req.end();
  });
};

/**
 * Get Public Configuration (Key ID only)
 */
const getPublicConfig = () => {
  const { keyId } = getCredentials();
  return {
    isConfigured: Boolean(keyId),
    keyId: keyId || null,
    currency: 'INR'
  };
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  getPublicConfig
};
