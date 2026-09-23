/**
 * Comprehensive Automated Test Suite for Assisted Farmer Token Booking
 * SmartProcure — SIH 2026 PS 26032
 */
const http = require('http');

const BASE_URL = 'http://localhost:7008';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log('🌾 Starting Assisted Farmer Token Booking Test Suite...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      testsFailed++;
    }
  };

  try {
    // 1. Officer Login
    console.log('1. Testing Officer Login...');
    const officerLoginRes = await request('/api/auth/login', 'POST', {
      identifier: 'officer@kpms.gov.in',
      password: 'Officer@123',
      role: 'officer',
      skipOtp: true
    });
    assert(officerLoginRes.status === 200 && officerLoginRes.data.token, 'Officer login successful');
    const officerToken = officerLoginRes.data.token;
    const officerUser = officerLoginRes.data.user;

    // 2. Farmer Login (to test access prevention & my-bookings visibility)
    console.log('\n2. Testing Farmer Login...');
    const farmerLoginRes = await request('/api/auth/login', 'POST', {
      identifier: '9876543210',
      password: 'Kisan@123',
      role: 'farmer',
      skipOtp: true
    });
    assert(farmerLoginRes.status === 200 && farmerLoginRes.data.token, 'Farmer login successful');
    const farmerToken = farmerLoginRes.data.token;

    // 3. Test Officer Dashboard with Assisted Bookings KPIs
    console.log('\n3. Testing Officer Dashboard & Assisted KPIs...');
    const dashRes = await request('/api/officer/dashboard', 'GET', null, officerToken);
    assert(dashRes.status === 200 && dashRes.data.success, 'Officer dashboard returned 200 OK');
    assert(dashRes.data.stats && typeof dashRes.data.stats.assistedBookingsToday === 'number', 'Assisted bookings today KPI present');
    assert(dashRes.data.stats && typeof dashRes.data.stats.totalAssistedBookings === 'number', 'Total assisted bookings KPI present');

    // 4. Test Universal Farmer Search (Masked Aadhaar)
    console.log('\n4. Testing Universal Farmer Search (Privacy Masking)...');
    const searchRes = await request('/api/officer/farmers/search?q=Ramesh', 'GET', null, officerToken);
    assert(searchRes.status === 200 && searchRes.data.success, 'Farmer search returned 200 OK');
    const ramesh = searchRes.data.data.find(f => f.fullName.includes('Ramesh') || f.farmerId.includes('FRM'));
    assert(!!ramesh, 'Found farmer record in database');
    if (ramesh) {
      assert(ramesh.maskedAadhaar && ramesh.maskedAadhaar.startsWith('XXXX-XXXX-'), 'Aadhaar is properly masked: ' + ramesh.maskedAadhaar);
      assert(ramesh.isEligibleForBooking === true, 'Farmer is marked eligible for booking');
    }

    // 5. Test Assisted Farmer Registration
    console.log('\n5. Testing Assisted Farmer Registration...');
    const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testAadhaar = `${Math.floor(200000000000 + Math.random() * 700000000000)}`;
    const assistedRegRes = await request('/api/officer/farmers/register-assisted', 'POST', {
      fullName: 'Gopal Kisan Assisted',
      fatherName: 'Hariram Kisan',
      mobile: testMobile,
      aadhaarNumber: testAadhaar,
      state: 'Madhya Pradesh',
      district: 'Bhopal',
      village: 'Kalyanpur',
      totalLandArea: 6.5,
      primaryCrop: 'Wheat',
      bankName: 'Bank of Baroda',
      ifscCode: 'BARB0BHOPAL',
      accountNumber: '987654321012'
    }, officerToken);
    assert(assistedRegRes.status === 201 && assistedRegRes.data.success, 'Assisted farmer registration created successfully');
    assert(assistedRegRes.data.data && assistedRegRes.data.data.farmerId, 'Assigned unique Farmer ID: ' + (assistedRegRes.data.data && assistedRegRes.data.data.farmerId));

    // Test Duplicate Mobile Prevention in Assisted Registration
    const dupRegRes = await request('/api/officer/farmers/register-assisted', 'POST', {
      fullName: 'Duplicate Mobile Farmer',
      mobile: testMobile
    }, officerToken);
    assert(dupRegRes.status === 400 && dupRegRes.data.isDuplicate, 'Blocked duplicate mobile registration attempt');

    // 6. Test Assisted Slot Booking (Consent, Capacity & Token Generation)
    console.log('\n6. Testing Assisted Slot Booking Creation...');
    const targetFarmer = assistedRegRes.data.data;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Attempt without consent (Must fail)
    const noConsentRes = await request('/api/officer/bookings/assisted', 'POST', {
      farmerId: targetFarmer.farmerId,
      centerId: 'CTR-01',
      cropName: 'Wheat (Sharbati)',
      quantity: 40,
      date: tomorrow,
      timeSlot: '10:00 AM - 10:30 AM',
      farmerConsentConfirmed: false
    }, officerToken);
    assert(noConsentRes.status === 400, 'Blocked booking without farmer consent');

    // Booking with consent (Must succeed)
    const assistedBkgRes = await request('/api/officer/bookings/assisted', 'POST', {
      farmerId: targetFarmer.farmerId,
      centerId: 'CTR-01',
      cropName: 'Wheat (Sharbati)',
      quantity: 40,
      date: tomorrow,
      timeSlot: '10:00 AM - 10:30 AM',
      farmerConsentConfirmed: true,
      vehicleNumber: 'MP-04-TR-9999',
      remarks: 'Farmer visited counter with son, assisted on-spot',
      overrideReason: ''
    }, officerToken);
    assert(assistedBkgRes.status === 201 && assistedBkgRes.data.success, 'Assisted booking created successfully');
    const createdBooking = assistedBkgRes.data.data;
    assert(createdBooking.bookingNumber && createdBooking.bookingNumber.startsWith('BKG-'), 'Valid booking number assigned: ' + createdBooking.bookingNumber);
    assert(createdBooking.tokenNumber && createdBooking.tokenNumber.startsWith('TOKEN-'), 'Official token generated: ' + createdBooking.tokenNumber);
    assert(createdBooking.bookingSource === 'OFFICER_ASSISTED', 'bookingSource is OFFICER_ASSISTED');
    assert(createdBooking.farmerConsentConfirmed === true, 'Consent is recorded as true');
    assert(createdBooking.qrCodeDataUrl && createdBooking.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'Valid QR code generated');

    // 7. Test Duplicate Booking Prevention (Same farmer, same date, same crop)
    console.log('\n7. Testing Duplicate Booking Prevention...');
    const duplicateBkgRes = await request('/api/officer/bookings/assisted', 'POST', {
      farmerId: targetFarmer.farmerId,
      centerId: 'CTR-01',
      cropName: 'Wheat (Sharbati)',
      quantity: 20,
      date: tomorrow,
      timeSlot: '11:00 AM - 11:30 AM',
      farmerConsentConfirmed: true
    }, officerToken);
    assert(duplicateBkgRes.status === 400 && duplicateBkgRes.data.isDuplicate, 'Blocked duplicate active booking on same date');

    // 8. Test Over-Capacity Prevention
    console.log('\n8. Testing Over-Capacity Volume Prevention...');
    const overCapRes = await request('/api/officer/bookings/assisted', 'POST', {
      farmerId: targetFarmer.farmerId,
      centerId: 'CTR-01',
      cropName: 'Gram (Chana)',
      quantity: 99999, // Exceeds 300 Q daily capacity
      date: tomorrow,
      timeSlot: '02:00 PM - 02:30 PM',
      farmerConsentConfirmed: true
    }, officerToken);
    assert(overCapRes.status === 400, 'Blocked booking exceeding center intake capacity');

    // 9. Test Role Authorization Guard (Farmer cannot access officer assisted booking API)
    console.log('\n9. Testing Security Role Guard (Farmer access to officer API)...');
    const unauthorizedRes = await request('/api/officer/bookings/assisted', 'POST', {
      farmerId: targetFarmer.farmerId,
      centerId: 'CTR-01',
      cropName: 'Wheat',
      quantity: 10,
      date: tomorrow,
      timeSlot: '09:00 AM - 09:30 AM',
      farmerConsentConfirmed: true
    }, farmerToken);
    assert(unauthorizedRes.status === 403, 'Denied farmer access to /api/officer/bookings/assisted (HTTP 403 Forbidden)');

    // 10. Test Officer Assisted History API
    console.log('\n10. Testing Officer Assisted History & Metrics API...');
    const historyRes = await request('/api/officer/assisted-bookings', 'GET', null, officerToken);
    assert(historyRes.status === 200 && historyRes.data.success, 'Assisted bookings history returned 200 OK');
    assert(historyRes.data.data.some(b => b.bookingNumber === createdBooking.bookingNumber), 'Created booking found in officer assisted history');
    assert(historyRes.data.metrics && historyRes.data.metrics.total > 0, 'Metrics summary calculated correctly');

    // 11. Test Live Queue & Gate Check-in Integration
    console.log('\n11. Testing Gate Check-in & Live Queue Integration for Assisted Token...');
    const checkinRes = await request('/api/queue/check-in', 'POST', {
      bookingNumber: createdBooking.bookingNumber,
      centerId: 'CTR-01',
      isPriority: false
    }, officerToken);
    assert(checkinRes.status === 201 && checkinRes.data.success, 'Assisted booking checked in at gate successfully');
    assert(checkinRes.data.data && checkinRes.data.data.tokenNumber, 'Assigned live queue token: ' + (checkinRes.data.data && checkinRes.data.data.tokenNumber));
    assert(checkinRes.data.data.assignedCounter || checkinRes.data.data.counterNumber, 'Assigned desk counter: ' + (checkinRes.data.data && (checkinRes.data.data.assignedCounter || checkinRes.data.data.counterNumber)));

    // 12. Test Cancellation of Assisted Booking with Reason & Audit Log
    console.log('\n12. Testing Assisted Booking Cancellation & Audit Logging...');
    // Create another booking to cancel
    const cancelTargetBkg = await request('/api/officer/bookings/assisted', 'POST', {
      farmerId: targetFarmer.farmerId,
      centerId: 'CTR-01',
      cropName: 'Mustard (Sarson)',
      quantity: 15,
      date: tomorrow,
      timeSlot: '03:00 PM - 03:30 PM',
      farmerConsentConfirmed: true
    }, officerToken);

    if (cancelTargetBkg.data && cancelTargetBkg.data.data) {
      const cancelId = cancelTargetBkg.data.data._id;
      const cancelRes = await request(`/api/officer/assisted-bookings/${cancelId}/cancel`, 'POST', {
        reason: 'Farmer transport breakdown, requested slot release'
      }, officerToken);
      assert(cancelRes.status === 200 && cancelRes.data.success, 'Assisted booking cancelled with audit reason');
      assert(cancelRes.data.data && cancelRes.data.data.status === 'Cancelled', 'Booking marked as Cancelled');
    }

    // 13. Test Super Admin Analytics & Dashboard Inclusion
    console.log('\n13. Testing Super Admin Dashboard & System Analytics...');
    const adminLoginRes = await request('/api/auth/login', 'POST', {
      identifier: 'admin@kpms.gov.in',
      password: 'Admin@123',
      role: 'admin',
      skipOtp: true
    });
    if (adminLoginRes.status === 200 && adminLoginRes.data.token) {
      const adminToken = adminLoginRes.data.token;
      const adminDashRes = await request('/api/admin/dashboard', 'GET', null, adminToken);
      assert(adminDashRes.status === 200 && adminDashRes.data.success, 'Admin dashboard returned 200 OK');
      assert(typeof adminDashRes.data.kpis.totalAssistedBookings === 'number', 'totalAssistedBookings present in admin KPIs');

      const adminAnalyticsRes = await request('/api/admin/analytics', 'GET', null, adminToken);
      assert(adminAnalyticsRes.status === 200 && adminAnalyticsRes.data.success, 'Admin analytics returned 200 OK');
      assert(adminAnalyticsRes.data.data.bookingSources && typeof adminAnalyticsRes.data.data.bookingSources.officerAssisted === 'number', 'bookingSources breakdown included in analytics');
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log(`========================================\n`);

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
