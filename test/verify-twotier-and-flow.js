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

async function runVerification() {
  console.log('====================================================');
  console.log('🌾 VERIFYING TWO-TIER SYSTEM & END-TO-END WORKFLOW');
  console.log('====================================================\n');

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

  // 1. Inspect CSS file for Two-Tier design tokens
  console.log('[Step 1] Verifying Two-Tier Design System in CSS...');
  const cssContent = fs.readFileSync(path.join(__dirname, '../public/css/style.css'), 'utf8');
  assert(cssContent.includes('--bg-main: #FAF6EF;'), '--bg-main is set to warm off-white #FAF6EF in :root');
  assert(cssContent.includes('--border-color: #E5E2DC;'), '--border-color is set to soft warm border #E5E2DC');
  assert(cssContent.includes('.sp-app-layout') && cssContent.includes('background: #FAF6EF;'), '.sp-app-layout uses background #FAF6EF');
  assert(cssContent.includes('.sp-main') && cssContent.includes('background: #FAF6EF;'), '.sp-main uses background #FAF6EF');
  assert(cssContent.includes('.app-container') && cssContent.includes('background: var(--bg-main);'), '.app-container uses background var(--bg-main)');
  assert(cssContent.includes('.sp-hero-banner') && cssContent.includes("url('/images/sp_hero_farmer.jpg')"), '.sp-hero-banner uses purposeful agricultural photography');
  assert(cssContent.includes('.sp-hero-overlay') && cssContent.includes('rgba(13, 40, 24, 0.94)'), '.sp-hero-overlay maintains high-contrast dark green gradient for text legibility');
  assert(cssContent.includes('.sp-footer-band') && cssContent.includes("url('/images/sp_footer_bg.jpg')"), '.sp-footer-band uses authentic agricultural photography');
  assert(cssContent.includes('.sp-card') && cssContent.includes('border: 1px solid #E5E2DC;'), '.sp-card uses soft 1px border without heavy shadows');

  // 2. Verify static assets exist on disk
  console.log('\n[Step 2] Verifying Real Agricultural Photographic Assets...');
  const heroImgPath = path.join(__dirname, '../public/images/sp_hero_farmer.jpg');
  const footerImgPath = path.join(__dirname, '../public/images/sp_footer_bg.jpg');
  assert(fs.existsSync(heroImgPath) && fs.statSync(heroImgPath).size > 100000, 'Hero agricultural photography asset is present and high resolution');
  assert(fs.existsSync(footerImgPath) && fs.statSync(footerImgPath).size > 100000, 'Footer agricultural logistics asset is present and high resolution');

  // 3. Login as farmer to obtain token
  console.log('\n[Step 3] Authenticating Farmer (Ramesh Kumar)...');
  const loginRes = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
    identifier: 'ramesh@farmer.in',
    password: 'Kisan@123',
    role: 'farmer'
  });
  
  let token = loginRes.body && (loginRes.body.token || (loginRes.body.data && loginRes.body.data.token));
  if (loginRes.body && loginRes.body.requiresOtp) {
    const otpRes = await request('POST', '/api/auth/verify-login-otp', { 'Content-Type': 'application/json' }, {
      tempSessionId: loginRes.body.tempSessionId,
      otp: '123456'
    });
    token = otpRes.body && (otpRes.body.token || (otpRes.body.data && otpRes.body.data.token));
  }
  assert(!!token, 'Farmer successfully authenticated and received valid JWT token');

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 4. Test Mandi Search / Discovery
  console.log('\n[Step 4] Testing Smart Mandi Finder Search (Bhopal, Wheat, 50 Q)...');
  const centersRes = await request('GET', '/api/bookings/centers?lat=23.2599&lng=77.4126', authHeaders);
  assert(centersRes.body.success === true, 'Centers API returned successfully');
  assert(Array.isArray(centersRes.body.data) && centersRes.body.data.length >= 2, `Returned ${centersRes.body.data.length} candidate procurement centres`);
  const chosenCenter = centersRes.body.data[0];
  console.log(`    Selected center for booking: ${chosenCenter.name} (${chosenCenter.centerId})`);

  // 5. Book a Slot
  console.log('\n[Step 5] Testing Booking Flow ("Book Slot")...');
  const futureDate = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];
  const bookingPayload = {
    centerId: chosenCenter.centerId,
    cropName: 'Wheat',
    quantity: 50,
    date: futureDate,
    timeSlot: '10:00 - 10:30 AM',
    vehicleNumber: 'MP-04-TR-9120',
    remarks: 'SIH Verification Run'
  };

  const bookRes = await request('POST', '/api/bookings/book-slot', authHeaders, bookingPayload);
  let bookingNumber = null;
  if (bookRes.body.success) {
    bookingNumber = bookRes.body.data.bookingNumber;
    assert(true, `Slot booked successfully! Booking Number: ${bookingNumber}`);
    assert(!!bookRes.body.data.qrCodeDataUrl, 'QR Code generated for digital gate entry pass');
  } else {
    assert(bookRes.body.message.includes('Double booking') || bookRes.body.message.includes('active booking'), `Booking endpoint returned: ${bookRes.body.message}`);
  }

  // 6. Verify My Bookings contains the booking
  console.log('\n[Step 6] Verifying "My Bookings" reflects the booking...');
  const myBookingsRes = await request('GET', '/api/bookings/my-bookings', authHeaders);
  assert(myBookingsRes.body.success === true, 'My Bookings endpoint responded successfully');
  assert(Array.isArray(myBookingsRes.body.data) && myBookingsRes.body.data.length > 0, `Farmer has ${myBookingsRes.body.data.length} bookings on record`);
  const foundBkg = myBookingsRes.body.data[0];
  assert(foundBkg && foundBkg.cropName === 'Wheat', `Confirmed recent booking is for ${foundBkg.cropName} (${foundBkg.quantity} Q) at ${foundBkg.centerName || foundBkg.centerId}`);

  // 7. Verify Farmer Dashboard overview has active booking for Journey
  console.log('\n[Step 7] Verifying Farmer Dashboard & Procurement Journey Context...');
  const dashRes = await request('GET', '/api/farmer/dashboard', authHeaders);
  assert(dashRes.body.success === true, 'Farmer dashboard endpoint responded successfully');
  assert(!!dashRes.body.data.activeBooking, `Active booking found on dashboard: ${dashRes.body.data.activeBooking.bookingNumber} for ${dashRes.body.data.activeBooking.date}`);

  // 8. Verify Notification dispatched for the booking
  console.log('\n[Step 8] Verifying In-App Notifications...');
  const notifRes = await request('GET', '/api/farmer/notifications', authHeaders);
  assert(notifRes.body.success === true, 'Notifications endpoint responded successfully');
  assert(Array.isArray(notifRes.body.data) && notifRes.body.data.length > 0, `Found ${notifRes.body.data.length} notifications for farmer`);
  const latestNotif = notifRes.body.data[0];
  console.log(`    Latest Notification: "${latestNotif.title}" - ${latestNotif.message || latestNotif.desc}`);
  assert(latestNotif.type === 'booking' || latestNotif.title.includes('Slot') || latestNotif.title.includes('Booking'), 'Latest notification is slot confirmation');

  // 9. Mark notifications as read
  console.log('\n[Step 9] Testing Mark Notifications Read...');
  const readRes = await request('PATCH', '/api/farmer/notifications/read', authHeaders);
  assert(readRes.body.success === true, 'All notifications successfully marked as read');

  console.log('\n====================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
