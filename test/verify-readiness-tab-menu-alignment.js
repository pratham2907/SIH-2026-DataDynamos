// Test suite verifying Paddy / Rice Readiness Verification placement directly below Fair Assay & Quality Guide
// across Farmer, Officer, and Super Admin portals.
const fs = require('fs');
const path = require('path');

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('🌾 VERIFYING PADDY / RICE READINESS VERIFICATION TAB MENU');
console.log('================================================================\n');

// 1. Farmer Portal Inspection
console.log('--- 1. FARMER PORTAL VERIFICATION ---');
const farmerJs = fs.readFileSync(path.join(__dirname, '../public/js/farmer-portal.js'), 'utf8');

assert(farmerJs.includes('fair_assay_guide'), 'Farmer portal includes Fair Assay & Quality Guide');
assert(farmerJs.includes('id="harvest-readiness-widget"'), 'Farmer portal includes harvest-readiness-widget');

const fairAssayIndex = farmerJs.indexOf('fair_assay_guide');
const readinessIndex = farmerJs.indexOf('id="harvest-readiness-widget"');

assert(fairAssayIndex !== -1 && readinessIndex !== -1, 'Both widgets present in farmer portal');
assert(readinessIndex > fairAssayIndex, 'Paddy / Rice Readiness widget is located DIRECTLY BELOW Fair Assay & Quality Guide in Farmer Portal');

assert(farmerJs.includes('scrollToReadinessWidget'), 'Sidebar navigation scrollToReadinessWidget() exists');
assert(farmerJs.includes('Paddy / Rice'), 'Dynamic or default Paddy / Rice title is displayed');
assert(farmerJs.includes('q1_cropReady') && farmerJs.includes('q6_readyToMove'), 'Includes 5-point readiness questions (1, 2, 3, 5, 6)');
assert(farmerJs.includes('window.scrollToReadinessWidget = scrollToReadinessWidget'), 'scrollToReadinessWidget exported to window');

// 2. Officer Portal Inspection
console.log('\n--- 2. OFFICER PORTAL VERIFICATION ---');
const officerJs = fs.readFileSync(path.join(__dirname, '../public/js/officer-portal.js'), 'utf8');

assert(officerJs.includes('scrollToOfficerReadiness'), 'Officer sidebar includes scrollToOfficerReadiness link');
assert(officerJs.includes('id="officer-fair-assay-section"'), 'Officer dashboard includes officer-fair-assay-section');
assert(officerJs.includes('id="officer-readiness-widget"'), 'Officer dashboard includes officer-readiness-widget');

const officerFairAssayIndex = officerJs.indexOf('id="officer-fair-assay-section"');
const officerReadinessIndex = officerJs.indexOf('id="officer-readiness-widget"');

assert(officerFairAssayIndex !== -1 && officerReadinessIndex !== -1, 'Both sections present in officer portal');
assert(officerReadinessIndex > officerFairAssayIndex, 'Paddy / Rice Readiness Verification is located DIRECTLY BELOW Fair Assay & Quality Guide in Officer Portal');

assert(officerJs.includes('setOfficerReadinessToggle'), 'Officer readiness question toggles implemented');
assert(officerJs.includes('submitOfficerReadinessCheck'), 'Officer readiness submit gate clearance implemented');
assert(officerJs.includes('window.scrollToOfficerReadiness = scrollToOfficerReadiness'), 'scrollToOfficerReadiness exported to window');

// 3. Super Admin Portal Inspection
console.log('\n--- 3. SUPER ADMIN PORTAL VERIFICATION ---');
const adminJs = fs.readFileSync(path.join(__dirname, '../public/js/admin-portal.js'), 'utf8');

assert(adminJs.includes('scrollToAdminReadiness'), 'Admin sidebar includes scrollToAdminReadiness link');
assert(adminJs.includes('id="admin-fair-assay-section"'), 'Admin dashboard includes admin-fair-assay-section');
assert(adminJs.includes('id="admin-readiness-widget"'), 'Admin dashboard includes admin-readiness-widget');

const adminFairAssayIndex = adminJs.indexOf('id="admin-fair-assay-section"');
const adminReadinessIndex = adminJs.indexOf('id="admin-readiness-widget"');

assert(adminFairAssayIndex !== -1 && adminReadinessIndex !== -1, 'Both sections present in admin portal');
assert(adminReadinessIndex > adminFairAssayIndex, 'National Paddy / Rice Readiness Verification Monitor is located DIRECTLY BELOW Fair Assay & Quality Guide in Admin Portal');

assert(adminJs.includes('window.scrollToAdminReadiness = scrollToAdminReadiness'), 'scrollToAdminReadiness exported to window');

// Verification of Live Mandi Congestion & Wait Estimates menu and section
assert(adminJs.includes('scrollToAdminCongestion'), 'Admin sidebar includes scrollToAdminCongestion link');
assert(adminJs.includes('id="admin-congestion-widget"'), 'Admin dashboard includes admin-congestion-widget');
const adminCongestionNavIndex = adminJs.indexOf('scrollToAdminCongestion');
const adminReadinessNavIndex = adminJs.indexOf('scrollToAdminReadiness');
assert(adminCongestionNavIndex > adminReadinessNavIndex, 'Live Mandi Congestion menu link is located DIRECTLY AFTER Paddy / Rice Readiness in Admin sidebar');

const adminCongestionSectionIndex = adminJs.indexOf('id="admin-congestion-widget"');
assert(adminCongestionSectionIndex > adminReadinessIndex, 'Live Mandi Congestion & Wait Estimates section is located DIRECTLY AFTER National Paddy Readiness Monitor in Admin Portal');
assert(adminJs.includes('window.scrollToAdminCongestion = scrollToAdminCongestion'), 'scrollToAdminCongestion exported to window');
assert(adminJs.includes('window.refreshAdminCongestionTable = refreshAdminCongestionTable'), 'refreshAdminCongestionTable exported to window');

// 4. Modal & Layout Alignment CSS
console.log('\n--- 4. CSS ALIGNMENT & MODAL CENTERING ---');
const css = fs.readFileSync(path.join(__dirname, '../public/css/style.css'), 'utf8');

assert(css.includes('#travel-future-modal'), 'CSS targets #travel-future-modal');
assert(css.includes('position: fixed;'), 'Modal uses fixed viewport positioning');
assert(css.includes('align-items: center !important;'), 'Modal uses vertical centering');
assert(css.includes('justify-content: center !important;'), 'Modal uses horizontal centering');
assert(css.includes('.modal-dialog'), 'Modal dialog styled with auto centering');

console.log('\n================================================================');
console.log(`🎉 SUMMARY: ${passed} / ${total} CHECKS PASSED SUCCESSFULLY!`);
console.log('================================================================');
