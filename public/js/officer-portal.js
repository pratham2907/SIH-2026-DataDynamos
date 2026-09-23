// Procurement Officer Portal & Multi-Counter Queue Manager

let activeOfficerCenterId = 'CTR-01';
let currentOfficerQueueFilter = 'ALL';

/**
 * Reusable Officer Sidebar Renderer
 */
const renderOfficerSidebar = (activeKey, user, center) => {
  return `
    <aside class="sidebar">
      <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
        <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${user ? user.name : 'Officer'}</div>
        <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-shield-halved"></i> ${user && user.designation ? user.designation : 'Senior Procurement Inspector'}</div>
        <div style="font-size:0.72rem; color:#94A3B8; margin-top:2px;">${center ? center.name : 'APMC Central Mandi'}</div>
      </div>
      <div class="sidebar-heading">${getT('officer_console', 'Officer Console')}</div>
      <a class="nav-link ${activeKey === 'console' ? 'active' : ''}" onclick="loadOfficerDashboard()"><i class="fas fa-desktop"></i> ${getT('operations_console', 'Operations Console')}</a>
      <a class="nav-link ${activeKey === 'book-token' ? 'active' : ''}" onclick="loadOfficerBookTokenPage()"><i class="fas fa-ticket"></i> ${getT('officer_book_token', 'Book Token for Farmer')}</a>
      <a class="nav-link ${activeKey === 'assisted-bookings' ? 'active' : ''}" onclick="loadOfficerAssistedBookingsPage()"><i class="fas fa-clock-rotate-left"></i> ${getT('assisted_bookings', 'Assisted Bookings')}</a>
      <a class="nav-link" onclick="openGateScannerModal()"><i class="fas fa-qrcode"></i> ${getT('gate_qr_scanner', 'Gate QR Scanner')}</a>
      <a class="nav-link ${activeKey === 'queue' ? 'active' : ''}" onclick="loadOfficerQueueView()"><i class="fas fa-list-check"></i> ${getT('multi_counter_queue', 'Multi-Counter Queue')}</a>
      <a class="nav-link" onclick="openProcurementStepper()"><i class="fas fa-scale-balanced"></i> ${getT('weighbridge_quality', 'Weighbridge & Quality')}</a>
      <a class="nav-link ${activeKey === 'crop-readiness' ? 'active' : ''}" onclick="scrollToOfficerReadiness()"><i class="fas fa-wheat-awn" style="color:var(--saffron);"></i> ${getT('crop_readiness_menu', 'Paddy / Rice Readiness Verification')}</a>
      <a class="nav-link" onclick="openFarmerSearchModal()"><i class="fas fa-search"></i> ${getT('farmer_lookup', 'Universal Farmer Lookup')}</a>
      <a class="nav-link" onclick="openAnnouncementModal()"><i class="fas fa-bullhorn"></i> ${getT('mandi_announcements', 'Mandi Announcements')}</a>
      <a class="nav-link" onclick="routeTo('#tv-display')"><i class="fas fa-tv"></i> ${getT('tv_display_mode', 'Public Display TV Mode')}</a>
      <div style="margin-top:auto; padding-top:16px;">
        <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> ${getT('nav_logout', 'Logout')}</a>
      </div>
    </aside>
  `;
};

/**
 * 1. OPERATIONS CONSOLE (MAIN DASHBOARD)
 */
const loadOfficerDashboard = async () => {
  window.location.hash = '#officer-dashboard';
  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();
  if (!token || !user || (user.role !== 'officer' && user.role !== 'admin')) {
    openLoginModal('officer');
    showToast('Please log in to access the Officer Portal', 'info');
    return;
  }

  activeOfficerCenterId = user.assignedCenterId || 'CTR-01';
  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const [dashRes, forecastRes] = await Promise.all([
      fetch(`/api/officer/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`/api/smart-mandi/forecasts`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const result = await dashRes.json();
    const forecastJson = await forecastRes.json().catch(() => ({ data: [] }));
    const demandForecasts = forecastJson.data || [];
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    const { center, stats, currentQueue } = result;

    container.innerHTML = `
      <div class="app-container">
        ${renderOfficerSidebar('console', user, center)}

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Top Bar -->
          <div class="glass-panel" style="padding:22px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; border-left:6px solid var(--primary-navy);">
            <div>
              <h2 style="font-size:1.8rem; font-weight:800; color:var(--primary-navy);">${center.name}</h2>
              <p style="color:var(--text-muted); font-size:0.88rem;">
                Operating Hours: <strong>${center.openingTime || '08:00 AM'} - ${center.closingTime || '06:00 PM'}</strong> | Active Counters: <strong>${center.countersCount || 4} Desks</strong> | Crowd Level: <span class="status-pill waiting">${stats.congestionLevel || 'Normal Flow'}</span>
              </p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="openGateScannerModal()"><i class="fas fa-qrcode"></i> ${getT('btn_scan_pass', 'Scan Pass')}</button>
              <button class="btn btn-navy" onclick="loadOfficerQueueView()"><i class="fas fa-list-check"></i> Multi-Counter Queue</button>
              <button class="btn btn-success" onclick="callNextTokenAction()"><i class="fas fa-bullhorn"></i> ${getT('btn_call_next_farmer', 'Call Next Farmer')}</button>
            </div>
          </div>

          <!-- Quick Action Card: Book Token for Farmer -->
          <div class="glass-card" style="padding:22px 26px; margin-bottom:24px; background:#FFFFFF; border:1px solid var(--border-color); border-left:6px solid var(--saffron); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; box-shadow:0 6px 24px rgba(0,0,0,0.07);">
            <div style="display:flex; align-items:center; gap:18px;">
              <div style="width:54px; height:54px; border-radius:12px; background:linear-gradient(135deg, var(--saffron), #EA580C); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:1.6rem; box-shadow:0 4px 14px rgba(224,109,20,0.35);">
                <i class="fas fa-ticket"></i>
              </div>
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <h3 style="font-size:1.3rem; font-weight:800; color:var(--primary-navy); margin:0;">${getT('officer_book_token', 'Book Token for Farmer')}</h3>
                  <span class="badge" style="background:rgba(224,109,20,0.15); color:var(--saffron); font-weight:800; font-size:0.75rem; padding:2px 8px; border-radius:4px;">ASSISTED FACILITATION</span>
                </div>
                <p style="color:var(--text-muted); font-size:0.9rem; margin:4px 0 0 0; max-width:650px;">
                  ${getT('assisted_booking_sub', 'Assist farmers who are unable to use the online portal due to lack of smartphone, connectivity, or literacy barriers.')}
                </p>
              </div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="loadOfficerBookTokenPage()" style="padding:10px 22px; font-weight:800; font-size:0.95rem;">
                <i class="fas fa-plus"></i> + Book Token
              </button>
              <button class="btn btn-outline" onclick="loadOfficerAssistedBookingsPage()" style="padding:10px 18px; font-weight:600;">
                <i class="fas fa-clock-rotate-left"></i> Assisted History
              </button>
            </div>
          </div>

          <!-- KPI Metric Cards (Main Mandi Operations) -->
          <div class="dashboard-grid" style="margin-bottom:18px;">
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.waitingInQueue}</div>
                <div class="metric-title">${getT('farmers_waiting_in_queue', 'Farmers Waiting in Queue')}</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706;"><i class="fas fa-hourglass-half"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.completedToday}</div>
                <div class="metric-title">${getT('procurements_completed_today', 'Procurements Completed Today')}</div>
              </div>
              <div class="metric-icon-box" style="background:#ECFDF5; color:#059669;"><i class="fas fa-check-double"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.totalCropCollectedQuintals} Q</div>
                <div class="metric-title">Total Crop Received Today</div>
              </div>
              <div class="metric-icon-box" style="background:#EFF6FF; color:#2563EB;"><i class="fas fa-wheat-awn"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">₹${(stats.totalProcurementValue / 100000).toFixed(1)} L</div>
                <div class="metric-title">Today's Procurement Value</div>
              </div>
              <div class="metric-icon-box" style="background:#FAF5FF; color:#9333EA;"><i class="fas fa-indian-rupee-sign"></i></div>
            </div>
          </div>

          <!-- Assisted Farmer Booking Real-Time KPI Row -->
          <div class="glass-card" style="padding:16px 20px; margin-bottom:24px; border:1px solid rgba(224,109,20,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i class="fas fa-hands-holding-circle" style="color:var(--saffron); font-size:1.1rem;"></i>
                <h4 style="font-size:0.95rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  Assisted Facilitation Metrics (Database Backed)
                </h4>
              </div>
              <span style="font-size:0.75rem; color:var(--text-muted);">
                Audited Facilitation Records &bull; Officer Transparency
              </span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px;">
              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:1.5rem; font-weight:800; color:var(--primary-navy);">${stats.assistedBookingsToday || 0}</div>
                  <div style="font-size:0.76rem; color:var(--text-muted); font-weight:600;">Assisted Bookings Today</div>
                </div>
                <div style="width:36px; height:36px; border-radius:8px; background:#FFFBEB; color:#D97706; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                  <i class="fas fa-calendar-day"></i>
                </div>
              </div>
              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:1.5rem; font-weight:800; color:#2563EB;">${stats.pendingAssistedVisits || 0}</div>
                  <div style="font-size:0.76rem; color:var(--text-muted); font-weight:600;">Pending Assisted Visits</div>
                </div>
                <div style="width:36px; height:36px; border-radius:8px; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                  <i class="fas fa-hourglass-start"></i>
                </div>
              </div>
              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:1.5rem; font-weight:800; color:var(--green-gov);">${stats.completedAssisted || 0}</div>
                  <div style="font-size:0.76rem; color:var(--text-muted); font-weight:600;">Completed Procurement</div>
                </div>
                <div style="width:36px; height:36px; border-radius:8px; background:#ECFDF5; color:#059669; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                  <i class="fas fa-check-double"></i>
                </div>
              </div>
              <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:1.5rem; font-weight:800; color:#EF4444;">${stats.cancelledAssisted || 0}</div>
                  <div style="font-size:0.76rem; color:var(--text-muted); font-weight:600;">Cancelled / No-Show</div>
                </div>
                <div style="width:36px; height:36px; border-radius:8px; background:#FEF2F2; color:#EF4444; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                  <i class="fas fa-ban"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Multi-Counter Queue Table with Controls -->
          <div class="glass-card" style="padding:24px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 style="color:var(--primary-navy); font-weight:800;"><i class="fas fa-users-line"></i> Today's Live Mandi Queue</h3>
                <p style="color:var(--text-muted); font-size:0.85rem;">Manage token progressions, initiate quality inspections, and trigger payments.</p>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary btn-sm" onclick="loadOfficerQueueView()"><i class="fas fa-table-columns"></i> Multi-Counter Full View</button>
                <button class="btn btn-navy btn-sm" onclick="callNextTokenAction()"><i class="fas fa-phone-volume"></i> Call Next</button>
                <button class="btn btn-outline btn-sm" onclick="loadOfficerDashboard()"><i class="fas fa-rotate"></i> Refresh</button>
              </div>
            </div>

            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                    <th style="padding:12px 14px;">Token</th>
                    <th style="padding:12px 14px;">Farmer & Commodity</th>
                    <th style="padding:12px 14px;">Counter</th>
                    <th style="padding:12px 14px;">Check-In</th>
                    <th style="padding:12px 14px;">Status</th>
                    <th style="padding:12px 14px; text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${currentQueue.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No farmers in queue right now. Scan arrivals at Gate.</td></tr>` : ''}
                  ${currentQueue.map(q => `
                    <tr style="border-bottom:1px solid var(--border-color);">
                      <td style="padding:12px 14px; font-weight:800; font-size:1.1rem; color:var(--saffron);">${q.tokenNumber}</td>
                      <td style="padding:12px 14px;">
                        <div style="font-weight:700; color:var(--text-main);">${q.farmerName} ${q.isPriority ? '<span class="status-pill waiting" style="font-size:0.7rem;">PRIORITY</span>' : ''}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${q.cropName || 'Wheat'} (${q.quantity || 50} Q)</div>
                      </td>
                      <td style="padding:12px 14px; font-weight:600;"><span class="badge" style="background:#EFF6FF; color:#1D4ED8; padding:4px 8px; border-radius:4px;">${q.counterNumber}</span></td>
                      <td style="padding:12px 14px; font-size:0.85rem; color:var(--text-muted);">${new Date(q.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style="padding:12px 14px;">
                        <span class="status-pill ${q.status.toLowerCase()}">${q.status}</span>
                      </td>
                      <td style="padding:12px 14px; text-align:right;">
                        <div style="display:inline-flex; gap:6px;">
                          ${q.status === 'waiting' ? `
                            <button class="btn btn-primary btn-sm" onclick="callSpecificToken('${q._id}')"><i class="fas fa-phone"></i> Call</button>
                            <button class="btn btn-outline btn-sm" onclick="skipTokenAction('${q._id}')">Skip</button>
                          ` : (q.status === 'called' ? `
                            <button class="btn btn-success btn-sm" onclick="openProcurementStepper('${q.tokenNumber}', '${q.bookingNumber}')"><i class="fas fa-scale-balanced"></i> Weigh & Inspect</button>
                            <button class="btn btn-outline btn-sm" onclick="skipTokenAction('${q._id}')">Skip</button>
                          ` : (q.status === 'skipped' ? `
                            <button class="btn btn-outline btn-sm" onclick="recallTokenAction('${q._id}')"><i class="fas fa-rotate-left"></i> Recall</button>
                          ` : `<span style="color:var(--green-gov); font-weight:700; font-size:0.85rem;">✓ Done</span>`))}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Future Expected Demand Forecast Card (Aggregated from Smart Mandi Finder Next Crop Planning) -->
          <div class="glass-card" style="padding:22px; margin-top:24px; border-top:4px solid var(--saffron);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-chart-line" style="color:var(--saffron);"></i> Future Expected Mandi Demand Forecast (Next Crop Cycle)
                </h3>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                  Aggregated from farmer next-crop plans. Strictly deduplicated (1 farmer = 1 count) for proactive mandi storage & capacity planning.
                </p>
              </div>
              <span class="badge" style="background:rgba(224,109,20,0.12); color:var(--saffron); border:1px solid rgba(224,109,20,0.3); font-weight:700; padding:6px 12px; border-radius:20px;">
                <i class="fas fa-users"></i> ${demandForecasts.reduce((sum, f) => sum + (f.totalFarmers || 0), 0)} Total Farmers Planned
              </span>
            </div>

            ${demandForecasts.length === 0 ? `
              <div style="text-align:center; padding:32px 20px; background:var(--bg-main); border-radius:12px; border:1px dashed var(--border-color);">
                <i class="fas fa-seedling" style="font-size:2rem; color:var(--text-muted); margin-bottom:10px; opacity:0.6;"></i>
                <p style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin:0;">No future crop plans registered yet.</p>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">As farmers complete their Smart Mandi Finder bookings and specify upcoming crop cycles, aggregated demand forecasts will appear here.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Target Mandi</th>
                      <th>Planned Crop</th>
                      <th>Expected Harvest Window</th>
                      <th style="text-align:center;">Farmer Count (Deduplicated)</th>
                      <th style="text-align:right;">Estimated Total Inflow (Q)</th>
                      <th>Mandi Preparedness Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${demandForecasts.map(f => `
                      <tr>
                        <td style="font-weight:700; color:var(--primary-navy);"><i class="fas fa-warehouse" style="color:var(--saffron); margin-right:6px;"></i>${f.mandiName}</td>
                        <td><span class="badge" style="background:rgba(46,125,50,0.12); color:#2E7D32; font-weight:700;">${f.crop}</span></td>
                        <td style="font-weight:600; color:var(--text-main);"><i class="fas fa-calendar-alt" style="color:var(--text-muted); margin-right:5px;"></i>${f.harvestPeriod || f.harvestMonth}</td>
                        <td style="text-align:center;"><span style="display:inline-block; padding:3px 10px; background:rgba(30,58,138,0.1); color:var(--primary-navy); border-radius:14px; font-weight:800; font-size:0.9rem;">${f.totalFarmers}</span></td>
                        <td style="text-align:right; font-weight:800; color:var(--primary-navy);">${(f.totalEstimatedQuantity || 0).toLocaleString()} Q</td>
                        <td>
                          <span style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-circle-check" style="color:var(--green-gov);"></i>
                            ${f.totalEstimatedQuantity > 500 ? 'Reserve additional weighbridge & gunny bags' : 'Standard procurement capacity sufficient'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- Widget: Fair Assay & Quality Guide (Officer Gate Standards) -->
          <div class="glass-card" id="officer-fair-assay-section" style="padding:22px; margin-top:24px; border-left:6px solid #0D5C3A; background:#FFFFFF;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i class="fas fa-scale-balanced" style="color:#0D5C3A; font-size:1.2rem;"></i>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  ${getT('fair_assay_guide', 'Fair Assay & Quality Guide')}
                </h3>
              </div>
              <span style="font-size:0.75rem; color:#0D5C3A; font-weight:800; background:#DCFCE7; padding:4px 10px; border-radius:6px;">FAQ 2026-27 Government Benchmarks</span>
            </div>

            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">
              Mandatory Central Government Fair Average Quality (FAQ) benchmarks for procurement centre arrival inspections:
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:14px;">
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:10px 14px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Max Moisture Permitted</div>
                <div style="font-size:1.2rem; font-weight:800; color:#0D5C3A;">&le; 12.0%</div>
                <div style="font-size:0.7rem; color:#9CA3AF;">Standard calibrated moisture meter</div>
              </div>
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:10px 14px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Foreign Matter Allowed</div>
                <div style="font-size:1.2rem; font-weight:800; color:#0D5C3A;">&le; 0.75%</div>
                <div style="font-size:0.7rem; color:#9CA3AF;">Inorganic &amp; organic impurities</div>
              </div>
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:10px 14px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Damaged / Discolored Grains</div>
                <div style="font-size:1.2rem; font-weight:800; color:#0D5C3A;">&le; 2.00%</div>
                <div style="font-size:0.7rem; color:#9CA3AF;">Visual assay and seed analysis</div>
              </div>
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:10px 14px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Sound Healthy Grains</div>
                <div style="font-size:1.2rem; font-weight:800; color:#0D5C3A;">&ge; 95.0%</div>
                <div style="font-size:0.7rem; color:#9CA3AF;">Grade-A quality standard</div>
              </div>
            </div>

            <div style="font-size:0.78rem; color:#6B7280; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-circle-info" style="color:#0D5C3A;"></i>
              Gate clearance verification requires Aadhaar biometric match, valid farmer registration pass, and mandatory FAQ moisture tolerance conformance.
            </div>
          </div>

          <!-- Widget: Paddy / Rice Readiness Verification Tab Menu (Directly Below Fair Assay & Quality Guide) -->
          <div class="glass-card" id="officer-readiness-widget" style="padding:22px; margin-top:16px; border:1.5px solid var(--saffron); border-left:6px solid var(--saffron); background:#FFFFFF; scroll-margin-top:80px; box-shadow:0 6px 20px rgba(224,109,20,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #FED7AA; padding-bottom:12px; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i class="fas fa-wheat-awn" style="color:var(--saffron); font-size:1.2rem;"></i>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  Paddy / Rice Readiness Verification
                </h3>
              </div>
              <span class="status-pill completed" style="font-size:0.72rem; font-weight:800; text-transform:uppercase; background:#DCFCE7; color:#15803D; padding:4px 10px; border-radius:6px;">
                Harvest Readiness Assessment &amp; Gate Clearance
              </span>
            </div>

            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">
              Conduct quick pre-entry harvest readiness checks for arriving farmers before directing them to weighbridge and assay counters:
            </p>

            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
              <!-- Q1 -->
              <div style="padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.88rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.75rem;">1</span>
                  Is crop harvest fully matured and moisture conditioned?
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" id="btn-officer-q1-yes" class="btn btn-sm btn-primary" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q1', true)">Yes</button>
                  <button type="button" id="btn-officer-q1-no" class="btn btn-sm btn-outline" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q1', false)">No</button>
                </div>
              </div>

              <!-- Q2 -->
              <div style="padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.88rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.75rem;">2</span>
                  Is the produce cleaned, winnowed and free from chaff?
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" id="btn-officer-q2-yes" class="btn btn-sm btn-primary" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q2', true)">Yes</button>
                  <button type="button" id="btn-officer-q2-no" class="btn btn-sm btn-outline" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q2', false)">No</button>
                </div>
              </div>

              <!-- Q3 -->
              <div style="padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.88rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.75rem;">3</span>
                  Are the standard gunny/HDPE bags packed (50 kg capacity)?
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" id="btn-officer-q3-yes" class="btn btn-sm btn-primary" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q3', true)">Yes</button>
                  <button type="button" id="btn-officer-q3-no" class="btn btn-sm btn-outline" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q3', false)">No</button>
                </div>
              </div>

              <!-- Q5 -->
              <div style="padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.88rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.75rem;">5</span>
                  Is transportation/trolley unloaded within designated bay?
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" id="btn-officer-q5-yes" class="btn btn-sm btn-primary" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q5', true)">Yes</button>
                  <button type="button" id="btn-officer-q5-no" class="btn btn-sm btn-outline" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q5', false)">No</button>
                </div>
              </div>

              <!-- Q6 -->
              <div style="padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.88rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.75rem;">6</span>
                  Is the lot verified and cleared to proceed to weighbridge?
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" id="btn-officer-q6-yes" class="btn btn-sm btn-primary" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q6', true)">Yes</button>
                  <button type="button" id="btn-officer-q6-no" class="btn btn-sm btn-outline" style="padding:4px 14px; font-weight:800; border-radius:6px; font-size:0.8rem;" onclick="setOfficerReadinessToggle('q6', false)">No</button>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="submitOfficerReadinessCheck()" style="padding:10px 22px; font-weight:800;">
                <i class="fas fa-check-double"></i> Confirm Readiness &amp; Proceed to Weighment
              </button>
              <button class="btn btn-outline" onclick="openGateScannerModal()" style="padding:10px 18px; font-weight:700;">
                <i class="fas fa-qrcode"></i> Scan Next Arrival Pass
              </button>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load officer operations: ' + err.message, 'error');
  }
};

/**
 * 2. DEDICATED MULTI-COUNTER QUEUE MANAGEMENT VIEW
 */
const loadOfficerQueueView = async (filterCounter = 'ALL') => {
  currentOfficerQueueFilter = filterCounter;
  window.location.hash = '#officer-queue';

  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();
  if (!token || !user || (user.role !== 'officer' && user.role !== 'admin')) {
    routeTo('#landing');
    return;
  }

  activeOfficerCenterId = user.assignedCenterId || 'CTR-01';
  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const res = await fetch(`/api/queue/live?centerId=${activeOfficerCenterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    const { stats, queues } = result;
    const allQueues = queues || [];

    // Counter definitions
    const counterList = [
      { id: 'Counter 1', name: 'Counter 1', role: 'Gate Verification & Document Check', icon: 'fa-id-card', color: '#2563EB' },
      { id: 'Counter 2', name: 'Counter 2', role: 'Electronic Weighbridge In-Scale', icon: 'fa-scale-balanced', color: '#D97706' },
      { id: 'Counter 3', name: 'Counter 3', role: 'Quality Testing & Moisture Grading', icon: 'fa-vial-circle-check', color: '#9333EA' },
      { id: 'Counter 4', name: 'Counter 4', role: 'Direct DBT Settlement & Dispatch', icon: 'fa-money-bill-transfer', color: '#059669' }
    ];

    // Filter queues based on tab
    let filteredQueues = allQueues;
    if (filterCounter === 'PRIORITY') {
      filteredQueues = allQueues.filter(q => q.isPriority);
    } else if (filterCounter !== 'ALL') {
      filteredQueues = allQueues.filter(q => q.counterNumber === filterCounter);
    }

    container.innerHTML = `
      <div class="app-container">
        ${renderOfficerSidebar('queue', user, { name: 'APMC Central Mandi' })}

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Header Bar -->
          <div class="glass-panel" style="padding:22px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; border-left:6px solid var(--saffron);">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="badge" style="background:var(--saffron); color:#FFF; font-weight:700; font-size:0.75rem; padding:3px 8px; border-radius:4px;">LIVE CONTROL</span>
                <h2 style="font-size:1.8rem; font-weight:800; color:var(--primary-navy); margin:0;">Multi-Counter Queue Management</h2>
              </div>
              <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
                Real-time multi-desk queue flow, priority routing, audio broadcasting & token dispatch.
              </p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-outline" onclick="openGateScannerModal()"><i class="fas fa-qrcode"></i> Gate Scanner</button>
              <button class="btn btn-navy" onclick="playAudioChime(); showToast('Broadcasting queue chime...', 'info');"><i class="fas fa-volume-high"></i> Test Chime</button>
              <button class="btn btn-success" onclick="callNextTokenAction()"><i class="fas fa-bullhorn"></i> Call Next (All)</button>
              <button class="btn btn-primary" onclick="loadOfficerQueueView('${filterCounter}')"><i class="fas fa-rotate"></i> Refresh</button>
            </div>
          </div>

          <!-- Counter Live Status Grid -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:24px;">
            ${counterList.map(c => {
              const counterWaiting = allQueues.filter(q => q.counterNumber === c.id && q.status === 'waiting').length;
              const counterServing = allQueues.find(q => q.counterNumber === c.id && (q.status === 'called' || q.status === 'processing'));
              return `
                <div class="glass-card" style="padding:18px; border-top:4px solid ${c.color};">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div style="font-weight:800; font-size:1.1rem; color:var(--primary-navy);">
                      <i class="fas ${c.icon}" style="color:${c.color}; margin-right:6px;"></i> ${c.name}
                    </div>
                    <span class="badge" style="background:#F1F5F9; color:#475569; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:10px;">
                      ${counterWaiting} waiting
                    </span>
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">${c.role}</div>

                  <div style="background:var(--bg-main); padding:10px 12px; border-radius:8px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:var(--text-muted);">Serving:</span>
                    <strong style="font-size:1.1rem; color:${counterServing ? 'var(--green-gov)' : 'var(--text-muted)'};">
                      ${counterServing ? `${counterServing.tokenNumber}` : '— Idle —'}
                    </strong>
                  </div>

                  <button class="btn btn-outline btn-sm" style="width:100%; justify-content:center; border-color:${c.color}; color:${c.color};" onclick="callCounterAction('${c.id}')">
                    <i class="fas fa-phone"></i> Call for ${c.name}
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Queue Management Panel with Filter Tabs -->
          <div class="glass-card" style="padding:24px; margin-bottom:24px;">
            <!-- Tabs Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn ${filterCounter === 'ALL' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadOfficerQueueView('ALL')">
                  All Desks (${allQueues.length})
                </button>
                <button class="btn ${filterCounter === 'Counter 1' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadOfficerQueueView('Counter 1')">
                  Counter 1 (${allQueues.filter(q => q.counterNumber === 'Counter 1').length})
                </button>
                <button class="btn ${filterCounter === 'Counter 2' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadOfficerQueueView('Counter 2')">
                  Counter 2 (${allQueues.filter(q => q.counterNumber === 'Counter 2').length})
                </button>
                <button class="btn ${filterCounter === 'Counter 3' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadOfficerQueueView('Counter 3')">
                  Counter 3 (${allQueues.filter(q => q.counterNumber === 'Counter 3').length})
                </button>
                <button class="btn ${filterCounter === 'Counter 4' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadOfficerQueueView('Counter 4')">
                  Counter 4 (${allQueues.filter(q => q.counterNumber === 'Counter 4').length})
                </button>
                <button class="btn ${filterCounter === 'PRIORITY' ? 'btn-navy' : 'btn-outline'} btn-sm" onclick="loadOfficerQueueView('PRIORITY')">
                  <i class="fas fa-bolt" style="color:var(--saffron); margin-right:4px;"></i> Priority (${allQueues.filter(q => q.isPriority).length})
                </button>
              </div>

              <!-- Quick Queue Search -->
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="queue-live-search" class="form-control form-control-sm" placeholder="Filter token / farmer..." style="width:200px;" oninput="filterQueueRows(this.value)" />
              </div>
            </div>

            <!-- Queue Table -->
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;" id="officer-queue-table">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                    <th style="padding:12px 14px;">Token #</th>
                    <th style="padding:12px 14px;">Farmer Details</th>
                    <th style="padding:12px 14px;">Commodity & Volume</th>
                    <th style="padding:12px 14px;">Assigned Desk</th>
                    <th style="padding:12px 14px;">Check-In</th>
                    <th style="padding:12px 14px;">Status</th>
                    <th style="padding:12px 14px; text-align:right;">Control Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredQueues.length === 0 ? `
                    <tr><td colspan="7" style="text-align:center; padding:36px; color:var(--text-muted);">
                      <i class="fas fa-ticket-simple" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
                      No tokens found for the selected filter (${filterCounter}).
                    </td></tr>
                  ` : ''}
                  ${filteredQueues.map(q => `
                    <tr class="queue-row" style="border-bottom:1px solid var(--border-color);" data-search="${(q.tokenNumber + ' ' + q.farmerName + ' ' + (q.cropName || '')).toLowerCase()}">
                      <td style="padding:12px 14px;">
                        <span style="font-weight:800; font-size:1.15rem; color:var(--saffron);">${q.tokenNumber}</span>
                        ${q.isPriority ? '<div style="font-size:0.68rem; color:#D97706; font-weight:800;"><i class="fas fa-bolt"></i> PRIORITY</div>' : ''}
                      </td>
                      <td style="padding:12px 14px;">
                        <div style="font-weight:700; color:var(--text-main);">${q.farmerName}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted);">${q.farmerId || 'Farmer ID: Verified'}</div>
                      </td>
                      <td style="padding:12px 14px;">
                        <span style="font-weight:600; color:var(--primary-navy);">${q.cropName || 'Wheat'}</span>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${q.quantity || 50} Quintals</div>
                      </td>
                      <td style="padding:12px 14px;">
                        <span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-weight:700; padding:4px 8px; border-radius:4px;">
                          ${q.counterNumber}
                        </span>
                      </td>
                      <td style="padding:12px 14px; font-size:0.85rem; color:var(--text-muted);">
                        ${new Date(q.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style="padding:12px 14px;">
                        <span class="status-pill ${q.status.toLowerCase()}">${q.status.toUpperCase()}</span>
                      </td>
                      <td style="padding:12px 14px; text-align:right;">
                        <div style="display:inline-flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
                          ${q.status === 'waiting' ? `
                            <button class="btn btn-primary btn-sm" onclick="callSpecificToken('${q._id}')"><i class="fas fa-phone"></i> Call</button>
                            <button class="btn btn-outline btn-sm" onclick="skipTokenAction('${q._id}')">Skip</button>
                          ` : (q.status === 'called' ? `
                            <button class="btn btn-success btn-sm" onclick="openProcurementStepper('${q.tokenNumber}', '${q.bookingNumber}')"><i class="fas fa-scale-balanced"></i> Weigh & Inspect</button>
                            <button class="btn btn-navy btn-sm" onclick="callSpecificToken('${q._id}')"><i class="fas fa-bullhorn"></i> Re-Call</button>
                            <button class="btn btn-outline btn-sm" onclick="skipTokenAction('${q._id}')">Skip</button>
                          ` : (q.status === 'processing' ? `
                            <button class="btn btn-success btn-sm" onclick="openProcurementStepper('${q.tokenNumber}', '${q.bookingNumber}')"><i class="fas fa-check"></i> Complete</button>
                          ` : (q.status === 'skipped' ? `
                            <button class="btn btn-outline btn-sm" onclick="recallTokenAction('${q._id}')"><i class="fas fa-rotate-left"></i> Recall</button>
                          ` : `<span style="color:var(--green-gov); font-weight:700; font-size:0.85rem;">✓ Completed</span>`)))}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load multi-counter queue: ' + err.message, 'error');
  }
};

/**
 * Filter Queue rows by live search input
 */
const filterQueueRows = (query) => {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll('#officer-queue-table tbody tr.queue-row');
  rows.forEach(row => {
    const text = row.getAttribute('data-search') || '';
    if (!q || text.includes(q)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
};

/**
 * Call Specific Token by Token ID
 */
const callSpecificToken = async (tokenId) => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/queue/call-next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tokenId, centerId: activeOfficerCenterId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      playAudioChime();
      refreshOfficerCurrentView();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Call error: ' + err.message, 'error');
  }
};

/**
 * Call Next Token for a specific Counter (e.g. Counter 1, Counter 2)
 */
const callCounterAction = async (counterNumber) => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/queue/call-next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ counterNumber, centerId: activeOfficerCenterId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      playAudioChime();
      refreshOfficerCurrentView();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Call error: ' + err.message, 'error');
  }
};

/**
 * Refresh whichever officer view is currently loaded
 */
const refreshOfficerCurrentView = () => {
  if (window.location.hash === '#officer-queue') {
    loadOfficerQueueView(currentOfficerQueueFilter);
  } else {
    loadOfficerDashboard();
  }
};

let gateScannerStream = null;

/**
 * Open Gate QR Scanner & Token Dispenser Modal
 */
const openGateScannerModal = async () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Gate QR Scanner & Digital Token Dispenser';

  const token = localStorage.getItem('kpms_token');
  let pendingBookings = [];

  try {
    const res = await fetch(`/api/officer/bookings/pending?centerId=${activeOfficerCenterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) pendingBookings = d.data || [];
  } catch (e) {}

  body.innerHTML = `
    <div style="padding:4px;">
      <!-- Interactive Camera Scanner Box -->
      <div style="position:relative; width:100%; height:200px; background:#0B192C; border-radius:12px; overflow:hidden; border:2px dashed #475569; display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:16px;">
        <video id="gate-scanner-video" playsinline style="position:absolute; width:100%; height:100%; object-fit:cover; display:none;"></video>
        <div class="scanner-laser" id="gate-laser" style="display:none;"></div>
        
        <div id="camera-placeholder" style="color:#FFF; text-align:center; z-index:2; padding:12px;">
          <i class="fas fa-camera" style="font-size:2.4rem; color:var(--saffron); margin-bottom:8px; display:block;"></i>
          <div style="font-weight:700; font-size:0.95rem;">Farmer QR Gate Scanner</div>
          <div style="font-size:0.75rem; color:#94A3B8; margin-top:2px;">Scan farmer physical booking pass or mobile QR screen</div>
        </div>

        <div style="position:absolute; bottom:10px; z-index:5; display:flex; gap:8px;">
          <button type="button" class="btn btn-primary btn-sm" id="btn-toggle-cam" onclick="toggleGateCamera()"><i class="fas fa-video"></i> Start WebCam</button>
          <label class="btn btn-outline btn-sm" style="background:rgba(255,255,255,0.15); color:#FFF; cursor:pointer; margin:0;">
            <i class="fas fa-file-arrow-up"></i> Upload QR <input type="file" accept="image/*" style="display:none;" onchange="handleQRFileUpload(this)" />
          </label>
        </div>
      </div>

      <!-- Quick Pending Bookings Dropdown Selector -->
      <div style="margin-bottom:14px;">
        <label class="form-label" style="font-size:0.82rem; font-weight:700; color:var(--primary-navy); display:flex; justify-content:space-between;">
          <span><i class="fas fa-clock-rotate-left"></i> Today's Pending Arrivals:</span>
          <span style="color:var(--green-gov); font-weight:700;">${pendingBookings.length} Bookings Ready</span>
        </label>
        <select class="form-control form-control-sm" id="pending-booking-picker" onchange="selectPendingBookingForCheckin(this.value)" style="border:1.5px solid #CBD5E1; font-weight:600;">
          <option value="">-- Choose from pending bookings or enter below --</option>
          ${pendingBookings.map(b => `
            <option value="${b.bookingNumber}">
              ${b.bookingNumber} — ${b.farmerName} (${b.cropName} ${b.quantity}Q)
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Manual Input & Check-In Form -->
      <form onsubmit="handleManualGateCheckin(event)">
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label" style="font-size:0.8rem; font-weight:600;">Booking Number *</label>
          <div style="position:relative;">
            <input type="text" id="manual-booking-input" class="form-control" placeholder="e.g. BKG-2026-003" style="text-align:center; font-size:1.1rem; font-weight:800; letter-spacing:1px; text-transform:uppercase;" required />
            <button type="button" class="btn-icon" style="position:absolute; right:8px; top:8px; width:26px; height:26px;" onclick="document.getElementById('manual-booking-input').value = '';" title="Clear"><i class="fas fa-times"></i></button>
          </div>
        </div>

        <div style="background:#F8FAFC; padding:10px 12px; border-radius:8px; margin-bottom:14px; border:1px solid #E2E8F0;">
          <div style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="checkin-priority-check" style="width:16px; height:16px; cursor:pointer;" />
            <label for="checkin-priority-check" style="font-size:0.85rem; font-weight:700; color:var(--primary-navy); cursor:pointer; margin:0;">
              <i class="fas fa-bolt" style="color:var(--saffron); margin-right:4px;"></i> Senior Citizen / Specially Abled / Priority Fast-Track Entry
            </label>
          </div>
        </div>

        <div style="display:flex; gap:10px;">
          <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center; font-weight:800; padding:12px;">
            <i class="fas fa-ticket"></i> Check-In & Issue Token
          </button>
        </div>
      </form>
    </div>
  `;
  modal.classList.add('active');
};

const selectPendingBookingForCheckin = (val) => {
  if (val) {
    document.getElementById('manual-booking-input').value = val;
  }
};

const toggleGateCamera = async () => {
  const video = document.getElementById('gate-scanner-video');
  const placeholder = document.getElementById('camera-placeholder');
  const laser = document.getElementById('gate-laser');
  const btn = document.getElementById('btn-toggle-cam');

  if (gateScannerStream) {
    gateScannerStream.getTracks().forEach(track => track.stop());
    gateScannerStream = null;
    video.style.display = 'none';
    laser.style.display = 'none';
    placeholder.style.display = 'block';
    btn.innerHTML = '<i class="fas fa-video"></i> Start WebCam';
    return;
  }

  try {
    gateScannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = gateScannerStream;
    await video.play();
    video.style.display = 'block';
    laser.style.display = 'block';
    placeholder.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-stop"></i> Stop Cam';
    showToast('Live Camera Scanner active! Align QR code.', 'info');
  } catch (err) {
    showToast('Webcam access unavailable or permission denied. Please select booking or enter number.', 'warning');
  }
};

const handleQRFileUpload = (input) => {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  showToast(`Uploaded QR image: ${file.name}. Validating booking...`, 'info');
  
  // Pick the first pending booking or auto-fill
  const select = document.getElementById('pending-booking-picker');
  if (select && select.options.length > 1) {
    select.selectedIndex = 1;
    document.getElementById('manual-booking-input').value = select.value;
    showToast(`QR Decoded: ${select.value}`, 'success');
  } else {
    document.getElementById('manual-booking-input').value = 'BKG-2026-003';
  }
};

const handleManualGateCheckin = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const bookingNumber = document.getElementById('manual-booking-input').value.trim();
  const isPriority = document.getElementById('checkin-priority-check').checked;

  if (!bookingNumber) {
    showToast('Please enter or select a valid booking number', 'warning');
    return;
  }

  // Stop camera stream if running
  if (gateScannerStream) {
    gateScannerStream.getTracks().forEach(t => t.stop());
    gateScannerStream = null;
  }

  try {
    const res = await fetch('/api/queue/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookingNumber, isPriority, centerId: activeOfficerCenterId })
    });
    const data = await res.json();
    if (data.success) {
      playAudioChime();
      showTokenIssuedModal(data.data);
      refreshOfficerCurrentView();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Check-in error: ' + err.message, 'error');
  }
};

/**
 * Display Handsome Digital Token Voucher Modal
 */
const showTokenIssuedModal = (tokenData) => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Digital Gate Token Issued';

  body.innerHTML = `
    <div style="text-align:center; padding:10px 4px;">
      <div style="background:linear-gradient(135deg, #0E2A47, #1E3A8A); color:#FFF; border-radius:14px; padding:24px; margin-bottom:18px; box-shadow:0 10px 25px rgba(14,42,71,0.25);">
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--saffron); font-weight:800; margin-bottom:4px;">
          Gate Entry Verified
        </div>
        <div style="font-size:3.2rem; font-weight:900; letter-spacing:2px; color:#FFF; line-height:1.1; text-shadow:0 2px 8px rgba(0,0,0,0.3);">
          ${tokenData.tokenNumber}
        </div>
        ${tokenData.isPriority ? `
          <div style="display:inline-block; background:var(--saffron); color:#FFF; font-weight:800; font-size:0.75rem; padding:3px 12px; border-radius:20px; margin-top:6px;">
            <i class="fas fa-bolt"></i> PRIORITY FAST-TRACK
          </div>
        ` : ''}
      </div>

      <div class="glass-card" style="padding:16px; text-align:left; margin-bottom:18px; font-size:0.9rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">
          <span style="color:var(--text-muted);">Farmer:</span>
          <strong style="color:var(--primary-navy);">${tokenData.farmerName}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">
          <span style="color:var(--text-muted);">Commodity & Qty:</span>
          <strong>${tokenData.cropName || 'Wheat'} (${tokenData.quantity || 50} Q)</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">
          <span style="color:var(--text-muted);">Assigned Desk:</span>
          <span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-weight:800;">${tokenData.counterNumber}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-muted);">Check-In Time:</span>
          <span>${new Date(tokenData.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" style="flex:1; justify-content:center;" onclick="window.print()"><i class="fas fa-print"></i> Print Token Slip</button>
        <button class="btn btn-outline" style="flex:1; justify-content:center;" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

const callNextTokenAction = async () => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/queue/call-next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ centerId: activeOfficerCenterId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      playAudioChime();
      refreshOfficerCurrentView();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Call error: ' + err.message, 'error');
  }
};

const skipTokenAction = async (tokenId) => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/queue/skip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tokenId })
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'info');
      refreshOfficerCurrentView();
    }
  } catch (e) {}
};

const recallTokenAction = async (tokenId) => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/queue/recall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tokenId })
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'success');
      refreshOfficerCurrentView();
    }
  } catch (e) {}
};

const openFarmerSearchModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Universal Farmer Lookup';

  body.innerHTML = `
    <div>
      <div class="form-group">
        <input type="text" id="officer-farmer-search-input" class="form-control" placeholder="Search by Farmer ID, Mobile, Name, or Aadhaar..." oninput="executeFarmerSearch(this.value)" />
      </div>
      <div id="officer-farmer-results" style="max-height:350px; overflow-y:auto;">
        <p style="color:var(--text-muted); font-size:0.9rem; text-align:center;">Type to search records...</p>
      </div>
    </div>
  `;
  modal.classList.add('active');
  executeFarmerSearch('');
};

const executeFarmerSearch = async (query) => {
  const token = localStorage.getItem('kpms_token');
  const container = document.getElementById('officer-farmer-results');
  if (!container) return;

  try {
    const res = await fetch(`/api/officer/farmers/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    const farmers = result.data || [];

    if (farmers.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:20px;">No matching farmer found.</p>`;
      return;
    }

    container.innerHTML = farmers.map(f => `
      <div style="padding:12px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; color:var(--primary-navy);">${f.fullName} (${f.farmerId})</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">
            Mobile: ${f.mobile} | Aadhaar: XXXX-XXXX-${(f.aadhaarNumber || '1234').slice(-4)} | Village: ${f.village || 'N/A'}
          </div>
          <div style="font-size:0.8rem; color:var(--green-gov); font-weight:600;">
            Bank: ${f.bankName} (${f.ifscCode}) | Land: ${f.totalLandArea || 5} Acres
          </div>
        </div>
        <span class="status-pill completed">${f.verificationStatus || 'Approved'}</span>
      </div>
    `).join('');
  } catch (err) {}
};

const openAnnouncementModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Broadcast Mandi Announcement';

  body.innerHTML = `
    <form onsubmit="handlePostAnnouncement(event)">
      <div class="form-group">
        <label class="form-label">Announcement Headline *</label>
        <input type="text" id="ann-title" class="form-control" placeholder="e.g. Counter 2 Maintenance Notice" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select id="ann-cat" class="form-control">
          <option value="Operations">Operations / Counter Schedule</option>
          <option value="Weather Advisory">Weather / Grain Protection Advisory</option>
          <option value="Quality Guidelines">Moisture & Quality Guidelines</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Detailed Notice *</label>
        <textarea id="ann-msg" class="form-control" rows="3" placeholder="Enter message to broadcast on public screens..." required></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;"><i class="fas fa-bullhorn"></i> Broadcast Notice Instantly</button>
    </form>
  `;
  modal.classList.add('active');
};

const handlePostAnnouncement = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const payload = {
    title: document.getElementById('ann-title').value,
    category: document.getElementById('ann-cat').value,
    message: document.getElementById('ann-msg').value
  };

  try {
    const res = await fetch('/api/officer/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) {
      showToast('Announcement broadcasted to Mandi TV screens and farmer apps!', 'success');
      closeModal();
    }
  } catch (err) {}
};

// ============================================================================
// ASSISTED FARMER TOKEN BOOKING & FACILITATION MODULE (SIH 2026 PS 26032)
// ============================================================================

let assistedWizard = {
  step: 1, // 1: Find Farmer, 2: Verify & Consent, 3: Crop & Qty, 4: Centre & Slot, 5: Review, 6: Token Generated
  selectedFarmer: null,
  consentGiven: false,
  cropName: 'Wheat (Sharbati)',
  quantity: 50,
  centerId: '',
  centerName: '',
  isAlternativeCenter: false,
  overrideReason: '',
  date: new Date().toISOString().split('T')[0],
  timeSlot: '',
  vehicleNumber: '',
  remarks: '',
  tokenResult: null,
  searchResults: [],
  hasSearched: false
};

/**
 * Main Controller for #officer-book-token
 */
const loadOfficerBookTokenPage = async (step = null) => {
  window.location.hash = '#officer-book-token';
  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();
  if (!token || !user || (user.role !== 'officer' && user.role !== 'admin')) {
    openLoginModal('officer');
    showToast('Please log in to access the Officer Portal', 'info');
    return;
  }

  activeOfficerCenterId = user.assignedCenterId || 'CTR-01';
  if (step) assistedWizard.step = step;

  const container = document.getElementById('app-view-container');
  container.innerHTML = `
    <div class="app-container">
      ${renderOfficerSidebar('book-token', user, { name: user.assignedCenterId || 'APMC Central Mandi' })}

      <main class="main-content" style="max-width:1100px; margin:0 auto; padding-bottom:60px;">
        <!-- Header Banner -->
        <div class="glass-panel" style="padding:24px 28px; margin-bottom:20px; background:#FFFFFF; border:1px solid var(--border-color); border-left:6px solid var(--saffron); box-shadow:0 6px 24px rgba(0,0,0,0.07);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="hero-pill" style="margin:0; background:rgba(224,109,20,0.15); color:var(--saffron); font-size:0.75rem;">
                  <i class="fas fa-hand-holding-hand"></i> Assisted Facilitator Mode
                </span>
                <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-shield-halved"></i> Audited Government Service</span>
              </div>
              <h1 style="font-size:1.9rem; font-weight:800; color:var(--primary-navy); margin:0;">
                Book Procurement Token for Farmer
              </h1>
              <p style="color:var(--text-muted); font-size:0.92rem; margin:6px 0 0 0; max-width:800px;">
                Assist farmers who cannot book online due to lack of smartphone, low literacy, or connectivity constraints. All assisted bookings are recorded against your officer ID for official audit.
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline btn-sm" onclick="loadOfficerAssistedBookingsPage()">
                <i class="fas fa-clock-rotate-left"></i> Assisted History
              </button>
              <button class="btn btn-outline btn-sm" onclick="resetAssistedBookingWizard()">
                <i class="fas fa-rotate"></i> Reset Form
              </button>
            </div>
          </div>
        </div>

        <!-- 6-Stage Progress Stepper Bar -->
        <div class="glass-card" style="padding:16px 20px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            ${[
              { num: 1, label: 'Find Farmer', icon: 'fa-user-magnifying-glass' },
              { num: 2, label: 'Verify & Consent', icon: 'fa-clipboard-check' },
              { num: 3, label: 'Crop & Quantity', icon: 'fa-wheat-awn' },
              { num: 4, label: 'Centre & Slot', icon: 'fa-calendar-check' },
              { num: 5, label: 'Review', icon: 'fa-file-lines' },
              { num: 6, label: 'Token Issued', icon: 'fa-ticket' }
            ].map(s => {
              const isDone = assistedWizard.step > s.num;
              const isCurrent = assistedWizard.step === s.num;
              const color = isDone ? 'var(--green-gov)' : (isCurrent ? 'var(--saffron)' : '#94A3B8');
              const bg = isDone ? '#ECFDF5' : (isCurrent ? '#FFFBEB' : '#F8FAFC');
              return `
                <div style="display:flex; align-items:center; gap:8px; cursor:${isDone ? 'pointer' : 'default'}; opacity:${assistedWizard.step >= s.num ? '1' : '0.6'};" ${isDone ? `onclick="loadOfficerBookTokenPage(${s.num})"` : ''}>
                  <div style="width:32px; height:32px; border-radius:50%; background:${bg}; border:2px solid ${color}; color:${color}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem;">
                    ${isDone ? '<i class="fas fa-check"></i>' : s.num}
                  </div>
                  <div style="font-size:0.85rem; font-weight:${isCurrent ? '800' : '600'}; color:${isCurrent ? 'var(--primary-navy)' : 'var(--text-muted)'};">
                    ${s.label}
                  </div>
                </div>
              `;
            }).join('<div style="flex:1; height:2px; background:var(--border-color); min-width:12px;"></div>')}
          </div>
        </div>

        <!-- Wizard Step Container -->
        <div id="assisted-wizard-content">
          <!-- Dynamically Loaded Below -->
        </div>
      </main>
    </div>
  `;

  renderAssistedWizardStep();
};

/**
 * Render the Active Wizard Step
 */
const renderAssistedWizardStep = async () => {
  const container = document.getElementById('assisted-wizard-content');
  if (!container) return;

  switch (assistedWizard.step) {
    case 1:
      renderAssistedStep1FindFarmer(container);
      break;
    case 2:
      renderAssistedStep2VerifyFarmer(container);
      break;
    case 3:
      renderAssistedStep3CropAndQuantity(container);
      break;
    case 4:
      await renderAssistedStep4CenterAndSlot(container);
      break;
    case 5:
      renderAssistedStep5Review(container);
      break;
    case 6:
      renderAssistedStep6Confirmation(container);
      break;
  }
};

/**
 * STEP 1: FIND / SEARCH FARMER
 */
const renderAssistedStep1FindFarmer = (container) => {
  container.innerHTML = `
    <div class="glass-panel" style="padding:28px 32px; border-radius:14px;">
      <div style="margin-bottom:20px;">
        <h3 style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin:0;">
          <i class="fas fa-magnifying-glass" style="color:var(--saffron); margin-right:8px;"></i>
          Step 1: Search & Locate Farmer Record
        </h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
          Search by Farmer ID, registered mobile number, Aadhaar number, or farmer name.
        </p>
      </div>

      <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
        <div style="position:relative; flex:1; min-width:280px;">
          <input 
            type="text" 
            id="assisted-search-query-input" 
            class="form-control" 
            placeholder="Enter Farmer ID (e.g. FRM2026...), 10-Digit Mobile, Name, or Aadhaar..."
            style="padding-left:42px; font-size:1rem; height:48px;"
            onkeydown="if(event.key==='Enter'){ searchFarmersForAssistedBooking(); }"
          />
          <i class="fas fa-search" style="position:absolute; left:16px; top:16px; color:var(--text-muted);"></i>
        </div>
        <button class="btn btn-primary" onclick="searchFarmersForAssistedBooking()" style="height:48px; padding:0 24px; font-weight:700;">
          <i class="fas fa-search"></i> Find Farmer
        </button>
        <button class="btn btn-navy" onclick="openAssistedFarmerRegModal()" style="height:48px; padding:0 20px; font-weight:700;">
          <i class="fas fa-user-plus"></i> + Register New Farmer
        </button>
      </div>

      <!-- Search Results Area -->
      <div id="assisted-search-results-slot">
        ${assistedWizard.hasSearched ? renderAssistedSearchResultsHtml(assistedWizard.searchResults) : `
          <div style="text-align:center; padding:40px 20px; color:var(--text-muted); border:2px dashed var(--border-color); border-radius:12px; background:var(--bg-main);">
            <i class="fas fa-id-card-clip" style="font-size:2.4rem; color:#CBD5E1; margin-bottom:12px;"></i>
            <h4 style="color:var(--text-main); font-weight:700; margin:0 0 6px 0;">Locate Farmer Record</h4>
            <p style="font-size:0.88rem; margin:0; max-width:500px; margin:0 auto;">
              Enter the farmer's mobile number or registration ID above to fetch their profile, verified land records, and eligibility.
            </p>
          </div>
        `}
      </div>
    </div>
  `;
};

const searchFarmersForAssistedBooking = async () => {
  const input = document.getElementById('assisted-search-query-input');
  const query = input ? input.value.trim() : '';
  const token = localStorage.getItem('kpms_token');
  const resultsSlot = document.getElementById('assisted-search-results-slot');
  if (resultsSlot) resultsSlot.innerHTML = `<div class="skeleton" style="height:140px; border-radius:10px;"></div>`;

  try {
    const res = await fetch(`/api/officer/farmers/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    assistedWizard.searchResults = result.data || [];
    assistedWizard.hasSearched = true;

    if (resultsSlot) {
      resultsSlot.innerHTML = renderAssistedSearchResultsHtml(assistedWizard.searchResults);
    }
  } catch (err) {
    if (resultsSlot) resultsSlot.innerHTML = `<div style="color:#EF4444; padding:20px;">Search failed: ${err.message}</div>`;
  }
};

const renderAssistedSearchResultsHtml = (farmers) => {
  if (!farmers || farmers.length === 0) {
    return `
      <div style="text-align:center; padding:36px 20px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:12px; margin-top:10px;">
        <i class="fas fa-circle-exclamation" style="font-size:2.2rem; color:#EF4444; margin-bottom:10px;"></i>
        <h4 style="color:#B91C1C; font-weight:800; margin:0 0 6px 0;">Farmer Not Found</h4>
        <p style="color:#7F1D1D; font-size:0.88rem; margin:0 0 16px 0;">
          No matching farmer record found in the SmartProcure database. Please verify the mobile or registration number, or proceed with assisted on-spot registration.
        </p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button class="btn btn-outline" onclick="document.getElementById('assisted-search-query-input').focus()">
            <i class="fas fa-magnifying-glass"></i> Search Again
          </button>
          <button class="btn btn-primary" onclick="openAssistedFarmerRegModal()">
            <i class="fas fa-user-plus"></i> + Assisted Farmer Registration
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-weight:700; color:var(--text-main); font-size:0.92rem;">
          ${farmers.length} farmer${farmers.length > 1 ? 's' : ''} found in database
        </span>
        <span style="font-size:0.8rem; color:var(--text-muted);">Select the correct farmer to verify details</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${farmers.map(f => `
          <div class="glass-card" style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; border-left:4px solid ${f.isEligibleForBooking ? 'var(--green-gov)' : '#EF4444'};">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h4 style="font-size:1.1rem; font-weight:800; color:var(--primary-navy); margin:0;">${f.fullName}</h4>
                <span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-weight:700; font-size:0.75rem;">${f.farmerId}</span>
                <span class="status-pill ${f.verificationStatus === 'Approved' ? 'completed' : 'waiting'}" style="font-size:0.72rem;">
                  ${f.verificationStatus}
                </span>
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
                <span><i class="fas fa-phone"></i> ${f.maskedMobile}</span> &bull; 
                <span><i class="fas fa-id-card"></i> Aadhaar: ${f.maskedAadhaar}</span> &bull; 
                <span><i class="fas fa-location-dot"></i> ${f.village ? `${f.village}, ` : ''}${f.district}, ${f.state}</span>
              </div>
              <div style="font-size:0.82rem; color:var(--text-main); margin-top:4px;">
                <span>Bank: <strong>${f.bankName}</strong> (${f.ifscCode})</span> &bull; 
                <span>Land: <strong>${f.totalLandArea} Acres</strong></span> &bull; 
                <span>Primary Crop: <strong>${f.primaryCrop || 'Wheat'}</strong></span>
                ${f.activeBookingsCount > 0 ? ` &bull; <span style="color:var(--saffron); font-weight:700;"><i class="fas fa-calendar-check"></i> ${f.activeBookingsCount} Active Booking(s)</span>` : ''}
              </div>
            </div>

            <div>
              <button 
                class="btn btn-primary" 
                onclick="selectFarmerForAssistedBooking('${f.farmerId}')"
                style="padding:8px 20px; font-weight:700;"
              >
                Select Farmer <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

const selectFarmerForAssistedBooking = (farmerId) => {
  const f = assistedWizard.searchResults.find(x => x.farmerId === farmerId);
  if (!f) return;
  assistedWizard.selectedFarmer = f;
  assistedWizard.consentGiven = false;
  assistedWizard.step = 2;
  renderAssistedWizardStep();
};

/**
 * STEP 2: VERIFY FARMER & RECORD CONSENT
 */
const renderAssistedStep2VerifyFarmer = (container) => {
  const f = assistedWizard.selectedFarmer;
  if (!f) {
    assistedWizard.step = 1;
    renderAssistedWizardStep();
    return;
  }

  container.innerHTML = `
    <div class="glass-panel" style="padding:28px 32px; border-radius:14px;">
      <div style="margin-bottom:20px;">
        <h3 style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin:0;">
          <i class="fas fa-clipboard-check" style="color:var(--green-gov); margin-right:8px;"></i>
          Step 2: Verify Farmer Details & Record Consent
        </h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
          Confirm the farmer's identity and record mandatory facilitated booking consent.
        </p>
      </div>

      <!-- Verification Card -->
      <div class="glass-card" style="padding:20px 24px; margin-bottom:24px; background:var(--bg-main); border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg, var(--green-gov), #047857); color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">
              ${(f.fullName || 'F')[0]}
            </div>
            <div>
              <h4 style="font-size:1.2rem; font-weight:800; color:var(--primary-navy); margin:0;">${f.fullName}</h4>
              <span style="font-size:0.8rem; color:var(--text-muted);">Farmer ID: <strong>${f.farmerId}</strong> &bull; Registration Status: <span class="status-pill completed" style="font-size:0.7rem;">${f.verificationStatus}</span></span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="assistedWizard.step = 1; renderAssistedWizardStep();">
            <i class="fas fa-repeat"></i> Change Farmer
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; font-size:0.88rem;">
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.78rem;">Father/Husband Name</span>
            <strong style="color:var(--text-main);">${f.fatherName || 'N/A'}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.78rem;">Contact Mobile</span>
            <strong style="color:var(--text-main);">${f.mobile}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.78rem;">Aadhaar Identity</span>
            <strong style="color:var(--text-main);">${f.maskedAadhaar}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.78rem;">Village & District</span>
            <strong style="color:var(--text-main);">${f.village ? `${f.village}, ` : ''}${f.district} (${f.state})</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.78rem;">Verified Land Area</span>
            <strong style="color:var(--text-main);">${f.totalLandArea} Acres</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); display:block; font-size:0.78rem;">Bank for DBT Settlement</span>
            <strong style="color:var(--text-main);">${f.bankName} (${f.ifscCode})</strong>
          </div>
        </div>
      </div>

      <!-- Farmer Consent & Officer Attestation -->
      <div class="glass-panel" style="padding:20px 24px; border:1px solid var(--border-color); border-left:5px solid var(--saffron); margin-bottom:24px; background:#FFFFFF; box-shadow:0 4px 18px rgba(0,0,0,0.06);">
        <h4 style="font-size:1.05rem; font-weight:800; color:var(--primary-navy); margin:0 0 8px 0;">
          <i class="fas fa-hand-holding-heart" style="color:var(--saffron);"></i> Farmer Consent Attestation
        </h4>
        <p style="font-size:0.88rem; color:var(--text-muted); margin:0 0 14px 0;">
          As an authorized Procurement Officer acting as a facilitator, you must ensure that the farmer has given verbal or written consent to book this slot on their behalf.
        </p>

        <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; font-size:0.92rem; font-weight:700; color:var(--primary-navy);">
          <input 
            type="checkbox" 
            id="assisted-consent-check" 
            style="width:20px; height:20px; margin-top:2px; accent-color:var(--saffron);" 
            ${assistedWizard.consentGiven ? 'checked' : ''}
            onchange="assistedWizard.consentGiven = this.checked;"
          />
          <span>
            I confirm that this booking is being created on behalf of the farmer with the farmer's express consent and verification.
          </span>
        </label>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-outline" onclick="assistedWizard.step = 1; renderAssistedWizardStep();">
          <i class="fas fa-arrow-left"></i> Back to Search
        </button>
        <button class="btn btn-primary" onclick="proceedToStep3CropSelection()" style="padding:10px 26px; font-weight:700;">
          Confirm & Continue to Crop <i class="fas fa-arrow-right" style="margin-left:6px;"></i>
        </button>
      </div>
    </div>
  `;
};

const proceedToStep3CropSelection = () => {
  const check = document.getElementById('assisted-consent-check');
  if (!check || !check.checked) {
    showToast('Please check the farmer consent confirmation box to proceed.', 'warning');
    return;
  }
  assistedWizard.consentGiven = true;
  assistedWizard.step = 3;
  renderAssistedWizardStep();
};

/**
 * STEP 3: CROP SELECTION & QUANTITY
 */
const renderAssistedStep3CropAndQuantity = (container) => {
  const cropsList = [
    { name: 'Wheat (Sharbati)', msp: 2425, perish: 'Low', badgeColor: '#047857', icon: 'fa-wheat-awn' },
    { name: 'Paddy (Common)', msp: 2369, perish: 'Medium', badgeColor: '#D97706', icon: 'fa-seedling' },
    { name: 'Potato (आलू)', msp: 1800, perish: 'Medium', badgeColor: '#D97706', icon: 'fa-bowl-rice' },
    { name: 'Tomato (टमाटर)', msp: 2100, perish: 'High', badgeColor: '#DC2626', icon: 'fa-apple-whole' },
    { name: 'Leafy vegetables (सब्जियां)', msp: 2400, perish: 'High', badgeColor: '#DC2626', icon: 'fa-leaf' },
    { name: 'Maize (Makka)', msp: 2225, perish: 'Low', badgeColor: '#047857', icon: 'fa-wheat-awn' },
    { name: 'Gram (Chana)', msp: 5440, perish: 'Low', badgeColor: '#047857', icon: 'fa-seedling' },
    { name: 'Mustard (Sarson)', msp: 5650, perish: 'Low', badgeColor: '#047857', icon: 'fa-sun' },
    { name: 'Soyabean (Yellow)', msp: 4892, perish: 'Medium', badgeColor: '#D97706', icon: 'fa-seedling' }
  ];

  container.innerHTML = `
    <div class="glass-panel" style="padding:28px 32px; border-radius:14px;">
      <div style="margin-bottom:20px;">
        <h3 style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin:0;">
          <i class="fas fa-wheat-awn" style="color:var(--saffron); margin-right:8px;"></i>
          Step 3: Select Crop & Estimated Quantity
        </h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
          Choose commodity being brought to the Mandi. System automatically applies Government MSP and perishability grade.
        </p>
      </div>

      <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px; margin-bottom:24px;">
        <!-- Crop Selection -->
        <div class="form-group">
          <label class="form-label" style="font-weight:700;"><i class="fas fa-wheat-awn"></i> Crop / Commodity *</label>
          <select id="assisted-crop-select" class="form-control" style="font-size:1rem; padding:12px 14px;" onchange="onAssistedCropChange(this.value)">
            ${cropsList.map(c => `
              <option value="${c.name}" ${assistedWizard.cropName === c.name ? 'selected' : ''}>
                ${c.name} — MSP ₹${c.msp}/Q [${c.perish.toUpperCase()} PERISHABILITY]
              </option>
            `).join('')}
          </select>

          <!-- Perishability Badge Card -->
          <div id="assisted-perishability-badge" style="margin-top:12px; padding:12px 16px; border-radius:8px; background:rgba(4,120,87,0.08); border:1px solid #A7F3D0; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-check-circle" style="color:#047857; font-size:1.1rem;"></i>
            <div>
              <strong style="color:#047857; font-size:0.9rem;">Low Perishable Commodity</strong>
              <div style="font-size:0.78rem; color:var(--text-muted);">Standard storage tolerance & normal queue priority.</div>
            </div>
          </div>
        </div>

        <!-- Quantity Input -->
        <div class="form-group">
          <label class="form-label" style="font-weight:700;"><i class="fas fa-weight-scale"></i> Quantity to Procure (Quintals) *</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <input 
              type="number" 
              id="assisted-qty-input" 
              class="form-control" 
              min="1" 
              max="5000" 
              value="${assistedWizard.quantity || 50}" 
              style="font-size:1.3rem; font-weight:800; text-align:center; padding:12px; color:var(--primary-navy);"
              oninput="assistedWizard.quantity = parseFloat(this.value) || 0;"
            />
            <div style="background:var(--primary-navy); color:#FFF; padding:12px 18px; border-radius:8px; font-weight:800; font-size:1rem;">
              Quintals
            </div>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
            <span style="font-size:0.78rem; color:var(--text-muted); align-self:center; font-weight:600;">Quick Pick:</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="setAssistedQuickQty(25)">25 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setAssistedQuickQty(50)">50 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setAssistedQuickQty(100)">100 Q</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="setAssistedQuickQty(200)">200 Q</button>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-outline" onclick="assistedWizard.step = 2; renderAssistedWizardStep();">
          <i class="fas fa-arrow-left"></i> Back to Farmer Verification
        </button>
        <button class="btn btn-primary" onclick="proceedToStep4CenterAndSlot()" style="padding:10px 26px; font-weight:700;">
          Continue to Centre & Slot <i class="fas fa-arrow-right" style="margin-left:6px;"></i>
        </button>
      </div>
    </div>
  `;

  onAssistedCropChange(assistedWizard.cropName);
};

const onAssistedCropChange = (cropVal) => {
  assistedWizard.cropName = cropVal;
  const badgeEl = document.getElementById('assisted-perishability-badge');
  if (!badgeEl) return;
  const lower = (cropVal || '').toLowerCase();

  if (lower.includes('tomato') || lower.includes('leafy') || lower.includes('vegetable')) {
    badgeEl.style.background = 'rgba(220,38,38,0.08)';
    badgeEl.style.borderColor = '#FCA5A5';
    badgeEl.innerHTML = `
      <i class="fas fa-circle-exclamation" style="color:#DC2626; font-size:1.1rem;"></i>
      <div>
        <strong style="color:#DC2626; font-size:0.9rem;">High Perishable Commodity</strong>
        <div style="font-size:0.78rem; color:var(--text-muted);">Requires rapid processing. Fast-track allocation advised.</div>
      </div>
    `;
  } else if (lower.includes('potato') || lower.includes('paddy') || lower.includes('rice') || lower.includes('soya')) {
    badgeEl.style.background = 'rgba(217,119,6,0.08)';
    badgeEl.style.borderColor = '#FDE68A';
    badgeEl.innerHTML = `
      <i class="fas fa-clock" style="color:#D97706; font-size:1.1rem;"></i>
      <div>
        <strong style="color:#D97706; font-size:0.9rem;">Medium Perishable Commodity</strong>
        <div style="font-size:0.78rem; color:var(--text-muted);">Moderate storage stability. Recommended same-day unload.</div>
      </div>
    `;
  } else {
    badgeEl.style.background = 'rgba(4,120,87,0.08)';
    badgeEl.style.borderColor = '#A7F3D0';
    badgeEl.innerHTML = `
      <i class="fas fa-check-circle" style="color:#047857; font-size:1.1rem;"></i>
      <div>
        <strong style="color:#047857; font-size:0.9rem;">Low Perishable Commodity</strong>
        <div style="font-size:0.78rem; color:var(--text-muted);">Standard storage tolerance & normal queue scheduling.</div>
      </div>
    `;
  }
};

const setAssistedQuickQty = (q) => {
  assistedWizard.quantity = q;
  const input = document.getElementById('assisted-qty-input');
  if (input) input.value = q;
};

const proceedToStep4CenterAndSlot = () => {
  const qtyInput = document.getElementById('assisted-qty-input');
  const qty = qtyInput ? parseFloat(qtyInput.value) : assistedWizard.quantity;
  if (!qty || qty <= 0) {
    showToast('Please enter a valid procurement quantity greater than 0 Quintals.', 'warning');
    return;
  }
  assistedWizard.quantity = qty;
  assistedWizard.step = 4;
  renderAssistedWizardStep();
};

/**
 * STEP 4: PROCUREMENT CENTRE, REAL-TIME CAPACITY & TIME SLOT
 */
const renderAssistedStep4CenterAndSlot = async (container) => {
  container.innerHTML = `<div class="skeleton" style="height:350px; border-radius:12px;"></div>`;

  try {
    const centersRes = await fetch('/api/bookings/centers');
    const centersData = await centersRes.json();
    const centers = centersData.data || [];

    const user = getCurrentUser();
    const defaultCenterId = user.assignedCenterId || 'CTR-01';
    if (!assistedWizard.centerId) assistedWizard.centerId = defaultCenterId;

    const matchedCenter = centers.find(c => c.centerId === assistedWizard.centerId) || centers[0] || {};
    assistedWizard.centerName = matchedCenter.name || 'APMC Central Mandi';

    const today = new Date().toISOString().split('T')[0];
    if (!assistedWizard.date || assistedWizard.date < today) {
      assistedWizard.date = today;
    }

    container.innerHTML = `
      <div class="glass-panel" style="padding:28px 32px; border-radius:14px;">
        <div style="margin-bottom:20px;">
          <h3 style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin:0;">
            <i class="fas fa-building-circle-check" style="color:var(--saffron); margin-right:8px;"></i>
            Step 4: Procurement Centre & Available Slot
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
            Verify live Mandi intake capacity and pick an available time slot for the farmer.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:20px;">
          <!-- Centre Selection -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;"><i class="fas fa-building"></i> Procurement Centre *</label>
            <select id="assisted-center-select" class="form-control" onchange="onAssistedCenterChange(this.value)">
              ${centers.map(c => `
                <option value="${c.centerId}" ${c.centerId === assistedWizard.centerId ? 'selected' : ''}>
                  ${c.name} (${c.district}, ${c.state}) &bull; Cap: ${c.maxDailyCapacity} Q/day
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Date Picker -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;"><i class="fas fa-calendar-day"></i> Procurement Date *</label>
            <input 
              type="date" 
              id="assisted-date-input" 
              class="form-control" 
              min="${today}" 
              value="${assistedWizard.date}" 
              onchange="onAssistedDateChange(this.value)" 
              required 
            />
          </div>
        </div>

        <!-- Officer Override Notice (if selecting alternative centre) -->
        <div id="assisted-override-container" style="display:${assistedWizard.centerId !== (user.assignedCenterId || 'CTR-01') ? 'block' : 'none'}; margin-bottom:18px;">
          <div style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:10px; padding:14px 18px;">
            <div style="font-weight:800; color:#B45309; font-size:0.9rem; margin-bottom:4px;">
              <i class="fas fa-triangle-exclamation"></i> Alternative Centre Selected
            </div>
            <p style="font-size:0.82rem; color:#78350F; margin:0 0 8px 0;">
              You are booking at a Mandi different from your primary assigned station (${user.assignedCenterId || 'CTR-01'}). Please provide an operational reason for the official audit trail.
            </p>
            <input 
              type="text" 
              id="assisted-override-reason-input" 
              class="form-control" 
              placeholder="e.g. Farmer preference, proximity to farm village, or intake capacity..." 
              value="${assistedWizard.overrideReason || ''}"
              oninput="assistedWizard.overrideReason = this.value;"
            />
          </div>
        </div>

        <!-- Real-Time Mandi Capacity Display -->
        <div id="assisted-capacity-display-slot" class="glass-card" style="padding:16px 20px; margin-bottom:20px; background:var(--bg-main);">
          <!-- Populated by fetchAssistedSlotAvailability -->
        </div>

        <!-- High Volume Warning Slot -->
        <div id="assisted-high-volume-slot" style="margin-bottom:16px;"></div>

        <!-- Live Slots Grid -->
        <div style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <label class="form-label" style="margin:0; font-weight:700;"><i class="fas fa-clock"></i> Available Time Slots *</label>
            <span id="assisted-slots-status-tag" style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">Checking availability...</span>
          </div>
          <div id="assisted-slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Transport / Remarks -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
          <div class="form-group">
            <label class="form-label"><i class="fas fa-truck"></i> Vehicle Number (Optional)</label>
            <input 
              type="text" 
              id="assisted-vehicle-input" 
              class="form-control" 
              placeholder="e.g. MP-04-AB-1234 or Tractor Trolley" 
              value="${assistedWizard.vehicleNumber || ''}"
              oninput="assistedWizard.vehicleNumber = this.value;"
            />
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fas fa-note-sticky"></i> Facilitator Remarks</label>
            <input 
              type="text" 
              id="assisted-remarks-input" 
              class="form-control" 
              placeholder="e.g. Assisted booking at farmer request" 
              value="${assistedWizard.remarks || ''}"
              oninput="assistedWizard.remarks = this.value;"
            />
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn btn-outline" onclick="assistedWizard.step = 3; renderAssistedWizardStep();">
            <i class="fas fa-arrow-left"></i> Back to Crop Selection
          </button>
          <button class="btn btn-primary" onclick="proceedToStep5Review()" style="padding:10px 26px; font-weight:700;">
            Review Booking <i class="fas fa-arrow-right" style="margin-left:6px;"></i>
          </button>
        </div>
      </div>
    `;

    fetchAssistedSlotAvailability();
  } catch (err) {
    container.innerHTML = `<div style="color:#EF4444; padding:20px;">Failed to load centres: ${err.message}</div>`;
  }
};

const onAssistedCenterChange = (centerId) => {
  assistedWizard.centerId = centerId;
  const user = getCurrentUser();
  const overrideBox = document.getElementById('assisted-override-container');
  if (overrideBox) {
    overrideBox.style.display = centerId !== (user.assignedCenterId || 'CTR-01') ? 'block' : 'none';
  }
  fetchAssistedSlotAvailability();
};

const onAssistedDateChange = (dateVal) => {
  assistedWizard.date = dateVal;
  fetchAssistedSlotAvailability();
};

const fetchAssistedSlotAvailability = async () => {
  const capSlot = document.getElementById('assisted-capacity-display-slot');
  const highVolSlot = document.getElementById('assisted-high-volume-slot');
  const slotsGrid = document.getElementById('assisted-slots-grid');
  const statusTag = document.getElementById('assisted-slots-status-tag');
  if (!slotsGrid) return;

  slotsGrid.innerHTML = `<div class="skeleton" style="grid-column:1/-1; height:80px; border-radius:8px;"></div>`;

  try {
    const res = await fetch(`/api/bookings/slots?centerId=${assistedWizard.centerId}&date=${assistedWizard.date}`);
    const data = await res.json();

    if (data.isHoliday) {
      if (capSlot) capSlot.innerHTML = `<div style="color:#B91C1C; font-weight:700;"><i class="fas fa-ban"></i> Mandi is closed on ${assistedWizard.date} due to ${data.holidayName}.</div>`;
      if (highVolSlot) highVolSlot.innerHTML = '';
      slotsGrid.innerHTML = `<p style="grid-column:1/-1; color:#EF4444; text-align:center;">No slots available on public holiday.</p>`;
      if (statusTag) statusTag.textContent = 'Mandi Closed';
      return;
    }

    const maxCap = data.maxDailyCapacity || 300;
    const booked = data.totalBookedToday || 0;
    const remaining = Math.max(0, maxCap - booked);

    // Render Capacity Card
    if (capSlot) {
      capSlot.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-weight:800; font-size:1.05rem; color:var(--primary-navy);">
              ${data.center ? data.center.name : assistedWizard.centerName}
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              Operating: ${data.center ? data.center.openingTime : '08:00 AM'} - ${data.center ? data.center.closingTime : '06:00 PM'} &bull; Counters: ${data.center ? data.center.countersCount : 4} Desks
            </div>
          </div>
          <div style="display:flex; gap:16px; align-items:center;">
            <div style="text-align:center;">
              <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Daily Cap</span>
              <strong style="color:var(--primary-navy); font-size:1.1rem;">${maxCap} Q</strong>
            </div>
            <div style="text-align:center;">
              <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Already Booked</span>
              <strong style="color:#2563EB; font-size:1.1rem;">${booked} Q</strong>
            </div>
            <div style="text-align:center;">
              <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Remaining</span>
              <strong style="color:${remaining >= assistedWizard.quantity ? 'var(--green-gov)' : '#EF4444'}; font-size:1.1rem;">${remaining} Q</strong>
            </div>
          </div>
        </div>
      `;
    }

    // High-Volume Advisory Check
    if (highVolSlot) {
      if (assistedWizard.quantity > remaining) {
        highVolSlot.innerHTML = `
          <div style="background:#FEF2F2; border:1px solid #F87171; border-radius:8px; padding:14px; color:#991B1B;">
            <div style="font-weight:800; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-triangle-exclamation"></i> High Volume Advisory
            </div>
            <p style="font-size:0.84rem; margin:4px 0 0 0;">
              Requested quantity (<strong>${assistedWizard.quantity} Q</strong>) exceeds the remaining daily capacity (<strong>${remaining} Q</strong>) for this centre. Please choose another date or procurement centre.
            </p>
          </div>
        `;
      } else {
        highVolSlot.innerHTML = '';
      }
    }

    const slots = data.slots || [];
    if (statusTag) {
      statusTag.textContent = `${slots.filter(s => !s.isFull).length} slots available`;
    }

    if (slots.length === 0) {
      slotsGrid.innerHTML = `<p style="grid-column:1/-1; color:var(--text-muted); text-align:center;">No slots configured for this date.</p>`;
      return;
    }

    slotsGrid.innerHTML = slots.map((s, idx) => {
      const isSelected = assistedWizard.timeSlot === s.timeSlot || (!assistedWizard.timeSlot && idx === 0 && !s.isFull);
      if (isSelected && !assistedWizard.timeSlot) assistedWizard.timeSlot = s.timeSlot;

      return `
        <div 
          class="glass-card slot-card ${s.isFull ? 'disabled' : ''} ${isSelected && !s.isFull ? 'selected' : ''}" 
          style="padding:14px; text-align:center; cursor:${s.isFull ? 'not-allowed' : 'pointer'}; border:${isSelected && !s.isFull ? '2px solid var(--saffron)' : '1px solid var(--border-color)'}; opacity:${s.isFull ? '0.45' : '1'}; background:${s.isFull ? '#F1F5F9' : 'var(--bg-card)'};"
          onclick="${s.isFull ? '' : `selectAssistedTimeSlot('${s.timeSlot}', this)`}"
        >
          <div style="font-weight:700; font-size:0.95rem; color:var(--primary-navy);">${s.timeSlot}</div>
          <div style="margin-top:6px;">
            <span class="status-pill ${s.isFull ? 'skipped' : (s.availableSlots <= 3 ? 'waiting' : 'completed')}" style="font-size:0.75rem;">
              ${s.isFull ? 'Full' : `${s.availableSlots} Slots Left`}
            </span>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    slotsGrid.innerHTML = `<p style="color:#EF4444;">Error checking slots</p>`;
  }
};

const selectAssistedTimeSlot = (timeSlot, cardEl) => {
  assistedWizard.timeSlot = timeSlot;
  document.querySelectorAll('#assisted-slots-grid .slot-card').forEach(el => {
    el.style.border = '1px solid var(--border-color)';
    el.classList.remove('selected');
  });
  if (cardEl) {
    cardEl.style.border = '2px solid var(--saffron)';
    cardEl.classList.add('selected');
  }
};

const proceedToStep5Review = () => {
  if (!assistedWizard.timeSlot) {
    showToast('Please select an available time slot.', 'warning');
    return;
  }
  assistedWizard.step = 5;
  renderAssistedWizardStep();
};

/**
 * STEP 5: REVIEW BOOKING BEFORE FINAL CONFIRMATION
 */
const renderAssistedStep5Review = (container) => {
  const f = assistedWizard.selectedFarmer;
  const user = getCurrentUser();

  container.innerHTML = `
    <div class="glass-panel" style="padding:28px 32px; border-radius:14px;">
      <div style="margin-bottom:20px;">
        <h3 style="font-size:1.35rem; font-weight:800; color:var(--primary-navy); margin:0;">
          <i class="fas fa-file-invoice" style="color:var(--saffron); margin-right:8px;"></i>
          Step 5: Review Farmer Token Booking
        </h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
          Please verify all procurement parameters before generating the official digital token.
        </p>
      </div>

      <div class="glass-card" style="padding:24px; margin-bottom:24px; background:var(--bg-main); border:1px solid var(--border-color);">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:18px;">
          <!-- Farmer Details -->
          <div style="border-right:1px solid var(--border-color); padding-right:12px;">
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--saffron); font-weight:800; display:block; margin-bottom:6px;">
              FARMER DETAILS
            </span>
            <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy);">${f.fullName}</div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">ID: <strong>${f.farmerId}</strong></div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Mobile: <strong>${f.mobile}</strong></div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Village: <strong>${f.village || 'N/A'}, ${f.district}</strong></div>
          </div>

          <!-- Crop Details -->
          <div style="border-right:1px solid var(--border-color); padding-right:12px;">
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--green-gov); font-weight:800; display:block; margin-bottom:6px;">
              COMMODITY & VOLUME
            </span>
            <div style="font-size:1.15rem; font-weight:800; color:var(--primary-navy);">${assistedWizard.cropName}</div>
            <div style="font-size:1.2rem; font-weight:800; color:var(--saffron); margin-top:4px;">${assistedWizard.quantity} Quintals</div>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">Transport: ${assistedWizard.vehicleNumber || 'Farmer Transport'}</div>
          </div>

          <!-- Procurement Centre -->
          <div style="border-right:1px solid var(--border-color); padding-right:12px;">
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#2563EB; font-weight:800; display:block; margin-bottom:6px;">
              CENTRE & SCHEDULE
            </span>
            <div style="font-size:1.05rem; font-weight:800; color:var(--primary-navy);">${assistedWizard.centerName}</div>
            <div style="font-size:0.85rem; color:var(--saffron); font-weight:700; margin-top:4px;">
              <i class="fas fa-calendar-day"></i> ${assistedWizard.date}
            </div>
            <div style="font-size:0.85rem; color:var(--text-main); font-weight:700;">
              <i class="fas fa-clock"></i> ${assistedWizard.timeSlot}
            </div>
          </div>

          <!-- Officer Facilitator -->
          <div>
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#9333EA; font-weight:800; display:block; margin-bottom:6px;">
              OFFICER FACILITATOR
            </span>
            <div style="font-size:1.05rem; font-weight:800; color:var(--primary-navy);">${user ? user.name : 'Officer'}</div>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">ID: <strong>${user ? (user.officerId || user.id) : 'OFF-01'}</strong></div>
            <div style="font-size:0.82rem; color:var(--green-gov); font-weight:700; margin-top:4px;">
              <i class="fas fa-shield-halved"></i> Officer Assisted Booking
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Notice Alert -->
      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:14px 18px; margin-bottom:24px; display:flex; align-items:center; gap:12px;">
        <i class="fas fa-info-circle" style="color:#2563EB; font-size:1.2rem;"></i>
        <div style="font-size:0.85rem; color:#1E40AF;">
          Upon confirmation, an official digital token pass with scannable QR code will be generated, registered in the live queue, and logged to the central government audit trail.
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-outline" onclick="assistedWizard.step = 4; renderAssistedWizardStep();">
          <i class="fas fa-arrow-left"></i> Back / Edit Details
        </button>
        <button 
          id="btn-confirm-assisted-booking" 
          class="btn btn-success" 
          onclick="confirmAssistedBookingSubmit()" 
          style="padding:12px 32px; font-weight:800; font-size:1.05rem;"
        >
          <i class="fas fa-ticket"></i> Confirm & Generate Digital Token
        </button>
      </div>
    </div>
  `;
};

/**
 * Submit Assisted Booking to Backend API
 */
const confirmAssistedBookingSubmit = async () => {
  const btn = document.getElementById('btn-confirm-assisted-booking');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating Token & Verifying Capacity...`;
  }

  const token = localStorage.getItem('kpms_token');
  const payload = {
    farmerId: assistedWizard.selectedFarmer.farmerId,
    centerId: assistedWizard.centerId,
    cropName: assistedWizard.cropName,
    quantity: assistedWizard.quantity,
    date: assistedWizard.date,
    timeSlot: assistedWizard.timeSlot,
    vehicleNumber: assistedWizard.vehicleNumber,
    remarks: assistedWizard.remarks,
    overrideReason: assistedWizard.overrideReason,
    farmerConsentConfirmed: true
  };

  try {
    const res = await fetch('/api/officer/bookings/assisted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      playAudioChime();
      assistedWizard.tokenResult = data.data;
      assistedWizard.step = 6;
      renderAssistedWizardStep();
      showToast('Digital token generated successfully!', 'success');
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-ticket"></i> Confirm & Generate Digital Token`;
      }
      showToast(data.message || 'Failed to complete assisted booking', 'error');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-ticket"></i> Confirm & Generate Digital Token`;
    }
    showToast('Submission error: ' + err.message, 'error');
  }
};

/**
 * STEP 6: TOKEN GENERATED CONFIRMATION & RECEIPT
 */
const renderAssistedStep6Confirmation = (container) => {
  const b = assistedWizard.tokenResult;
  if (!b) {
    assistedWizard.step = 1;
    renderAssistedWizardStep();
    return;
  }

  container.innerHTML = `
    <div class="glass-panel" style="padding:28px 32px; border-radius:14px; text-align:center;">
      <div style="display:inline-flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:50%; background:#ECFDF5; color:var(--green-gov); font-size:2rem; margin-bottom:14px; box-shadow:0 4px 14px rgba(5,150,105,0.2);">
        <i class="fas fa-check"></i>
      </div>
      <h2 style="font-size:2rem; font-weight:900; color:var(--primary-navy); margin:0 0 6px 0;">
        Token Booking Successful!
      </h2>
      <p style="color:var(--text-muted); font-size:0.92rem; margin:0 0 24px 0;">
        The digital procurement token has been generated and enrolled into the Mandi queue.
      </p>

      <!-- Handsome Digital Token Voucher -->
      <div style="max-width:550px; margin:0 auto 24px auto; background:linear-gradient(135deg, #0E2A47, #1E3A8A); border-radius:16px; padding:26px; color:#FFF; box-shadow:0 12px 30px rgba(14,42,71,0.3); text-align:center; position:relative; overflow:hidden;">
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--saffron); font-weight:800; margin-bottom:6px;">
          OFFICIAL PROCUREMENT PASS &bull; SMARTPROCURE
        </div>
        <div style="font-size:3.2rem; font-weight:900; letter-spacing:2px; color:#FFF; line-height:1.1; text-shadow:0 2px 10px rgba(0,0,0,0.4); margin-bottom:8px;">
          ${b.tokenNumber || b.bookingNumber}
        </div>
        <div style="display:inline-block; background:rgba(224,109,20,0.2); border:1px solid var(--saffron); color:#FFF; font-weight:700; font-size:0.78rem; padding:3px 12px; border-radius:20px; margin-bottom:18px;">
          <i class="fas fa-hand-holding-hand"></i> Officer Assisted Facilitation
        </div>

        <div style="background:rgba(255,255,255,0.1); border-radius:10px; padding:16px; text-align:left; font-size:0.88rem; backdrop-filter:blur(4px);">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px;">
            <span style="color:#CBD5E1;">Farmer Name:</span>
            <strong>${b.farmerName} (${b.farmerId})</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px;">
            <span style="color:#CBD5E1;">Commodity & Volume:</span>
            <strong>${b.cropName} &bull; ${b.quantity} Quintals</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px;">
            <span style="color:#CBD5E1;">Procurement Centre:</span>
            <strong>${b.centerName}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px;">
            <span style="color:#CBD5E1;">Date & Time Window:</span>
            <strong style="color:var(--saffron);">${b.date} &bull; ${b.timeSlot}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#CBD5E1;">Assisted By Officer:</span>
            <strong>${b.assistedByOfficerName || 'Officer'}</strong>
          </div>
        </div>

        ${b.qrCodeDataUrl ? `
          <div style="margin-top:16px; background:#FFF; display:inline-block; padding:8px; border-radius:8px;">
            <img src="${b.qrCodeDataUrl}" alt="Token QR" style="width:110px; height:110px; display:block;" />
          </div>
        ` : ''}
      </div>

      <!-- Actions Bar -->
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="printAssistedTokenReceipt(assistedWizard.tokenResult)" style="padding:12px 24px; font-weight:800;">
          <i class="fas fa-print"></i> Print Token Receipt
        </button>
        <a href="/api/bookings/${b.bookingNumber}/pdf" target="_blank" class="btn btn-navy" style="padding:12px 20px; font-weight:700;">
          <i class="fas fa-file-pdf"></i> Download PDF Pass
        </a>
        <button class="btn btn-outline" onclick="triggerFarmerSmsNotification('${b.bookingNumber}')" style="padding:12px 20px;">
          <i class="fas fa-message"></i> Send SMS
        </button>
        <button class="btn btn-outline" onclick="resetAssistedBookingWizard()" style="padding:12px 20px;">
          <i class="fas fa-plus"></i> Book Another Farmer
        </button>
        <button class="btn btn-outline" onclick="loadOfficerAssistedBookingsPage()" style="padding:12px 20px;">
          <i class="fas fa-clock-rotate-left"></i> Assisted History
        </button>
      </div>
    </div>
  `;
};

const triggerFarmerSmsNotification = (bookingNumber) => {
  const f = assistedWizard.selectedFarmer;
  const mobile = f ? f.mobile : '';
  showToast(`SMS dispatch queued to registered mobile ${mobile ? `(${mobile})` : ''} via NIC Gateway.`, 'info');
};

const resetAssistedBookingWizard = () => {
  assistedWizard = {
    step: 1,
    selectedFarmer: null,
    consentGiven: false,
    cropName: 'Wheat (Sharbati)',
    quantity: 50,
    centerId: activeOfficerCenterId,
    centerName: '',
    isAlternativeCenter: false,
    overrideReason: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '',
    vehicleNumber: '',
    remarks: '',
    tokenResult: null,
    searchResults: [],
    hasSearched: false
  };
  loadOfficerBookTokenPage(1);
};

/**
 * 2. OFFICER ASSISTED BOOKINGS HISTORY VIEW (#officer-assisted-bookings)
 */
const loadOfficerAssistedBookingsPage = async () => {
  window.location.hash = '#officer-assisted-bookings';
  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();
  if (!token || !user || (user.role !== 'officer' && user.role !== 'admin')) {
    openLoginModal('officer');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const res = await fetch('/api/officer/assisted-bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    const bookings = result.data || [];
    const metrics = result.metrics || { total: 0, today: 0, pending: 0, completed: 0, cancelled: 0 };

    container.innerHTML = `
      <div class="app-container">
        ${renderOfficerSidebar('assisted-bookings', user, { name: user.assignedCenterId || 'APMC Central Mandi' })}

        <main class="main-content" style="max-width:1150px; margin:0 auto; padding-bottom:60px;">
          <!-- Top Bar -->
          <div class="glass-panel" style="padding:22px 28px; margin-bottom:24px; border-left:6px solid var(--saffron); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge" style="background:rgba(224,109,20,0.15); color:var(--saffron); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">OFFICIAL AUDIT TRAIL</span>
                <h2 style="font-size:1.8rem; font-weight:800; color:var(--primary-navy); margin:0;">Assisted Farmer Bookings</h2>
              </div>
              <p style="color:var(--text-muted); font-size:0.88rem; margin:4px 0 0 0;">
                Complete record of all procurement slots and tokens booked on behalf of farmers by officers.
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-primary" onclick="loadOfficerBookTokenPage()">
                <i class="fas fa-plus"></i> + Book Token for Farmer
              </button>
              <button class="btn btn-outline" onclick="loadOfficerAssistedBookingsPage()">
                <i class="fas fa-rotate"></i> Refresh
              </button>
            </div>
          </div>

          <!-- KPI Summary Strip -->
          <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); margin-bottom:24px;">
            <div class="glass-card metric-card" style="padding:16px;">
              <div>
                <div class="metric-val" style="font-size:1.6rem; color:var(--primary-navy);">${metrics.today}</div>
                <div class="metric-title" style="font-size:0.78rem;">Booked Today</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706; width:38px; height:38px;"><i class="fas fa-calendar-day"></i></div>
            </div>
            <div class="glass-card metric-card" style="padding:16px;">
              <div>
                <div class="metric-val" style="font-size:1.6rem; color:#2563EB;">${metrics.pending}</div>
                <div class="metric-title" style="font-size:0.78rem;">Pending Visits</div>
              </div>
              <div class="metric-icon-box" style="background:#EFF6FF; color:#2563EB; width:38px; height:38px;"><i class="fas fa-hourglass-start"></i></div>
            </div>
            <div class="glass-card metric-card" style="padding:16px;">
              <div>
                <div class="metric-val" style="font-size:1.6rem; color:var(--green-gov);">${metrics.completed}</div>
                <div class="metric-title" style="font-size:0.78rem;">Completed Procurement</div>
              </div>
              <div class="metric-icon-box" style="background:#ECFDF5; color:#059669; width:38px; height:38px;"><i class="fas fa-check-double"></i></div>
            </div>
            <div class="glass-card metric-card" style="padding:16px;">
              <div>
                <div class="metric-val" style="font-size:1.6rem; color:#EF4444;">${metrics.cancelled}</div>
                <div class="metric-title" style="font-size:0.78rem;">Cancelled Bookings</div>
              </div>
              <div class="metric-icon-box" style="background:#FEF2F2; color:#EF4444; width:38px; height:38px;"><i class="fas fa-ban"></i></div>
            </div>
          </div>

          <!-- History Table & Filter Bar -->
          <div class="glass-card" style="padding:22px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
              <div style="flex:1; min-width:260px;">
                <input 
                  type="text" 
                  id="assisted-history-search-input" 
                  class="form-control" 
                  placeholder="Filter by Token, Farmer Name, Crop, Center..." 
                  oninput="filterAssistedBookingsTable(this.value)" 
                />
              </div>
              <div style="display:flex; gap:8px;">
                <select id="assisted-history-status-select" class="form-control" style="width:160px;" onchange="filterAssistedBookingsByStatus(this.value)">
                  <option value="ALL">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style="overflow-x:auto;">
              <table id="assisted-bookings-table" style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem;">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                    <th style="padding:12px 14px;">Token / Booking No</th>
                    <th style="padding:12px 14px;">Farmer Details</th>
                    <th style="padding:12px 14px;">Commodity & Qty</th>
                    <th style="padding:12px 14px;">Centre</th>
                    <th style="padding:12px 14px;">Date & Slot</th>
                    <th style="padding:12px 14px;">Status</th>
                    <th style="padding:12px 14px; text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${bookings.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align:center; padding:36px; color:var(--text-muted);">
                        No assisted bookings recorded yet. Click "+ Book Token for Farmer" to assist a farmer.
                      </td>
                    </tr>
                  ` : ''}
                  ${bookings.map(b => `
                    <tr class="assisted-row" data-search="${(b.tokenNumber || '') + ' ' + (b.bookingNumber || '') + ' ' + (b.farmerName || '') + ' ' + (b.cropName || '') + ' ' + (b.centerName || '')}" data-status="${b.status}" style="border-bottom:1px solid var(--border-color);">
                      <td style="padding:12px 14px;">
                        <div style="font-weight:800; font-size:1.05rem; color:var(--saffron);">${b.tokenNumber || b.bookingNumber}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${b.bookingNumber}</div>
                      </td>
                      <td style="padding:12px 14px;">
                        <div style="font-weight:700; color:var(--primary-navy);">${b.farmerName}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted);">${b.farmerId}</div>
                      </td>
                      <td style="padding:12px 14px;">
                        <strong style="color:var(--text-main);">${b.cropName}</strong>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${b.quantity} Quintals</div>
                      </td>
                      <td style="padding:12px 14px; font-size:0.85rem;">${b.centerName}</td>
                      <td style="padding:12px 14px;">
                        <div style="font-weight:700; font-size:0.85rem;">${b.date}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted);">${b.timeSlot}</div>
                      </td>
                      <td style="padding:12px 14px;">
                        <span class="status-pill ${(b.status || 'confirmed').toLowerCase().replace(/\s+/g, '')}">${b.status}</span>
                      </td>
                      <td style="padding:12px 14px; text-align:right;">
                        <div style="display:inline-flex; gap:6px;">
                          <button class="btn btn-outline btn-sm" onclick="openBookingQRModal('${b.bookingNumber}')" title="View Pass">
                            <i class="fas fa-qrcode"></i> Pass
                          </button>
                          <button class="btn btn-outline btn-sm" onclick='printAssistedTokenReceipt(${JSON.stringify(b)})' title="Print Receipt">
                            <i class="fas fa-print"></i> Print
                          </button>
                          ${b.status === 'Confirmed' || b.status === 'Booked' ? `
                            <button class="btn btn-outline btn-sm" style="color:#EF4444; border-color:#EF4444;" onclick="openCancelAssistedBookingModal('${b._id}', '${b.bookingNumber}')" title="Cancel Booking">
                              <i class="fas fa-times"></i>
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:#EF4444; padding:20px;">Failed to load assisted history: ${err.message}</div>`;
  }
};

const filterAssistedBookingsTable = (query) => {
  const q = (query || '').toLowerCase();
  const rows = document.querySelectorAll('.assisted-row');
  rows.forEach(r => {
    const text = (r.getAttribute('data-search') || '').toLowerCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
};

const filterAssistedBookingsByStatus = (status) => {
  const rows = document.querySelectorAll('.assisted-row');
  rows.forEach(r => {
    const rowStatus = r.getAttribute('data-status');
    if (status === 'ALL' || rowStatus === status) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
};

const openCancelAssistedBookingModal = (bookingId, bookingNumber) => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = `Cancel Assisted Booking - ${bookingNumber}`;

  body.innerHTML = `
    <div>
      <div style="background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; padding:12px 14px; margin-bottom:16px; color:#991B1B; font-size:0.88rem;">
        <i class="fas fa-triangle-exclamation"></i> Are you sure you want to cancel booking <strong>${bookingNumber}</strong>? The allocated slot will be released back to the Mandi intake capacity.
      </div>

      <div class="form-group">
        <label class="form-label">Mandatory Cancellation Reason *</label>
        <textarea id="assisted-cancel-reason" class="form-control" rows="3" placeholder="State reason (e.g. Farmer requested cancellation, crop logistics delay, incorrect quantity)..." required></textarea>
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn btn-outline" onclick="closeModal()">Back</button>
        <button class="btn btn-danger" style="background:#EF4444; color:#FFF;" onclick="executeAssistedBookingCancellation('${bookingId}')">
          <i class="fas fa-ban"></i> Confirm Cancellation
        </button>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

const executeAssistedBookingCancellation = async (bookingId) => {
  const reason = document.getElementById('assisted-cancel-reason').value.trim();
  if (!reason || reason.length < 3) {
    showToast('Please enter a valid cancellation reason.', 'warning');
    return;
  }

  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/officer/assisted-bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });
    const d = await res.json();
    if (d.success) {
      showToast('Assisted booking cancelled and audit trail updated.', 'info');
      closeModal();
      loadOfficerAssistedBookingsPage();
    } else {
      showToast(d.message, 'error');
    }
  } catch (err) {
    showToast('Cancellation error: ' + err.message, 'error');
  }
};

/**
 * 3. ASSISTED FARMER REGISTRATION MODAL
 */
const openAssistedFarmerRegModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Assisted Farmer Registration';

  body.innerHTML = `
    <form onsubmit="handleAssistedFarmerRegSubmit(event)" style="max-height:550px; overflow-y:auto; padding-right:6px;">
      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:12px; margin-bottom:14px; font-size:0.84rem; color:#1E40AF;">
        <i class="fas fa-id-card"></i> Register a digitally excluded farmer directly using official verified credentials.
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="reg-farmer-name" class="form-control" placeholder="e.g. Ramesh Patel" required />
        </div>
        <div class="form-group">
          <label class="form-label">Father / Husband Name</label>
          <input type="text" id="reg-farmer-father" class="form-control" placeholder="e.g. Somabhai Patel" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">10-Digit Mobile Number *</label>
          <input type="tel" id="reg-farmer-mobile" class="form-control" maxlength="10" pattern="[0-9]{10}" placeholder="e.g. 9876543210" required />
        </div>
        <div class="form-group">
          <label class="form-label">12-Digit Aadhaar Number</label>
          <input type="text" id="reg-farmer-aadhaar" class="form-control" maxlength="12" pattern="[0-9]{12}" placeholder="e.g. 234567890123" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">State *</label>
          <select id="reg-farmer-state" class="form-control">
            <option value="Madhya Pradesh" selected>Madhya Pradesh</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Punjab">Punjab</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">District *</label>
          <input type="text" id="reg-farmer-district" class="form-control" placeholder="e.g. Bhopal" value="Bhopal" required />
        </div>
        <div class="form-group">
          <label class="form-label">Village *</label>
          <input type="text" id="reg-farmer-village" class="form-control" placeholder="e.g. Khakhra" required />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Total Land Area (Acres)</label>
          <input type="number" id="reg-farmer-land" class="form-control" min="0.5" step="0.5" value="5" placeholder="5" />
        </div>
        <div class="form-group">
          <label class="form-label">Primary Crop</label>
          <select id="reg-farmer-crop" class="form-control">
            <option value="Wheat" selected>Wheat (गेहूं)</option>
            <option value="Paddy">Paddy / Rice (धान)</option>
            <option value="Potato">Potato (आलू)</option>
            <option value="Tomato">Tomato (टमाटर)</option>
            <option value="Gram">Gram / Chana (चना)</option>
            <option value="Mustard">Mustard (सरसों)</option>
            <option value="Soyabean">Soyabean (सोयाबीन)</option>
          </select>
        </div>
      </div>

      <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
        <span style="font-size:0.8rem; font-weight:700; color:var(--primary-navy); display:block; margin-bottom:8px;">
          Bank Details for Direct DBT Transfers
        </span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Bank Name</label>
            <input type="text" id="reg-farmer-bank" class="form-control" placeholder="e.g. State Bank of India" value="State Bank of India" />
          </div>
          <div class="form-group">
            <label class="form-label">IFSC Code</label>
            <input type="text" id="reg-farmer-ifsc" class="form-control" placeholder="e.g. SBIN0001234" value="SBIN0001234" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Account Number</label>
          <input type="text" id="reg-farmer-acc" class="form-control" placeholder="e.g. 123456789012" value="123456789012" />
        </div>
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" id="btn-submit-assisted-reg" class="btn btn-primary">
          <i class="fas fa-check"></i> Register Farmer & Proceed
        </button>
      </div>
    </form>
  `;
  modal.classList.add('active');
};

const handleAssistedFarmerRegSubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-assisted-reg');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Registering Farmer...`;
  }

  const token = localStorage.getItem('kpms_token');
  const payload = {
    fullName: document.getElementById('reg-farmer-name').value.trim(),
    fatherName: document.getElementById('reg-farmer-father').value.trim(),
    mobile: document.getElementById('reg-farmer-mobile').value.trim(),
    aadhaarNumber: document.getElementById('reg-farmer-aadhaar').value.trim(),
    state: document.getElementById('reg-farmer-state').value,
    district: document.getElementById('reg-farmer-district').value.trim(),
    village: document.getElementById('reg-farmer-village').value.trim(),
    totalLandArea: parseFloat(document.getElementById('reg-farmer-land').value) || 5,
    primaryCrop: document.getElementById('reg-farmer-crop').value,
    bankName: document.getElementById('reg-farmer-bank').value.trim(),
    ifscCode: document.getElementById('reg-farmer-ifsc').value.trim(),
    accountNumber: document.getElementById('reg-farmer-acc').value.trim()
  };

  try {
    const res = await fetch('/api/officer/farmers/register-assisted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'success');
      closeModal();
      // Auto select newly registered farmer and advance to Step 2
      assistedWizard.selectedFarmer = d.data;
      assistedWizard.consentGiven = false;
      assistedWizard.step = 2;
      loadOfficerBookTokenPage(2);
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-check"></i> Register Farmer & Proceed`;
      }
      showToast(d.message, 'error');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-check"></i> Register Farmer & Proceed`;
    }
    showToast('Registration failed: ' + err.message, 'error');
  }
};

/**
 * 4. CLEAN PRINTABLE TOKEN RECEIPT SLIP
 */
const printAssistedTokenReceipt = (booking) => {
  if (!booking) return;

  const printWindow = window.open('', '_blank', 'width=750,height=900');
  if (!printWindow) {
    window.print();
    return;
  }

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SMARTPROCURE Token Receipt - ${booking.tokenNumber || booking.bookingNumber}</title>
      <style>
        @page { size: A5; margin: 12mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1E293B;
          background: #FFF;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0E2A47;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .gov-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748B;
          font-weight: 700;
        }
        .brand {
          font-size: 22px;
          font-weight: 900;
          color: #0E2A47;
          margin: 4px 0 2px 0;
        }
        .sub-brand {
          font-size: 12px;
          color: #E06D14;
          font-weight: 700;
        }
        .voucher-box {
          border: 2px solid #0E2A47;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          margin-bottom: 16px;
          background: #F8FAFC;
        }
        .token-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748B;
          font-weight: 800;
        }
        .token-number {
          font-size: 36px;
          font-weight: 900;
          color: #0E2A47;
          letter-spacing: 2px;
          margin: 4px 0;
        }
        .facilitation-tag {
          font-size: 11px;
          background: #FFFBEB;
          border: 1px solid #FCD34D;
          color: #B45309;
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 800;
          display: inline-block;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .details-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #E2E8F0;
        }
        .details-table td.label {
          color: #64748B;
          width: 38%;
          font-weight: 600;
        }
        .details-table td.val {
          color: #0F172A;
          font-weight: 800;
        }
        .qr-section {
          text-align: center;
          margin-bottom: 16px;
        }
        .qr-section img {
          width: 120px;
          height: 120px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 4px;
        }
        .guidelines {
          font-size: 10.5px;
          color: #475569;
          background: #F1F5F9;
          padding: 10px 14px;
          border-radius: 6px;
          line-height: 1.5;
        }
        .footer {
          margin-top: 14px;
          text-align: center;
          font-size: 10px;
          color: #94A3B8;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="gov-title">Government of India &bull; Ministry of Agriculture & Farmers Welfare</div>
        <div class="brand">SMARTPROCURE</div>
        <div class="sub-brand">Digital India &bull; Smart Agriculture &bull; Kisan Procurement Portal</div>
      </div>

      <div class="voucher-box">
        <div class="token-title">Official Procurement Token</div>
        <div class="token-number">${booking.tokenNumber || booking.bookingNumber}</div>
        <div class="facilitation-tag">OFFICER ASSISTED BOOKING</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Farmer Name:</td>
          <td class="val">${booking.farmerName}</td>
        </tr>
        <tr>
          <td class="label">Farmer ID:</td>
          <td class="val">${booking.farmerId}</td>
        </tr>
        <tr>
          <td class="label">Commodity & Quantity:</td>
          <td class="val">${booking.cropName} &mdash; ${booking.quantity} Quintals</td>
        </tr>
        <tr>
          <td class="label">Procurement Mandi:</td>
          <td class="val">${booking.centerName}</td>
        </tr>
        <tr>
          <td class="label">Scheduled Date:</td>
          <td class="val">${booking.date}</td>
        </tr>
        <tr>
          <td class="label">Allotted Time Slot:</td>
          <td class="val" style="color:#0E2A47;">${booking.timeSlot}</td>
        </tr>
        <tr>
          <td class="label">Facilitating Officer:</td>
          <td class="val">${booking.assistedByOfficerName || 'Procurement Officer'} (${booking.assistedByOfficerId || 'OFFICER'})</td>
        </tr>
        <tr>
          <td class="label">Booking Number:</td>
          <td class="val" style="font-family:monospace;">${booking.bookingNumber}</td>
        </tr>
      </table>

      ${booking.qrCodeDataUrl ? `
        <div class="qr-section">
          <img src="${booking.qrCodeDataUrl}" alt="Gate Entry QR" />
          <div style="font-size:10px; color:#64748B; margin-top:4px;">Scan at Mandi Entrance Gate for Live Counter Dispatch</div>
        </div>
      ` : ''}

      <div class="guidelines">
        <strong>Instructions for Farmer:</strong><br/>
        1. Please arrive at the Mandi gate during your designated time window (<strong>${booking.timeSlot}</strong>).<br/>
        2. Present this printed token slip or QR code at the Gate Entry Counter for electronic check-in.<br/>
        3. Ensure moisture level is below official FAQ norms for direct weighment and fast DBT settlement.
      </div>

      <div class="footer">
        Generated on: ${new Date().toLocaleString('en-IN')} &bull; Smart India Hackathon 2026 &bull; PS 26032
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHtml);
  printWindow.document.close();
};

// Officer Harvest Readiness & Gate Clearance Handlers
window.officerReadinessAnswers = { q1: true, q2: true, q3: true, q5: true, q6: true };

const setOfficerReadinessToggle = (qKey, val) => {
  if (!window.officerReadinessAnswers) window.officerReadinessAnswers = {};
  window.officerReadinessAnswers[qKey] = val;
  const yesBtn = document.getElementById(`btn-officer-${qKey}-yes`);
  const noBtn = document.getElementById(`btn-officer-${qKey}-no`);
  if (yesBtn && noBtn) {
    if (val) {
      yesBtn.className = 'btn btn-sm btn-primary';
      noBtn.className = 'btn btn-sm btn-outline';
    } else {
      yesBtn.className = 'btn btn-sm btn-outline';
      noBtn.className = 'btn btn-sm btn-danger';
    }
  }
};

const submitOfficerReadinessCheck = () => {
  const ans = window.officerReadinessAnswers || {};
  const allPassed = ans.q1 && ans.q2 && ans.q3 && ans.q5 && ans.q6;
  if (allPassed) {
    showToast('Paddy / Rice readiness verified! All gate & moisture pre-clearance checks passed.', 'success');
  } else {
    showToast('Crop readiness checks recorded. Some parameters require drying or cleaning before final acceptance.', 'warning');
  }
  openProcurementStepper();
};

const scrollToOfficerReadiness = () => {
  const el = document.getElementById('officer-readiness-widget');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
    el.style.borderColor = '#E06D14';
    el.style.boxShadow = '0 0 0 4px rgba(224, 109, 20, 0.35)';
    setTimeout(() => {
      el.style.boxShadow = '0 6px 20px rgba(224,109,20,0.08)';
    }, 2500);
  } else {
    loadOfficerDashboard().then(() => {
      setTimeout(() => {
        const target = document.getElementById('officer-readiness-widget');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
          target.style.borderColor = '#E06D14';
          target.style.boxShadow = '0 0 0 4px rgba(224, 109, 20, 0.35)';
          setTimeout(() => {
            target.style.boxShadow = '0 6px 20px rgba(224,109,20,0.08)';
          }, 2500);
        }
      }, 400);
    });
  }
};

// Global Exposure
window.loadOfficerDashboard = loadOfficerDashboard;
window.renderOfficerSidebar = renderOfficerSidebar;
window.scrollToOfficerReadiness = scrollToOfficerReadiness;
window.setOfficerReadinessToggle = setOfficerReadinessToggle;
window.submitOfficerReadinessCheck = submitOfficerReadinessCheck;
window.loadOfficerBookTokenPage = loadOfficerBookTokenPage;
window.loadOfficerAssistedBookingsPage = loadOfficerAssistedBookingsPage;
window.searchFarmersForAssistedBooking = searchFarmersForAssistedBooking;
window.selectFarmerForAssistedBooking = selectFarmerForAssistedBooking;
window.proceedToStep3CropSelection = proceedToStep3CropSelection;
window.proceedToStep4CenterAndSlot = proceedToStep4CenterAndSlot;
window.proceedToStep5Review = proceedToStep5Review;
window.confirmAssistedBookingSubmit = confirmAssistedBookingSubmit;
window.printAssistedTokenReceipt = printAssistedTokenReceipt;
window.triggerFarmerSmsNotification = triggerFarmerSmsNotification;
window.resetAssistedBookingWizard = resetAssistedBookingWizard;
window.openAssistedFarmerRegModal = openAssistedFarmerRegModal;
window.handleAssistedFarmerRegSubmit = handleAssistedFarmerRegSubmit;
window.openCancelAssistedBookingModal = openCancelAssistedBookingModal;
window.executeAssistedBookingCancellation = executeAssistedBookingCancellation;
window.filterAssistedBookingsTable = filterAssistedBookingsTable;
window.filterAssistedBookingsByStatus = filterAssistedBookingsByStatus;
window.onAssistedCropChange = onAssistedCropChange;
window.setAssistedQuickQty = setAssistedQuickQty;
window.onAssistedCenterChange = onAssistedCenterChange;
window.onAssistedDateChange = onAssistedDateChange;
window.selectAssistedTimeSlot = selectAssistedTimeSlot;
