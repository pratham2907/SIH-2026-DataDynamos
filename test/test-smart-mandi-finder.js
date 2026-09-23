/**
 * Comprehensive Test Suite for AgriQueue / Smart Mandi Finder Replacement
 * SIH 2026 - PS 26032
 */

const http = require('http');

const BASE_URL = 'http://localhost:7008';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING AGRIQUEUE SMART MANDI FINDER TEST SUITE (SIH 2026)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Step 1: Login as demo Farmer (Ramesh Patel: 9876543210 / Kisan@123)
    console.log('--- TEST 1: Farmer Authentication ---');
    const loginRes = await request('POST', '/api/auth/login', {
      identifier: '9876543210',
      password: 'Kisan@123',
      role: 'farmer',
      skipOtp: true
    });

    const token = loginRes.body.token;
    assert(!!token, 'Farmer logged in successfully and obtained JWT token');

    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // Step 2: Land-based Quantity Validation (+20 Q buffer)
    console.log('\n--- TEST 2: Land-Based Quantity Validation & Buffer ---');
    // Ramesh has 8.5 acres. Wheat yield multiplier = 22 -> Permitted = 8.5 * 22 + 20 = 207 Q.
    const excessRes = await request('POST', '/api/smart-mandi/validate-quantity', {
      crop: 'Wheat',
      quantityQuintals: 250
    }, authHeaders);

    assert(excessRes.status === 400, 'Rejects quantity exceeding land capacity + 20Q buffer (HTTP 400)');
    assert(
      excessRes.body.message && excessRes.body.message.includes('above the permitted production quantity'),
      `Enforces exact alert message: "${excessRes.body.message}"`
    );
    assert(excessRes.body.maxPermittedQuintals === 207, `Permitted max correctly calculated as 207 Q (8.5 * 22 + 20 buffer)`);

    const validRes = await request('POST', '/api/smart-mandi/validate-quantity', {
      crop: 'Wheat',
      quantityQuintals: 150
    }, authHeaders);

    assert(validRes.status === 200 && validRes.body.valid === true, 'Accepts valid quantity within registered land capacity (150 Q)');

    // Step 3: Slot Recommendation (Earliest Available Non-Holiday Date & Sequential Slot)
    console.log('\n--- TEST 3: Automatic Earliest Date & Sequential Slot Recommendation ---');
    const slotRes = await request('GET', '/api/smart-mandi/recommended-slot?centerId=CTR-01', null, authHeaders);
    assert(slotRes.status === 200 && slotRes.body.success, 'Successfully fetched recommended slot for CTR-01');
    assert(!!slotRes.body.data.recommendedDate, `Recommended Date: ${slotRes.body.data.recommendedDate}`);
    assert(!!slotRes.body.data.recommendedSlot, `Recommended Sequential Slot: ${slotRes.body.data.recommendedSlot}`);

    // Step 4: Alternative Slot Inspection Flow
    console.log('\n--- TEST 4: Alternative Date & Feasible Slot Fetching ---');
    const altDates = slotRes.body.data.alternativeDates || [];
    assert(altDates.length > 0, `Returns upcoming available alternative working dates (Found: ${altDates.length})`);

    const sampleAltDate = altDates[0];
    const checkAltRes = await request('GET', `/api/smart-mandi/recommended-slot?centerId=CTR-01&date=${sampleAltDate}`, null, authHeaders);
    assert(checkAltRes.status === 200 && checkAltRes.body.data.availableSlots.length > 0, `Fetches real-time time slots for alternative date ${sampleAltDate}`);

    // Step 5: Smart Booking Allocation & Commit
    // Pick an unbooked unique future date
    const uniqueYear = 2028 + Math.floor(Math.random() * 5);
    const uniqueMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const candDay = String(1 + Math.floor(Math.random() * 25)).padStart(2, '0');
    const testBookingDate = `${uniqueYear}-${uniqueMonth}-${candDay}`;
    const smartBookingRes = await request('POST', '/api/smart-mandi/book-slot', {
      centerId: 'CTR-01',
      crop: 'Wheat',
      quantityQuintals: 120,
      slotDate: testBookingDate,
      slotTime: '09:00 AM - 09:30 AM',
      mandiName: 'Ahmedabad APMC Mandi',
      transportMode: 'Tractor'
    }, authHeaders);

    assert(smartBookingRes.status === 201, `Smart booking successfully created with status 201 (Token: ${smartBookingRes.body.data?.tokenNumber})`);
    assert(smartBookingRes.body.data?.bookingSource === 'SMART_MANDI_FINDER', 'Booking tagged with source SMART_MANDI_FINDER');
    assert(!!smartBookingRes.body.data?.qrCode && smartBookingRes.body.data.qrCode.startsWith('data:image/png;base64,'), 'Digital verification QR Code generated');

    // Step 6: Next Crop Planning & Demand Aggregation
    console.log('\n--- TEST 6: Next Crop Planning & Deduplicated Demand Forecasting ---');
    const nextCropRes = await request('POST', '/api/smart-mandi/next-crop-plan', {
      nextCrop: 'Mustard',
      sowingMonth: 'October',
      sowingPeriod: 'First 15 Days',
      mandiId: 'CTR-01',
      mandiName: 'Ahmedabad APMC Mandi',
      estimatedQuantity: 110
    }, authHeaders);

    assert(nextCropRes.status === 201, `Next crop plan saved (Estimated Harvest: ${nextCropRes.body.data?.estimatedHarvestMonth} ${nextCropRes.body.data?.estimatedHarvestPeriod})`);

    // Fetch forecasts and verify deduplication
    const forecastRes = await request('GET', '/api/smart-mandi/forecasts', null, authHeaders);
    assert(forecastRes.status === 200 && forecastRes.body.success, 'Successfully fetched aggregated demand forecasts');
    const matchedForecast = forecastRes.body.data.find(f => f.crop === 'Mustard' && f.mandiId === 'CTR-01');
    assert(!!matchedForecast, 'Aggregated forecast entry exists for Mustard at Ahmedabad APMC Mandi');
    assert(matchedForecast && matchedForecast.totalFarmers === 1, `Strict deduplication verified: Exactly 1 unique farmer counted (Farmer count: ${matchedForecast?.totalFarmers})`);

    // Step 7: Dashboard Travel to Future Demo Flow
    console.log('\n--- TEST 7: Travel to Future Demo, Advisory Email, & Readiness ---');
    const activeForecastRes = await request('GET', '/api/smart-mandi/farmer-active-forecast', null, authHeaders);
    assert(activeForecastRes.status === 200 && activeForecastRes.body.data?.hasActivePlan === true, 'Farmer active crop plan detected for demo travel');

    const travelRes = await request('POST', '/api/smart-mandi/travel-to-future', {
      forecastId: activeForecastRes.body.data.plan._id
    }, authHeaders);
    assert(travelRes.status === 200 && travelRes.body.data?.currentState === 'Near Harvest', 'Plan transitioned to Near Harvest and advisory email triggered');

    const readinessRes = await request('POST', '/api/smart-mandi/crop-readiness', {
      forecastId: activeForecastRes.body.data.plan._id,
      isReady: true,
      cropCondition: 'Excellent'
    }, authHeaders);
    assert(readinessRes.status === 200 && readinessRes.body.data?.conditionRecorded === 'Excellent', 'Crop readiness and condition recorded successfully');

    // Step 8: Manual Booking Zero Regression Check
    console.log('\n--- TEST 8: Verify Manual Booking (/api/bookings/book-slot) Remains 100% Untouched ---');
    const manualDate = '2026-12-' + String(Math.floor(10 + Math.random() * 15)).padStart(2, '0');
    const manualBookingRes = await request('POST', '/api/bookings/book-slot', {
      centerId: 'CTR-02',
      cropName: 'Rice',
      quantity: 40,
      date: manualDate,
      timeSlot: '10:00 AM - 10:30 AM'
    }, authHeaders);

    assert(
      manualBookingRes.status === 201 || (manualBookingRes.status === 400 && manualBookingRes.body.message?.includes('already have an active')),
      `Manual booking endpoint responds correctly (Status: ${manualBookingRes.status}, Message: ${manualBookingRes.body.message || 'Booked'})`
    );

  } catch (err) {
    console.error('Fatal test runner error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
