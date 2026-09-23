/**
 * 🧪 KPMS Automated Comprehensive i18n Audit Test Suite
 * Validates:
 * 1. Translations dictionary integrity across all 9 languages
 * 2. 100% key parity between English, Gujarati, and Hindi
 * 3. Fallback mechanism and token interpolation
 * 4. Language switching state persistence
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

console.log('\n==================================================');
console.log('🌐 KPMS MULTILINGUAL / I18N ARCHITECTURE AUDIT');
console.log('==================================================\n');

// 1. Load and execute i18n.js in a controlled sandbox
const i18nPath = path.join(__dirname, '..', 'public', 'js', 'i18n.js');
assert(fs.existsSync(i18nPath), 'public/js/i18n.js exists');

let i18nCode = fs.readFileSync(i18nPath, 'utf8');
i18nCode = i18nCode.replace('const translations =', 'translations =');

const mockStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); }
};

const mockDoc = {
  documentElement: { lang: 'en' },
  querySelectorAll() { return []; },
  getElementById() { return null; }
};

const sandbox = {
  window: {
    addEventListener: () => {},
    location: { hash: '#farmer-dashboard' }
  },
  document: mockDoc,
  localStorage: mockStorage,
  addEventListener: () => {},
  console: console
};

vm.createContext(sandbox);
vm.runInContext(i18nCode, sandbox);

const translations = sandbox.translations || sandbox.window.translations;
const getT = sandbox.getT || sandbox.window.getT;
const setLanguage = sandbox.setLanguage || sandbox.window.setLanguage;

assert(typeof translations === 'object' && translations !== null, 'translations dictionary is exported and defined');
assert(typeof getT === 'function', 'getT function is exported and defined');
assert(typeof setLanguage === 'function', 'setLanguage function is exported and defined');

// 2. Check supported languages
const requiredLangs = ['en', 'gu', 'hi', 'mr', 'bn', 'pa', 'ta', 'te', 'kn'];
for (const lang of requiredLangs) {
  assert(translations[lang] && typeof translations[lang] === 'object', `Language '${lang}' dictionary exists`);
}

// 3. Verify Key Parity between EN, GU, HI
const enKeys = Object.keys(translations.en);
const guKeys = Object.keys(translations.gu);
const hiKeys = Object.keys(translations.hi);

console.log(`\n📊 Dictionary Size:`);
console.log(`   - English (en): ${enKeys.length} keys`);
console.log(`   - Gujarati (gu): ${guKeys.length} keys`);
console.log(`   - Hindi (hi): ${hiKeys.length} keys`);

assert(enKeys.length >= 250, `English has comprehensive key coverage (${enKeys.length} keys >= 250)`);

const missingInGu = enKeys.filter(k => translations.gu[k] === undefined || translations.gu[k] === '');
const missingInHi = enKeys.filter(k => translations.hi[k] === undefined || translations.hi[k] === '');

assert(missingInGu.length === 0, `Gujarati has 100% key parity with English (0 missing, found ${missingInGu.length})`);
assert(missingInHi.length === 0, `Hindi has 100% key parity with English (0 missing, found ${missingInHi.length})`);

// 4. Test Language Switching & Persistence
console.log('\n🔄 Testing Language Switching:');
setLanguage('gu');
assert(mockDoc.documentElement.lang === 'gu', 'document.documentElement.lang updated to "gu"');
assert(mockStorage.getItem('kpms_lang') === 'gu', 'localStorage.kpms_lang persisted as "gu"');

// 5. Test Key Translations in Gujarati
console.log('\n🔍 Verifying Specific Gujarati Translations:');
const sampleKeys = [
  'hero_system_title',
  'finder_title',
  'live_rates',
  'your_location',
  'stat_active_bookings',
  'stat_total_earnings',
  'procurement_journey_title',
  'step_centre_selection',
  'weather_widget_title',
  'mandi_ops_title'
];

for (const k of sampleKeys) {
  const guVal = getT(k);
  assert(guVal && guVal !== k && !/^[A-Za-z0-9\s.,_\-—]+$/.test(guVal), `Gujarati '${k}' renders native Gujarati script: "${guVal}"`);
}

// 6. Test Hindi Translations
setLanguage('hi');
assert(mockDoc.documentElement.lang === 'hi', 'document.documentElement.lang updated to "hi"');
for (const k of sampleKeys) {
  const hiVal = getT(k);
  assert(hiVal && hiVal !== k && !/^[A-Za-z0-9\s.,_\-—]+$/.test(hiVal), `Hindi '${k}' renders native Devanagari script: "${hiVal}"`);
}

// 7. Test Parameter Interpolation
console.log('\n🔤 Testing Parameter Interpolation:');
translations.en['test_token'] = 'Token #{token} assigned to counter {counter}';
translations.gu['test_token'] = 'ટોકન #{token} કાઉન્ટર {counter} પર ફાળવેલ છે';

setLanguage('en');
const enInterp = getT('test_token', { token: 'TK-101', counter: 'Desk 4' });
assert(enInterp === 'Token #TK-101 assigned to counter Desk 4', `English interpolation: "${enInterp}"`);

setLanguage('gu');
const guInterp = getT('test_token', { token: 'TK-101', counter: 'Desk 4' });
assert(guInterp === 'ટોકન #TK-101 કાઉન્ટર Desk 4 પર ફાળવેલ છે', `Gujarati interpolation: "${guInterp}"`);

// 8. Test Graceful Fallback for Non-Existent Key
console.log('\n🛡️ Testing Graceful Fallback:');
const fallbackVal = getT('non_existent_key_xyz', 'Default Fallback String');
assert(fallbackVal === 'Default Fallback String', `Graceful fallback returns provided fallback string: "${fallbackVal}"`);

const noFallbackVal = getT('another_missing_key');
assert(noFallbackVal === 'another_missing_key', `Missing key without fallback returns key name safely`);

// Summary
console.log('\n==================================================');
console.log(`AUDIT RESULT: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
