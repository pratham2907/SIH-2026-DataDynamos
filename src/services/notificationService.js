const { Notifications, SMSLogs, EmailLogs, generateId } = require('../models/dbStore');

const sendNotification = async ({ userId, role, title, message, type = 'info', metadata = {} }) => {
  try {
    const notif = await Notifications.create({
      _id: generateId('notif_'),
      userId,
      role: role || 'farmer',
      title,
      message,
      type, // 'booking', 'queue', 'procurement', 'payment', 'system', 'complaint'
      isRead: false,
      metadata,
      createdAt: new Date().toISOString()
    });

    // Also log simulated SMS
    if (metadata.mobile) {
      await SMSLogs.create({
        to: metadata.mobile,
        message: `[KPMS GOVT] ${title}: ${message}`,
        status: 'DELIVERED',
        provider: 'Twilio Gateway'
      });
    }

    // Also log simulated Email
    if (metadata.email) {
      await EmailLogs.create({
        to: metadata.email,
        subject: `KPMS Alert: ${title}`,
        body: message,
        status: 'SENT',
        provider: 'Nodemailer SMTP'
      });
    }

    return notif;
  } catch (err) {
    console.error('Notification dispatch error:', err);
  }
};

module.exports = {
  sendNotification
};
