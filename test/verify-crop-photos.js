const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('🌾 VERIFYING REAL CROP PHOTOS REPLACING EMOJIS / ICONS');
console.log('===============================================================');

// Test 1: Check image assets in public/images/crops/
const expectedCrops = [
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

console.log('\n[Test 1] Inspecting public/images/crops/ directory...');
expectedCrops.forEach(file => {
  const filePath = path.join('public', 'images', 'crops', file);
  assert(fs.existsSync(filePath), `Crop image ${file} must exist in public/images/crops/`);
  const stat = fs.statSync(filePath);
  assert(stat.size > 50000, `Crop image ${file} must be a substantial real photo (> 50KB), got ${stat.size} bytes`);
  console.log(`  ✅ PASS: ${file} exists (${(stat.size / 1024).toFixed(0)} KB)`);
});

// Test 2: Check smart-booking-engine.js cropProfiles
console.log('\n[Test 2] Verifying cropProfiles in smart-booking-engine.js...');
const engineCode = fs.readFileSync('public/js/smart-booking-engine.js', 'utf8');
expectedCrops.forEach(file => {
  const cropBase = file.replace('.jpg', '');
  assert(engineCode.includes(`/images/crops/${file}`) || (cropBase === 'paddy' && engineCode.includes('/images/crops/rice.jpg')), `Engine profile must reference /images/crops/${file}`);
});
console.log('  ✅ PASS: All crop profiles in smart-booking-engine.js have image attributes configured');

// Test 3: Check smart-booking.js renders <img> tag for crops
console.log('\n[Test 3] Verifying smart-booking.js card grid rendering...');
const bookingJs = fs.readFileSync('public/js/smart-booking.js', 'utf8');
assert(!bookingJs.includes('<i class="fas ${crop.icon}"></i>'), 'Old icon tag in crop-card-grid must be removed');
assert(bookingJs.includes('<img src="${cropImg}" alt="${crop.name}" class="sp-crop-card-img"'), 'Real photo <img> tag must be rendered in produce crop cards');
assert(bookingJs.includes('sp-crop-grid-3x3'), 'Produce cards must be organized in 3x3 grid layout');
console.log('  ✅ PASS: smart-booking.js renders real produce photos in 3x3 crop selection cards');

// Test 4: Check farmer-portal.js rates table
console.log('\n[Test 4] Verifying farmer-portal.js APMC rates table...');
const portalJs = fs.readFileSync('public/js/farmer-portal.js', 'utf8');
assert(portalJs.includes('<img src="/images/crops/wheat.jpg"'), 'Wheat photo must be present in APMC rates table');
assert(portalJs.includes('<img src="/images/crops/gram.jpg"'), 'Gram photo must be present in APMC rates table');
assert(portalJs.includes('<img src="/images/crops/mustard.jpg"'), 'Mustard photo must be present in APMC rates table');
assert(portalJs.includes('<img src="/images/crops/soyabean.jpg"'), 'Soybean photo must be present in APMC rates table');
assert(portalJs.includes('<img src="/images/crops/rice.jpg"'), 'Paddy photo must be present in APMC rates table');
console.log('  ✅ PASS: APMC rates table displays real crop photo avatars');

// Test 5: Check mandi-prices.js
console.log('\n[Test 5] Verifying mandi-prices.js commodity pills & spotlight...');
const mandiJs = fs.readFileSync('public/js/mandi-prices.js', 'utf8');
assert(mandiJs.includes('src="/images/crops/${cropKey}.jpg"'), 'Commodity pills must use real crop photos');
assert(mandiJs.includes('src="/images/crops/${cropMeta.name.toLowerCase()'), 'Spotlight card must use real crop photo');
console.log('  ✅ PASS: Mandi price discovery uses real crop photos');

console.log('\n===============================================================');
console.log('🏁 ALL REAL CROP PHOTO VERIFICATIONS PASSED (5/5)');
console.log('===============================================================');
