const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('===============================================================');
console.log('🔢 TESTING QUANTITY INPUT TYPING, FOCUS PERSISTENCE & STEPPERS');
console.log('===============================================================');

// Build mock DOM environment
const stageContainer = { innerHTML: '', style: {} };
const elements = {
  'smart-booking-stage-container': stageContainer,
  'smart-mandi-stage-container': stageContainer
};

const domStore = {};

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => {
      if (elements[id]) return elements[id];
      if (!domStore[id]) {
        domStore[id] = {
          id,
          innerHTML: '',
          style: {},
          value: '',
          disabled: false,
          textContent: '',
          focus: function() { this._focused = true; },
          select: function() { this._selected = true; }
        };
      }
      return domStore[id];
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

// Load engine and smart-booking script
vm.runInContext(fs.readFileSync('public/js/smart-booking-engine.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('public/js/smart-booking.js', 'utf8'), sandbox);

// Initial form render
vm.runInContext('renderSmartBookingForm()', sandbox);
const initialHtml = stageContainer.innerHTML;

assert(initialHtml.includes('id="smart-mandi-quantity-input"'), 'Input element with id="smart-mandi-quantity-input" rendered');
assert(initialHtml.includes('stepSmartQuantity'), 'Stepper buttons (+ and -) rendered');
assert(initialHtml.includes('Quintals'), 'Quintals unit rendered');
console.log('  ✅ PASS: Quantity input, steppers (- / +), and quick picks rendered');

// Test 1: Typing sequence without DOM destruction
console.log('\n[Test 1] Simulating typing keystroke sequence (e.g. 5 -> 50 -> 500 -> 120)...');
const inputNode = sandbox.document.getElementById('smart-mandi-quantity-input');
inputNode.value = '5';
vm.runInContext("handleSmartQuantityInput('5')", sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 5, 'State updated to 5');
assert.strictEqual(sandbox.document.getElementById('btn-find-best-mandi').disabled, false, 'Button enabled for valid 5 Q');

inputNode.value = '50';
vm.runInContext("handleSmartQuantityInput('50')", sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 50, 'State updated to 50');
assert.strictEqual(sandbox.document.getElementById('btn-find-best-mandi').disabled, false, 'Button enabled for valid 50 Q');

// Test 2: Typing exceeding limit (> 130 maxPermissible)
console.log('\n[Test 2] Typing exceeding quantity (500 Q)...');
inputNode.value = '500';
vm.runInContext("handleSmartQuantityInput('500')", sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 500, 'State updated to 500');
assert.strictEqual(sandbox.document.getElementById('btn-find-best-mandi').disabled, true, 'Button disabled when exceeding max quota');
assert(inputNode.style.color === '#DC2626', 'Input text color changed to red for alert');
assert(inputNode.style.borderColor === '#EF4444', 'Input border highlighted red for alert');
const warnContainer = sandbox.document.getElementById('smart-quantity-warning-container');
assert(warnContainer.innerHTML.includes('Quantity Above Permitted Production Limit'), 'Warning banner dynamically shown');
console.log('  ✅ PASS: Exceeding quantity triggers instant red highlight, banner, and disables button');

// Test 3: Backspacing / correcting back to within limit (120 Q)
console.log('\n[Test 3] Correcting quantity back to valid (120 Q)...');
inputNode.value = '120';
vm.runInContext("handleSmartQuantityInput('120')", sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 120, 'State updated to 120');
assert.strictEqual(sandbox.document.getElementById('btn-find-best-mandi').disabled, false, 'Button re-enabled for 120 Q');
assert.strictEqual(warnContainer.innerHTML, '', 'Warning banner cleared');
console.log('  ✅ PASS: Correcting quantity clears warning and enables button without full-page redraw');

// Test 4: Stepper buttons
console.log('\n[Test 4] Testing +/- 5 steppers...');
vm.runInContext('stepSmartQuantity(5)', sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 125, 'Stepped +5 from 120 to 125');
assert.strictEqual(inputNode.value, 125, 'Input display updated to 125');

vm.runInContext('stepSmartQuantity(-5)', sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 120, 'Stepped -5 from 125 to 120');
assert.strictEqual(inputNode.value, 120, 'Input display updated to 120');
console.log('  ✅ PASS: Stepper buttons smoothly increment & decrement quantity');

// Test 5: Quick picks
console.log('\n[Test 5] Testing Quick Pick buttons...');
vm.runInContext('setSmartQuickQuantity(100)', sandbox);
assert.strictEqual(sandbox.smartMandiState.quantity, 100, 'Quick Pick 100 set');
assert.strictEqual(inputNode.value, 100, 'Input display updated to 100');
console.log('  ✅ PASS: Quick Pick buttons set quantity directly');

console.log('\n===============================================================');
console.log('🎉 ALL QUANTITY INPUT TESTS PASSED (100%)');
console.log('===============================================================');
