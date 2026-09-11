/**
 * 🥕 Mandi Live Price & Leaflet Geospatial Discovery Engine
 * Real-time Daily Mandi Prices for Fruits, Vegetables & Grains via data.gov.in (Dataset 9ef84268-d588-465a-a308-a864a43d0070)
 */

const mandiPriceState = {
  selectedCategory: 'all', // 'all' | 'vegetable' | 'fruit' | 'grain'
  selectedCommodity: 'all', // 'all' displays all crops initially
  searchQuery: '',
  userLocation: {
    lat: 23.2599,
    lng: 77.4126,
    name: 'Bhopal Central (Default)',
    state: 'Madhya Pradesh'
  },
  radiusKm: 300,
  commodities: [],
  mandis: [],
  mapInstance: null,
  markersLayer: null,
  userMarker: null,
  radiusCircle: null,
  isLoading: false
};

/**
 * Main View Loader for #mandi-prices route
 */
const loadMandiPricesPage = async () => {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  // Seamlessly sync with globally detected user location
  if (window.KPMS_USER_LOCATION) {
    const cur = window.KPMS_USER_LOCATION;
    mandiPriceState.userLocation = {
      lat: cur.lat || 23.2599,
      lng: cur.lng || cur.lon || 77.4126,
      name: cur.city || cur.formattedName || 'Bhopal Central',
      state: cur.state || 'Madhya Pradesh'
    };
  }

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
          <div class="sidebar-heading">${getT('nav_portal')}</div>
          <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> ${getT('nav_dashboard')}</a>
          <a class="nav-link active" onclick="loadMandiPricesPage()"><i class="fas fa-carrot" style="color:var(--saffron);"></i> ${getT('nav_mandi_prices')}</a>
          <a class="nav-link" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> ${getT('btn_smart_mandi_finder')}</a>
          <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> ${getT('btn_book_slot')}</a>
          <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> ${getT('queue_tracker_title')}</a>
          <div style="margin-top:auto; padding-top:16px;">
            <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> ${getT('nav_logout')}</a>
          </div>
        </aside>
      ` : `
        <aside class="sidebar">
          <div class="sidebar-heading">Market Intelligence</div>
          <a class="nav-link" onclick="routeTo('#landing')"><i class="fas fa-arrow-left"></i> Home</a>
          <a class="nav-link active" onclick="loadMandiPricesPage()"><i class="fas fa-carrot" style="color:var(--saffron);"></i> ${getT('nav_mandi_prices')}</a>
          <a class="nav-link" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> ${getT('btn_smart_mandi_finder')}</a>
          <a class="nav-link" onclick="routeTo('#tv-display')"><i class="fas fa-tv"></i> ${getT('nav_display_board')}</a>
          <a class="nav-link" onclick="routeTo('#ai-insights')"><i class="fas fa-chart-line"></i> Market Insights</a>
        </aside>
      `}

      <!-- Main Content Area -->
      <main class="main-content" style="max-width:1250px; margin:0 auto; padding-bottom:60px;">
        
        <!-- Header Banner -->
        <div class="glass-panel" style="padding:24px 28px; margin-bottom:24px; background:linear-gradient(135deg, rgba(26,122,68,0.06), rgba(224,109,20,0.08)); border-left:6px solid var(--green-gov);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="hero-pill" style="margin:0; background:rgba(26,122,68,0.15); color:var(--green-gov);">
                  <i class="fas fa-satellite-dish"></i> Agmarknet & Data.gov.in Live Feed
                </span>
                <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-bolt"></i> Real-time Rates</span>
              </div>
              <h1 style="font-size:2rem; font-weight:800; color:var(--primary-navy); margin:0;">
                ${getT('mandi_prices_title', 'Real-time Mandi Prices & Geospatial Yard Intelligence')}
              </h1>
              <p style="color:var(--text-muted); font-size:0.92rem; margin-top:4px; max-width:750px;">
                ${getT('mandi_prices_subtitle', 'Live daily arrivals, modal wholesale rates, and proximity analytics for all crops across India, powered by official Agmarknet data.')}
              </p>
            </div>

            <!-- Location Detector & Preset Selector -->
            <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
              <button class="btn btn-primary btn-sm" onclick="detectUserGPSLocation()" style="box-shadow:0 4px 12px rgba(224,109,20,0.25);">
                <i class="fas fa-location-crosshairs"></i> 📡 Detect My GPS Location
              </button>
              <div style="display:flex; align-items:center; gap:6px; font-size:0.82rem;">
                <span style="color:var(--text-muted); font-weight:600;">Location:</span>
                <select id="mandi-location-picker" onchange="onPresetLocationChange(this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); font-size:0.82rem; font-weight:600;">
                  <option value="${mandiPriceState.userLocation.lat},${mandiPriceState.userLocation.lng},${mandiPriceState.userLocation.name},${mandiPriceState.userLocation.state}" selected data-detected="true">
                    📍 ${mandiPriceState.userLocation.name} (${mandiPriceState.userLocation.state}) [Current]
                  </option>
                  <option value="23.2599,77.4126,Bhopal Central,Madhya Pradesh">Bhopal (MP)</option>
                  <option value="23.2032,77.0844,Sehore,Madhya Pradesh">Sehore (MP)</option>
                  <option value="23.5251,77.8081,Vidisha,Madhya Pradesh">Vidisha (MP)</option>
                  <option value="22.7196,75.8577,Indore,Madhya Pradesh">Indore (MP)</option>
                  <option value="23.1765,75.7885,Ujjain,Madhya Pradesh">Ujjain (MP)</option>
                  <option value="22.7519,77.7289,Hoshangabad,Madhya Pradesh">Hoshangabad (MP)</option>
                  <option value="28.7041,77.1734,Delhi NCR,Delhi">Delhi (Azadpur)</option>
                  <option value="29.6857,76.9905,Karnal,Haryana">Karnal (Haryana)</option>
                  <option value="19.9975,73.7898,Nashik,Maharashtra">Nashik (MH)</option>
                  <option value="19.0760,72.9984,Navi Mumbai,Maharashtra">Vashi (Mumbai)</option>
                  <option value="16.3067,80.4365,Guntur,Andhra Pradesh">Guntur (AP)</option>
                  <option value="20.5937,78.9629,All India,All India">All India</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Controls: Categories, Search, Radius -->
        <div class="glass-panel" style="padding:18px 24px; margin-bottom:24px; border-radius:14px;">
          
          <!-- Category Tabs -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap;" id="category-tabs-group">
              <button class="btn btn-sm category-tab-btn ${mandiPriceState.selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}" data-cat="all" onclick="setMandiCategory('all')">
                <i class="fas fa-layer-group"></i> ${getT('filter_all')}
              </button>
              <button class="btn btn-sm category-tab-btn ${mandiPriceState.selectedCategory === 'vegetable' ? 'btn-primary' : 'btn-outline'}" data-cat="vegetable" onclick="setMandiCategory('vegetable')">
                <i class="fas fa-carrot"></i> ${getT('filter_vegetables')}
              </button>
              <button class="btn btn-sm category-tab-btn ${mandiPriceState.selectedCategory === 'fruit' ? 'btn-primary' : 'btn-outline'}" data-cat="fruit" onclick="setMandiCategory('fruit')">
                <i class="fas fa-apple-whole"></i> ${getT('filter_fruits')}
              </button>
              <button class="btn btn-sm category-tab-btn ${mandiPriceState.selectedCategory === 'grain' ? 'btn-primary' : 'btn-outline'}" data-cat="grain" onclick="setMandiCategory('grain')">
                <i class="fas fa-wheat-awn"></i> ${getT('filter_grains')}
              </button>
            </div>

            <!-- Search & Radius Filter -->
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <div style="position:relative; min-width:200px;">
                <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.85rem;"></i>
                <input 
                  type="text" 
                  id="commodity-search-input" 
                  class="form-control" 
                  style="padding-left:34px; font-size:0.85rem; height:36px;" 
                  placeholder="Search item (e.g. Tomato, Onion)..." 
                  oninput="onCommoditySearch(this.value)" 
                />
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-arrows-to-circle"></i> Radius:</span>
                <select id="mandi-radius-select" onchange="onRadiusFilterChange(this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); font-size:0.82rem;">
                  <option value="50">50 km</option>
                  <option value="150">150 km</option>
                  <option value="300" selected>300 km</option>
                  <option value="600">600 km</option>
                  <option value="2000">All India</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Commodity Pills Horizontal Carousel -->
          <div id="commodity-pills-container" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; scrollbar-width:thin;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- 2-Column Responsive Layout: Leaflet Geospatial Map & Live Mandi Cards -->
        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:24px; align-items:start;" id="mandi-content-grid">
          
          <!-- LEFT COLUMN: LEAFLET MAP -->
          <div class="glass-panel" style="padding:20px; border-radius:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:10px; height:10px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981;"></div>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  Interactive Mandi Geospatial Map
                </h3>
              </div>
              <span id="map-mandis-count-badge" class="status-pill completed" style="font-size:0.75rem;">
                Plotting Mandis...
              </span>
            </div>

            <!-- Leaflet Map Container -->
            <div id="mandi-price-map" style="width:100%; height:520px; border-radius:12px; border:1px solid var(--border-color); z-index:1; position:relative;">
              <div class="skeleton" style="width:100%; height:100%; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">
                <i class="fas fa-map-location-dot fa-spin" style="font-size:2rem; margin-right:10px;"></i> Initializing Leaflet Satellite Map...
              </div>
            </div>

            <!-- Map Legend -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-size:0.78rem; color:var(--text-muted); flex-wrap:wrap; gap:8px;">
              <div style="display:flex; gap:14px;">
                <span><i class="fas fa-location-dot" style="color:#2563EB;"></i> Your Location</span>
                <span><i class="fas fa-store" style="color:#10B981;"></i> High Price Mandi</span>
                <span><i class="fas fa-store" style="color:#E06D14;"></i> Standard APMC Mandi</span>
              </div>
              <span>Dataset: <code>9ef84268-d588...</code> (data.gov.in)</span>
            </div>
          </div>

          <!-- RIGHT COLUMN: LIVE MANDI PRICE LIST & HIGHLIGHTS -->
          <div>
            <!-- Selected Commodity Spotlight Card -->
            <div id="commodity-spotlight-card" style="margin-bottom:18px;">
              <!-- Loaded dynamically -->
            </div>

            <!-- Mandi Comparison List -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:1.1rem; font-weight:800; color:var(--primary-navy); margin:0;">
                Nearby Mandi Comparison (<span id="mandi-list-count">0</span> Mandis)
              </h3>
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">
                <i class="fas fa-arrow-down-short-wide"></i> Sorted by distance
              </span>
            </div>

            <div id="mandi-cards-list-container" style="display:flex; flex-direction:column; gap:14px; max-height:580px; overflow-y:auto; padding-right:4px;">
              <!-- Mandi Cards rendered dynamically -->
            </div>
          </div>

        </div>

      </main>
    </div>
  `;

  await initCommoditiesAndFetchPrices();
};

/**
 * Fetch Commodities Catalog and Initial Price Load
 */
const initCommoditiesAndFetchPrices = async () => {
  try {
    const res = await fetch('/api/mandi-prices/commodities');
    const data = await res.json();
    if (data.success && data.data) {
      mandiPriceState.commodities = data.data;
    }
  } catch (err) {
    console.warn('Failed to load commodities catalog, using fallback');
  }

  renderCommodityPills();
  await fetchMandiPricesForCommodity();
};

/**
 * Render Commodity Filter Pills
 * The first pill is ALWAYS 'All Crops (सभी फसलें)', followed by individual commodities
 */
const renderCommodityPills = () => {
  const container = document.getElementById('commodity-pills-container');
  if (!container) return;

  const { commodities, selectedCategory, selectedCommodity, searchQuery } = mandiPriceState;

  // Check if All Crops is currently active
  const isAllSelected = selectedCommodity.toLowerCase() === 'all' || selectedCommodity.toLowerCase() === 'all crops';

  // Filter catalog commodities by selected category and search
  const filtered = commodities.filter(c => {
    if (c.name === 'all') return false; // Handled separately as the primary master pill
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.hindi && c.hindi.includes(searchQuery))) return false;
    return true;
  });

  let pillsHtml = `
    <button 
      class="btn btn-sm"
      style="white-space:nowrap; border-radius:20px; font-size:0.84rem; font-weight:800; display:flex; align-items:center; gap:8px; padding:7px 18px; transition:all 0.2s ease; ${isAllSelected ? 'background:linear-gradient(135deg, #16A34A, #15803D); color:#FFF; border-color:#16A34A; box-shadow:0 4px 14px rgba(22,163,74,0.45); transform:scale(1.05);' : 'background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);'}"
      onclick="selectMandiCommodity('all')"
    >
      <i class="fas fa-layer-group"></i>
      <span>All Crops (सभी फसलें)</span>
      <span style="font-size:0.72rem; opacity:0.95; background:rgba(0,0,0,0.2); padding:1px 8px; border-radius:10px;">Live Feed</span>
    </button>
  `;

  if (filtered.length === 0 && searchQuery) {
    pillsHtml += `<span style="font-size:0.85rem; color:var(--text-muted); padding:6px 12px; display:inline-flex; align-items:center;">No crops matching "${searchQuery}". Showing all crops.</span>`;
  } else {
    pillsHtml += filtered.map(c => {
      const isSelected = !isAllSelected && c.name.toLowerCase() === selectedCommodity.toLowerCase();
      return `
        <button 
          class="btn btn-sm"
          style="white-space:nowrap; border-radius:20px; font-size:0.82rem; font-weight:700; display:flex; align-items:center; gap:6px; padding:6px 14px; transition:all 0.2s ease; ${isSelected ? `background:${c.color}; color:#FFF; border-color:${c.color}; box-shadow:0 4px 12px ${c.color}40; transform:scale(1.05);` : 'background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);'}"
          onclick="selectMandiCommodity('${c.name}')"
        >
          <i class="fas ${c.icon}"></i>
          <span>${c.name} (${c.hindi})</span>
          ${c.kgPrice ? `<span style="font-size:0.72rem; opacity:0.85; background:rgba(0,0,0,0.15); padding:1px 6px; border-radius:10px;">₹${c.kgPrice}/kg</span>` : ''}
        </button>
      `;
    }).join('');
  }

  container.innerHTML = pillsHtml;
};

/**
 * Handle Category Switch
 * When switching category (Vegetables, Fruits, Grains, All), keeps 'all' crops in that category
 */
const setMandiCategory = (cat) => {
  mandiPriceState.selectedCategory = cat;
  
  // Update button active states in UI
  document.querySelectorAll('.category-tab-btn').forEach(btn => {
    const btnCat = btn.getAttribute('data-cat');
    if (btnCat === cat) {
      btn.className = 'btn btn-sm btn-primary category-tab-btn';
    } else {
      btn.className = 'btn btn-sm btn-outline category-tab-btn';
    }
  });

  // If a specific crop was selected, check if it fits the new category; otherwise revert to all crops
  if (mandiPriceState.selectedCommodity !== 'all') {
    const matching = mandiPriceState.commodities.find(c => c.name.toLowerCase() === mandiPriceState.selectedCommodity.toLowerCase());
    if (matching && cat !== 'all' && matching.category !== cat) {
      mandiPriceState.selectedCommodity = 'all';
    }
  }

  renderCommodityPills();
  fetchMandiPricesForCommodity();
};

const onCommoditySearch = (val) => {
  mandiPriceState.searchQuery = val;
  renderCommodityPills();
};

const selectMandiCommodity = (commodityName) => {
  mandiPriceState.selectedCommodity = commodityName;
  renderCommodityPills();
  fetchMandiPricesForCommodity();
};

const onRadiusFilterChange = (radius) => {
  mandiPriceState.radiusKm = Number(radius);
  fetchMandiPricesForCommodity();
};

const onPresetLocationChange = (val) => {
  const parts = val.split(',');
  const lat = parts[0];
  const lng = parts[1];
  const name = parts[2];
  const state = parts[3] || 'Madhya Pradesh';

  mandiPriceState.userLocation = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name: name,
    state: state
  };
  showToast(`Location set to ${name}. Loading real mandi rates...`, 'info');
  fetchMandiPricesForCommodity();
};

/**
 * Detect User GPS Coordinates
 */
const detectUserGPSLocation = () => {
  if (window.KPMS_Location) {
    window.KPMS_Location.detectGPS();
  } else if (navigator.geolocation) {
    showToast('Acquiring GPS location...', 'info');
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      mandiPriceState.userLocation = {
        lat,
        lng,
        name: `Current GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
        state: 'All India'
      };
      showToast('GPS Location acquired successfully!', 'success');
      fetchMandiPricesForCommodity();
    }, () => {
      showToast('GPS access unavailable.', 'error');
    });
  }
};

// Listen for global location updates and adapt Mandi Price engine immediately
window.addEventListener('kpms:location-changed', (e) => {
  const loc = e.detail;
  if (!loc) return;

  mandiPriceState.userLocation = {
    lat: loc.lat,
    lng: loc.lng || loc.lon,
    name: loc.city || loc.formattedName || 'Detected Location',
    state: loc.state || 'Madhya Pradesh'
  };

  const picker = document.getElementById('mandi-location-picker');
  if (picker) {
    let opt = picker.querySelector('option[data-detected="true"]');
    if (!opt) {
      opt = document.createElement('option');
      opt.setAttribute('data-detected', 'true');
      picker.insertBefore(opt, picker.firstChild);
    }
    opt.value = `${loc.lat},${loc.lng || loc.lon},${loc.city || loc.formattedName},${loc.state || ''}`;
    opt.textContent = `📍 ${loc.city || 'Your Area'}, ${loc.state || ''} (${loc.isLiveGPS ? 'GPS Verified' : 'Selected'})`;
    picker.value = opt.value;
  }

  // Only refetch if currently viewing Mandi prices page
  if (window.location.hash === '#mandi-prices') {
    fetchMandiPricesForCommodity();
  }
});

/**
 * Fetch Mandi Prices for Selected Commodity and Render Leaflet Map + Cards
 */
const fetchMandiPricesForCommodity = async () => {
  const { selectedCommodity, selectedCategory, userLocation, radiusKm } = mandiPriceState;

  const container = document.getElementById('mandi-cards-list-container');
  if (container) {
    container.innerHTML = `
      <div class="skeleton" style="height:120px; border-radius:12px; margin-bottom:10px;"></div>
      <div class="skeleton" style="height:120px; border-radius:12px; margin-bottom:10px;"></div>
      <div class="skeleton" style="height:120px; border-radius:12px;"></div>
    `;
  }

  try {
    const url = `/api/mandi-prices?commodity=${encodeURIComponent(selectedCommodity)}&category=${selectedCategory}&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radiusKm}&state=${encodeURIComponent(userLocation.state || '')}`;
    const res = await fetch(url);
    const result = await res.json();

    if (result.success && result.data) {
      mandiPriceState.mandis = result.data;
      renderCommoditySpotlight(result.cropMetadata, result.datasetInfo);
      renderMandiCardsList(result.data);
      renderLeafletMandiMap(result.data, userLocation, radiusKm, result.cropMetadata);
    } else {
      showToast(result.message || 'Failed to load mandi prices', 'error');
    }
  } catch (err) {
    console.error('Error in fetchMandiPricesForCommodity:', err);
    showToast('Failed to connect to Mandi price service', 'error');
  }
};

const getPerishabilityBadge = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('tomato') || lower.includes('leafy') || lower.includes('vegetable')) {
    return '<span style="color:#DC2626; font-weight:800; font-size:0.75rem; background:#FEE2E2; padding:2px 8px; border-radius:10px;">🔴 HIGH PERISHABILITY</span>';
  } else if (lower.includes('potato') || lower.includes('paddy') || lower.includes('rice') || lower.includes('soya')) {
    return '<span style="color:#D97706; font-weight:800; font-size:0.75rem; background:#FEF3C7; padding:2px 8px; border-radius:10px;">🟠 MEDIUM PERISHABILITY</span>';
  }
  return '<span style="color:#047857; font-weight:800; font-size:0.75rem; background:#DCFCE7; padding:2px 8px; border-radius:10px;">🟢 LOW PERISHABILITY</span>';
};

/**
 * Render Spotlight Summary Box for Active Commodity or All Crops
 */
const renderCommoditySpotlight = (cropMeta, datasetInfo) => {
  const container = document.getElementById('commodity-spotlight-card');
  if (!container || !cropMeta) return;

  const mandis = mandiPriceState.mandis;
  const isAll = mandiPriceState.selectedCommodity.toLowerCase() === 'all' || cropMeta.isAll;
  const bestMandi = mandis.length > 0 ? [...mandis].sort((a, b) => b.modalPrice - a.modalPrice)[0] : null;
  const nearestMandi = mandis.length > 0 ? mandis[0] : null;

  if (isAll) {
    // EXECUTIVE ALL-CROPS OVERVIEW
    const distinctCropsCount = cropMeta.distinctCropsCount || [...new Set(mandis.map(m => m.commodity))].length;

    container.innerHTML = `
      <div class="glass-card" style="padding:20px 24px; border-radius:14px; border:2px solid #16A34A; background:linear-gradient(135deg, var(--bg-card) 0%, rgba(22,163,74,0.08) 100%);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #16A34A, #15803D); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:1.3rem; box-shadow:0 4px 12px rgba(22,163,74,0.3);">
              <i class="fas fa-layer-group"></i>
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h4 style="font-size:1.2rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  All Crops Live Agmarknet Feed (सभी फसलें)
                </h4>
                <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-bolt"></i> Real-Time</span>
              </div>
              <span style="font-size:0.78rem; color:var(--text-muted);">
                Source: <strong>${datasetInfo.apiSource}</strong> • Resource: <code>${datasetInfo.datasetId.substring(0, 13)}...</code>
              </span>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.4rem; font-weight:900; color:var(--green-gov);">
              ${mandis.length} Mandi Quotes
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">
              ${distinctCropsCount} Distinct Crops Active Today
            </div>
          </div>
        </div>

        <!-- Highlights Grid for All Crops -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.82rem; margin-bottom:12px;">
          ${bestMandi ? `
            <div style="background:rgba(255,255,255,0.7); padding:10px 14px; border-radius:10px; border-left:4px solid var(--green-gov); box-shadow:0 2px 6px rgba(0,0,0,0.03);">
              <div style="color:var(--text-muted); font-size:0.72rem; font-weight:700; text-transform:uppercase;">🏆 Highest Rate Crop Today:</div>
              <strong style="color:var(--primary-navy); font-size:0.95rem;">${bestMandi.commodity} (${bestMandi.market})</strong>
              <div style="color:var(--green-gov); font-weight:800; margin-top:2px;">₹${bestMandi.modalPrice.toLocaleString('en-IN')}/Q (₹${bestMandi.kgPrice}/kg) • ${bestMandi.distanceKm} km</div>
            </div>
          ` : ''}

          ${nearestMandi ? `
            <div style="background:rgba(255,255,255,0.7); padding:10px 14px; border-radius:10px; border-left:4px solid var(--saffron); box-shadow:0 2px 6px rgba(0,0,0,0.03);">
              <div style="color:var(--text-muted); font-size:0.72rem; font-weight:700; text-transform:uppercase;">📍 Nearest Mandi Quote:</div>
              <strong style="color:var(--primary-navy); font-size:0.95rem;">${nearestMandi.market} (${nearestMandi.commodity})</strong>
              <div style="color:var(--saffron); font-weight:800; margin-top:2px;">₹${nearestMandi.modalPrice.toLocaleString('en-IN')}/Q • ${nearestMandi.distanceKm} km away</div>
            </div>
          ` : ''}
        </div>

        <div style="background:rgba(26,122,68,0.08); border-radius:8px; padding:8px 12px; font-size:0.78rem; color:#166534; display:flex; align-items:center; gap:8px;">
          <i class="fas fa-info-circle"></i>
          <span>Showing rates for <strong>all crops</strong>. Click any commodity pill above (like Tomato, Wheat, Potato) to filter for a single crop.</span>
        </div>
      </div>
    `;
    return;
  }

  // SINGLE CROP SPOTLIGHT
  container.innerHTML = `
    <div class="glass-card" style="padding:18px 22px; border-radius:14px; border:2px solid ${cropMeta.color}; background:linear-gradient(135deg, var(--bg-card) 0%, ${cropMeta.color}10 100%);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:42px; height:42px; border-radius:50%; background:${cropMeta.color}; color:#FFF; display:flex; align-items:center; justify-content:center; font-size:1.25rem;">
            <i class="fas ${cropMeta.icon}"></i>
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h4 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">
                ${cropMeta.name} (${cropMeta.hindi})
              </h4>
              ${getPerishabilityBadge(cropMeta.name)}
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">
              Category: <strong>${(cropMeta.category || 'vegetable').toUpperCase()}</strong> • Source: ${datasetInfo.apiSource}
            </span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.35rem; font-weight:900; color:var(--primary-navy);">
            ₹${cropMeta.defaultModal} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">/ Quintal</span>
          </div>
          <div style="font-size:0.82rem; font-weight:800; color:var(--green-gov);">
            ~ ₹${cropMeta.kgPrice} / Kg Benchmark
          </div>
        </div>
      </div>

      <!-- Quick Highlights Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.82rem; margin-bottom:10px;">
        ${bestMandi ? `
          <div style="background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:8px; border-left:3px solid var(--green-gov);">
            <div style="color:var(--text-muted); font-size:0.72rem; font-weight:700; text-transform:uppercase;">⭐ Best Selling Price:</div>
            <strong style="color:var(--primary-navy);">${bestMandi.market}</strong>
            <div style="color:var(--green-gov); font-weight:800;">₹${bestMandi.modalPrice.toLocaleString('en-IN')}/Q (₹${bestMandi.kgPrice}/kg) • ${bestMandi.distanceKm} km</div>
          </div>
        ` : ''}

        ${nearestMandi ? `
          <div style="background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:8px; border-left:3px solid var(--saffron);">
            <div style="color:var(--text-muted); font-size:0.72rem; font-weight:700; text-transform:uppercase;">📍 Nearest Mandi:</div>
            <strong style="color:var(--primary-navy);">${nearestMandi.market}</strong>
            <div style="color:var(--saffron); font-weight:800;">₹${nearestMandi.modalPrice.toLocaleString('en-IN')}/Q • ${nearestMandi.distanceKm} km away</div>
          </div>
        ` : ''}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.78rem; color:var(--text-muted);">Filter Active: <strong>${cropMeta.name}</strong></span>
        <button class="btn btn-sm btn-outline" onclick="selectMandiCommodity('all')" style="font-size:0.76rem; padding:3px 12px; border-radius:14px;">
          <i class="fas fa-arrow-rotate-left"></i> Clear Filter (Show All Crops)
        </button>
      </div>
    </div>
  `;
};

/**
 * Render List of Mandi Price Cards with Crop Names, Live Rates, and Proximity
 */
const renderMandiCardsList = (mandis) => {
  const container = document.getElementById('mandi-cards-list-container');
  const countTag = document.getElementById('mandi-list-count');
  if (!container) return;

  if (countTag) countTag.textContent = mandis.length;

  if (mandis.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="padding:32px; text-align:center;">
        <i class="fas fa-store-slash" style="font-size:2rem; color:var(--text-muted); margin-bottom:10px;"></i>
        <h4 style="color:var(--primary-navy); margin-bottom:6px;">No Mandis found within ${mandiPriceState.radiusKm} km</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">Try increasing the radius to 600 km or All India.</p>
        <button class="btn btn-outline btn-sm" onclick="onRadiusFilterChange(600)">Expand Radius to 600 km</button>
      </div>
    `;
    return;
  }

  // Find max modal price for comparison badge
  const maxPrice = Math.max(...mandis.map(m => m.modalPrice));

  container.innerHTML = mandis.map((m, idx) => {
    const isHighestRate = m.modalPrice === maxPrice && mandis.length > 1;
    const isNearest = idx === 0;

    return `
      <div class="glass-card mandi-price-item" style="padding:16px 18px; border-radius:12px; border:${isHighestRate ? '2px solid var(--green-gov)' : (isNearest ? '1.5px solid var(--saffron)' : '1px solid var(--border-color)')}; transition:all 0.2s ease;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <!-- Crop Tag + Market Name -->
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <span style="background:${m.color || '#16A34A'}18; color:${m.color || '#16A34A'}; border:1px solid ${m.color || '#16A34A'}40; padding:2px 10px; border-radius:12px; font-size:0.78rem; font-weight:800; display:inline-flex; align-items:center; gap:5px;">
                <i class="fas ${m.icon || 'fa-seedling'}"></i> ${m.commodity} ${m.hindiName && m.hindiName !== m.commodity ? `(${m.hindiName})` : ''}
              </span>
              <strong style="color:var(--primary-navy); font-size:1.02rem;">${m.market}</strong>
              ${isHighestRate ? `<span class="status-pill completed" style="font-size:0.7rem; padding:2px 8px;"><i class="fas fa-crown"></i> Top Rate</span>` : ''}
              ${isNearest ? `<span class="status-pill waiting" style="font-size:0.7rem; padding:2px 8px;"><i class="fas fa-route"></i> Nearest</span>` : ''}
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
              <i class="fas fa-location-dot" style="color:var(--saffron);"></i> ${m.district}, ${m.state} • <strong>${m.distanceKm} km away</strong>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.25rem; font-weight:900; color:var(--primary-navy);">
              ₹${m.modalPrice.toLocaleString('en-IN')} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">/Q</span>
            </div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--green-gov);">
              ₹${m.kgPrice} / kg
            </div>
          </div>
        </div>

        <!-- Range, Grade & Arrival Stats -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:8px 12px; border-radius:8px; font-size:0.78rem; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
          <div>
            <span style="color:var(--text-muted);">Grade: </span>
            <strong>${m.grade || 'FAQ'} (${m.variety || 'Standard'})</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Range: </span>
            <strong>₹${m.minPrice} - ₹${m.maxPrice}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Arrival Date: </span>
            <strong style="color:var(--primary-navy);"><i class="fas fa-calendar-day" style="color:var(--saffron);"></i> ${m.arrivalDate}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Trend: </span>
            <strong style="color:${m.trend === 'up' ? 'var(--green-gov)' : (m.trend === 'down' ? '#EF4444' : 'var(--primary-navy)')};">
              ${m.trend === 'up' ? '▲ High Demand' : (m.trend === 'down' ? '▼ Steady' : '▬ Stable')}
            </strong>
          </div>
        </div>

        <!-- Action Row -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px;">
          <div style="font-size:0.72rem; color:var(--green-gov); font-weight:700; display:flex; align-items:center; gap:4px;">
            <i class="fas fa-circle-check"></i> ${m.source}
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="focusMandiOnMap(${m.latitude}, ${m.longitude}, '${m.market}')" style="font-size:0.78rem; padding:4px 10px;">
              <i class="fas fa-crosshairs"></i> View on Map
            </button>
            <button class="btn btn-primary btn-sm" onclick="routeToSmartBookingForCrop('${m.commodity}')" style="font-size:0.78rem; padding:4px 12px;">
              <i class="fas fa-wand-magic-sparkles"></i> Smart Book
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

/**
 * Render Interactive Leaflet Map with Markers & Radius Circle
 */
const renderLeafletMandiMap = (mandis, userLoc, radiusKm, cropMeta) => {
  const mapElement = document.getElementById('mandi-price-map');
  const countBadge = document.getElementById('map-mandis-count-badge');
  if (!mapElement || typeof L === 'undefined') return;

  if (countBadge) countBadge.innerHTML = `<i class="fas fa-map-pin"></i> ${mandis.length} Mandis Active`;

  // Destroy previous map instance if exists
  if (mandiPriceState.mapInstance) {
    mandiPriceState.mapInstance.remove();
    mandiPriceState.mapInstance = null;
  }

  const map = L.map('mandi-price-map', {
    center: [userLoc.lat, userLoc.lng],
    zoom: 8,
    scrollWheelZoom: true
  });
  mandiPriceState.mapInstance = map;

  // Reliable CartoDB Voyager Tile Layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO | Agmarknet India',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  setTimeout(() => {
    if (mandiPriceState.mapInstance) mandiPriceState.mapInstance.invalidateSize();
  }, 300);

  // User Location Marker (Custom Blue Icon)
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="background:#2563EB; color:#FFF; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid #FFF; box-shadow:0 0 14px rgba(37,99,235,0.6); font-size:1rem;">
        <i class="fas fa-location-dot"></i>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const userMarker = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map);
  userMarker.bindPopup(`
    <div style="font-family:'Plus Jakarta Sans',sans-serif; text-align:center; padding:4px;">
      <strong style="color:#2563EB; font-size:0.95rem;"><i class="fas fa-house-chimney"></i> ${userLoc.name}</strong>
      <p style="margin:4px 0 0; font-size:0.8rem; color:#64748B;">Farmer Reference Location</p>
    </div>
  `);

  // Radius Circle (in meters)
  const circle = L.circle([userLoc.lat, userLoc.lng], {
    color: '#E06D14',
    fillColor: '#E06D14',
    fillOpacity: 0.08,
    radius: radiusKm * 1000
  }).addTo(map);

  // Plot Mandi Markers
  const bounds = L.latLngBounds([[userLoc.lat, userLoc.lng]]);

  mandis.forEach(m => {
    bounds.extend([m.latitude, m.longitude]);

    const mandiIcon = L.divIcon({
      className: 'custom-mandi-marker',
      html: `
        <div style="background:var(--primary-navy,#0E2A47); color:#FFF; padding:4px 10px; border-radius:14px; border:2px solid #FFF; font-weight:800; font-size:0.75rem; display:flex; align-items:center; gap:5px; box-shadow:0 4px 10px rgba(0,0,0,0.3); white-space:nowrap;">
          <span style="color:#FCD34D; font-size:0.72rem;"><i class="fas ${m.icon || 'fa-seedling'}"></i> ${m.commodity}:</span>
          <span style="color:#10B981;">₹${m.modalPrice}</span>
        </div>
      `,
      iconSize: [120, 28],
      iconAnchor: [60, 14]
    });

    const marker = L.marker([m.latitude, m.longitude], { icon: mandiIcon }).addTo(map);

    marker.bindPopup(`
      <div style="font-family:'Plus Jakarta Sans',sans-serif; min-width:210px; padding:2px;">
        <div style="font-weight:800; font-size:1rem; color:#0E2A47; margin-bottom:2px;">${m.market}</div>
        <div style="font-size:0.78rem; color:#64748B; margin-bottom:8px;">${m.district}, ${m.state} • <strong>${m.distanceKm} km</strong> away</div>
        
        <div style="background:#F1F5F9; padding:8px; border-radius:6px; margin-bottom:8px; font-size:0.8rem;">
          <div style="display:flex; justify-content:space-between;">
            <span>${m.commodity} Modal Rate:</span>
            <strong style="color:#10B981; font-size:0.95rem;">₹${m.modalPrice}/Q</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:2px;">
            <span>Wholesale / Kg:</span>
            <strong>₹${m.kgPrice} / kg</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:0.74rem; color:#64748B;">
            <span>Min-Max:</span>
            <span>₹${m.minPrice} - ₹${m.maxPrice}</span>
          </div>
        </div>

        <button 
          onclick="routeToSmartBookingForCrop('${m.commodity}')" 
          style="background:#E06D14; color:#FFF; border:none; border-radius:6px; width:100%; padding:6px; font-weight:700; font-size:0.8rem; cursor:pointer;"
        >
          🌾 Smart Book at this Mandi
        </button>
      </div>
    `);
  });

  map.fitBounds(bounds, { padding: [40, 40] });
};

/**
 * Focus Map on a specific Mandi
 */
const focusMandiOnMap = (lat, lng, marketName) => {
  if (!mandiPriceState.mapInstance) return;
  mandiPriceState.mapInstance.flyTo([lat, lng], 12, { duration: 1.2 });
  showToast(`Focused on ${marketName}`, 'info');
};

/**
 * Route directly into Smart Booking engine with commodity selected
 */
const routeToSmartBookingForCrop = (commodityName) => {
  if (window.smartBookingState) {
    window.smartBookingState.selectedCrop = commodityName;
  }
  routeTo('#smart-booking');
};

// Global browser exports
if (typeof window !== 'undefined') {
  window.loadMandiPricesPage = loadMandiPricesPage;
  window.setMandiCategory = setMandiCategory;
  window.onCommoditySearch = onCommoditySearch;
  window.selectMandiCommodity = selectMandiCommodity;
  window.onRadiusFilterChange = onRadiusFilterChange;
  window.onPresetLocationChange = onPresetLocationChange;
  window.detectUserGPSLocation = detectUserGPSLocation;
  window.focusMandiOnMap = focusMandiOnMap;
  window.routeToSmartBookingForCrop = routeToSmartBookingForCrop;
}
