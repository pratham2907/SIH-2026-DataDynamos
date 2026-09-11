const crypto = require('crypto');

// In-memory CAPTCHA store with auto-cleanup
const activeCaptchas = new Map();

// Inactivity session timeouts (in minutes) as specified in requirements:
// Farmer: 30 minutes, Officer: 20 minutes, Super Admin: 15 minutes
const ROLE_INACTIVITY_TIMEOUTS_MINUTES = {
  farmer: 30,
  officer: 20,
  admin: 15,
  superadmin: 15
};

/**
 * Generate an interactive CAPTCHA
 */
const generateCaptcha = () => {
  const token = crypto.randomBytes(16).toString('hex');
  const type = Math.random() > 0.4 ? 'math' : 'code';

  let question = '';
  let solution = '';

  if (type === 'math') {
    const num1 = Math.floor(Math.random() * 15) + 3;
    const num2 = Math.floor(Math.random() * 10) + 2;
    const isAdd = Math.random() > 0.3;

    if (isAdd) {
      question = `${num1} + ${num2} = ?`;
      solution = String(num1 + num2);
    } else {
      const high = Math.max(num1, num2);
      const low = Math.min(num1, num2);
      question = `${high} - ${low} = ?`;
      solution = String(high - low);
    }
  } else {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    question = code;
    solution = code.toUpperCase();
  }

  activeCaptchas.set(token, {
    solution,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  // Cleanup expired
  const now = Date.now();
  for (const [k, v] of activeCaptchas.entries()) {
    if (v.expiresAt < now) activeCaptchas.delete(k);
  }

  return {
    captchaToken: token,
    question,
    type
  };
};

/**
 * Verify a CAPTCHA response
 */
const verifyCaptcha = (token, answer) => {
  if (!token || !answer) return false;
  const stored = activeCaptchas.get(token);
  if (!stored) return false;

  if (Date.now() > stored.expiresAt) {
    activeCaptchas.delete(token);
    return false;
  }

  const isMatch = String(stored.solution).trim().toUpperCase() === String(answer).trim().toUpperCase();
  if (isMatch) {
    activeCaptchas.delete(token); // Single use
  }
  return isMatch;
};

/**
 * Password Policy Validator (SIH 2026 Master Security Rule)
 * Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
const validatePasswordPolicy = (password) => {
  const errors = [];
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required.'], strength: 'none' };
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9).');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g. !@#$%^&*).');
  }

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  let strength = 'weak';
  if (score >= 5) strength = 'very_strong';
  else if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  return {
    valid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Helper to parse client metadata from request
 */
const getClientMeta = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  const rawAgent = req.headers['user-agent'] || 'Web Browser';

  let browser = 'Browser';
  if (/Edg\//i.test(rawAgent)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(rawAgent)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(rawAgent)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(rawAgent) && !/Chrome\//i.test(rawAgent)) browser = 'Apple Safari';

  let device = 'Desktop';
  if (/Android/i.test(rawAgent)) device = 'Android Mobile';
  else if (/iPhone|iPad|iPod/i.test(rawAgent)) device = 'Apple iOS Device';
  else if (/Mobile/i.test(rawAgent)) device = 'Mobile Device';
  else if (/Windows/i.test(rawAgent)) device = 'Windows PC';
  else if (/Macintosh/i.test(rawAgent)) device = 'Mac';
  else if (/Linux/i.test(rawAgent)) device = 'Linux Workstation';

  return {
    ip: typeof ip === 'string' ? ip.split(',')[0].trim() : '127.0.0.1',
    browser,
    device,
    userAgent: rawAgent
  };
};

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  validatePasswordPolicy,
  getClientMeta,
  ROLE_INACTIVITY_TIMEOUTS_MINUTES
};
