const {
  sendTransactionalEmail,
  sendOtpEmail,
  sendCustomEmail,
  sendSlotBookingEmail,
  getBrevoConfig
} = require('../services/emailService');

/**
 * Check Brevo Configuration Status
 */
const getEmailConfigStatus = async (req, res) => {
  const config = getBrevoConfig();
  const maskedKey = config.apiKey
    ? `${config.apiKey.substring(0, 10)}...${config.apiKey.slice(-4)}`
    : 'NOT_CONFIGURED';

  return res.json({
    success: true,
    provider: 'Brevo (Sendinblue)',
    isConfigured: Boolean(config.apiKey),
    sender: {
      name: config.senderName,
      email: config.senderEmail
    },
    smtp: {
      host: config.smtp.host,
      port: config.smtp.port,
      user: config.smtp.user
    },
    maskedApiKey: maskedKey
  });
};

/**
 * Send a Test Email
 */
const sendTestEmail = async (req, res) => {
  try {
    const { recipientEmail, email, subject, htmlBody, fullName } = req.body;
    const targetEmail = recipientEmail || email;

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required (e.g., {"recipientEmail": "user@example.com"}).'
      });
    }

    const testSubject = subject || '🌾 Test Brevo Integration - KPMS Portal';
    const testHtml =
      htmlBody ||
      `
      <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:28px 24px; text-align:center; color:#FFFFFF; border-bottom:4px solid #16A34A;">
          <h2 style="margin:0; font-size:22px; font-weight:800;">🌾 KPMS Brevo Integration Verified</h2>
          <p style="margin:6px 0 0 0; font-size:13px; color:#86EFAC; font-weight:600;">Government of India • Ministry of Agriculture & Farmers Welfare</p>
        </div>
        <div style="padding:32px 24px;">
          <h3 style="color:#0F172A; margin-top:0;">⚡ Transactional Email Engine Online!</h3>
          <p style="font-size:14px; color:#334155; line-height:1.6;">
            Your <strong>Brevo (Sendinblue) Transactional HTTP API & SMTP Gateway</strong> has been configured successfully in the KPMS backend.
          </p>
          <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:16px; margin:20px 0;">
            <ul style="margin:0; padding-left:20px; font-size:13px; color:#166534; line-height:1.8;">
              <li><strong>Engine:</strong> Brevo v3 Transactional HTTP API</li>
              <li><strong>Zero Dependencies:</strong> Native Node.js HTTPS Dispatcher</li>
              <li><strong>Fallback:</strong> Brevo SMTP Relay via Nodemailer</li>
              <li><strong>Status:</strong> 200 OK — Ready for Production</li>
            </ul>
          </div>
        </div>
        <div style="background:#F8FAFC; padding:16px 24px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0;">
          Smart India Hackathon (SIH) 2026 • Team Data Dynamos
        </div>
      </div>
    `;

    const result = await sendTransactionalEmail({
      recipientEmail: targetEmail,
      recipientName: fullName || 'Tester',
      subject: testSubject,
      htmlBody: testHtml,
      tags: ['test-email', 'brevo-verification']
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Test email dispatched successfully to ${targetEmail}`,
        messageId: result.messageId,
        provider: result.provider
      });
    } else {
      return res.status(502).json({
        success: false,
        message: `Failed to dispatch email to ${targetEmail}`,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Test email route error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending email',
      error: err.message
    });
  }
};

/**
 * Send Custom Transactional Email Endpoint
 */
const sendCustomEmailEndpoint = async (req, res) => {
  try {
    const { to, recipientEmail, subject, title, message, fullName, recipientName } = req.body;
    const targetEmail = to || recipientEmail;

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required.'
      });
    }

    const result = await sendCustomEmail({
      to: targetEmail,
      subject,
      title: title || 'KPMS Portal Update',
      message: message || '',
      recipientName: recipientName || fullName
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getEmailConfigStatus,
  sendTestEmail,
  sendCustomEmailEndpoint
};
