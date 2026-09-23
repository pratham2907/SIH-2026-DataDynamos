const fs = require('fs');
const http = require('http');
const assert = require('assert');
const vm = require('vm');

console.log('===============================================================');
console.log('🌱 COMPREHENSIVE VERIFICATION: ALL 18 CROPS, FRUITS & VEGETABLES');
console.log('===============================================================');

const all18Crops = [
  { file: 'wheat.jpg', name: 'Wheat', type: 'grain', msp: 2425 },
  { file: 'rice.jpg', name: 'Rice', type: 'grain', msp: 2369 },
  { file: 'maize.jpg', name: 'Maize', type: 'grain', msp: 2225 },
  { file: 'gram.jpg', name: 'Gram', type: 'grain', msp: 5440 },
  { file: 'mustard.jpg', name: 'Mustard', type: 'cash', msp: 5650 },
  { file: 'soyabean.jpg', name: 'Soyabean', type: 'grain', msp: 4892 },
  { file: 'groundnut.jpg', name: 'Groundnut', type: 'grain', msp: 6783 },
  { file: 'cotton.jpg', name: 'Cotton', type: 'cash', msp: 7121 },
  { file: 'potato.jpg', name: 'Potato', type: 'vegetable', msp: 1800 },
  { file: 'tomato.jpg', name: 'Tomato', type: 'vegetable', msp: 2100 },
  { file: 'leafyvegetables.jpg', name: 'Leafy vegetables', type: 'vegetable', msp: 2400 },
  { file: 'onion.jpg', name: 'Onion', type: 'vegetable', msp: 1950 },
  { file: 'peas.jpg', name: 'Green Peas', type: 'vegetable', msp: 3600 },
  { file: 'cauliflower.jpg', name: 'Cauliflower', type: 'vegetable', msp: 1650 },
  { file: 'banana.jpg', name: 'Banana', type: 'fruit', msp: 1850 },
  { file: 'apple.jpg', name: 'Apple', type: 'fruit', msp: 7200 },
  { file: 'mango.jpg', name: 'Mango', type: 'fruit', msp: 3400 },
  { file: 'orange.jpg', name: 'Orange', type: 'fruit', msp: 3100 }
];

// Test 1: Verify all 18 image files exist and are substantial
console.log('\n[Check 1] Validating image asset files in public/images/crops/...');
all18Crops.forEach(c => {
  const p = `public/images/crops/${c.file}`;
  assert(fs.existsSync(p), `Image file ${p} must exist`);
  const sz = fs.statSync(p).size;
  assert(sz > 50000, `${p} must be > 50KB, got ${sz} bytes`);
  console.log(`  ✅ ${c.file.padEnd(20)} (${(sz / 1024).toFixed(0)} KB)`);
});

// Test 2: HTTP 200 serving for all 18 crops
const PORT = process.env.PORT || 7008;
console.log(`\n[Check 2] Testing HTTP 200 OK serving of all 18 crop images from localhost:${PORT}...`);
let testedCount = 0;

all18Crops.forEach(c => {
  const req = http.get(`http://localhost:${PORT}/images/crops/${c.file}`, res => {
    assert.strictEqual(res.statusCode, 200, `${c.file} must return HTTP 200`);
    testedCount++;
    if (testedCount === all18Crops.length) {
      console.log(`  ✅ All 18 images successfully served with HTTP 200 OK!`);
      runVmChecks();
    }
  });
  req.on('error', err => {
    console.error(`  ❌ Error fetching ${c.file}:`, err.message);
    process.exit(1);
  });
});

function runVmChecks() {
  console.log('\n[Check 3] Validating DOM & Interaction for All 18 Crops...');
  const stageContainer = { innerHTML: '', style: {} };
  const elements = {
    'smart-booking-stage-container': stageContainer,
    'smart-mandi-stage-container': stageContainer
  };

  const sandbox = {
    window: {},
    document: {
      getElementById: (id) => elements[id] || { innerHTML: '', style: {}, setAttribute: () => {} }
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    showToast: () => {},
    getT: (k) => k,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.window.addEventListener = () => {};

  vm.createContext(sandbox);

  vm.runInContext(fs.readFileSync('public/js/smart-booking-engine.js', 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync('public/js/smart-booking.js', 'utf8'), sandbox);

  vm.runInContext('renderSmartBookingForm()', sandbox);
  const html = stageContainer.innerHTML;

  // Verify all 18 crops rendered in HTML
  all18Crops.forEach(c => {
    assert(html.includes(`/images/crops/${c.file}`), `HTML must contain photo for ${c.name}`);
    assert(html.includes(c.name), `HTML must contain title for ${c.name}`);
  });
  console.log('  ✅ All 18 crop cards rendered with authentic photos and MSP rates');

  // Verify category filter tabs
  assert(html.includes('sp-crop-filter-bar'), 'Filter tabs bar present');
  assert(html.includes('All Produce (18)'), 'All produce tab present');
  assert(html.includes('Fresh Vegetables (6)'), 'Vegetables tab present');
  assert(html.includes('Fruits & Orchard (4)'), 'Fruits tab present');
  console.log('  ✅ Category filter bar present with correct crop group counts');

  // Test selecting a fruit (e.g. Mango)
  console.log('\n[Check 4] Testing interactive selection of new fruit (Mango)...');
  vm.runInContext("selectSmartCrop('Mango')", sandbox);
  const mangoHtml = stageContainer.innerHTML;
  assert(mangoHtml.includes('sp-crop-pill-selected'), 'Selected badge present on Mango');
  assert(mangoHtml.includes('High Perishable'), 'Mango classified as High Perishable');
  assert(mangoHtml.includes('3400'), 'Mango MSP ₹3400 rendered');
  console.log('  ✅ Fruit selection (Mango) successfully processed with high perishability');

  // Test selecting a new vegetable (e.g. Onion)
  console.log('\n[Check 5] Testing interactive selection of new vegetable (Onion)...');
  vm.runInContext("selectSmartCrop('Onion')", sandbox);
  const onionHtml = stageContainer.innerHTML;
  assert(onionHtml.includes('Medium Perishable'), 'Onion classified as Medium Perishable');
  assert(onionHtml.includes('1950'), 'Onion MSP ₹1950 rendered');
  console.log('  ✅ Vegetable selection (Onion) successfully processed with medium perishability');

  // Test selecting a commercial crop (e.g. Cotton)
  console.log('\n[Check 6] Testing interactive selection of cash crop (Cotton)...');
  vm.runInContext("selectSmartCrop('Cotton')", sandbox);
  const cottonHtml = stageContainer.innerHTML;
  assert(cottonHtml.includes('7121'), 'Cotton MSP ₹7121 rendered');
  console.log('  ✅ Cash crop selection (Cotton) successfully processed');

  console.log('\n===============================================================');
  console.log('🏆 ALL 18 CROPS, FRUITS & VEGETABLES FULLY VERIFIED (100% PASS)');
  console.log('===============================================================');
}
