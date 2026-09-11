// Comprehensive SmartProcure UI & Feature Audit Test Suite
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('🧪 SMARTPROCURE RE-STYLING & INTERACTIVITY AUDIT SUITE');
console.log('======================================================\n');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
  }
}

// 1. Audit index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf-8');

it('Top bar has .sp-topbar with SmartProcure branding and leaf icon', () => {
  assert(indexHtml.includes('class="sp-topbar"'), 'Missing .sp-topbar');
  assert(indexHtml.includes('sp-brand-title">SmartProcure'), 'Missing SmartProcure brand title');
  assert(indexHtml.includes('Digital India &bull; Smart Agriculture'), 'Missing tagline');
  assert(indexHtml.includes('fa-leaf'), 'Missing leaf icon');
});

it('Top bar has all 5 navigation links', () => {
  assert(indexHtml.includes('Home</a>'), 'Missing Home link');
  assert(indexHtml.includes('openAboutModal()'), 'Missing About link modal');
  assert(indexHtml.includes('openHowItWorksModal()'), 'Missing How It Works link modal');
  assert(indexHtml.includes('openFaqModal()'), 'Missing FAQs link modal');
  assert(indexHtml.includes('openContactModal()'), 'Missing Contact link modal');
});

it('Top bar has notification bell with badge count', () => {
  assert(indexHtml.includes('sp-bell-btn'), 'Missing bell button');
  assert(indexHtml.includes('openNotificationsModal()'), 'Missing notifications click handler');
  assert(indexHtml.includes('sp-badge-count'), 'Missing badge count');
});

it('Top bar has language selector pill with globe and Indian languages', () => {
  assert(indexHtml.includes('sp-lang-pill'), 'Missing language pill');
  assert(indexHtml.includes('setLanguage(this.value)'), 'Missing setLanguage handler');
  assert(indexHtml.includes('हिन्दी (Hindi)'), 'Missing Hindi option');
  assert(indexHtml.includes('ગુજરાતી (Gujarati)'), 'Missing Gujarati option');
});

it('Top bar has user profile chip with Ramesh Kumar & dropdown menu', () => {
  assert(indexHtml.includes('sp-profile-chip'), 'Missing profile chip');
  assert(indexHtml.includes('toggleProfileDropdown'), 'Missing profile dropdown toggle');
  assert(indexHtml.includes('Ramesh Kumar'), 'Missing Ramesh Kumar name');
  assert(indexHtml.includes('sp-profile-role">Farmer'), 'Missing Farmer role');
  assert(indexHtml.includes('sp-dropdown-menu'), 'Missing profile dropdown menu');
});

// 2. Audit CSS Design System
const css = fs.readFileSync(path.join(__dirname, '../public/css/style.css'), 'utf-8');

it('CSS includes complete SmartProcure design tokens and classes', () => {
  const requiredClasses = [
    '.sp-topbar',
    '.sp-brand',
    '.sp-nav-links',
    '.sp-lang-pill',
    '.sp-profile-chip',
    '.sp-dropdown-menu',
    '.sp-app-layout',
    '.sp-sidebar',
    '.sp-nav-item',
    '.sp-promo-card',
    '.sp-main',
    '.sp-hero-banner',
    '.sp-floating-stat',
    '.sp-stat-strip',
    '.sp-content-grid',
    '.sp-finder-card',
    '.sp-centres-grid',
    '.sp-centre-card',
    '.sp-callout-bar',
    '.sp-timeline-container',
    '.sp-weather-main',
    '.sp-mini-map-box',
    '.sp-notif-list',
    '.sp-footer-band'
  ];
  requiredClasses.forEach(cls => {
    assert(css.includes(cls), `Missing CSS class: ${cls}`);
  });
});

// 3. Audit Images
const images = [
  'sp_hero_farmer.jpg',
  'sp_farmer_promo.jpg',
  'sp_mandi_thumb.jpg',
  'sp_footer_bg.jpg'
];

it('All 4 SmartProcure image assets exist in public/images/', () => {
  images.forEach(img => {
    const fullPath = path.join(__dirname, '../public/images', img);
    assert(fs.existsSync(fullPath), `Missing image: ${img}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 10000, `Image file too small: ${img}`);
  });
});

// 4. Audit farmer-portal.js
const farmerPortalJs = fs.readFileSync(path.join(__dirname, '../public/js/farmer-portal.js'), 'utf-8');

it('farmer-portal.js defines getFarmerSidebar with reference links and promo card', () => {
  assert(farmerPortalJs.includes('sp-sidebar'), 'Missing .sp-sidebar');
  assert(farmerPortalJs.includes('Dashboard'), 'Missing Dashboard nav');
  assert(farmerPortalJs.includes('Smart Mandi Finder'), 'Missing Finder nav');
  assert(farmerPortalJs.includes('Book Slot'), 'Missing Book Slot nav');
  assert(farmerPortalJs.includes('Live Queue'), 'Missing Live Queue nav');
  assert(farmerPortalJs.includes('Procurement Status'), 'Missing Procurement Status nav');
  assert(farmerPortalJs.includes('Digital Mandi 2026'), 'Missing promo title');
  assert(farmerPortalJs.includes('/images/sp_farmer_promo.jpg'), 'Missing promo image');
});

it('farmer-portal.js defines renderSmartProcureFarmerView with exact structure', () => {
  assert(farmerPortalJs.includes('renderSmartProcureFarmerView'), 'Missing renderSmartProcureFarmerView');
  assert(farmerPortalJs.includes('Smart Agricultural Procurement System'), 'Missing hero headline');
  assert(farmerPortalJs.includes('sp-floating-stat'), 'Missing floating stat cards');
  assert(farmerPortalJs.includes('Active Bookings'), 'Missing Active Bookings stat');
  assert(farmerPortalJs.includes('Mandis Nearby'), 'Missing Mandis Nearby stat');
  assert(farmerPortalJs.includes('Total Earnings'), 'Missing Total Earnings stat');
  assert(farmerPortalJs.includes('Find Best Mandi'), 'Missing Find Best Mandi card');
  assert(farmerPortalJs.includes('Recommended Procurement Centres'), 'Missing recommendations header');
  assert(farmerPortalJs.includes('Centre C - Vidisha Agro Terminal'), 'Missing Vidisha centre');
  assert(farmerPortalJs.includes('Centre A - APMC Central Mandi Bhopal'), 'Missing Bhopal centre');
  assert(farmerPortalJs.includes('Centre B - Sehore / Indore Terminal'), 'Missing Indore centre');
  assert(farmerPortalJs.includes('Why these centres?'), 'Missing callout strip');
  assert(farmerPortalJs.includes('Your Procurement Journey'), 'Missing Journey widget');
  assert(farmerPortalJs.includes('Weather - Vidisha'), 'Missing Weather widget');
  assert(farmerPortalJs.includes('sp-nearby-map'), 'Missing mini-map element');
  assert(farmerPortalJs.includes('Notifications'), 'Missing notifications widget');
  assert(farmerPortalJs.includes('Empowering India\'s Farmers'), 'Missing footer band');
});

// 5. Audit app.js and client handlers
const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf-8');
const paymentPortalJs = fs.readFileSync(path.join(__dirname, '../public/js/payment-portal.js'), 'utf-8');
const combinedClientJs = appJs + '\n' + paymentPortalJs;

it('client defines all required modal openers and action handlers', () => {
  const requiredFns = [
    'openAboutModal',
    'openHowItWorksModal',
    'openFaqModal',
    'openContactModal',
    'openNotificationsModal',
    'openGrievanceModal',
    'openSihInfoModal',
    'toggleProfileDropdown',
    'runSmartMandiFinderSearch',
    'bookRecommendedSlot',
    'initNearbyMandisMiniMap'
  ];
  requiredFns.forEach(fn => {
    assert(combinedClientJs.includes(fn), `Missing function: ${fn}`);
  });
});


console.log(`\nResults: ${passed} / ${total} tests passed.\n`);
if (passed === total) {
  console.log('🎉 ALL SMARTPROCURE AUDIT TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('⚠️ SOME TESTS FAILED.\n');
  process.exit(1);
}
