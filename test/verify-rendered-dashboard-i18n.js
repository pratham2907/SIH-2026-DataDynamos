const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('Testing full dashboard render with Gujarati and Hindi translations...\n');

const i18nCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'i18n.js'), 'utf8')
  .replace('const translations =', 'translations =');

const farmerCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'farmer-portal.js'), 'utf8');

const container = {
  innerHTML: ''
};

const mockDoc = {
  documentElement: { lang: 'en' },
  querySelectorAll: () => [],
  getElementById: (id) => {
    if (id === 'app-view-container') return container;
    return null;
  }
};

const sandbox = {
  window: {
    addEventListener: () => {},
    location: { hash: '#farmer-dashboard' },
    unreadNotificationCount: 2
  },
  document: mockDoc,
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); }
  },
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  routeTo: () => {},
  openLocationPickerModal: () => {},
  runSmartMandiFinderSearch: () => {},
  openNotificationsModal: () => {},
  openGrievanceModal: () => {},
  openSihInfoModal: () => {},
  showToast: () => {}
};

vm.createContext(sandbox);
vm.runInContext(i18nCode, sandbox);
vm.runInContext(farmerCode, sandbox);

// 1. Test Gujarati ('gu')
const setLang = sandbox.setLanguage || sandbox.window.setLanguage;
const renderView = sandbox.renderSmartProcureFarmerView || sandbox.window.renderSmartProcureFarmerView;

setLang('gu');
renderView();

const guHtml = container.innerHTML;
console.log('--- Checking Gujarati Rendered Output ---');

const expectedGuStrings = [
  'સ્માર્ટ કૃષિ પ્રાપ્તિ વ્યવસ્થાપન પ્રણાલી',
  'શ્રેષ્ઠ ખરીદ કેન્દ્ર શોધો, તમારો સ્લોટ બુક કરો',
  'સમયસર ઉપાર્જન',
  'જોડાયેલ મંડીઓ',
  'સીધી બેંક ટ્રાન્સફર (DBT)',
  'સક્રિય બુકિંગ',
  'નજીકની મંડીઓ',
  'વર્તમાન સ્ટોક',
  'સમયસર આગમન',
  'કુલ કમાણી',
  'શ્રેષ્ઠ મંડી શોધો',
  'લાઇવ ભાવો',
  'તમારું સ્થાન',
  'ભલામણ કરેલ ઉપાર્જન કેન્દ્રો',
  'શા માટે આ કેન્દ્રો?',
  'તમારી પ્રાપ્તિ યાત્રા',
  '૧. કેન્દ્રની પસંદગી',
  '૨. સ્લોટ બુકિંગ',
  '૩. ડિજિટલ ક્યુઆર પાસ',
  '૪. ગેટ પ્રવેશ',
  '૫. ગુણવત્તા પરીક્ષણ',
  '૬. વજન ચકાસણી',
  '૭. જે-ફોર્મ રસીદ',
  '૮. ડીબીટી ચુકવણી',
  'હવામાન - વિદેશા',
  'નજીકની મંડીઓ',
  'મંડી કામગીરી અને સહાય',
  'ગુણવત્તા અને ભેજ માર્ગદર્શિકા',
  'રાષ્ટ્રીય કૃષિ પ્રાપ્તિ ખાતરી અને ન્યાયી તોલ ગેરેંટી',
  'સ્માર્ટ ઉપાર્જન દ્વારા ભારતના ખેડૂતોનું સશક્તિકરણ'
];

let guPassed = 0;
for (const str of expectedGuStrings) {
  if (guHtml.includes(str)) {
    console.log(`  ✅ Found: "${str}"`);
    guPassed++;
  } else {
    console.error(`  ❌ Missing: "${str}"`);
  }
}

console.log(`\nGujarati Strings Verified: ${guPassed} / ${expectedGuStrings.length}\n`);

// 2. Test Hindi ('hi')
setLang('hi');
renderView();

const hiHtml = container.innerHTML;
console.log('--- Checking Hindi Rendered Output ---');

const expectedHiStrings = [
  'स्मार्ट कृषि उपार्जन प्रबंधन प्रणाली',
  'सर्वोत्तम खरीद केंद्र खोजें, अपना स्लॉट बुक करें',
  'समय पर उपार्जन',
  'संबद्ध मंडियां',
  'सीधा बैंक अंतरण (DBT)',
  'सक्रिय बुकिंग',
  'निकटवर्ती मंडियां',
  'वर्तमान स्टॉक',
  'समय पर आगमन',
  'कुल आय',
  'सर्वोत्तम मंडी खोजें',
  'लाइव भाव',
  'आपका स्थान',
  'अनुशंसित उपार्जन केंद्र',
  'यही केंद्र क्यों?',
  'आपकी उपार्जन यात्रा',
  '१. केंद्र चयन',
  '२. स्लॉट बुकिंग',
  '३. डिजिटल क्यूआर पास',
  '४. गेट प्रवेश',
  '५. गुणवत्ता परीक्षण',
  '६. तुलाई एवं वजन',
  '७. जे-फॉर्म रसीद',
  '८. डीबीटी भुगतान',
  'मौसम - विदिशा',
  'निकटवर्ती मंडियां',
  'मंडी संचालन एवं सहायता',
  'गुणवत्ता एवं नमी मार्गदर्शिका',
  'राष्ट्रीय कृषि उपार्जन आश्वासन एवं पारदर्शी तुलाई गारंटी',
  'स्मार्ट उपार्जन द्वारा भारत के किसानों का सशक्तिकरण'
];

let hiPassed = 0;
for (const str of expectedHiStrings) {
  if (hiHtml.includes(str)) {
    console.log(`  ✅ Found: "${str}"`);
    hiPassed++;
  } else {
    console.error(`  ❌ Missing: "${str}"`);
  }
}

console.log(`\nHindi Strings Verified: ${hiPassed} / ${expectedHiStrings.length}\n`);

if (guPassed === expectedGuStrings.length && hiPassed === expectedHiStrings.length) {
  console.log('🎉 ALL DASHBOARD MULTILINGUAL RENDERING CHECKS PASSED WITH 100% SUCCESS!');
  process.exit(0);
} else {
  process.exit(1);
}
