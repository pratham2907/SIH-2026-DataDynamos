const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('public/js/i18n.js', 'utf8');

const ctx = {
  window: { addEventListener: () => {} },
  document: {
    documentElement: {},
    querySelectorAll: () => [],
    getElementById: () => null
  },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = v; }
  }
};

vm.runInNewContext(code, ctx);

console.log('Testing setLanguage and getT:');

// Test English
ctx.window.setLanguage('en');
console.log('EN nav_about:', ctx.window.getT('nav_about'));
console.log('EN hero_title_1:', ctx.window.getT('hero_title_1'));
console.log('EN role_farmer:', ctx.window.getT('role_farmer'));

// Test Marathi
ctx.window.setLanguage('mr');
console.log('MR nav_about:', ctx.window.getT('nav_about'));
console.log('MR hero_title_1:', ctx.window.getT('hero_title_1'));
console.log('MR role_farmer:', ctx.window.getT('role_farmer'));
console.log('MR btn_find_best_mandi:', ctx.window.getT('btn_find_best_mandi'));
console.log('MR auth_welcome_title:', ctx.window.getT('auth_welcome_title'));

// Test Hindi
ctx.window.setLanguage('hi');
console.log('HI nav_about:', ctx.window.getT('nav_about'));
console.log('HI hero_title_1:', ctx.window.getT('hero_title_1'));
console.log('HI role_farmer:', ctx.window.getT('role_farmer'));

// Test Gujarati
ctx.window.setLanguage('gu');
console.log('GU nav_about:', ctx.window.getT('nav_about'));
console.log('GU hero_title_1:', ctx.window.getT('hero_title_1'));
console.log('GU role_farmer:', ctx.window.getT('role_farmer'));
