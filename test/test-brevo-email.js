require('dotenv').config();
const { sendTransactionalEmail, getBrevoConfig } = require('../src/services/emailService');

const targetEmail = process.argv[2] || 'kamanipoojan@gmail.com';
const recipientName = process.argv[3] || 'Poojan Kamani';

console.log('====================================================');
console.log('🌾 KPMS BREVO TRANSACTIONAL EMAIL VERIFICATION');
console.log('====================================================');

const config = getBrevoConfig();
console.log(`📌 Target Recipient: ${targetEmail}`);
console.log(`📌 Sender Name:     ${config.senderName}`);
console.log(`📌 Sender Email:    ${config.senderEmail}`);
console.log(`📌 API Key Configured: ${Boolean(config.apiKey)} (${config.apiKey ? config.apiKey.substring(0, 10) + '...' : 'None'})`);
console.log(`📌 SMTP Relay Host: ${config.smtp.host}:${config.smtp.port}`);
console.log('----------------------------------------------------');
console.log('🚀 Dispatching transactional email via Brevo HTTP API...');

const htmlContent = `
  <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:28px 24px; text-align:center; color:#FFFFFF; border-bottom:4px solid #16A34A;">
      <h2 style="margin:0; font-size:22px; font-weight:800;">🌾 Kisan Procurement Management System</h2>
      <p style="margin:6px 0 0 0; font-size:13px; color:#86EFAC; font-weight:600;">Government of India • Ministry of Agriculture & Farmers Welfare</p>
    </div>
    <div style="padding:32px 24px;">
      <h3 style="color:#0F172A; margin-top:0;">⚡ Brevo Transactional Email Integration Confirmed</h3>
      <p style="font-size:14px; color:#334155; line-height:1.6;">
        Namaste <strong>${recipientName}</strong>,<br/><br/>
        This email verifies that the <strong>Brevo (Sendinblue) Transactional HTTP API & SMTP Gateway</strong> is running with high availability on your Node.js application stack.
      </p>
      <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:16px; margin:20px 0;">
        <ul style="margin:0; padding-left:20px; font-size:13px; color:#166534; line-height:1.8;">
          <li><strong>Architecture:</strong> Zero-dependency Node.js HTTPS Dispatcher</li>
          <li><strong>API Endpoint:</strong> <code>https://api.brevo.com/v3/smtp/email</code></li>
          <li><strong>Fallback:</strong> Brevo SMTP Relay via Nodemailer</li>
          <li><strong>Status:</strong> 200 OK — Ready for Production</li>
        </ul>
      </div>
      <p style="font-size:12px; color:#64748B;">Timestamp: ${new Date().toISOString()}</p>
    </div>
    <div style="background:#F8FAFC; padding:16px 24px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0;">
      Smart India Hackathon (SIH) 2026 Production Edition • Team Data Dynamos
    </div>
  </div>
`;

const textContent = `Namaste ${recipientName},\n\nThis email confirms that Brevo Transactional Emails are configured and working in the KPMS backend.\n\nSmart India Hackathon (SIH) 2026 - Team Data Dynamos`;

(async () => {
  try {
    const result = await sendTransactionalEmail({
      recipientEmail: targetEmail,
      recipientName: recipientName,
      subject: '🌾 Success! Brevo Email Integration Active - KPMS Portal',
      htmlBody: htmlContent,
      textBody: textContent,
      tags: ['test-script', 'brevo-verification']
    });

    console.log('----------------------------------------------------');
    if (result.success) {
      console.log('✅ [TEST PASSED] Email sent successfully!');
      console.log(`📦 Provider:   ${result.provider}`);
      console.log(`🆔 Message ID: ${result.messageId}`);
    } else {
      console.error('❌ [TEST FAILED] Could not deliver email:');
      console.error(result.error);
    }
    console.log('====================================================');
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error('❌ Fatal error in test runner:', err.message);
    process.exit(1);
  }
})();
