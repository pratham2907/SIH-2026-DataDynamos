/**
 * 🌾 Smart Booking Engine — Automated Test Suite
 * Tests all 8 specifications:
 * 1. Wheat + Clear weather
 * 2. Tomato + Clear weather (higher deterioration sensitivity than wheat)
 * 3. Tomato + Moderate Rain (arrival time range, weather delay, increased deterioration)
 * 4. Tomato + Heavy Rain (travel delay, reduced capacity, increased wait)
 * 5. Wheat + Heavy Rain (deterioration substantially lower than tomato under equivalent delay)
 * 6. Two centres trade-off (Centre A: 10km, Heavy Rain, 3-day wait vs Centre B: 22km, Clear, 1-day wait)
 * 7. No weather API response (graceful fallback)
 * 8. OpenWeather API error handling (does not crash)
 */

const assert = require('assert');
const {
  cropProfiles,
  getCropProfile,
  DEFAULT_PROCUREMENT_CENTRES,
  calculateTemperatureFactor,
  calculateHumidityFactor,
  calculateRainFactor,
  calculateWeatherAdjustedDeteriorationRate,
  classifyWeather,
  calculateWeatherDelay,
  calculateEffectiveCapacity,
  calculateWaitingTimeWithWeather,
  calculateDelayCost,
  calculateDeteriorationLoss,
  calculateCentreResult,
  rankCentres,
  generateScenarios,
  runSmartProcurementAlgorithm
} = require('../public/js/smart-booking-engine');

console.log('====================================================');
console.log('🧪 SMART BOOKING & WEATHER DECISION ENGINE TESTS');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

const test = (description, fn) => {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
};

// -------------------------------------------------------------
// BENCHMARK DEMO TEST CASE (Wheat, 100 Q)
// -------------------------------------------------------------
test('Benchmark Demo: Wheat 100Q baseline NEV calculation & ranking', () => {
  const result = runSmartProcurementAlgorithm('Wheat', 100);
  assert.strictEqual(result.success, true);
  assert.ok(result.scenarios.recommended);
  assert.strictEqual(result.scenarios.recommended.shortName, 'Centre B (Sehore Mega Mandi)');
  assert.strictEqual(result.scenarios.recommended.nev, 254000);
  assert.strictEqual(result.scenarios.alternative.shortName, 'Centre A (Bhopal Central)');
  assert.strictEqual(result.scenarios.alternative.nev, 239000);
});

// -------------------------------------------------------------
// TEST 1: Wheat + Clear weather
// -------------------------------------------------------------
test('Test 1: Wheat + Clear weather yields low deterioration impact & on-time arrival', () => {
  const weatherClear = { temp: 24, humidity: 50, precipitation: 0, condition: 'Clear' };
  const centre = DEFAULT_PROCUREMENT_CENTRES[0]; // Centre A
  const res = calculateCentreResult(centre, 'Wheat', 50, null, weatherClear);
  
  assert.strictEqual(res.weatherClassification.category, 'CLEAR');
  assert.strictEqual(res.weatherClassification.travelRisk, 'Low');
  assert.strictEqual(res.weatherDelay.expectedDelayHours, 0);
  assert.ok(res.deteriorationCost < (res.grossRevenue * 0.01), `Wheat deterioration cost (${res.deteriorationCost}) should be under 1% of value (${res.grossRevenue})`);
});

// -------------------------------------------------------------
// TEST 2: Tomato + Clear weather (Higher sensitivity than wheat)
// -------------------------------------------------------------
test('Test 2: Tomato + Clear weather has higher deterioration sensitivity than wheat', () => {
  const weatherClear = { temp: 24, humidity: 50, precipitation: 0, condition: 'Clear' };
  const centre = DEFAULT_PROCUREMENT_CENTRES[0];
  const wheatRes = calculateCentreResult(centre, 'Wheat', 50, null, weatherClear);
  const tomatoRes = calculateCentreResult(centre, 'Tomato', 50, null, weatherClear);

  assert.strictEqual(tomatoRes.cropProfile.category, 'high');
  assert.ok(tomatoRes.deteriorationRate > wheatRes.deteriorationRate);
  assert.ok(tomatoRes.deteriorationCost > wheatRes.deteriorationCost);
});

// -------------------------------------------------------------
// TEST 3: Tomato + Moderate Rain
// -------------------------------------------------------------
test('Test 3: Tomato + Moderate Rain produces arrival time range & increased deterioration', () => {
  const weatherModRain = { temp: 26, humidity: 75, precipitation: 4.5, condition: 'Moderate Rain' };
  const centre = DEFAULT_PROCUREMENT_CENTRES[0];
  const clearRes = calculateCentreResult(centre, 'Tomato', 50, null, { temp: 24, humidity: 50, precipitation: 0, condition: 'Clear' });
  const rainRes = calculateCentreResult(centre, 'Tomato', 50, null, weatherModRain);

  assert.strictEqual(rainRes.weatherClassification.category, 'MODERATE RAIN');
  assert.ok(rainRes.weatherDelay.arrivalDisplay.includes('–'), 'Arrival time must be a range');
  assert.ok(rainRes.weatherDelay.expectedDelayHours > 0, 'Weather delay must be greater than 0');
  assert.ok(rainRes.deteriorationCost >= clearRes.deteriorationCost);
});

// -------------------------------------------------------------
// TEST 4: Tomato + Heavy Rain
// -------------------------------------------------------------
test('Test 4: Tomato + Heavy Rain creates significant travel delay & reduced capacity', () => {
  const weatherHeavy = { temp: 25, humidity: 90, precipitation: 15.0, condition: 'Heavy Rain' };
  const centre = DEFAULT_PROCUREMENT_CENTRES[0];
  const heavyRes = calculateCentreResult(centre, 'Tomato', 50, null, weatherHeavy);

  assert.strictEqual(heavyRes.weatherClassification.category, 'HEAVY RAIN');
  assert.strictEqual(heavyRes.weatherClassification.travelRisk, 'High');
  assert.ok(heavyRes.weatherClassification.capacityMultiplier < 1.0, 'Effective capacity multiplier must be reduced');
  assert.ok(heavyRes.weatherDelay.expectedDelayHours >= 1.0, 'Delay must be significant');
});

// -------------------------------------------------------------
// TEST 5: Wheat + Heavy Rain (Substantially lower loss than tomato)
// -------------------------------------------------------------
test('Test 5: Wheat + Heavy Rain deterioration remains substantially lower than tomato', () => {
  const weatherHeavy = { temp: 25, humidity: 90, precipitation: 15.0, condition: 'Heavy Rain' };
  const centre = DEFAULT_PROCUREMENT_CENTRES[0];
  const wheatHeavy = calculateCentreResult(centre, 'Wheat', 50, null, weatherHeavy);
  const tomatoHeavy = calculateCentreResult(centre, 'Tomato', 50, null, weatherHeavy);

  assert.ok(wheatHeavy.deteriorationLoss < tomatoHeavy.deteriorationLoss);
  const ratio = tomatoHeavy.deteriorationLoss / (wheatHeavy.deteriorationLoss || 1);
  assert.ok(ratio > 5, `Tomato deterioration loss should be substantially higher than wheat (ratio: ${ratio.toFixed(1)}x)`);
});

// -------------------------------------------------------------
// TEST 6: Two Centres Trade-off Comparison
// Centre A: 10 km, Heavy Rain, 3-day wait
// Centre B: 22 km, Clear, 1-day wait
// -------------------------------------------------------------
test('Test 6: Two centres comparison recommends Centre B when its calculated NR is higher', () => {
  const customCentres = [
    {
      id: "CTR-A-TEST",
      name: "Centre A (Disrupted)",
      distance: 10,
      pricePerQuintal: 2500,
      queue: 30,
      waitingDays: 3,
      dailyCapacity: 30,
      availableCapacity: 100,
      crops: ["Tomato"],
      active: true,
      currentWeather: { temp: 25, humidity: 90, precipitation: 14.0, condition: 'Heavy Rain' }
    },
    {
      id: "CTR-B-TEST",
      name: "Centre B (Clear)",
      distance: 22,
      pricePerQuintal: 2550,
      queue: 10,
      waitingDays: 1,
      dailyCapacity: 50,
      availableCapacity: 120,
      crops: ["Tomato"],
      active: true,
      currentWeather: { temp: 22, humidity: 50, precipitation: 0, condition: 'Clear' }
    }
  ];

  const result = runSmartProcurementAlgorithm('Tomato', 50, customCentres);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.scenarios.recommended.centerId, 'CTR-B-TEST');
  assert.ok(result.scenarios.recommended.nev > result.scenarios.alternative.nev);
});

// -------------------------------------------------------------
// TEST 7 & 8: No Weather API Response & API Error Graceful Fallback
// -------------------------------------------------------------
test('Test 7 & 8: No weather API response / error falls back gracefully without crashing', () => {
  const resultNullWeather = runSmartProcurementAlgorithm('Wheat', 50, null, null, null);
  assert.strictEqual(resultNullWeather.success, true);
  assert.ok(resultNullWeather.scenarios.recommended);

  // Partial / malformed weather object
  const centreMalformed = DEFAULT_PROCUREMENT_CENTRES[0];
  const resMalformed = calculateCentreResult(centreMalformed, 'Wheat', 50, null, { broken: true });
  assert.ok(resMalformed);
  assert.strictEqual(resMalformed.weatherClassification.category, 'CLEAR');
  assert.ok(resMalformed.nev > 0);
});

console.log('\n====================================================');
console.log(`🏁 TESTS COMPLETED: ${passCount} PASSED | ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
