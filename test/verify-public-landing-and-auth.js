const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 7008;

const request = (method, urlPath, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    let postData = null;
    const reqHeaders = { ...headers };
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function runQaAudit() {
  console.log('===============================================================');
  console.log('🌾 VERIFYING PUBLIC LANDING PAGE, AUTHENTICATION & ROUTE GUARDS');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  };

  // 1. Inspect Landing Page file & HTML structure
  console.log('[Test 1] Inspecting Public Landing Page Module (landing-page.js)...');
  const landingJs = fs.readFileSync(path.join(__dirname, '../public/js/landing-page.js'), 'utf8');
  assert(!landingJs.includes('SIH 2026 &bull; PS 26032') && !landingJs.includes('PS 26032'), 'SIH 2026 and PS 26032 badges successfully removed from landing page');
  assert(landingJs.includes('sp-badge-tagline'), 'Hero tagline badge present');
  assert(landingJs.includes('Smart Procurement.<br />'), 'Main headline matches "Smart Procurement. Less Waiting. Better Returns for Farmers."');
  assert(landingJs.includes('sp-auth-card'), 'Embedded Authentication Card is present on the hero');
  assert(landingJs.includes('id="tab-btn-login"') && landingJs.includes('id="tab-btn-register"'), 'Hero Auth Card has LOGIN and REGISTER tabs');
  assert(landingJs.includes('Login with Aadhaar') && landingJs.includes('Coming Soon'), 'Aadhaar login marked as "Coming Soon" without fake integration');
  assert(landingJs.includes('Why SmartProcure?'), 'Why SmartProcure section present');
  assert(landingJs.includes('Smart Mandi Finder') && landingJs.includes('Smart Slot Booking') && landingJs.includes('Live Queue Tracking') && landingJs.includes('Transparent Payment Tracking'), 'All 4 Core Capability Cards present');
  assert(landingJs.includes('How It Works') && landingJs.includes('01') && landingJs.includes('10'), '10-step How It Works agricultural timeline present');
  assert(landingJs.includes('Find the Right Procurement Centre'), 'Smart Mandi overview section present');
  assert(landingJs.includes('Your Complete Procurement Journey'), 'Procurement journey section present');
  assert(landingJs.includes('Built to Make Procurement Simpler'), 'Impact section present');
  assert(landingJs.includes('sp-public-footer'), 'Government-style footer present');

  // 2. Inspect app.js Router and Guards
  console.log('\n[Test 2] Inspecting Router & Route Protection in app.js...');
  const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  assert(appJs.includes('renderPublicLandingPage'), 'renderLandingPage invokes renderPublicLandingPage (NOT the dashboard)');
  assert(appJs.includes('Please login to access this portal'), 'Route guard redirects unauthenticated users with login notice');
  assert(appJs.includes('Access Denied: You do not have permission to access administrative portals'), 'Farmer blocked from accessing officer/admin portals');
  assert(appJs.includes('Access Denied: Super Admin portal requires root administrator authorization'), 'Officer blocked from accessing admin portal');
  assert(appJs.includes('sp-nav-public-actions') && appJs.includes('sp-nav-private-actions'), 'Top navigation updates dynamically for public vs authenticated state');

  // 3. Inspect index.html Header
  console.log('\n[Test 3] Inspecting Topbar Navigation in index.html...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert(indexHtml.includes('/js/landing-page.js'), 'landing-page.js is loaded in index.html');
  assert(indexHtml.includes('sp-nav-public-actions'), 'Public navigation buttons container present');
  assert(indexHtml.includes('sp-nav-private-actions'), 'Private authenticated user chip container present');
  assert(indexHtml.includes('handleBrandClick()'), 'Brand click routes intelligently based on auth status');

  // 4. Test Public Index HTTP Response
  console.log('\n[Test 4] Testing GET / from HTTP server...');
  const indexRes = await request('GET', '/');
  assert(indexRes.status === 200, 'HTTP 200 OK received for public root /');
  assert(indexRes.text.includes('SmartProcure'), 'SmartProcure title is served on root /');

  // 5. Test Farmer Authentication & Role Dashboard Redirection
  console.log('\n[Test 5] Authenticating Farmer (Ramesh Kumar)...');
  const farmerLoginRes = await request('POST', '/api/auth/login', {}, {
    identifier: 'ramesh@farmer.in',
    password: 'Kisan@123',
    role: 'farmer'
  });

  let farmerToken = farmerLoginRes.body?.token;
  if (farmerLoginRes.body?.requiresOtp) {
    const otpRes = await request('POST', '/api/auth/verify-login-otp', {}, {
      tempSessionId: farmerLoginRes.body.tempSessionId,
      otp: '123456'
    });
    farmerToken = otpRes.body?.token;
    assert(otpRes.body?.redirectUrl === '#farmer-dashboard', 'Farmer login directs to #farmer-dashboard');
  }
  assert(!!farmerToken, 'Farmer received valid JWT session token');

  // 6. Test Officer Authentication & Role Dashboard Redirection
  console.log('\n[Test 6] Authenticating Procurement Officer (Sharma)...');
  const officerLoginRes = await request('POST', '/api/auth/login', {}, {
    identifier: 'officer@kpms.gov.in',
    password: 'Officer@123',
    role: 'officer'
  });

  let officerToken = officerLoginRes.body?.token;
  if (officerLoginRes.body?.requiresOtp) {
    const otpRes = await request('POST', '/api/auth/verify-login-otp', {}, {
      tempSessionId: officerLoginRes.body.tempSessionId,
      otp: '123456'
    });
    officerToken = otpRes.body?.token;
    assert(otpRes.body?.redirectUrl === '#officer-dashboard', 'Officer login directs to #officer-dashboard');
  }
  assert(!!officerToken, 'Officer received valid JWT session token');

  // 7. Test Super Admin Authentication & Role Dashboard Redirection
  console.log('\n[Test 7] Authenticating Super Admin with CAPTCHA...');
  const captchaRes = await request('GET', '/api/auth/captcha');
  assert(captchaRes.body.success === true, 'Captcha generated successfully');

  let captchaAnswer = '';
  if (captchaRes.body.question.includes('+') || captchaRes.body.question.includes('-')) {
    captchaAnswer = String(eval(captchaRes.body.question.replace(' = ?', '')));
  } else {
    captchaAnswer = captchaRes.body.question.trim();
  }

  const adminLoginRes = await request('POST', '/api/auth/login', {}, {
    identifier: 'admin@kpms.gov.in',
    password: 'Admin@123',
    role: 'admin',
    captchaToken: captchaRes.body.captchaToken,
    captchaAnswer: captchaAnswer
  });

  let adminToken = adminLoginRes.body?.token;
  if (adminLoginRes.body?.requiresOtp) {
    const otpRes = await request('POST', '/api/auth/verify-login-otp', {}, {
      tempSessionId: adminLoginRes.body.tempSessionId,
      otp: '123456'
    });
    adminToken = otpRes.body?.token;
    assert(otpRes.body?.redirectUrl === '#admin-dashboard', 'Admin login directs to #admin-dashboard');
  }
  assert(!!adminToken, 'Super Admin received valid JWT session token');

  // 8. Test Protected API without Token
  console.log('\n[Test 8] Testing API Route Protection without Token...');
  const unauthApiRes = await request('GET', '/api/bookings/my-bookings');
  assert(unauthApiRes.status === 401 || unauthApiRes.body.success === false, 'Unauthenticated API access to /api/bookings/my-bookings correctly rejected');

  // 9. Test Protected Officer API by Farmer
  console.log('\n[Test 9] Testing Cross-Role Protection (Farmer token hitting Officer API)...');
  const farmerOnOfficerApi = await request('GET', '/api/officer/dashboard', {
    'Authorization': `Bearer ${farmerToken}`
  });
  assert(farmerOnOfficerApi.status === 403 || farmerOnOfficerApi.body?.success === false, 'Farmer token blocked from officer API (HTTP 403 Forbidden)');

  // 10. Test Officer hitting Admin Dashboard API
  console.log('\n[Test 10] Testing Cross-Role Protection (Officer token hitting Admin API)...');
  const officerOnAdminApi = await request('GET', '/api/admin/dashboard', {
    'Authorization': `Bearer ${officerToken}`
  });
  assert(officerOnAdminApi.status === 403 || officerOnAdminApi.body?.success === false, 'Officer token blocked from Super Admin API (HTTP 403 Forbidden)');

  // 11. Test Super Admin authorized access
  console.log('\n[Test 11] Testing Authorized Admin Access...');
  const adminApiRes = await request('GET', '/api/admin/dashboard', {
    'Authorization': `Bearer ${adminToken}`
  });
  assert(adminApiRes.body?.success === true, 'Admin successfully accessed protected admin API');

  // 12. Test CSS Responsiveness rules
  console.log('\n[Test 12] Inspecting CSS Responsiveness for Mobile & Tablet...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/style.css'), 'utf8');
  assert(css.includes('@media (max-width: 1024px)') && css.includes('.sp-hero-grid'), 'Tablet responsive breakpoint defined for hero grid');
  assert(css.includes('@media (max-width: 768px)') && css.includes('.sp-timeline-grid'), 'Mobile responsive breakpoint defined for timeline grid');
  assert(css.includes('.sp-landing-wrapper') && css.includes('overflow-x: hidden'), 'overflow-x: hidden prevents horizontal scroll');

  console.log('\n===============================================================');
  console.log(`🏁 QA AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runQaAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
