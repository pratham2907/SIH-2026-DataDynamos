/**
 * 🌾 Smart Booking Engine — Automated Test Suite
 * Validates all core algorithms, NEV calculations, tie-breakers, and edge cases.
 */

const assert = require('assert');
const {
  DEFAULT_PROCUREMENT_CENTRES,
  SMART_CROP_CATALOG,
  getEligibleCentres,
  calculateAcceptedQuantity,
  calculateTransportCost,
  calculateWaitingTime,
  calculateDelayImpact,
  calculateCentreResult,
  rankCentres,
  generateScenarios,
  runSmartProcurementAlgorithm
} = require('../public/js/smart-booking-engine');

console.log('====================================================');
console.log('🧪 SMART BOOKING ALGORITHM & DECISION ENGINE TESTS');
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
// TEST 1: Benchmark Demo Test Case (Wheat, 100 Quintals)
// Centre A: Distance 10km, Price 2500, Wait 5 days, Transport 1000, Delay 10000 -> NEV = 2,39,000
// Centre B: Distance 25km, Price 2600, Wait 1 day, Transport 2000, Delay 4000 -> NEV = 2,54,000
// Centre C: Distance 18km, Price 2550, Wait 2 days, Transport 1500, Delay 6000 -> NEV = 2,47,500
// -------------------------------------------------------------
test('Test 1: Benchmark Demo - Wheat 100Q yields exact expected NEVs & ranking', () => {
  const result = runSmartProcurementAlgorithm('Wheat', 100);
  assert.strictEqual(result.success, true);
  assert.ok(result.scenarios);

  const recommended = result.scenarios.recommended;
  const alternative = result.scenarios.alternative;

  // Centre B must be recommended with NEV 2,54,000
  assert.strictEqual(recommended.shortName, 'Centre B (Sehore Mega Mandi)');
  assert.strictEqual(recommended.nev, 254000);
  assert.strictEqual(recommended.pricePerQuintal, 2600);
  assert.strictEqual(recommended.transportCost, 2000);
  assert.strictEqual(recommended.delayImpact, 4000);

  // Centre A must be alternative (closer option) with NEV 2,39,000
  assert.strictEqual(alternative.shortName, 'Centre A (Bhopal Central)');
  assert.strictEqual(alternative.nev, 239000);
  assert.strictEqual(alternative.distance, 10);
  assert.strictEqual(alternative.transportCost, 1000);
  assert.strictEqual(alternative.delayImpact, 10000);
});

// -------------------------------------------------------------
// TEST 2: 50 Quintals
// -------------------------------------------------------------
test('Test 2: Dynamic quantity (50 Quintals) runs without error', () => {
  const result = runSmartProcurementAlgorithm('Wheat', 50);
  assert.strictEqual(result.success, true);
  assert.ok(result.scenarios.recommended);
  assert.ok(result.scenarios.recommended.nev > 0);
});

// -------------------------------------------------------------
// TEST 3: 500 Quintals (High Volume / Capacity Boundary)
// -------------------------------------------------------------
test('Test 3: 500 Quintals flags capacity warning and limits acceptedQuantity', () => {
  const result = runSmartProcurementAlgorithm('Wheat', 500);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.capacityWarning, true);
  assert.ok(result.scenarios.recommended.acceptedQuantity <= result.scenarios.recommended.availableCapacity);
});

// -------------------------------------------------------------
// TEST 4: Crop accepted by only one centre
// -------------------------------------------------------------
test('Test 4: Single eligible centre generates 1 scenario without fake 2nd option', () => {
  const singleCentreDataset = [
    {
      id: "C_SPECIAL",
      name: "Specialty Cotton Hub",
      distance: 20,
      pricePerQuintal: 7000,
      queue: 5,
      waitingDays: 1,
      dailyCapacity: 40,
      availableCapacity: 100,
      crops: ["Cotton"],
      active: true,
      fixedTransportCost: 1200,
      storageCostPerDayPerQ: 20
    },
    {
      id: "C_GRAIN",
      name: "Grain Only Mandi",
      distance: 10,
      pricePerQuintal: 2500,
      queue: 10,
      waitingDays: 2,
      dailyCapacity: 40,
      availableCapacity: 100,
      crops: ["Wheat", "Paddy"],
      active: true
    }
  ];

  const result = runSmartProcurementAlgorithm('Cotton', 50, singleCentreDataset);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.scenarios.singleOptionOnly, true);
  assert.strictEqual(result.scenarios.alternative, null);
  assert.strictEqual(result.scenarios.recommended.centerId, 'C_SPECIAL');
});

// -------------------------------------------------------------
// TEST 5: No eligible centres
// -------------------------------------------------------------
test('Test 5: Unsupported crop returns error code gracefully', () => {
  const result = runSmartProcurementAlgorithm('ExoticDragonFruit', 50);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'NO_CENTRES_FOUND');
});

// -------------------------------------------------------------
// TEST 6: Inactive / unavailable centre filtered out
// -------------------------------------------------------------
test('Test 6: Closed or Inactive centre is excluded from eligibility', () => {
  const testCentres = [
    {
      id: "C_ACTIVE",
      name: "Open Mandi",
      distance: 15,
      pricePerQuintal: 2500,
      queue: 5,
      waitingDays: 1,
      dailyCapacity: 30,
      availableCapacity: 50,
      crops: ["Wheat"],
      active: true
    },
    {
      id: "C_CLOSED",
      name: "Closed Mandi",
      distance: 5,
      pricePerQuintal: 2800,
      queue: 0,
      waitingDays: 0,
      dailyCapacity: 30,
      availableCapacity: 100,
      crops: ["Wheat"],
      active: false // INACTIVE
    }
  ];

  const eligible = getEligibleCentres('Wheat', testCentres);
  assert.strictEqual(eligible.length, 1);
  assert.strictEqual(eligible[0].id, 'C_ACTIVE');
});

// -------------------------------------------------------------
// TEST 7: Two centres with almost identical NEV (Tie-breaker)
// -------------------------------------------------------------
test('Test 7: Near-equal NEV uses tie-breaker (lower wait days, shorter distance)', () => {
  const testCentres = [
    {
      id: "C_A",
      name: "Mandi Alpha",
      distance: 12,
      pricePerQuintal: 2500,
      queue: 30,
      waitingDays: 3,
      dailyCapacity: 30,
      availableCapacity: 100,
      crops: ["Wheat"],
      active: true,
      fixedTransportCost: 1000,
      storageCostPerDayPerQ: 0
    },
    {
      id: "C_B",
      name: "Mandi Beta",
      distance: 15,
      pricePerQuintal: 2500,
      queue: 10,
      waitingDays: 1, // SHORTER WAIT
      dailyCapacity: 30,
      availableCapacity: 100,
      crops: ["Wheat"],
      active: true,
      fixedTransportCost: 1000,
      storageCostPerDayPerQ: 0
    }
  ];

  const result = runSmartProcurementAlgorithm('Wheat', 50, testCentres);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.scenarios.recommended.centerId, 'C_B'); // lower wait wins tie
});

console.log('\n====================================================');
console.log(`🏁 TESTS COMPLETED: ${passCount} PASSED | ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) process.exit(1);
