/**
 * 🌾 Smart Booking UI Controller — AgriQueue / KPMS
 * Interactive Farmer Experience with Real-Time OpenWeather Integration,
 * Crop Perishability Badges, Weather Transit Delays, and Economic Trade-offs.
 */

const smartBookingState = {
  selectedCrop: 'Wheat',
  quantity: 100,
  step: 1,
  results: null,
  activeExplanationTab: null,
  showAllCentresModal: false,
  centreWeatherMap: {}
};

/**
 * Main View Loader for #smart-booking route
 */
const loadSmartBookingPage = async () => {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  const user = getCurrentUser();
  const isFarmer = user && user.role === 'farmer';

  container.innerHTML = `
    <div class="app-container">
      ${isFarmer ? `
        <aside class="sidebar">
          <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
            <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${user.name}</div>
            <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-id-card"></i> ${user.farmerId || 'Farmer'}</div>
          </div>
          <div class="sidebar-heading">Navigation</div>
          <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
          <a class="nav-link active" onclick="loadSmartBookingPage()"><i class="fas fa-wand-magic-sparkles" style="color:var(--saffron);"></i> Smart Mandi Finder</a>
          <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> Manual Slot Booking</a>
          <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> Live Queue Tracker</a>
          <a class="nav-link" onclick="routeTo('#my-bookings')"><i class="fas fa-ticket-alt"></i> My Bookings</a>
          <div style="margin-top:auto; padding-top:16px;">
            <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </aside>
      ` : `
        <aside class="sidebar">
          <div class="sidebar-heading">Smart Mandi Engine</div>
          <a class="nav-link" onclick="routeTo('#landing')"><i class="fas fa-arrow-left"></i> Home</a>
          <a class="nav-link active" onclick="loadSmartBookingPage()"><i class="fas fa-wand-magic-sparkles" style="color:var(--saffron);"></i> Smart Mandi Finder</a>
          <a class="nav-link" onclick="routeTo('#tv-display')"><i class="fas fa-tv"></i> Mandi Display Board</a>
          <a class="nav-link" onclick="routeTo('#ai-insights')"><i class="fas fa-brain"></i> AI Insights</a>
        </aside>
      `}

      <main class="main-content" style="max-width:1100px; margin:0 auto; padding-bottom:60px;">
        
        <!-- Header Banner -->
        <div class="glass-panel" style="padding:28px 32px; margin-bottom:28px; background:linear-gradient(135deg, rgba(14,42,71,0.04), rgba(224,109,20,0.06)); border-left:6px solid var(--saffron);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                <span class="hero-pill" style="margin:0; background:rgba(224,109,20,0.15); color:var(--saffron);">
                  <i class="fas fa-cloud-sun-rain"></i> OpenWeather & Agro Logistics Engine
                </span>
                <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-check-circle"></i> Real-Time Centre Feeds</span>
              </div>
              <h1 style="font-size:2.2rem; font-weight:800; color:var(--primary-navy); margin:0;">
                🌾 Smart Mandi Procurement Finder
              </h1>
              <p style="color:var(--text-muted); font-size:0.95rem; margin-top:6px; max-width:750px;">
                Identifies optimal procurement centres for your harvest by factoring <strong>live destination weather</strong>, travel delay windows, crop perishability sensitivity, live queue wait times, and net economic value.
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline btn-sm" onclick="routeTo('#book-slot')">
                <i class="fas fa-list-check"></i> Standard Booking
              </button>
            </div>
          </div>
        </div>

        <!-- Stage Container -->
        <div id="smart-booking-stage-container">
          <!-- Rendered dynamically -->
        </div>

      </main>
    </div>
  `;

  renderSmartBookingForm();
};

/**
 * Step 1 & 2: Crop Selection & Quantity Form with Automatic Perishability Badge
 */
const renderSmartBookingForm = () => {
  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;

  const engine = window.SmartBookingEngine;
  const cropProfiles = engine ? engine.cropProfiles : {};
  const currentProfile = engine ? engine.getCropProfile(smartBookingState.selectedCrop) : null;

  const displayCrops = [
    cropProfiles.wheat,
    cropProfiles.rice,
    cropProfiles.potato,
    cropProfiles.tomato,
    cropProfiles.leafyvegetables,
    cropProfiles.maize,
    cropProfiles.gram,
    cropProfiles.mustard,
    cropProfiles.soyabean
  ].filter(Boolean);

  container.innerHTML = `
    <div class="glass-panel" style="padding:32px; border-radius:18px;">
      
      <!-- STEP 1: SELECT CROP -->
      <div style="margin-bottom:32px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <div>
            <span style="font-size:0.8rem; font-weight:800; color:var(--saffron); text-transform:uppercase; letter-spacing:0.5px;">Step 1 of 2</span>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
              What crop are you bringing? (फसल चुनें)
            </h2>
          </div>
          <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">
            <i class="fas fa-hand-pointer"></i> Tap to select
          </span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:14px;" id="crop-card-grid">
          ${displayCrops.map(crop => {
            const isSelected = currentProfile && currentProfile.name === crop.name;
            return `
              <div 
                class="glass-card crop-select-card"
                style="padding:18px 14px; text-align:center; cursor:pointer; border-radius:14px; transition:all 0.2s ease; ${isSelected ? `border:2px solid var(--saffron); background:${crop.bg}; box-shadow:0 6px 18px rgba(224,109,20,0.2); transform:translateY(-2px);` : 'border:1px solid var(--border-color);'}"
                onclick="selectSmartCrop('${crop.name}')"
              >
                <div style="width:50px; height:50px; border-radius:50%; background:${isSelected ? '#FFF' : crop.bg}; color:${crop.color}; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; font-size:1.4rem; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <i class="fas ${crop.icon}"></i>
                </div>
                <div style="font-weight:800; font-size:1.05rem; color:var(--primary-navy);">${crop.name}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${crop.displayName && crop.displayName.split('(')[1] ? '(' + crop.displayName.split('(')[1] : ''}</div>
                <div style="margin-top:6px; font-size:0.72rem; font-weight:800;">
                  ${crop.badge || ''}
                </div>
                <div style="margin-top:6px; display:inline-block; font-size:0.72rem; font-weight:700; color:${crop.color}; background:rgba(255,255,255,0.9); padding:2px 8px; border-radius:12px;">
                  MSP: ₹${crop.defaultPrice}/Q
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Automatic Perishability Badge Banner (Section 8 & 29) -->
        ${currentProfile ? `
          <div style="margin-top:18px; padding:14px 18px; border-radius:12px; background:rgba(14,42,71,0.03); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.1rem; font-weight:800; color:var(--primary-navy);">
                ${currentProfile.badge}
              </span>
              <span style="color:var(--text-muted); font-size:0.88rem;">
                &bull; ${currentProfile.badgeDescription}
              </span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">
              Base Deterioration Rate: ${(currentProfile.baseDeteriorationRate * 100).toFixed(2)}%/day
            </div>
          </div>
        ` : ''}
      </div>

      <!-- STEP 2: ENTER QUANTITY -->
      <div style="margin-bottom:36px; padding-top:24px; border-top:1px solid var(--border-color);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <div>
            <span style="font-size:0.8rem; font-weight:800; color:var(--green-gov); text-transform:uppercase; letter-spacing:0.5px;">Step 2 of 2</span>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
              How much produce do you want to sell? (मात्रा दर्ज करें)
            </h2>
          </div>
        </div>

        <div style="max-width:550px;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="position:relative; flex:1;">
              <input 
                type="number" 
                id="smart-quantity-input" 
                class="form-control" 
                style="font-size:1.4rem; font-weight:800; padding:14px 18px; text-align:center; color:var(--primary-navy); border:2px solid var(--border-color); border-radius:12px;" 
                min="1" 
                max="5000" 
                value="${smartBookingState.quantity}" 
                placeholder="Enter quantity"
                oninput="onSmartQuantityChange(this.value)"
              />
            </div>
            <div style="background:var(--primary-navy); color:#FFF; padding:14px 22px; border-radius:12px; font-weight:800; font-size:1.1rem; letter-spacing:0.5px;">
              Quintals (क्विंटल)
            </div>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
            <span style="font-size:0.8rem; color:var(--text-muted); align-self:center; font-weight:600;">Quick Pick:</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="setQuickQuantity(25)">25 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setQuickQuantity(50)">50 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setQuickQuantity(100)">100 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setQuickQuantity(200)">200 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setQuickQuantity(500)">500 Q</button>
          </div>

          <div id="quantity-error-msg" style="color:#EF4444; font-size:0.88rem; font-weight:600; margin-top:8px; display:none;">
            <i class="fas fa-circle-exclamation"></i> Please enter a valid quantity greater than 0.
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align:center; padding-top:10px;">
        <button 
          id="btn-find-best-option"
          class="btn btn-primary" 
          style="padding:16px 48px; font-size:1.25rem; font-weight:800; border-radius:14px; box-shadow:0 8px 24px rgba(224,109,20,0.35); justify-content:center; width:100%; max-width:480px; margin:0 auto;"
          onclick="handleFindBestOptionClick()"
        >
          <i class="fas fa-wand-magic-sparkles"></i> Find Best Procurement Option
        </button>
        <p style="font-size:0.82rem; color:var(--text-muted); margin-top:10px;">
          <i class="fas fa-shield-halved" style="color:var(--green-gov);"></i> Integrates centre weather feeds, perishability risks, transit delays & live mandi rates automatically.
        </p>
      </div>

    </div>
  `;
};

const selectSmartCrop = (cropName) => {
  smartBookingState.selectedCrop = cropName;
  renderSmartBookingForm();
};

const onSmartQuantityChange = (val) => {
  const num = Number(val);
  smartBookingState.quantity = num;
  const errorEl = document.getElementById('quantity-error-msg');
  if (errorEl) {
    if (isNaN(num) || num <= 0) {
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  }
};

const setQuickQuantity = (qty) => {
  smartBookingState.quantity = qty;
  const input = document.getElementById('smart-quantity-input');
  if (input) input.value = qty;
  onSmartQuantityChange(qty);
};

/**
 * Animated Loading Simulation with 3-Stage Progress
 */
const handleFindBestOptionClick = () => {
  const qty = Number(smartBookingState.quantity);
  if (isNaN(qty) || qty <= 0) {
    const errorEl = document.getElementById('quantity-error-msg');
    if (errorEl) errorEl.style.display = 'block';
    showToast('Please enter a valid quantity greater than 0.', 'error');
    return;
  }

  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-panel" style="padding:60px 30px; text-align:center; border-radius:18px;">
      <div style="width:72px; height:72px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:2rem; animation:pulse 1.5s infinite;">
        <i class="fas fa-satellite-dish"></i>
      </div>
      
      <h3 style="font-size:1.6rem; font-weight:800; color:var(--primary-navy); margin-bottom:8px;">
        Analyzing Mandi Feeds & Destination Weather...
      </h3>
      <p style="color:var(--text-muted); font-size:0.95rem; max-width:550px; margin:0 auto 28px;" id="loading-stage-text">
        Querying OpenWeather observations for nearby procurement centres...
      </p>

      <div style="max-width:400px; height:8px; background:var(--bg-main); border-radius:4px; margin:0 auto 20px; overflow:hidden; border:1px solid var(--border-color);">
        <div id="loading-progress-bar" style="width:30%; height:100%; background:linear-gradient(90deg, var(--saffron), #10B981); transition:width 0.4s ease;"></div>
      </div>

      <div style="display:flex; justify-content:center; gap:20px; font-size:0.82rem; color:var(--text-muted); font-weight:600;">
        <span id="load-step-1" style="color:var(--saffron);"><i class="fas fa-circle-notch fa-spin"></i> Destination Weather</span>
        <span id="load-step-2" style="opacity:0.5;"><i class="fas fa-hourglass-start"></i> Delay & Deterioration</span>
        <span id="load-step-3" style="opacity:0.5;"><i class="fas fa-calculator"></i> Net Return</span>
      </div>
    </div>
  `;

  // Fetch live centre weather from server
  fetchLiveCentresWeather().then(weatherMap => {
    smartBookingState.centreWeatherMap = weatherMap;
  }).catch(() => {});

  setTimeout(() => {
    const text = document.getElementById('loading-stage-text');
    const bar = document.getElementById('loading-progress-bar');
    const step2 = document.getElementById('load-step-2');
    if (text) text.textContent = "Calculating crop perishability risk & transit time ranges...";
    if (bar) bar.style.width = "70%";
    if (step2) { step2.style.opacity = "1"; step2.style.color = "var(--saffron)"; }
  }, 600);

  setTimeout(() => {
    const text = document.getElementById('loading-stage-text');
    const bar = document.getElementById('loading-progress-bar');
    const step3 = document.getElementById('load-step-3');
    if (text) text.textContent = "Computing final Net Economic Value across eligible mandis...";
    if (bar) bar.style.width = "100%";
    if (step3) { step3.style.opacity = "1"; step3.style.color = "var(--green-gov)"; }
  }, 1100);

  setTimeout(() => {
    executeSmartBookingAlgorithm();
  }, 1400);
};

/**
 * Fetch live weather from backend for default centres
 */
const fetchLiveCentresWeather = async () => {
  try {
    const centres = window.SmartBookingEngine.DEFAULT_PROCUREMENT_CENTRES;
    const map = {};
    await Promise.all(centres.map(async (c) => {
      try {
        const res = await fetch(`/api/weather/centre?lat=${c.latitude}&lon=${c.longitude}&city=${encodeURIComponent(c.district || c.name)}`);
        const json = await res.json();
        if (json.success && json.data) {
          map[c.id || c.code] = json.data;
        }
      } catch (e) {}
    }));
    return map;
  } catch (e) {
    return {};
  }
};

/**
 * Execute Optimization Algorithm and Render Recommendations
 */
const executeSmartBookingAlgorithm = () => {
  const { selectedCrop, quantity, centreWeatherMap } = smartBookingState;
  const result = window.SmartBookingEngine.runSmartProcurementAlgorithm(
    selectedCrop,
    quantity,
    null,
    null,
    centreWeatherMap
  );
  smartBookingState.results = result;

  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;

  if (!result.success || !result.scenarios.hasResults) {
    renderNoCentresAvailableView(result.message || 'No suitable procurement centres found.');
    return;
  }

  const { scenarios, capacityWarning, maxAvailableCapacity, cropProfile } = result;
  const { recommended, alternative, singleOptionOnly } = scenarios;

  container.innerHTML = `
    <div>
      <!-- Top Summary Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="btn btn-outline btn-sm" onclick="renderSmartBookingForm()">
            <i class="fas fa-arrow-left"></i> Change Crop or Quantity
          </button>
          <span style="font-size:0.92rem; font-weight:700; color:var(--primary-navy);">
            Producing: <strong style="color:var(--saffron);">${selectedCrop}</strong> (${quantity} Quintals) &bull; ${cropProfile.badge}
          </span>
        </div>
        ${scenarios.otherCentres && scenarios.otherCentres.length > 0 ? `
          <button class="btn btn-outline btn-sm" onclick="openOtherCentresModal()">
            <i class="fas fa-layer-group"></i> View All (${result.rankedResults.length}) Mandis
          </button>
        ` : ''}
      </div>

      <!-- Capacity Exceeded Advisory -->
      ${capacityWarning ? `
        <div class="glass-panel" style="padding:16px 20px; margin-bottom:22px; background:#FFFBEB; border:1px solid #F59E0B; border-radius:12px; display:flex; align-items:center; gap:14px;">
          <div style="width:38px; height:38px; border-radius:50%; background:#FEF3C7; color:#D97706; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
            <i class="fas fa-triangle-exclamation"></i>
          </div>
          <div style="font-size:0.9rem; color:#92400E;">
            <strong>High Volume Advisory:</strong> Your quantity (${quantity} Q) exceeds single-day available quota (${maxAvailableCapacity} Q). Calculations reflect maximum accepted volume for immediate procurement.
          </div>
        </div>
      ` : ''}

      <!-- MAIN TWO SCENARIOS GRID (Section 26 & 27) -->
      <div style="display:grid; grid-template-columns:${singleOptionOnly ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))'}; gap:24px; margin-bottom:30px;">
        
        <!-- SCENARIO 1: RECOMMENDED BEST OPTION -->
        ${renderScenarioCard(recommended, 'recommended')}

        <!-- SCENARIO 2: ALTERNATIVE OPTION -->
        ${alternative ? renderScenarioCard(alternative, 'alternative') : ''}

      </div>

      <!-- Transparent Calculation Breakdown Accordion -->
      <div class="glass-panel" style="border-radius:16px; margin-bottom:30px; overflow:hidden;">
        <div 
          style="padding:18px 24px; background:var(--bg-card); cursor:pointer; display:flex; justify-content:space-between; align-items:center;"
          onclick="toggleBreakdownAccordion()"
        >
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:34px; height:34px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1rem;">
              <i class="fas fa-chart-pie"></i>
            </div>
            <div>
              <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--primary-navy);">
                Transparent Economic & Weather Breakdown (गणना का विवरण)
              </h4>
              <p style="margin:2px 0 0; font-size:0.8rem; color:var(--text-muted);">
                See how OpenWeather feeds, travel transit, crop perishability, and yard delays combine into your Net Outcome.
              </p>
            </div>
          </div>
          <i id="breakdown-chevron" class="fas fa-chevron-down" style="color:var(--text-muted); transition:transform 0.2s;"></i>
        </div>

        <div id="breakdown-accordion-body" style="display:none; padding:24px; border-top:1px solid var(--border-color); background:rgba(14,42,71,0.02);">
          ${renderBreakdownTable(recommended, alternative)}
        </div>
      </div>

    </div>
  `;
};

/**
 * Render Farmer-Facing Scenario Card (Section 26 & 27)
 */
const renderScenarioCard = (data, type) => {
  const isRec = type === 'recommended';
  const weatherClass = data.weatherClassification || {};
  const weatherDelay = data.weatherDelay || {};

  return `
    <div class="glass-card" style="border:2px solid ${isRec ? 'var(--saffron)' : 'var(--border-color)'}; border-radius:18px; padding:28px; position:relative; box-shadow:${isRec ? '0 12px 32px rgba(224,109,20,0.15)' : 'none'}; background:${isRec ? 'linear-gradient(180deg, var(--bg-card) 0%, rgba(255,247,237,0.4) 100%)' : 'var(--bg-card)'};">
      
      <!-- Top Tag Badge -->
      <div style="position:absolute; top:-14px; left:24px; background:${isRec ? 'linear-gradient(135deg, #E06D14, #EA580C)' : 'var(--navy-light)'}; color:#FFF; padding:4px 16px; border-radius:20px; font-weight:800; font-size:0.8rem; letter-spacing:0.5px; box-shadow:${isRec ? '0 4px 12px rgba(224,109,20,0.4)' : 'none'};">
        ${data.tag || (isRec ? '⭐ RECOMMENDED CENTRE' : '🚜 CLOSER OPTION')}
      </div>

      <!-- Centre Header -->
      <div style="margin-top:10px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <div>
            <h3 style="font-size:1.45rem; font-weight:800; color:var(--primary-navy); margin:0;">
              ${data.shortName || data.centerName}
            </h3>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:3px;">
              <i class="fas fa-location-dot" style="color:var(--saffron);"></i> ${data.district}, ${data.state} &bull; <strong>${data.distance} km away</strong>
            </div>
          </div>
          <span class="status-pill ${isRec ? 'completed' : 'waiting'}" style="font-size:0.78rem; flex-shrink:0;">
            <i class="fas fa-tag"></i> ₹${data.pricePerQuintal}/Q
          </span>
        </div>
      </div>

      <!-- Weather & Transit Advisory Block (Section 3, 4, 14, 22) -->
      <div style="background:var(--bg-main); padding:14px; border-radius:12px; border:1px solid var(--border-color); margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-size:0.82rem; font-weight:700; color:var(--primary-navy); display:flex; align-items:center; gap:6px;">
            <i class="fas ${weatherClass.icon || 'fa-cloud-sun'}" style="color:${weatherClass.color || 'var(--saffron)'};"></i>
            Weather near procurement centre: <strong>${weatherClass.label || 'Clear'}</strong>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            ${data.weather ? `${Math.round(data.weather.temp || 28)}°C, ${data.weather.humidity || 55}% Hum` : ''}
          </span>
        </div>
        
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; margin-top:4px;">
          <span style="color:var(--text-muted);"><i class="fas fa-clock"></i> Expected Arrival Window:</span>
          <strong style="color:var(--primary-navy);">${weatherDelay.arrivalDisplay || '10:00 AM'}</strong>
        </div>

        ${weatherDelay.expectedDelayHours > 0 ? `
          <div style="font-size:0.78rem; color:#D97706; margin-top:6px; font-weight:600;">
            <i class="fas fa-triangle-exclamation"></i> ${weatherDelay.advisoryNote || 'Arrival may vary because of rainfall along transit path.'}
          </div>
        ` : ''}
      </div>

      <!-- Key Economic Metrics Grid (Section 26 & 27) -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px;">
        
        <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-hourglass-half"></i> Est. Mandi Wait</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
            ~${data.waitingDays} day wait
          </div>
        </div>

        <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-truck"></i> Transport Cost</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
            ${data.formattedTransport}
          </div>
        </div>

        <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-clock-rotate-left"></i> Delay Economic Cost</div>
          <div style="font-size:1.15rem; font-weight:800; color:#D97706; margin-top:2px;">
            ${data.formattedDelay}
          </div>
        </div>

        <div style="background:#ECFDF5; padding:12px 14px; border-radius:10px; border:1px solid #A7F3D0;">
          <div style="font-size:0.75rem; color:#065F46; font-weight:700;"><i class="fas fa-coins"></i> Estimated Net Return</div>
          <div style="font-size:1.25rem; font-weight:900; color:#047857; margin-top:2px;">
            ${data.formattedNev}
          </div>
        </div>

      </div>

      <!-- Why Recommended (Section 28) -->
      <div style="background:${isRec ? 'rgba(224,109,20,0.08)' : 'rgba(14,42,71,0.04)'}; padding:14px; border-radius:10px; margin-bottom:20px; border-left:4px solid ${isRec ? 'var(--saffron)' : 'var(--navy-light)'};">
        <div style="font-size:0.78rem; font-weight:800; color:${isRec ? 'var(--saffron)' : 'var(--primary-navy)'}; text-transform:uppercase; margin-bottom:3px;">
          ${isRec ? 'Why was this centre recommended?' : 'Trade-Off Explanation:'}
        </div>
        <p style="font-size:0.86rem; color:var(--primary-navy); margin:0; line-height:1.45; font-weight:600;">
          "${data.whyRecommended || data.whyTradeOff}"
        </p>
      </div>

      <!-- Action Button -->
      <button 
        class="btn ${isRec ? 'btn-primary' : 'btn-outline'}" 
        style="width:100%; justify-content:center; padding:14px; font-size:1.05rem; font-weight:800; border-radius:12px;"
        onclick="selectAndProceedToBooking('${data.centerId}', '${data.crop}', ${data.acceptedQuantity})"
      >
        <i class="fas fa-check-circle"></i> Choose This Centre
      </button>

    </div>
  `;
};

/**
 * Transparent Economic Calculation Table
 */
const renderBreakdownTable = (rec, alt) => {
  return `
    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:0.88rem; text-align:left;">
        <thead>
          <tr style="border-bottom:2px solid var(--border-color); color:var(--primary-navy);">
            <th style="padding:10px 14px;">Calculation Factor</th>
            <th style="padding:10px 14px;">⭐ ${rec.shortName}</th>
            ${alt ? `<th style="padding:10px 14px;">🚜 ${alt.shortName}</th>` : ''}
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:10px 14px; font-weight:600;">Destination Weather Condition</td>
            <td style="padding:10px 14px;"><i class="fas ${rec.weatherClassification.icon}"></i> ${rec.weatherClassification.label}</td>
            ${alt ? `<td style="padding:10px 14px;"><i class="fas ${alt.weatherClassification.icon}"></i> ${alt.weatherClassification.label}</td>` : ''}
          </tr>
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:10px 14px; font-weight:600;">Expected Transit Window</td>
            <td style="padding:10px 14px;">${rec.weatherDelay.arrivalDisplay}</td>
            ${alt ? `<td style="padding:10px 14px;">${alt.weatherDelay.arrivalDisplay}</td>` : ''}
          </tr>
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:10px 14px; font-weight:600;">Gross Produce Value (Q × Price)</td>
            <td style="padding:10px 14px; font-weight:700;">${rec.formattedRevenue}</td>
            ${alt ? `<td style="padding:10px 14px; font-weight:700;">${alt.formattedRevenue}</td>` : ''}
          </tr>
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:10px 14px; font-weight:600;">Transport Logistics Cost (−)</td>
            <td style="padding:10px 14px; color:#EF4444;">− ${rec.formattedTransport}</td>
            ${alt ? `<td style="padding:10px 14px; color:#EF4444;">− ${alt.formattedTransport}</td>` : ''}
          </tr>
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:10px 14px; font-weight:600;">Yard Delay & Queue Cost (−)</td>
            <td style="padding:10px 14px; color:#D97706;">− ${rec.formattedDelay}</td>
            ${alt ? `<td style="padding:10px 14px; color:#D97706;">− ${alt.formattedDelay}</td>` : ''}
          </tr>
          <tr style="border-bottom:2px solid var(--border-color); background:rgba(16,185,129,0.06);">
            <td style="padding:12px 14px; font-weight:800; color:var(--primary-navy);">Expected Net Economic Value (NEV)</td>
            <td style="padding:12px 14px; font-weight:900; color:#047857; font-size:1.1rem;">${rec.formattedNev}</td>
            ${alt ? `<td style="padding:12px 14px; font-weight:900; color:#047857; font-size:1.1rem;">${alt.formattedNev}</td>` : ''}
          </tr>
        </tbody>
      </table>
    </div>
  `;
};

const toggleBreakdownAccordion = () => {
  const body = document.getElementById('breakdown-accordion-body');
  const icon = document.getElementById('breakdown-chevron');
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  if (icon) icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
};

const selectAndProceedToBooking = (centreId, cropName, quantity) => {
  showToast('Booking slot with selected centre recommendations...', 'success');
  routeTo('#book-slot');
  setTimeout(() => {
    const cropSelect = document.getElementById('booking-crop');
    const qtyInput = document.getElementById('booking-quantity');
    const centreSelect = document.getElementById('booking-center');
    if (cropSelect) cropSelect.value = cropName;
    if (qtyInput) qtyInput.value = quantity;
    if (centreSelect) centreSelect.value = centreId;
  }, 250);
};

const renderNoCentresAvailableView = (msg) => {
  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;
  container.innerHTML = `
    <div class="glass-panel" style="padding:48px 24px; text-align:center; border-radius:18px;">
      <div style="font-size:3rem; color:#EF4444; margin-bottom:16px;"><i class="fas fa-circle-xmark"></i></div>
      <h3 style="color:var(--primary-navy); font-weight:800;">No Eligible Centres Found</h3>
      <p style="color:var(--text-muted); max-width:500px; margin:8px auto 24px;">${msg}</p>
      <button class="btn btn-primary" onclick="renderSmartBookingForm()">Try Another Crop</button>
    </div>
  `;
};

const openOtherCentresModal = () => {
  const results = smartBookingState.results;
  if (!results) return;
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = `All Eligible Mandis for ${results.crop}`;
  body.innerHTML = `
    <div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${results.rankedResults.map((r, idx) => `
          <div style="padding:14px; border-radius:10px; border:1px solid var(--border-color); background:var(--bg-card); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; color:var(--primary-navy);">#${idx + 1} ${r.shortName}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">
                ${r.distance} km away &bull; ~${r.waitingDays} day wait &bull; ${r.weatherClassification.label}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; color:#047857;">${r.formattedNev}</div>
              <button class="btn btn-outline btn-sm" style="margin-top:4px;" onclick="closeModal(); selectAndProceedToBooking('${r.centerId}', '${r.crop}', ${r.acceptedQuantity})">Select</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.add('active');
};
