// Farmer Dashboard & Operations Controller

const getFarmerSidebar = (farmer, activeRoute) => `
  <aside class="sidebar">
    <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
      <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${farmer ? (farmer.fullName || farmer.name || 'Farmer') : 'Farmer'}</div>
      <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-id-card"></i> ${farmer ? (farmer.farmerId || 'FARM000001') : 'FARM000001'}</div>
    </div>
    <div class="sidebar-heading">${getT('sidebar_navigation', 'Navigation')}</div>
    <a class="nav-link ${activeRoute === 'dashboard' ? 'active' : ''}" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-tachometer-alt"></i> ${getT('nav_dashboard', 'Dashboard')}</a>
    <a class="nav-link ${activeRoute === 'smart-booking' ? 'active' : ''}" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles" style="color:var(--saffron);"></i> ${getT('btn_smart_mandi_finder', 'Smart Mandi Finder')}</a>
    <a class="nav-link ${activeRoute === 'mandi-prices' ? 'active' : ''}" onclick="routeTo('#mandi-prices')"><i class="fas fa-carrot" style="color:var(--green-gov);"></i> ${getT('nav_mandi_prices', 'Mandi Prices')}</a>
    <a class="nav-link ${activeRoute === 'book-slot' ? 'active' : ''}" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> ${getT('manual_slot_booking', 'Slot Booking')}</a>
    <a class="nav-link ${activeRoute === 'farmer-queue' ? 'active' : ''}" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> ${getT('live_queue_tracker', 'Live Queue Tracker')}</a>
    <a class="nav-link ${activeRoute === 'my-bookings' ? 'active' : ''}" onclick="routeTo('#my-bookings')"><i class="fas fa-ticket-alt"></i> ${getT('my_bookings', 'My Bookings')}</a>
    <a class="nav-link ${activeRoute === 'farmer-payments' ? 'active' : ''}" onclick="routeTo('#farmer-payments')"><i class="fas fa-money-check-dollar"></i> ${getT('dbt_tracker', 'DBT Payment Tracker')}</a>
    <a class="nav-link ${activeRoute === 'farmer-farms' ? 'active' : ''}" onclick="routeTo('#farmer-farms')"><i class="fas fa-tractor"></i> ${getT('my_farms', 'My Farms & Crops')}</a>
    <a class="nav-link ${activeRoute === 'farmer-profile' ? 'active' : ''}" onclick="routeTo('#farmer-profile')"><i class="fas fa-user-circle"></i> ${getT('kyc_profile', 'KYC Profile & Docs')}</a>
    <div style="margin-top:auto; padding-top:16px;">
      <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> ${getT('nav_logout', 'Logout')}</a>
    </div>
  </aside>
`;

const loadFarmerDashboard = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) {
    routeTo('#landing');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:300px; border-radius:12px;"></div>`;

  try {
    const res = await fetch('/api/farmer/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    const { farmer, activeBooking, queueEntry, stats, recentBookings, recentPayments } = result.data;

    container.innerHTML = `
      <div class="app-container">
        <!-- Sidebar Navigation -->
        ${getFarmerSidebar(farmer, 'dashboard')}

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Top Welcome Banner -->
          <div class="glass-panel" style="padding:24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; border-left:6px solid var(--green-gov);">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h2 style="font-size:1.8rem; font-weight:800; color:var(--primary-navy);">Namaste, ${farmer.fullName}!</h2>
                <span class="status-pill completed"><i class="fas fa-check-circle"></i> KYC ${farmer.verificationStatus || 'Verified'}</span>
              </div>
              <p style="color:var(--text-muted); font-size:0.92rem; margin-top:4px;">
                Mandi Center: <strong>${farmer.preferredCenterId || 'APMC Bhopal'}</strong> | Village: <strong>${farmer.village || 'Ratibad'}</strong> | Total Land: <strong>${farmer.totalLandArea || 5} Acres</strong>
              </p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> 🌾 Smart Mandi Finder</button>
              <button class="btn btn-outline" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> Standard Booking</button>
              <button class="btn btn-outline" onclick="openKisanAIChat()"><i class="fas fa-robot"></i> Kisan Sahayak AI</button>
            </div>
          </div>

          <!-- KPI Metric Cards -->
          <div class="dashboard-grid">
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.totalBookings}</div>
                <div class="metric-title">Total Bookings</div>
              </div>
              <div class="metric-icon-box" style="background:#EFF6FF; color:#2563EB;"><i class="fas fa-calendar-check"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">₹${stats.totalEarnings.toLocaleString('en-IN')}</div>
                <div class="metric-title">Completed DBT Payments</div>
              </div>
              <div class="metric-icon-box" style="background:#ECFDF5; color:#059669;"><i class="fas fa-indian-rupee-sign"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">₹${stats.pendingEarnings.toLocaleString('en-IN')}</div>
                <div class="metric-title">Pending DBT Processing</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706;"><i class="fas fa-clock"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${queueEntry ? queueEntry.tokenNumber : 'None'}</div>
                <div class="metric-title">Live Mandi Token</div>
              </div>
              <div class="metric-icon-box" style="background:#FAF5FF; color:#9333EA;"><i class="fas fa-ticket-alt"></i></div>
            </div>
          </div>

          <!-- Live Queue & Active Slot Spotlight Banner -->
          ${queueEntry ? `
            <div class="glass-panel" style="padding:22px; margin-bottom:28px; background:linear-gradient(135deg, rgba(224,109,20,0.1), rgba(26,122,68,0.05)); border:2px solid var(--saffron);">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                <div>
                  <span class="status-pill called animate-pulse-glow" style="margin-bottom:8px;">Live Queue Active</span>
                  <div style="font-size:1.4rem; font-weight:800; color:var(--primary-navy);">Token Number: <span style="color:var(--saffron); font-size:1.8rem;">${queueEntry.tokenNumber}</span></div>
                  <p style="color:var(--text-muted); font-size:0.9rem;">Assigned Counter: <strong>${queueEntry.counterNumber}</strong> | Status: <strong>${queueEntry.status.toUpperCase()}</strong></p>
                </div>
                <div>
                  <button class="btn btn-primary" onclick="routeTo('#farmer-queue')"><i class="fas fa-eye"></i> View Live Position & Countdown</button>
                </div>
              </div>
            </div>
          ` : (activeBooking ? `
            <div class="glass-panel" style="padding:20px; margin-bottom:28px; border-left:6px solid var(--saffron);">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <span class="status-pill waiting" style="margin-bottom:6px;">Upcoming Reserved Slot</span>
                  <h4 style="color:var(--primary-navy);">${activeBooking.cropName} (${activeBooking.quantity} Quintals)</h4>
                  <p style="color:var(--text-muted); font-size:0.88rem;">Date: <strong>${activeBooking.date}</strong> | Slot: <strong>${activeBooking.timeSlot}</strong> | Booking No: <strong>${activeBooking.bookingNumber}</strong></p>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-success" onclick="openBookingQRModal('${activeBooking.bookingNumber}')"><i class="fas fa-qrcode"></i> View QR Pass</button>
                  <a href="/api/bookings/${activeBooking.bookingNumber}/pdf" target="_blank" class="btn btn-outline"><i class="fas fa-download"></i> PDF Pass</a>
                </div>
              </div>
            </div>
          ` : '')}

          <!-- Recent Bookings and Payment Table -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="glass-card" style="padding:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h4 style="color:var(--primary-navy); font-weight:700;"><i class="fas fa-list"></i> Recent Slot Bookings</h4>
                <a onclick="routeTo('#my-bookings')" style="font-size:0.85rem; color:var(--saffron); cursor:pointer; font-weight:600;">View All</a>
              </div>
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${recentBookings.length === 0 ? '<p style="color:var(--text-muted); font-size:0.9rem;">No bookings yet.</p>' : ''}
                ${recentBookings.map(b => `
                  <div style="padding:12px; background:var(--bg-main); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-weight:700; font-size:0.92rem;">${b.cropName} (${b.quantity} Q)</div>
                      <div style="font-size:0.8rem; color:var(--text-muted);">${b.date} • ${b.timeSlot}</div>
                    </div>
                    <span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="glass-card" style="padding:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h4 style="color:var(--primary-navy); font-weight:700;"><i class="fas fa-receipt"></i> Recent DBT Payments</h4>
                <a onclick="routeTo('#farmer-payments')" style="font-size:0.85rem; color:var(--saffron); cursor:pointer; font-weight:600;">View All</a>
              </div>
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${recentPayments.length === 0 ? '<p style="color:var(--text-muted); font-size:0.9rem;">No payment transactions yet.</p>' : ''}
                ${recentPayments.map(p => `
                  <div style="padding:12px; background:var(--bg-main); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-weight:700; font-size:0.92rem; color:var(--green-gov);">₹${p.amount.toLocaleString('en-IN')}</div>
                      <div style="font-size:0.8rem; color:var(--text-muted);">UTR: ${p.utrNumber || p.transactionId}</div>
                    </div>
                    <span class="status-pill completed">${p.status}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
};

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
 * KYC Profile & Docs Portal View
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
                <h2 style="font-size:1.75rem; font-weight:800; color:var(--primary-navy);"><i class="fas fa-user-circle" style="color:var(--saffron);"></i> Farmer KYC Profile & Documents</h2>
                <span class="status-pill completed"><i class="fas fa-shield-check"></i> Government KYC ${farmer.verificationStatus || 'Verified'}</span>
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

          <!-- Address & KYC Verification Documents Section -->
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

            <!-- KYC Documents Card -->
            <div class="glass-card" style="padding:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h4 style="font-weight:700; color:var(--primary-navy);"><i class="fas fa-file-shield" style="color:var(--green-gov);"></i> KYC Verification Documents</h4>
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
  document.getElementById('modal-title').textContent = 'Upload KYC Verification Document';

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
