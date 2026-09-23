const fs = require('fs');
const path = require('path');
const vm = require('vm');

const i18nPath = path.join(__dirname, '..', 'public', 'js', 'i18n.js');
let content = fs.readFileSync(i18nPath, 'utf8');

const supportedLangs = ['en', 'hi', 'gu', 'mr', 'bn', 'pa', 'ta', 'te', 'kn'];

// Read existing translations
let scriptContent = content.replace('const translations =', 'translations =');
const sandbox = {
  window: { addEventListener: () => {} },
  document: { querySelectorAll: () => [], getElementById: () => null },
  localStorage: { getItem: () => 'en', setItem: () => {} },
  addEventListener: () => {}
};
vm.createContext(sandbox);
vm.runInContext(scriptContent, sandbox);

const currentTranslations = sandbox.translations;

const extraKeys = {
  // Navigation & General
  officer_console: { en: "Officer Console", hi: "अधिकारी कंसोल", gu: "અધિકારી કન્સોલ" },
  operations_console: { en: "Operations Console", hi: "संचालन कंसोल", gu: "સંચાલન કન્સોલ" },
  gate_qr_scanner: { en: "Gate QR Scanner", hi: "गेट क्यूआर स्कैनर", gu: "ગેટ ક્યુઆર સ્કેનર" },
  multi_counter_queue: { en: "Multi-Counter Queue", hi: "मल्टी-काउंटर कतार", gu: "મલ્ટી-કાઉન્ટર કતાર" },
  weighbridge_quality: { en: "Weighbridge & Quality", hi: "धर्मकांटा एवं गुणवत्ता", gu: "વેબ્રિજ અને ગુણવત્તા" },
  farmer_lookup: { en: "Universal Farmer Lookup", hi: "किसान खोज", gu: "ખેડૂત શોધ" },
  mandi_announcements: { en: "Mandi Announcements", hi: "मंडी घोषणाएं", gu: "મંડી જાહેરાતો" },
  tv_display_mode: { en: "Public Display TV Mode", hi: "सार्वजनिक डिस्प्ले टीवी", gu: "જાહેર ડિસ્પ્લે ટીવી" },
  btn_scan_pass: { en: "Scan Pass", hi: "पास स्कैन करें", gu: "પાસ સ્કેન કરો" },
  btn_call_next_farmer: { en: "Call Next Farmer", hi: "अगले किसान को बुलाएं", gu: "આગામી ખેડૂતને બોલાવો" },
  farmers_waiting_in_queue: { en: "Farmers Waiting in Queue", hi: "कतार में प्रतीक्षारत किसान", gu: "કતારમાં રાહ જોતા ખેડૂતો" },
  procurements_completed_today: { en: "Procurements Completed Today", hi: "आज पूर्ण किया गया उपार्जन", gu: "આજે પૂર્ણ થયેલ ઉપાર્જન" },
  national_administration: { en: "National Administration", hi: "राष्ट्रीय प्रशासन", gu: "રાષ્ટ્રીય વહીવટ" },
  national_overview: { en: "National Overview", hi: "राष्ट्रीय समीक्षा", gu: "રાષ્ટ્રીય વિહંગાવલોકન" },
  mandi_centers_crud: { en: "Mandi Centers Management", hi: "मंडी केंद्र प्रबंधन", gu: "મંડી કેન્દ્ર સંચાલન" },
  officer_allocations: { en: "Officer Allocations", hi: "अधिकारी आवंटन", gu: "અધિકારી ફાળવણી" },
  pending_officer_approvals: { en: "Pending Officer Approvals", hi: "लंबित अधिकारी अनुमोदन", gu: "બાકી રહેલ અધિકારી મંજૂરી" },
  bulk_dbt_release: { en: "Bulk DBT Treasury Release", hi: "सामूहिक डीबीटी भुगतान जारी करें", gu: "જથ્થાબંધ ડીબીટી ચુકવણી રજૂ કરો" },
  db_backup_restore: { en: "Database Backup & Restore", hi: "डेटाबेस बैकअप एवं रीस्टोर", gu: "ડેટાબેઝ બેકઅપ અને રીસ્ટોર" },
  congestion_predictor: { en: "Congestion & Demand Predictor", hi: "भीड़ एवं मांग पूर्वानुमान", gu: "ભીડ અને માંગ આગાહી" },

  // Queue Portal
  no_active_queue_token: { en: "No Active Queue Token", hi: "कोई सक्रिय टोकन नहीं", gu: "કોઈ સક્રિય ટોકન નથી" },
  no_active_queue_desc: {
    en: "You do not have an active queue token for today. Once you book a slot and arrive at the Mandi entrance, show your QR Pass to the Officer Gate Scanner to enter the digital queue.",
    hi: "आपके पास आज के लिए कोई सक्रिय कतार टोकन नहीं है। स्लॉट बुक करने और मंडी गेट पर पहुंचने पर गेट स्कैनर पर अपना क्यूआर पास दिखाएं।",
    gu: "તમારી પાસે આજ માટે કોઈ સક્રિય કતાર ટોકન નથી. સ્લોટ બુક કર્યા પછી મંડી પહોંચીને ગેટ સ્કેનર પર તમારો ક્યુઆર પાસ બતાવો."
  },
  btn_view_qr_passes: { en: "View QR Passes", hi: "क्यूआर पास देखें", gu: "ક્યુઆર પાસ જુઓ" },
  btn_refresh: { en: "Refresh", hi: "ताज़ा करें", gu: "રીફ્રેશ કરો" },
  token_number: { en: "Token Number", hi: "टोकन संख्या", gu: "ટોકન નંબર" },
  farmers_ahead: { en: "Farmers Ahead", hi: "आगे प्रतीक्षारत किसान", gu: "આગળ રાહ જોતા ખેડૂતો" },
  currently_serving_at: { en: "Currently Serving at", hi: "वर्तमान में सेवारत", gu: "હાલમાં સેવામાં" },

  // Payment Portal
  dbt_payouts_title: { en: "Direct Benefit Transfer (DBT) Payouts", hi: "सीधे बैंक अंतरण (DBT) भुगतान", gu: "સીધી બેંક ટ્રાન્સફર (DBT) ચુકવણી" },
  dbt_payouts_sub: {
    en: "Track real-time treasury disbursements, test gateway settlements, and download digital tax-exempt vouchers.",
    hi: "रियल-टाइम ट्रेजरी भुगतान ट्रैक करें, परीक्षण गेटवे निपटान देखें और डिजिटल रसीदें डाउनलोड करें।",
    gu: "રીઅલ-ટાઇમ તિજોરી ચુકવણી ટ્રેક કરો અને ડિજિટલ રસીદો ડાઉનલોડ કરો."
  },
  btn_test_checkout: { en: "Test Razorpay Checkout", hi: "रेज़रपे भुगतान परीक्षण", gu: "રેઝરપે ચુકવણી પરીક્ષણ" },
  btn_raise_grievance: { en: "Raise Payment Grievance", hi: "भुगतान संबंधी शिकायत दर्ज करें", gu: "ચુકવણી ફરિયાદ નોંધાવો" },
  total_disbursed_completed: { en: "Total Disbursed (Completed)", hi: "कुल भुगतान (सफल)", gu: "કુલ ચૂકવેલ (પૂર્ણ)" },
  in_treasury_processing: { en: "In-Treasury Processing", hi: "ट्रेजरी प्रक्रियाधीन", gu: "તિજોરી પ્રક્રિયા હેઠળ" },
  completed_vouchers: { en: "Completed Vouchers", hi: "पूर्ण किए गए वाउचर", gu: "પૂર્ણ થયેલ વાઉચર્સ" },
  official_payment_transactions: { en: "Official Payment Transactions", hi: "आधिकारिक भुगतान लेन-देन", gu: "સત્તાવાર ચુકવણી વ્યવહારો" },
  col_voucher_no: { en: "Voucher No", hi: "वाउचर सं.", gu: "વાઉચર નં." },
  col_bank_ac: { en: "Bank & A/C", hi: "बैंक एवं खाता", gu: "બેંક અને ખાતું" },
  col_utr_no: { en: "UTR Number", hi: "यूटीआर संख्या", gu: "યુટીઆર નંબર" },
  col_amount_inr: { en: "Amount (₹)", hi: "राशि (₹)", gu: "રકમ (₹)" },
  col_receipt_pdf: { en: "Receipt PDF", hi: "रसीद पीडीएफ", gu: "રસીદ પીડીએફ" },

  // Farmer Portal MSP & Booking
  live_apmc_rates: { en: "Live APMC Market Rates • MSP Benchmark", hi: "लाइव एपीएमसी मंडी भाव • समर्थन मूल्य", gu: "લાઇવ એપીએમસી મંડી ભાવો • ટેકાના ભાવ" },
  live_apmc_sub: { en: "Real-time Agmarknet mandi terminal rates & central MSP floor prices", hi: "रियल-टाइम एगमार्कनेट मंडी भाव एवं केंद्र सरकार समर्थन मूल्य", gu: "રીઅલ-ટાઇમ એગમાર્કના મંડી ભાવો અને કેન્દ્ર સરકારના ટેકાના ભાવ" },
  full_price_board: { en: "Full Mandi Price Board", hi: "संपूर्ण मंडी भाव बोर्ड", gu: "સંપૂર્ણ મંડી ભાવ બોર્ડ" },
  active_procurement_token: { en: "Active Procurement Token", hi: "सक्रिय उपार्जन टोकन", gu: "સક્રિય પ્રાપ્તિ ટોકન" },
  scheduled_slot: { en: "Scheduled Slot", hi: "निर्धारित स्लॉट", gu: "નિર્ધારિત સ્લોટ" },
  track_live_queue: { en: "Track Live Queue", hi: "लाइव कतार ट्रैक करें", gu: "લાઇવ કતાર ટ્રેક કરો" },
  view_qr_pass: { en: "View QR Pass", hi: "क्यूआर पास देखें", gu: "ક્યુઆર પાસ જુઓ" },
  lbl_gate_entry: { en: "Gate Entry:", hi: "गेट प्रवेश:", gu: "ગેટ પ્રવેશ:" },
  lbl_expected_weighment: { en: "Expected Weighment:", hi: "अपेक्षित तुलाई:", gu: "અપેક્ષિત વજન:" },
  lbl_estimated_payout: { en: "Estimated Payout:", hi: "अनुमानित भुगतान:", gu: "અંદાજિત ચુકવણી:" },
  no_token_today: { en: "No Active Procurement Token Today", hi: "आज कोई सक्रिय टोकन नहीं है", gu: "આજે કોઈ સક્રિય ટોકન નથી" },
  no_token_today_desc: {
    en: "Book your arrival slot in advance to avoid mandi gate queues and secure guaranteed MSP weighment.",
    hi: "मंडी गेट की कतारों से बचने और गारंटीकृत समर्थन मूल्य पर तुलाई सुनिश्चित करने के लिए पहले से स्लॉट बुक करें।",
    gu: "મંડી ગેટની કતારોથી બચવા અને ખાતરીપૂર્વકના ભાવે વજન કરાવવા અગાઉથી સ્લોટ બુક કરો."
  },
  btn_book_slot_now: { en: "Book Slot Now", hi: "अभी स्लॉट बुक करें", gu: "હમણાં સ્લોટ બુક કરો" },
  dbt_bank_remittances: { en: "Direct Benefit Transfer (DBT) • Bank Remittances", hi: "सीधा बैंक अंतरण (DBT) • बैंक भुगतान", gu: "સીધી બેંક ટ્રાન્સફર (DBT) • બેંક ચુકવણી" },
  dbt_remittances_sub: {
    en: "Real-time treasury disbursements, PFMS transaction tracking and J-Form vouchers",
    hi: "ट्रेजरी द्वारा सीधा भुगतान, पीएफएमएस ट्रैकिंग एवं जे-फॉर्म रसीदें",
    gu: "તિજોરી દ્વારા સીધી ચુકવણી, પીએફએમએસ ટ્રેકિંગ અને જે-ફોર્મ રસીદો"
  },
  full_payment_ledger: { en: "Full Payment Ledger", hi: "संपूर्ण भुगतान खाता", gu: "સંપૂર્ણ ચુકવણી ખાતાવહી" },
  total_credited_msp: { en: "Total Credited (MSP)", hi: "कुल जमा (एमएसपी)", gu: "કુલ જમા થયેલ (MSP)" },
  pfms_disbursed: { en: "100% PFMS Disbursed", hi: "१००% पीएफएमएस अंतरित", gu: "૧૦૦% પીએફએમએસ જમા" },
  dbt_credited_badge: { en: "Direct DBT Credited", hi: "सीधे बैंक में जमा", gu: "સીધા બેંકમાં જમા" },
  download_jform: { en: "J-Form", hi: "जे-फॉर्म", gu: "જે-ફોર્મ" },

  // Mandi Prices Missing
  filter_vegetables: { en: "🥕 Vegetables", hi: "🥕 सब्जियां", gu: "🥕 શાકભાજી" },
  filter_fruits: { en: "🍎 Fruits", hi: "🍎 ફળ", gu: "🍎 ફળો" },
  filter_grains: { en: "🌾 Grains & Oilseeds", hi: "🌾 અનાજ व तिलहन", gu: "🌾 અનાજ અને તેલીબિયાં" },
  mandi_prices_title: { en: "Real-time Mandi Prices & Geospatial Yard Intelligence", hi: "रियल-टाइम मंडी भाव एवं भू-स्थानिक विश्लेषण", gu: "રીઅલ-ટાઇમ મંડી ભાવો અને ભૌગોલિક વિશ્લેષણ" },
  mandi_prices_subtitle: {
    en: "Live daily arrivals, modal wholesale rates, and proximity analytics for all crops across India, powered by official Agmarknet data.",
    hi: "एगमार्कनेट डेटा द्वारा संचालित पूरे भारत में सभी फसलों के दैनिक आगमन, थोक भाव और निकटता विश्लेषण।",
    gu: "એગમાર્કના સત્તાવાર ડેટા દ્વારા સમગ્ર ભારતમાં તમામ પાકોના દૈનિક આગમન, જથ્થાબંધ ભાવો અને અંતર વિશ્લેષણ."
  },
  high_price_mandi: { en: "High Price Mandi", hi: "उच्चतम भाव मंडी", gu: "સૌથી વધુ ભાવ ધરાવતી મંડી" },
  standard_mandi: { en: "Standard APMC Mandi", hi: "मानक एपीएमसी मंडी", gu: "પ્રમાણભૂત એપીએમસી મંડી" },
  interactive_map_title: { en: "Interactive Mandi Geospatial Map", hi: "इंटरैक्टिव मंडी भू-स्थानिक नक्शा", gu: "ઇન્ટરેક્ટિવ મંડી ભૌગોલિક નકશો" }
};

for (const [key, langMap] of Object.entries(extraKeys)) {
  for (const lang of supportedLangs) {
    if (!currentTranslations[lang]) currentTranslations[lang] = {};
    if (langMap[lang]) {
      currentTranslations[lang][key] = langMap[lang];
    } else if (langMap['hi']) {
      currentTranslations[lang][key] = langMap['hi'];
    } else if (langMap['en']) {
      currentTranslations[lang][key] = langMap['en'];
    }
  }
}

// Make sure every key in en exists in all languages
for (const [k, v] of Object.entries(currentTranslations.en)) {
  for (const lang of supportedLangs) {
    if (!currentTranslations[lang][k]) {
      currentTranslations[lang][k] = currentTranslations.gu[k] || currentTranslations.hi[k] || v;
    }
  }
}

console.log('Final keys count in en:', Object.keys(currentTranslations.en).length);
console.log('Final keys count in gu:', Object.keys(currentTranslations.gu).length);
console.log('Final keys count in hi:', Object.keys(currentTranslations.hi).length);

// Generate clean i18n.js
const updatedI18n = `/**
 * 🌐 KPMS Multilingual Translation Architecture (i18n)
 * Supports English (en), Gujarati (gu), Hindi (hi), Bengali (bn), Marathi (mr), Punjabi (pa), Tamil (ta), Telugu (te), Kannada (kn)
 */

const translations = ${JSON.stringify(currentTranslations, null, 2)};

let currentLanguage = 'en';

/**
 * Get translation for key with graceful fallback and param interpolation
 */
const getT = (key, params = {}, fallback = '') => {
  if (!key) return '';
  if (typeof params === 'string') {
    fallback = params;
    params = {};
  }
  const langMap = translations[currentLanguage] || translations['en'];
  let str = (langMap && langMap[key] !== undefined) 
    ? langMap[key] 
    : ((translations['en'] && translations['en'][key] !== undefined) 
      ? translations['en'][key] 
      : (fallback || key));

  if (params && typeof params === 'object') {
    Object.keys(params).forEach(p => {
      str = String(str).replace(new RegExp(\`\\\\{\${p}\\\\}\`, 'g'), params[p]);
    });
  }
  return str;
};

// Aliases and global registration
const t = getT;
window.getT = getT;
window.t = getT;
window.translations = translations;

/**
 * Set active application language and update entire UI reactively
 */
const setLanguage = (lang) => {
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

window.setLanguage = setLanguage;

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('kpms_lang') || 'en';
  setLanguage(saved);
});
`;

fs.writeFileSync(i18nPath, updatedI18n, 'utf8');
console.log('Saved updated public/js/i18n.js');
