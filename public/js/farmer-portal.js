// Farmer Dashboard & Operations Controller

const getFarmerSidebar = (farmer, activeRoute = 'dashboard') => `
  <aside class="sp-sidebar">
    <nav class="sp-nav-list">
      <a class="sp-nav-item ${activeRoute === 'dashboard' ? 'active' : ''}" onclick="routeTo('#farmer-dashboard')">
        <i class="fas fa-leaf"></i> Dashboard
      </a>
      <a class="sp-nav-item ${activeRoute === 'smart-booking' ? 'active' : ''}" onclick="routeTo('#smart-booking')">
        <i class="fas fa-wand-magic-sparkles"></i> Smart Mandi Finder
      </a>
      <a class="sp-nav-item ${activeRoute === 'book-slot' ? 'active' : ''}" onclick="routeTo('#book-slot')">
        <i class="fas fa-calendar-plus"></i> Book Slot
      </a>
      <a class="sp-nav-item ${activeRoute === 'my-bookings' ? 'active' : ''}" onclick="routeTo('#my-bookings')">
        <i class="fas fa-ticket-alt"></i> My Bookings
      </a>
      <a class="sp-nav-item ${activeRoute === 'farmer-queue' ? 'active' : ''}" onclick="routeTo('#farmer-queue')">
        <i class="fas fa-users-line"></i> Live Queue
      </a>
      <a class="sp-nav-item ${activeRoute === 'procurement-status' ? 'active' : ''}" onclick="routeTo('#farmer-queue')">
        <i class="fas fa-clipboard-check"></i> Procurement Status
      </a>
      <a class="sp-nav-item ${activeRoute === 'farmer-payments' ? 'active' : ''}" onclick="routeTo('#farmer-payments')">
        <i class="fas fa-money-check-dollar"></i> Payments
      </a>
      <a class="sp-nav-item ${activeRoute === 'notifications' ? 'active' : ''}" onclick="openNotificationsModal()">
        <i class="far fa-bell"></i> Notifications <span class="sp-nav-badge">3</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'grievances' ? 'active' : ''}" onclick="openGrievanceModal()">
        <i class="fas fa-headset"></i> Grievances
      </a>
      <a class="sp-nav-item ${activeRoute === 'farmer-profile' ? 'active' : ''}" onclick="routeTo('#farmer-profile')">
        <i class="fas fa-user-circle"></i> My Profile
      </a>
    </nav>

    <!-- Sidebar Promo Card -->
    <div class="sp-promo-card">
      <div class="sp-promo-inner">
        <img src="/images/sp_farmer_promo.jpg" alt="Digital Mandi 2026" class="sp-promo-img" />
        <div class="sp-promo-title">Digital Mandi 2026</div>
        <p style="font-size:0.73rem; color:#4B5563; line-height:1.4; margin-bottom:10px;">
          Book slots ahead, avoid long queues at procurement centres. Get fair MSP directly in bank.
        </p>
        <button class="sp-promo-btn" onclick="openSihInfoModal()">Learn More</button>
      </div>
    </div>
  </aside>
`;

/**
 * Renders the comprehensive SmartProcure Farmer Dashboard
 * Exactly mirrors the structure, colors, cards, and styling of reference screenshot
 */
const renderSmartProcureFarmerView = (data = {}) => {
  const farmer = data.farmer || {
    fullName: 'Ramesh Kumar',
    name: 'Ramesh Kumar',
    farmerId: 'FARM000001',
    preferredCenterId: 'APMC Central Mandi Bhopal',
    totalLandArea: 5
  };
  const activeBooking = data.activeBooking || null;
  const queueEntry = data.queueEntry || null;
  const stats = data.stats || {
    totalBookings: 8,
    totalEarnings: 184000,
    pendingEarnings: 48500
  };

  const container = document.getElementById('app-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="sp-app-layout">
      <!-- Full-Height White Sidebar -->
      ${getFarmerSidebar(farmer, 'dashboard')}

      <!-- Main Content Canvas -->
      <main class="sp-main">
        
        <!-- Top Hero Agricultural Banner -->
        <section class="sp-hero-banner">
          <div class="sp-hero-overlay"></div>
          
          <div class="sp-hero-content">
            <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.25); border-radius:20px; padding:4px 12px; font-size:0.74rem; font-weight:700; color:#86EFAC; margin-bottom:12px;">
              <i class="fas fa-leaf"></i> SmartProcure &bull; SIH 2026 PS 26032
            </div>
            <h1 class="sp-hero-title">
              Smart Agricultural Procurement System
            </h1>
            <p class="sp-hero-sub">
              Find the best procurement centre, book your slot, track your queue and monitor your payment — all from one platform.
            </p>
            <div class="sp-hero-actions">
              <button class="sp-hero-btn-primary" onclick="routeTo('#smart-booking')">
                <i class="fas fa-wand-magic-sparkles"></i> 🌾 Find Best Mandi
              </button>
              <button class="sp-hero-btn-secondary" onclick="routeTo('#farmer-queue')">
                <i class="fas fa-users-line"></i> Track Procurement
              </button>
            </div>
          </div>

          <!-- Floating Stat Cards Stack (Hero Right) -->
          <div class="sp-hero-stats-stack">
            <div class="sp-floating-stat">
              <div class="sp-floating-stat-chip sp-chip-green">
                <i class="fas fa-check-double"></i>
              </div>
              <div>
                <div class="sp-floating-stat-label">On-time Procurement</div>
                <div class="sp-floating-stat-val">98.4%</div>
              </div>
            </div>

            <div class="sp-floating-stat">
              <div class="sp-floating-stat-chip sp-chip-blue">
                <i class="fas fa-building-columns"></i>
              </div>
              <div>
                <div class="sp-floating-stat-label">Mandis Connected</div>
                <div class="sp-floating-stat-val">2,400+</div>
              </div>
            </div>

            <div class="sp-floating-stat">
              <div class="sp-floating-stat-chip sp-chip-yellow">
                <i class="fas fa-bolt"></i>
              </div>
              <div>
                <div class="sp-floating-stat-label">Direct Bank Transfer</div>
                <div class="sp-floating-stat-val">₹ 48-72 hrs</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 5-Card Stat Strip -->
        <section class="sp-stat-strip">
          <!-- Card 1 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-green">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div>
              <div class="sp-stat-label">Active Bookings</div>
              <div class="sp-stat-num">${stats.totalBookings || 8}</div>
              <div class="sp-stat-change">+12% this week</div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-blue">
              <i class="fas fa-location-dot"></i>
            </div>
            <div>
              <div class="sp-stat-label">Mandis Nearby</div>
              <div class="sp-stat-num">3</div>
              <div class="sp-stat-change" style="color:#2563EB;">Within 50 km</div>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-orange">
              <i class="fas fa-wheat-awn"></i>
            </div>
            <div>
              <div class="sp-stat-label">Current Stock</div>
              <div class="sp-stat-num">24 q</div>
              <div class="sp-stat-change" style="color:#EA580C;">Wheat & Mustard</div>
            </div>
          </div>

          <!-- Card 4 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-purple">
              <i class="fas fa-clock"></i>
            </div>
            <div>
              <div class="sp-stat-label">On-time Arrival</div>
              <div class="sp-stat-num">94%</div>
              <div class="sp-stat-change" style="color:#9333EA;">High reliability</div>
            </div>
          </div>

          <!-- Card 5 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-yellow">
              <i class="fas fa-indian-rupee-sign"></i>
            </div>
            <div>
              <div class="sp-stat-label">Total Earnings</div>
              <div class="sp-stat-num">₹ ${(stats.totalEarnings || 184000).toLocaleString('en-IN')}</div>
              <div class="sp-stat-change">This season</div>
            </div>
          </div>
        </section>

        <!-- Two-Column Master Content Grid -->
        <section class="sp-content-grid">
          
          <!-- LEFT COLUMN (65% width) -->
          <div class="sp-left-col">
            
            <!-- Smart Mandi Finder Interactive Card -->
            <div class="sp-card sp-finder-card">
              <div class="sp-finder-header">
                <div class="sp-finder-title-row">
                  <div class="sp-finder-icon-box">
                    <i class="fas fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <div class="sp-finder-title">Find Best Mandi</div>
                    <div class="sp-finder-sub">AI-powered optimal mandi locator with live transit & queue tracking</div>
                  </div>
                </div>
                <span class="sp-live-pill">
                  <span class="sp-pulse-dot"></span> Live Rates
                </span>
              </div>

              <!-- 4 Search Form Inputs -->
              <div class="sp-finder-inputs">
                <div class="sp-input-box">
                  <label><i class="fas fa-location-dot" style="color:#0D5C3A;"></i> Your Location</label>
                  <div class="sp-input-row">
                    <input type="text" id="sp-search-location" value="${(window.KPMS_USER_LOCATION && (window.KPMS_USER_LOCATION.city ? `${window.KPMS_USER_LOCATION.city}, ${window.KPMS_USER_LOCATION.state}` : window.KPMS_USER_LOCATION.formattedName)) || 'Bhopal, Madhya Pradesh'}" placeholder="Enter city/district" readonly style="cursor:pointer;" onclick="openLocationPickerModal()" />
                    <span class="sp-change-link" onclick="openLocationPickerModal()">Change</span>
                  </div>
                </div>

                <div class="sp-input-box">
                  <label><i class="fas fa-seedling" style="color:#0D5C3A;"></i> Crop Type</label>
                  <div class="sp-input-row">
                    <select id="sp-search-crop" onchange="runSmartMandiFinderSearch(true)">
                      <option value="Wheat" selected>Wheat (गेहूं - ₹2,425/Q)</option>
                      <option value="Tomato">Tomato (टमाटर)</option>
                      <option value="Potato">Potato (आलू)</option>
                      <option value="Onion">Onion (प्याज)</option>
                      <option value="Paddy">Paddy / Rice (धान / चावल - ₹2,320/Q)</option>
                      <option value="Mustard">Mustard (सरसों - ₹5,650/Q)</option>
                      <option value="Soybean">Soybean (सोयाबीन - ₹4,892/Q)</option>
                      <option value="Gram">Gram / Chana (चना - ₹5,440/Q)</option>
                      <option value="Maize">Maize (मक्का - ₹2,090/Q)</option>
                      <option value="Cotton">Cotton (कपास - ₹7,100/Q)</option>
                      <option value="Green Chilli">Green Chilli (हरी मिर्च)</option>
                    </select>
                  </div>
                </div>

                <div class="sp-input-box">
                  <label><i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> Quantity (qtl)</label>
                  <div class="sp-input-row">
                    <input type="number" id="sp-search-quantity" value="50" min="1" max="1000" oninput="if(window.debounceMandiSearch) window.debounceMandiSearch();" />
                  </div>
                </div>

                <div class="sp-input-box">
                  <label><i class="fas fa-calendar-day" style="color:#0D5C3A;"></i> Preferred Date</label>
                  <div class="sp-input-row">
                    <input type="date" id="sp-search-date" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" onchange="runSmartMandiFinderSearch(true)" />
                  </div>
                </div>
              </div>

              <!-- Search CTA Button -->
              <button class="sp-btn-find" onclick="runSmartMandiFinderSearch(false)">
                <i class="fas fa-wand-magic-sparkles"></i> 🌾 Find Best Mandi
              </button>
            </div>

            <!-- Recommended Procurement Centres Section -->
            <div class="sp-recommend-header">
              <div class="sp-recommend-title">
                <i class="fas fa-bullseye" style="color:#0D5C3A;"></i> Recommended Procurement Centres
              </div>
              <a class="sp-view-all-link" onclick="routeTo('#smart-booking')">
                View All Mandis <i class="fas fa-arrow-right"></i>
              </a>
            </div>

            <!-- Dynamic Recommended Centres Grid -->
            <div class="sp-centres-grid" id="sp-centres-container">
              <div style="grid-column: 1 / -1; padding: 28px 20px; text-align: center; background: #FFF; border: 1px solid #E5E7EB; border-radius: 14px;">
                <i class="fas fa-circle-notch fa-spin" style="color:#0D5C3A; font-size:1.6rem; margin-bottom:8px;"></i>
                <div style="font-weight:700; color:#111827; font-size:0.95rem;">Finding best procurement centres...</div>
                <div style="font-size:0.78rem; color:#6B7280; margin-top:3px;">Matching location, live mandi rates & weather transit delays</div>
              </div>
            </div>

            <!-- "Why these centres?" Callout Bar -->
            <div class="sp-callout-bar">
              <div><strong>Why these centres?</strong></div>
              <div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> Best net price after transit</div>
              <div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> Lowest yard waiting time</div>
              <div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> Fair grading guarantee</div>
            </div>
          </div>

          <!-- RIGHT COLUMN (35% width) -->
          <div class="sp-right-col">
            
            <!-- Widget 1: Your Procurement Journey -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-route" style="color:#0D5C3A;"></i> Your Procurement Journey
                </div>
                <a class="sp-widget-link" onclick="routeTo('#farmer-queue')">View Details &gt;</a>
              </div>

              <div class="sp-timeline-container">
                <div class="sp-timeline-line"></div>

                <!-- Step 1 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-completed"><i class="fas fa-check"></i></div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">1. Centre Selection</span>
                    <span class="sp-step-pill sp-pill-completed">Completed</span>
                  </div>
                  <div class="sp-step-time">Centre C - Vidisha selected</div>
                </div>

                <!-- Step 2 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-completed"><i class="fas fa-check"></i></div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">2. Slot Booking</span>
                    <span class="sp-step-pill sp-pill-completed">Completed</span>
                  </div>
                  <div class="sp-step-time">${activeBooking ? `${activeBooking.date} • ${activeBooking.timeSlot}` : '12 Apr 2026 • 10:00 - 11:30 AM'}</div>
                </div>

                <!-- Step 3 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-completed"><i class="fas fa-check"></i></div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">3. Digital Token</span>
                    <span class="sp-step-pill sp-pill-completed">Active</span>
                  </div>
                  <div class="sp-step-time">${queueEntry ? `Token: ${queueEntry.tokenNumber}` : 'Pass #TK-204 Issued'}</div>
                </div>

                <!-- Step 4 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-inprogress"><i class="fas fa-arrow-right"></i></div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">4. Gate Entry</span>
                    <span class="sp-step-pill sp-pill-inprogress">In Progress</span>
                  </div>
                  <div class="sp-step-time">Proceed to Gate 2 &bull; QR Verified</div>
                </div>

                <!-- Step 5 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-pending">5</div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">5. Quality Testing</span>
                    <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                  </div>
                  <div class="sp-step-time">Moisture & purity evaluation</div>
                </div>

                <!-- Step 6 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-pending">6</div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">6. Weighment</span>
                    <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                  </div>
                  <div class="sp-step-time">Gross & tare electronic scale</div>
                </div>

                <!-- Step 7 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-pending">7</div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">7. J-Form Receipt</span>
                    <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                  </div>
                  <div class="sp-step-time">Digital signed procurement slip</div>
                </div>

                <!-- Step 8 -->
                <div class="sp-timeline-step">
                  <div class="sp-timeline-node sp-node-pending">8</div>
                  <div class="sp-step-header">
                    <span class="sp-step-name">8. DBT Payment</span>
                    <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                  </div>
                  <div class="sp-step-time">Direct transfer: ₹1,21,250 (48-72h)</div>
                </div>
              </div>
            </div>

            <!-- Widget 2: Weather - Vidisha -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-location-dot" style="color:#0D5C3A;"></i> Weather - Vidisha
                </div>
                <span style="font-size:0.75rem; color:#6B7280; font-weight:600;">Clear & Sunny</span>
              </div>

              <div class="sp-weather-main">
                <i class="fas fa-sun sp-weather-sun"></i>
                <div>
                  <div class="sp-weather-temp">31°C</div>
                  <div class="sp-weather-cond">Ideal transit conditions</div>
                </div>
              </div>

              <div class="sp-weather-metrics">
                Humidity: <strong>42%</strong> &bull; Wind: <strong>12 km/h</strong> &bull; Rain: <strong>0%</strong>
              </div>

              <!-- 5-Day Mini Forecast Strip -->
              <div class="sp-forecast-strip">
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">Today</span>
                  <i class="fas fa-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">31°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">Tue</span>
                  <i class="fas fa-cloud-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">32°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">Wed</span>
                  <i class="fas fa-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">30°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">Thu</span>
                  <i class="fas fa-cloud-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">29°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">Fri</span>
                  <i class="fas fa-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">31°</span>
                </div>
              </div>
            </div>

            <!-- Widget 3: Nearby Mandis Interactive Map -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-map-marked-alt" style="color:#0D5C3A;"></i> Nearby Mandis
                </div>
                <a class="sp-widget-link" onclick="routeTo('#smart-booking')">View on Map &gt;</a>
              </div>

              <div id="sp-nearby-map" class="sp-mini-map-box"></div>
              
              <div style="font-size:0.74rem; color:#4B5563; font-weight:600; margin-top:10px; display:flex; justify-content:space-between;">
                <span><i class="fas fa-circle" style="color:#2563EB; font-size:0.65rem;"></i> Bhopal (12 km)</span>
                <span><i class="fas fa-circle" style="color:#16A34A; font-size:0.65rem;"></i> Vidisha (28 km)</span>
                <span><i class="fas fa-circle" style="color:#EA580C; font-size:0.65rem;"></i> Sehore (65 km)</span>
              </div>
            </div>

            <!-- Widget 4: Notifications List -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="far fa-bell" style="color:#0D5C3A;"></i> Notifications
                </div>
                <a class="sp-widget-link" onclick="openNotificationsModal()">View All &gt;</a>
              </div>

              <div class="sp-notif-list">
                <div class="sp-notif-item">
                  <div class="sp-notif-icon sp-chip-green">
                    <i class="fas fa-check"></i>
                  </div>
                  <div class="sp-notif-content">
                    <div class="sp-notif-title-row">
                      <span class="sp-notif-title">Slot Confirmed</span>
                      <span class="sp-notif-time">2h ago</span>
                    </div>
                    <div class="sp-notif-desc">Centre C - Vidisha for 12 Apr 2026, 10:00 AM</div>
                  </div>
                </div>

                <div class="sp-notif-item">
                  <div class="sp-notif-icon sp-chip-blue">
                    <i class="fas fa-ticket-alt"></i>
                  </div>
                  <div class="sp-notif-content">
                    <div class="sp-notif-title-row">
                      <span class="sp-notif-title">Token #TK-204 Called</span>
                      <span class="sp-notif-time">4h ago</span>
                    </div>
                    <div class="sp-notif-desc">Gate 2 entry cleared for electronic weighment</div>
                  </div>
                </div>

                <div class="sp-notif-item">
                  <div class="sp-notif-icon sp-chip-orange">
                    <i class="fas fa-indian-rupee-sign"></i>
                  </div>
                  <div class="sp-notif-content">
                    <div class="sp-notif-title-row">
                      <span class="sp-notif-title">DBT Processed ₹48,500</span>
                      <span class="sp-notif-time">1d ago</span>
                    </div>
                    <div class="sp-notif-desc">Direct transfer completed via PFMS UTR SBIN48291</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- Wide Photographic Footer Band -->
        <section class="sp-footer-band">
          <div class="sp-footer-overlay"></div>
          <div class="sp-footer-content">
            <h2 class="sp-footer-title">
              Empowering India's Farmers Through Smart Procurement
            </h2>
            <div class="sp-footer-pillars">
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-wheat-awn"></i></div>
                <div class="sp-pillar-label">Fair MSP Pricing</div>
              </div>
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-bolt"></i></div>
                <div class="sp-pillar-label">Zero Queue Delays</div>
              </div>
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-building-columns"></i></div>
                <div class="sp-pillar-label">Instant DBT Transfer</div>
              </div>
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-headset"></i></div>
                <div class="sp-pillar-label">24/7 Farmer Support</div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  `;

  // Initialize interactive Leaflet mini-map asynchronously once element exists
  setTimeout(() => {
    if (typeof window.initNearbyMandisMiniMap === 'function') {
      window.initNearbyMandisMiniMap();
    } else if (typeof initNearbyMandisMiniMap === 'function') {
      initNearbyMandisMiniMap();
    }
    if (typeof window.runSmartMandiFinderSearch === 'function') {
      window.runSmartMandiFinderSearch(true);
    }
  }, 100);
};

window.renderSmartProcureFarmerView = renderSmartProcureFarmerView;
window.getFarmerSidebar = getFarmerSidebar;

const loadFarmerDashboard = async () => {

  const token = localStorage.getItem('kpms_token');
  
  // If no auth token, render default SmartProcure experience so view is immediately functional
  if (!token) {
    renderSmartProcureFarmerView();
    return;
  }

  const container = document.getElementById('app-view-container');
  if (container) {
    container.innerHTML = `<div class="skeleton" style="height:350px; border-radius:12px; margin:24px;"></div>`;
  }

  try {
    const res = await fetch('/api/farmer/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      renderSmartProcureFarmerView();
      return;
    }

    renderSmartProcureFarmerView(result.data);
  } catch (err) {
    console.error('Error fetching farmer dashboard:', err);
    renderSmartProcureFarmerView();
  }
};
window.loadFarmerDashboard = loadFarmerDashboard;




/**
 * My Farms & Crops Portal View
 */
const loadFarmerFarmsPage = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) {
    routeTo('#landing');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:350px; border-radius:12px;"></div>`;

  try {
    const [profileRes, farmsRes, cropsRes] = await Promise.all([
      fetch('/api/farmer/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/farmer/farms', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/farmer/crops', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const profileData = await profileRes.json();
    const farmsData = await farmsRes.json();
    const cropsData = await cropsRes.json();

    const farmer = profileData.data || {};
    const farms = farmsData.data || [];
    const crops = cropsData.data || [];

    const totalAcres = farms.reduce((acc, f) => acc + (parseFloat(f.area) || 0), 0) || farmer.totalLandArea || 5.0;
    const totalYieldEst = crops.reduce((acc, c) => acc + (parseFloat(c.quantity) || 0), 0) || farmer.estimatedQuantity || 50;

    container.innerHTML = `
      <div class="app-container">
        <!-- Sidebar Navigation -->
        ${getFarmerSidebar(farmer, 'farmer-farms')}

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Top Page Header -->
          <div class="glass-panel" style="padding:22px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; border-left:6px solid #16A34A;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h2 style="font-size:1.75rem; font-weight:800; color:var(--primary-navy);"><i class="fas fa-tractor" style="color:var(--green-gov);"></i> My Farms & Crops</h2>
                <span class="status-pill completed"><i class="fas fa-check-shield"></i> Geo-Verified Land</span>
              </div>
              <p style="color:var(--text-muted); font-size:0.92rem; margin-top:4px;">
                Manage registered agricultural land parcels, survey/khasra numbers, and active seasonal crop yields for MSP procurement eligibility.
              </p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="openAddFarmModal()"><i class="fas fa-plus-circle"></i> Add Farm Plot</button>
              <button class="btn btn-navy" onclick="openAddCropModal()"><i class="fas fa-seedling"></i> Register New Crop</button>
              <button class="btn btn-outline" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> 🌾 Smart Mandi Finder</button>
            </div>
          </div>

          <!-- Summary Metric Cards -->
          <div class="dashboard-grid" style="margin-bottom:28px;">
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${totalAcres.toFixed(1)} Acres</div>
                <div class="metric-title">Total Registered Land Area</div>
              </div>
              <div class="metric-icon-box" style="background:#ECFDF5; color:#16A34A;"><i class="fas fa-map-location-dot"></i></div>
            </div>

            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${farms.length} Plots</div>
                <div class="metric-title">Verified Land Parcels</div>
              </div>
              <div class="metric-icon-box" style="background:#EFF6FF; color:#2563EB;"><i class="fas fa-layer-group"></i></div>
            </div>

            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${crops.length} Registered</div>
                <div class="metric-title">Active Seasonal Crops</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706;"><i class="fas fa-wheat-awn"></i></div>
            </div>

            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${totalYieldEst} Quintals</div>
                <div class="metric-title">Estimated Total Yield</div>
              </div>
              <div class="metric-icon-box" style="background:#FAF5FF; color:#9333EA;"><i class="fas fa-boxes-stacked"></i></div>
            </div>
          </div>

          <!-- Section 1: Registered Farm Land Parcels -->
          <div class="glass-card" style="padding:24px; margin-bottom:28px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 style="font-size:1.25rem; font-weight:700; color:var(--primary-navy);"><i class="fas fa-map"></i> Registered Agricultural Land Parcels</h3>
                <p style="color:var(--text-muted); font-size:0.88rem; margin-top:2px;">Government revenue verified land records (7/12 Khasra/Khatauni Extract).</p>
              </div>
              <button class="btn btn-primary btn-sm" onclick="openAddFarmModal()"><i class="fas fa-plus"></i> Add New Plot</button>
            </div>

            ${farms.length === 0 ? `
              <div style="text-align:center; padding:32px; background:var(--bg-main); border-radius:10px;">
                <i class="fas fa-tractor" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:12px;"></i>
                <p style="font-weight:600; color:var(--text-muted);">No farm parcels added yet.</p>
                <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="openAddFarmModal()"><i class="fas fa-plus"></i> Add Your First Farm</button>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:18px;">
                ${farms.map(f => `
                  <div class="glass-panel" style="padding:18px; border-radius:10px; border-left:4px solid var(--green-gov); background:var(--bg-main); display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <h4 style="font-weight:700; color:var(--primary-navy); font-size:1.05rem;">${f.farmName || 'Primary Farm Plot'}</h4>
                        <span class="status-pill completed" style="font-size:0.72rem;">Verified Plot</span>
                      </div>
                      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
                        <div><i class="fas fa-hashtag" style="width:18px; color:var(--saffron);"></i> Survey / Khasra No: <strong style="color:var(--primary-navy);">${f.surveyNumber || 'SRV-894/2'}</strong></div>
                        <div><i class="fas fa-ruler-combined" style="width:18px; color:#2563EB;"></i> Land Area: <strong style="color:var(--primary-navy);">${f.area || 5} Acres</strong></div>
                        <div><i class="fas fa-location-dot" style="width:18px; color:#DC2626;"></i> Village / Taluka: <strong style="color:var(--primary-navy);">${f.village || farmer.village || 'Ratibad'}</strong></div>
                        <div><i class="fas fa-seedling" style="width:18px; color:var(--green-gov);"></i> Primary Crop: <strong style="color:var(--primary-navy);">${f.crop || 'Wheat'}</strong></div>
                        <div><i class="fas fa-boxes" style="width:18px; color:#9333EA;"></i> Est. Harvest: <strong style="color:var(--primary-navy);">${f.estimatedQuantity || 50} Quintals</strong></div>
                      </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border-color);">
                      <button class="btn btn-outline btn-sm" onclick="routeTo('#smart-booking')" title="Find best Mandi for this farm"><i class="fas fa-wand-magic-sparkles"></i> Best Mandi</button>
                      <button class="btn btn-outline btn-sm" style="color:#EF4444; border-color:#FCA5A5;" onclick="deleteFarmPlot('${f._id || f.id}')" title="Delete Farm Plot"><i class="fas fa-trash-can"></i></button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Section 2: Registered Seasonal Crops & MSP Protection -->
          <div class="glass-card" style="padding:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 style="font-size:1.25rem; font-weight:700; color:var(--primary-navy);"><i class="fas fa-wheat-awn" style="color:var(--saffron);"></i> Registered Crops & MSP Procurement Quota</h3>
                <p style="color:var(--text-muted); font-size:0.88rem; margin-top:2px;">Government Minimum Support Price (MSP) entitlement and booking readiness.</p>
              </div>
              <button class="btn btn-navy btn-sm" onclick="openAddCropModal()"><i class="fas fa-plus"></i> Register New Crop</button>
            </div>

            ${crops.length === 0 ? `
              <div style="text-align:center; padding:32px; background:var(--bg-main); border-radius:10px;">
                <i class="fas fa-seedling" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:12px;"></i>
                <p style="font-weight:600; color:var(--text-muted);">No crops registered for the active season.</p>
                <button class="btn btn-navy btn-sm" style="margin-top:12px;" onclick="openAddCropModal()"><i class="fas fa-plus"></i> Register Crop Now</button>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:18px;">
                ${crops.map(c => `
                  <div class="glass-panel" style="padding:18px; border-radius:10px; border-left:4px solid var(--saffron); background:var(--bg-main); display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <h4 style="font-weight:700; color:var(--primary-navy); font-size:1.1rem;">${c.cropName || 'Wheat (Sharbati)'}</h4>
                        <span class="status-pill active" style="font-size:0.72rem;">${c.season || 'Rabi 2025-26'}</span>
                      </div>
                      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
                        <div><i class="fas fa-weight-hanging" style="width:18px; color:#2563EB;"></i> Registered Quantity: <strong style="color:var(--primary-navy);">${c.quantity || 50} Quintals</strong></div>
                        <div><i class="fas fa-indian-rupee-sign" style="width:18px; color:var(--green-gov);"></i> Govt MSP Rate: <strong style="color:var(--green-gov); font-weight:700;">₹${c.supportPrice || 2275} / Qtl</strong></div>
                        <div><i class="fas fa-calendar-check" style="width:18px; color:var(--saffron);"></i> Expected Harvest: <strong style="color:var(--primary-navy);">${c.expectedHarvestDate || '2026-08-25'}</strong></div>
                        <div><i class="fas fa-shield-halved" style="width:18px; color:#16A34A;"></i> Procurement Status: <strong style="color:#16A34A;">Ready to Book</strong></div>
                      </div>
                    </div>
                    <div style="display:flex; gap:8px; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border-color); flex-wrap:wrap;">
                      <button class="btn btn-primary btn-sm" onclick="routeToSmartBookingForCrop('${c.cropName || 'Wheat'}')"><i class="fas fa-wand-magic-sparkles"></i> Smart Slot</button>
                      <button class="btn btn-outline btn-sm" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> Standard Slot</button>
                      <button class="btn btn-outline btn-sm" style="color:#EF4444; border-color:#FCA5A5;" onclick="deleteCropEntry('${c._id || c.id}')" title="Delete Crop"><i class="fas fa-trash-can"></i></button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load farms & crops: ' + err.message, 'error');
  }
};

/**
 * Profile & Documents Portal View
 */
const loadFarmerProfilePage = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) {
    routeTo('#landing');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:350px; border-radius:12px;"></div>`;

  try {
    const res = await fetch('/api/farmer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    const farmer = result.data || {};
    const docs = farmer.documents || [
      { docType: 'Aadhaar Card', fileName: 'aadhaar_verified.pdf', status: 'Approved', uploadDate: '2026-08-10' },
      { docType: 'Land Record (7/12 Extract)', fileName: 'land_record_srv894.pdf', status: 'Approved', uploadDate: '2026-08-10' },
      { docType: 'Bank Passbook Copy', fileName: 'sbi_passbook.pdf', status: 'Approved', uploadDate: '2026-08-10' }
    ];

    container.innerHTML = `
      <div class="app-container">
        <!-- Sidebar Navigation -->
        ${getFarmerSidebar(farmer, 'farmer-profile')}

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Top Welcome Header -->
          <div class="glass-panel" style="padding:22px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; border-left:6px solid var(--saffron);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h2 style="font-size:1.75rem; font-weight:800; color:var(--primary-navy);"><i class="fas fa-user-circle" style="color:var(--saffron);"></i> Farmer Profile & Documents</h2>
                <span class="status-pill completed"><i class="fas fa-shield-check"></i> Government ${farmer.verificationStatus || 'Verified'}</span>
              </div>
              <p style="color:var(--text-muted); font-size:0.92rem; margin-top:4px;">
                Farmer ID: <strong>${farmer.farmerId || 'FARM000001'}</strong> | Registered Under PM-KISAN & State APMC Mandi Registry.
              </p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="openEditProfileModal()"><i class="fas fa-user-pen"></i> Edit Profile Details</button>
              <button class="btn btn-outline" onclick="openUploadDocModal()"><i class="fas fa-file-arrow-up"></i> Upload Document</button>
            </div>
          </div>

          <!-- Profile Details Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
            <!-- Personal Info Card -->
            <div class="glass-card" style="padding:20px;">
              <h4 style="font-weight:700; color:var(--primary-navy); margin-bottom:16px;"><i class="fas fa-id-badge" style="color:#2563EB;"></i> Personal Details</h4>
              <div style="display:flex; flex-direction:column; gap:10px; font-size:0.9rem;">
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Full Name:</span>
                  <span style="font-weight:700; color:var(--primary-navy);">${farmer.fullName || 'Ramesh Patel'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Father's Name:</span>
                  <span style="font-weight:600;">${farmer.fatherName || 'Shivram Patel'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Mobile Number:</span>
                  <span style="font-weight:700; color:var(--primary-navy);"><i class="fas fa-phone-volume" style="color:var(--green-gov);"></i> ${farmer.mobile || '9876543210'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Email Address:</span>
                  <span style="font-weight:600;">${farmer.email || 'ramesh@farmer.in'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Aadhaar Card:</span>
                  <span style="font-weight:700;"><i class="fas fa-lock" style="color:var(--saffron);"></i> ${farmer.aadhaarNumber ? 'XXXX-XXXX-' + farmer.aadhaarNumber.slice(-4) : 'XXXX-XXXX-9012'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Gender / DOB:</span>
                  <span style="font-weight:600;">${farmer.gender || 'Male'} | ${farmer.dob || '1982-05-14'}</span>
                </div>
              </div>
            </div>

            <!-- Direct Bank Transfer (DBT) Bank Account Card -->
            <div class="glass-card" style="padding:20px;">
              <h4 style="font-weight:700; color:var(--primary-navy); margin-bottom:16px;"><i class="fas fa-building-columns" style="color:var(--green-gov);"></i> Verified DBT Bank Account</h4>
              <div style="display:flex; flex-direction:column; gap:10px; font-size:0.9rem;">
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Account Holder:</span>
                  <span style="font-weight:700; color:var(--primary-navy);">${farmer.accountHolderName || farmer.fullName || 'Ramesh Patel'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Bank Name:</span>
                  <span style="font-weight:700; color:var(--green-gov);"><i class="fas fa-university"></i> ${farmer.bankName || 'State Bank of India'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Account Number:</span>
                  <span style="font-weight:700;">${farmer.accountNumber ? 'XXXX-XXXX-' + farmer.accountNumber.slice(-4) : 'XXXX-XXXX-3829'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">IFSC Code:</span>
                  <span style="font-weight:700; color:var(--primary-navy);">${farmer.ifscCode || 'SBIN0001234'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Bank Branch:</span>
                  <span style="font-weight:600;">${farmer.branch || 'Bhopal Main Branch'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:6px;">
                  <span style="color:#065F46; font-weight:600;"><i class="fas fa-circle-check"></i> PFMS / DBT Direct Link:</span>
                  <span style="font-weight:700; color:#065F46;">Active & Ready for Payouts</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Address & Verification Documents Section -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <!-- Address Card -->
            <div class="glass-card" style="padding:20px;">
              <h4 style="font-weight:700; color:var(--primary-navy); margin-bottom:16px;"><i class="fas fa-house-chimney" style="color:var(--saffron);"></i> Residential & Farm Address</h4>
              <div style="display:flex; flex-direction:column; gap:10px; font-size:0.9rem;">
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Village:</span>
                  <span style="font-weight:600;">${farmer.village || 'Ratibad'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Taluka / Tehsil:</span>
                  <span style="font-weight:600;">${farmer.taluka || 'Huzur'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">District:</span>
                  <span style="font-weight:600;">${farmer.district || 'Bhopal'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">State & Pin Code:</span>
                  <span style="font-weight:600;">${farmer.state || 'Madhya Pradesh'} - ${farmer.pinCode || '462044'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-main); border-radius:6px;">
                  <span style="color:var(--text-muted);">Preferred Mandi:</span>
                  <span style="font-weight:700; color:var(--primary-navy);">${farmer.preferredCenterId || 'APMC Bhopal (CTR-01)'}</span>
                </div>
              </div>
            </div>

            <!-- Documents Card -->
            <div class="glass-card" style="padding:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h4 style="font-weight:700; color:var(--primary-navy);"><i class="fas fa-file-shield" style="color:var(--green-gov);"></i> Verification Documents</h4>
                <button class="btn btn-primary btn-sm" onclick="openUploadDocModal()"><i class="fas fa-upload"></i> Upload</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${docs.map(d => `
                  <div style="padding:12px; background:var(--bg-main); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-weight:700; font-size:0.92rem;"><i class="fas fa-file-lines" style="color:var(--saffron); margin-right:6px;"></i> ${d.docType || 'Document'}</div>
                      <div style="font-size:0.78rem; color:var(--text-muted);">${d.fileName || 'verified_doc.pdf'} • Uploaded on ${d.uploadDate || '2026-08-10'}</div>
                    </div>
                    <span class="status-pill completed"><i class="fas fa-check"></i> ${d.status || 'Approved'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
};

/**
 * Modals for Adding Farm, Adding Crop, and Profile Editing
 */
const openAddFarmModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Add Agricultural Farm Plot';

  body.innerHTML = `
    <form onsubmit="submitAddFarm(event)">
      <div class="form-group">
        <label class="form-label"><i class="fas fa-tag"></i> Farm Plot Name *</label>
        <input type="text" id="add-farm-name" class="form-control" placeholder="e.g. Ramesh North Acre Plot" value="North Acre Plot" required />
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label"><i class="fas fa-hashtag"></i> Survey / Khasra No *</label>
          <input type="text" id="add-farm-survey" class="form-control" placeholder="e.g. SRV-902/1" value="SRV-902/1" required />
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fas fa-ruler"></i> Land Area (Acres) *</label>
          <input type="number" step="0.1" id="add-farm-area" class="form-control" placeholder="e.g. 3.5" value="3.5" required />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label"><i class="fas fa-location-dot"></i> Village / Locality *</label>
          <input type="text" id="add-farm-village" class="form-control" placeholder="e.g. Ratibad" value="Ratibad" required />
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fas fa-seedling"></i> Primary Crop *</label>
          <select id="add-farm-crop" class="form-control" required>
            <option value="Wheat (Sharbati)">Wheat (Sharbati)</option>
            <option value="Gram (Chana)">Gram (Chana)</option>
            <option value="Mustard (Sarson)">Mustard (Sarson)</option>
            <option value="Paddy (Basmati)">Paddy (Basmati)</option>
            <option value="Soybean">Soybean</option>
            <option value="Cotton">Cotton</option>
            <option value="Maize">Maize</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fas fa-boxes"></i> Estimated Harvest Yield (Quintals) *</label>
        <input type="number" id="add-farm-yield" class="form-control" placeholder="e.g. 45" value="45" required />
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; margin-top:8px;">
        <i class="fas fa-check"></i> Register Farm Plot
      </button>
    </form>
  `;
  modal.classList.add('active');
};

const submitAddFarm = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const bodyData = {
    farmName: document.getElementById('add-farm-name').value,
    surveyNumber: document.getElementById('add-farm-survey').value,
    area: parseFloat(document.getElementById('add-farm-area').value),
    village: document.getElementById('add-farm-village').value,
    crop: document.getElementById('add-farm-crop').value,
    estimatedQuantity: parseFloat(document.getElementById('add-farm-yield').value)
  };

  try {
    const res = await fetch('/api/farmer/farms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Farm plot added successfully!', 'success');
      closeModal();
      loadFarmerFarmsPage();
    } else {
      showToast(result.message || 'Failed to add farm', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

const deleteFarmPlot = async (farmId) => {
  if (!confirm('Are you sure you want to remove this farm plot?')) return;
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/farmer/farms/${farmId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      showToast('Farm plot removed', 'info');
      loadFarmerFarmsPage();
    } else {
      showToast(result.message || 'Could not delete farm', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

const openAddCropModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Register New Seasonal Crop';

  body.innerHTML = `
    <form onsubmit="submitAddCrop(event)">
      <div class="form-group">
        <label class="form-label"><i class="fas fa-wheat-awn"></i> Crop Commodity *</label>
        <select id="add-crop-name" class="form-control" required>
          <option value="Wheat (Sharbati)">Wheat (Sharbati) - MSP ₹2,275/Q</option>
          <option value="Gram (Chana)">Gram (Chana) - MSP ₹5,440/Q</option>
          <option value="Mustard (Sarson)">Mustard (Sarson) - MSP ₹5,650/Q</option>
          <option value="Paddy (Basmati)">Paddy (Basmati) - MSP ₹2,183/Q</option>
          <option value="Soybean">Soybean - MSP ₹4,600/Q</option>
          <option value="Cotton">Cotton - MSP ₹6,620/Q</option>
          <option value="Maize">Maize - MSP ₹2,090/Q</option>
          <option value="Tomato">Tomato - Live Mandi Market</option>
          <option value="Onion">Onion - Live Mandi Market</option>
          <option value="Potato">Potato - Live Mandi Market</option>
        </select>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label"><i class="fas fa-calendar"></i> Season *</label>
          <select id="add-crop-season" class="form-control" required>
            <option value="Rabi 2025-26">Rabi 2025-26</option>
            <option value="Kharif 2026">Kharif 2026</option>
            <option value="Zaid 2026">Zaid 2026</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fas fa-boxes-stacked"></i> Est. Quantity (Qtl) *</label>
          <input type="number" id="add-crop-qty" class="form-control" placeholder="e.g. 50" value="50" required />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label"><i class="fas fa-calendar-day"></i> Expected Harvest Date *</label>
          <input type="date" id="add-crop-harvest" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fas fa-indian-rupee-sign"></i> Govt MSP Rate (₹/Qtl)</label>
          <input type="number" id="add-crop-msp" class="form-control" placeholder="e.g. 2275" value="2275" />
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; margin-top:8px;">
        <i class="fas fa-check-double"></i> Register Seasonal Crop
      </button>
    </form>
  `;
  modal.classList.add('active');
};

const submitAddCrop = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const cropSelect = document.getElementById('add-crop-name');
  const cropName = cropSelect.value.split(' - ')[0];

  const bodyData = {
    cropName: cropName,
    season: document.getElementById('add-crop-season').value,
    quantity: parseFloat(document.getElementById('add-crop-qty').value),
    expectedHarvestDate: document.getElementById('add-crop-harvest').value,
    supportPrice: parseFloat(document.getElementById('add-crop-msp').value) || 2275
  };

  try {
    const res = await fetch('/api/farmer/crops', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Crop registered successfully for MSP procurement!', 'success');
      closeModal();
      loadFarmerFarmsPage();
    } else {
      showToast(result.message || 'Failed to register crop', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

const deleteCropEntry = async (cropId) => {
  if (!confirm('Are you sure you want to remove this crop registration?')) return;
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/farmer/crops/${cropId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      showToast('Crop removed', 'info');
      loadFarmerFarmsPage();
    } else {
      showToast(result.message || 'Could not delete crop', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

const openEditProfileModal = async () => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/farmer/profile', { headers: { 'Authorization': `Bearer ${token}` } });
    const result = await res.json();
    const farmer = result.data || {};

    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('modal-content-slot');
    document.getElementById('modal-title').textContent = 'Update Farmer Profile & Bank Details';

    body.innerHTML = `
      <form onsubmit="submitUpdateProfile(event)">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="edit-fullname" class="form-control" value="${farmer.fullName || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Father's Name</label>
            <input type="text" id="edit-fathername" class="form-control" value="${farmer.fatherName || ''}" />
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Bank Name</label>
            <input type="text" id="edit-bankname" class="form-control" value="${farmer.bankName || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Account Number</label>
            <input type="text" id="edit-accountnumber" class="form-control" value="${farmer.accountNumber || ''}" />
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">IFSC Code</label>
            <input type="text" id="edit-ifsc" class="form-control" value="${farmer.ifscCode || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Branch Name</label>
            <input type="text" id="edit-branch" class="form-control" value="${farmer.branch || ''}" />
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Village</label>
            <input type="text" id="edit-village" class="form-control" value="${farmer.village || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Total Land Area (Acres)</label>
            <input type="number" step="0.1" id="edit-landarea" class="form-control" value="${farmer.totalLandArea || 5}" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; margin-top:8px;">
          <i class="fas fa-save"></i> Save Profile Details
        </button>
      </form>
    `;
    modal.classList.add('active');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

const submitUpdateProfile = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const bodyData = {
    fullName: document.getElementById('edit-fullname').value,
    fatherName: document.getElementById('edit-fathername').value,
    bankName: document.getElementById('edit-bankname').value,
    accountNumber: document.getElementById('edit-accountnumber').value,
    ifscCode: document.getElementById('edit-ifsc').value,
    branch: document.getElementById('edit-branch').value,
    village: document.getElementById('edit-village').value,
    totalLandArea: parseFloat(document.getElementById('edit-landarea').value) || 5
  };

  try {
    const res = await fetch('/api/farmer/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Profile updated successfully!', 'success');
      closeModal();
      loadFarmerProfilePage();
    } else {
      showToast(result.message || 'Failed to update profile', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

const openUploadDocModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Upload Verification Document';

  body.innerHTML = `
    <div style="padding:8px 0;">
      <div class="form-group">
        <label class="form-label">Document Type *</label>
        <select id="upload-doc-type" class="form-control">
          <option value="Land Record 7/12 Extract">Land Record (7/12 Extract)</option>
          <option value="Aadhaar Card Copy">Aadhaar Card Copy</option>
          <option value="Bank Passbook / Cancelled Cheque">Bank Passbook / Cancelled Cheque</option>
          <option value="Kisan Credit Card (KCC)">Kisan Credit Card (KCC)</option>
          <option value="Soil Health Card">Soil Health Card</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Select File (PDF, JPG, PNG)</label>
        <input type="file" id="upload-doc-file" class="form-control" />
      </div>
      <button type="button" class="btn btn-primary" onclick="showToast('Document uploaded and queued for officer verification!', 'success'); closeModal(); loadFarmerProfilePage();" style="width:100%; justify-content:center; padding:12px; margin-top:8px;">
        <i class="fas fa-cloud-arrow-up"></i> Upload Document
      </button>
    </div>
  `;
  modal.classList.add('active');
};

// Global Exposure
if (typeof window !== 'undefined') {
  window.loadFarmerDashboard = loadFarmerDashboard;
  window.loadFarmerFarmsPage = loadFarmerFarmsPage;
  window.loadFarmerProfilePage = loadFarmerProfilePage;
  window.openAddFarmModal = openAddFarmModal;
  window.submitAddFarm = submitAddFarm;
  window.deleteFarmPlot = deleteFarmPlot;
  window.openAddCropModal = openAddCropModal;
  window.submitAddCrop = submitAddCrop;
  window.deleteCropEntry = deleteCropEntry;
  window.openEditProfileModal = openEditProfileModal;
  window.submitUpdateProfile = submitUpdateProfile;
  window.openUploadDocModal = openUploadDocModal;
}
