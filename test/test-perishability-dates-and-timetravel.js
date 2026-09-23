/**
 * Comprehensive Automated Tests for:
 * 1. Perishability-Based Alternative Date Selection (3, 15, 30-day windows; excludes Sundays/holidays)
 * 2. Time Travel & Future Crop Readiness (Not Decided Yet vs Actual Crop persistence, Questions 1, 2, 3, 5, 6)
 */
const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agriqueue-sih-2024-secret-key-production-ready';
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

let token = '';
let authHeaders = {};

async function loginFarmer() {
  const loginRes = await request('POST', '/api/auth/login', {
    identifier: '9876543210',
    password: 'Kisan@123',
    role: 'farmer',
    skipOtp: true
  });
  token = loginRes.body?.token;
  authHeaders = {
    'Authorization': `Bearer ${token}`
  };
}

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
};

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PERISHABILITY DATES & TIME TRAVEL SUITE');
  console.log('================================================================\n');

  await loginFarmer();
  assert(!!token, 'Farmer logged in successfully and obtained token');

  // PART 1: PERISHABILITY DATES
  console.log('--- PART 1: Perishability-Based Alternative Date Window Tests ---');

  // Test 1.1: High perishability crop (Tomato) -> 3-day window
  const tomatoDatesRes = await request('GET', '/api/smart-mandi/available-dates?centerId=CTR-01&cropName=Tomato&perishabilityLevel=High', null, authHeaders);
  assert(tomatoDatesRes.status === 200 && tomatoDatesRes.body.success, 'Fetched available dates for High perishability crop (Tomato)');
  assert(tomatoDatesRes.body.windowDays === 3, `Tomato windowDays is strictly 3 days (Actual: ${tomatoDatesRes.body.windowDays})`);
  assert(Array.isArray(tomatoDatesRes.body.dates) && tomatoDatesRes.body.dates.length <= 3, `Returned dates count <= 3 (Count: ${tomatoDatesRes.body.dates.length})`);
  
  // Verify no Sundays in returned dates
  const hasSundayTomato = tomatoDatesRes.body.dates.some(d => new Date(d).getDay() === 0);
  assert(!hasSundayTomato, 'Sundays strictly excluded from alternative dates (Tomato)');

  // Test 1.2: Moderate perishability crop (Potato) -> 15-day window
  const potatoDatesRes = await request('GET', '/api/smart-mandi/available-dates?centerId=CTR-01&cropName=Potato&perishabilityLevel=Moderate', null, authHeaders);
  assert(potatoDatesRes.status === 200 && potatoDatesRes.body.success, 'Fetched available dates for Moderate perishability crop (Potato)');
  assert(potatoDatesRes.body.windowDays === 15, `Potato windowDays is strictly 15 days (Actual: ${potatoDatesRes.body.windowDays})`);
  assert(Array.isArray(potatoDatesRes.body.dates) && potatoDatesRes.body.dates.length <= 15, `Returned dates count <= 15 (Count: ${potatoDatesRes.body.dates.length})`);
  const hasSundayPotato = potatoDatesRes.body.dates.some(d => new Date(d).getDay() === 0);
  assert(!hasSundayPotato, 'Sundays strictly excluded from alternative dates (Potato)');

  // Test 1.3: Low perishability crop (Wheat) -> 30-day window
  const wheatDatesRes = await request('GET', '/api/smart-mandi/available-dates?centerId=CTR-01&cropName=Wheat&perishabilityLevel=Low', null, authHeaders);
  assert(wheatDatesRes.status === 200 && wheatDatesRes.body.success, 'Fetched available dates for Low perishability crop (Wheat)');
  assert(wheatDatesRes.body.windowDays === 30, `Wheat windowDays is strictly 30 days (Actual: ${wheatDatesRes.body.windowDays})`);
  assert(Array.isArray(wheatDatesRes.body.dates) && wheatDatesRes.body.dates.length <= 30, `Returned dates count <= 30 (Count: ${wheatDatesRes.body.dates.length})`);
  const hasSundayWheat = wheatDatesRes.body.dates.some(d => new Date(d).getDay() === 0);
  assert(!hasSundayWheat, 'Sundays strictly excluded from alternative dates (Wheat)');


  // PART 2: TIME TRAVEL & FUTURE CROP READINESS
  console.log('\n--- PART 2: Future Crop Planning & Time Travel State Persistence ---');

  // Test 2.1: Option 2: [Not Decided Yet]
  console.log('Testing Option 2: [Not Decided Yet]...');
  const notDecidedRes = await request('POST', '/api/smart-mandi/next-crop-plan', {
    cropName: 'Not Decided Yet'
  }, authHeaders);
  assert(notDecidedRes.status === 200 && notDecidedRes.body.success, 'Saved future crop plan as "Not Decided Yet"');
  assert(notDecidedRes.body.futureCropState === 'NOT_DECIDED_YET', 'Backend state confirms futureCropState = NOT_DECIDED_YET');
  assert(notDecidedRes.body.timeTravelEligible === false, 'Backend confirms timeTravelEligible = false');

  // Check state endpoint
  const checkNotDecidedRes = await request('GET', '/api/smart-mandi/future-crop-state', null, authHeaders);
  assert(checkNotDecidedRes.status === 200 && checkNotDecidedRes.body.success, 'Fetched future-crop-state endpoint');
  assert(checkNotDecidedRes.body.futureCropState === 'NOT_DECIDED_YET', 'Persisted futureCropState is strictly NOT_DECIDED_YET');
  assert(checkNotDecidedRes.body.timeTravelEligible === false, 'Persisted timeTravelEligible is strictly false (Time Travel popup suppressed)');

  // Test 2.2: Option 1: Actual Crop Planning (Mustard, sowing in October, first 15 days)
  console.log('Testing Option 1: Actual Crop Planning...');
  const actualCropRes = await request('POST', '/api/smart-mandi/next-crop-plan', {
    cropName: 'Mustard',
    sowingMonth: 'October',
    sowingPeriod: 'first_15',
    estimatedQuantity: 65,
    mandiId: 'CTR-01',
    mandiName: 'APMC Central Mandi Ahmedabad'
  }, authHeaders);
  assert(actualCropRes.status === 201 && actualCropRes.body.success, 'Saved actual future crop plan (Mustard)');
  assert(actualCropRes.body.futureCropState === 'ACTUAL_CROP', 'Backend confirms futureCropState = ACTUAL_CROP');
  assert(actualCropRes.body.timeTravelEligible === true, 'Backend confirms timeTravelEligible = true');

  // Check state endpoint after saving actual crop
  const checkActualRes = await request('GET', '/api/smart-mandi/future-crop-state', null, authHeaders);
  console.log('checkActualRes.body:', JSON.stringify(checkActualRes.body));
  assert(checkActualRes.status === 200 && checkActualRes.body.success, 'Fetched future-crop-state after saving actual crop');
  assert(checkActualRes.body.futureCropState === 'ACTUAL_CROP', 'Persisted futureCropState is strictly ACTUAL_CROP');
  assert(checkActualRes.body.timeTravelEligible === true, 'Persisted timeTravelEligible is strictly true');
  const actualForecast = checkActualRes.body.forecast || checkActualRes.body.data?.plan || checkActualRes.body.data?.forecast;
  assert(actualForecast && (actualForecast.cropName === 'Mustard' || actualForecast.crop === 'Mustard'), 'Active forecast attached with Mustard');

  // Test 2.3: Travel to Future Simulation
  console.log('\n--- PART 3: Simulation & Crop Readiness Questionnaire ---');
  const travelRes = await request('POST', '/api/smart-mandi/travel-to-future', {
    forecastId: actualForecast?._id
  }, authHeaders);
  assert(travelRes.status === 200 && travelRes.body.success, 'Travel to future simulation succeeded');

  // Test 2.4: Questionnaire Submission with exact numbering: 1, 2, 3, 5, 6
  console.log('Testing Crop Readiness Questionnaire with exact questions 1, 2, 3, 5, 6...');
  const readinessPayload = {
    forecastId: actualForecast?._id,
    q1_cropReady: true,
    q2_productCleaned: true,
    q3_bagsPacked: true,
    q5_transportReady: true,
    q6_readyToMove: true,
    isReady: true,
    cropCondition: 'Excellent'
  };

  const readinessRes = await request('POST', '/api/smart-mandi/crop-readiness', readinessPayload, authHeaders);
  assert(readinessRes.status === 200 && readinessRes.body.success, 'Submitted crop readiness questionnaire');
  assert((readinessRes.body.data?.q1_cropReady ?? readinessRes.body.readinessAnswers?.q1_cropReady) === true, 'Q1: Is your crop ready? -> Recorded');
  assert((readinessRes.body.data?.q2_productCleaned ?? readinessRes.body.readinessAnswers?.q2_productCleaned) === true, 'Q2: Is the product cleaned? -> Recorded');
  assert((readinessRes.body.data?.q3_bagsPacked ?? readinessRes.body.readinessAnswers?.q3_bagsPacked) === true, 'Q3: Are the bags packed? -> Recorded');
  assert((readinessRes.body.data?.q5_transportReady ?? readinessRes.body.readinessAnswers?.q5_transportReady) === true, 'Q5: Is the transportation ready? -> Recorded');
  assert((readinessRes.body.data?.q6_readyToMove ?? readinessRes.body.readinessAnswers?.q6_readyToMove) === true, 'Q6: Is your product ready to move? -> Recorded');

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY WITH ZERO REGRESSIONS!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
