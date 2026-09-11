// Simulate exact browser loading sequence to find runtime errors
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const domHtml = fs.readFileSync('public/index.html', 'utf8');

// Build browser-like sandbox
const listeners = {};
const mockStorage = {};

const sandbox = {
  window: {},
  document: {
    documentElement: {
      getAttribute: () => 'light',
      setAttribute: () => {}
    },
    getElementById: (id) => {
      // Return a basic mock element
      return {
        id,
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false,
          toggle: () => {}
        },
        style: {},
        innerHTML: '',
        textContent: '',
        value: '',
        addEventListener: () => {},
        querySelectorAll: () => [],
        querySelector: () => null,
        appendChild: () => {}
      };
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (tag) => ({
      tagName: tag,
      classList: { add: () => {}, remove: () => {} },
      style: {},
      innerHTML: '',
      appendChild: () => {}
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: (evt, fn) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    }
  },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: (k) => { delete mockStorage[k]; }
  },
  navigator: {
    serviceWorker: { register: () => Promise.resolve() }
  },
  location: {
    hash: '',
    origin: 'http://localhost:7008'
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  fetch: () => Promise.resolve({ json: () => Promise.resolve({ success: true, data: {} }), text: () => Promise.resolve('') }),
  L: {
    map: () => ({
      tileLayer: () => ({ addTo: () => {} }),
      setView: () => {}
    }),
    tileLayer: () => ({ addTo: () => {} }),
    circleMarker: () => ({ addTo: () => {}, bindPopup: () => {} }),
    marker: () => ({ addTo: () => {}, bindPopup: () => {} })
  },
  Chart: function() {},
  gsap: { to: () => {}, from: () => {} },
  io: () => ({ on: () => {}, emit: () => {} }),
  configuration: {}
};

sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.self = sandbox;

sandbox.addEventListener = (evt, fn) => {
  if (!listeners[evt]) listeners[evt] = [];
  listeners[evt].push(fn);
};
sandbox.window.addEventListener = sandbox.addEventListener;

vm.createContext(sandbox);

const scripts = [
  'public/js/i18n.js',
  'public/js/location-service.js',
  'public/js/msg91-service.js',
  'public/js/socket-client.js',
  'public/js/auth.js',
  'public/js/smart-booking-engine.js',
  'public/js/smart-booking.js',
  'public/js/mandi-prices.js',
  'public/js/farmer-portal.js',
  'public/js/booking-portal.js',
  'public/js/queue-portal.js',
  'public/js/officer-portal.js',
  'public/js/procurement-workflow.js',
  'public/js/payment-portal.js',
  'public/js/admin-portal.js',
  'public/js/display-board.js',
  'public/js/ai-assistant.js',
  'public/js/sih-tour.js',
  'public/js/registration.js',
  'public/js/landing-page.js',
  'public/js/app.js'
];

console.log('Loading scripts in order...');
for (const script of scripts) {
  try {
    const code = fs.readFileSync(script, 'utf8');
    vm.runInContext(code, sandbox, { filename: script });
    console.log('  Loaded:', script);
  } catch (err) {
    console.error('❌ ERROR running script:', script, err);
    process.exit(1);
  }
}

console.log('Triggering DOMContentLoaded listeners...');
if (listeners['DOMContentLoaded']) {
  for (const fn of listeners['DOMContentLoaded']) {
    try {
      fn();
    } catch (err) {
      console.error('❌ ERROR in DOMContentLoaded listener:', err);
      process.exit(1);
    }
  }
}

console.log('Testing renderRoute("#landing")...');
try {
  sandbox.renderRoute('#landing');
  console.log('✅ renderRoute("#landing") executed successfully!');
} catch (err) {
  console.error('❌ ERROR in renderRoute("#landing"):', err);
  process.exit(1);
}

console.log('Testing renderRoute("#farmer-dashboard")...');
try {
  sandbox.renderRoute('#farmer-dashboard');
  console.log('✅ renderRoute("#farmer-dashboard") executed successfully!');
} catch (err) {
  console.error('❌ ERROR in renderRoute("#farmer-dashboard"):', err);
  process.exit(1);
}

console.log('All simulated browser actions passed!');
process.exit(0);

