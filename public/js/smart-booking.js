/**
 * 🌾 Smart Booking UI Controller — AgriQueue / KPMS
 * Interactive Farmer Experience, Decision Cards, Real-time Validation & Slot Transition
 */

const smartBookingState = {
  selectedCrop: 'Wheat',
  quantity: 100,
  step: 1, // 1: Inputs, 2: Loading, 3: Scenarios & Recommendations
  results: null,
  activeExplanationTab: null,
  showAllCentresModal: false
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
      <!-- Sidebar Navigation if logged in as farmer -->
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

      <!-- Main Content Canvas -->
      <main class="main-content" style="max-width:1100px; margin:0 auto; padding-bottom:60px;">
        
        <!-- Header Banner -->
        <div class="glass-panel" style="padding:28px 32px; margin-bottom:28px; background:linear-gradient(135deg, rgba(14,42,71,0.04), rgba(224,109,20,0.06)); border-left:6px solid var(--saffron);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                <span class="hero-pill" style="margin:0; background:rgba(224,109,20,0.15); color:var(--saffron);">
                  <i class="fas fa-brain"></i> AI Procurement Logistics Engine
                </span>
                <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-check-circle"></i> Live Mandi Rates</span>
              </div>
              <h1 style="font-size:2.2rem; font-weight:800; color:var(--primary-navy); margin:0;">
                🌾 Smart Mandi Procurement Finder
              </h1>
              <p style="color:var(--text-muted); font-size:0.95rem; margin-top:6px; max-width:700px;">
                Finding the mandi that delivers the <strong>maximum net profit</strong> for your produce by factoring travel distance, live wait times, procurement rates, and storage delay costs.
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline btn-sm" onclick="routeTo('#book-slot')">
                <i class="fas fa-list-check"></i> Standard Booking
              </button>
            </div>
          </div>
        </div>

        <!-- Dynamic Step Container -->
        <div id="smart-booking-stage-container">
          <!-- Rendered dynamically -->
        </div>

      </main>
    </div>
  `;

  renderSmartBookingForm();
};

/**
 * Step 1 & 2: Crop Selection & Quantity Entry Form
 */
const renderSmartBookingForm = () => {
  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;

  const catalog = window.SmartBookingEngine ? window.SmartBookingEngine.SMART_CROP_CATALOG : [];

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
          ${catalog.map(crop => {
            const isSelected = smartBookingState.selectedCrop === crop.name;
            return `
              <div 
                class="glass-card crop-select-card"
                style="padding:18px 14px; text-align:center; cursor:pointer; border-radius:14px; transition:all 0.2s ease; ${isSelected ? `border:2px solid var(--saffron); background:${crop.bg}; box-shadow:0 6px 18px rgba(224,109,20,0.2); transform:translateY(-2px);` : 'border:1px solid var(--border-color);'}"
                onclick="selectSmartCrop('${crop.name}')"
              >
                <div style="width:52px; height:52px; border-radius:50%; background:${isSelected ? '#FFF' : crop.bg}; color:${crop.color}; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; font-size:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <i class="fas ${crop.icon}"></i>
                </div>
                <div style="font-weight:800; font-size:1.05rem; color:var(--primary-navy);">${crop.name}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${crop.displayName.split('(')[1] ? '(' + crop.displayName.split('(')[1] : ''}</div>
                <div style="margin-top:8px; display:inline-block; font-size:0.75rem; font-weight:700; color:${crop.color}; background:rgba(255,255,255,0.85); padding:2px 8px; border-radius:12px;">
                  MSP: ₹${crop.baseMsp}/Q
                </div>
              </div>
            `;
          }).join('')}
        </div>
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

          <!-- Quick Increment Buttons -->
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
          <i class="fas fa-shield-halved" style="color:var(--green-gov);"></i> Calculates distance, live queues, price MSP & storage delay cost automatically.
        </p>
      </div>

    </div>
  `;
};

/**
 * Handle Crop Selection
 */
const selectSmartCrop = (cropName) => {
  smartBookingState.selectedCrop = cropName;
  renderSmartBookingForm();
};

/**
 * Handle Quantity Input Changes
 */
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
 * Find Best Option Click Handler & 3-Step Animated Loading
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

  // Step 1: Loading phase 1
  container.innerHTML = `
    <div class="glass-panel" style="padding:60px 30px; text-align:center; border-radius:18px;">
      <div style="width:70px; height:70px; border-radius:50%; background:rgba(224,109,20,0.1); color:var(--saffron); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:2rem;">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <h3 id="loading-stage-text" style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin-bottom:10px;">
        Checking nearby procurement centres...
      </h3>
      <p id="loading-sub-text" style="color:var(--text-muted); font-size:0.92rem;">
        Locating active government and APMC mandis for ${smartBookingState.selectedCrop}...
      </p>
      <div style="max-width:320px; height:6px; background:#E2E8F0; border-radius:10px; margin:24px auto 0; overflow:hidden;">
        <div id="loading-progress-bar" style="width:30%; height:100%; background:var(--saffron); border-radius:10px; transition:width 0.4s ease;"></div>
      </div>
    </div>
  `;

  // Step 2: Transition after 500ms
  setTimeout(() => {
    const txt = document.getElementById('loading-stage-text');
    const sub = document.getElementById('loading-sub-text');
    const bar = document.getElementById('loading-progress-bar');
    if (txt) txt.textContent = "Comparing availability, queue, travel cost and waiting time...";
    if (sub) sub.textContent = "Running net outcome optimization algorithm across all eligible mandis...";
    if (bar) bar.style.width = "70%";
  }, 500);

  // Step 3: Transition after 1000ms
  setTimeout(() => {
    const txt = document.getElementById('loading-stage-text');
    const sub = document.getElementById('loading-sub-text');
    const bar = document.getElementById('loading-progress-bar');
    if (txt) txt.textContent = "Finding the best option for you...";
    if (sub) sub.textContent = "Finalizing top recommendations and trade-off comparison...";
    if (bar) bar.style.width = "100%";
  }, 1000);

  // Execute Algorithm & Render Results after 1400ms
  setTimeout(() => {
    executeSmartBookingAlgorithm();
  }, 1400);
};

/**
 * Execute Optimization Algorithm and Render Recommendations
 */
const executeSmartBookingAlgorithm = () => {
  const { selectedCrop, quantity } = smartBookingState;
  const result = window.SmartBookingEngine.runSmartProcurementAlgorithm(selectedCrop, quantity);
  smartBookingState.results = result;

  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;

  // Handle Edge Case 1: No Centres Available
  if (!result.success || !result.scenarios.hasResults) {
    renderNoCentresAvailableView(result.message || 'No suitable procurement centres found.');
    return;
  }

  const { scenarios, capacityWarning, maxAvailableCapacity } = result;
  const { recommended, alternative, singleOptionOnly } = scenarios;

  container.innerHTML = `
    <div>
      <!-- Top Summary Pill Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="btn btn-outline btn-sm" onclick="renderSmartBookingForm()">
            <i class="fas fa-arrow-left"></i> Change Crop or Quantity
          </button>
          <span style="font-size:0.92rem; font-weight:700; color:var(--primary-navy);">
            Producing: <strong style="color:var(--saffron);">${selectedCrop}</strong> (${quantity} Quintals)
          </span>
        </div>
        ${scenarios.otherCentres && scenarios.otherCentres.length > 0 ? `
          <button class="btn btn-outline btn-sm" onclick="openOtherCentresModal()">
            <i class="fas fa-layer-group"></i> View All (${result.rankedResults.length}) Mandis
          </button>
        ` : ''}
      </div>

      <!-- Capacity Exceeded Warning Banner if applicable -->
      ${capacityWarning ? `
        <div class="glass-panel" style="padding:16px 20px; margin-bottom:22px; background:#FFFBEB; border:1px solid #F59E0B; border-radius:12px; display:flex; align-items:center; gap:14px;">
          <div style="width:38px; height:38px; border-radius:50%; background:#FEF3C7; color:#D97706; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
            <i class="fas fa-triangle-exclamation"></i>
          </div>
          <div style="font-size:0.9rem; color:#92400E;">
            <strong>High Volume Advisory:</strong> Your quantity (${quantity} Q) exceeds the single-day available quota (${maxAvailableCapacity} Q) at available centres. Calculations below reflect maximum accepted quantity for immediate procurement.
          </div>
        </div>
      ` : ''}

      <!-- MAIN TWO SCENARIOS GRID -->
      <div style="display:grid; grid-template-columns:${singleOptionOnly ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))'}; gap:24px; margin-bottom:30px;">
        
        <!-- SCENARIO 1: RECOMMENDED BEST OPTION -->
        <div class="glass-card" style="border:2px solid var(--saffron); border-radius:18px; padding:28px; position:relative; box-shadow:0 12px 32px rgba(224,109,20,0.15); background:linear-gradient(180deg, var(--bg-card) 0%, rgba(255,247,237,0.4) 100%);">
          <!-- Recommendation Badge -->
          <div style="position:absolute; top:-14px; left:24px; background:linear-gradient(135deg, #E06D14, #EA580C); color:#FFF; padding:4px 16px; border-radius:20px; font-weight:800; font-size:0.8rem; letter-spacing:0.5px; box-shadow:0 4px 12px rgba(224,109,20,0.4);">
            ${recommended.tag || '⭐ BEST OVERALL OPTION'}
          </div>

          <div style="margin-top:10px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
              <div>
                <h3 style="font-size:1.45rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  ${recommended.shortName || recommended.centerName}
                </h3>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-top:3px;">
                  <i class="fas fa-location-dot" style="color:var(--saffron);"></i> ${recommended.district}, ${recommended.state}
                </div>
              </div>
              <span class="status-pill completed" style="font-size:0.75rem; flex-shrink:0;">
                <i class="fas fa-bolt"></i> ₹${recommended.pricePerQuintal}/Q
              </span>
            </div>
          </div>

          <!-- Key Metrics Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
            <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-route"></i> Distance</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
                ${recommended.distance} km away
              </div>
            </div>

            <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-hourglass-half"></i> Estimated Waiting</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--green-gov); margin-top:2px;">
                ~${recommended.waitingDays} day wait
              </div>
            </div>

            <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-truck"></i> Est. Travel Cost</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
                ~${recommended.formattedTransport}
              </div>
            </div>

            <div style="background:#ECFDF5; padding:12px 14px; border-radius:10px; border:1px solid #A7F3D0;">
              <div style="font-size:0.75rem; color:#065F46; font-weight:700;"><i class="fas fa-coins"></i> Net Outcome</div>
              <div style="font-size:1.25rem; font-weight:900; color:#047857; margin-top:2px;">
                ${recommended.formattedNev}
              </div>
            </div>
          </div>

          <!-- Why this is recommended (Plain Language) -->
          <div style="background:rgba(224,109,20,0.08); padding:14px; border-radius:10px; margin-bottom:20px; border-left:4px solid var(--saffron);">
            <div style="font-size:0.78rem; font-weight:800; color:var(--saffron); text-transform:uppercase; margin-bottom:3px;">
              Why this is recommended:
            </div>
            <p style="font-size:0.88rem; color:var(--primary-navy); margin:0; line-height:1.45; font-weight:600;">
              "${recommended.whyRecommended}"
            </p>
          </div>

          <!-- Primary Action Button -->
          <button 
            class="btn btn-primary" 
            style="width:100%; justify-content:center; padding:14px; font-size:1.05rem; font-weight:800; border-radius:12px;"
            onclick="selectAndProceedToBooking('${recommended.centerId}', '${recommended.crop}', ${recommended.acceptedQuantity})"
          >
            <i class="fas fa-check-circle"></i> Choose This Recommended Centre
          </button>
        </div>

        <!-- SCENARIO 2: ALTERNATIVE OPTION (If available) -->
        ${alternative ? `
          <div class="glass-card" style="border:1px solid var(--border-color); border-radius:18px; padding:28px; position:relative; background:var(--bg-card);">
            <!-- Alternative Badge -->
            <div style="position:absolute; top:-14px; left:24px; background:var(--navy-light); color:#FFF; padding:4px 16px; border-radius:20px; font-weight:800; font-size:0.8rem; letter-spacing:0.5px;">
              ${alternative.tag || '🚜 ALTERNATIVE OPTION'}
            </div>

            <div style="margin-top:10px; margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div>
                  <h3 style="font-size:1.45rem; font-weight:800; color:var(--primary-navy); margin:0;">
                    ${alternative.shortName || alternative.centerName}
                  </h3>
                  <div style="font-size:0.85rem; color:var(--text-muted); margin-top:3px;">
                    <i class="fas fa-location-dot"></i> ${alternative.district}, ${alternative.state}
                  </div>
                </div>
                <span class="status-pill waiting" style="font-size:0.75rem; flex-shrink:0;">
                  ₹${alternative.pricePerQuintal}/Q
                </span>
              </div>
            </div>

            <!-- Key Metrics Grid -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-route"></i> Distance</div>
                <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
                  ${alternative.distance} km away
                </div>
              </div>

              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-hourglass-half"></i> Estimated Waiting</div>
                <div style="font-size:1.15rem; font-weight:800; color:${alternative.waitingDays > 3 ? '#D97706' : 'var(--primary-navy)'}; margin-top:2px;">
                  ~${alternative.waitingDays} days wait
                </div>
              </div>

              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-truck"></i> Est. Travel Cost</div>
                <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
                  ~${alternative.formattedTransport}
                </div>
              </div>

              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;"><i class="fas fa-coins"></i> Net Outcome</div>
                <div style="font-size:1.25rem; font-weight:900; color:var(--primary-navy); margin-top:2px;">
                  ${alternative.formattedNev}
                </div>
              </div>
            </div>

            <!-- Plain Trade-off Explanation -->
            <div style="background:var(--bg-main); padding:14px; border-radius:10px; margin-bottom:20px; border-left:4px solid var(--navy-light);">
              <div style="font-size:0.78rem; font-weight:800; color:var(--navy-light); text-transform:uppercase; margin-bottom:3px;">
                Trade-off note:
              </div>
              <p style="font-size:0.88rem; color:var(--text-main); margin:0; line-height:1.45;">
                "${alternative.whyTradeOff}"
              </p>
            </div>

            <!-- Alternative Action Button -->
            <button 
              class="btn btn-outline" 
              style="width:100%; justify-content:center; padding:14px; font-size:1.05rem; font-weight:700; border-radius:12px;"
              onclick="selectAndProceedToBooking('${alternative.centerId}', '${alternative.crop}', ${alternative.acceptedQuantity})"
            >
              <i class="fas fa-tractor"></i> Choose This Alternative Centre
            </button>
          </div>
        ` : ''}

      </div>

      <!-- TRANSPARENT FINANCIAL BREAKDOWN ACCORDION -->
      <div class="glass-panel" style="border-radius:14px; overflow:hidden; margin-bottom:24px;">
        <div 
          style="padding:16px 22px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); user-select:none;"
          onclick="toggleTransparentBreakdown()"
        >
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fas fa-circle-question" style="color:var(--saffron); font-size:1.1rem;"></i>
            <span style="font-weight:800; font-size:1rem; color:var(--primary-navy);">
              Why was this recommended? (पारदर्शी वित्तीय विवरण देखें)
            </span>
          </div>
          <i id="breakdown-toggle-icon" class="fas fa-chevron-down" style="color:var(--text-muted); transition:transform 0.3s ease;"></i>
        </div>

        <div id="breakdown-content-slot" style="display:none; padding:22px; border-top:1px solid var(--border-color); background:var(--bg-main);">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
            
            <!-- Recommended Option Breakdown -->
            <div style="background:var(--bg-card); padding:18px; border-radius:12px; border:1px solid var(--saffron);">
              <div style="font-weight:800; color:var(--saffron); margin-bottom:12px; font-size:0.95rem;">
                ⭐ ${recommended.shortName || recommended.centerName} Breakdown
              </div>
              <div style="display:flex; flex-direction:column; gap:8px; font-size:0.88rem;">
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-muted);">Expected produce accepted:</span>
                  <strong>${recommended.acceptedQuantity} Quintals</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-muted);">Expected procurement value:</span>
                  <strong>${recommended.formattedRevenue} <span style="font-size:0.75rem; color:var(--text-muted);">(@ ₹${recommended.pricePerQuintal}/Q)</span></strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-muted);">Estimated transport:</span>
                  <strong style="color:#EF4444;">- ${recommended.formattedTransport}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-muted);">Estimated delay & storage impact:</span>
                  <strong style="color:#EF4444;">- ${recommended.formattedDelay}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:8px; margin-top:4px; border-top:1px dashed var(--border-color); font-size:1.05rem; font-weight:900; color:var(--green-gov);">
                  <span>Estimated overall outcome:</span>
                  <span>${recommended.formattedNev}</span>
                </div>
              </div>
            </div>

            <!-- Alternative Breakdown (If exists) -->
            ${alternative ? `
              <div style="background:var(--bg-card); padding:18px; border-radius:12px; border:1px solid var(--border-color);">
                <div style="font-weight:800; color:var(--primary-navy); margin-bottom:12px; font-size:0.95rem;">
                  🚜 ${alternative.shortName || alternative.centerName} Breakdown
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; font-size:0.88rem;">
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Expected produce accepted:</span>
                    <strong>${alternative.acceptedQuantity} Quintals</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Expected procurement value:</span>
                    <strong>${alternative.formattedRevenue} <span style="font-size:0.75rem; color:var(--text-muted);">(@ ₹${alternative.pricePerQuintal}/Q)</span></strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Estimated transport:</span>
                    <strong style="color:#EF4444;">- ${alternative.formattedTransport}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Estimated delay & storage impact:</span>
                    <strong style="color:#EF4444;">- ${alternative.formattedDelay}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between; padding-top:8px; margin-top:4px; border-top:1px dashed var(--border-color); font-size:1.05rem; font-weight:900; color:var(--primary-navy);">
                    <span>Estimated overall outcome:</span>
                    <span>${alternative.formattedNev}</span>
                  </div>
                </div>
              </div>
            ` : ''}

          </div>
        </div>
      </div>

    </div>
  `;
};

/**
 * Toggle Expandable Transparent Calculation
 */
const toggleTransparentBreakdown = () => {
  const slot = document.getElementById('breakdown-content-slot');
  const icon = document.getElementById('breakdown-toggle-icon');
  if (!slot) return;

  if (slot.style.display === 'none' || slot.style.display === '') {
    slot.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    slot.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

/**
 * Handle Edge Case: No Centres Available View
 */
const renderNoCentresAvailableView = (message) => {
  const container = document.getElementById('smart-booking-stage-container');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-panel" style="padding:48px 24px; text-align:center; border-radius:18px;">
      <div style="width:64px; height:64px; border-radius:50%; background:#FEE2E2; color:#DC2626; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:1.8rem;">
        <i class="fas fa-store-slash"></i>
      </div>
      <h3 style="font-size:1.4rem; font-weight:800; color:var(--primary-navy); margin-bottom:8px;">
        No Suitable Procurement Centre Currently Available
      </h3>
      <p style="color:var(--text-muted); font-size:0.95rem; max-width:550px; margin:0 auto 24px;">
        ${message} You can try selecting a different registered crop or inspect standard mandi schedules.
      </p>
      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="renderSmartBookingForm()">
          <i class="fas fa-wheat-awn"></i> Choose Another Crop
        </button>
        <button class="btn btn-outline" onclick="routeTo('#book-slot')">
          <i class="fas fa-building"></i> View All Mandi Centers
        </button>
      </div>
    </div>
  `;
};

/**
 * Modal to view All Ranked Centres
 */
const openOtherCentresModal = () => {
  const results = smartBookingState.results;
  if (!results || !results.rankedResults) return;

  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = `All Eligible Mandis for ${smartBookingState.selectedCrop}`;

  body.innerHTML = `
    <div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">
        Ranked in order of estimated net outcome for ${smartBookingState.quantity} Quintals.
      </p>
      <div style="display:flex; flex-direction:column; gap:12px; max-height:420px; overflow-y:auto; padding-right:4px;">
        ${results.rankedResults.map((c, idx) => `
          <div class="glass-card" style="padding:14px; border-radius:12px; border:${idx === 0 ? '2px solid var(--saffron)' : '1px solid var(--border-color)'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <div>
                <strong style="color:var(--primary-navy); font-size:1rem;">#${idx + 1} ${c.shortName || c.centerName}</strong>
                <div style="font-size:0.78rem; color:var(--text-muted);">${c.district}, ${c.state} • ${c.distance} km away</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:900; color:var(--green-gov); font-size:1.05rem;">${c.formattedNev}</div>
                <div style="font-size:0.72rem; color:var(--text-muted);">Rate: ₹${c.pricePerQuintal}/Q</div>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid var(--border-color); font-size:0.8rem;">
              <span style="color:var(--text-muted);">Wait: ~${c.waitingDays} day(s) | Travel: ${c.formattedTransport}</span>
              <button class="btn btn-primary btn-sm" onclick="closeModal(); selectAndProceedToBooking('${c.centerId}', '${c.crop}', ${c.acceptedQuantity})">
                Select This
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.classList.add('active');
};

/**
 * Selection & Seamless Transition to Existing Slot Booking System (#book-slot)
 */
const selectAndProceedToBooking = (centerId, cropName, quantity) => {
  // Store prefill information globally
  window.smartBookingPrefill = {
    centerId: centerId,
    crop: cropName,
    quantity: quantity || smartBookingState.quantity
  };

  showToast(`Selected ${cropName} (${quantity} Q). Opening slot reservation...`, 'success');

  // Navigate to existing #book-slot portal
  routeTo('#book-slot');
};

// Global exports
if (typeof window !== 'undefined') {
  window.loadSmartBookingPage = loadSmartBookingPage;
  window.selectSmartCrop = selectSmartCrop;
  window.onSmartQuantityChange = onSmartQuantityChange;
  window.setQuickQuantity = setQuickQuantity;
  window.handleFindBestOptionClick = handleFindBestOptionClick;
  window.toggleTransparentBreakdown = toggleTransparentBreakdown;
  window.openOtherCentresModal = openOtherCentresModal;
  window.selectAndProceedToBooking = selectAndProceedToBooking;
}
