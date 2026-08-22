require('dotenv').config();
const { sendOtpEmail, sendCustomEmail } = require('../src/services/emailService');

const runTest = async () => {
  const recipient = 'kamanipoojan@gmail.com';
  console.log(`🚀 Sending Brevo SMTP Test Email to: ${recipient}...`);

  const otpResult = await sendOtpEmail({
    to: recipient,
    fullName: 'Poojan Kamani',
    otp: '849201'
  });

  console.log('Test Result:', JSON.stringify(otpResult, null, 2));

  if (otpResult.success) {
    console.log('✅ Demo email sent successfully to', recipient);
  } else {
    console.error('❌ Failed to send email:', otpResult.error);
  }
};

runTest();
