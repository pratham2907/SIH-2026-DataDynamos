const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- STARTING COMPREHENSIVE LANGUAGE SWITCHING VERIFICATION ---');

// Mock a lightweight browser DOM environment
class DOMElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.attributes = {};
    this.children = [];
    this._innerHTML = '';
    this.style = {};
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  get textContent() {
    return this._textContent !== undefined ? this._textContent : this._innerHTML.replace(/<[^>]*>/g, '');
  }

  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = String(html);
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      if (selector.startsWith('[data-i18n]')) {
        if (node.getAttribute && node.getAttribute('data-i18n')) results.push(node);
      } else if (selector.startsWith('[data-i18n-placeholder]')) {
        if (node.getAttribute && node.getAttribute('data-i18n-placeholder')) results.push(node);
      } else if (selector.startsWith('[data-i18n-title]')) {
        if (node.getAttribute && node.getAttribute('data-i18n-title')) results.push(node);
      }
      for (const ch of node.children || []) walk(ch);
    };
    walk(this);
    return results;
  }

  getElementById(id) {
    let found = null;
    const walk = (node) => {
      if (node.id === id) {
        found = node;
        return;
      }
      for (const ch of node.children || []) {
        walk(ch);
        if (found) return;
      }
    };
    walk(this);
    return found;
  }
}

// Set up mock DOM with navigation elements
const doc = new DOMElement('HTML');
doc.documentElement = doc;

const navHome = new DOMElement('A', 'sp-nav-home');
navHome.setAttribute('data-i18n', 'nav_home');
navHome.textContent = 'Home';

const navAbout = new DOMElement('A');
navAbout.setAttribute('data-i18n', 'nav_about');
navAbout.textContent = 'About';

const navHow = new DOMElement('A');
navHow.setAttribute('data-i18n', 'nav_how_it_works');
navHow.textContent = 'How It Works';

const navFaqs = new DOMElement('A');
navFaqs.setAttribute('data-i18n', 'nav_faqs');
navFaqs.textContent = 'FAQs';

const navContact = new DOMElement('A');
navContact.setAttribute('data-i18n', 'nav_contact');
navContact.textContent = 'Contact';

const brandSub = new DOMElement('DIV');
brandSub.setAttribute('data-i18n', 'brand_subtitle_tag');
brandSub.textContent = 'Digital India • Smart Agriculture';

const langSelector = new DOMElement('SELECT', 'lang-selector');
langSelector.value = 'en';

const appContainer = new DOMElement('DIV', 'app-view-container');
const heroAuthCard = new DOMElement('DIV', 'sp-hero-auth-card');
const heroAuthContent = new DOMElement('DIV', 'sp-hero-auth-content');

heroAuthCard.children = [heroAuthContent];
appContainer.children = [heroAuthCard];

doc.children = [navHome, navAbout, navHow, navFaqs, navContact, brandSub, langSelector, appContainer];


const windowObj = {
  location: { hash: '#landing' },
  addEventListener: () => {},
  document: doc,
  unreadNotificationCount: 2
};

const localStorageMock = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); }
};

const sandbox = {
  window: windowObj,
  document: doc,
  localStorage: localStorageMock,
  location: windowObj.location,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

vm.createContext(sandbox);

// 1. Load i18n.js
const i18nCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'i18n.js'), 'utf8');
vm.runInContext(i18nCode, sandbox);

// 2. Load landing-page.js
const landingCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'landing-page.js'), 'utf8');
vm.runInContext(landingCode, sandbox);

// 3. Load app.js (mocking auth/toast helpers where needed)
sandbox.getCurrentUser = () => null;
sandbox.updateNavAuth = () => {};
sandbox.showToast = () => {};

const appCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'app.js'), 'utf8');
vm.runInContext(appCode, sandbox);

// 4. Verify English default rendering
sandbox.window.setLanguage('en');
sandbox.window.renderPublicLandingPage();

console.log('1. Initial English Rendering Check:');
assert(appContainer.innerHTML.includes('Smart Procurement.'), 'Hero title should be English');
assert(appContainer.innerHTML.includes('Find Best Mandi'), 'Button should be English');
assert(appContainer.innerHTML.includes('Welcome to SmartProcure'), 'Auth card should be English');
console.log('   ✓ English content verified');

// 5. Switch to Marathi ('mr')
console.log('2. Switching Language to Marathi (mr)...');
sandbox.window.setLanguage('mr');

// Verify navbar elements updated via [data-i18n]
console.log('   Nav Home text:', navHome.textContent);
assert.strictEqual(navHome.textContent, 'मुख्य पृष्ठ');
console.log('   Nav About text:', navAbout.textContent);
assert.strictEqual(navAbout.textContent, 'विषयी');
console.log('   Nav How It Works text:', navHow.textContent);
assert.strictEqual(navHow.textContent, 'कसे कार्य करते');
console.log('   Nav FAQs text:', navFaqs.textContent);
assert.strictEqual(navFaqs.textContent, 'वारंवार विचारले जाणारे प्रश्न');
console.log('   Nav Contact text:', navContact.textContent);
assert.strictEqual(navContact.textContent, 'संपर्क');
console.log('   Brand Subtitle text:', brandSub.textContent);
assert.strictEqual(brandSub.textContent, 'डिजिटल इंडिया • स्मार्ट कृषी');

// Verify Landing page re-rendered in Marathi automatically
console.log('   Checking Hero & Auth Card translated content in Marathi:');
assert(appContainer.innerHTML.includes('स्मार्ट खरेदी.'), 'Hero title 1 must be translated to Marathi');
assert(appContainer.innerHTML.includes('कमी प्रतीक्षा.'), 'Hero title 2 must be translated to Marathi');
assert(appContainer.innerHTML.includes('शेतकऱ्यांना अधिक परतावा.'), 'Hero title 3 must be translated to Marathi');
assert(appContainer.innerHTML.includes('सर्वोत्तम बाजार शोधा'), 'Find Best Mandi CTA must be translated to Marathi');
assert(appContainer.innerHTML.includes('खरेदी ट्रॅक करा'), 'Track Procurement CTA must be translated to Marathi');
assert(appContainer.innerHTML.includes('स्मार्टप्रोक्युअर मध्ये आपले स्वागत आहे'), 'Auth card title must be Marathi');
assert(appContainer.innerHTML.includes('कृषी खरेदीत आपला विश्वासू भागीदार'), 'Auth card sub must be Marathi');
assert(appContainer.innerHTML.includes('शेतकरी'), 'Role Farmer must be Marathi');
assert(appContainer.innerHTML.includes('अधिकारी'), 'Role Officer must be Marathi');
assert(appContainer.innerHTML.includes('सुपर अ‍ॅडमिन'), 'Role Admin must be Marathi');
assert(appContainer.innerHTML.includes('किसान पोर्टलवर लॉगिन करा'), 'Submit button must be Marathi');
assert(appContainer.innerHTML.includes('पासवर्ड विसरलात?'), 'Forgot password must be Marathi');
assert(appContainer.innerHTML.includes('हे डिव्हाइस लक्षात ठेवा'), 'Remember me must be Marathi');
assert(appContainer.innerHTML.includes('खाते नाही का?'), 'Don\'t have account must be Marathi');
assert(appContainer.innerHTML.includes('आता नोंदणी करा'), 'Register now must be Marathi');
console.log('   ✓ Marathi translation verified across navbar, hero, stats, and auth card!');

// 6. Test Hero Auth Role switching in Marathi
console.log('3. Switching Auth Role to Officer in Marathi...');
sandbox.window.switchHeroAuthRole('officer');
assert(heroAuthContent.innerHTML.includes('अधिकारी पोर्टलवर लॉगिन करा'), 'Officer login button must be translated');
console.log('   ✓ Officer role switch in Marathi verified');

// 7. Test Hero Auth Tab switching to Register in Marathi
console.log('4. Switching Auth Tab to Register in Marathi...');
sandbox.window.switchHeroAuthTab('register');

assert(heroAuthCard.innerHTML.includes('शेतकरी / किसान नोंदणी'), 'Farmer registration card title must be translated');
assert(heroAuthCard.innerHTML.includes('खरेदी अधिकारी नोंदणी'), 'Officer registration card title must be translated');
assert(heroAuthCard.innerHTML.includes('आधीच नोंदणी केली आहे?'), 'Already registered must be translated');
assert(heroAuthCard.innerHTML.includes('लॉगिनवर परत जा'), 'Back to login must be translated');
console.log('   ✓ Registration view in Marathi verified');

// 8. Test Hindi ('hi')
console.log('5. Switching Language to Hindi (hi)...');
sandbox.window.setLanguage('hi');
assert.strictEqual(navHome.textContent, 'होम');
assert.strictEqual(navAbout.textContent, 'के बारे में');
assert.strictEqual(navHow.textContent, 'यह कैसे काम करता है');
assert.strictEqual(navFaqs.textContent, 'सामान्य प्रश्न');
assert(appContainer.innerHTML.includes('स्मार्ट खरीद.'), 'Hero title in Hindi verified');
assert(appContainer.innerHTML.includes('सर्वोत्तम मंडी खोजें'), 'CTA in Hindi verified');
assert(appContainer.innerHTML.includes('किसान पंजीकरण'), 'Reg card in Hindi verified');
console.log('   ✓ Hindi translation verified');

// 9. Test Gujarati ('gu')
console.log('6. Switching Language to Gujarati (gu)...');
sandbox.window.setLanguage('gu');
assert.strictEqual(navHome.textContent, 'મુખ્ય પૃષ્ઠ');
assert.strictEqual(navAbout.textContent, 'વિશે');
assert(appContainer.innerHTML.includes('સ્માર્ટ ખરીદી.'), 'Hero title in Gujarati verified');
assert(appContainer.innerHTML.includes('શ્રેષ્ઠ મંડી શોધો'), 'CTA in Gujarati verified');
console.log('   ✓ Gujarati translation verified');

// 10. Test Farmer Portal Sidebar translation
console.log('7. Testing Farmer Portal Sidebar translation in Marathi...');
sandbox.window.setLanguage('mr');
const farmerPortalCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'farmer-portal.js'), 'utf8');
vm.runInContext(farmerPortalCode, sandbox);
const sidebarHtml = sandbox.window.getFarmerSidebar({ name: 'Ramesh' }, 'dashboard');
assert(sidebarHtml.includes('डॅशबोर्ड'), 'Sidebar dashboard link translated to Marathi');

assert(sidebarHtml.includes('स्मार्ट बाजार शोधक'), 'Sidebar smart mandi finder link translated to Marathi');
assert(sidebarHtml.includes('स्लॉट बुक करा'), 'Sidebar book slot link translated to Marathi');
assert(sidebarHtml.includes('माझे बुकिंग'), 'Sidebar my bookings link translated to Marathi');
assert(sidebarHtml.includes('थेट रांग'), 'Sidebar live queue link translated to Marathi');
console.log('   ✓ Farmer portal sidebar translations verified');

console.log('\n--- ALL LANGUAGE SWITCHING TESTS PASSED PERFECTLY! ---');
