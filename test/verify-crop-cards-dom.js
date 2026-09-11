const fs = require('fs');
const http = require('http');
const assert = require('assert');
const vm = require('vm');

console.log('===============================================================');
console.log('🌾 VERIFYING REAL CROP CARDS (PRODUCE BANNER, 3X3 GRID & DOM)');
console.log('===============================================================');

// 1. Test HTTP serving of all 9 crop images from server
const crops = [
  'wheat.jpg',
  'rice.jpg',
  'potato.jpg',
  'tomato.jpg',
  'leafyvegetables.jpg',
  'maize.jpg',
  'gram.jpg',
  'mustard.jpg',
  'soyabean.jpg'
];

const PORT = process.env.PORT || 7008;
console.log(`\n[Step 1] Verifying HTTP serving of crop image assets at http://localhost:${PORT}/images/crops/...`);

let tested = 0;
crops.forEach(file => {
  const req = http.get(`http://localhost:${PORT}/images/crops/${file}`, res => {
    assert.strictEqual(res.statusCode, 200, `Image /images/crops/${file} must return 200 OK`);
    assert(res.headers['content-type'].includes('image'), `Content-Type must be image, got ${res.headers['content-type']}`);
    const contentLength = parseInt(res.headers['content-length'], 10);
    assert(contentLength > 50000, `Image ${file} must be > 50KB, got ${contentLength}`);
    console.log(`  ✅ HTTP 200 OK: /images/crops/${file} (${(contentLength / 1024).toFixed(0)} KB)`);
    tested++;
    if (tested === crops.length) {
      runDomTests();
    }
  });
  req.on('error', err => {
    console.error(`  ❌ Error fetching ${file}:`, err.message);
    process.exit(1);
  });
});

function runDomTests() {
  console.log('\n[Step 2] Validating smart-booking.js DOM Generation for Step 1...');
  
  const stageContainer = { innerHTML: '', style: {} };
  const elements = {
    'smart-booking-stage-container': stageContainer
  };

  const sandbox = {
    window: {},
    document: {
      getElementById: (id) => {
        if (!elements[id]) {
          elements[id] = { innerHTML: '', style: {}, setAttribute: () => {} };
        }
        return elements[id];
      }
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

  // Load SmartBookingEngine & smart-booking
  vm.runInContext(fs.readFileSync('public/js/smart-booking-engine.js', 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync('public/js/smart-booking.js', 'utf8'), sandbox);

  // Render form
  vm.runInContext('renderSmartBookingForm()', sandbox);
  const html = stageContainer.innerHTML;

  assert(html.includes('sp-crop-grid-3x3'), 'HTML must contain .sp-crop-grid-3x3 grid container');
  console.log('  ✅ PASS: .sp-crop-grid-3x3 container rendered');

  assert(html.includes('sp-crop-card-img-wrap'), 'HTML must contain .sp-crop-card-img-wrap header');
  assert(html.includes('class="sp-crop-card-img"'), 'HTML must contain .sp-crop-card-img prominent banner image');
  assert(html.includes('sp-crop-pill-perish'), 'HTML must contain .sp-crop-pill-perish badge');
  console.log('  ✅ PASS: Edge-to-edge produce photo headers and perishability pills rendered in all cards');

  // Verify all 9 crops are in the HTML
  crops.forEach(file => {
    assert(html.includes(`/images/crops/${file}`), `HTML must link to /images/crops/${file}`);
  });
  console.log('  ✅ PASS: All 9 crop real photos rendered in HTML');

  // Test selecting Tomato
  console.log('\n[Step 3] Testing crop selection interaction (selecting Tomato)...');
  vm.runInContext("selectSmartCrop('Tomato')", sandbox);
  const updatedHtml = stageContainer.innerHTML;

  assert(updatedHtml.includes("selectSmartCrop('Tomato')"), 'Tomato card click handler intact');
  assert(updatedHtml.includes('sp-crop-pill-selected'), 'Selected crop must show .sp-crop-pill-selected checkmark badge');
  assert(updatedHtml.includes('High Perishable'), 'Perishability banner reflects Tomato high perishability');
  console.log('  ✅ PASS: Selecting Tomato updates selection pill, checkmark badge, and perishability advice');

  // Test selecting Wheat
  console.log('\n[Step 4] Testing crop selection interaction (selecting Wheat)...');
  vm.runInContext("selectSmartCrop('Wheat')", sandbox);
  const wheatHtml = stageContainer.innerHTML;
  assert(wheatHtml.includes('Low Perishable'), 'Perishability banner reflects Wheat low perishability');
  console.log('  ✅ PASS: Selecting Wheat updates perishability calculation dynamically');

  console.log('\n===============================================================');
  console.log('🏁 ALL REAL CROP CARDS DOM & ASSET CHECKS PASSED (100%)');
  console.log('===============================================================');
}
