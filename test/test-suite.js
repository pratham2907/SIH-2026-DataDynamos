const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 KPMS COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    console.log('\n[1] Testing System Health & Server Connectivity...');
    const health = await makeRequest('GET', '/health');
    assert(health.status === 200 && health.data.status === 'UP', 'Server responds UP on /api/health');

    // 2. Auth Tests
    console.log('\n[2] Testing Authentication & 5-Step KYC...');
    const farmerLogin = await makeRequest('POST', '/auth/login', {
      identifier: 'ramesh@farmer.in',
      password: 'Kisan@123',
      role: 'farmer'
    });
    assert(farmerLogin.status === 200 && farmerLogin.data.success && farmerLogin.data.token, 'Farmer login generates valid JWT token');
    const farmerToken = farmerLogin.data ? farmerLogin.data.token : null;

    const officerLogin = await makeRequest('POST', '/auth/login', {
      identifier: 'officer@kpms.gov.in',
      password: 'Officer@123',
      role: 'officer'
    });
    assert(officerLogin.status === 200 && officerLogin.data.success, 'Procurement Officer login succeeds');
    const officerToken = officerLogin.data ? officerLogin.data.token : null;

    const adminLogin = await makeRequest('POST', '/auth/login', {
      identifier: 'admin@kpms.gov.in',
      password: 'Admin@123',
      role: 'admin'
    });
    assert(adminLogin.status === 200 && adminLogin.data.success, 'Super Admin login succeeds');
    const adminToken = adminLogin.data ? adminLogin.data.token : null;

    // Test Duplicate Registration Prevention
    const dupReg = await makeRequest('POST', '/auth/register', {
      fullName: 'Duplicate Farmer',
      mobile: '9876543210',
      aadhaarNumber: '382947193021',
      password: 'Pass@123'
    });
    assert(dupReg.status === 400 && !dupReg.data.success, 'Duplicate registration is strictly rejected');

    // 3. Smart Slot Booking
    console.log('\n[3] Testing Smart Slot Booking Engine...');
    const centers = await makeRequest('GET', '/bookings/centers');
    assert(centers.status === 200 && centers.data.data.length > 0, 'Procurement centers list returned');

    const today = new Date().toISOString().split('T')[0];
    const slots = await makeRequest('GET', `/bookings/slots?centerId=CTR-01&date=${today}`);
    assert(slots.status === 200 && slots.data.slots.length > 0, 'Dynamic slot intervals generated with live availability');

    const myBookings = await makeRequest('GET', '/bookings/my-bookings', null, {
      'Authorization': `Bearer ${farmerToken}`
    });
    assert(myBookings.status === 200 && Array.isArray(myBookings.data.data), 'Farmer bookings retrieved');

    // 4. Live Queue & QR Check-in
    console.log('\n[4] Testing QR Check-In & Multi-Counter Live Queue...');
    const queueStatus = await makeRequest('GET', '/queue/farmer-status', null, {
      'Authorization': `Bearer ${farmerToken}`
    });
    assert(queueStatus.status === 200, 'Farmer queue position & wait time returned');

    const liveQueue = await makeRequest('GET', '/queue/live?centerId=CTR-01', null, {
      'Authorization': `Bearer ${officerToken}`
    });
    assert(liveQueue.status === 200 && liveQueue.data.queues.length > 0, 'Officer live queue state retrieved');

    const displayBoard = await makeRequest('GET', '/queue/display-board?centerId=CTR-01');
    assert(displayBoard.status === 200 && displayBoard.data.success, 'Public TV display board API operational');

    // 5. Procurement Workflow
    console.log('\n[5] Testing Digital Weighbridge & Quality Inspection...');
    const procContext = await makeRequest('GET', '/procurement/context?tokenNumber=A001', null, {
      'Authorization': `Bearer ${officerToken}`
    });
    assert(procContext.status === 200 && procContext.data.data.suggestedMSP, 'Procurement pre-filled context and MSP calculated');

    // 6. Payments & Direct Benefit Transfer (DBT)
    console.log('\n[6] Testing DBT Payments & Approvals...');
    const farmerPayments = await makeRequest('GET', '/payments/farmer', null, {
      'Authorization': `Bearer ${farmerToken}`
    });
    assert(farmerPayments.status === 200 && farmerPayments.data.stats.totalEarned > 0, 'Farmer DBT payment ledger retrieved');

    const allPayments = await makeRequest('GET', '/payments/all', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert(allPayments.status === 200 && allPayments.data.totalValue > 0, 'Admin treasury payment disbursements retrieved');

    // 7. Super Admin & National Government Control
    console.log('\n[7] Testing Super Admin Control Center & Live Map...');
    const adminDash = await makeRequest('GET', '/admin/dashboard', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert(adminDash.status === 200 && adminDash.data.kpis.totalFarmers > 0, 'National KPIs returned');

    const mapData = await makeRequest('GET', '/admin/map-data');
    assert(mapData.status === 200 && mapData.data.markers.length > 0, 'Leaflet map crowd markers returned');

    // 8. AI Engine & Kisan Sahayak Chatbot
    console.log('\n[8] Testing AI Heuristics & Multilingual Chatbot...');
    const aiDash = await makeRequest('GET', '/ai/dashboard');
    assert(aiDash.status === 200 && aiDash.data.data.weatherAlerts.length > 0, 'AI congestion & weather forecasts generated');

    const aiChat = await makeRequest('POST', '/ai/chat', { query: 'How to book a slot?' });
    assert(aiChat.status === 200 && aiChat.data.reply && aiChat.data.reply.length > 10, 'Kisan Sahayak AI chatbot returns intelligent guidance');

    const voiceIntent = await makeRequest('POST', '/ai/voice', { voiceText: 'Book a slot for wheat' });
    assert(voiceIntent.status === 200 && voiceIntent.data.action === 'NAVIGATE_BOOKING', 'Voice intent parsed correctly');

    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
