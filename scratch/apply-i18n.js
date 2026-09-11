const fs = require('fs');
const path = require('path');
const { landingTranslations } = require('./test-i18n-builder');

const i18nPath = path.join(__dirname, '..', 'public', 'js', 'i18n.js');
let content = fs.readFileSync(i18nPath, 'utf8');

// For each language in landingTranslations, we inject the keys right inside the language block
for (const [lang, keys] of Object.entries(landingTranslations)) {
  const langRegex = new RegExp(`(${lang}:\\s*\\{[\\s\\S]*?)(status_dbt_paid:[^,\\n]+,?)`, 'm');
  const match = content.match(langRegex);
  if (!match) {
    console.error(`Could not match language block for ${lang}`);
    continue;
  }

  // Format keys as JS code
  const lines = Object.entries(keys).map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`).join('\n');
  const replacement = `${match[1]}${match[2]}\n\n    // Landing & Authentication Keys\n${lines}`;
  content = content.replace(match[0], replacement);
}

// Now ensure setLanguage handles renderRoute, renderLandingPage, renderPublicLandingPage reliably
const oldSetLanguageRegex = /const setLanguage = \(lang\) => \{[\s\S]*?window\.setLanguage = setLanguage;/;
const newSetLanguageCode = `const setLanguage = (lang) => {
  if (!translations[lang]) lang = 'en';
  currentLanguage = lang;
  localStorage.setItem('kpms_lang', lang);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
  }

  // 1. Update all static [data-i18n] text contents
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = getT(key);
    if (val) el.textContent = val;
  });

  // 2. Update all [data-i18n-placeholder] attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = getT(key);
    if (val) el.setAttribute('placeholder', val);
  });

  // 3. Update all [data-i18n-title] attributes
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    const val = getT(key);
    if (val) el.setAttribute('title', val);
  });

  // 4. Update language selector dropdown if exists
  const sel = document.getElementById('lang-selector');
  if (sel) sel.value = lang;

  // 5. Update header navigation items
  const btnSmartBooking = document.getElementById('nav-btn-smart-booking');
  if (btnSmartBooking) btnSmartBooking.innerHTML = \`<i class="fas fa-wand-magic-sparkles"></i> \${getT('nav_smart_booking')}\`;

  const btnMandiPrices = document.getElementById('nav-btn-mandi-prices');
  if (btnMandiPrices) btnMandiPrices.innerHTML = \`<i class="fas fa-carrot"></i> \${getT('nav_mandi_prices')}\`;

  const btnDisplayBoard = document.getElementById('nav-btn-display-board');
  if (btnDisplayBoard) btnDisplayBoard.innerHTML = \`<i class="fas fa-tv"></i> \${getT('nav_display_board')}\`;

  const btnKisanSahayak = document.getElementById('nav-btn-kisan-sahayak');
  if (btnKisanSahayak) btnKisanSahayak.innerHTML = \`<i class="fas fa-circle-question"></i> \${getT('nav_kisan_sahayak')}\`;

  // 6. Update auth navigation buttons
  if (typeof updateNavAuth === 'function') {
    updateNavAuth();
  } else if (typeof window !== 'undefined' && typeof window.updateNavAuth === 'function') {
    window.updateNavAuth();
  }

  // 7. Live re-render current SPA view seamlessly
  if (typeof window !== 'undefined') {
    if (typeof window.renderRoute === 'function') {
      window.renderRoute(window.location.hash || '#landing');
    } else if (typeof window.renderLandingPage === 'function') {
      window.renderLandingPage();
    } else if (typeof window.renderPublicLandingPage === 'function' && (!window.location.hash || window.location.hash === '#landing' || window.location.hash === '#')) {
      window.renderPublicLandingPage();
    }
  }
};

window.setLanguage = setLanguage;`;

if (!content.match(oldSetLanguageRegex)) {
  console.error('Could not match setLanguage definition in i18n.js');
} else {
  content = content.replace(oldSetLanguageRegex, newSetLanguageCode);
}

fs.writeFileSync(i18nPath, content, 'utf8');
console.log('Successfully updated i18n.js');
