require('dotenv').config();
const nodemailer = require('nodemailer');

async function testCombinations() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_HOST_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS || process.env.BREVO_API_KEY;

  if (!user || !pass) {
    console.error('Error: SMTP credentials not set in environment variables.');
    process.exit(1);
  }

  const configs = [
    {
      name: `Brevo SMTP Relay (${user} on port ${port})`,
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    }
  ];

  for (const cfg of configs) {
    console.log(`\nTesting ${cfg.name}...`);
    const transporter = nodemailer.createTransport(cfg);
    try {
      await transporter.verify();
      console.log(`✅ Success for ${cfg.name}!`);
    } catch (err) {
      console.log(`❌ Failed for ${cfg.name}: ${err.message}`);
    }
  }
}

testCombinations();
