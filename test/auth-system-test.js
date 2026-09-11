const http = require('http');

const PORT = 7008;
const BASE_URL = `http://localhost:${PORT}/api`;

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
    const url = new URL(fullUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runAuthTests = async () => {
  console.log('===============================================================');
  console.log('🌾 SIH 2026 PRODUCTION MULTI-ROLE AUTHENTICATION SYSTEM TEST');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extraInfo = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo ? '(' + extraInfo + ')' : ''}`);
      failed++;
    }
  };

  try {
    // Refresh clean state
    await request('POST', '/demo/reset');

    // 1. Farmer Invalid Identifier Format Check
    const badFarmerRes = await request('POST', '/auth/login', {
      role: 'farmer',
      identifier: '12345', // Not 10 digits and not FRM...
      password: 'password123'
    });
    assert(
      badFarmerRes.status === 400 && badFarmerRes.body.field === 'identifier',
      'Farmer invalid ID format correctly rejected with 400',
      JSON.stringify(badFarmerRes.body)
    );

    // 2. Farmer Valid Login with 2FA Challenge
    const farmerLoginRes = await request('POST', '/auth/login', {
      role: 'farmer',
      identifier: '9876543210',
      password: 'Kisan@123'
    });
    assert(
      farmerLoginRes.status === 200 && farmerLoginRes.body.requiresOtp === true && !!farmerLoginRes.body.tempSessionId,
      'Farmer login credentials verified -> Dispatches 2FA OTP challenge',
      JSON.stringify(farmerLoginRes.body)
    );

    // 3. Farmer 2FA OTP Verification -> JWT & Dashboard Redirection
    const farmerVerifyRes = await request('POST', '/auth/verify-login-otp', {
      tempSessionId: farmerLoginRes.body.tempSessionId,
      otp: '123456'
    });
    assert(
      farmerVerifyRes.status === 200 &&
      !!farmerVerifyRes.body.token &&
      farmerVerifyRes.body.redirectUrl === '#farmer-dashboard' &&
      farmerVerifyRes.body.user.role === 'farmer',
      'Farmer 2FA OTP verified -> Issues JWT and redirects to #farmer-dashboard'
    );

    // 4. Officer Pending Admin Approval Guard Check
    // Register a pending officer applicant via live API
    const testOfficerEmail = `pending.officer.${Date.now()}@gov.in`;
    const testEmpId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
    const regInitRes = await request('POST', '/registration/officer/initiate', {
      fullName: 'Suresh Verma',
      employeeId: testEmpId,
      designation: 'Mandi Supervisor',
      mobile: '9876541122',
      officialEmail: testOfficerEmail,
      aadhaarNumber: '765432198012',
      password: 'OfficerSecure@123',
      procurementCentreCode: 'CTR-01'
    });

    if (regInitRes.body && regInitRes.body.tempId) {
      // Complete OTP verification -> Stages to Pending_Admin_Approval
      await request('POST', '/registration/officer/verify-otp', {
        tempId: regInitRes.body.tempId,
        otp: '123456'
      });
    }

    const pendingOfficerRes = await request('POST', '/auth/login', {
      role: 'officer',
      identifier: testOfficerEmail,
      password: 'OfficerSecure@123'
    });
    assert(
      pendingOfficerRes.status === 403 &&
      pendingOfficerRes.body.message === 'Your registration has been received and is awaiting administrator approval.',
      'Pending Officer blocked with exact message: "Your registration has been received and is awaiting administrator approval."',
      JSON.stringify(pendingOfficerRes.body)
    );

    // 5. Approved Officer Login & 2FA
    const officerLoginRes = await request('POST', '/auth/login', {
      role: 'officer',
      identifier: 'officer@kpms.gov.in',
      password: 'Officer@123'
    });
    assert(
      officerLoginRes.status === 200 && officerLoginRes.body.requiresOtp === true,
      'Approved Procurement Officer credentials verified -> Dispatches 2FA OTP',
      JSON.stringify(officerLoginRes.body)
    );

    const officerVerifyRes = await request('POST', '/auth/verify-login-otp', {
      tempSessionId: officerLoginRes.body.tempSessionId,
      otp: '123456'
    });
    assert(
      officerVerifyRes.status === 200 &&
      officerVerifyRes.body.redirectUrl === '#officer-dashboard' &&
      officerVerifyRes.body.user.role === 'officer',
      'Officer 2FA OTP verified -> Issues JWT and redirects to #officer-dashboard'
    );

    // 6. Super Admin CAPTCHA Requirement & 2FA Flow
    // Missing CAPTCHA test
    const adminNoCaptchaRes = await request('POST', '/auth/login', {
      role: 'admin',
      identifier: 'admin@kpms.gov.in',
      password: 'Admin@123'
    });
    assert(
      adminNoCaptchaRes.status === 400 && adminNoCaptchaRes.body.field === 'captcha',
      'Super Admin login requires CAPTCHA solution'
    );

    // Fetch live CAPTCHA
    const captchaRes = await request('GET', '/auth/captcha');
    assert(captchaRes.status === 200 && !!captchaRes.body.captchaToken, 'Interactive CAPTCHA endpoint functional');

    // Solve math or text CAPTCHA
    let solution = '';
    const q = captchaRes.body.question;
    if (q.includes('+') || q.includes('-')) {
      const parts = q.replace('= ?', '').trim().split(' ');
      const n1 = parseInt(parts[0], 10);
      const op = parts[1];
      const n2 = parseInt(parts[2], 10);
      solution = op === '+' ? String(n1 + n2) : String(n1 - n2);
    } else {
      solution = q;
    }

    const adminLoginRes = await request('POST', '/auth/login', {
      role: 'admin',
      identifier: 'admin@kpms.gov.in',
      password: 'Admin@123',
      captchaToken: captchaRes.body.captchaToken,
      captchaAnswer: solution
    });
    assert(
      adminLoginRes.status === 200 && adminLoginRes.body.requiresOtp === true,
      'Super Admin login with CAPTCHA succeeds -> Dispatches 2FA OTP',
      JSON.stringify(adminLoginRes.body)
    );

    const adminVerifyRes = await request('POST', '/auth/verify-login-otp', {
      tempSessionId: adminLoginRes.body.tempSessionId,
      otp: '123456'
    });
    assert(
      adminVerifyRes.status === 200 &&
      adminVerifyRes.body.redirectUrl === '#admin-dashboard' &&
      (adminVerifyRes.body.user.role === 'admin' || adminVerifyRes.body.user.role === 'superadmin'),
      'Super Admin 2FA OTP verified -> Issues JWT and redirects to #admin-dashboard'
    );

    // 7. Brute Force Protection & 30-Minute Account Lockout Test
    // Use officer2@kpms.gov.in which exists in the server memory store
    let lastRes = null;
    for (let i = 1; i <= 5; i++) {
      lastRes = await request('POST', '/auth/login', {
        role: 'officer',
        identifier: 'officer2@kpms.gov.in',
        password: `WrongPassword#${i}`
      });
      if (i < 5) {
        assert(
          lastRes.status === 401 && lastRes.body.message === 'Invalid credentials or account unavailable.',
          `Failed attempt ${i}/5 returns generic message without revealing credential specifics`
        );
      }
    }

    assert(
      lastRes.status === 423 && lastRes.body.isLocked === true && lastRes.body.remainingMinutes > 0,
      '5th failed attempt locks account for 30 minutes (HTTP 423 Locked)',
      JSON.stringify(lastRes.body)
    );

    // Reset officer2 failed attempts for subsequent tests
    const { Users } = require('../src/models/dbStore');
    await Users.updateOne({ email: 'officer2@kpms.gov.in' }, { failedLoginAttempts: 0, lockUntil: null });

    // 8. Forgot Password Workflow (Initiate -> Verify -> Policy Enforced Reset)
    const forgotInitRes = await request('POST', '/auth/forgot-password/initiate', {
      role: 'farmer',
      identifier: '9876543210'
    });
    assert(
      forgotInitRes.status === 200 && !!forgotInitRes.body.resetSessionId,
      'Forgot Password initiates and dispatches recovery OTP',
      JSON.stringify(forgotInitRes.body)
    );

    const forgotVerifyRes = await request('POST', '/auth/forgot-password/verify', {
      resetSessionId: forgotInitRes.body.resetSessionId,
      otp: '123456'
    });
    assert(
      forgotVerifyRes.status === 200 && !!forgotVerifyRes.body.resetToken,
      'Forgot Password OTP verified -> Grants reset token'
    );

    // Test weak password rejection (min 12 chars + upper + lower + number + special)
    const weakResetRes = await request('POST', '/auth/forgot-password/reset', {
      resetToken: forgotVerifyRes.body.resetToken,
      newPassword: 'short',
      confirmPassword: 'short'
    });
    assert(
      weakResetRes.status === 400 && !!weakResetRes.body.errors,
      'Weak password (< 12 chars) rejected by enterprise password policy'
    );

    // Valid 12+ character compliant password
    const newGoodPass = 'KisanSecure#2026Master';
    const goodResetRes = await request('POST', '/auth/forgot-password/reset', {
      resetToken: forgotVerifyRes.body.resetToken,
      newPassword: newGoodPass,
      confirmPassword: newGoodPass
    });
    assert(
      goodResetRes.status === 200,
      'Compliant 12+ char password accepted and updated successfully',
      JSON.stringify(goodResetRes.body)
    );

    // Verify login with new password
    const loginWithNewPassRes = await request('POST', '/auth/login', {
      role: 'farmer',
      identifier: '9876543210',
      password: newGoodPass,
      skipOtp: true
    });
    assert(
      loginWithNewPassRes.status === 200 && !!loginWithNewPassRes.body.token,
      'Login with newly reset password succeeds!'
    );

    // Restore original demo password so other tests and demo usage remain unaffected
    const bcrypt = require('bcryptjs');
    const origHash = await bcrypt.hash('Kisan@123', 10);
    await Users.updateOne({ mobile: '9876543210' }, { password: origHash });

    console.log('===============================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
};

runAuthTests();
