require('dotenv').config();
const https = require('https');

const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
const senderEmail = process.env.BREVO_SENDER_EMAIL || 'upadhyayhem0@gmail.com';
const senderName = process.env.BREVO_SENDER_NAME || 'KPMS Govt Portal';

if (!apiKey) {
  console.error('Error: BREVO_API_KEY is not set in environment variables.');
  process.exit(1);
}

const payload = JSON.stringify({
  sender: { name: senderName, email: senderEmail },
  to: [{ email: process.argv[2] || 'kamanipoojan@gmail.com', name: 'Recipient' }],
  subject: '🌾 KPMS Brevo API Connectivity Test',
  htmlContent: `
    <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:28px 24px; text-align:center; color:#FFFFFF; border-bottom:4px solid #E06D14;">
        <h2 style="margin:0; font-size:22px; font-weight:800;">🌾 Kisan Procurement Management System</h2>
        <p style="margin:6px 0 0 0; font-size:13px; color:#FCD34D; font-weight:600;">Government of India • Ministry of Agriculture & Farmers Welfare</p>
      </div>
      <div style="padding:32px 24px;">
        <p style="font-size:16px; color:#1E293B; margin-top:0;">Namaste,</p>
        <p style="font-size:14px; color:#475569; line-height:1.6;">
          This is a test notification from the KPMS Brevo API dispatcher.
        </p>
      </div>
      <div style="background:#F1F5F9; padding:18px 24px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0;">
        Smart India Hackathon (SIH) 2026 Production System • Team Data Dynamos
      </div>
    </div>
  `
});

const req = https.request({
  hostname: 'api.brevo.com',
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': apiKey,
    'content-type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(payload);
req.end();
