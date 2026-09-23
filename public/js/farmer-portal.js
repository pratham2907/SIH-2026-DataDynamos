// Farmer Dashboard & Operations Controller

const getCropPhoto = (name = '') => {
  const n = (name || '').toLowerCase();
  if (n.includes('rice') || n.includes('paddy')) return '/images/crops/rice.jpg';
  if (n.includes('wheat')) return '/images/crops/wheat.jpg';
  if (n.includes('mustard')) return '/images/crops/mustard.jpg';
  if (n.includes('gram') || n.includes('chana')) return '/images/crops/gram.jpg';
  if (n.includes('maize')) return '/images/crops/maize.jpg';
  if (n.includes('soyabean')) return '/images/crops/soyabean.jpg';
  if (n.includes('tomato')) return '/images/crops/tomato.jpg';
  if (n.includes('potato')) return '/images/crops/potato.jpg';
  if (n.includes('onion')) return '/images/crops/onion.jpg';
  if (n.includes('peas')) return '/images/crops/peas.jpg';
  if (n.includes('cauliflower')) return '/images/crops/cauliflower.jpg';
  if (n.includes('leafy') || n.includes('vegetable')) return '/images/crops/leafyvegetables.jpg';
  if (n.includes('banana')) return '/images/crops/banana.jpg';
  if (n.includes('apple')) return '/images/crops/apple.jpg';
  if (n.includes('mango')) return '/images/crops/mango.jpg';
  if (n.includes('orange')) return '/images/crops/orange.jpg';
  if (n.includes('groundnut')) return '/images/crops/groundnut.jpg';
  if (n.includes('cotton')) return '/images/crops/cotton.jpg';
  return '/images/crops/rice.jpg';
};
window.getCropPhoto = getCropPhoto;

const getFarmerSidebar = (farmer, activeRoute = 'dashboard') => {
  const hasPlannedFutureCrop = !!(
    (window.activeForecastCache && window.activeForecastCache.cropName) ||
    window.farmerHasPlannedFutureCrop || 
    localStorage.getItem('kpms_farmer_has_future_crop') === 'true'
  );
  const plannedCropName = (window.activeForecastCache && window.activeForecastCache.cropName) || 
    localStorage.getItem('kpms_future_crop_name') || 
    'Paddy / Rice';

  const readinessPhoto = getCropPhoto(plannedCropName);

  return `
  <aside class="sp-sidebar">
    <nav class="sp-nav-list">
      <a class="sp-nav-item ${activeRoute === 'dashboard' ? 'active' : ''}" onclick="routeTo('#farmer-dashboard')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/dashboard.jpg" class="sp-nav-photo-img" alt="Dashboard" /></span>
        <span>${getT('nav_dashboard', 'Dashboard')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'smart-booking' ? 'active' : ''}" onclick="routeTo('#smart-booking')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/smart_mandi.jpg" class="sp-nav-photo-img" alt="Smart Mandi" /></span>
        <span>${getT('pillar_mandi_title', 'Smart Mandi Finder')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'book-slot' ? 'active' : ''}" onclick="routeTo('#book-slot')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/book_slot.jpg" class="sp-nav-photo-img" alt="Book Slot" /></span>
        <span>${getT('btn_book_slot', 'Book Slot')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'my-bookings' ? 'active' : ''}" onclick="routeTo('#my-bookings')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/my_bookings.jpg" class="sp-nav-photo-img" alt="My Bookings" /></span>
        <span>${getT('my_bookings', 'My Bookings')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'farmer-queue' ? 'active' : ''}" onclick="routeTo('#farmer-queue')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/queue.jpg" class="sp-nav-photo-img" alt="Live Queue" /></span>
        <span>${getT('live_queue_tracker', 'Live Queue')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'procurement-status' ? 'active' : ''}" onclick="routeTo('#procurement-status')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/procurement.jpg" class="sp-nav-photo-img" alt="Procurement Status" /></span>
        <span>${getT('status_completed', 'Procurement Status')}</span>
      </a>
      ${hasPlannedFutureCrop ? `
      <a class="sp-nav-item ${activeRoute === 'crop-readiness' ? 'active' : ''}" onclick="scrollToReadinessWidget()" id="sidebar-crop-readiness-tab">
        <span class="sp-nav-photo-badge" style="border:1.5px solid var(--saffron);"><img src="${readinessPhoto}" class="sp-nav-photo-img" alt="${plannedCropName}" /></span>
        <span>${plannedCropName} Readiness Verification</span>
      </a>
      ` : ''}
      <a class="sp-nav-item ${activeRoute === 'farmer-payments' ? 'active' : ''}" onclick="routeTo('#farmer-payments')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/payments.jpg" class="sp-nav-photo-img" alt="Payments" /></span>
        <span>${getT('dbt_tracker', 'Payments')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'kisan-sahayak' ? 'active' : ''}" onclick="openKisanFAQ()" id="sidebar-kisan-sahayak-tab">
        <span class="sp-nav-photo-badge"><img src="/images/nav/kisan_sahayak.jpg" class="sp-nav-photo-img" alt="Kisan Sahayak" /></span>
        <span>${getT('nav_kisan_sahayak', 'Kisan Sahayak')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'notifications' ? 'active' : ''}" onclick="openNotificationsModal()">
        <span class="sp-nav-photo-badge"><img src="/images/nav/notifications.jpg" class="sp-nav-photo-img" alt="Notifications" /></span>
        <span>${getT('nav_notifications', 'Notifications')}</span> <span class="sp-nav-badge" id="sp-sidebar-notif-badge">${window.unreadNotificationCount || 3}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'grievances' ? 'active' : ''}" onclick="openGrievanceModal()">
        <span class="sp-nav-photo-badge"><img src="/images/nav/grievances.jpg" class="sp-nav-photo-img" alt="Grievances" /></span>
        <span>${getT('nav_grievances', 'Grievances')}</span>
      </a>
      <a class="sp-nav-item ${activeRoute === 'farmer-profile' ? 'active' : ''}" onclick="routeTo('#farmer-profile')">
        <span class="sp-nav-photo-badge"><img src="/images/nav/profile.jpg" class="sp-nav-photo-img" alt="Profile" /></span>
        <span>${getT('kyc_profile', 'My Profile')}</span>
      </a>
    </nav>

    <!-- Sidebar Promo Card -->
    <div class="sp-promo-card">
      <div class="sp-promo-inner">
        <img src="/images/sp_farmer_promo.jpg" alt="Digital Mandi 2026" class="sp-promo-img" />
        <div class="sp-promo-title">${getT('digital_mandi_promo', 'Digital Mandi 2026')}</div>
        <p style="font-size:0.73rem; color:#4B5563; line-height:1.4; margin-bottom:10px;">
          ${getT('digital_mandi_promo_desc', 'Book slots ahead, avoid long queues at procurement centres. Get fair MSP directly in bank.')}
        </p>
        <button class="sp-promo-btn" onclick="openSihInfoModal()">${getT('btn_learn_more', 'Learn More')}</button>
      </div>
    </div>
  </aside>
`;
};
window.getFarmerSidebar = getFarmerSidebar;


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
    totalLandArea: 5,
    surveyNumber: 'SUR-482/1',
    primaryCrop: 'Wheat (Sharbati)',
    landOwnershipType: 'Owned',
    bankName: 'State Bank of India',
    accountNumber: '30294819284'
  };
  const activeBooking = data.activeBooking || null;
  const queueEntry = data.queueEntry || null;
  const stats = data.stats || {
    totalBookings: 8,
    totalEarnings: 184000,
    pendingEarnings: 48500
  };

  const hasPlannedFutureCrop = !!(
    (data && data.hasFutureCropPlan) ||
    window.farmerHasPlannedFutureCrop ||
    (localStorage.getItem('kpms_farmer_has_future_crop') === 'true')
  );

  const plannedCropName = (data && data.futureCropPlan && data.futureCropPlan.cropName) ||
    (window.activeForecastCache && window.activeForecastCache.cropName) ||
    localStorage.getItem('kpms_future_crop_name') ||
    'Paddy / Rice';

  const readinessPhoto = getCropPhoto(plannedCropName);

  const recentBookings = (data.recentBookings && data.recentBookings.length > 0)
    ? data.recentBookings
    : (JSON.parse(localStorage.getItem('kpms_recent_bookings') || 'null') || [
        {
          bookingNumber: (activeBooking && activeBooking.bookingNumber) || 'BKG-2026-081',
          centerName: (activeBooking && (activeBooking.centerName || activeBooking.centerId)) || 'Centre C - Vidisha (CTR-01)',
          date: (activeBooking && activeBooking.date) || '2026-04-12',
          timeSlot: (activeBooking && activeBooking.timeSlot) || '10:00 AM - 11:30 AM',
          crop: (activeBooking && activeBooking.crop) || farmer.primaryCrop || 'Wheat (Sharbati)',
          quantity: (activeBooking && (activeBooking.quantity || activeBooking.estimatedQuantity)) || farmer.estimatedQuantity || 50,
          status: (activeBooking && activeBooking.status) || 'Confirmed',
          tokenNumber: (queueEntry && queueEntry.tokenNumber) || 'TK-204'
        },
        {
          bookingNumber: 'BKG-2026-042',
          centerName: 'APMC Central Mandi Bhopal (CTR-02)',
          date: '2026-03-28',
          timeSlot: '11:30 AM - 01:00 PM',
          crop: 'Mustard (सरसों)',
          quantity: 24,
          status: 'Completed',
          tokenNumber: 'TK-118'
        }
      ]);

  const recentPayments = (data.recentPayments && data.recentPayments.length > 0)
    ? data.recentPayments
    : (JSON.parse(localStorage.getItem('kpms_recent_payments') || 'null') || [
        {
          transactionId: 'TXN-DBT-9840219',
          utrNumber: 'SBIN002938472918',
          amount: (stats.totalEarnings && stats.totalEarnings > 0) ? Math.min(stats.totalEarnings, 116250) : 116250,
          acceptedQuantity: 50,
          crop: farmer.primaryCrop || 'Wheat (Grade-A)',
          msp: 2275,
          bonus: 2500,
          status: 'Completed',
          paymentDate: '2026-09-11',
          bankName: farmer.bankName || 'State Bank of India',
          accountNumber: farmer.accountNumber || '30294819284'
        },
        {
          transactionId: 'TXN-DBT-8820194',
          utrNumber: 'SBIN001928374619',
          amount: 67750,
          acceptedQuantity: 24,
          crop: 'Mustard (सरसों)',
          msp: 5650,
          bonus: 0,
          status: 'Completed',
          paymentDate: '2026-03-30',
          bankName: farmer.bankName || 'State Bank of India',
          accountNumber: farmer.accountNumber || '30294819284'
        }
      ]);

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
              <i class="fas fa-leaf"></i> KPMS GOVERNMENT PORTAL &bull; Smart Agriculture
            </div>
            <h1 class="sp-hero-title">
              ${getT('hero_system_title', 'Smart Agricultural Procurement System')}
            </h1>
            <p class="sp-hero-sub">
              ${getT('hero_system_sub', 'Find the best procurement centre, book your slot, track your queue and monitor your payment — all from one platform.')}
            </p>
            <div class="sp-hero-actions">
              <button class="sp-hero-btn-primary" onclick="handleHeroFindMandi()">
                <img src="/images/nav/smart_mandi.jpg" style="width:20px; height:20px; border-radius:4px; object-fit:cover; margin-right:6px; vertical-align:middle;" alt="" /> ${getT('finder_title', 'Find Best Mandi')}
              </button>
              <button class="sp-hero-btn-secondary" onclick="routeTo('#procurement-status')" style="color:#0F5132 !important; background:#FFFFFF !important; font-weight:700 !important;">
                <i class="fas fa-users-line" style="color:#0F5132 !important; margin-right:6px;"></i> ${getT('btn_track_procurement', 'Track Procurement')}
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
                <div class="sp-floating-stat-label">${getT('hero_ontime_procurement', 'On-time Procurement')}</div>
                <div class="sp-floating-stat-val">98.4%</div>
              </div>
            </div>

            <div class="sp-floating-stat">
              <div class="sp-floating-stat-chip sp-chip-blue">
                <i class="fas fa-building-columns"></i>
              </div>
              <div>
                <div class="sp-floating-stat-label">${getT('hero_mandis_connected', 'Mandis Connected')}</div>
                <div class="sp-floating-stat-val">2,400+</div>
              </div>
            </div>

            <div class="sp-floating-stat">
              <div class="sp-floating-stat-chip sp-chip-yellow">
                <i class="fas fa-bolt"></i>
              </div>
              <div>
                <div class="sp-floating-stat-label">${getT('hero_dbt_disbursal', 'Direct Bank Transfer')}</div>
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
              <div class="sp-stat-label">${getT('stat_active_bookings', 'Active Bookings')}</div>
              <div class="sp-stat-num">${stats.totalBookings || 8}</div>
              <div class="sp-stat-change">${getT('stat_this_week', '+12% this week')}</div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-blue">
              <i class="fas fa-location-dot"></i>
            </div>
            <div>
              <div class="sp-stat-label">${getT('stat_mandis_nearby', 'Mandis Nearby')}</div>
              <div class="sp-stat-num">3</div>
              <div class="sp-stat-change" style="color:#2563EB;">${getT('stat_within_50km', 'Within 50 km')}</div>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-orange">
              <i class="fas fa-wheat-awn"></i>
            </div>
            <div>
              <div class="sp-stat-label">${getT('stat_current_stock', 'Current Stock')}</div>
              <div class="sp-stat-num">24 q</div>
              <div class="sp-stat-change" style="color:#EA580C;">${getT('stat_wheat_mustard', 'Wheat & Mustard')}</div>
            </div>
          </div>

          <!-- Card 4 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-purple">
              <i class="fas fa-clock"></i>
            </div>
            <div>
              <div class="sp-stat-label">${getT('stat_ontime_arrival', 'On-time Arrival')}</div>
              <div class="sp-stat-num">94%</div>
              <div class="sp-stat-change" style="color:#9333EA;">${getT('stat_high_reliability', 'High reliability')}</div>
            </div>
          </div>

          <!-- Card 5 -->
          <div class="sp-stat-card">
            <div class="sp-chip sp-chip-yellow">
              <i class="fas fa-indian-rupee-sign"></i>
            </div>
            <div>
              <div class="sp-stat-label">${getT('stat_total_earnings', 'Total Earnings')}</div>
              <div class="sp-stat-num">₹ ${(stats.totalEarnings || 184000).toLocaleString('en-IN')}</div>
              <div class="sp-stat-change">${getT('stat_this_season', 'This season')}</div>
            </div>
          </div>
        </section>

        <!-- Two-Column Master Content Grid -->
        <section class="sp-content-grid">
          
          <!-- LEFT COLUMN (65% width) -->
          <div class="sp-left-col">
            
            <!-- Smart Mandi Finder Interactive Card -->
            <div class="sp-card sp-finder-card" id="sp-finder-section">
              <div class="sp-finder-header">
                <div class="sp-finder-title-row">
                  <div class="sp-finder-icon-box">
                    <i class="fas fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <div class="sp-finder-title">${getT('finder_title', 'Find Best Mandi')}</div>
                    <div class="sp-finder-sub">${getT('finder_sub', 'AI-powered optimal mandi locator with live transit & queue tracking')}</div>
                  </div>
                </div>
                <span class="sp-live-pill">
                  <span class="sp-pulse-dot"></span> ${getT('live_rates', 'Live Rates')}
                </span>
              </div>

              <!-- 4 Search Form Inputs -->
              <div class="sp-finder-inputs">
                <div class="sp-input-box">
                  <label><i class="fas fa-location-dot" style="color:#0D5C3A;"></i> ${getT('your_location', 'Your Location')}</label>
                  <div class="sp-input-row">
                    <input type="text" id="sp-search-location" value="${(window.KPMS_USER_LOCATION && (window.KPMS_USER_LOCATION.city ? `${window.KPMS_USER_LOCATION.city}, ${window.KPMS_USER_LOCATION.state}` : window.KPMS_USER_LOCATION.formattedName)) || 'Bhopal, Madhya Pradesh'}" placeholder="Enter city/district" readonly style="cursor:pointer;" onclick="openLocationPickerModal()" />
                    <span class="sp-change-link" onclick="openLocationPickerModal()">${getT('btn_change', 'Change')}</span>
                  </div>
                </div>

                <div class="sp-input-box">
                  <label><i class="fas fa-seedling" style="color:#0D5C3A;"></i> ${getT('crop_type', 'Crop Type')}</label>
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
                  <label><i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> ${getT('quantity_qtl', 'Quantity (qtl)')}</label>
                  <div class="sp-input-row">
                    <input type="number" id="sp-search-quantity" value="50" min="1" max="1000" oninput="if(window.debounceMandiSearch) window.debounceMandiSearch();" />
                  </div>
                </div>

                <div class="sp-input-box">
                  <label><i class="fas fa-calendar-day" style="color:#0D5C3A;"></i> ${getT('preferred_date', 'Preferred Date')}</label>
                  <div class="sp-input-row">
                    <input type="date" id="sp-search-date" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" onchange="runSmartMandiFinderSearch(true)" />
                  </div>
                </div>
              </div>

              <!-- Search CTA Button -->
              <button class="sp-btn-find" onclick="runSmartMandiFinderSearch(false)">
                <img src="/images/nav/smart_mandi.jpg" style="width:18px; height:18px; border-radius:4px; object-fit:cover; margin-right:6px; vertical-align:middle;" alt="" /> Find Best Mandi
              </button>
            </div>

            <!-- Recommended Procurement Centres Section -->
            <div class="sp-recommend-header">
              <div class="sp-recommend-title">
                <i class="fas fa-bullseye" style="color:#0D5C3A;"></i> ${getT('recommended_centres', 'Recommended Procurement Centres')}
              </div>
              <a class="sp-view-all-link" onclick="routeTo('#smart-booking')">
                ${getT('view_all_mandis', 'View All Mandis')} <i class="fas fa-arrow-right"></i>
              </a>
            </div>

            <!-- Dynamic Recommended Centres Grid -->
            <div class="sp-centres-grid" id="sp-centres-container">
              <div style="grid-column: 1 / -1; padding: 28px 20px; text-align: center; background: #FFF; border: 1px solid #E5E7EB; border-radius: 14px;">
                <i class="fas fa-circle-notch fa-spin" style="color:#0D5C3A; font-size:1.6rem; margin-bottom:8px;"></i>
                <div style="font-weight:700; color:#111827; font-size:0.95rem;">${getT('finding_best_centres', 'Finding best procurement centres...')}</div>
                <div style="font-size:0.78rem; color:#6B7280; margin-top:3px;">${getT('finding_best_sub', 'Matching location, live mandi rates & weather transit delays')}</div>
              </div>
            </div>

            <!-- "Why these centres?" Callout Bar -->
            <div class="sp-callout-bar" style="margin-bottom:22px;">
              <div><strong>${getT('why_these_centres', 'Why these centres?')}</strong></div>
              <div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> ${getT('why_best_price', 'Best net price after transit')}</div>
              <div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> ${getT('why_lowest_wait', 'Lowest yard waiting time')}</div>
              <div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> ${getT('why_fair_grading', 'Fair grading guarantee')}</div>
            </div>

            <!-- Active Token & Booking Quick Status Card -->
            ${(() => {
              const storedBkg = JSON.parse(localStorage.getItem('kpms_last_booking') || 'null');
              const currBkg = activeBooking || storedBkg;
              const bkgNum = (queueEntry && queueEntry.tokenNumber) || (currBkg && currBkg.bookingNumber);
              const centerTitle = (currBkg && (currBkg.centerName || currBkg.centerId)) || 'APMC Central Mandi Bhopal';
              const slotTime = (currBkg && currBkg.date) ? `${currBkg.date} • ${currBkg.timeSlot || '10:00 - 10:30 AM'}` : null;
              const cropName = (currBkg && currBkg.cropName) || 'Wheat';
              const qtyVal = (currBkg && currBkg.quantity) || 50;

              if (currBkg) {
                return `
                  <div class="sp-card" style="padding:20px 24px; margin-bottom:22px; border-left:4px solid #0D5C3A; background:#FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                      <div>
                        <span class="sp-tag-badge sp-tag-green" style="font-size:0.75rem; margin-bottom:6px; display:inline-block;">
                          <i class="fas fa-circle-check"></i> ${getT('active_procurement_token', 'Active Procurement Token')}
                        </span>
                        <h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:2px 0;">
                          ${cropName} (${qtyVal} Q) &bull; Token #${bkgNum || 'BKG-2026-001'}
                        </h4>
                        <div style="font-size:0.82rem; color:#4B5563; margin-top:3px;">
                          <i class="fas fa-location-dot" style="color:#0D5C3A;"></i> ${centerTitle} &bull; <i class="fas fa-clock" style="color:#0D5C3A;"></i> ${slotTime || 'Scheduled Slot'}
                        </div>
                      </div>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary btn-sm" onclick="routeTo('#farmer-queue')" style="font-weight:700;">
                          <i class="fas fa-users-rays"></i> ${getT('track_live_queue', 'Track Live Queue')}
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="routeTo('#my-bookings')">
                          <i class="fas fa-qrcode"></i> ${getT('view_qr_pass', 'View QR Pass')}
                        </button>
                      </div>
                    </div>
                    <div style="display:flex; gap:16px; flex-wrap:wrap; background:#FAF6EF; padding:12px 16px; border-radius:10px; font-size:0.8rem; color:#4B5563;">
                      <div><strong style="color:#111827;">${getT('lbl_gate_entry', 'Gate Entry:')}</strong> Counter Gate 2</div>
                      <div><strong style="color:#111827;">${getT('lbl_expected_weighment', 'Expected Weighment:')}</strong> Weighbridge #3</div>
                      <div><strong style="color:#111827;">${getT('lbl_estimated_payout', 'Estimated Payout:')}</strong> ₹${(qtyVal * 2425).toLocaleString('en-IN')} (MSP ₹2,425/Q)</div>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="sp-card" style="padding:18px 22px; margin-bottom:22px; background:linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%); border:1px solid #DCFCE7;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                      <div style="display:flex; align-items:center; gap:14px;">
                        <div style="width:42px; height:42px; border-radius:50%; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
                          <i class="fas fa-ticket-simple"></i>
                        </div>
                        <div>
                          <strong style="font-size:0.95rem; color:#111827; display:block;">${getT('no_token_today', 'No Active Procurement Token Today')}</strong>
                          <span style="font-size:0.8rem; color:#4B5563;">${getT('no_token_today_desc', 'Book your arrival slot in advance to avoid mandi gate queues and secure guaranteed MSP weighment.')}</span>
                        </div>
                      </div>
                      <button class="btn btn-primary btn-sm" onclick="routeTo('#book-slot')" style="font-weight:700; white-space:nowrap;">
                        <i class="fas fa-calendar-plus"></i> ${getT('btn_book_slot_now', 'Book Slot Now')}
                      </button>
                    </div>
                  </div>
                `;
              }
            })()}

            <!-- Live Market MSP & Mandi Rates Ticker Card -->
            <div class="sp-card" style="padding:22px 24px; margin-bottom:22px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(13,92,58,0.1); color:#0D5C3A; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div>
                    <h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">${getT('live_apmc_rates', 'Live APMC Market Rates • MSP Benchmark')}</h4>
                    <span style="font-size:0.78rem; color:#6B7280;">${getT('live_apmc_sub', 'Real-time Agmarknet mandi terminal rates & central MSP floor prices')}</span>
                  </div>
                </div>
                <a class="sp-view-all-link" onclick="routeTo('#mandi-prices')" style="font-size:0.82rem; font-weight:700;">
                  ${getT('full_price_board', 'Full Mandi Price Board')} <i class="fas fa-arrow-right"></i>
                </a>
              </div>

              <!-- Rates Table -->
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
                  <thead>
                    <tr style="border-bottom:2px solid #E5E2DC; color:#4B5563; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">
                      <th style="padding:10px 8px;">${getT('col_commodity', 'Commodity')}</th>
                      <th style="padding:10px 8px;">${getT('col_faq_grade', 'FAQ Grade')}</th>
                      <th style="padding:10px 8px;">${getT('col_msp_rate', 'MSP Rate')}</th>
                      <th style="padding:10px 8px;">${getT('col_modal_rate', 'Modal Mandi Rate')}</th>
                      <th style="padding:10px 8px;">${getT('col_difference', 'Difference')}</th>
                      <th style="padding:10px 8px; text-align:right;">${getT('col_arrival_status', 'Arrival Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 8px; font-weight:700; color:#111827;"><img src="/images/crops/wheat.jpg" alt="Wheat" style="width:24px; height:24px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px; border:1px solid #E5E7EB; box-shadow:0 1px 3px rgba(0,0,0,0.1);" /> Wheat (गेहूं)</td>
                      <td style="padding:12px 8px; color:#4B5563;">Grade-A (Fair Avg)</td>
                      <td style="padding:12px 8px; font-weight:700; color:#0D5C3A;">₹2,425 / Q</td>
                      <td style="padding:12px 8px; font-weight:800; color:#111827;">₹2,450 / Q</td>
                      <td style="padding:12px 8px; color:#16A34A; font-weight:700;">+₹25 / Q <i class="fas fa-arrow-up"></i></td>
                      <td style="padding:12px 8px; text-align:right;"><span class="sp-tag-badge sp-tag-green">${getT('badge_heavy_intake', 'Heavy Intake')}</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 8px; font-weight:700; color:#111827;"><img src="/images/crops/gram.jpg" alt="Gram" style="width:24px; height:24px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px; border:1px solid #E5E7EB; box-shadow:0 1px 3px rgba(0,0,0,0.1);" /> Gram / Chana (चना)</td>
                      <td style="padding:12px 8px; color:#4B5563;">FAQ Standard</td>
                      <td style="padding:12px 8px; font-weight:700; color:#0D5C3A;">₹5,440 / Q</td>
                      <td style="padding:12px 8px; font-weight:800; color:#111827;">₹5,520 / Q</td>
                      <td style="padding:12px 8px; color:#16A34A; font-weight:700;">+₹80 / Q <i class="fas fa-arrow-up"></i></td>
                      <td style="padding:12px 8px; text-align:right;"><span class="sp-tag-badge sp-tag-blue">${getT('badge_normal_intake', 'Normal Intake')}</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 8px; font-weight:700; color:#111827;"><img src="/images/crops/mustard.jpg" alt="Mustard" style="width:24px; height:24px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px; border:1px solid #E5E7EB; box-shadow:0 1px 3px rgba(0,0,0,0.1);" /> Mustard (सरसों)</td>
                      <td style="padding:12px 8px; color:#4B5563;">42% Oil Content</td>
                      <td style="padding:12px 8px; font-weight:700; color:#0D5C3A;">₹5,650 / Q</td>
                      <td style="padding:12px 8px; font-weight:800; color:#111827;">₹5,710 / Q</td>
                      <td style="padding:12px 8px; color:#16A34A; font-weight:700;">+₹60 / Q <i class="fas fa-arrow-up"></i></td>
                      <td style="padding:12px 8px; text-align:right;"><span class="sp-tag-badge sp-tag-green">${getT('badge_high_demand', 'High Demand')}</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #F3F4F6;">
                      <td style="padding:12px 8px; font-weight:700; color:#111827;"><img src="/images/crops/soyabean.jpg" alt="Soybean" style="width:24px; height:24px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px; border:1px solid #E5E7EB; box-shadow:0 1px 3px rgba(0,0,0,0.1);" /> Soybean (सोयाबीन)</td>
                      <td style="padding:12px 8px; color:#4B5563;">Yellow Standard</td>
                      <td style="padding:12px 8px; font-weight:700; color:#0D5C3A;">₹4,892 / Q</td>
                      <td style="padding:12px 8px; font-weight:800; color:#111827;">₹4,910 / Q</td>
                      <td style="padding:12px 8px; color:#16A34A; font-weight:700;">+₹18 / Q <i class="fas fa-arrow-up"></i></td>
                      <td style="padding:12px 8px; text-align:right;"><span class="sp-tag-badge sp-tag-orange">${getT('badge_moderate', 'Moderate')}</span></td>
                    </tr>
                    <tr>
                      <td style="padding:12px 8px; font-weight:700; color:#111827;"><img src="/images/crops/rice.jpg" alt="Paddy" style="width:24px; height:24px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px; border:1px solid #E5E7EB; box-shadow:0 1px 3px rgba(0,0,0,0.1);" /> Paddy / Dhan (धान)</td>
                      <td style="padding:12px 8px; color:#4B5563;">Common Grade</td>
                      <td style="padding:12px 8px; font-weight:700; color:#0D5C3A;">₹2,320 / Q</td>
                      <td style="padding:12px 8px; font-weight:800; color:#111827;">₹2,360 / Q</td>
                      <td style="padding:12px 8px; color:#16A34A; font-weight:700;">+₹40 / Q <i class="fas fa-arrow-up"></i></td>
                      <td style="padding:12px 8px; text-align:right;"><span class="sp-tag-badge sp-tag-green">${getT('badge_active_mandi', 'Active Mandi')}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Kisan Quick Actions Grid (Crisp 4-Col Row on Desktop, 2x2 on Tablet, 1-Col on Mobile) -->
            <div class="sp-quick-actions-grid">
              <div class="sp-card sp-quick-action-card" onclick="routeTo('#book-slot')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="sp-qa-icon-box" style="background:#DCFCE7; color:#16A34A;">
                    <i class="fas fa-calendar-plus"></i>
                  </div>
                  <div>
                    <strong style="font-size:0.88rem; color:#111827; display:block;">${getT('btn_book_preferred_slot', 'Book Preferred Slot')}</strong>
                    <span style="font-size:0.75rem; color:#6B7280;">${getT('sub_pre_reserve', 'Pre-reserve mandi arrival')}</span>
                  </div>
                </div>
              </div>

              <div class="sp-card sp-quick-action-card" onclick="routeTo('#farmer-queue')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="sp-qa-icon-box" style="background:#DBEAFE; color:#2563EB;">
                    <i class="fas fa-users-line"></i>
                  </div>
                  <div>
                    <strong style="font-size:0.88rem; color:#111827; display:block;">${getT('btn_live_queue_pos', 'Live Queue Position')}</strong>
                    <span style="font-size:0.75rem; color:#6B7280;">${getT('sub_realtime_token', 'Real-time token caller')}</span>
                  </div>
                </div>
              </div>

              <div class="sp-card sp-quick-action-card" onclick="routeTo('#farmer-payments')">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="sp-qa-icon-box" style="background:#FEF3C7; color:#D97706;">
                    <i class="fas fa-building-columns"></i>
                  </div>
                  <div>
                    <strong style="font-size:0.88rem; color:#111827; display:block;">${getT('btn_dbt_ledger', 'DBT Payment Ledger')}</strong>
                    <span style="font-size:0.75rem; color:#6B7280;">${getT('sub_dbt_status', 'Direct bank transfer status')}</span>
                  </div>
                </div>
              </div>

              <div class="sp-card sp-quick-action-card" onclick="if(typeof openContactModal==='function') openContactModal();">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="sp-qa-icon-box" style="background:#F3E8FF; color:#9333EA;">
                    <i class="fas fa-headset"></i>
                  </div>
                  <div>
                    <strong style="font-size:0.88rem; color:#111827; display:block;">${getT('btn_kisan_helpline', 'Kisan Helpline')}</strong>
                    <span style="font-size:0.75rem; color:#6B7280;">${getT('sub_toll_free', 'Toll-Free 1800-180-1551')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 1: Recent Slot Bookings & Digital Mandi Passes -->
            <div class="sp-card" style="padding:22px 24px; margin-bottom:22px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(13,92,58,0.1); color:#0D5C3A; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                    <i class="fas fa-calendar-check"></i>
                  </div>
                  <div>
                    <h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">${getT('recent_bookings_title', 'Recent Slot Bookings & Digital Passes')}</h4>
                    <span style="font-size:0.78rem; color:#6B7280;">${getT('recent_bookings_sub', 'Confirmed mandi arrivals, electronic token caller and gate check-in passes')}</span>
                  </div>
                </div>
                <a class="sp-view-all-link" onclick="routeTo('#my-bookings')" style="font-size:0.82rem; font-weight:700; cursor:pointer;">
                  ${getT('view_all_bookings', 'View All Bookings')} (${recentBookings.length}) <i class="fas fa-arrow-right"></i>
                </a>
              </div>

              <!-- Bookings Table -->
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
                  <thead>
                    <tr style="border-bottom:2px solid #E5E2DC; color:#4B5563; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">
                      <th style="padding:10px 8px;">${getT('col_pass_token', 'Pass / Token')}</th>
                      <th style="padding:10px 8px;">${getT('col_mandi', 'Procurement Mandi')}</th>
                      <th style="padding:10px 8px;">Arrival Window</th>
                      <th style="padding:10px 8px;">Commodity &amp; Qty</th>
                      <th style="padding:10px 8px;">${getT('col_status', 'Status')}</th>
                      <th style="padding:10px 8px; text-align:right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentBookings.map((b, idx) => `
                      <tr style="border-bottom:${idx === recentBookings.length - 1 ? 'none' : '1px solid #F3F4F6'};">
                        <td style="padding:12px 8px;">
                          <div style="font-weight:800; color:#0D5C3A; display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-qrcode"></i> ${b.tokenNumber || b.bookingNumber || `BKG-2026-0${idx + 1}`}
                          </div>
                          <div style="font-size:0.72rem; color:#6B7280;">ID: ${b.bookingNumber || 'BKG-2026'}</div>
                        </td>
                        <td style="padding:12px 8px; font-weight:600; color:#111827;">
                          ${b.centerName || b.centerId || 'APMC Central Mandi'}
                        </td>
                        <td style="padding:12px 8px; color:#4B5563;">
                          <i class="far fa-calendar" style="margin-right:4px; color:#0D5C3A;"></i> ${b.date || 'Today'}
                          <div style="font-size:0.74rem; color:#6B7280;">${b.timeSlot || '10:00 - 11:30 AM'}</div>
                        </td>
                        <td style="padding:12px 8px; font-weight:700; color:#111827;">
                          ${b.crop || 'Wheat'} <span style="font-size:0.78rem; font-weight:600; color:#0D5C3A;">(${b.quantity || b.estimatedQuantity || 50} Q)</span>
                        </td>
                        <td style="padding:12px 8px;">
                          <span class="sp-tag-badge ${b.status === 'Completed' ? 'sp-tag-blue' : (b.status === 'Cancelled' ? 'sp-tag-orange' : 'sp-tag-green')}">
                            <i class="fas ${b.status === 'Completed' ? 'fa-check-double' : (b.status === 'Cancelled' ? 'fa-xmark' : 'fa-circle-check')}"></i> ${b.status || 'Confirmed'}
                          </span>
                        </td>
                        <td style="padding:12px 8px; text-align:right; white-space:nowrap;">
                          <button class="btn btn-outline btn-sm" onclick="if(typeof openBookingQRModal==='function') openBookingQRModal('${b.bookingNumber}'); else routeTo('#my-bookings');" style="padding:4px 10px; font-size:0.75rem; font-weight:700; border-color:#0D5C3A; color:#0D5C3A; margin-right:4px;">
                            <i class="fas fa-qrcode"></i> Digital Pass
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section 2: Direct Benefit Transfer (DBT) & Treasury Remittances -->
            <div class="sp-card" style="padding:22px 24px; margin-bottom:22px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(22,163,74,0.12); color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                    <i class="fas fa-indian-rupee-sign"></i>
                  </div>
                  <div>
                    <h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">${getT('dbt_bank_remittances', 'Direct Benefit Transfer (DBT) • Bank Remittances')}</h4>
                    <span style="font-size:0.78rem; color:#6B7280;">${getT('dbt_remittances_sub', 'Real-time treasury disbursements, PFMS transaction tracking and J-Form vouchers')}</span>
                  </div>
                </div>
                <a class="sp-view-all-link" onclick="routeTo('#farmer-payments')" style="font-size:0.82rem; font-weight:700; cursor:pointer;">
                  ${getT('full_payment_ledger', 'Full Payment Ledger')} <i class="fas fa-arrow-right"></i>
                </a>
              </div>

              <!-- DBT Summary Mini-Cards Strip -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:16px;">
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:10px 14px;">
                  <span style="font-size:0.72rem; color:#166534; font-weight:700; text-transform:uppercase;">${getT('total_credited_msp', 'Total Credited (MSP)')}</span>
                  <div style="font-size:1.2rem; font-weight:800; color:#15803D; margin-top:2px;">₹ ${(stats.totalEarnings || 116250).toLocaleString('en-IN')}</div>
                  <span style="font-size:0.7rem; color:#166534;"><i class="fas fa-circle-check"></i> ${getT('pfms_disbursed', '100% PFMS Disbursed')}</span>
                </div>
                <div style="background:#FEF3C7; border:1px solid #FDE68A; border-radius:10px; padding:10px 14px;">
                  <span style="font-size:0.72rem; color:#92400E; font-weight:700; text-transform:uppercase;">${getT('in_treasury_processing', 'In-Treasury Processing')}</span>
                  <div style="font-size:1.2rem; font-weight:800; color:#B45309; margin-top:2px;">₹ ${(stats.pendingEarnings || 0).toLocaleString('en-IN')}</div>
                  <span style="font-size:0.7rem; color:#92400E;"><i class="fas fa-clock"></i> 48-72h Direct Transfer</span>
                </div>
                <div style="background:#F3F4F6; border:1px solid #E5E7EB; border-radius:10px; padding:10px 14px;">
                  <span style="font-size:0.72rem; color:#4B5563; font-weight:700; text-transform:uppercase;">${getT('col_bank_account', 'Verified Bank Account')}</span>
                  <div style="font-size:0.95rem; font-weight:800; color:#111827; margin-top:4px;">${farmer.bankName || 'State Bank of India'}</div>
                  <span style="font-size:0.7rem; color:#6B7280;">A/C: ****${String(farmer.accountNumber || '1234').slice(-4)} • Aadhaar Linked</span>
                </div>
              </div>

              <!-- Payments Table -->
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
                  <thead>
                    <tr style="border-bottom:2px solid #E5E2DC; color:#4B5563; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">
                      <th style="padding:10px 8px;">UTR / Voucher No.</th>
                      <th style="padding:10px 8px;">Commodity &amp; Qty</th>
                      <th style="padding:10px 8px;">MSP Rate</th>
                      <th style="padding:10px 8px;">Net Amount</th>
                      <th style="padding:10px 8px;">Transfer Status</th>
                      <th style="padding:10px 8px; text-align:right;">Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentPayments.map((p, idx) => `
                      <tr style="border-bottom:${idx === recentPayments.length - 1 ? 'none' : '1px solid #F3F4F6'};">
                        <td style="padding:12px 8px;">
                          <strong style="color:#111827; display:block; font-size:0.85rem;">${p.utrNumber || p.transactionId || 'PFMS00829148'}</strong>
                          <span style="font-size:0.72rem; color:#6B7280;"><i class="far fa-calendar-check"></i> ${p.paymentDate || 'Recent'}</span>
                        </td>
                        <td style="padding:12px 8px; color:#111827; font-weight:600;">
                          ${p.crop || 'Wheat (Grade-A)'}
                          <div style="font-size:0.74rem; color:#6B7280;">${p.acceptedQuantity || 50} Quintals</div>
                        </td>
                        <td style="padding:12px 8px; font-weight:700; color:#0D5C3A;">
                          ₹${p.msp || 2275} / Q
                        </td>
                        <td style="padding:12px 8px; font-weight:800; color:#15803D; font-size:0.95rem;">
                          ₹${(p.amount || 116250).toLocaleString('en-IN')}
                        </td>
                        <td style="padding:12px 8px;">
                          <span class="sp-tag-badge sp-tag-green">
                            <i class="fas fa-check-circle"></i> ${getT('dbt_credited_badge', 'Direct DBT Credited')}
                          </span>
                        </td>
                        <td style="padding:12px 8px; text-align:right;">
                          <button class="btn btn-outline btn-sm" onclick="showToast('J-Form digital receipt downloaded successfully!', 'success');" style="padding:4px 10px; font-size:0.75rem; font-weight:700;">
                            <i class="fas fa-file-invoice"></i> ${getT('download_jform', 'J-Form')}
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section 3: Registered Land & Harvest Declaration (Khasra / 7-12) -->
            <div class="sp-card" style="padding:22px 24px; margin-bottom:22px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(37,99,235,0.1); color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                    <i class="fas fa-id-card-clip"></i>
                  </div>
                  <div>
                    <h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">${getT('land_record_title', 'Land Record & Crop Inward Declaration (Khasra 7/12)')}</h4>
                    <span style="font-size:0.78rem; color:#6B7280;">${getT('land_record_sub', 'Government verified cadastral parcel records and central procurement quota')}</span>
                  </div>
                </div>
                <a class="sp-view-all-link" onclick="routeTo('#farmer-farms')" style="font-size:0.82rem; font-weight:700; cursor:pointer;">
                  ${getT('manage_land_records', 'Manage Land Records')} <i class="fas fa-arrow-right"></i>
                </a>
              </div>

              <!-- 4-Box Metrics Grid -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:16px;">
                <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:12px 14px;">
                  <span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">${getT('lbl_survey_no', 'Survey / Gat Number')}</span>
                  <div style="font-size:1.05rem; font-weight:800; color:#111827; margin-top:2px;">${farmer.surveyNumber || 'SUR-482/1'}</div>
                  <span style="font-size:0.72rem; color:#4B5563;"><i class="fas fa-location-dot"></i> Village ${farmer.village || 'Ratibad'}, ${farmer.district || 'Bhopal'}</span>
                </div>
                <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:12px 14px;">
                  <span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">${getT('lbl_cultivated_area', 'Total Cultivated Area')}</span>
                  <div style="font-size:1.05rem; font-weight:800; color:#111827; margin-top:2px;">${farmer.totalLandArea || 5.0} Acres</div>
                  <span style="font-size:0.72rem; color:#16A34A; font-weight:600;"><i class="fas fa-check"></i> ${farmer.landOwnershipType || 'Owned'} Title Deed</span>
                </div>
                <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:12px 14px;">
                  <span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">${getT('lbl_sown_crop', 'Declared Sown Crop')}</span>
                  <div style="font-size:1.05rem; font-weight:800; color:#111827; margin-top:2px;">${farmer.primaryCrop || 'Wheat (Sharbati)'}</div>
                  <span style="font-size:0.72rem; color:#4B5563;">Harvest Est: <strong>${farmer.estimatedQuantity || 50} Q</strong></span>
                </div>
                <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:12px 14px;">
                  <span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">${getT('lbl_kyc_verification', 'KYC & Verification')}</span>
                  <div style="font-size:0.95rem; font-weight:800; color:#15803D; margin-top:4px;">
                    <i class="fas fa-shield-check"></i> ${getT('badge_approved', '100% Approved')}
                  </div>
                  <span style="font-size:0.72rem; color:#0D5C3A;">${getT('badge_aadhaar_verified', 'Aadhaar & Bank Verified')}</span>
                </div>
              </div>

              <!-- Quick action bar -->
              <div style="display:flex; justify-content:space-between; align-items:center; background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:10px 16px; flex-wrap:wrap; gap:10px;">
                <div style="font-size:0.8rem; color:#4B5563;">
                  <i class="fas fa-file-pdf" style="color:#DC2626; margin-right:6px;"></i> ${getT('official_record_verified', 'Official 7/12 Land Record Extract on file (Uploaded: Verified)')}
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-outline btn-sm" onclick="routeTo('#farmer-farms')" style="font-weight:700; font-size:0.78rem;">
                    <i class="fas fa-plus"></i> ${getT('btn_declare_crop', 'Declare Additional Crop')}
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="routeTo('#book-slot')" style="font-weight:700; font-size:0.78rem;">
                    <i class="fas fa-calendar-plus"></i> ${getT('btn_book_delivery_slot', 'Book Delivery Slot')}
                  </button>
                </div>
              </div>
            </div>

            <!-- Section 4: AI Post-Harvest Care & Mandi Transit Advisory -->
            <div class="sp-card" style="padding:22px 24px; margin-bottom:22px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(234,88,12,0.12); color:#EA580C; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                    <i class="fas fa-robot"></i>
                  </div>
                  <div>
                    <h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">${getT('kisan_ai_advisory', 'Kisan AI Advisory • Moisture & Mandi Transit Guide')}</h4>
                    <span style="font-size:0.78rem; color:#6B7280;">${getT('kisan_ai_sub', 'Automated algorithmic recommendations based on live weather and mandi terminal influx')}</span>
                  </div>
                </div>
                <span class="sp-live-pill" style="font-size:0.72rem; padding:3px 10px;">
                  <span class="sp-pulse-dot"></span> ${getT('badge_active_advisory', 'Active Advisory')}
                </span>
              </div>

              <!-- 3 Advisory Cards Row -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:14px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#166534; font-weight:700; font-size:0.85rem;">
                    <i class="fas fa-droplet" style="color:#16A34A;"></i> ${getT('adv_moisture_title', 'Moisture Management')}
                  </div>
                  <p style="font-size:0.78rem; color:#1F2937; line-height:1.45; margin:0;">
                    Current humidity in Vidisha is <strong>42%</strong>. Sun-dry harvested grains for 3 hours before bagging to keep moisture &le; 12.0% for 0% price dockage.
                  </p>
                </div>

                <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:14px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#1E40AF; font-weight:700; font-size:0.85rem;">
                    <i class="fas fa-truck-ramp-box" style="color:#2563EB;"></i> ${getT('adv_fastlane_title', 'Dedicated Fast-Track Lane')}
                  </div>
                  <p style="font-size:0.78rem; color:#1F2937; line-height:1.45; margin:0;">
                    Farmers with a pre-booked digital QR pass enter via <strong>Gate 2 Dedicated Fast Lane</strong>, reducing mandi turn-around time to under 25 minutes.
                  </p>
                </div>

                <div style="background:#FEF3C7; border:1px solid #FDE68A; border-radius:10px; padding:14px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#92400E; font-weight:700; font-size:0.85rem;">
                    <i class="fas fa-scale-balanced" style="color:#D97706;"></i> ${getT('adv_msp_title', '100% Minimum Support Price')}
                  </div>
                  <p style="font-size:0.78rem; color:#1F2937; line-height:1.45; margin:0;">
                    Central Government MSP guarantee: Direct electronic weighbridge slip with tamper-proof printout and SMS confirmation upon weighment.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN (35% width) -->
          <div class="sp-right-col">
            
            <!-- Widget 1: Your Procurement Journey -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-route" style="color:#0D5C3A;"></i> ${getT('procurement_journey_title', 'Your Procurement Journey')}
                </div>
                <a class="sp-widget-link" onclick="routeTo('#farmer-queue')">View Details &gt;</a>
              </div>

              <div class="sp-timeline-container">
                <div class="sp-timeline-line"></div>

                ${(() => {
                  const storedBkg = JSON.parse(localStorage.getItem('kpms_last_booking') || 'null');
                  const currBkg = activeBooking || storedBkg;
                  const hasBkg = !!currBkg;
                  const hasToken = !!(queueEntry || (currBkg && currBkg.bookingNumber));
                  const bkgNum = (queueEntry && queueEntry.tokenNumber) || (currBkg && currBkg.bookingNumber) || 'BKG-2026-081';
                  const centerTitle = (currBkg && (currBkg.centerName || currBkg.centerId)) || 'Centre C - Vidisha';
                  const slotTime = (currBkg && currBkg.date) ? `${currBkg.date} • ${currBkg.timeSlot || '10:00 AM'}` : '12 Apr 2026 • 10:00 - 11:30 AM';

                  return `
                    <!-- Step 1: Centre Selection -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node ${hasBkg ? 'sp-node-completed' : 'sp-node-inprogress'}">
                        ${hasBkg ? '<i class="fas fa-check"></i>' : '<i class="fas fa-location-dot"></i>'}
                      </div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_centre_selection', '1. Centre Selection')}</span>
                        <span class="sp-step-pill ${hasBkg ? 'sp-pill-completed' : 'sp-pill-inprogress'}">${hasBkg ? 'Completed' : 'In Progress'}</span>
                      </div>
                      <div class="sp-step-time">${hasBkg ? `${centerTitle} selected` : 'Select best mandi below'}</div>
                    </div>

                    <!-- Step 2: Slot Booking -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node ${hasBkg ? 'sp-node-completed' : 'sp-node-pending'}">
                        ${hasBkg ? '<i class="fas fa-check"></i>' : '2'}
                      </div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_slot_booking', '2. Slot Booking')}</span>
                        <span class="sp-step-pill ${hasBkg ? 'sp-pill-completed' : 'sp-pill-pending'}">${hasBkg ? 'Confirmed' : 'Upcoming'}</span>
                      </div>
                      <div class="sp-step-time">${hasBkg ? slotTime : 'Pre-book arrival window'}</div>
                    </div>

                    <!-- Step 3: Digital Token -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node ${hasToken ? 'sp-node-completed' : 'sp-node-pending'}">
                        ${hasToken ? '<i class="fas fa-check"></i>' : '3'}
                      </div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_digital_pass', '3. Digital QR Pass')}</span>
                        <span class="sp-step-pill ${hasToken ? 'sp-pill-completed' : 'sp-pill-pending'}">${hasToken ? 'Pass Active' : 'Upcoming'}</span>
                      </div>
                      <div class="sp-step-time">${hasToken ? `Pass #${bkgNum} issued` : 'Digital token with QR code'}</div>
                    </div>

                    <!-- Step 4: Gate Entry -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node ${queueEntry && (queueEntry.status === 'called' || queueEntry.status === 'processing') ? 'sp-node-inprogress' : 'sp-node-pending'}">
                        ${queueEntry && (queueEntry.status === 'called' || queueEntry.status === 'processing') ? '<i class="fas fa-arrow-right"></i>' : '4'}
                      </div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_gate_entry', '4. Gate Entry')}</span>
                        <span class="sp-step-pill ${queueEntry && queueEntry.status === 'called' ? 'sp-pill-inprogress' : 'sp-pill-pending'}">${queueEntry && queueEntry.status === 'called' ? 'In Progress' : 'Upcoming'}</span>
                      </div>
                      <div class="sp-step-time">${queueEntry && queueEntry.status === 'called' ? 'Proceed to Gate 2 • QR Verified' : 'Scan QR pass upon physical arrival'}</div>
                    </div>

                    <!-- Step 5: Quality Testing -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node sp-node-pending">5</div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_quality_testing', '5. Quality Testing')}</span>
                        <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                      </div>
                      <div class="sp-step-time">Moisture & purity evaluation</div>
                    </div>

                    <!-- Step 6: Weighment -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node sp-node-pending">6</div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_weighment', '6. Weighment')}</span>
                        <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                      </div>
                      <div class="sp-step-time">Gross & tare electronic scale</div>
                    </div>

                    <!-- Step 7: J-Form Receipt -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node sp-node-pending">7</div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_jform_receipt', '7. J-Form Receipt')}</span>
                        <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                      </div>
                      <div class="sp-step-time">Digital signed procurement slip</div>
                    </div>

                    <!-- Step 8: DBT Payment -->
                    <div class="sp-timeline-step">
                      <div class="sp-timeline-node sp-node-pending">8</div>
                      <div class="sp-step-header">
                        <span class="sp-step-name">${getT('step_dbt_payment', '8. DBT Payment')}</span>
                        <span class="sp-step-pill sp-pill-pending">Upcoming</span>
                      </div>
                      <div class="sp-step-time">Direct bank transfer (48-72h)</div>
                    </div>
                  `;
                })()}
              </div>
            </div>

            <!-- Widget 2: Weather - Vidisha -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-location-dot" style="color:#0D5C3A;"></i> ${getT('weather_widget_title', 'Weather - Vidisha')}
                </div>
                <span style="font-size:0.75rem; color:#6B7280; font-weight:600;">Clear & Sunny</span>
              </div>

              <div class="sp-weather-main">
                <i class="fas fa-sun sp-weather-sun"></i>
                <div>
                  <div class="sp-weather-temp">31°C</div>
                  <div class="sp-weather-cond">${getT('weather_ideal', 'Ideal transit conditions')}</div>
                </div>
              </div>

              <div class="sp-weather-metrics">
                Humidity: <strong>42%</strong> &bull; Wind: <strong>12 km/h</strong> &bull; Rain: <strong>0%</strong>
              </div>

              <!-- 5-Day Mini Forecast Strip -->
              <div class="sp-forecast-strip">
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">${getT('forecast_today', 'Today')}</span>
                  <i class="fas fa-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">31°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">${getT('forecast_tue', 'Tue')}</span>
                  <i class="fas fa-cloud-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">32°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">${getT('forecast_wed', 'Wed')}</span>
                  <i class="fas fa-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">30°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">${getT('forecast_thu', 'Thu')}</span>
                  <i class="fas fa-cloud-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">29°</span>
                </div>
                <div class="sp-forecast-day">
                  <span class="sp-forecast-name">${getT('forecast_fri', 'Fri')}</span>
                  <i class="fas fa-sun sp-forecast-icon"></i>
                  <span class="sp-forecast-temp">31°</span>
                </div>
              </div>
            </div>

            <!-- Widget 3: Nearby Mandis Interactive Map -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-map-marked-alt" style="color:#0D5C3A;"></i> ${getT('nearby_mandis_title', 'Nearby Mandis')}
                </div>
                <a class="sp-widget-link" onclick="routeTo('#smart-booking')">${getT('view_on_map', 'View on Map')} &gt;</a>
              </div>

              <div id="sp-nearby-map" class="sp-mini-map-box"></div>
              
              <div id="sp-nearby-dist-pills" style="font-size:0.74rem; color:#4B5563; font-weight:600; margin-top:10px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
                <span><i class="fas fa-circle" style="color:#0D5C3A; font-size:0.65rem;"></i> Vidisha (28 km)</span>
                <span><i class="fas fa-circle" style="color:#2563EB; font-size:0.65rem;"></i> Bhopal (12 km)</span>
                <span><i class="fas fa-circle" style="color:#EA580C; font-size:0.65rem;"></i> Sehore (65 km)</span>
              </div>
            </div>

            <!-- Widget 4: Notifications List -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="far fa-bell" style="color:#0D5C3A;"></i> ${getT('notifications_title', 'Notifications')}
                </div>
                <a class="sp-widget-link" onclick="openNotificationsModal()">View All &gt;</a>
              </div>

              <div class="sp-notif-list" id="sp-dashboard-notif-list">
                ${(window.spNotifications || [
                  { id: 'notif-1', title: 'Slot Confirmed - Vidisha Terminal', time: '2h ago', desc: 'Wheat (50 Q) confirmed for 12 Apr 2026. Pass #TK-204 ready.', chipClass: 'sp-chip-green', icon: 'fa-check' },
                  { id: 'notif-2', title: 'Token #TK-204 Called', time: '4h ago', desc: 'Gate 2 cleared for weighbridge electronic scale.', chipClass: 'sp-chip-blue', icon: 'fa-ticket-alt' },
                  { id: 'notif-3', title: 'DBT Processed ₹48,500', time: '1d ago', desc: 'PFMS UTR SBIN48291 credited into bank account.', chipClass: 'sp-chip-orange', icon: 'fa-indian-rupee-sign' }
                ]).slice(0, 3).map(n => `
                  <div class="sp-notif-item" onclick="handleNotificationClick('${n.id}')" style="cursor:pointer;" title="Click to view details">
                    <div class="sp-notif-icon ${n.chipClass}">
                      <i class="fas ${n.icon}"></i>
                    </div>
                    <div class="sp-notif-content">
                      <div class="sp-notif-title-row">
                        <span class="sp-notif-title">${n.title}</span>
                        <span class="sp-notif-time">${n.time}</span>
                      </div>
                      <div class="sp-notif-desc">${n.desc}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Widget 5: Mandi Helpdesk & Operations -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-headset" style="color:#0D5C3A;"></i> ${getT('mandi_ops_title', 'Mandi Operations & Support')}
                </div>
                <span class="sp-live-pill" style="font-size:0.7rem; padding:2px 8px;">
                  <span class="sp-pulse-dot"></span> ${getT('live_helpdesk', 'Live Helpdesk')}
                </span>
              </div>

              <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:12px 14px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:0.75rem; color:#6B7280; font-weight:600;">${getT('operating_hours', 'Yard Operating Hours')}</span>
                  <span style="font-size:0.75rem; color:#15803D; font-weight:700;">06:00 AM – 08:00 PM</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:0.75rem; color:#6B7280; font-weight:600;">${getT('weighbridges_active', 'Weighbridges Operational')}</span>
                  <span style="font-size:0.75rem; color:#111827; font-weight:700;">4 of 4 Active</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.75rem; color:#6B7280; font-weight:600;">${getT('testing_lab', 'Moisture Testing Lab')}</span>
                  <span style="font-size:0.75rem; color:#111827; font-weight:700;">2 Counters Open</span>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; font-size:0.82rem; color:#92400E; font-weight:700; cursor:pointer; transition:background 0.15s ease;" onclick="if(typeof openKisanFAQ==='function') openKisanFAQ();">
                  <span><i class="fas fa-circle-question" style="margin-right:8px; color:#D97706;"></i> ${getT('nav_kisan_sahayak', 'Kisan Sahayak')} — Mandi Guide &amp; FAQ</span>
                  <span>Guide &gt;</span>
                </div>
                <a href="tel:18001801551" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; text-decoration:none; color:#065F46; font-size:0.82rem; font-weight:700; transition:background 0.15s ease;">
                  <span><i class="fas fa-phone-volume" style="margin-right:8px; color:#10B981;"></i> ${getT('kisan_call_centre', 'Kisan Call Centre (Toll-Free)')}</span>
                  <span>1800-180-1551 &gt;</span>
                </a>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; font-size:0.82rem; color:#1E40AF; font-weight:700; cursor:pointer; transition:background 0.15s ease;" onclick="if(typeof openContactModal==='function') openContactModal();">
                  <span><i class="fas fa-comments" style="margin-right:8px; color:#3B82F6;"></i> ${getT('support_grievances', 'Mandi Support & Grievances')}</span>
                  <span>Helpdesk &gt;</span>
                </div>
              </div>
            </div>

            <!-- Widget 6: Government Quality & Moisture Guidelines -->
            <div class="sp-card sp-widget-card">
              <div class="sp-widget-header">
                <div class="sp-widget-title">
                  <i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> ${getT('fair_assay_guide', 'Fair Assay & Quality Guide')}
                </div>
                <span style="font-size:0.72rem; color:#0D5C3A; font-weight:700; background:#DCFCE7; padding:2px 8px; border-radius:6px;">FAQ 2026-27</span>
              </div>

              <div style="font-size:0.8rem; color:#4B5563; line-height:1.45; margin-bottom:12px;">
                ${getT('faq_benchmarks', 'Meet Central Government Fair Average Quality (FAQ) benchmarks to avoid deductions:')}
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:8px; padding:8px 10px;">
                  <div style="font-size:0.7rem; color:#6B7280; font-weight:600;">${getT('max_moisture', 'Max Moisture')}</div>
                  <div style="font-size:1rem; font-weight:800; color:#0D5C3A;">&le; 12.0%</div>
                </div>
                <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:8px; padding:8px 10px;">
                  <div style="font-size:0.7rem; color:#6B7280; font-weight:600;">${getT('foreign_matter', 'Foreign Matter')}</div>
                  <div style="font-size:1rem; font-weight:800; color:#0D5C3A;">&le; 0.75%</div>
                </div>
                <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:8px; padding:8px 10px;">
                  <div style="font-size:0.7rem; color:#6B7280; font-weight:600;">${getT('damaged_grains', 'Damaged Grains')}</div>
                  <div style="font-size:1rem; font-weight:800; color:#0D5C3A;">&le; 2.00%</div>
                </div>
                <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:8px; padding:8px 10px;">
                  <div style="font-size:0.7rem; color:#6B7280; font-weight:600;">${getT('sound_grains', 'Sound Grains')}</div>
                  <div style="font-size:1rem; font-weight:800; color:#0D5C3A;">&ge; 95.0%</div>
                </div>
              </div>

              <div style="font-size:0.74rem; color:#6B7280; display:flex; align-items:center; gap:6px;">
                <i class="fas fa-circle-info" style="color:#0D5C3A;"></i> ${getT('bring_documents', 'Bring Aadhaar card & Khasra copy for instant gate entry.')}
              </div>
            </div>

            <!-- Widget 7: Paddy / Rice & Crop Harvest Readiness Assessment Tab Menu -->
            ${hasPlannedFutureCrop ? `
            <div class="sp-card sp-widget-card" id="harvest-readiness-widget" style="border:1.5px solid var(--saffron); background:#FFFFFF; box-shadow:0 6px 20px rgba(224,109,20,0.08); scroll-margin-top:80px;">
              <div class="sp-widget-header" style="border-bottom:1px solid #FED7AA; padding-bottom:10px; margin-bottom:12px;">
                <div class="sp-widget-title" style="color:var(--primary-navy); font-weight:800; font-size:0.95rem; display:flex; align-items:center; gap:8px;">
                  <img src="${readinessPhoto}" style="width:26px; height:26px; border-radius:6px; object-fit:cover; border:1.5px solid var(--saffron); box-shadow:0 2px 4px rgba(0,0,0,0.12);" alt="${plannedCropName}" />
                  ${plannedCropName} Readiness Verification
                </div>
                <span class="status-pill completed" style="font-size:0.7rem; font-weight:800; text-transform:uppercase; background:#DCFCE7; color:#15803D; padding:2px 8px; border-radius:6px;">
                  Harvest Readiness Assessment
                </span>
              </div>

              <div style="font-size:0.8rem; color:#4B5563; line-height:1.45; margin-bottom:14px;">
                Please answer the questions below regarding your harvested crop condition before proceeding to mandi booking:
              </div>

              <!-- Interactive 5-Step Questions Form -->
              <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
                
                <!-- Q1 -->
                <div style="padding:10px 12px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="font-weight:700; color:var(--primary-navy); font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.72rem;">1</span>
                    Is your crop ready?
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" id="btn-inline-q1_cropReady-yes" class="btn btn-sm btn-primary" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q1_cropReady', true, true)">Yes</button>
                    <button type="button" id="btn-inline-q1_cropReady-no" class="btn btn-sm btn-outline" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q1_cropReady', false, true)">No</button>
                  </div>
                </div>

                <!-- Q2 -->
                <div style="padding:10px 12px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="font-weight:700; color:var(--primary-navy); font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.72rem;">2</span>
                    Is the product cleaned?
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" id="btn-inline-q2_productCleaned-yes" class="btn btn-sm btn-primary" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q2_productCleaned', true, true)">Yes</button>
                    <button type="button" id="btn-inline-q2_productCleaned-no" class="btn btn-sm btn-outline" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q2_productCleaned', false, true)">No</button>
                  </div>
                </div>

                <!-- Q3 -->
                <div style="padding:10px 12px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="font-weight:700; color:var(--primary-navy); font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.72rem;">3</span>
                    Are the bags packed?
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" id="btn-inline-q3_bagsPacked-yes" class="btn btn-sm btn-primary" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q3_bagsPacked', true, true)">Yes</button>
                    <button type="button" id="btn-inline-q3_bagsPacked-no" class="btn btn-sm btn-outline" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q3_bagsPacked', false, true)">No</button>
                  </div>
                </div>

                <!-- Q5 -->
                <div style="padding:10px 12px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="font-weight:700; color:var(--primary-navy); font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.72rem;">5</span>
                    Is the transportation ready?
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" id="btn-inline-q5_transportReady-yes" class="btn btn-sm btn-primary" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q5_transportReady', true, true)">Yes</button>
                    <button type="button" id="btn-inline-q5_transportReady-no" class="btn btn-sm btn-outline" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q5_transportReady', false, true)">No</button>
                  </div>
                </div>

                <!-- Q6 -->
                <div style="padding:10px 12px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="font-weight:700; color:var(--primary-navy); font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.72rem;">6</span>
                    Is your product ready to move?
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" id="btn-inline-q6_readyToMove-yes" class="btn btn-sm btn-primary" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q6_readyToMove', true, true)">Yes</button>
                    <button type="button" id="btn-inline-q6_readyToMove-no" class="btn btn-sm btn-outline" style="padding:4px 12px; font-weight:800; border-radius:6px; font-size:0.78rem;" onclick="handleSetReadinessAnswer('q6_readyToMove', false, true)">No</button>
                  </div>
                </div>

              </div>

              <!-- Action button -->
              <button 
                class="btn btn-primary" 
                style="width:100%; padding:13px; font-weight:900; font-size:0.95rem; justify-content:center; border-radius:10px; box-shadow:0 4px 14px rgba(224,109,20,0.25);"
                onclick="handleSubmitCropReadinessQuestionnaire()"
              >
                <i class="fas fa-arrow-right"></i> Submit &amp; Go to Smart Mandi Finder
              </button>
            </div>
            ` : `
            <div class="sp-card sp-widget-card" id="harvest-readiness-widget" style="display:none;"></div>
            `}

          </div>
        </section>

        <!-- Full-width Advisory & Fair Weighment Guarantee Banner -->
        <section class="sp-full-advisory-banner">
          <div class="sp-advisory-icon-box">
            <i class="fas fa-shield-halved"></i>
          </div>
          <div class="sp-advisory-text">
            <div class="sp-advisory-title">${getT('national_assurance_title', 'National Agricultural Procurement Assurance & Fair Weighment Guarantee')}</div>
            <div class="sp-advisory-desc">
              ${getT('national_assurance_desc', 'All procurement centres operate certified electronic weighbridges calibrated per Legal Metrology Standards. Assayed moisture readings and gross/tare weighments are cryptographically stamped into your digital J-Form receipt and transmitted instantly to the DBT Public Financial Management System (PFMS).')}
            </div>
          </div>
          <div class="sp-advisory-badges">
            <span class="sp-adv-badge"><i class="fas fa-certificate"></i> ${getT('iso_certified', 'ISO 9001 Certified')}</span>
            <span class="sp-adv-badge"><i class="fas fa-lock"></i> ${getT('tamper_proof', 'SHA-256 Tamper-Proof')}</span>
          </div>
        </section>

        <!-- Wide Photographic Footer Band -->
        <section class="sp-footer-band">
          <div class="sp-footer-overlay"></div>
          <div class="sp-footer-content">
            <h2 class="sp-footer-title">
              ${getT('footer_empower_title', "Empowering India's Farmers Through Smart Procurement")}
            </h2>
            <div class="sp-footer-pillars">
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-wheat-awn"></i></div>
                <div class="sp-pillar-label">${getT('pillar_fair_msp', 'Fair MSP Pricing')}</div>
              </div>
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-bolt"></i></div>
                <div class="sp-pillar-label">${getT('pillar_zero_queue', 'Zero Queue Delays')}</div>
              </div>
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-building-columns"></i></div>
                <div class="sp-pillar-label">${getT('pillar_instant_dbt', 'Instant DBT Transfer')}</div>
              </div>
              <div class="sp-pillar-item">
                <div class="sp-pillar-icon"><i class="fas fa-headset"></i></div>
                <div class="sp-pillar-label">${getT('pillar_support', '24/7 Farmer Support')}</div>
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

const handleHeroFindMandi = () => {
  const finderEl = document.getElementById('sp-finder-section') || document.querySelector('.sp-finder-card');
  if (finderEl) {
    finderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof window.runSmartMandiFinderSearch === 'function') {
      window.runSmartMandiFinderSearch(false);
    }
  } else {
    routeTo('#smart-booking');
  }
};
window.handleHeroFindMandi = handleHeroFindMandi;

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

    if (result.data) {
      if (result.data.hasFutureCropPlan) {
        window.farmerHasPlannedFutureCrop = true;
        localStorage.setItem('kpms_farmer_has_future_crop', 'true');
        if (result.data.futureCropPlan) {
          window.activeForecastCache = result.data.futureCropPlan;
          if (result.data.futureCropPlan.cropName) {
            localStorage.setItem('kpms_future_crop_name', result.data.futureCropPlan.cropName);
          }
        }
      }
    }

    renderSmartProcureFarmerView(result.data);
    setTimeout(() => {
      checkAndPromptTravelToFuture(token);
    }, 700);
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
              <button class="btn btn-outline" onclick="routeTo('#smart-booking')"><img src="/images/nav/smart_mandi.jpg" style="width:16px; height:16px; border-radius:3px; object-fit:cover; margin-right:6px; vertical-align:middle;" alt="" /> Smart Mandi Finder</button>
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

/**
 * -------------------------------------------------------------
 * TRAVEL TO FUTURE (DEMO PURPOSE ONLY) & CROP READINESS FLOW
 * Triggered strictly after selecting an actual future crop
 * -------------------------------------------------------------
 */
let activeForecastCache = null;

window.cropReadinessAnswers = {
  q1_cropReady: true,
  q2_productCleaned: true,
  q3_bagsPacked: true,
  q5_transportReady: true,
  q6_readyToMove: true
};

const checkAndPromptTravelToFuture = async (token) => {
  if (!token) return;

  // Strict Rule: Do NOT display Time Travel popup on initial load, login, or if future crop is NOT DECIDED
  // Must only appear after the farmer has just selected and saved an actual future crop plan
  const justSaved = sessionStorage.getItem('kpms_just_saved_actual_future_crop');
  if (justSaved !== 'true') {
    return;
  }

  try {
    const res = await fetch('/api/smart-mandi/future-crop-state', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    
    // Strict DB verification: Must be ACTUAL_CROP and timeTravelEligible === true
    if (json.success && json.futureCropState === 'ACTUAL_CROP' && json.timeTravelEligible && json.forecast) {
      activeForecastCache = json.forecast;
      sessionStorage.removeItem('kpms_just_saved_actual_future_crop');
      renderTravelFutureModal(json.forecast);
    } else {
      sessionStorage.removeItem('kpms_just_saved_actual_future_crop');
    }
  } catch (e) {
    console.warn('Could not check future crop state:', e);
    sessionStorage.removeItem('kpms_just_saved_actual_future_crop');
  }
};

const renderTravelFutureModal = (forecast) => {
  const existing = document.getElementById('travel-future-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'travel-future-modal';
  modal.className = 'modal-backdrop active';

  const harvestText = forecast.harvestDisplay || `${forecast.estimatedHarvestMonth || 'Upcoming Season'} ${forecast.estimatedHarvestPeriod || ''}`;

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width:540px; border-radius:18px; padding:30px; text-align:center; background:#FFF; border:2px solid var(--saffron); box-shadow:0 16px 48px rgba(0,0,0,0.15);">
      
      <div style="width:68px; height:68px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:2rem; animation:pulse 1.5s infinite;">
        <i class="fas fa-clock-rotate-left"></i>
      </div>

      <div style="font-size:1.7rem; font-weight:900; color:var(--primary-navy); line-height:1.2;">
        Travel to Future
      </div>
      <div style="font-size:0.85rem; font-weight:800; color:var(--saffron); text-transform:uppercase; letter-spacing:1px; margin-top:4px;">
        (Demo Purpose Only)
      </div>

      <p style="color:var(--text-main); font-size:0.95rem; line-height:1.6; margin:16px 0 20px 0;">
        You have saved a planned seasonal crop for <strong>${forecast.cropName}</strong>. The system estimates your crop will reach its expected harvest window in:
      </p>

      <div style="background:#FFF7ED; border:2px dashed var(--saffron); border-radius:12px; padding:16px; margin-bottom:24px;">
        <span style="font-size:0.75rem; color:#9A3412; font-weight:800; text-transform:uppercase;">Estimated Harvest Period</span>
        <div style="font-size:1.4rem; font-weight:900; color:#C2410C; margin-top:2px; display:flex; align-items:center; gap:8px;">
          <img src="${getCropPhoto(forecast.cropName)}" style="width:28px; height:28px; border-radius:6px; object-fit:cover; border:1px solid var(--saffron);" alt="" />
          <span>${harvestText}</span>
        </div>
      </div>

      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:24px;">
        Click below to simulate entering this harvest season and answer your crop readiness questions.
      </p>

      <div style="display:flex; gap:12px; justify-content:center;">
        <button 
          class="btn btn-outline" 
          style="padding:12px 24px; font-weight:700; border-radius:10px;"
          onclick="closeTravelFutureModal()"
        >
          Not Now
        </button>

        <button 
          class="btn btn-primary" 
          style="padding:12px 26px; font-weight:800; border-radius:10px; background:var(--saffron); border-color:var(--saffron);"
          onclick="proceedTravelToFuture()"
        >
          <i class="fas fa-forward-fast"></i> Travel to Future
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);
};

const closeTravelFutureModal = () => {
  const el = document.getElementById('travel-future-modal');
  if (el) el.remove();
};

const proceedTravelToFuture = async () => {
  const token = localStorage.getItem('kpms_token');
  const modal = document.getElementById('travel-future-modal');
  if (!modal) return;

  const bodySlot = modal.querySelector('.modal-dialog');
  if (bodySlot) {
    bodySlot.innerHTML = `
      <div style="padding:40px 20px; text-align:center;">
        <i class="fas fa-spinner fa-spin" style="font-size:2.5rem; color:var(--saffron); margin-bottom:14px;"></i>
        <h3 style="font-weight:800; color:var(--primary-navy);">Advancing to Harvest Season...</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">Dispatching Brevo advisory notification and transitioning simulated state.</p>
      </div>
    `;
  }

  try {
    const res = await fetch('/api/smart-mandi/travel-to-future', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        forecastId: activeForecastCache ? activeForecastCache._id : null
      })
    });
    const json = await res.json();
    if (json.success) {
      renderCropReadinessQuestionnaire(activeForecastCache);
    } else {
      renderCropReadinessQuestionnaire(activeForecastCache);
    }
  } catch (e) {
    console.error('Error in future travel:', e);
    renderCropReadinessQuestionnaire(activeForecastCache);
  }
};

/**
 * Render Crop Readiness Questions with exact numbering: 1, 2, 3, 5, 6
 * Options: [Yes] / [No]
 */
const renderCropReadinessQuestionnaire = (forecast) => {
  const modal = document.getElementById('travel-future-modal');
  if (!modal) return;

  const f = forecast || activeForecastCache || { cropName: 'Crop' };

  // Reset default questionnaire answers
  window.cropReadinessAnswers = {
    q1_cropReady: true,
    q2_productCleaned: true,
    q3_bagsPacked: true,
    q5_transportReady: true,
    q6_readyToMove: true
  };

  const questions = [
    { num: '1', key: 'q1_cropReady', text: 'Is your crop ready?' },
    { num: '2', key: 'q2_productCleaned', text: 'Is the product cleaned?' },
    { num: '3', key: 'q3_bagsPacked', text: 'Are the bags packed?' },
    { num: '5', key: 'q5_transportReady', text: 'Is the transportation ready?' },
    { num: '6', key: 'q6_readyToMove', text: 'Is your product ready to move?' }
  ];

  modal.querySelector('.modal-dialog').innerHTML = `
    <div style="text-align:left; max-width:600px;">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #E2E8F0; padding-bottom:12px;">
        <div>
          <span class="status-pill completed" style="font-size:0.75rem; font-weight:800; text-transform:uppercase;">
            Harvest Readiness Assessment
          </span>
          <h2 style="font-size:1.4rem; font-weight:900; color:var(--primary-navy); margin:4px 0 0 0;">
            ${f.cropName} Readiness Verification
          </h2>
        </div>
        <button class="btn btn-outline btn-sm" onclick="closeTravelFutureModal()" style="border-radius:50%; width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center;">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <p style="color:var(--text-muted); font-size:0.85rem; margin:0 0 16px 0;">
        Please answer the questions below regarding your harvested crop condition before proceeding to mandi booking:
      </p>

      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
        ${questions.map(q => `
          <div style="padding:12px 16px; border-radius:12px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-weight:700; color:var(--primary-navy); font-size:0.95rem;">
              <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.8rem; margin-right:6px;">${q.num}</span>
              ${q.text}
            </div>

            <div style="display:flex; gap:8px;" id="btn-group-${q.key}">
              <button 
                type="button"
                id="btn-${q.key}-yes"
                class="btn btn-sm btn-primary"
                style="padding:6px 16px; font-weight:800; border-radius:8px;"
                onclick="handleSetReadinessAnswer('${q.key}', true)"
              >
                Yes
              </button>
              <button 
                type="button"
                id="btn-${q.key}-no"
                class="btn btn-sm btn-outline"
                style="padding:6px 16px; font-weight:800; border-radius:8px;"
                onclick="handleSetReadinessAnswer('${q.key}', false)"
              >
                No
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <button 
          class="btn btn-primary" 
          style="width:100%; padding:15px; font-weight:900; font-size:1.1rem; justify-content:center; border-radius:12px; box-shadow:0 6px 20px rgba(224,109,20,0.3);"
          onclick="handleSubmitCropReadinessQuestionnaire()"
        >
          <i class="fas fa-arrow-right"></i> Submit & Go to Smart Mandi Finder
        </button>

        <button 
          class="btn btn-outline btn-sm" 
          style="justify-content:center;"
          onclick="closeTravelFutureModal()"
        >
          Exit Questionnaire
        </button>
      </div>

    </div>
  `;
};

const handleSetReadinessAnswer = (key, val) => {
  if (!window.cropReadinessAnswers) window.cropReadinessAnswers = {};
  window.cropReadinessAnswers[key] = val;

  ['btn-', 'btn-inline-'].forEach(prefix => {
    const yesBtn = document.getElementById(`${prefix}${key}-yes`);
    const noBtn = document.getElementById(`${prefix}${key}-no`);

    if (yesBtn && noBtn) {
      if (val) {
        yesBtn.className = 'btn btn-sm btn-primary';
        noBtn.className = 'btn btn-sm btn-outline';
      } else {
        yesBtn.className = 'btn btn-sm btn-outline';
        noBtn.className = 'btn btn-sm btn-danger';
      }
    }
  });
};

const scrollToReadinessWidget = () => {
  const hasPlanned = !!(
    (window.activeForecastCache && window.activeForecastCache.cropName) ||
    window.farmerHasPlannedFutureCrop ||
    (localStorage.getItem('kpms_farmer_has_future_crop') === 'true')
  );

  if (!hasPlanned) {
    if (typeof showToast === 'function') {
      showToast('Please select your future crop in Smart Mandi (Step 7: Next Crop Planning) to unlock Harvest Readiness Verification.', 'info');
    }
    routeTo('#smart-booking');
    return;
  }

  const el = document.getElementById('harvest-readiness-widget');
  if (el && el.style.display !== 'none') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
    el.style.borderColor = '#E06D14';
    el.style.boxShadow = '0 0 0 4px rgba(224, 109, 20, 0.35)';
    setTimeout(() => {
      el.style.boxShadow = '0 6px 20px rgba(224,109,20,0.08)';
    }, 2500);
  } else {
    routeTo('#farmer-dashboard');
    setTimeout(() => {
      const target = document.getElementById('harvest-readiness-widget');
      if (target && target.style.display !== 'none') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
        target.style.borderColor = '#E06D14';
        target.style.boxShadow = '0 0 0 4px rgba(224, 109, 20, 0.35)';
        setTimeout(() => {
          target.style.boxShadow = '0 6px 20px rgba(224,109,20,0.08)';
        }, 2500);
      }
    }, 400);
  }
};

const handleSubmitCropReadinessQuestionnaire = async () => {
  const token = localStorage.getItem('kpms_token');
  const answers = window.cropReadinessAnswers || {};
  const isOverallReady = answers.q1_cropReady && answers.q6_readyToMove;

  try {
    await fetch('/api/smart-mandi/crop-readiness', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        forecastId: activeForecastCache ? activeForecastCache._id : null,
        q1_cropReady: answers.q1_cropReady,
        q2_productCleaned: answers.q2_productCleaned,
        q3_bagsPacked: answers.q3_bagsPacked,
        q5_transportReady: answers.q5_transportReady,
        q6_readyToMove: answers.q6_readyToMove,
        isReady: isOverallReady,
        cropCondition: isOverallReady ? 'Excellent' : 'Average'
      })
    });
  } catch (e) {
    console.warn('Error saving crop readiness:', e);
  }

  closeTravelFutureModal();

  // Populate crop in Smart Mandi Finder state with newly harvested crop
  const f = activeForecastCache;
  if (f && f.cropName && window.smartMandiState) {
    window.smartMandiState.selectedCrop = f.cropName;
    window.smartMandiState.quantity = f.estimatedQuantity || 50;
    window.smartMandiState.step = 1;
  }

  showToast('Crop readiness responses recorded! Opening Smart Mandi Finder for procurement booking...', 'success');

  // Return farmer to Smart Mandi Finder for procurement booking
  routeTo('#smart-booking');
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
  window.checkAndPromptTravelToFuture = checkAndPromptTravelToFuture;
  window.closeTravelFutureModal = closeTravelFutureModal;
  window.proceedTravelToFuture = proceedTravelToFuture;
  window.renderCropReadinessQuestionnaire = renderCropReadinessQuestionnaire;
  window.handleSetReadinessAnswer = handleSetReadinessAnswer;
  window.scrollToReadinessWidget = scrollToReadinessWidget;
  window.handleSubmitCropReadinessQuestionnaire = handleSubmitCropReadinessQuestionnaire;
}

