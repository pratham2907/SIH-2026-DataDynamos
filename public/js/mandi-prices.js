/**
 * 🥕 Mandi Live Price & Leaflet Geospatial Discovery Engine
 * Real-time Daily Mandi Prices for Fruits, Vegetables & Grains via data.gov.in (Dataset 9ef84268-d588-465a-a308-a864a43d0070)
 */

const mandiPriceState = {
  selectedCategory: 'vegetable', // 'all' | 'vegetable' | 'fruit' | 'grain'
  selectedCommodity: 'Tomato',
  searchQuery: '',
  userLocation: {
    lat: 23.2599,
    lng: 77.4126,
    name: 'Bhopal Central (Default)'
  },
  radiusKm: 150,
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
          <a class="nav-link active" onclick="loadMandiPricesPage()"><i class="fas fa-carrot" style="color:var(--saffron);"></i> Mandi Live Prices</a>
          <a class="nav-link" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> Smart Mandi Finder</a>
          <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> Slot Booking</a>
          <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> Live Queue</a>
          <div style="margin-top:auto; padding-top:16px;">
            <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </aside>
      ` : `
        <aside class="sidebar">
          <div class="sidebar-heading">Market Intelligence</div>
          <a class="nav-link" onclick="routeTo('#landing')"><i class="fas fa-arrow-left"></i> Home</a>
          <a class="nav-link active" onclick="loadMandiPricesPage()"><i class="fas fa-carrot" style="color:var(--saffron);"></i> Mandi Live Prices</a>
          <a class="nav-link" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> Smart Mandi Finder</a>
          <a class="nav-link" onclick="routeTo('#tv-display')"><i class="fas fa-tv"></i> Mandi Display Board</a>
          <a class="nav-link" onclick="routeTo('#ai-insights')"><i class="fas fa-brain"></i> AI Insights</a>
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
                🥕 Nearby Mandi Live Market Prices & Geospatial Map
              </h1>
              <p style="color:var(--text-muted); font-size:0.92rem; margin-top:4px; max-width:750px;">
                Discover real-time prices for <strong>Vegetables, Fruits & Grains</strong> at nearby APMC mandis. Filter by distance, compare modal prices per quintal and per kilogram, and plan your harvest delivery.
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
                  <option value="23.2599,77.4126,Bhopal Central">Bhopal (MP)</option>
                  <option value="23.2032,77.0844,Sehore">Sehore (MP)</option>
                  <option value="23.5251,77.8081,Vidisha">Vidisha (MP)</option>
                  <option value="22.7196,75.8577,Indore">Indore (MP)</option>
                  <option value="23.1765,75.7885,Ujjain">Ujjain (MP)</option>
                  <option value="22.7519,77.7289,Hoshangabad">Hoshangabad (MP)</option>
                  <option value="28.7041,77.1734,Delhi NCR">Delhi (Azadpur)</option>
                  <option value="29.6857,76.9905,Karnal">Karnal (Haryana)</option>
                  <option value="19.9975,73.7898,Nashik">Nashik (MH)</option>
                  <option value="19.0760,72.9984,Navi Mumbai">Vashi (Mumbai)</option>
                  <option value="16.3067,80.4365,Guntur">Guntur (AP)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Controls: Categories, Search, Radius -->
        <div class="glass-panel" style="padding:18px 24px; margin-bottom:24px; border-radius:14px;">
          
          <!-- Category Tabs -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-sm ${mandiPriceState.selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="setMandiCategory('all')">
                <i class="fas fa-basket-shopping"></i> All Items
              </button>
              <button class="btn btn-sm ${mandiPriceState.selectedCategory === 'vegetable' ? 'btn-primary' : 'btn-outline'}" onclick="setMandiCategory('vegetable')">
                <i class="fas fa-carrot"></i> 🥕 Vegetables (सब्जियां)
              </button>
              <button class="btn btn-sm ${mandiPriceState.selectedCategory === 'fruit' ? 'btn-primary' : 'btn-outline'}" onclick="setMandiCategory('fruit')">
                <i class="fas fa-apple-whole"></i> 🍎 Fruits (फल)
              </button>
              <button class="btn btn-sm ${mandiPriceState.selectedCategory === 'grain' ? 'btn-primary' : 'btn-outline'}" onclick="setMandiCategory('grain')">
                <i class="fas fa-wheat-awn"></i> 🌾 Grains & Oilseeds
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
                  <option value="150" selected>150 km</option>
                  <option value="300">300 km</option>
                  <option value="600">All India (600 km)</option>
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
 */
const renderCommodityPills = () => {
  const container = document.getElementById('commodity-pills-container');
  if (!container) return;

  const { commodities, selectedCategory, selectedCommodity, searchQuery } = mandiPriceState;

  const filtered = commodities.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.hindi.includes(searchQuery)) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<span style="font-size:0.85rem; color:var(--text-muted); padding:6px 0;">No items found matching "${searchQuery}".</span>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isSelected = c.name.toLowerCase() === selectedCommodity.toLowerCase();
    return `
      <button 
        class="btn btn-sm"
        style="white-space:nowrap; border-radius:20px; font-size:0.82rem; font-weight:700; display:flex; align-items:center; gap:6px; padding:6px 14px; transition:all 0.2s ease; ${isSelected ? `background:${c.color}; color:#FFF; border-color:${c.color}; box-shadow:0 4px 12px ${c.color}40; transform:scale(1.04);` : 'background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);'}"
        onclick="selectMandiCommodity('${c.name}')"
      >
        <i class="fas ${c.icon}"></i>
        <span>${c.name} (${c.hindi})</span>
        <span style="font-size:0.72rem; opacity:0.85; background:rgba(0,0,0,0.15); padding:1px 6px; border-radius:10px;">₹${c.kgPrice}/kg</span>
      </button>
    `;
  }).join('');
};

/**
 * Handle Category Switch
 */
const setMandiCategory = (cat) => {
  mandiPriceState.selectedCategory = cat;
  
  // Pick first item in category if current isn't in it
  const matching = mandiPriceState.commodities.filter(c => cat === 'all' || c.category === cat);
  if (matching.length > 0 && !matching.some(c => c.name.toLowerCase() === mandiPriceState.selectedCommodity.toLowerCase())) {
    mandiPriceState.selectedCommodity = matching[0].name;
  }

  renderMandiPricesPageHeader();
  renderCommodityPills();
  fetchMandiPricesForCommodity();
};

const renderMandiPricesPageHeader = () => {
  // Re-render category button classes
  document.querySelectorAll('#mandi-price-stage button').forEach(b => {
    // refresh dynamic classes if needed
  });
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
  const [lat, lng, name] = val.split(',');
  mandiPriceState.userLocation = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name: name
  };
  showToast(`Location set to ${name}. Refreshing nearby mandis...`, 'info');
  fetchMandiPricesForCommodity();
};

/**
 * Detect User GPS Coordinates
 */
const detectUserGPSLocation = () => {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  showToast('Acquiring GPS location...', 'info');
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      mandiPriceState.userLocation = {
        lat: lat,
        lng: lng,
        name: `Current Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`
      };
      showToast('GPS Location acquired successfully!', 'success');
      fetchMandiPricesForCommodity();
    },
    (err) => {
      showToast('GPS access denied or unavailable. Using default location (Bhopal).', 'error');
    },
    { enableHighAccuracy: true, timeout: 6000 }
  );
};

/**
 * Fetch Mandi Prices for Selected Commodity and Render Leaflet Map + Cards
 */
const fetchMandiPricesForCommodity = async () => {
  const { selectedCommodity, selectedCategory, userLocation, radiusKm } = mandiPriceState;

  const container = document.getElementById('mandi-cards-list-container');
  if (container) {
    container.innerHTML = `<div class="skeleton" style="height:120px; border-radius:12px; margin-bottom:10px;"></div><div class="skeleton" style="height:120px; border-radius:12px;"></div>`;
  }

  try {
    const url = `/api/mandi-prices?commodity=${encodeURIComponent(selectedCommodity)}&category=${selectedCategory}&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radiusKm}`;
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

/**
 * Render Spotlight Summary Box for Active Commodity
 */
const renderCommoditySpotlight = (cropMeta, datasetInfo) => {
  const container = document.getElementById('commodity-spotlight-card');
  if (!container || !cropMeta) return;

  const mandis = mandiPriceState.mandis;
  const bestMandi = mandis.length > 0 ? [...mandis].sort((a, b) => b.modalPrice - a.modalPrice)[0] : null;
  const nearestMandi = mandis.length > 0 ? mandis[0] : null;

  container.innerHTML = `
    <div class="glass-card" style="padding:18px 22px; border-radius:14px; border:2px solid ${cropMeta.color}; background:linear-gradient(135deg, var(--bg-card) 0%, ${cropMeta.color}10 100%);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:40px; height:40px; border-radius:50%; background:${cropMeta.color}; color:#FFF; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
            <i class="fas ${cropMeta.icon}"></i>
          </div>
          <div>
            <h4 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">
              ${cropMeta.name} (${cropMeta.hindi})
            </h4>
            <span style="font-size:0.75rem; color:var(--text-muted);">
              Category: <strong>${cropMeta.category.toUpperCase()}</strong> • API: ${datasetInfo.apiSource}
            </span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.35rem; font-weight:900; color:var(--primary-navy);">
            ₹${cropMeta.defaultModal} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">/ Quintal</span>
          </div>
          <div style="font-size:0.82rem; font-weight:800; color:var(--green-gov);">
            ~ ₹${cropMeta.kgPrice} / Kg Wholesale Benchmark
          </div>
        </div>
      </div>

      <!-- Quick Highlights Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.82rem;">
        ${bestMandi ? `
          <div style="background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:8px; border-left:3px solid var(--green-gov);">
            <div style="color:var(--text-muted); font-size:0.72rem; font-weight:700; text-transform:uppercase;">⭐ Best Selling Price:</div>
            <strong style="color:var(--primary-navy);">${bestMandi.market}</strong>
            <div style="color:var(--green-gov); font-weight:800;">₹${bestMandi.modalPrice}/Q (₹${bestMandi.kgPrice}/kg) • ${bestMandi.distanceKm} km</div>
          </div>
        ` : ''}

        ${nearestMandi ? `
          <div style="background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:8px; border-left:3px solid var(--saffron);">
            <div style="color:var(--text-muted); font-size:0.72rem; font-weight:700; text-transform:uppercase;">📍 Nearest Mandi:</div>
            <strong style="color:var(--primary-navy);">${nearestMandi.market}</strong>
            <div style="color:var(--saffron); font-weight:800;">₹${nearestMandi.modalPrice}/Q • ${nearestMandi.distanceKm} km away</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Render List of Mandi Price Cards
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
        <p style="font-size:0.85rem; color:var(--text-muted);">Try increasing the radius to 300 km or All India.</p>
        <button class="btn btn-outline btn-sm" onclick="onRadiusFilterChange(300)">Expand Radius to 300 km</button>
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
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="color:var(--primary-navy); font-size:1.02rem;">${m.market}</strong>
              ${isHighestRate ? `<span class="status-pill completed" style="font-size:0.7rem; padding:2px 8px;"><i class="fas fa-crown"></i> Highest Rate</span>` : ''}
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

        <!-- Range & Arrival Stats -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:8px 12px; border-radius:8px; font-size:0.78rem; margin-bottom:12px;">
          <div>
            <span style="color:var(--text-muted);">Range: </span>
            <strong>₹${m.minPrice} - ₹${m.maxPrice}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Daily Arrival: </span>
            <strong>${m.arrivalQty} Quintals</strong>
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
          <button class="btn btn-outline btn-sm" onclick="focusMandiOnMap(${m.latitude}, ${m.longitude}, '${m.market}')" style="font-size:0.78rem; padding:4px 10px;">
            <i class="fas fa-crosshairs"></i> View on Map
          </button>
          <button class="btn btn-primary btn-sm" onclick="routeToSmartBookingForCrop('${m.commodity}')" style="font-size:0.78rem; padding:4px 12px;">
            <i class="fas fa-wand-magic-sparkles"></i> Smart Book Produce
          </button>
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

  // Initialize Leaflet Map
  const map = L.map('mandi-price-map', {
    center: [userLoc.lat, userLoc.lng],
    zoom: 8,
    scrollWheelZoom: true
  });
  mandiPriceState.mapInstance = map;

  // OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | Agmarknet India',
    maxZoom: 18
  }).addTo(map);

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
        <div style="background:var(--primary-navy,#0E2A47); color:#FFF; padding:3px 8px; border-radius:14px; border:2px solid #FFF; font-weight:800; font-size:0.75rem; display:flex; align-items:center; gap:4px; box-shadow:0 4px 10px rgba(0,0,0,0.3); white-space:nowrap;">
          <span style="color:#10B981;">₹${m.modalPrice}</span>
          <span style="font-size:0.65rem; opacity:0.8;">(${m.distanceKm}km)</span>
        </div>
      `,
      iconSize: [90, 26],
      iconAnchor: [45, 13]
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
