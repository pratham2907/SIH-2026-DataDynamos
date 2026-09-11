const fs = require('fs');
let code = fs.readFileSync('public/js/i18n.js', 'utf8');

code = code.replace(/recommended_option:\s*"([^"]+)"(\s*\n\s*\/\/ Landing)/g, 'recommended_option: "$1",$2');
fs.writeFileSync('public/js/i18n.js', code, 'utf8');

const vm = require('vm');
const ctx = {
  window: { addEventListener: () => {} },
  document: {
    documentElement: {},
    querySelectorAll: () => [],
    getElementById: () => null
  },
  localStorage: { getItem: () => 'en', setItem: () => {} }
};

try {
  vm.runInNewContext(code, ctx);
  console.log('Syntax OK! All languages parsed successfully.');
} catch (e) {
  console.error('Validation error:', e);
}
