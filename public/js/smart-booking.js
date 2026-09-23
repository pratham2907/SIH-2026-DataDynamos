/**
 * 🌾 SMART MANDI FINDER — KPMS / AgriQueue (SIH 2026 PS 26032)
 * Complete replacement of the old Smart Booking UX.
 * Simple, farmer-friendly, step-by-step experience powered by the centralized
 * mathematical decision engine, land-based production validation, automatic sequential
 * slot allocation, Brevo notifications, and next-crop seasonal planning.
 */

const smartMandiState = {
  step: 1, // 1: Crop & Perishability, 2: Quantity & Land Check, 3: Best Mandi Options, 4: Recommended Slot, 5: Alternative Date/Time, 6: Confirmed, 7: Next Crop Planning
  selectedCrop: 'Wheat',
  cropProfile: null,
  quantity: 50,
  farmerProfile: null,
  registeredLandArea: 5,
  yieldMultiplier: 22,
  maxPermissibleQuantity: 130,
  quantityValid: true,
  quantityErrorMsg: '',
  mandiResults: null,
  selectedMandi: null,
  recommendedDate: '',
  recommendedTimeSlot: '',
  alternativeDate: '',
  alternativeTimeSlot: '',
  availableDates: [],
  availableDateSlots: [],
  bookedRecord: null,
  nextCrop: '',
  sowingMonth: 'October',
  sowingPeriod: 'first_15',
  futureHarvestText: '',
  showAllMandisModal: false,
  showMathExplanation: false,
  cropCategoryFilter: 'all'
};
window.smartMandiState = smartMandiState;

/**
 * Main View Entry Point for #smart-mandi-finder and #smart-booking
 */
const loadSmartMandiFinderPage = async () => {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();

  if (!token || !user || user.role !== 'farmer') {
    openLoginModal('farmer');
    showToast('Please log in as a farmer to access Smart Mandi Finder', 'info');
    return;
  }

  // Load Farmer Profile for registered land area
  try {
    const res = await fetch('/api/farmer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success && json.farmer) {
      smartMandiState.farmerProfile = json.farmer;
      smartMandiState.registeredLandArea = parseFloat(json.farmer.totalLandArea) || 5.0;
    }
  } catch (e) {
    console.warn('Could not load farmer profile for land area, using standard baseline:', e);
  }

  // Resolve default crop profile
  const engine = window.SmartBookingEngine;
  smartMandiState.cropProfile = engine ? engine.getCropProfile(smartMandiState.selectedCrop) : null;

  renderSmartMandiView();
};

// Backwards compatibility alias
const loadSmartBookingPage = loadSmartMandiFinderPage;
window.loadSmartMandiFinderPage = loadSmartMandiFinderPage;
window.loadSmartBookingPage = loadSmartBookingPage;

/**
 * Master Shell Renderer
 */
const renderSmartMandiView = () => {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  const user = getCurrentUser() || {};
  const currentStep = smartMandiState.step;

  container.innerHTML = `
    <div class="app-container">
      <aside class="sidebar">
        <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
          <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${user.name || 'Kisan Bandhu'}</div>
          <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-id-card"></i> ${user.farmerId || 'Farmer'}</div>
        </div>
        <div class="sidebar-heading">${getT('sidebar_navigation', 'Navigation')}</div>
        <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> ${getT('back_to_dashboard', 'Back to Dashboard')}</a>
        <a class="nav-link active" onclick="loadSmartMandiFinderPage()"><i class="fas fa-wand-magic-sparkles" style="color:var(--saffron);"></i> Smart Mandi Finder</a>
        <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> ${getT('manual_slot_booking', 'Manual Slot Booking')}</a>
        <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> ${getT('live_queue_tracker', 'Live Queue Tracker')}</a>
        <a class="nav-link" onclick="routeTo('#my-bookings')"><i class="fas fa-ticket-alt"></i> ${getT('my_bookings', 'My Bookings')}</a>
        <div style="margin-top:auto; padding-top:16px;">
          <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> ${getT('nav_logout', 'Logout')}</a>
        </div>
      </aside>

      <main class="main-content" style="max-width:1050px; margin:0 auto; padding-bottom:60px;">
        
        <!-- Header Banner -->
        <div class="glass-panel" style="padding:24px 28px; margin-bottom:20px; background:#FFFFFF; border:1px solid #CBD5E1; border-left:6px solid var(--saffron); box-shadow:0 6px 24px rgba(0,0,0,0.07);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="hero-pill" style="margin:0; background:rgba(224,109,20,0.12); color:#C85D0D; font-size:0.78rem; font-weight:700; border:1px solid rgba(224,109,20,0.25);">
                  <i class="fas fa-wand-magic-sparkles"></i> Decision Intelligence
                </span>
                <span class="status-pill completed" style="font-size:0.75rem; font-weight:700; background:rgba(26,122,68,0.12); color:#15803D; border:1px solid rgba(26,122,68,0.25);"><i class="fas fa-shield-check"></i> Government Mandi Grid</span>
              </div>
              <h1 style="font-size:1.9rem; font-weight:800; color:var(--primary-navy); margin:0; display:flex; align-items:center; gap:10px;">
                <img src="/images/nav/smart_mandi.jpg" style="width:34px; height:34px; border-radius:8px; object-fit:cover; border:1px solid #CBD5E1; box-shadow:0 2px 6px rgba(0,0,0,0.1);" alt="Mandi" />
                <span>Smart Mandi Finder</span>
              </h1>
              <p style="color:#334155; font-size:0.92rem; font-weight:500; margin-top:6px; max-width:700px; line-height:1.5;">
                Find the highest-earning Mandi, verify production quota, and receive your guaranteed procurement slot.
              </p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="routeTo('#farmer-dashboard')" style="font-weight:700; background:#FAF6EF; color:var(--primary-navy); border:1.5px solid #CBD5E1; padding:8px 16px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <i class="fas fa-arrow-left"></i> Dashboard
            </button>
          </div>
        </div>

        <!-- Step Indicator Pill Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; background:#FFFFFF; border:1.5px solid #CBD5E1; border-radius:14px; padding:12px 18px; font-size:0.84rem; font-weight:700; overflow-x:auto; gap:12px; box-shadow:0 2px 10px rgba(0,0,0,0.04);">
          <div style="color:${currentStep >= 1 ? 'var(--saffron)' : '#64748B'}; display:flex; align-items:center; gap:6px;">
            <span style="width:22px; height:22px; border-radius:50%; background:${currentStep >= 1 ? 'var(--saffron)' : '#E2E8F0'}; color:${currentStep >= 1 ? '#FFF' : '#64748B'}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">1</span>
            1. Crop & Quantity
          </div>
          <i class="fas fa-chevron-right" style="color:#CBD5E1; font-size:0.7rem;"></i>
          <div style="color:${currentStep >= 3 ? 'var(--saffron)' : '#64748B'}; display:flex; align-items:center; gap:6px;">
            <span style="width:22px; height:22px; border-radius:50%; background:${currentStep >= 3 ? 'var(--saffron)' : '#E2E8F0'}; color:${currentStep >= 3 ? '#FFF' : '#64748B'}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">2</span>
            2. Best Mandi Options
          </div>
          <i class="fas fa-chevron-right" style="color:#CBD5E1; font-size:0.7rem;"></i>
          <div style="color:${currentStep >= 4 ? 'var(--saffron)' : '#64748B'}; display:flex; align-items:center; gap:6px;">
            <span style="width:22px; height:22px; border-radius:50%; background:${currentStep >= 4 ? 'var(--saffron)' : '#E2E8F0'}; color:${currentStep >= 4 ? '#FFF' : '#64748B'}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">3</span>
            3. Recommended Slot
          </div>
          <i class="fas fa-chevron-right" style="color:#CBD5E1; font-size:0.7rem;"></i>
          <div style="color:${currentStep >= 6 ? 'var(--green-gov)' : '#64748B'}; display:flex; align-items:center; gap:6px;">
            <span style="width:22px; height:22px; border-radius:50%; background:${currentStep >= 6 ? 'var(--green-gov)' : '#E2E8F0'}; color:${currentStep >= 6 ? '#FFF' : '#64748B'}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">4</span>
            4. Confirmed & Next Crop
          </div>
        </div>

        <!-- Dynamic Stage Container -->
        <div id="smart-mandi-stage-container">
          ${renderStageContent()}
        </div>

      </main>
    </div>
  `;
};

/**
 * Dispatches the active step's HTML
 */
const renderStageContent = () => {
  switch (smartMandiState.step) {
    case 1:
    case 2:
      return renderCropAndQuantityStep();
    case 3:
      return renderBestMandiOptionsStep();
    case 4:
      return renderRecommendedSlotStep();
    case 5:
      return renderAlternativeDateStep();
    case 6:
      return renderBookingConfirmedStep();
    case 7:
      return renderNextCropPlanningStep();
    default:
      return renderCropAndQuantityStep();
  }
};

/**
 * -------------------------------------------------------------
 * STEP 1 & 2: Crop Selection, Perishability & Land-Based Quantity
 * -------------------------------------------------------------
 */
const renderCropAndQuantityStep = () => {
  const engine = window.SmartBookingEngine;
  const cropProfiles = engine ? engine.cropProfiles : {};
  const currentProfile = smartMandiState.cropProfile || (engine ? engine.getCropProfile(smartMandiState.selectedCrop) : null);

  const availableCrops = [
    { name: 'Tomato', hindi: '(टमाटर)', label: 'Tomato (टमाटर)', type: 'vegetable', image: '/images/crops/tomato.jpg', msp: 2100, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Leafy vegetables', hindi: '(सब्जियां / साग)', label: 'Leafy vegetables (सब्जियां / साग)', type: 'vegetable', image: '/images/crops/leafyvegetables.jpg', msp: 2400, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Maize', hindi: '(मक्का)', label: 'Maize (मक्का)', type: 'grain', image: '/images/crops/maize.jpg', msp: 2225, perishText: 'Low Perishable', perishClass: 'low' },
    { name: 'Gram', hindi: '(चना / दाल)', label: 'Gram (चना / दाल)', type: 'grain', image: '/images/crops/gram.jpg', msp: 5440, perishText: 'Low Perishable', perishClass: 'low' },
    { name: 'Mustard', hindi: '(सरसों)', label: 'Mustard (सरसों)', type: 'cash', image: '/images/crops/mustard.jpg', msp: 5650, perishText: 'Low Perishable', perishClass: 'low' },
    { name: 'Soyabean', hindi: '(सोयाबीन)', label: 'Soyabean (सोयाबीन)', type: 'grain', image: '/images/crops/soyabean.jpg', msp: 4892, perishText: 'Medium Perishable', perishClass: 'medium' },
    { name: 'Wheat', hindi: '(गेहूं)', label: 'Wheat (गेहूं)', type: 'grain', image: '/images/crops/wheat.jpg', msp: 2425, perishText: 'Low Perishable', perishClass: 'low' },
    { name: 'Rice', hindi: '(धान / चावल)', label: 'Paddy / Rice (धान / चावल)', type: 'grain', image: '/images/crops/rice.jpg', msp: 2369, perishText: 'Medium Perishable', perishClass: 'medium' },
    { name: 'Potato', hindi: '(आलू)', label: 'Potato (आलू)', type: 'vegetable', image: '/images/crops/potato.jpg', msp: 1800, perishText: 'Medium Perishable', perishClass: 'medium' },
    { name: 'Onion', hindi: '(प्याज)', label: 'Onion (प्याज)', type: 'vegetable', image: '/images/crops/onion.jpg', msp: 1950, perishText: 'Medium Perishable', perishClass: 'medium' },
    { name: 'Green Peas', hindi: '(हरी मटर)', label: 'Green Peas (हरी मटर)', type: 'vegetable', image: '/images/crops/peas.jpg', msp: 3600, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Cauliflower', hindi: '(फूलगोभी)', label: 'Cauliflower (फूलगोभी)', type: 'vegetable', image: '/images/crops/cauliflower.jpg', msp: 1650, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Banana', hindi: '(केला)', label: 'Banana (केला)', type: 'fruit', image: '/images/crops/banana.jpg', msp: 1850, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Apple', hindi: '(सेब)', label: 'Apple (सेब)', type: 'fruit', image: '/images/crops/apple.jpg', msp: 7200, perishText: 'Medium Perishable', perishClass: 'medium' },
    { name: 'Mango', hindi: '(आम)', label: 'Mango (आम)', type: 'fruit', image: '/images/crops/mango.jpg', msp: 3400, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Orange', hindi: '(संतरा)', label: 'Orange (संतरा)', type: 'fruit', image: '/images/crops/orange.jpg', msp: 3100, perishText: 'High Perishable', perishClass: 'high' },
    { name: 'Groundnut', hindi: '(मूंगफली)', label: 'Groundnut (मूंगफली)', type: 'grain', image: '/images/crops/groundnut.jpg', msp: 6783, perishText: 'Low Perishable', perishClass: 'low' },
    { name: 'Cotton', hindi: '(कपास)', label: 'Cotton (कपास)', type: 'cash', image: '/images/crops/cotton.jpg', msp: 7121, perishText: 'Medium Perishable', perishClass: 'medium' }
  ];

  const currentFilter = smartMandiState.cropCategoryFilter || 'all';
  const displayedCrops = currentFilter === 'all' 
    ? availableCrops 
    : availableCrops.filter(c => c.type === currentFilter);

  // Calculate Land production capacity + 20 Q buffer
  const landArea = smartMandiState.registeredLandArea;
  const yieldMult = getYieldMultiplier(smartMandiState.selectedCrop);
  const approxCap = Math.round(landArea * yieldMult);
  const maxPermissible = approxCap + 20; // Exact +20 Quintal requirement from prompt
  smartMandiState.maxPermissibleQuantity = maxPermissible;

  const isExceeded = smartMandiState.quantity > maxPermissible;
  smartMandiState.quantityValid = !isExceeded;

  return `
    <div class="glass-panel" style="padding:32px; border-radius:18px; background:#FFFFFF; border:1px solid #CBD5E1; box-shadow:0 6px 24px rgba(0,0,0,0.06);">
      
      <!-- PAGE 1 — CROP SELECTION -->
      <div style="margin-bottom:30px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary-navy); margin:0;">
            Select your crop
          </h2>
          <span style="font-size:0.85rem; color:#475569; font-weight:600;">
            <i class="fas fa-hand-pointer"></i> Tap to choose
          </span>
        </div>

        <!-- Filter tabs for 18 Crops, Vegetables, Fruits & Cash Crops -->
        <div class="sp-crop-filter-bar">
          <button type="button" class="sp-crop-filter-tab ${currentFilter === 'all' ? 'active' : ''}" onclick="filterSmartCrops('all')">
            <i class="fas fa-border-all"></i> All Produce (${availableCrops.length})
          </button>
          <button type="button" class="sp-crop-filter-tab ${currentFilter === 'grain' ? 'active' : ''}" onclick="filterSmartCrops('grain')">
            <i class="fas fa-wheat-awn"></i> Grains & Cereals (6)
          </button>
          <button type="button" class="sp-crop-filter-tab ${currentFilter === 'vegetable' ? 'active' : ''}" onclick="filterSmartCrops('vegetable')">
            <i class="fas fa-carrot"></i> Fresh Vegetables (6)
          </button>
          <button type="button" class="sp-crop-filter-tab ${currentFilter === 'fruit' ? 'active' : ''}" onclick="filterSmartCrops('fruit')">
            <i class="fas fa-apple-whole"></i> Fruits & Orchard (4)
          </button>
          <button type="button" class="sp-crop-filter-tab ${currentFilter === 'cash' ? 'active' : ''}" onclick="filterSmartCrops('cash')">
            <i class="fas fa-seedling"></i> Commercial & Cash Crops (2)
          </button>
        </div>

        <!-- 3-Column Produce Card Grid with Real Photos (Image 2 Reference) -->
        <div class="sp-crop-grid-3x3">
          ${displayedCrops.map(crop => {
            const isSel = smartMandiState.selectedCrop.toLowerCase() === crop.name.toLowerCase() ||
                          (crop.name.toLowerCase() === 'rice' && smartMandiState.selectedCrop.toLowerCase() === 'paddy');
            const cropImg = crop.image;
            const dotColor = crop.perishClass === 'high' ? '#DC2626' : (crop.perishClass === 'medium' ? '#D97706' : '#16A34A');
            return `
              <div 
                class="sp-crop-card ${isSel ? 'selected' : ''}" 
                onclick="selectSmartCrop('${crop.name}')"
                data-crop="${crop.name}"
                data-category="${crop.type}"
              >
                <div class="sp-crop-card-img-wrap">
                  <img src="${cropImg}" alt="${crop.name}" class="sp-crop-card-img" onerror="this.onerror=null; this.src='/images/crops/wheat.jpg';" />
                  <span class="sp-crop-pill-perish ${crop.perishClass}">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor}; margin-right:4px;"></span>
                    ${crop.perishText}
                  </span>
                  ${isSel ? `
                    <span class="sp-crop-pill-selected">
                      <i class="fas fa-check-circle"></i> Selected
                    </span>
                  ` : ''}
                </div>
                <div class="sp-crop-body">
                  <div class="sp-crop-name-row">
                    <span class="sp-crop-name">${crop.name}</span>
                    <span class="sp-crop-hindi">${crop.hindi}</span>
                  </div>
                  <div class="sp-crop-footer">
                    <span class="sp-crop-msp-label">Govt MSP Floor:</span>
                    <span class="sp-crop-msp-val">₹${crop.msp}/Q</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- SHOW CROP PERISHABILITY AUTOMATICALLY (Section 12) -->
        ${currentProfile ? `
          <div class="sp-crop-perish-summary" style="padding:16px 20px; border-radius:14px; background:#F8FAFC; border:1.5px solid #CBD5E1; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top:14px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <img src="${currentProfile.image || '/images/crops/wheat.jpg'}" alt="${currentProfile.name}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #E2E8F0;" onerror="this.onerror=null; this.src='/images/crops/wheat.jpg';" />
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="status-pill ${currentProfile.badgeClass || 'completed'}" style="font-size:0.85rem; font-weight:800; padding:4px 12px; border-radius:20px;">
                    ${currentProfile.badge}
                  </span>
                  <span style="font-size:0.86rem; color:#475569; font-weight:600;">
                    • ${currentProfile.badgeDescription}
                  </span>
                </div>
                <div style="font-size:0.8rem; color:#64748B; margin-top:4px;">
                  Perishability Classification: <strong>${currentProfile.perishabilityLevel}</strong> &nbsp;|&nbsp; Base Deterioration Rate: <strong>${((currentProfile.baseDeteriorationRate || 0.001) * 100).toFixed(2)}%/day</strong>
                </div>
              </div>
            </div>
            <div style="font-size:0.82rem; font-weight:700; color:var(--primary-navy); background:#FFF; padding:6px 14px; border-radius:8px; border:1px solid #CBD5E1; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              Govt MSP Floor: <strong style="color:var(--green-gov); font-size:0.95rem;">₹${currentProfile.defaultPrice || currentProfile.baseMsp || 2425}/Q</strong>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- PAGE 1 — QUANTITY & LAND-BASED PRODUCTION VALIDATION (Sections 13, 14, 15) -->
      <div style="padding-top:24px; border-top:1px solid var(--border-color);">
        <div style="margin-bottom:14px;">
          <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary-navy); margin:0;">
            How much crop will you bring?
          </h2>
          <p style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
            Production quota is automatically verified against your registered land area.
          </p>
        </div>

        <!-- Land & Quota Context Card -->
        <div style="display:flex; gap:16px; flex-wrap:wrap; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px 18px; margin-bottom:18px;">
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Registered Land:</span>
            <div style="font-size:1.1rem; font-weight:800; color:var(--primary-navy);">${landArea} Acres</div>
          </div>
          <div style="border-left:1px solid #CBD5E1; padding-left:16px;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Crop Yield Capacity:</span>
            <div style="font-size:1.1rem; font-weight:800; color:var(--primary-navy);">~${yieldMult} Q/Acre (${approxCap} Q Total)</div>
          </div>
          <div style="border-left:1px solid #CBD5E1; padding-left:16px;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Permissible Limit (+20 Q Buffer):</span>
            <div id="smart-permissible-limit-val" style="font-size:1.1rem; font-weight:800; color:${isExceeded ? '#DC2626' : 'var(--green-gov)'};">${maxPermissible} Quintals</div>
          </div>
        </div>

        <div style="max-width:550px; margin-bottom:20px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <!-- Stepper Decrement -->
            <button 
              type="button" 
              onclick="stepSmartQuantity(-5)" 
              class="btn btn-outline" 
              style="width:52px; height:58px; font-size:1.5rem; font-weight:800; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid #CBD5E1; background:#F8FAFC; color:var(--primary-navy); cursor:pointer; user-select:none;"
              title="Decrease quantity by 5 Quintals"
            >
              −
            </button>

            <!-- Numeric Input Field (Smooth Typing without Blur) -->
            <div style="position:relative; flex:1;">
              <input 
                type="number" 
                id="smart-mandi-quantity-input" 
                class="form-control" 
                style="font-size:1.6rem; font-weight:800; height:58px; padding:8px 16px; text-align:center; color:${isExceeded ? '#DC2626' : 'var(--primary-navy)'}; border:2px solid ${isExceeded ? '#EF4444' : '#CBD5E1'}; border-radius:12px; background:#FFFFFF; box-shadow:inset 0 1px 3px rgba(0,0,0,0.06);" 
                min="1" 
                max="${maxPermissible * 2}"
                step="1"
                value="${smartMandiState.quantity !== undefined && smartMandiState.quantity !== null ? smartMandiState.quantity : 50}" 
                placeholder="50"
                oninput="handleSmartQuantityInput(this.value)"
                onchange="handleSmartQuantityBlur(this.value)"
              />
            </div>

            <!-- Stepper Increment -->
            <button 
              type="button" 
              onclick="stepSmartQuantity(5)" 
              class="btn btn-outline" 
              style="width:52px; height:58px; font-size:1.5rem; font-weight:800; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid #CBD5E1; background:#F8FAFC; color:var(--primary-navy); cursor:pointer; user-select:none;"
              title="Increase quantity by 5 Quintals"
            >
              +
            </button>

            <!-- Unit Badge -->
            <div style="background:var(--primary-navy); color:#FFF; height:58px; padding:0 22px; border-radius:12px; font-weight:800; font-size:1.1rem; display:flex; align-items:center; justify-content:center; white-space:nowrap; box-shadow:0 2px 8px rgba(27,54,93,0.2);">
              Quintals
            </div>
          </div>

          <!-- Quick pick buttons -->
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; align-items:center;">
            <span style="font-size:0.82rem; color:var(--text-muted); font-weight:700;">Quick Pick:</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="setSmartQuickQuantity(25)" style="font-weight:700; border-radius:8px; padding:5px 14px;">25 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setSmartQuickQuantity(50)" style="font-weight:700; border-radius:8px; padding:5px 14px;">50 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setSmartQuickQuantity(100)" style="font-weight:700; border-radius:8px; padding:5px 14px;">100 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setSmartQuickQuantity(${maxPermissible})" style="font-weight:800; border-radius:8px; padding:5px 14px; border-color:var(--saffron); color:#C85D0D; background:#FFF7ED;">Max (${maxPermissible} Q)</button>
          </div>
        </div>

        <!-- HARD QUANTITY RESTRICTION WARNING (Section 15) -->
        <div id="smart-quantity-warning-container">
          ${isExceeded ? renderQuantityWarningHtml(maxPermissible) : ''}
        </div>

        <!-- Next Action Button -->
        <div style="text-align:center; padding-top:10px;">
          <button 
            id="btn-find-best-mandi"
            class="btn btn-primary" 
            style="padding:16px 48px; font-size:1.25rem; font-weight:800; border-radius:14px; box-shadow:0 8px 24px rgba(224,109,20,0.35); justify-content:center; width:100%; max-width:460px; margin:0 auto; transition:all 0.2s ease; ${isExceeded ? 'opacity:0.5; cursor:not-allowed;' : ''}"
            ${isExceeded ? 'disabled' : ''}
            onclick="handleFindBestMandiClick()"
          >
            <i class="fas fa-wand-magic-sparkles"></i> Find Best Mandi
          </button>
          <p id="smart-quantity-helper-text" style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">
            ${isExceeded ? '⚠️ Slot booking is restricted until quantity is reduced within permitted production limits.' : '✓ Calculates highest Net Economic Value across all eligible mandis.'}
          </p>
        </div>

      </div>

    </div>
  `;
};

const handleSmartCropSelect = (cropName) => {
  smartMandiState.selectedCrop = cropName;
  const engine = window.SmartBookingEngine;
  smartMandiState.cropProfile = engine ? engine.getCropProfile(cropName) : null;
  renderSmartBookingForm();
  if (document.getElementById('app-view-container') && !document.getElementById('smart-mandi-stage-container')) {
    renderSmartMandiView();
  }
};

const selectSmartCrop = (cropName) => {
  handleSmartCropSelect(cropName);
};
window.selectSmartCrop = selectSmartCrop;
window.handleSmartCropSelect = handleSmartCropSelect;

const filterSmartCrops = (cat) => {
  smartMandiState.cropCategoryFilter = cat;
  renderSmartBookingForm();
};
window.filterSmartCrops = filterSmartCrops;

const renderSmartBookingForm = () => {
  const html = renderCropAndQuantityStep();
  const c1 = document.getElementById('smart-mandi-stage-container');
  const c2 = document.getElementById('smart-booking-stage-container');
  if (c1) c1.innerHTML = html;
  if (c2) c2.innerHTML = html;
  return html;
};
window.renderSmartBookingForm = renderSmartBookingForm;

const renderQuantityWarningHtml = (maxPermissible) => `
  <div class="glass-panel" style="padding:18px 22px; margin-bottom:24px; background:#FEF2F2; border:2px solid #EF4444; border-radius:14px;">
    <div style="display:flex; align-items:flex-start; gap:14px;">
      <i class="fas fa-circle-exclamation" style="color:#DC2626; font-size:1.6rem; margin-top:2px;"></i>
      <div style="flex:1;">
        <div style="font-size:1.05rem; font-weight:800; color:#991B1B;">
          Quantity Above Permitted Production Limit
        </div>
        <p style="font-size:0.92rem; color:#7F1D1D; margin:6px 0 12px; font-weight:600; line-height:1.5;">
          "This quantity is above the permitted production quantity for your registered land. Please enter a lower quantity."
        </p>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" class="btn btn-sm" onclick="focusQuantityInput()" style="background:#DC2626; color:#FFF; font-weight:800; border-radius:8px; padding:6px 16px;">
            <i class="fas fa-pen"></i> Edit Quantity
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="setSmartQuickQuantity(${maxPermissible})" style="border-color:#DC2626; color:#991B1B; font-weight:700;">
            Auto-Adjust to Maximum Allowed (${maxPermissible} Q)
          </button>
        </div>
      </div>
    </div>
  </div>
`;

const handleSmartQuantityInput = (val) => {
  if (val === '' || val === null || val === undefined) {
    smartMandiState.quantity = '';
    smartMandiState.quantityValid = false;
    updateQuantityUi(false, true);
    return;
  }

  const num = parseFloat(val);
  if (isNaN(num)) return;

  smartMandiState.quantity = num;
  const maxPermissible = smartMandiState.maxPermissibleQuantity || 130;
  const isExceeded = num > maxPermissible;
  smartMandiState.quantityValid = !isExceeded && num > 0;

  updateQuantityUi(isExceeded, num <= 0);
};
window.handleSmartQuantityInput = handleSmartQuantityInput;

const handleSmartQuantityBlur = (val) => {
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) {
    smartMandiState.quantity = 50;
    const input = document.getElementById('smart-mandi-quantity-input');
    if (input) input.value = 50;
    handleSmartQuantityInput(50);
  }
};
window.handleSmartQuantityBlur = handleSmartQuantityBlur;

const stepSmartQuantity = (delta) => {
  const current = parseFloat(smartMandiState.quantity) || 50;
  const maxPermissible = smartMandiState.maxPermissibleQuantity || 130;
  let next = Math.max(1, Math.min(maxPermissible * 2, current + delta));
  setSmartQuickQuantity(next);
};
window.stepSmartQuantity = stepSmartQuantity;

const setSmartQuickQuantity = (qty) => {
  const num = parseFloat(qty) || 50;
  smartMandiState.quantity = num;
  const input = document.getElementById('smart-mandi-quantity-input');
  if (input) {
    input.value = num;
  }
  handleSmartQuantityInput(num);
};
window.setSmartQuickQuantity = setSmartQuickQuantity;

const updateQuantityUi = (isExceeded, isZeroOrEmpty) => {
  const input = document.getElementById('smart-mandi-quantity-input');
  const warnContainer = document.getElementById('smart-quantity-warning-container');
  const btnFind = document.getElementById('btn-find-best-mandi');
  const helperText = document.getElementById('smart-quantity-helper-text');
  const limitVal = document.getElementById('smart-permissible-limit-val');
  const maxPermissible = smartMandiState.maxPermissibleQuantity || 130;

  if (input) {
    input.style.color = isExceeded ? '#DC2626' : 'var(--primary-navy)';
    input.style.borderColor = isExceeded ? '#EF4444' : '#CBD5E1';
  }

  if (limitVal) {
    limitVal.style.color = isExceeded ? '#DC2626' : 'var(--green-gov)';
  }

  if (warnContainer) {
    warnContainer.innerHTML = isExceeded ? renderQuantityWarningHtml(maxPermissible) : '';
  }

  if (btnFind) {
    const disabled = isExceeded || isZeroOrEmpty;
    btnFind.disabled = disabled;
    if (disabled) {
      btnFind.style.opacity = '0.5';
      btnFind.style.cursor = 'not-allowed';
    } else {
      btnFind.style.opacity = '1';
      btnFind.style.cursor = 'pointer';
    }
  }

  if (helperText) {
    if (isExceeded) {
      helperText.textContent = '⚠️ Slot booking is restricted until quantity is reduced within permitted production limits.';
    } else if (isZeroOrEmpty) {
      helperText.textContent = '⚠️ Please enter a valid quantity of quintals.';
    } else {
      helperText.textContent = '✓ Calculates highest Net Economic Value across all eligible mandis.';
    }
  }
};

const focusQuantityInput = () => {
  const el = document.getElementById('smart-mandi-quantity-input');
  if (el) {
    el.focus();
    el.select();
  }
};

/**
 * Execute existing calculation engine and transition to Step 3
 */
const handleFindBestMandiClick = async () => {
  const qty = parseFloat(smartMandiState.quantity);
  if (isNaN(qty) || qty <= 0) {
    showToast('Please enter a valid quantity greater than 0', 'error');
    return;
  }

  if (qty > smartMandiState.maxPermissibleQuantity) {
    showToast('Quantity exceeds permitted production for your registered land.', 'error');
    return;
  }

  // Animated loading container
  const container = document.getElementById('smart-mandi-stage-container');
  if (container) {
    container.innerHTML = `
      <div class="glass-panel" style="padding:60px 30px; text-align:center; border-radius:18px;">
        <div style="width:70px; height:70px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:2rem; animation:pulse 1.5s infinite;">
          <i class="fas fa-calculator"></i>
        </div>
        <h3 style="font-size:1.5rem; font-weight:800; color:var(--primary-navy); margin-bottom:8px;">
          Evaluating Eligible Mandis...
        </h3>
        <p style="color:var(--text-muted); font-size:0.95rem; max-width:500px; margin:0 auto 20px;">
          Executing Net Economic Value algorithm: Prices, Transport, Waiting Times, Weather Deterioration & Quota Availability.
        </p>
        <div style="max-width:360px; height:8px; background:var(--bg-main); border-radius:4px; margin:0 auto; overflow:hidden; border:1px solid var(--border-color);">
          <div style="width:60%; height:100%; background:linear-gradient(90deg, var(--saffron), #10B981); animation:progress 1.5s infinite;"></div>
        </div>
      </div>
    `;
  }

  setTimeout(async () => {
    try {
      const userLoc = window.KPMS_USER_LOCATION || {};
      const farmerOrigin = {
        location: userLoc.city || userLoc.formattedName || 'Bhopal',
        lat: userLoc.lat || 23.2599,
        lng: userLoc.lng || userLoc.lon || 77.4126,
        district: userLoc.district || 'Bhopal'
      };

      // Fetch dynamic centres
      let candidateCentres = [];
      try {
        const res = await fetch(`/api/bookings/centers?lat=${farmerOrigin.lat}&lon=${farmerOrigin.lng}&radius=350`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          candidateCentres = json.data;
        }
      } catch (e) {}

      if (!candidateCentres || candidateCentres.length === 0) {
        candidateCentres = (window.SmartBookingEngine && window.SmartBookingEngine.DEFAULT_PROCUREMENT_CENTRES) || [];
      }

      // Execute calculation engine (Section 9)
      const result = window.SmartBookingEngine.runSmartProcurementAlgorithm(
        smartMandiState.selectedCrop,
        qty,
        candidateCentres,
        farmerOrigin
      );

      smartMandiState.mandiResults = result;
      smartMandiState.step = 3;
      renderSmartMandiView();
    } catch (err) {
      console.error('Error running smart calculation:', err);
      showToast('Calculation error. Please retry.', 'error');
    }
  }, 900);
};

/**
 * -------------------------------------------------------------
 * STEP 3: PAGE 2 — BEST MANDI OPTIONS (Best Overall + Practical Alternative)
 * -------------------------------------------------------------
 */
const renderBestMandiOptionsStep = () => {
  const res = smartMandiState.mandiResults;
  if (!res || !res.scenarios || !res.scenarios.hasResults) {
    return `
      <div class="glass-panel" style="padding:40px; text-align:center; border-radius:18px;">
        <i class="fas fa-circle-exclamation" style="font-size:2.5rem; color:#EF4444; margin-bottom:12px;"></i>
        <h3>No Eligible Mandis Found</h3>
        <p style="color:var(--text-muted); margin-bottom:20px;">No procurement centres currently accept ${smartMandiState.selectedCrop} within the regional perimeter.</p>
        <button class="btn btn-outline" onclick="goToSmartMandiStep(1)"><i class="fas fa-arrow-left"></i> Change Crop or Quantity</button>
      </div>
    `;
  }

  const { recommended, alternative } = res.scenarios;
  const allRanked = res.rankedResults || [];

  return `
    <div>
      
      <!-- Top Action Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <button class="btn btn-outline btn-sm" onclick="goToSmartMandiStep(1)">
          <i class="fas fa-arrow-left"></i> Edit Crop or Quantity
        </button>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:0.9rem; font-weight:700; color:var(--primary-navy);">
            Producing: <strong style="color:var(--saffron);">${smartMandiState.selectedCrop}</strong> (${smartMandiState.quantity} Q)
          </span>
          <!-- Look at all mandi options button (Section 17) -->
          <button class="btn btn-outline btn-sm" onclick="openAllMandisModal()" style="font-weight:700; border-color:var(--saffron); color:var(--saffron);">
            <i class="fas fa-list-ul"></i> Look at all mandi options (${allRanked.length})
          </button>
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--primary-navy); margin:0 0 6px 0;">
          Best Mandi Options
        </h2>
        <p style="color:var(--text-muted); font-size:0.92rem; margin:0;">
          Calculated dynamically by the Smart Decision Engine for highest return and minimal delay.
        </p>
      </div>

      <!-- CARDS CONTAINER (Best Overall + Practical Alternative) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:24px; margin-bottom:28px;">
        
        <!-- 1. BEST OVERALL OPTION (Section 16) -->
        ${recommended ? renderMandiCard(recommended, 'BEST OVERALL OPTION', '<i class="fas fa-award" style="margin-right:6px;"></i> BEST OVERALL OPTION', '#16A34A', '#F0FDF4') : ''}

        <!-- 2. PRACTICAL ALTERNATIVE (Section 16) -->
        ${alternative ? renderMandiCard(alternative, 'PRACTICAL ALTERNATIVE', '<i class="fas fa-arrow-right-arrow-left" style="margin-right:6px;"></i> PRACTICAL ALTERNATIVE', '#2563EB', '#EFF6FF') : ''}

      </div>

      <!-- Brief Link to FAQ section for curiosity -->
      <div style="text-align:center; margin-bottom:24px;">
        <span style="font-size:0.85rem; color:#64748B;">
          Curious how these two options were evaluated? 
          <a onclick="openFaqModal()" style="color:var(--primary-navy); font-weight:700; text-decoration:underline; cursor:pointer; margin-left:4px;">
            <i class="fas fa-circle-question" style="color:var(--saffron);"></i> View evaluation factors in FAQs
          </a>
        </span>
      </div>

    </div>
  `;
};

/**
 * Reusable Mandi Card Renderer
 */
const renderMandiCard = (centreResult, titleLabel, badgeText, themeColor, badgeBg) => {
  const c = centreResult;
  return `
    <div class="glass-panel" style="padding:26px; border-radius:18px; border:2px solid ${themeColor}; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; background:#FFF; box-shadow:0 8px 24px rgba(0,0,0,0.06);">
      
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="background:${badgeBg}; color:${themeColor}; font-size:0.8rem; font-weight:800; padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">
            ${badgeText}
          </span>
          <span style="font-size:0.85rem; font-weight:800; color:var(--primary-navy);">
            Match Score: <strong style="color:${themeColor};">${c.matchScore}%</strong>
          </span>
        </div>

        <h3 style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin:0 0 6px 0;">
          ${c.centerName}
        </h3>
        <p style="font-size:0.84rem; color:var(--text-muted); margin:0 0 18px 0;">
          <i class="fas fa-location-dot" style="color:var(--saffron);"></i> ${c.district}, ${c.state} &bull; <strong>${c.distance} km</strong> (${c.travelTimeDisplay})
        </p>

        <!-- Profit / Economic Value Highlight -->
        <div style="background:${badgeBg}; border:1.5px solid ${themeColor}; border-radius:14px; padding:16px; margin-bottom:18px; text-align:center;">
          <span style="font-size:0.75rem; font-weight:700; color:${themeColor}; text-transform:uppercase; letter-spacing:0.5px;">Estimated Profit / Net Economic Value</span>
          <div style="font-size:2rem; font-weight:900; color:var(--primary-navy); margin-top:2px;">
            ${c.formattedNev || '₹' + c.nev.toLocaleString('en-IN')}
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            Gross Revenue ₹${c.grossRevenue.toLocaleString('en-IN')} minus logistics & deterioration
          </span>
        </div>

        <!-- Key Metrics Grid -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; font-size:0.84rem;">
          <div style="background:var(--bg-main); padding:10px 12px; border-radius:8px;">
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700;">Procurement Price</span>
            <strong style="color:var(--green-gov); font-size:0.95rem;">₹${c.pricePerQuintal}/Q</strong>
          </div>
          <div style="background:var(--bg-main); padding:10px 12px; border-radius:8px;">
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700;">Transport Cost</span>
            <strong style="color:var(--primary-navy); font-size:0.95rem;">₹${c.transportCost.toLocaleString('en-IN')}</strong>
          </div>
          <div style="background:var(--bg-main); padding:10px 12px; border-radius:8px;">
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700;">Waiting Time</span>
            <strong style="color:var(--primary-navy); font-size:0.95rem;">~${c.waitingDays} Day(s)</strong>
          </div>
          <div style="background:var(--bg-main); padding:10px 12px; border-radius:8px;">
            <span style="color:var(--text-muted); display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700;">Weather Feed</span>
            <strong style="color:var(--primary-navy); font-size:0.95rem;">
              <i class="fas ${c.weatherClassification.icon || 'fa-cloud'}" style="color:${c.weatherClassification.color};"></i> ${c.weatherClassification.label} (${c.weather.temp}°C)
            </strong>
          </div>
        </div>

        <!-- Key Highlights -->
        ${c.keyReasons && c.keyReasons.length > 0 ? `
          <div style="margin-bottom:20px;">
            <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Advantages:</span>
            <ul style="margin:6px 0 0 0; padding-left:18px; font-size:0.82rem; color:var(--text-main); line-height:1.5;">
              ${c.keyReasons.slice(0, 3).map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

      </div>

      <!-- Button: View & Select Slot (Section 16 & 18) -->
      <button 
        class="btn btn-primary" 
        style="width:100%; padding:14px; font-weight:800; font-size:1.05rem; justify-content:center; border-radius:12px; background:${themeColor}; border-color:${themeColor};"
        onclick="handleSelectMandi('${c.centerId}')"
      >
        <i class="fas fa-calendar-check"></i> View & Select Slot
      </button>

    </div>
  `;
};

const toggleMathExplanation = () => {
  smartMandiState.showMathExplanation = !smartMandiState.showMathExplanation;
  renderSmartMandiView();
};

/**
 * -------------------------------------------------------------
 * STEP 4: AUTOMATIC DATE AND TIME ASSIGNMENT (Section 19 & 20)
 * -------------------------------------------------------------
 */
const handleSelectMandi = async (centerId) => {
  const res = smartMandiState.mandiResults;
  const allRanked = (res && res.rankedResults) || [];
  const matched = allRanked.find(m => m.centerId === centerId || m.centre.id === centerId || m.centre.code === centerId);
  smartMandiState.selectedMandi = matched || allRanked[0];

  // Fetch Recommended Slot from Backend (Section 19)
  try {
    const token = localStorage.getItem('kpms_token');
    const apiRes = await fetch(`/api/smart-mandi/recommended-slot?centerId=${encodeURIComponent(centerId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await apiRes.json();
    if (json.success) {
      smartMandiState.recommendedDate = json.recommendedDate;
      smartMandiState.recommendedTimeSlot = json.recommendedTimeSlot;
    } else {
      // Fallback
      const d = new Date();
      d.setDate(d.getDate() + 1);
      smartMandiState.recommendedDate = d.toISOString().split('T')[0];
      smartMandiState.recommendedTimeSlot = '09:00 AM - 09:30 AM';
    }
  } catch (e) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    smartMandiState.recommendedDate = d.toISOString().split('T')[0];
    smartMandiState.recommendedTimeSlot = '09:00 AM - 09:30 AM';
  }

  smartMandiState.step = 4;
  renderSmartMandiView();
};

const renderRecommendedSlotStep = () => {
  const mandi = smartMandiState.selectedMandi;
  const mandiName = mandi ? mandi.centerName : 'Selected Mandi';
  const assignedDate = smartMandiState.recommendedDate;
  const assignedTime = smartMandiState.recommendedTimeSlot;

  // Format date display
  const dateObj = new Date(assignedDate);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : assignedDate;

  return `
    <div class="glass-panel" style="padding:36px; border-radius:18px; max-width:650px; margin:0 auto; background:#FFF; border:2px solid var(--saffron); box-shadow:0 12px 36px rgba(0,0,0,0.08);">
      
      <div style="text-align:center; margin-bottom:24px;">
        <div style="width:64px; height:64px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:1.8rem;">
          <i class="fas fa-calendar-check"></i>
        </div>
        <span style="background:rgba(224,109,20,0.12); color:var(--saffron); font-size:0.8rem; font-weight:800; padding:4px 14px; border-radius:20px; text-transform:uppercase;">
          Assigned by Smart System
        </span>
        <h2 style="font-size:1.8rem; font-weight:800; color:var(--primary-navy); margin:10px 0 4px 0;">
          Your Recommended Slot
        </h2>
        <p style="color:var(--text-muted); font-size:0.92rem; margin:0;">
          Automatically allocated sequentially based on live mandi queue capacity.
        </p>
      </div>

      <!-- Mandi Summary -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:22px;">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Selected Mandi:</div>
        <div style="font-size:1.2rem; font-weight:800; color:var(--primary-navy); margin:2px 0 4px;">${mandiName}</div>
        <div style="font-size:0.85rem; color:var(--text-muted);">
          Commodity: <strong>${smartMandiState.selectedCrop}</strong> &bull; Volume: <strong>${smartMandiState.quantity} Quintals</strong>
        </div>
      </div>

      <!-- Prominent Assigned Date & Time Display (Section 19) -->
      <div style="background:#EFF6FF; border:2px solid #2563EB; border-radius:14px; padding:20px; margin-bottom:26px; text-align:center;">
        <div style="margin-bottom:12px;">
          <span style="font-size:0.75rem; color:#1E40AF; text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Recommended Date</span>
          <div style="font-size:1.4rem; font-weight:900; color:#0F172A; margin-top:2px;">
            ${dateFormatted}
          </div>
          <div style="font-size:0.82rem; color:#1E40AF; font-weight:600;">(${assignedDate})</div>
        </div>

        <div style="border-top:1px dashed #93C5FD; padding-top:12px;">
          <span style="font-size:0.75rem; color:#1E40AF; text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Sequential Time Slot</span>
          <div style="font-size:1.5rem; font-weight:900; color:#1E3A8A; margin-top:2px;">
            ${assignedTime}
          </div>
          <span style="font-size:0.75rem; color:#64748B;">
            <i class="fas fa-circle-check" style="color:#10B981;"></i> Guaranteed entry gate window with expedited weighbridge lane
          </span>
        </div>
      </div>

      <!-- Action Buttons: Confirm vs Not Feasible (Section 19 & 21) -->
      <div style="display:flex; flex-direction:column; gap:12px;">
        <button 
          class="btn btn-primary" 
          style="padding:16px; font-size:1.15rem; font-weight:800; justify-content:center; border-radius:12px; box-shadow:0 6px 20px rgba(224,109,20,0.35);"
          onclick="handleConfirmSlotClick(false)"
        >
          <i class="fas fa-check-circle"></i> Confirm Slot
        </button>

        <button 
          class="btn btn-outline" 
          style="padding:13px; font-size:0.95rem; font-weight:700; justify-content:center; border-radius:12px; border:2px solid #CBD5E1; color:#1E293B; background:#FFFFFF;"
          onclick="handleNotFeasibleClick()"
        >
          <i class="fas fa-calendar-xmark" style="color:var(--saffron);"></i> This date/time is not feasible for me
        </button>
      </div>

    </div>
  `;
};

/**
 * -------------------------------------------------------------
 * STEP 5: CONDITIONAL ALTERNATIVE DATE & TIME FLOW (Section 21 & 22)
 * ONLY shown if farmer clicks [This date/time is not feasible for me]
 * -------------------------------------------------------------
 */
const handleNotFeasibleClick = async () => {
  const mandi = smartMandiState.selectedMandi;
  const centerId = mandi ? (mandi.centerId || mandi.centre?.id || mandi.centre?.code || mandi._id || mandi.id || 'CTR-01') : 'CTR-01';
  const cropName = smartMandiState.selectedCrop || 'Wheat';
  const perishabilityLevel = (smartMandiState.cropProfile && smartMandiState.cropProfile.perishabilityLevel) || 'Moderate';

  try {
    const token = localStorage.getItem('kpms_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api/smart-mandi/available-dates?centerId=${encodeURIComponent(centerId)}&cropName=${encodeURIComponent(cropName)}&perishabilityLevel=${encodeURIComponent(perishabilityLevel)}`, { headers });
    const json = await res.json();
    const candidateDates = (json && (json.dates || json.availableDates || (json.data && (json.data.dates || json.data.availableDates)))) || [];
    
    if (json && json.success && Array.isArray(candidateDates) && candidateDates.length > 0) {
      smartMandiState.availableDates = candidateDates;
      smartMandiState.perishabilityWindowDays = json.windowDays || json.data?.windowDays || 15;
      smartMandiState.perishabilityLevel = json.perishabilityLevel || perishabilityLevel;
    } else {
      // Calculate valid non-Sunday business days within the perishability window
      const winDays = (perishabilityLevel === 'High' || perishabilityLevel === 'Very High') ? 3 : (perishabilityLevel === 'Low' ? 30 : 15);
      const computedDates = [];
      const baseDate = new Date();
      for (let i = 1; i <= winDays + 4; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        if (d.getDay() !== 0) { // skip Sundays
          computedDates.push(d.toISOString().split('T')[0]);
        }
        if (computedDates.length >= winDays) break;
      }
      smartMandiState.availableDates = computedDates;
      smartMandiState.perishabilityWindowDays = winDays;
      smartMandiState.perishabilityLevel = perishabilityLevel;
    }
  } catch (err) {
    console.warn('Could not fetch available dates from API, using fallback:', err);
    const winDays = (perishabilityLevel === 'High' || perishabilityLevel === 'Very High') ? 3 : (perishabilityLevel === 'Low' ? 30 : 15);
    const computedDates = [];
    const baseDate = new Date();
    for (let i = 1; i <= winDays + 4; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      if (d.getDay() !== 0) {
        computedDates.push(d.toISOString().split('T')[0]);
      }
      if (computedDates.length >= winDays) break;
    }
    smartMandiState.availableDates = computedDates;
    smartMandiState.perishabilityWindowDays = winDays;
    smartMandiState.perishabilityLevel = perishabilityLevel;
  }

  // Strict Date -> Time sequence: do not pre-select date or time slots
  smartMandiState.alternativeDate = null;
  smartMandiState.alternativeTimeSlot = null;
  smartMandiState.availableDateSlots = [];
  smartMandiState.step = 5;
  renderSmartMandiView();
};

const fetchAvailableSlotsForAlternativeDate = async (dateStr) => {
  const mandi = smartMandiState.selectedMandi;
  const centerId = mandi ? (mandi.centerId || mandi.centre?.id || mandi.centre?.code || mandi._id || mandi.id || 'CTR-01') : 'CTR-01';
  try {
    const token = localStorage.getItem('kpms_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api/bookings/slots?centerId=${encodeURIComponent(centerId)}&date=${encodeURIComponent(dateStr)}`, { headers });
    const json = await res.json();
    if (json && json.success && Array.isArray(json.slots) && json.slots.length > 0) {
      smartMandiState.availableDateSlots = json.slots;
      smartMandiState.alternativeTimeSlot = null;
    } else {
      // Dynamic standard slot intervals
      smartMandiState.availableDateSlots = [
        { timeSlot: '08:00 AM - 08:30 AM', maxCapacity: 20, bookedCount: 3, availableSlots: 17, isFull: false, status: 'Available' },
        { timeSlot: '08:30 AM - 09:00 AM', maxCapacity: 20, bookedCount: 5, availableSlots: 15, isFull: false, status: 'Available' },
        { timeSlot: '09:00 AM - 09:30 AM', maxCapacity: 20, bookedCount: 8, availableSlots: 12, isFull: false, status: 'Available' },
        { timeSlot: '09:30 AM - 10:00 AM', maxCapacity: 20, bookedCount: 14, availableSlots: 6, isFull: false, status: 'Available' },
        { timeSlot: '10:00 AM - 10:30 AM', maxCapacity: 20, bookedCount: 18, availableSlots: 2, isFull: false, status: 'Fast Filling' },
        { timeSlot: '10:30 AM - 11:00 AM', maxCapacity: 20, bookedCount: 10, availableSlots: 10, isFull: false, status: 'Available' },
        { timeSlot: '11:00 AM - 11:30 AM', maxCapacity: 20, bookedCount: 4, availableSlots: 16, isFull: false, status: 'Available' },
        { timeSlot: '11:30 AM - 12:00 PM', maxCapacity: 20, bookedCount: 2, availableSlots: 18, isFull: false, status: 'Available' },
        { timeSlot: '02:00 PM - 02:30 PM', maxCapacity: 20, bookedCount: 7, availableSlots: 13, isFull: false, status: 'Available' },
        { timeSlot: '02:30 PM - 03:00 PM', maxCapacity: 20, bookedCount: 6, availableSlots: 14, isFull: false, status: 'Available' },
        { timeSlot: '03:00 PM - 03:30 PM', maxCapacity: 20, bookedCount: 4, availableSlots: 16, isFull: false, status: 'Available' },
        { timeSlot: '03:30 PM - 04:00 PM', maxCapacity: 20, bookedCount: 1, availableSlots: 19, isFull: false, status: 'Available' }
      ];
      smartMandiState.alternativeTimeSlot = null;
    }
  } catch (e) {
    console.warn('Could not fetch alternative slots, using dynamic intervals:', e);
    smartMandiState.availableDateSlots = [
      { timeSlot: '08:00 AM - 08:30 AM', maxCapacity: 20, bookedCount: 3, availableSlots: 17, isFull: false, status: 'Available' },
      { timeSlot: '08:30 AM - 09:00 AM', maxCapacity: 20, bookedCount: 5, availableSlots: 15, isFull: false, status: 'Available' },
      { timeSlot: '09:00 AM - 09:30 AM', maxCapacity: 20, bookedCount: 8, availableSlots: 12, isFull: false, status: 'Available' },
      { timeSlot: '09:30 AM - 10:00 AM', maxCapacity: 20, bookedCount: 14, availableSlots: 6, isFull: false, status: 'Available' },
      { timeSlot: '10:00 AM - 10:30 AM', maxCapacity: 20, bookedCount: 18, availableSlots: 2, isFull: false, status: 'Fast Filling' },
      { timeSlot: '10:30 AM - 11:00 AM', maxCapacity: 20, bookedCount: 10, availableSlots: 10, isFull: false, status: 'Available' },
      { timeSlot: '11:00 AM - 11:30 AM', maxCapacity: 20, bookedCount: 4, availableSlots: 16, isFull: false, status: 'Available' },
      { timeSlot: '11:30 AM - 12:00 PM', maxCapacity: 20, bookedCount: 2, availableSlots: 18, isFull: false, status: 'Available' }
    ];
    smartMandiState.alternativeTimeSlot = null;
  }
  renderSmartMandiView();
};

const renderAlternativeDateStep = () => {
  const mandi = smartMandiState.selectedMandi;
  const dates = smartMandiState.availableDates || [];
  const slots = smartMandiState.availableDateSlots || [];
  const windowDays = smartMandiState.perishabilityWindowDays || 15;
  const pLevel = smartMandiState.perishabilityLevel || 'Moderate';
  const crop = smartMandiState.selectedCrop || 'Crop';

  return `
    <div class="glass-panel" style="padding:32px; border-radius:18px; max-width:720px; margin:0 auto; background:#FFFFFF; border:1.5px solid #CBD5E1; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <button class="btn btn-outline btn-sm" onclick="goToSmartMandiStep(4)">
          <i class="fas fa-arrow-left"></i> Back to Recommended Slot
        </button>
        <span style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">
          Mandi: <strong>${mandi ? mandi.centerName : 'Centre'}</strong>
        </span>
      </div>

      <div style="margin-bottom:18px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <h2 style="font-size:1.5rem; font-weight:800; color:var(--primary-navy); margin:0;">
            Choose an Alternative Date
          </h2>
          <span class="status-pill waiting" style="font-size:0.75rem; font-weight:800;">
            ${crop} &bull; ${windowDays}-Day Window
          </span>
        </div>
        <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
          Selectable date window calculated automatically from current crop perishability (<strong>${pLevel} Perishability: Next ${windowDays} Days</strong>). Sundays and holidays excluded.
        </p>
      </div>

      <!-- Date Selection Grid (Section 21) -->
      <div style="margin-bottom:24px;">
        <span style="font-size:0.78rem; font-weight:800; color:var(--primary-navy); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:10px;">
          1. Select Available Date:
        </span>
        ${dates.length === 0 ? `
          <div style="padding:20px; text-align:center; background:#FFF7ED; border:1px dashed var(--saffron); border-radius:12px; color:#9A3412;">
            <i class="fas fa-calendar-xmark" style="font-size:1.5rem; margin-bottom:6px;"></i>
            <p style="margin:0; font-weight:700;">No available dates found within the ${windowDays}-day perishability window.</p>
          </div>
        ` : `
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(105px, 1fr)); gap:10px; max-height:260px; overflow-y:auto; padding:4px;">
            ${dates.map(dateStr => {
              const isSel = smartMandiState.alternativeDate === dateStr;
              const dObj = new Date(dateStr);
              const dayName = dObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = dObj.getDate();
              const monthName = dObj.toLocaleDateString('en-IN', { month: 'short' });
              return `
                <div 
                  onclick="handleSelectAlternativeDate('${dateStr}')"
                  style="padding:12px 8px; border-radius:12px; cursor:pointer; text-align:center; border:2px solid ${isSel ? 'var(--saffron)' : '#CBD5E1'}; background:${isSel ? '#FFF7ED' : '#FFFFFF'}; transition:all 0.2s ease; box-shadow:0 2px 6px rgba(0,0,0,0.04);"
                >
                  <div style="font-size:0.75rem; font-weight:800; color:${isSel ? 'var(--saffron)' : '#64748B'}; text-transform:uppercase;">${dayName}</div>
                  <div style="font-size:1.35rem; font-weight:900; color:var(--primary-navy); margin:2px 0;">${dayNum}</div>
                  <div style="font-size:0.75rem; color:#475569; font-weight:600;">${monthName}</div>
                  ${isSel ? '<div style="margin-top:4px;"><i class="fas fa-circle-check" style="color:var(--saffron); font-size:0.85rem;"></i></div>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Time Selection Section: Shown ONLY AFTER Date is Selected -->
      <div style="margin-bottom:26px;">
        <span style="font-size:0.78rem; font-weight:800; color:var(--primary-navy); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:10px;">
          2. Select Confirmed Time Slot:
        </span>

        ${!smartMandiState.alternativeDate ? `
          <div style="padding:24px; text-align:center; background:#F8FAFC; border:1.5px dashed #CBD5E1; border-radius:12px;">
            <i class="fas fa-hand-pointer" style="font-size:1.8rem; color:var(--saffron); margin-bottom:8px;"></i>
            <div style="font-weight:800; font-size:0.95rem; color:var(--primary-navy);">Please select an available date above</div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              Available time slots for that specific date will be displayed here immediately.
            </p>
          </div>
        ` : `
          <div>
            <div style="font-size:0.88rem; font-weight:700; color:var(--primary-navy); margin-bottom:10px;">
              Available Time Slots for <strong>${smartMandiState.alternativeDate}</strong>:
            </div>

            ${slots.length === 0 ? `
              <div style="padding:16px; text-align:center; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; color:#991B1B;">
                No slots found for this date.
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                ${slots.map(s => {
                  const isSel = smartMandiState.alternativeTimeSlot === s.timeSlot;
                  const disabled = s.isFull;
                  return `
                    <div 
                      onclick="${disabled ? '' : `handleSelectAlternativeTimeSlot('${s.timeSlot}')`}"
                      style="padding:12px 14px; border-radius:10px; cursor:${disabled ? 'not-allowed' : 'pointer'}; opacity:${disabled ? '0.45' : '1'}; border:2px solid ${isSel ? 'var(--saffron)' : '#CBD5E1'}; background:${isSel ? '#FFF7ED' : '#FFFFFF'}; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);"
                    >
                      <div>
                        <div style="font-weight:800; font-size:0.88rem; color:#0F172A;">${s.timeSlot}</div>
                        <div style="font-size:0.72rem; color:${disabled ? '#DC2626' : (s.availableSlots <= 3 ? '#D97706' : '#16A34A')}; font-weight:700;">
                          ${disabled ? 'Full' : `${s.availableSlots} slots available`}
                        </div>
                      </div>
                      ${isSel ? '<i class="fas fa-check-circle" style="color:var(--saffron);"></i>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        `}
      </div>

      <!-- Confirm Slot Button (Enabled only when both date and time slot are selected) -->
      ${smartMandiState.alternativeDate && smartMandiState.alternativeTimeSlot ? `
        <button 
          class="btn btn-primary" 
          style="width:100%; padding:15px; font-weight:800; font-size:1.15rem; justify-content:center; border-radius:12px; box-shadow:0 6px 20px rgba(224,109,20,0.3);"
          onclick="handleConfirmAlternativeSlotClick()"
        >
          <i class="fas fa-check-circle"></i> Confirm Slot for ${smartMandiState.alternativeDate} (${smartMandiState.alternativeTimeSlot})
        </button>
      ` : `
        <button 
          class="btn btn-outline" 
          disabled
          style="width:100%; padding:14px; font-weight:700; font-size:1rem; justify-content:center; border-radius:12px; opacity:0.6; cursor:not-allowed; background:#F1F5F9;"
        >
          <i class="fas fa-lock"></i> Select a date and time slot to confirm
        </button>
      `}

    </div>
  `;
};

const handleSelectAlternativeDate = async (dateStr) => {
  smartMandiState.alternativeDate = dateStr;
  await fetchAvailableSlotsForAlternativeDate(dateStr);
};

const handleSelectAlternativeTimeSlot = (timeStr) => {
  smartMandiState.alternativeTimeSlot = timeStr;
  renderSmartMandiView();
};

/**
 * Handle confirmation of alternative slot with double-booking check
 */
const handleConfirmAlternativeSlotClick = async () => {
  if (!smartMandiState.alternativeDate || !smartMandiState.alternativeTimeSlot) {
    showToast('Please select both an alternative date and a time slot.', 'warning');
    return;
  }

  // Re-check slot availability before committing to prevent race conditions
  const mandi = smartMandiState.selectedMandi;
  const centerId = mandi ? (mandi.centerId || mandi.centre?.id || mandi.centre?.code || mandi._id || mandi.id || 'CTR-01') : 'CTR-01';
  try {
    const token = localStorage.getItem('kpms_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api/bookings/slots?centerId=${encodeURIComponent(centerId)}&date=${encodeURIComponent(smartMandiState.alternativeDate)}`, { headers });
    const json = await res.json();
    if (json.success && Array.isArray(json.slots)) {
      const targetSlot = json.slots.find(s => s.timeSlot === smartMandiState.alternativeTimeSlot);
      if (targetSlot && targetSlot.isFull) {
        showToast(`Slot ${smartMandiState.alternativeTimeSlot} is full. Please select an available slot.`, 'error');
        smartMandiState.availableDateSlots = json.slots;
        smartMandiState.alternativeTimeSlot = null;
        renderSmartMandiView();
        return;
      }
    }
  } catch (e) {
    console.warn('Pre-commit slot check warning:', e);
  }

  await handleConfirmSlotClick(true);
};

/**
 * -------------------------------------------------------------
 * FINAL BOOKING COMMIT & BREVO EMAIL (Section 20, 24, 25)
 * -------------------------------------------------------------
 */
const handleConfirmSlotClick = async (isAlternative = false) => {
  const token = localStorage.getItem('kpms_token');
  const mandi = smartMandiState.selectedMandi;
  if (!mandi) {
    showToast('Invalid mandi selection', 'error');
    return;
  }

  const dateToBook = isAlternative ? smartMandiState.alternativeDate : smartMandiState.recommendedDate;
  const timeToBook = isAlternative ? smartMandiState.alternativeTimeSlot : smartMandiState.recommendedTimeSlot;

  if (!dateToBook || !timeToBook) {
    showToast('Please select a valid date and time slot', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/smart-mandi/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        centerId: mandi.centerId,
        cropName: smartMandiState.selectedCrop,
        quantity: smartMandiState.quantity,
        date: dateToBook,
        timeSlot: timeToBook,
        isAlternativeSlot: isAlternative
      })
    });

    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Booking confirmation failed', 'error');
      return;
    }

    smartMandiState.bookedRecord = json.data;
    smartMandiState.step = 6;
    renderSmartMandiView();
  } catch (err) {
    console.error('Error committing booking:', err);
    showToast('Network error during booking confirmation', 'error');
  }
};

/**
 * -------------------------------------------------------------
 * STEP 6: BOOKING CONFIRMED (Section 24 & 25)
 * -------------------------------------------------------------
 */
const renderBookingConfirmedStep = () => {
  const b = smartMandiState.bookedRecord || {};

  return `
    <div class="glass-panel" style="padding:40px 32px; border-radius:18px; max-width:680px; margin:0 auto; background:#FFF; border:2px solid #16A34A; box-shadow:0 12px 36px rgba(22,163,74,0.12);">
      
      <div style="text-align:center; margin-bottom:24px;">
        <div style="width:72px; height:72px; border-radius:50%; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:2.2rem;">
          <i class="fas fa-check"></i>
        </div>
        <h2 style="font-size:2rem; font-weight:900; color:#14532D; margin:0 0 6px 0;">
          ✓ Slot Confirmed
        </h2>
        <p style="color:var(--text-muted); font-size:0.95rem; margin:0;">
          Your digital procurement token has been registered in the national queue.
        </p>
      </div>

      <!-- Booking Voucher Card -->
      <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:14px; padding:20px; margin-bottom:26px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #86EFAC; padding-bottom:14px; margin-bottom:14px;">
          <div>
            <span style="font-size:0.75rem; color:#166534; font-weight:800; text-transform:uppercase;">Procurement Token</span>
            <div style="font-size:1.6rem; font-weight:900; color:#14532D;">${b.tokenNumber || 'TOKEN-2026-PENDING'}</div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; color:#166534; font-weight:800; text-transform:uppercase;">Booking Ref</span>
            <div style="font-size:1.1rem; font-weight:800; color:#0F172A;">${b.bookingNumber || 'BKG-2026'}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.88rem;">
          <div>
            <span style="color:#166534; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Mandi Centre:</span>
            <strong style="color:#0F172A; display:block;">${b.centerName}</strong>
          </div>
          <div>
            <span style="color:#166534; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Commodity & Volume:</span>
            <strong style="color:#0F172A; display:block;">${b.cropName} (${b.quantity} Q)</strong>
          </div>
          <div>
            <span style="color:#166534; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Scheduled Date:</span>
            <strong style="color:#0F172A; display:block;">${b.date}</strong>
          </div>
          <div>
            <span style="color:#166534; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Time Slot:</span>
            <strong style="color:#0F172A; display:block;">${b.timeSlot}</strong>
          </div>
        </div>

        <!-- Brevo Email Status Notification -->
        <div style="margin-top:16px; padding-top:12px; border-top:1px solid #BBF7D0; display:flex; align-items:center; gap:8px; font-size:0.8rem; color:#166534; font-weight:600;">
          <i class="fas fa-envelope-circle-check"></i> Confirmation email dispatched via official Brevo notifications.
        </div>
      </div>

      <!-- Transition to Next Crop Planning & Dashboard -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button 
          class="btn btn-primary" 
          style="padding:15px; font-weight:800; font-size:1.15rem; justify-content:center; border-radius:12px;"
          onclick="goToSmartMandiStep(7)"
        >
          <i class="fas fa-seedling"></i> Plan Next Crop Season (Demand Forecast)
        </button>

        <button 
          class="btn btn-outline" 
          style="padding:12px; font-weight:700; font-size:0.95rem; justify-content:center; border-radius:12px;"
          onclick="routeTo('#farmer-dashboard')"
        >
          <i class="fas fa-arrow-left"></i> Go to Dashboard
        </button>
      </div>

    </div>
  `;
};

/**
 * -------------------------------------------------------------
 * STEP 7: NEXT CROP PLANNING (Section 27, 28, 29)
 * Supports Option 1: Actual Crop and Option 2: [Not Decided Yet]
 * -------------------------------------------------------------
 */
const renderNextCropPlanningStep = () => {
  const months = [
    'October', 'November', 'December', 'January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September'
  ];

  const crops = [
    // Food Grains & Pulses
    'Wheat', 'Paddy / Rice', 'Mustard', 'Gram (Chana)', 'Maize', 'Soyabean',
    // Fresh Vegetables
    'Tomato', 'Potato', 'Onion', 'Green Peas', 'Cauliflower', 'Leafy vegetables',
    // Fresh Fruits
    'Banana', 'Apple', 'Mango', 'Orange',
    // Cash Crops
    'Groundnut', 'Cotton'
  ];

  const isNotDecided = smartMandiState.nextCrop === 'Not Decided Yet';

  return `
    <div class="glass-panel" style="padding:36px; border-radius:18px; max-width:650px; margin:0 auto; background:#FFF; border:2px solid var(--primary-navy);">
      
      <div style="text-align:center; margin-bottom:24px;">
        <div style="width:64px; height:64px; border-radius:50%; background:rgba(14,42,71,0.08); color:var(--primary-navy); display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:1.8rem;">
          <i class="fas fa-seedling"></i>
        </div>
        <h2 style="font-size:1.7rem; font-weight:800; color:var(--primary-navy); margin:0 0 6px 0;">
          Future Crop Planning
        </h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">
          Select your planned future crop to update seasonal forecasts, or select [Not Decided Yet].
        </p>
      </div>

      <!-- Mode Selector: Actual Crop vs Not Decided Yet -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:22px;">
        <button 
          type="button"
          class="btn ${!isNotDecided ? 'btn-primary' : 'btn-outline'}" 
          style="padding:14px; font-weight:800; justify-content:center; border-radius:12px;"
          onclick="handleModeSelectFutureCrop('actual')"
        >
          <i class="fas fa-seedling"></i> Plan Actual Crop
        </button>

        <button 
          type="button"
          class="btn ${isNotDecided ? 'btn-primary' : 'btn-outline'}" 
          style="padding:14px; font-weight:800; justify-content:center; border-radius:12px; ${isNotDecided ? 'background:#64748B; border-color:#64748B;' : ''}"
          onclick="handleSelectNotDecidedYet()"
        >
          <i class="fas fa-circle-question"></i> Not Decided Yet
        </button>
      </div>

      ${isNotDecided ? `
        <!-- Option 2: Not Decided Yet Selected -->
        <div style="padding:22px; border-radius:12px; background:#F8FAFC; border:1.5px solid #CBD5E1; margin-bottom:24px; text-align:center;">
          <div style="font-size:2.2rem; color:#64748B; margin-bottom:10px;">
            <i class="fas fa-calendar-minus"></i>
          </div>
          <h3 style="font-size:1.25rem; font-weight:800; color:var(--primary-navy); margin:0 0 6px 0;">
            Next Crop Not Decided Yet
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; line-height:1.5; margin:0;">
            Your response will be recorded. The system will <strong>not</strong> trigger Time Travel popups or future crop prompts on your dashboard.
          </p>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button 
            class="btn btn-primary" 
            style="padding:15px; font-weight:800; font-size:1.1rem; justify-content:center; border-radius:12px; background:#64748B; border-color:#64748B;"
            onclick="handleSaveNotDecidedYet()"
          >
            <i class="fas fa-check"></i> Save Selection & Return to Dashboard
          </button>
        </div>
      ` : `
        <!-- Option 1: Actual Crop Planning -->
        <!-- Question 1: What crop will you grow next? -->
        <div style="margin-bottom:20px;">
          <label class="form-label" style="font-size:0.92rem; font-weight:800; color:var(--primary-navy);">
            What crop will you grow next?
          </label>
          <select id="next-crop-select" class="form-control" style="font-size:1rem; padding:12px 14px;" onchange="handleNextCropSelect(this.value)">
            <option value="">-- Choose Next Crop --</option>
            ${crops.map(c => `<option value="${c}" ${smartMandiState.nextCrop === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>

        <!-- Question 2: When will you sow the crop? -->
        ${smartMandiState.nextCrop && smartMandiState.nextCrop !== 'Not Decided Yet' ? `
          <div style="margin-bottom:22px; padding:18px; border-radius:12px; background:var(--bg-main); border:1px solid var(--border-color);">
            <label class="form-label" style="font-size:0.92rem; font-weight:800; color:var(--primary-navy); margin-bottom:8px;">
              When will you sow the crop?
            </label>

            <div style="margin-bottom:14px;">
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">Select Sowing Month:</span>
              <select id="next-sowing-month" class="form-control" style="margin-top:4px;" onchange="handleNextSowingMonth(this.value)">
                ${months.map(m => `<option value="${m}" ${smartMandiState.sowingMonth === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>

            <div>
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:6px;">Select Period in Month:</span>
              <div style="display:flex; gap:10px;">
                <button 
                  type="button"
                  class="btn ${smartMandiState.sowingPeriod === 'first_15' ? 'btn-primary' : 'btn-outline'}" 
                  style="flex:1; padding:10px; font-weight:800; justify-content:center; border-radius:8px;"
                  onclick="handleNextSowingPeriod('first_15')"
                >
                  First 15 days of the month
                </button>
                <button 
                  type="button"
                  class="btn ${smartMandiState.sowingPeriod === 'last_15' ? 'btn-primary' : 'btn-outline'}" 
                  style="flex:1; padding:10px; font-weight:800; justify-content:center; border-radius:8px;"
                  onclick="handleNextSowingPeriod('last_15')"
                >
                  Last 15 days of the month
                </button>
              </div>
            </div>
          </div>

          <!-- Estimated Future Harvest Summary -->
          <div style="background:#F0FDF4; border:1px solid #86EFAC; border-radius:12px; padding:16px; margin-bottom:24px;">
            <span style="font-size:0.75rem; color:#166534; font-weight:800; text-transform:uppercase;">Estimated Future Harvest & Mandi Arrival:</span>
            <div style="font-size:1.15rem; font-weight:800; color:#14532D; margin-top:2px; display:flex; align-items:center; gap:8px;">
              <img src="/images/nav/crop_readiness.jpg" style="width:22px; height:22px; border-radius:4px; object-fit:cover;" alt="" />
              <span>${calculateFutureHarvestDisplay()}</span>
            </div>
            <p style="font-size:0.78rem; color:#166534; margin:4px 0 0 0;">
              Calculated automatically based on ${smartMandiState.nextCrop} maturation cycle (~3-4 months).
            </p>
          </div>
        ` : ''}

        <!-- Submit & Finish Buttons -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button 
            class="btn btn-primary" 
            style="padding:15px; font-weight:800; font-size:1.1rem; justify-content:center; border-radius:12px;"
            onclick="handleSaveNextCropPlanClick()"
          >
            <i class="fas fa-check"></i> Save Next Crop Plan
          </button>

          <button 
            class="btn btn-outline" 
            style="padding:12px; font-weight:700; font-size:0.95rem; justify-content:center; border-radius:12px;"
            onclick="handleSelectNotDecidedYet()"
          >
            I haven't decided yet
          </button>
        </div>
      `}

    </div>
  `;
};

const handleModeSelectFutureCrop = (mode) => {
  if (mode === 'actual') {
    smartMandiState.nextCrop = smartMandiState.nextCrop === 'Not Decided Yet' ? 'Wheat' : (smartMandiState.nextCrop || 'Wheat');
  }
  renderSmartMandiView();
};

const handleSelectNotDecidedYet = () => {
  smartMandiState.nextCrop = 'Not Decided Yet';
  renderSmartMandiView();
};

const handleSaveNotDecidedYet = async () => {
  const token = localStorage.getItem('kpms_token');
  try {
    await fetch('/api/smart-mandi/next-crop-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cropName: 'Not Decided Yet'
      })
    });
  } catch (e) {
    console.warn('Error saving Not Decided Yet:', e);
  }

  // Ensure Time Travel and Readiness Verification tabs are strictly suppressed
  window.farmerHasPlannedFutureCrop = false;
  window.activeForecastCache = null;
  localStorage.removeItem('kpms_farmer_has_future_crop');
  localStorage.removeItem('kpms_future_crop_name');
  sessionStorage.setItem('kpms_just_saved_actual_future_crop', 'false');
  localStorage.setItem('kpms_time_travel_eligible', 'false');

  showToast('Future crop selection saved as Not Decided Yet.', 'info');
  routeTo('#farmer-dashboard');
};

const handleNextCropSelect = (crop) => {
  smartMandiState.nextCrop = crop;
  renderSmartMandiView();
};

const handleNextSowingMonth = (month) => {
  smartMandiState.sowingMonth = month;
  renderSmartMandiView();
};

const handleNextSowingPeriod = (period) => {
  smartMandiState.sowingPeriod = period;
  renderSmartMandiView();
};

const calculateFutureHarvestDisplay = () => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const curIdx = months.indexOf(smartMandiState.sowingMonth);
  const duration = 4; // average 4 months
  const harvestIdx = curIdx !== -1 ? (curIdx + duration) % 12 : 2;
  const harvestMonth = months[harvestIdx];
  const periodText = smartMandiState.sowingPeriod === 'first_15' ? 'First 15 Days' : 'Last 15 Days';
  return `${harvestMonth} (${periodText})`;
};

const handleSaveNextCropPlanClick = async () => {
  const token = localStorage.getItem('kpms_token');
  const crop = smartMandiState.nextCrop;

  if (!crop || crop === 'Not Decided Yet') {
    return handleSaveNotDecidedYet();
  }

  try {
    const res = await fetch('/api/smart-mandi/next-crop-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cropName: crop,
        sowingMonth: smartMandiState.sowingMonth,
        sowingPeriod: smartMandiState.sowingPeriod,
        estimatedQuantity: smartMandiState.quantity || 50,
        mandiId: smartMandiState.selectedMandi ? smartMandiState.selectedMandi.centerId : 'CTR-01',
        mandiName: smartMandiState.selectedMandi ? smartMandiState.selectedMandi.centerName : 'APMC Central Mandi'
      })
    });

    const json = await res.json();
    if (json.success) {
      // Mark flags so that dashboard will show the Readiness Verification tab and widget
      window.farmerHasPlannedFutureCrop = true;
      window.activeForecastCache = json.forecast || { cropName: crop };
      localStorage.setItem('kpms_farmer_has_future_crop', 'true');
      localStorage.setItem('kpms_future_crop_name', crop);
      sessionStorage.setItem('kpms_just_saved_actual_future_crop', 'true');
      localStorage.setItem('kpms_time_travel_eligible', 'true');
      showToast(`Next crop plan for ${crop} saved! Readiness Verification tab is now unlocked on your dashboard.`, 'success');
      routeTo('#farmer-dashboard');
    } else {
      showToast(json.message || 'Error saving next crop plan', 'error');
    }
  } catch (e) {
    console.error('Error saving next crop plan:', e);
    window.farmerHasPlannedFutureCrop = true;
    localStorage.setItem('kpms_farmer_has_future_crop', 'true');
    localStorage.setItem('kpms_future_crop_name', crop);
    sessionStorage.setItem('kpms_just_saved_actual_future_crop', 'true');
    showToast(`Plan for ${crop} recorded. Returning to dashboard.`, 'info');
    routeTo('#farmer-dashboard');
  }
};

/**
 * -------------------------------------------------------------
 * "LOOK AT ALL MANDI OPTIONS" MODAL (Section 17)
 * -------------------------------------------------------------
 */
const openAllMandisModal = () => {
  const res = smartMandiState.mandiResults;
  const allRanked = (res && res.rankedResults) || [];

  const modal = document.createElement('div');
  modal.id = 'all-mandis-modal';
  modal.className = 'modal-backdrop active';

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width:850px; max-height:90vh; overflow-y:auto; border-radius:18px; padding:28px; background:#FFFFFF; border:1px solid #CBD5E1; box-shadow:0 16px 40px rgba(0,0,0,0.2);">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:var(--primary-navy); margin:0;">
            All Eligible Mandi Options (${allRanked.length})
          </h2>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:2px 0 0 0;">
            Sorted strictly by Net Economic Value and mathematical rank.
          </p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="closeAllMandisModal()" style="border-radius:50%; width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center;">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div style="display:flex; flex-direction:column; gap:14px;">
        ${allRanked.map((c, idx) => `
          <div style="padding:16px 20px; border-radius:12px; background:#FFFFFF; border:1.5px solid ${idx === 0 ? 'var(--green-gov)' : '#CBD5E1'}; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:900; color:${idx === 0 ? 'var(--green-gov)' : 'var(--primary-navy)'}; font-size:1rem;">
                  #${idx + 1} ${c.centerName}
                </span>
                ${idx === 0 ? '<span class="status-pill completed" style="font-size:0.7rem;"><i class="fas fa-check-circle" style="margin-right:4px;"></i> Best Overall</span>' : ''}
                ${idx === 1 ? '<span class="status-pill waiting" style="font-size:0.7rem;"><i class="fas fa-arrow-right-arrow-left" style="margin-right:4px;"></i> Practical Alternative</span>' : ''}
              </div>
              <div style="font-size:0.82rem; color:var(--text-muted); margin-top:3px;">
                ${c.district}, ${c.state} &bull; ${c.distance} km &bull; Price: ₹${c.pricePerQuintal}/Q &bull; Transport: ₹${c.transportCost.toLocaleString('en-IN')} &bull; Queue: ~${c.waitingDays}d
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <div style="text-align:right;">
                <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Est. Profit</span>
                <div style="font-size:1.25rem; font-weight:900; color:var(--primary-navy);">${c.formattedNev || '₹' + c.nev.toLocaleString('en-IN')}</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="handleSelectMandi('${c.centerId}'); closeAllMandisModal();" style="font-weight:800; padding:8px 16px;">
                Select Slot
              </button>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  document.body.appendChild(modal);
};

const closeAllMandisModal = () => {
  const el = document.getElementById('all-mandis-modal');
  if (el) el.remove();
};

const goToSmartMandiStep = (stepNumber) => {
  smartMandiState.step = stepNumber;
  renderSmartMandiView();
};
window.goToSmartMandiStep = goToSmartMandiStep;

/**
 * Helper to resolve yield multiplier on frontend
 */
const getYieldMultiplier = (cropName = '') => {
  const clean = cropName.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.includes('wheat') || clean.includes('gehun')) return 22;
  if (clean.includes('rice') || clean.includes('paddy') || clean.includes('dhan')) return 25;
  if (clean.includes('gram') || clean.includes('chana')) return 12;
  if (clean.includes('mustard') || clean.includes('sarson')) return 14;
  if (clean.includes('maize') || clean.includes('makka')) return 20;
  if (clean.includes('potato') || clean.includes('aloo')) return 80;
  if (clean.includes('tomato') || clean.includes('tamatar')) return 70;
  if (clean.includes('soya')) return 14;
  if (clean.includes('cotton')) return 10;
  if (clean.includes('onion') || clean.includes('pyaj')) return 60;
  if (clean.includes('pea') || clean.includes('matar')) return 25;
  if (clean.includes('cauliflower') || clean.includes('gobhi')) return 50;
  if (clean.includes('groundnut') || clean.includes('mungfali')) return 15;
  if (clean.includes('banana') || clean.includes('kela')) return 90;
  if (clean.includes('apple') || clean.includes('seb')) return 50;
  if (clean.includes('mango') || clean.includes('aam')) return 45;
  if (clean.includes('orange') || clean.includes('santra')) return 40;
  if (clean.includes('leafy') || clean.includes('vegetable')) return 35;
  return 18;
};
