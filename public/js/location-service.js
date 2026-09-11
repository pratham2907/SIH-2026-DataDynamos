/**
 * 📍 KPMS Unified Geolocation & Spatial Intelligence Service
 * Automatically detects user location on application startup and coordinates
 * geo-tailored experiences across Mandi Prices, Weather Warnings, Smart Booking & TV Board.
 */

(function () {
  // Default fallback Mandi Hub (Bhopal, MP)
  const DEFAULT_LOCATION = {
    lat: 23.2599,
    lng: 77.4126,
    city: 'Bhopal',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    formattedName: 'Bhopal, Madhya Pradesh',
    isLiveGPS: false,
    source: 'National Hub (Default)',
    nearestCenter: {
      centerId: 'CTR-01',
      name: 'APMC Central Mandi Bhopal',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      distanceKm: 0
    }
  };

  // Preset Major Mandi Agricultural Hubs in India
  const PRESET_HUBS = [
    { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, centerId: 'CTR-01' },
    { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, centerId: 'CTR-01' },
    { city: 'Sehore', state: 'Madhya Pradesh', lat: 23.2032, lng: 77.0844, centerId: 'CTR-01' },
    { city: 'Vidisha', state: 'Madhya Pradesh', lat: 23.5251, lng: 77.8081, centerId: 'CTR-01' },
    { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025, centerId: 'CTR-02' },
    { city: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905, centerId: 'CTR-02' },
    { city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, centerId: 'CTR-03' },
    { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, centerId: 'CTR-03' },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, centerId: 'CTR-01' },
    { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, centerId: 'CTR-02' },
    { city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, centerId: 'CTR-01' },
    { city: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365, centerId: 'CTR-04' },
    { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, centerId: 'CTR-01' },
    { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, centerId: 'CTR-04' }
  ];

  // Retrieve cached location from localStorage or default
  const getStoredLocation = () => {
    try {
      const raw = localStorage.getItem('kpms_user_location');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.lat && (parsed.lng || parsed.lon)) {
          parsed.lng = parsed.lng || parsed.lon;
          return parsed;
        }
      }
    } catch (e) {}
    return { ...DEFAULT_LOCATION };
  };

  // Active Global Location State
  window.KPMS_USER_LOCATION = getStoredLocation();

  /**
   * Save location and broadcast change event to all active views
   */
  const setAndBroadcastLocation = (loc, isUserAction = false) => {
    window.KPMS_USER_LOCATION = { ...loc };
    try {
      localStorage.setItem('kpms_user_location', JSON.stringify(window.KPMS_USER_LOCATION));
    } catch (e) {}

    // Update Navigation Location Badge
    updateNavLocationBadge();

    // Trigger global event for all listening pages (Mandi prices, Smart booking, AI dashboard, TV display)
    window.dispatchEvent(new CustomEvent('kpms:location-changed', {
      detail: window.KPMS_USER_LOCATION
    }));

    if (isUserAction && typeof showToast === 'function') {
      showToast(`📍 Location updated to ${loc.city || loc.formattedName || 'new area'}. Adapting Mandi data...`, 'success');
    }
  };

  /**
   * Reverse geocode coordinates via backend proxy (avoids CORS and provides nearest center)
   */
  const fetchReverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lon=${lng}`);
      const json = await res.json();
      if (json.success && json.data) {
        return {
          lat,
          lng,
          city: json.data.city || 'Your City',
          district: json.data.district || json.data.city || 'Your District',
          state: json.data.state || 'India',
          country: json.data.country || 'India',
          postcode: json.data.postcode || '',
          formattedName: json.data.formattedName || `${json.data.city}, ${json.data.state}`,
          isLiveGPS: true,
          source: 'GPS Satellites (Live)',
          nearestCenter: json.data.nearestCenter || DEFAULT_LOCATION.nearestCenter
        };
      }
    } catch (err) {
      console.warn('Backend reverse geocode notice:', err.message);
    }

    // Fallback: approximate nearest preset
    return {
      lat,
      lng,
      city: 'Your Location',
      district: 'Local District',
      state: 'Local State',
      country: 'India',
      formattedName: `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      isLiveGPS: true,
      source: 'GPS Coordinates',
      nearestCenter: DEFAULT_LOCATION.nearestCenter
    };
  };

  /**
   * Request device GPS coordinates via Browser Geolocation API
   */
  const detectLocationFromGPS = (isManualTrigger = false) => {
    if (!navigator.geolocation) {
      if (isManualTrigger && typeof showToast === 'function') {
        showToast('Geolocation is not supported by your browser.', 'error');
      }
      return;
    }

    if (isManualTrigger && typeof showToast === 'function') {
      showToast('📡 Connecting to GPS satellites to pinpoint your location...', 'info');
    }

    const badgeText = document.getElementById('nav-location-text');
    if (badgeText && !isManualTrigger) {
      badgeText.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Detecting location...`;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const resolved = await fetchReverseGeocode(lat, lng);
        setAndBroadcastLocation(resolved, isManualTrigger);
      },
      (err) => {
        console.warn('Geolocation acquisition notice:', err.message);
        // Keep stored or default location
        updateNavLocationBadge();
        if (isManualTrigger && typeof showToast === 'function') {
          showToast('GPS access was dismissed or unavailable. Showing current location.', 'info');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 180000 // 3 minutes cache
      }
    );
  };

  /**
   * Update the location badge in the top navigation bar
   */
  const updateNavLocationBadge = () => {
    const textEl = document.getElementById('nav-location-text');
    const dotEl = document.getElementById('nav-location-dot');
    if (!textEl) return;

    const loc = window.KPMS_USER_LOCATION || DEFAULT_LOCATION;
    const shortLabel = loc.city && loc.state ? `${loc.city}, ${loc.state}` : (loc.formattedName || 'Bhopal, MP');

    textEl.textContent = shortLabel;
    textEl.title = `Active Location: ${shortLabel} (${loc.isLiveGPS ? 'GPS Verified' : 'Preset Hub'}). Click to change.`;

    if (dotEl) {
      dotEl.style.backgroundColor = loc.isLiveGPS ? '#10B981' : '#F59E0B';
      dotEl.title = loc.isLiveGPS ? 'Live GPS Verified' : 'Preset Location';
    }
  };

  /**
   * Render Interactive Location Switcher Modal
   */
  const openLocationPickerModal = () => {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-content-slot');
    if (!modal || !body || !title) return;

    title.innerHTML = `<i class="fas fa-location-dot" style="color:var(--saffron);"></i> Select Your Mandi & Weather Location`;

    const loc = window.KPMS_USER_LOCATION || DEFAULT_LOCATION;

    body.innerHTML = `
      <div style="padding:4px 0;">
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:16px;">
          KPMS uses your location to customize real-time Mandi rates, agro-weather warnings, nearest procurement centers, and queue wait times.
        </p>

        <!-- Current Active Location Banner -->
        <div style="background:var(--bg-main); border:1px solid var(--border-color); border-radius:12px; padding:14px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.5px;">Current Active Location</div>
            <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-top:2px;">
              📍 ${loc.formattedName || `${loc.city}, ${loc.state}`}
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
              Source: <strong style="color:${loc.isLiveGPS ? '#10B981' : 'var(--saffron)'};">${loc.source || (loc.isLiveGPS ? 'GPS Satellites' : 'Preset')}</strong>
              ${loc.nearestCenter ? ` &bull; Nearest Center: <strong>${loc.nearestCenter.name}</strong>` : ''}
            </div>
          </div>
          <span class="status-pill ${loc.isLiveGPS ? 'completed' : 'waiting'}" style="font-size:0.75rem;">
            ${loc.isLiveGPS ? 'GPS Active' : 'Manual'}
          </span>
        </div>

        <!-- Action: Auto-Detect via GPS -->
        <button 
          class="btn btn-primary" 
          style="width:100%; justify-content:center; padding:14px; font-weight:800; font-size:1rem; border-radius:10px; margin-bottom:18px; box-shadow:0 4px 14px rgba(224,109,20,0.3);"
          onclick="window.KPMS_Location.detectGPS(); if(typeof closeModal==='function') closeModal();"
        >
          <i class="fas fa-location-crosshairs"></i> 📡 Detect My Live GPS Location
        </button>

        <div style="text-align:center; position:relative; margin:16px 0;">
          <hr style="border:0; border-top:1px solid var(--border-color);" />
          <span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:var(--bg-card); padding:0 12px; font-size:0.78rem; color:var(--text-muted); font-weight:700;">OR SELECT MAJOR AGRICULTURAL REGION</span>
        </div>

        <!-- Grid of Preset Agricultural Hubs -->
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:10px; max-height:260px; overflow-y:auto; padding:4px 2px;">
          ${PRESET_HUBS.map(hub => `
            <button 
              type="button"
              class="btn btn-outline btn-sm" 
              style="justify-content:flex-start; text-align:left; padding:10px 12px; border-radius:8px; display:flex; flex-direction:column; gap:2px; height:auto; ${loc.city === hub.city ? 'border-color:var(--saffron); background:rgba(224,109,20,0.08);' : ''}"
              onclick="window.KPMS_Location.selectPreset('${hub.city}', '${hub.state}', ${hub.lat}, ${hub.lng}, '${hub.centerId}'); if(typeof closeModal==='function') closeModal();"
            >
              <div style="font-weight:700; color:var(--primary-navy); font-size:0.88rem;">${hub.city}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">${hub.state}</div>
            </button>
          `).join('')}
        </div>

        <div style="margin-top:18px; text-align:right;">
          <button class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  };

  /**
   * Manually select a preset hub
   */
  const selectPreset = (city, state, lat, lng, centerId) => {
    const loc = {
      lat,
      lng,
      city,
      district: city,
      state,
      country: 'India',
      formattedName: `${city}, ${state}`,
      isLiveGPS: false,
      source: `Preset Hub (${city})`,
      nearestCenter: {
        centerId: centerId || 'CTR-01',
        name: centerId === 'CTR-02' ? 'Karnal Grain Mandi' : (centerId === 'CTR-03' ? 'Nashik Krishi Bazar' : (centerId === 'CTR-04' ? 'Guntur Terminal' : 'APMC Central Mandi Bhopal')),
        district: city,
        state,
        distanceKm: 5
      }
    };
    setAndBroadcastLocation(loc, true);
  };

  // Expose Global Public API
  window.KPMS_Location = {
    get: () => window.KPMS_USER_LOCATION || DEFAULT_LOCATION,
    init: () => {
      updateNavLocationBadge();
      // Auto-trigger GPS detection upon website open
      detectLocationFromGPS(false);
    },
    detectGPS: () => detectLocationFromGPS(true),
    selectPreset: selectPreset,
    openModal: openLocationPickerModal,
    updateNavBadge: updateNavLocationBadge
  };

  // Expose global openLocationPickerModal shortcut
  window.openLocationPickerModal = openLocationPickerModal;
})();
