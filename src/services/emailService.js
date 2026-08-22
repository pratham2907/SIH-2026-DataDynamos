const https = require('https');
const nodemailer = require('nodemailer');

/**
 * Brevo Configuration Resolver
 * Supports both standard Brevo and SMTP environment variable conventions
 */
const getBrevoConfig = () => {
  return {
    apiKey: process.env.BREVO_API_KEY || process.env.SMTP_PASS || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'upadhyayhem0@gmail.com',
    senderName: process.env.BREVO_SENDER_NAME || 'KPMS Govt Portal',
    defaultFrom: process.env.DEFAULT_FROM_EMAIL || process.env.SMTP_FROM || 'KPMS Govt Portal <upadhyayhem0@gmail.com>',
    smtp: {
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
      user: process.env.EMAIL_HOST_USER || process.env.SMTP_USER || 'b65525001@smtp-brevo.com',
      pass: process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS || process.env.BREVO_API_KEY || ''
    }
  };
};

/**
 * Create Nodemailer SMTP Transporter for Brevo
 */
const createTransporter = () => {
  const config = getBrevoConfig();
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    },
    tls: { rejectUnauthorized: false }
  });
};

/**
 * Core Dispatcher: Sends transactional email directly via Brevo REST HTTP API v3
 * Zero external dependencies: Uses standard library `https`
 *
 * @param {Object} options
 * @param {string} options.recipientEmail - Target recipient email address
 * @param {string} [options.recipientName] - Recipient name
 * @param {string} options.subject - Email subject line
 * @param {string} options.htmlBody - Full HTML body
 * @param {string} [options.textBody] - Plain text version
 * @param {Array} [options.tags] - Array of tags (e.g. ['kyc-otp', 'portal'])
 * @param {Array} [options.attachment] - Array of { name, content, url }
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, provider: string}>}
 */
const sendTransactionalEmail = async ({
  recipientEmail,
  to,
  recipientName,
  fullName,
  subject,
  htmlBody,
  htmlContent,
  textBody,
  textContent,
  tags,
  attachment
}) => {
  const config = getBrevoConfig();
  const targetEmail = recipientEmail || to;
  const targetName = recipientName || fullName || 'Citizen / Farmer';
  const finalHtml = htmlBody || htmlContent || '<p>KPMS Notification</p>';
  const finalText = textBody || textContent || '';

  if (!config.apiKey) {
    console.warn('⚠️ BREVO_API_KEY is not configured in .env. Attempting SMTP relay directly.');
    return sendViaSmtp({
      to: targetEmail,
      subject,
      html: finalHtml,
      text: finalText
    });
  }

  // 1. Primary Method: Brevo REST HTTP API
  try {
    const payloadObj = {
      sender: {
        name: config.senderName,
        email: config.senderEmail
      },
      to: [
        {
          email: targetEmail,
          name: targetName
        }
      ],
      subject: subject,
      htmlContent: finalHtml
    };

    if (finalText) {
      payloadObj.textContent = finalText;
    }
    if (tags && Array.isArray(tags)) {
      payloadObj.tags = tags;
    }
    if (attachment && Array.isArray(attachment)) {
      payloadObj.attachment = attachment;
    }

    const payload = JSON.stringify(payloadObj);

    const apiResult = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.brevo.com',
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': config.apiKey,
            'content-type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          let responseData = '';
          res.on('data', (chunk) => (responseData += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(responseData);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({
                  success: true,
                  messageId: parsed.messageId,
                  provider: 'Brevo HTTP API v3'
                });
              } else {
                reject(
                  new Error(
                    parsed.message || `Brevo API HTTP ${res.statusCode}: ${responseData}`
                  )
                );
              }
            } catch (e) {
              reject(new Error(`Failed to parse Brevo API response: ${responseData}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.setTimeout(10000, () => {
        req.destroy(new Error('Brevo HTTP API request timed out after 10s'));
      });

      req.write(payload);
      req.end();
    });

    console.log(
      `📧 [BREVO HTTP API SUCCESS] Email delivered to ${targetEmail} (MessageID: ${apiResult.messageId})`
    );
    return apiResult;
  } catch (apiError) {
    console.warn(`⚠️ [BREVO HTTP API FAILED] ${apiError.message} — attempting SMTP Relay fallback...`);

    // 2. Fallback: Brevo SMTP Relay via Nodemailer
    return sendViaSmtp({
      to: targetEmail,
      subject,
      html: finalHtml,
      text: finalText
    });
  }
};

/**
 * Fallback SMTP Dispatcher
 */
const sendViaSmtp = async ({ to, subject, html, text }) => {
  const config = getBrevoConfig();
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: config.defaultFrom,
      to,
      subject,
      html,
      text
    });

    console.log(`📧 [BREVO SMTP SUCCESS] Email sent to ${to} (MessageID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      provider: 'Brevo SMTP Relay'
    };
  } catch (smtpErr) {
    console.error(`❌ [EMAIL DISPATCH ERROR] All Brevo providers failed for ${to}:`, smtpErr.message);
    return {
      success: false,
      error: smtpErr.message
    };
  }
};

/**
 * Send an OTP Verification Email with Govt Theme HTML Template
 */
const sendOtpEmail = async ({ to, fullName, otp }) => {
  const htmlContent = `
    <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
      <!-- Header Banner -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:28px 24px; text-align:center; color:#FFFFFF; border-bottom:4px solid #E06D14;">
        <h2 style="margin:0; font-size:22px; font-weight:800; letter-spacing:0.5px;">🌾 Kisan Procurement Management System</h2>
        <p style="margin:6px 0 0 0; font-size:13px; color:#FCD34D; font-weight:600;">Government of India • Ministry of Agriculture & Farmers Welfare</p>
      </div>

      <!-- Body Content -->
      <div style="padding:32px 24px;">
        <p style="font-size:16px; color:#1E293B; margin-top:0;">Namaste <strong>${fullName || 'Farmer'}</strong>,</p>
        <p style="font-size:14px; color:#475569; line-height:1.6;">
          Thank you for registering on the <strong>KPMS Smart Mandi & Direct DBT Procurement Portal</strong>. Please use the One-Time Password (OTP) below to complete your KYC identity verification and activate your account.
        </p>

        <!-- OTP Highlight Card -->
        <div style="background:#FFFBEB; border:2px dashed #E06D14; border-radius:10px; padding:20px; text-align:center; margin:24px 0;">
          <span style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#92400E; font-weight:700;">Your Verification OTP</span>
          <div style="font-size:36px; font-weight:900; letter-spacing:8px; color:#E06D14; margin:10px 0; font-family:monospace;">
            ${otp}
          </div>
          <span style="font-size:12px; color:#78350F;">Valid for <strong>10 minutes</strong>. Never share your OTP with anyone.</span>
        </div>

        <!-- Features Checklist -->
        <div style="background:#F8FAFC; border-radius:8px; padding:16px; margin-top:20px;">
          <div style="font-size:13px; font-weight:700; color:#0F172A; margin-bottom:8px;">✅ What you can do after activation:</div>
          <ul style="margin:0; padding-left:20px; font-size:13px; color:#475569; line-height:1.6;">
            <li>Pre-book guaranteed mandi procurement slots with zero waiting queue.</li>
            <li>Track live token countdowns and weighbridge status in real-time.</li>
            <li>Receive instant Direct Benefit Transfer (DBT) MSP disbursements to your bank.</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#F1F5F9; padding:18px 24px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0;">
        <p style="margin:0 0 4px 0;">Smart India Hackathon (SIH) 2026 Production System • Team Data Dynamos</p>
        <p style="margin:0;">National Agricultural Market (e-NAM) Interoperable Infrastructure</p>
      </div>
    </div>
  `;

  const textContent = `Namaste ${fullName || 'Farmer'},\n\nYour KPMS Verification OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nKisan Procurement Management System (KPMS)`;
  const subject = `🌾 ${otp} is your KPMS Portal Verification Code`;

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName: fullName,
    subject,
    htmlBody: htmlContent,
    textBody: textContent,
    tags: ['kyc-otp', 'farmer-registration']
  });
};

/**
 * Send Custom / Announcement Email
 */
const sendCustomEmail = async ({ to, subject, title, message, recipientName }) => {
  const htmlContent = `
    <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:24px; text-align:center; color:#FFFFFF; border-bottom:4px solid #16A34A;">
        <h2 style="margin:0; font-size:20px; font-weight:800;">🌾 Kisan Procurement Management System</h2>
        <p style="margin:4px 0 0 0; font-size:13px; color:#86EFAC; font-weight:600;">Government of India • Ministry of Agriculture & Farmers Welfare</p>
      </div>
      <div style="padding:28px 24px;">
        <h3 style="color:#0F172A; margin-top:0; font-size:18px;">${title || 'Portal Notification'}</h3>
        <p style="font-size:14px; color:#334155; line-height:1.6;">${message || ''}</p>
        <div style="margin-top:24px; padding:16px; background:#F0FDF4; border-left:4px solid #16A34A; border-radius:6px;">
          <p style="margin:0; font-size:13px; color:#166534; font-weight:600;">⚡ System Notification via Brevo Gateway</p>
          <p style="margin:4px 0 0 0; font-size:12px; color:#15803D;">Status: Live & Verified</p>
        </div>
      </div>
      <div style="background:#F8FAFC; padding:14px 24px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0;">
        Smart India Hackathon (SIH) 2026 Production Edition • KPMS Team Data Dynamos
      </div>
    </div>
  `;
  const textContent = `${title || 'Notification'}\n\n${message || ''}\n\nKisan Procurement Management System (KPMS)`;

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName,
    subject: subject || `🌾 KPMS Alert: ${title || 'Portal Update'}`,
    htmlBody: htmlContent,
    textBody: textContent,
    tags: ['announcement', 'notification']
  });
};

/**
 * Send Mandi Slot Booking Confirmation Email
 */
const sendSlotBookingEmail = async ({ to, fullName, booking }) => {
  const token = booking.tokenNumber || 'TK-PENDING';
  const centerName = booking.centerName || 'District Mandi Center';
  const slotTime = booking.slotTime || 'Morning Slot (09:00 AM - 12:00 PM)';
  const crop = booking.cropName || 'Wheat';
  const qty = booking.estimatedQuantityQuintals || booking.quantity || '50';

  const htmlContent = `
    <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:24px; text-align:center; color:#FFFFFF; border-bottom:4px solid #2563EB;">
        <h2 style="margin:0; font-size:20px; font-weight:800;">🌾 KPMS Mandi Slot Confirmed</h2>
        <p style="margin:4px 0 0 0; font-size:13px; color:#93C5FD; font-weight:600;">Direct Smart Procurement Token</p>
      </div>
      <div style="padding:28px 24px;">
        <p style="font-size:15px; color:#1E293B; margin-top:0;">Namaste <strong>${fullName || 'Farmer'}</strong>,</p>
        <p style="font-size:14px; color:#475569;">Your mandi procurement slot has been scheduled successfully. Please arrive with your vehicle and original identity documents.</p>

        <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:18px; margin:20px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr>
              <td style="padding:6px 0; color:#64748B; font-weight:600;">Queue Token:</td>
              <td style="padding:6px 0; color:#1E3A8A; font-weight:800; font-size:16px;">#${token}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#64748B; font-weight:600;">Procurement Center:</td>
              <td style="padding:6px 0; color:#0F172A; font-weight:600;">${centerName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#64748B; font-weight:600;">Slot Date & Time:</td>
              <td style="padding:6px 0; color:#0F172A; font-weight:600;">${slotTime}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#64748B; font-weight:600;">Commodity & Volume:</td>
              <td style="padding:6px 0; color:#0F172A; font-weight:600;">${crop} • ${qty} Quintals</td>
            </tr>
          </table>
        </div>
      </div>
      <div style="background:#F8FAFC; padding:14px 24px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0;">
        Kisan Procurement Management System • Ministry of Agriculture & Farmers Welfare
      </div>
    </div>
  `;

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName: fullName,
    subject: `🌾 Mandi Slot Confirmed: Token #${token} (${crop})`,
    htmlBody: htmlContent,
    tags: ['booking-confirmation', 'slot-booking']
  });
};

module.exports = {
  sendTransactionalEmail,
  sendOtpEmail,
  sendCustomEmail,
  sendSlotBookingEmail,
  createTransporter,
  getBrevoConfig
};
