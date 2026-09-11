/**
 * 🌾 End-to-End Verification Test for Smart Mandi Dynamic Recommendations
 * Tests API + Engine + Decision Logic across multiple nationwide locations, crops, and quantities.
 */

const http = require('http');
const SmartBookingEngine = require('../public/js/smart-booking-engine.js');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING END-TO-END SMART MANDI DYNAMIC VERIFICATION');
  console.log('====================================================\n');

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
    // -------------------------------------------------------------
    // Test Case 1: Farmer in Guntur, AP | Crop: Tomato | Qty: 200 Q
    // -------------------------------------------------------------
    console.log('[Test 1] Testing Farmer in Guntur, AP with 200 Quintals Tomato...');
    const gunturOrigin = {
      location: 'Guntur, Andhra Pradesh',
      lat: 16.3067,
      lng: 80.4365,
      district: 'Guntur'
    };

    const gunturApiRes = await fetchJson(`http://localhost:7008/api/bookings/centers?lat=${gunturOrigin.lat}&lon=${gunturOrigin.lng}&radius=300`);
    assert(gunturApiRes.success === true, 'Backend returned centers for Guntur coordinates');
    assert(gunturApiRes.data.length > 0, `Returned ${gunturApiRes.data.length} candidate centers near Guntur`);

    const gunturResult = SmartBookingEngine.runSmartProcurementAlgorithm(
      'Tomato',
      200,
      gunturApiRes.data,
      gunturOrigin,
      {}
    );

    const gunturTop = gunturResult.scenarios.recommended;
    assert(gunturTop.district === 'Guntur' || gunturTop.state === 'Andhra Pradesh', `Top recommended mandi is in AP/Guntur (Got: ${gunturTop.shortName}, ${gunturTop.district})`);
    assert(gunturTop.distance < 50, `Distance to recommended mandi is local (${gunturTop.distance} km, NOT 848 km)`);
    assert(gunturResult.capacityWarning === true, 'High Volume Advisory is triggered because 200 Q exceeds 150 Q capacity');
    assert(gunturTop.capacityExceeded === true, 'Recommended centre flags capacityExceeded = true');
    assert(gunturTop.capacityWarningText.includes('200 Q') && (gunturTop.capacityWarningText.includes('140 Q') || gunturTop.capacityWarningText.includes('150 Q')), `Capacity warning displays exact numbers: "${gunturTop.capacityWarningText}"`);
    console.log(`    -> Recommended: ${gunturTop.shortName} (${gunturTop.distance} km, ₹${gunturTop.pricePerQuintal}/Q, Score: ${gunturTop.matchScore}%)\n`);

    // -------------------------------------------------------------
    // Test Case 2: Farmer in Ahmedabad, Gujarat | Crop: Wheat | Qty: 50 Q
    // -------------------------------------------------------------
    console.log('[Test 2] Testing Farmer in Ahmedabad, Gujarat with 50 Quintals Wheat...');
    const ahmedabadOrigin = {
      location: 'Ahmedabad, Gujarat',
      lat: 23.0225,
      lng: 72.5714,
      district: 'Ahmedabad'
    };

    const ahmedabadApiRes = await fetchJson(`http://localhost:7008/api/bookings/centers?lat=${ahmedabadOrigin.lat}&lon=${ahmedabadOrigin.lng}&radius=300`);
    const ahmedabadResult = SmartBookingEngine.runSmartProcurementAlgorithm(
      'Wheat',
      50,
      ahmedabadApiRes.data,
      ahmedabadOrigin,
      {}
    );

    const ahmedabadTop = ahmedabadResult.scenarios.recommended;
    assert(ahmedabadTop.district === 'Ahmedabad' || ahmedabadTop.state === 'Gujarat', `Top recommended mandi is in Gujarat (Got: ${ahmedabadTop.shortName}, ${ahmedabadTop.district})`);
    assert(ahmedabadTop.distance < 20, `Distance is ultra-close (${ahmedabadTop.distance} km)`);
    assert(ahmedabadResult.capacityWarning === false, 'No capacity warning triggered for 50 Q (within quota)');
    console.log(`    -> Recommended: ${ahmedabadTop.shortName} (${ahmedabadTop.distance} km, ₹${ahmedabadTop.pricePerQuintal}/Q, Score: ${ahmedabadTop.matchScore}%)\n`);

    // -------------------------------------------------------------
    // Test Case 3: Farmer in Bhopal, MP | Crop: Wheat | Qty: 50 Q
    // -------------------------------------------------------------
    console.log('[Test 3] Testing Farmer in Bhopal, MP with 50 Quintals Wheat...');
    const bhopalOrigin = {
      location: 'Bhopal, MP',
      lat: 23.2599,
      lng: 77.4126,
      district: 'Bhopal'
    };

    const bhopalApiRes = await fetchJson(`http://localhost:7008/api/bookings/centers?lat=${bhopalOrigin.lat}&lon=${bhopalOrigin.lng}&radius=300`);
    const bhopalResult = SmartBookingEngine.runSmartProcurementAlgorithm(
      'Wheat',
      50,
      bhopalApiRes.data,
      bhopalOrigin,
      {}
    );

    const bhopalTop = bhopalResult.scenarios.recommended;
    assert(bhopalTop.state === 'Madhya Pradesh', `Top recommended mandi is in MP (Got: ${bhopalTop.shortName})`);
    assert(bhopalTop.distance < 40, `Bhopal/Sehore mandi distance is ${bhopalTop.distance} km`);
    console.log(`    -> Recommended: ${bhopalTop.shortName} (${bhopalTop.distance} km, ₹${bhopalTop.pricePerQuintal}/Q, Score: ${bhopalTop.matchScore}%)\n`);

    // -------------------------------------------------------------
    // Test Case 4: Farmer in Bhatinda, Punjab | Crop: Paddy | Qty: 75 Q
    // -------------------------------------------------------------
    console.log('[Test 4] Testing Farmer in Bhatinda, Punjab with 75 Quintals Paddy...');
    const punjabOrigin = {
      location: 'Bhatinda, Punjab',
      lat: 30.2110,
      lng: 74.9455,
      district: 'Bhatinda'
    };

    const punjabApiRes = await fetchJson(`http://localhost:7008/api/bookings/centers?lat=${punjabOrigin.lat}&lon=${punjabOrigin.lng}&radius=300`);
    const punjabResult = SmartBookingEngine.runSmartProcurementAlgorithm(
      'Paddy',
      75,
      punjabApiRes.data,
      punjabOrigin,
      {}
    );

    const punjabTop = punjabResult.scenarios.recommended;
    assert(punjabTop.state === 'Punjab' || punjabTop.state === 'Haryana', `Top recommended mandi is in Northern grain hub (Got: ${punjabTop.shortName}, ${punjabTop.state})`);
    assert(punjabTop.distance < 250, `Distance is ${punjabTop.distance} km`);
    console.log(`    -> Recommended: ${punjabTop.shortName} (${punjabTop.distance} km, ₹${punjabTop.pricePerQuintal}/Q, Score: ${punjabTop.matchScore}%)\n`);

    // -------------------------------------------------------------
    // Test Case 5: Real-time Weather Integration Impact
    // -------------------------------------------------------------
    console.log('[Test 5] Testing Real-time Weather Integration Impact...');
    const weatherMap = {
      'CTR-08': {
        weather: [{ main: 'Rain', description: 'moderate rain', icon: '10d' }],
        main: { temp: 24, humidity: 88 },
        wind: { speed: 8.5 },
        rain: { '1h': 4.5 }
      }
    };
    const rainResult = SmartBookingEngine.runSmartProcurementAlgorithm(
      'Tomato',
      60,
      gunturApiRes.data,
      gunturOrigin,
      weatherMap
    );
    const rainCenter = rainResult.rankedResults.find(r => r.centerId === 'CTR-08');
    assert(rainCenter !== undefined, 'CTR-08 (Guntur) evaluated with weather');
    assert(rainCenter.weatherClassification.category.includes('RAIN'), `Weather categorized as rain (Got: ${rainCenter.weatherClassification.category})`);
    assert(rainCenter.weatherDelay.expectedDelayHours > 0, `Expected transit delay added: ${rainCenter.weatherDelay.expectedDelayHours} hr(s)`);
    console.log(`    -> Weather effect: ${rainCenter.weatherClassification.label}, Delay: ${rainCenter.weatherDelay.expectedDelayHours}h, Window: ${rainCenter.weatherDelay.arrivalDisplay}\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('====================================================');
  console.log(`🏁 TEST EXECUTION FINISHED: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
