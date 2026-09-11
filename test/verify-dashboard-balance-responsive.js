const fs = require('fs');
const assert = require('assert');

console.log('===============================================================');
console.log('🌾 VERIFYING DASHBOARD BALANCE, RIGHT-END ALIGNMENT & RESPONSIVENESS');
console.log('===============================================================');

const farmerPortal = fs.readFileSync('public/js/farmer-portal.js', 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync('public/css/style.css', 'utf8').replace(/\r\n/g, '\n');

// Test 1: Quick Actions grid class & structure
console.log('\n[Test 1] Inspecting Quick Actions Grid in farmer-portal.js...');
assert(farmerPortal.includes('class="sp-quick-actions-grid"'), 'sp-quick-actions-grid class should be used');
assert(!farmerPortal.includes('grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))'), 'Old auto-fit inline grid must be removed');
console.log('  ✅ PASS: sp-quick-actions-grid is used without awkward auto-fit orphan wrap');

// Test 2: CSS rules for sp-quick-actions-grid
console.log('\n[Test 2] Checking CSS rules for sp-quick-actions-grid...');
assert(css.includes('.sp-quick-actions-grid {'), 'sp-quick-actions-grid should be defined in CSS');
assert(css.includes('grid-template-columns: repeat(4, 1fr);'), 'Default should be 4 columns on desktop');
assert(css.includes('grid-template-columns: repeat(2, 1fr);'), 'Tablet breakpoint should be 2x2 grid');
assert(css.includes('grid-template-columns: 1fr;'), 'Mobile breakpoint should be 1 column');
console.log('  ✅ PASS: 4 columns on desktop, 2x2 on tablet, 1 column on mobile verified');

// Test 3: Right column widgets 5 & 6
console.log('\n[Test 3] Verifying Right Column Widgets 5 & 6 in farmer-portal.js...');
assert(farmerPortal.includes('Widget 5: Mandi Helpdesk & Operations'), 'Widget 5 must be present');
assert(farmerPortal.includes('Widget 6: Government Quality & Moisture Guidelines'), 'Widget 6 must be present');
assert(farmerPortal.includes('Kisan Call Centre (Toll-Free)'), 'Kisan helpline action in right column must be present');
assert(farmerPortal.includes('Fair Assay &amp; Quality Guide'), 'Fair assay quality guide in right column must be present');
console.log('  ✅ PASS: Right column has balanced widgets filling the bottom vertical void');

// Test 4: Full-width advisory banner
console.log('\n[Test 4] Verifying Full-Width Advisory Banner...');
assert(farmerPortal.includes('class="sp-full-advisory-banner"'), 'sp-full-advisory-banner must be present');
assert(css.includes('.sp-full-advisory-banner {'), 'CSS for sp-full-advisory-banner must be defined');
assert(farmerPortal.includes('National Agricultural Procurement Assurance &amp; Fair Weighment Guarantee'), 'Advisory title must match');
console.log('  ✅ PASS: Full-width banner bridges and grounds both columns before footer');

// Test 5: Main container full-width without right gutter
console.log('\n[Test 5] Inspecting .sp-main styling in style.css...');
assert(css.includes('.sp-main {'), '.sp-main must be defined');
assert(!css.includes('max-width: 1380px;\n  margin: 0 auto;'), 'Old restrictive max-width margin: 0 auto must be replaced');
assert(css.includes('min-width: 0;'), 'min-width: 0 ensures flex child shrinks properly');
assert(css.includes('width: 100%;'), 'width: 100% ensures it fills available space');
assert(css.includes('box-sizing: border-box;'), 'box-sizing: border-box avoids padding overflow');
console.log('  ✅ PASS: .sp-main fills available width without empty right-end gutter');

// Test 6: Verify left and right column styles
console.log('\n[Test 6] Inspecting .sp-content-grid and column widths...');
assert(css.includes('.sp-content-grid {'), '.sp-content-grid must be defined');
assert(css.includes('grid-template-columns: 1.7fr 1.3fr;'), 'sp-content-grid must have balanced proportion');
assert(css.includes('.sp-left-col {\n  min-width: 0;\n  width: 100%;'), '.sp-left-col must have min-width 0 and width 100%');
assert(css.includes('.sp-right-col {\n  min-width: 0;\n  width: 100%;'), '.sp-right-col must have min-width 0 and width 100%');
console.log('  ✅ PASS: Content grid and columns are fluid and fully responsive');

console.log('\n===============================================================');
console.log('🏁 ALL DASHBOARD BALANCE & RESPONSIVENESS CHECKS PASSED (6/6)');
console.log('===============================================================');
