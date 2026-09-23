// Super Admin & Government Executive Control Center

let adminMapInstance = null;
let adminAnalyticsChart = null;

const loadAdminDashboard = async () => {
  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();
  if (!token || !user || user.role !== 'admin') {
    openLoginModal('admin');
    showToast('Please log in with Super Admin credentials', 'info');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const [dashRes, mapRes, analyticsRes, forecastRes, aiRes] = await Promise.all([
      fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/admin/map-data'),
      fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/smart-mandi/forecasts', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/ai/dashboard').catch(() => null)
    ]);

    const dashData = await dashRes.json();
    const mapData = await mapRes.json();
    const analyticsData = await analyticsRes.json();
    const forecastJson = await forecastRes.json().catch(() => ({ data: [] }));
    const demandForecasts = forecastJson.data || [];
    const aiJson = aiRes ? await aiRes.json().catch(() => ({ data: {} })) : { data: {} };
    const centerInsights = (aiJson.data && aiJson.data.centerInsights) || [];
    window.adminCenterInsights = centerInsights;

    const { kpis, centersSummary, recentTransactions } = dashData;

    container.innerHTML = `
      <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
          <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
            <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${user.name}</div>
            <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-landmark"></i> Super Admin / Govt Portal</div>
          </div>
          <div class="sidebar-heading">${getT('national_administration', 'National Administration')}</div>
          <a class="nav-link active" onclick="loadAdminDashboard()"><i class="fas fa-chart-line"></i> ${getT('national_overview', 'National Overview')}</a>
          <a class="nav-link" onclick="openCenterManagementModal()"><i class="fas fa-building-wheat"></i> ${getT('mandi_centers_crud', 'Mandi Centers CRUD')}</a>
          <a class="nav-link" onclick="openOfficerManagementModal()"><i class="fas fa-user-shield"></i> ${getT('officer_allocations', 'Officer Allocations')}</a>
          <a class="nav-link" onclick="openPendingOfficersModal()"><i class="fas fa-user-clock"></i> ${getT('pending_officer_approvals', 'Pending Officer Approvals')}</a>
          <a class="nav-link" onclick="openPaymentReleaseModal()"><i class="fas fa-money-bill-transfer"></i> ${getT('bulk_dbt_release', 'Bulk DBT Treasury Release')}</a>
          <a class="nav-link" onclick="openDatabaseBackupModal()"><i class="fas fa-database"></i> ${getT('db_backup_restore', 'Database Backup & Restore')}</a>
          <a class="nav-link" onclick="scrollToAdminReadiness()"><i class="fas fa-wheat-awn" style="color:var(--saffron);"></i> ${getT('crop_readiness_menu', 'Paddy / Rice Readiness Verification')}</a>
          <a class="nav-link" onclick="scrollToAdminCongestion()"><i class="fas fa-traffic-light" style="color:var(--saffron);"></i> ${getT('live_mandi_congestion_menu', 'Live Mandi Congestion & Wait Estimates')}</a>
          <a class="nav-link" onclick="routeTo('#ai-insights')"><i class="fas fa-chart-line"></i> ${getT('congestion_predictor', 'Congestion & Demand Predictor')}</a>
          <div style="margin-top:auto; padding-top:16px;">
            <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Top Executive Banner -->
          <div class="glass-panel" style="padding:22px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; border-left:6px solid var(--saffron);">
            <div>
              <span class="hero-pill"><i class="fas fa-tower-broadcast"></i> Live Central Command Active</span>
              <h2 style="font-size:1.8rem; font-weight:800; color:var(--primary-navy);">Ministry of Agriculture & Farmers Welfare</h2>
              <p style="color:var(--text-muted); font-size:0.88rem;">Real-Time National Mandi Procurement, Weighbridge IoT & DBT Payout Operations.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="openPaymentReleaseModal()"><i class="fas fa-bolt"></i> Release Pending DBT</button>
              <button class="btn btn-primary" style="background:#E06D14; border-color:#C25608;" onclick="testRazorpaySuperadminCheckout(500, 'DBT_TEST_SETTLEMENT', 'Verified Beneficiary Farmer')"><img src="/images/nav/payments.jpg" style="width:18px; height:18px; border-radius:4px; object-fit:cover; margin-right:6px; vertical-align:middle;" alt="" /> Test Razorpay Checkout</button>
              <button class="btn btn-outline" onclick="loadAdminDashboard()"><i class="fas fa-rotate"></i> Sync Live State</button>
            </div>
          </div>

          <!-- National KPI Grid -->
          <div class="dashboard-grid">
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${kpis.totalFarmers}</div>
                <div class="metric-title">Registered Farmers (${kpis.verifiedFarmers} Verified)</div>
              </div>
              <div class="metric-icon-box" style="background:#EFF6FF; color:#2563EB;"><i class="fas fa-users"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${kpis.activeCenters} / ${kpis.totalCenters}</div>
                <div class="metric-title">Active Mandi Centers</div>
              </div>
              <div class="metric-icon-box" style="background:#ECFDF5; color:#059669;"><i class="fas fa-warehouse"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${kpis.totalProcuredQuintals} Q</div>
                <div class="metric-title">Total Grain Procured</div>
              </div>
              <div class="metric-icon-box" style="background:#FAF5FF; color:#9333EA;"><i class="fas fa-wheat-awn"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val" style="color:var(--green-gov);">₹${(kpis.totalExpenditure / 100000).toFixed(2)} L</div>
                <div class="metric-title">DBT Funds Disbursed</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706;"><i class="fas fa-indian-rupee-sign"></i></div>
            </div>
          </div>

          <!-- Live Leaflet National Map -->
          <div class="glass-card" style="padding:24px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div>
                <h3 style="color:var(--primary-navy); font-weight:800;"><i class="fas fa-map-location-dot"></i> Live National Mandi Heat Map (Leaflet)</h3>
                <p style="color:var(--text-muted); font-size:0.85rem;">Color-coded markers indicate live queue size (Green = Low, Yellow = Medium, Red = High Congestion).</p>
              </div>
              <div style="display:flex; gap:12px; font-size:0.8rem; font-weight:700;">
                <span style="color:#10B981;">● Low Crowd</span>
                <span style="color:#F59E0B;">● Medium Crowd</span>
                <span style="color:#EF4444;">● High Congestion</span>
              </div>
            </div>
            <div id="national-leaflet-map" style="height:380px; width:100%; border-radius:12px; border:1px solid var(--border-color); z-index:10;"></div>
          </div>

          <!-- Charts and Recent DBT Operations -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="glass-card" style="padding:22px;">
              <h4 style="color:var(--primary-navy); font-weight:700; margin-bottom:14px;"><i class="fas fa-chart-pie"></i> Commodity Procurement Distribution</h4>
              <div style="height:250px; position:relative;">
                <canvas id="crop-chart-canvas"></canvas>
              </div>
            </div>

            <div class="glass-card" style="padding:22px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <h4 style="color:var(--primary-navy); font-weight:700;"><i class="fas fa-money-check-dollar"></i> Live DBT Treasury Stream</h4>
                <button class="btn btn-outline btn-sm" onclick="openPaymentReleaseModal()">Release All</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:10px; max-height:250px; overflow-y:auto;">
                ${recentTransactions.map(t => `
                  <div style="padding:10px; background:var(--bg-main); border-radius:8px; display:flex; justify-content:space-between; align-items:center; font-size:0.88rem;">
                    <div>
                      <div style="font-weight:700; color:var(--primary-navy);">${t.farmerName} (${t.receiptNumber})</div>
                      <div style="font-size:0.75rem; color:var(--text-muted);">UTR: ${t.utrNumber}</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-weight:800; color:var(--green-gov);">₹${t.amount.toLocaleString('en-IN')}</div>
                      <span class="status-pill ${t.status.toLowerCase()}" style="font-size:0.7rem;">${t.status}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Future Expected Mandi Demand Forecast (Aggregated from Smart Mandi Finder Next Crop Planning) -->
          <div class="glass-card" style="padding:22px; margin-top:24px; border-top:4px solid var(--saffron);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-chart-line" style="color:var(--saffron);"></i> Future Expected Mandi Demand Forecast (Next Crop Cycle)
                </h3>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                  National aggregate of farmer next-crop plans. Strictly deduplicated (1 farmer = 1 count) for proactive mandi capacity & procurement planning.
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
                            ${f.totalEstimatedQuantity > 500 ? 'Scale up storage, allocate additional MSP funds' : 'Current storage capacity adequate'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- National Fair Assay & Quality Guide -->
          <div class="glass-card" id="admin-fair-assay-section" style="padding:24px; margin-top:24px; border-left:6px solid #0D5C3A; background:#FFFFFF;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-scale-balanced" style="color:#0D5C3A; font-size:1.3rem;"></i>
                <h3 style="font-size:1.25rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  National Fair Assay &amp; Quality Standards (FAQ 2026-27)
                </h3>
              </div>
              <span style="font-size:0.75rem; color:#0D5C3A; font-weight:800; background:#DCFCE7; padding:4px 10px; border-radius:6px;">Ministry of Agriculture Directive</span>
            </div>

            <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:16px;">
              Unified Central Government Fair Average Quality (FAQ) benchmarks enforced across all registered state APMCs and decentralized procurement societies:
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:16px;">
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:12px 16px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Max Permissible Moisture</div>
                <div style="font-size:1.3rem; font-weight:800; color:#0D5C3A;">&le; 12.0%</div>
                <div style="font-size:0.72rem; color:#9CA3AF;">IoT Digital moisture meter verified</div>
              </div>
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:12px 16px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Foreign Matter Allowance</div>
                <div style="font-size:1.3rem; font-weight:800; color:#0D5C3A;">&le; 0.75%</div>
                <div style="font-size:0.72rem; color:#9CA3AF;">Organic / inorganic sieve threshold</div>
              </div>
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:12px 16px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Damaged / Discolored Grain</div>
                <div style="font-size:1.3rem; font-weight:800; color:#0D5C3A;">&le; 2.00%</div>
                <div style="font-size:0.72rem; color:#9CA3AF;">Assay laboratory optical grading</div>
              </div>
              <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:10px; padding:12px 16px;">
                <div style="font-size:0.75rem; color:#6B7280; font-weight:600;">Sound Healthy Grains</div>
                <div style="font-size:1.3rem; font-weight:800; color:#0D5C3A;">&ge; 95.0%</div>
                <div style="font-size:0.72rem; color:#9CA3AF;">Direct DBT payment qualification</div>
              </div>
            </div>

            <div style="font-size:0.8rem; color:#6B7280; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-shield-halved" style="color:#0D5C3A;"></i>
              Automated assay sensor logs are digitally signed and hashed to prevent unauthorized grade modifications during weighbridge processing.
            </div>
          </div>

          <!-- National Paddy / Rice Readiness Verification Monitor (Directly Below Fair Assay & Quality Standards) -->
          <div class="glass-card" id="admin-readiness-widget" style="padding:24px; margin-top:16px; border:1.5px solid var(--saffron); border-left:6px solid var(--saffron); background:#FFFFFF; scroll-margin-top:80px; box-shadow:0 6px 20px rgba(224,109,20,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #FED7AA; padding-bottom:14px; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-wheat-awn" style="color:var(--saffron); font-size:1.3rem;"></i>
                <h3 style="font-size:1.25rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  National Paddy / Rice Readiness Verification Monitor
                </h3>
              </div>
              <span class="status-pill completed" style="font-size:0.75rem; font-weight:800; text-transform:uppercase; background:#DCFCE7; color:#15803D; padding:4px 10px; border-radius:6px;">
                Harvest Readiness Assessment &amp; Quality Audit
              </span>
            </div>

            <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:16px;">
              Consolidated compliance status across farmer pre-arrival readiness submissions and officer gate verification logs:
            </p>

            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
              <!-- Q1 -->
              <div style="padding:12px 16px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.78rem;">1</span>
                  Crop Harvest Readiness &amp; Moisture Assessment
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-weight:800; color:var(--green-gov); font-size:0.88rem;">98.4% Compliance</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="showToast('Querying national crop moisture logs...', 'info')">Audit Log</button>
                </div>
              </div>

              <!-- Q2 -->
              <div style="padding:12px 16px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.78rem;">2</span>
                  Produce Cleaning &amp; Foreign Matter Separation
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-weight:800; color:var(--green-gov); font-size:0.88rem;">96.8% Compliance</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="showToast('Querying cleaning assay records...', 'info')">Audit Log</button>
                </div>
              </div>

              <!-- Q3 -->
              <div style="padding:12px 16px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.78rem;">3</span>
                  Standard 50kg Bag Packing Compliance
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-weight:800; color:var(--green-gov); font-size:0.88rem;">99.1% Compliance</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="showToast('Querying gunny inventory audits...', 'info')">Audit Log</button>
                </div>
              </div>

              <!-- Q5 -->
              <div style="padding:12px 16px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.78rem;">5</span>
                  Transportation &amp; Gate Logistics Dispatch Readiness
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-weight:800; color:var(--green-gov); font-size:0.88rem;">94.5% Active</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="showToast('Querying mandi transport logs...', 'info')">Audit Log</button>
                </div>
              </div>

              <!-- Q6 -->
              <div style="padding:12px 16px; border-radius:10px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-weight:700; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#EFF6FF; color:#2563EB; font-weight:800; border-radius:50%; font-size:0.78rem;">6</span>
                  Ready to Move &amp; Instant Weighbridge Clearance
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-weight:800; color:var(--green-gov); font-size:0.88rem;">97.2% Cleared</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="showToast('Querying weighbridge gate releases...', 'info')">Audit Log</button>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="showToast('Generating National Harvest Quality &amp; Readiness Compliance Report (PDF)...', 'success')" style="padding:10px 22px; font-weight:800;">
                <i class="fas fa-file-pdf"></i> Export National Readiness Audit
              </button>
              <button class="btn btn-outline" onclick="loadAdminDashboard()" style="padding:10px 18px; font-weight:700;">
                <i class="fas fa-rotate"></i> Refresh Metrics
              </button>
            </div>
          </div>

          <!-- Live Mandi Congestion & Wait Estimates (Directly Below National Paddy / Rice Readiness Verification Monitor) -->
          <div class="glass-card" id="admin-congestion-widget" style="padding:24px; margin-top:20px; border:1px solid var(--border-color); background:#FFFFFF; scroll-margin-top:80px; box-shadow:0 6px 20px rgba(0,0,0,0.06); border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E5E7EB; padding-bottom:14px; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-traffic-light" style="color:var(--primary-navy); font-size:1.25rem;"></i>
                <h3 style="font-size:1.25rem; font-weight:800; color:var(--primary-navy); margin:0;">
                  Live Mandi Congestion &amp; Wait Estimates
                </h3>
              </div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span class="status-pill completed" style="font-size:0.75rem; font-weight:700; background:#DCFCE7; color:#15803D;">
                  <i class="fas fa-circle" style="font-size:0.55rem; margin-right:4px;"></i> Heuristic Queue AI
                </span>
                <button type="button" class="btn btn-sm btn-outline" onclick="refreshAdminCongestionTable()" style="padding:6px 14px; font-weight:700;">
                  <i class="fas fa-rotate"></i> Refresh Estimates
                </button>
              </div>
            </div>

            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                <thead>
                  <tr style="background:#FAF6EF; border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                    <th style="padding:12px 14px; font-weight:700;">Mandi Center</th>
                    <th style="padding:12px 14px; font-weight:700;">District &amp; State</th>
                    <th style="padding:12px 14px; font-weight:700;">Waiting Queue</th>
                    <th style="padding:12px 14px; font-weight:700;">Predicted Wait Time</th>
                    <th style="padding:12px 14px; font-weight:700;">Congestion Risk</th>
                    <th style="padding:12px 14px; font-weight:700;">Confidence</th>
                  </tr>
                </thead>
                <tbody id="admin-congestion-table-body">
                  ${centerInsights.length > 0 ? centerInsights.map(c => `
                    <tr style="border-bottom:1px solid var(--border-color);">
                      <td style="padding:12px 14px; font-weight:700; color:var(--primary-navy);">${c.name}</td>
                      <td style="padding:12px 14px; color:var(--text-muted);">${c.district}, ${c.state}</td>
                      <td style="padding:12px 14px; font-weight:700;">${c.waitingFarmers || 0} Farmers</td>
                      <td style="padding:12px 14px; font-weight:800; color:var(--saffron);">${c.estimatedWaitMinutes || 5} Minutes</td>
                      <td style="padding:12px 14px;">
                        <span class="status-pill ${c.congestionLevel === 'High' ? 'skipped' : (c.congestionLevel === 'Medium' ? 'waiting' : 'completed')}" style="font-weight:700; font-size:0.75rem; text-transform:uppercase;">
                          ${c.congestionLevel || 'LOW'}
                        </span>
                      </td>
                      <td style="padding:12px 14px; color:var(--green-gov); font-weight:700;">${Math.round((c.confidenceScore || 0.94) * 100)}%</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="6" style="padding:24px; text-align:center; color:var(--text-muted);">
                        No live congestion records available currently.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;

    initLeafletMap(mapData.markers || []);
    initAnalyticsChart(analyticsData.data);
  } catch (err) {
    showToast('Failed to load government dashboard: ' + err.message, 'error');
  }
};

const initLeafletMap = (markers) => {
  setTimeout(() => {
    const mapEl = document.getElementById('national-leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    if (adminMapInstance) {
      adminMapInstance.remove();
    }

    // Default centered around Central India
    adminMapInstance = L.map('national-leaflet-map').setView([23.2599, 77.4126], 5);

    // Reliable CartoDB Voyager Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO | KPMS Gov India',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(adminMapInstance);

    setTimeout(() => {
      if (adminMapInstance) adminMapInstance.invalidateSize();
    }, 300);

    markers.forEach(m => {
      const circleMarker = L.circleMarker([m.lat, m.lng], {
        radius: 12,
        fillColor: m.crowdColor,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(adminMapInstance);

      circleMarker.bindPopup(`
        <div style="padding:6px; font-family:'Plus Jakarta Sans', sans-serif;">
          <h4 style="color:#0E2A47; margin:0 0 4px; font-size:0.95rem;">${m.name}</h4>
          <div style="font-size:0.8rem; color:#64748B; margin-bottom:6px;">${m.address}</div>
          <div style="font-size:0.8rem; margin-bottom:4px;"><strong>Live Queue:</strong> <span style="color:${m.crowdColor}; font-weight:700;">${m.activeWaiting} Farmers Waiting</span></div>
          <div style="font-size:0.8rem; margin-bottom:4px;"><strong>Completed Today:</strong> ${m.completedToday} Procurements</div>
          <div style="font-size:0.8rem;"><strong>Daily Capacity:</strong> ${m.capacity} Q (${m.counters} Counters)</div>
        </div>
      `);
    });
  }, 100);
};

const initAnalyticsChart = (data) => {
  setTimeout(() => {
    const canvas = document.getElementById('crop-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (adminAnalyticsChart) {
      adminAnalyticsChart.destroy();
    }

    const cropLabels = Object.keys(data.cropBreakdown || { 'Wheat': 1450, 'Gram': 820, 'Mustard': 610, 'Paddy': 3200 });
    const cropValues = Object.values(data.cropBreakdown || { 'Wheat': 1450, 'Gram': 820, 'Mustard': 610, 'Paddy': 3200 });

    adminAnalyticsChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: cropLabels,
        datasets: [{
          data: cropValues,
          backgroundColor: ['#E06D14', '#1A7A44', '#2563EB', '#D97706', '#9333EA'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }, 100);
};

const openPaymentReleaseModal = async () => {
  const token = localStorage.getItem('kpms_token');
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Ministry Treasury: Bulk DBT Payment Release';

  try {
    const res = await fetch('/api/payments/all?status=Verified', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    const verifiedPayments = d.data || [];

    body.innerHTML = `
      <div>
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; padding:16px; border-radius:8px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:1.1rem; font-weight:800; color:var(--green-gov);">
              Pending Verified Disbursements: ${verifiedPayments.length} Vouchers (₹${d.totalValue.toLocaleString('en-IN')})
            </div>
            <p style="font-size:0.85rem; color:#065F46; margin-top:4px;">
              Releasing will disburse direct funds into Aadhaar-linked accounts via PFMS/DBT gateway.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" style="background:#E06D14; border-color:#C25608;" onclick="testRazorpaySuperadminCheckout(500, 'DBT_TEST_SETTLEMENT', 'Verified Beneficiary Farmer')"><img src="/images/nav/payments.jpg" style="width:16px; height:16px; border-radius:4px; object-fit:cover; margin-right:6px; vertical-align:middle;" alt="" /> Test Razorpay Checkout</button>
        </div>

        <div style="max-height:240px; overflow-y:auto; margin-bottom:18px;">
          ${verifiedPayments.length === 0 ? '<p style="color:var(--text-muted); text-align:center; padding:20px;">All DBT disbursements are up to date.</p>' : ''}
          ${verifiedPayments.map(p => `
            <div style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700;">${p.farmerName} (${p.receiptNumber})</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">${p.bankName} - A/C ${p.accountNumber}</div>
              </div>
              <div style="text-align:right; display:flex; gap:6px; align-items:center;">
                <div style="font-weight:800; color:var(--green-gov); margin-right:6px;">₹${p.amount.toLocaleString('en-IN')}</div>
                <button class="btn btn-primary btn-sm" onclick="initiateRazorpayPayment('${p._id}', ${p.amount}, '${p.receiptNumber}', '${p.farmerName}')" title="Disburse via Razorpay Gateway"><i class="fas fa-credit-card"></i> Razorpay</button>
                <button class="btn btn-success btn-sm" onclick="releaseSinglePayment('${p._id}')">Direct Release</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    modal.classList.add('active');
  } catch (err) {}
};

const releaseSinglePayment = async (id) => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/payments/${id}/release`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'success');
      openPaymentReleaseModal();
      loadAdminDashboard();
    }
  } catch (e) {}
};

// Center Management CRUD Modal
let cachedAdminCenters = [];

const openCenterManagementModal = async () => {
  const token = localStorage.getItem('kpms_token');
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').innerHTML = '<img src="/images/nav/smart_mandi.jpg" style="width:24px; height:24px; border-radius:6px; object-fit:cover; margin-right:8px; vertical-align:middle;" alt="" /> Mandi Procurement Centers Management';

  body.innerHTML = `<div class="skeleton" style="height:250px; border-radius:8px;"></div>`;
  modal.classList.add('active');

  try {
    const res = await fetch('/api/admin/centers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    cachedAdminCenters = d.data || [];

    body.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-weight:700; color:var(--primary-navy); font-size:1.05rem;">National Mandi Centers (${cachedAdminCenters.length})</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">Create, configure capacity, operating hours, and active status.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openCenterFormModal()"><i class="fas fa-plus"></i> Add New Center</button>
        </div>

        <div style="max-height:360px; overflow-y:auto; border:1px solid var(--border-color); border-radius:8px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
            <thead>
              <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                <th style="padding:10px 12px;">ID & Name</th>
                <th style="padding:10px 12px;">Location</th>
                <th style="padding:10px 12px;">Desks & Cap.</th>
                <th style="padding:10px 12px;">Hours</th>
                <th style="padding:10px 12px;">Status</th>
                <th style="padding:10px 12px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cachedAdminCenters.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No Mandi centers registered.</td></tr>' : ''}
              ${cachedAdminCenters.map(c => `
                <tr style="border-bottom:1px solid var(--border-color);">
                  <td style="padding:10px 12px;">
                    <strong style="color:var(--primary-navy);">${c.name}</strong>
                    <div style="font-size:0.75rem; color:var(--saffron); font-weight:700;">${c.centerId}</div>
                  </td>
                  <td style="padding:10px 12px;">
                    <div>${c.district}, ${c.state}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted);">${c.fullAddress || ''}</div>
                  </td>
                  <td style="padding:10px 12px;">
                    <span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-weight:700;">${c.countersCount || 4} Desks</span>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${c.maxDailyCapacity || 250} Q/day</div>
                  </td>
                  <td style="padding:10px 12px; font-size:0.78rem; color:var(--text-muted);">
                    ${c.openingTime || '08:00 AM'} - ${c.closingTime || '06:00 PM'}
                  </td>
                  <td style="padding:10px 12px;">
                    <span class="status-pill ${c.isActive !== false ? 'completed' : 'rejected'}" style="font-size:0.7rem;">
                      ${c.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style="padding:10px 12px; text-align:right;">
                    <div style="display:inline-flex; gap:4px;">
                      <button class="btn btn-outline btn-sm" style="padding:3px 8px; font-size:0.75rem;" onclick='openCenterFormModal(${JSON.stringify(c).replace(/'/g, "&apos;")})' title="Edit"><i class="fas fa-edit"></i></button>
                      <button class="btn btn-outline btn-sm" style="padding:3px 8px; font-size:0.75rem; color:#EF4444;" onclick="deleteCenterAction('${c._id || c.centerId}')" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load Mandi Centers: ' + err.message, 'error');
  }
};

const openCenterFormModal = (center = null) => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  const isEdit = !!center;
  document.getElementById('modal-title').textContent = isEdit ? `Edit Center: ${center.name}` : 'Add New Mandi Center';

  body.innerHTML = `
    <form onsubmit="handleSaveCenter(event, '${isEdit ? (center._id || center.centerId) : ''}')">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div class="form-group">
          <label class="form-label">Center ID</label>
          <input type="text" id="center-id-input" class="form-control form-control-sm" placeholder="e.g. CTR-04" value="${isEdit ? (center.centerId || '') : ''}" ${isEdit ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Mandi Name *</label>
          <input type="text" id="center-name-input" class="form-control form-control-sm" placeholder="e.g. APMC Indore Central" value="${isEdit ? (center.name || '') : ''}" required />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div class="form-group">
          <label class="form-label">State *</label>
          <input type="text" id="center-state-input" class="form-control form-control-sm" placeholder="e.g. Madhya Pradesh" value="${isEdit ? (center.state || 'Madhya Pradesh') : 'Madhya Pradesh'}" required />
        </div>
        <div class="form-group">
          <label class="form-label">District *</label>
          <input type="text" id="center-dist-input" class="form-control form-control-sm" placeholder="e.g. Indore" value="${isEdit ? (center.district || '') : ''}" required />
        </div>
      </div>

      <div class="form-group" style="margin-bottom:10px;">
        <label class="form-label">Full Yard Address *</label>
        <input type="text" id="center-addr-input" class="form-control form-control-sm" placeholder="e.g. Main Yard, Sector 4, Mandi Complex" value="${isEdit ? (center.fullAddress || '') : ''}" required />
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:10px;">
        <div class="form-group">
          <label class="form-label">Latitude</label>
          <input type="number" step="0.0001" id="center-lat-input" class="form-control form-control-sm" value="${isEdit ? (center.latitude || 23.2599) : 23.2599}" />
        </div>
        <div class="form-group">
          <label class="form-label">Longitude</label>
          <input type="number" step="0.0001" id="center-lng-input" class="form-control form-control-sm" value="${isEdit ? (center.longitude || 77.4126) : 77.4126}" />
        </div>
        <div class="form-group">
          <label class="form-label">Counters Count</label>
          <input type="number" id="center-counters-input" class="form-control form-control-sm" min="1" max="10" value="${isEdit ? (center.countersCount || 4) : 4}" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Daily Capacity (Q)</label>
          <input type="number" id="center-cap-input" class="form-control form-control-sm" min="10" value="${isEdit ? (center.maxDailyCapacity || 250) : 250}" />
        </div>
        <div class="form-group">
          <label class="form-label">Opening Time</label>
          <input type="text" id="center-open-input" class="form-control form-control-sm" value="${isEdit ? (center.openingTime || '08:00 AM') : '08:00 AM'}" />
        </div>
        <div class="form-group">
          <label class="form-label">Closing Time</label>
          <input type="text" id="center-close-input" class="form-control form-control-sm" value="${isEdit ? (center.closingTime || '06:00 PM') : '06:00 PM'}" />
        </div>
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button type="button" class="btn btn-outline btn-sm" onclick="openCenterManagementModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-save"></i> ${isEdit ? 'Update Center' : 'Create Center'}</button>
      </div>
    </form>
  `;
};

const handleSaveCenter = async (e, editId) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const payload = {
    centerId: document.getElementById('center-id-input').value.trim(),
    name: document.getElementById('center-name-input').value.trim(),
    state: document.getElementById('center-state-input').value.trim(),
    district: document.getElementById('center-dist-input').value.trim(),
    fullAddress: document.getElementById('center-addr-input').value.trim(),
    latitude: parseFloat(document.getElementById('center-lat-input').value),
    longitude: parseFloat(document.getElementById('center-lng-input').value),
    countersCount: parseInt(document.getElementById('center-counters-input').value),
    maxDailyCapacity: parseInt(document.getElementById('center-cap-input').value),
    openingTime: document.getElementById('center-open-input').value.trim(),
    closingTime: document.getElementById('center-close-input').value.trim()
  };

  const url = editId ? `/api/admin/centers/${editId}` : '/api/admin/centers';
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message || 'Center saved successfully!', 'success');
      openCenterManagementModal();
    } else {
      showToast(d.message, 'error');
    }
  } catch (err) {
    showToast('Save error: ' + err.message, 'error');
  }
};

const deleteCenterAction = async (id) => {
  if (!confirm('Are you sure you want to remove this Mandi center?')) return;
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/admin/centers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'success');
      openCenterManagementModal();
    } else {
      showToast(d.message, 'error');
    }
  } catch (e) {
    showToast('Delete error: ' + e.message, 'error');
  }
};

// Officer Management & Allocation Modal
let cachedAdminOfficers = [];

const openOfficerManagementModal = async () => {
  const token = localStorage.getItem('kpms_token');
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').innerHTML = '<img src="/images/roles/officer.jpg" style="width:24px; height:24px; border-radius:6px; object-fit:cover; margin-right:8px; vertical-align:middle;" alt="" /> Mandi Officer Deployments & Desk Allocations';

  body.innerHTML = `<div class="skeleton" style="height:250px; border-radius:8px;"></div>`;
  modal.classList.add('active');

  try {
    const [offRes, cenRes] = await Promise.all([
      fetch('/api/admin/officers', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/admin/centers', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const offData = await offRes.json();
    const cenData = await cenRes.json();

    cachedAdminOfficers = offData.data || [];
    cachedAdminCenters = cenData.data || [];

    body.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-weight:700; color:var(--primary-navy); font-size:1.05rem;">Deployed Officers (${cachedAdminOfficers.length})</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">Allocate officers to specific Mandis and Counter Desks (Intake, Weighbridge, Quality, DBT).</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openOfficerFormModal()"><i class="fas fa-user-plus"></i> Allocate New Officer</button>
        </div>

        <div style="max-height:360px; overflow-y:auto; border:1px solid var(--border-color); border-radius:8px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
            <thead>
              <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                <th style="padding:10px 12px;">Officer Details</th>
                <th style="padding:10px 12px;">Designation</th>
                <th style="padding:10px 12px;">Assigned Mandi</th>
                <th style="padding:10px 12px;">Assigned Desk</th>
                <th style="padding:10px 12px;">Shift</th>
                <th style="padding:10px 12px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cachedAdminOfficers.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No officers registered.</td></tr>' : ''}
              ${cachedAdminOfficers.map(o => {
                const assignedCenter = cachedAdminCenters.find(c => c.centerId === o.assignedCenterId);
                return `
                  <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:10px 12px;">
                      <strong style="color:var(--primary-navy);">${o.name}</strong>
                      <div style="font-size:0.75rem; color:var(--saffron); font-weight:700;">${o.officerId || 'OFF-ID'}</div>
                      <div style="font-size:0.72rem; color:var(--text-muted);">${o.email} | ${o.mobile}</div>
                    </td>
                    <td style="padding:10px 12px; font-size:0.8rem; font-weight:600;">
                      ${o.designation || 'Procurement Officer'}
                    </td>
                    <td style="padding:10px 12px;">
                      <span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-weight:700;">
                        ${assignedCenter ? assignedCenter.name : (o.assignedCenterId || 'CTR-01')}
                      </span>
                    </td>
                    <td style="padding:10px 12px;">
                      <span class="badge" style="background:#FAF5FF; color:#9333EA; font-weight:700;">
                        ${o.assignedCounter || 'Counter 1'}
                      </span>
                    </td>
                    <td style="padding:10px 12px; font-size:0.78rem; color:var(--text-muted);">
                      ${o.shift || 'Morning Shift'}
                    </td>
                    <td style="padding:10px 12px; text-align:right;">
                      <div style="display:inline-flex; gap:4px;">
                        <button class="btn btn-outline btn-sm" style="padding:3px 8px; font-size:0.75rem;" onclick='openOfficerFormModal(${JSON.stringify(o).replace(/'/g, "&apos;")})' title="Reallocate"><i class="fas fa-user-gear"></i></button>
                        <button class="btn btn-outline btn-sm" style="padding:3px 8px; font-size:0.75rem; color:#EF4444;" onclick="deleteOfficerAction('${o._id || o.officerId}')" title="Remove"><i class="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load Officers: ' + err.message, 'error');
  }
};

const openOfficerFormModal = (officer = null) => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  const isEdit = !!officer;
  document.getElementById('modal-title').textContent = isEdit ? `Re-Allocate Officer: ${officer.name}` : 'Allocate New Officer';

  body.innerHTML = `
    <form onsubmit="handleSaveOfficer(event, '${isEdit ? (officer._id || officer.officerId) : ''}')">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="off-name-input" class="form-control form-control-sm" placeholder="e.g. Vikram Singh" value="${isEdit ? (officer.name || '') : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Official Email *</label>
          <input type="email" id="off-email-input" class="form-control form-control-sm" placeholder="e.g. officer@kpms.gov.in" value="${isEdit ? (officer.email || '') : ''}" required ${isEdit ? 'readonly' : ''} />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input type="tel" id="off-mobile-input" class="form-control form-control-sm" placeholder="e.g. 9800000002" value="${isEdit ? (officer.mobile || '') : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Designation</label>
          <input type="text" id="off-desig-input" class="form-control form-control-sm" placeholder="e.g. Senior Procurement Inspector" value="${isEdit ? (officer.designation || 'Senior Procurement Inspector') : 'Senior Procurement Inspector'}" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div class="form-group">
          <label class="form-label">Assigned Mandi Center *</label>
          <select id="off-center-input" class="form-control form-control-sm" required>
            ${cachedAdminCenters.map(c => `
              <option value="${c.centerId}" ${isEdit && officer.assignedCenterId === c.centerId ? 'selected' : ''}>
                ${c.name} (${c.centerId})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Assigned Counter Desk *</label>
          <select id="off-counter-input" class="form-control form-control-sm" required>
            <option value="Counter 1" ${isEdit && officer.assignedCounter === 'Counter 1' ? 'selected' : ''}>Counter 1 (Gate & Intake)</option>
            <option value="Counter 2" ${isEdit && officer.assignedCounter === 'Counter 2' ? 'selected' : ''}>Counter 2 (Weighbridge In-Scale)</option>
            <option value="Counter 3" ${isEdit && officer.assignedCounter === 'Counter 3' ? 'selected' : ''}>Counter 3 (Quality & Moisture)</option>
            <option value="Counter 4" ${isEdit && officer.assignedCounter === 'Counter 4' ? 'selected' : ''}>Counter 4 (DBT Settlement)</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr ${isEdit ? '' : '1fr'}; gap:10px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Duty Shift</label>
          <select id="off-shift-input" class="form-control form-control-sm">
            <option value="Morning (08:00 AM - 02:00 PM)" ${isEdit && officer.shift && officer.shift.includes('Morning') ? 'selected' : ''}>Morning (08:00 AM - 02:00 PM)</option>
            <option value="Evening (02:00 PM - 08:00 PM)" ${isEdit && officer.shift && officer.shift.includes('Evening') ? 'selected' : ''}>Evening (02:00 PM - 08:00 PM)</option>
            <option value="Full Day (08:00 AM - 06:00 PM)" ${isEdit && officer.shift && officer.shift.includes('Full') ? 'selected' : ''}>Full Day (08:00 AM - 06:00 PM)</option>
          </select>
        </div>
        ${!isEdit ? `
          <div class="form-group">
            <label class="form-label">Initial Password</label>
            <input type="password" id="off-pass-input" class="form-control form-control-sm" placeholder="Default: Officer@123" />
          </div>
        ` : ''}
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button type="button" class="btn btn-outline btn-sm" onclick="openOfficerManagementModal()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-save"></i> ${isEdit ? 'Save Allocation' : 'Create & Allocate'}</button>
      </div>
    </form>
  `;
};

const handleSaveOfficer = async (e, editId) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const payload = {
    name: document.getElementById('off-name-input').value.trim(),
    email: document.getElementById('off-email-input').value.trim(),
    mobile: document.getElementById('off-mobile-input').value.trim(),
    designation: document.getElementById('off-desig-input').value.trim(),
    assignedCenterId: document.getElementById('off-center-input').value,
    assignedCounter: document.getElementById('off-counter-input').value,
    shift: document.getElementById('off-shift-input').value
  };

  const passInput = document.getElementById('off-pass-input');
  if (passInput && passInput.value) {
    payload.password = passInput.value.trim();
  }

  const url = editId ? `/api/admin/officers/${editId}` : '/api/admin/officers';
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message || 'Officer allocation updated successfully!', 'success');
      openOfficerManagementModal();
    } else {
      showToast(d.message, 'error');
    }
  } catch (err) {
    showToast('Save error: ' + err.message, 'error');
  }
};

const deleteOfficerAction = async (id) => {
  if (!confirm('Are you sure you want to remove this officer?')) return;
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/admin/officers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'success');
      openOfficerManagementModal();
    } else {
      showToast(d.message, 'error');
    }
  } catch (e) {
    showToast('Delete error: ' + e.message, 'error');
  }
};

// Database Backup, Snapshot & Restore Console Modal
const openDatabaseBackupModal = async () => {
  const token = localStorage.getItem('kpms_token');
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'National Database Backup & Disaster Recovery';

  body.innerHTML = `<div class="skeleton" style="height:250px; border-radius:8px;"></div>`;
  modal.classList.add('active');

  try {
    const res = await fetch('/api/admin/backups', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    const backupList = d.data || [];

    body.innerHTML = `
      <div>
        <!-- Action Cards Grid -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px;">
          <div class="glass-card" style="padding:14px; background:#EFF6FF; border:1px solid #BFDBFE;">
            <div style="font-weight:800; color:#1E40AF; font-size:0.95rem; margin-bottom:4px;">
              <i class="fas fa-camera-retro"></i> Instant System Snapshot
            </div>
            <p style="font-size:0.75rem; color:#1E3A8A; margin-bottom:10px;">
              Captures an encrypted point-in-time state of all Mandi databases.
            </p>
            <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center;" onclick="createSnapshotAction()">
              <i class="fas fa-plus"></i> Take Snapshot Now
            </button>
          </div>

          <div class="glass-card" style="padding:14px; background:#ECFDF5; border:1px solid #A7F3D0;">
            <div style="font-weight:800; color:#065F46; font-size:0.95rem; margin-bottom:4px;">
              <i class="fas fa-file-arrow-down"></i> Export Full DB (JSON)
            </div>
            <p style="font-size:0.75rem; color:#047857; margin-bottom:10px;">
              Download a complete offline copy of entire portal data store.
            </p>
            <button class="btn btn-success btn-sm" style="width:100%; justify-content:center;" onclick="downloadDatabaseExport()">
              <i class="fas fa-download"></i> Export Data File
            </button>
          </div>
        </div>

        <!-- Restore Section -->
        <div style="background:#FAF5FF; border:1px solid #E9D5FF; padding:14px; border-radius:8px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-weight:800; color:#6B21A8; font-size:0.92rem;">
              <i class="fas fa-upload"></i> Restore Database from Backup File
            </div>
            <div style="font-size:0.75rem; color:#7E22CE;">Select a valid .json backup file to recover or overwrite database state.</div>
          </div>
          <label class="btn btn-navy btn-sm" style="margin:0; cursor:pointer;">
            <i class="fas fa-folder-open"></i> Upload & Restore JSON
            <input type="file" accept=".json" style="display:none;" onchange="handleRestoreFileUpload(this)" />
          </label>
        </div>

        <!-- History Table -->
        <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <h4 style="font-weight:800; color:var(--primary-navy); font-size:0.95rem; margin:0;">
            <i class="fas fa-clock-rotate-left"></i> System Snapshot Archive (${backupList.length})
          </h4>
          <button class="btn btn-outline btn-sm" style="color:#EF4444; font-size:0.75rem; padding:2px 8px;" onclick="resetDemoDatabaseAction()">
            <i class="fas fa-rotate-left"></i> Reset Demo Store
          </button>
        </div>

        <div style="max-height:180px; overflow-y:auto; border:1px solid var(--border-color); border-radius:8px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
            <thead>
              <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                <th style="padding:8px 10px;">Snapshot ID</th>
                <th style="padding:8px 10px;">Timestamp</th>
                <th style="padding:8px 10px;">Entities Archived</th>
                <th style="padding:8px 10px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${backupList.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--text-muted);">No system snapshots found. Click "Take Snapshot Now".</td></tr>' : ''}
              ${backupList.map(b => `
                <tr style="border-bottom:1px solid var(--border-color);">
                  <td style="padding:8px 10px; font-weight:700; color:var(--saffron);">${b.backupId}</td>
                  <td style="padding:8px 10px; font-size:0.75rem; color:var(--text-muted);">${new Date(b.timestamp).toLocaleString('en-IN')}</td>
                  <td style="padding:8px 10px;">
                    <span style="font-size:0.75rem;">
                      ${b.recordCounts ? `Farmers: ${b.recordCounts.farmers || 0} | Payouts: ${b.recordCounts.payments || 0}` : 'Full Snapshot'}
                    </span>
                  </td>
                  <td style="padding:8px 10px;">
                    <span class="status-pill completed" style="font-size:0.68rem;">VERIFIED</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load Backups: ' + err.message, 'error');
  }
};

const createSnapshotAction = async () => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message || 'Snapshot created successfully!', 'success');
      openDatabaseBackupModal();
    } else {
      showToast(d.message, 'error');
    }
  } catch (e) {
    showToast('Snapshot error: ' + e.message, 'error');
  }
};

const downloadDatabaseExport = async () => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/admin/backup/export', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KPMS_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast('Database export downloaded successfully!', 'success');
  } catch (e) {
    showToast('Download error: ' + e.message, 'error');
  }
};

const handleRestoreFileUpload = (input) => {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const json = JSON.parse(event.target.result);
      if (!confirm(`Restore database from file "${file.name}"? Current data will be replaced.`)) return;

      const token = localStorage.getItem('kpms_token');
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ backupData: json })
      });
      const d = await res.json();
      if (d.success) {
        showToast(d.message || 'Database restored successfully!', 'success');
        openDatabaseBackupModal();
        loadAdminDashboard();
      } else {
        showToast(d.message, 'error');
      }
    } catch (err) {
      showToast('Invalid JSON backup file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
};

const resetDemoDatabaseAction = async () => {
  if (!confirm('Reset entire system database to clean SIH Demo state?')) return;
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      showToast(d.message || 'System reset to clean demo state!', 'success');
      openDatabaseBackupModal();
      loadAdminDashboard();
    } else {
      showToast(d.message, 'error');
    }
  } catch (e) {
    showToast('Reset error: ' + e.message, 'error');
  }
};

/**
 * Pending Officer Registrations Review & Approval Modal
 */
const openPendingOfficersModal = async () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Pending Procurement Officer Registrations';

  body.innerHTML = `<div class="skeleton" style="height:250px; border-radius:8px;"></div>`;
  modal.classList.add('active');

  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/registration/officers/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    const list = json.data || [];

    if (list.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding:30px 10px;">
          <div style="width:60px; height:60px; border-radius:50%; background:#ECFDF5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 14px auto;">
            <i class="fas fa-circle-check"></i>
          </div>
          <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;">No Pending Officer Applications</h4>
          <p style="color:var(--text-muted); font-size:0.85rem;">All submitted Procurement Officer applications have been processed.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = `
      <div>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">
          The following officers have verified their OTP and are awaiting administrative verification and appointment authorization.
        </p>

        <div style="display:flex; flex-direction:column; gap:14px; max-height:450px; overflow-y:auto; padding-right:4px;">
          ${list.map(item => {
            const d = item.data || {};
            const docs = d.documents || [];
            return `
              <div class="glass-card" style="padding:16px; border-left:4px solid #2563EB;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                  <div>
                    <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">${d.fullName}</h4>
                    <div style="font-size:0.82rem; color:var(--text-muted);">
                      EMP ID: <strong>${d.employeeId}</strong> • Designation: <strong>${d.designation}</strong>
                    </div>
                  </div>
                  <span class="status-pill pending"><i class="fas fa-hourglass-half"></i> Pending Review</span>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.82rem; margin-bottom:12px; background:var(--bg-main); padding:10px; border-radius:6px;">
                  <div><strong>Official Email:</strong> ${d.officialEmail}</div>
                  <div><strong>Mobile:</strong> +91 ${d.mobile}</div>
                  <div><strong>Assigned Mandi:</strong> ${d.procurementCentreName} (${d.procurementCentreCode})</div>
                  <div><strong>Department:</strong> ${d.department}</div>
                </div>

                <!-- Verified Documents Badge List -->
                <div style="margin-bottom:14px;">
                  <div style="font-size:0.78rem; font-weight:700; color:var(--primary-navy); margin-bottom:6px;">Submitted & OCR-Verified Credentials:</div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    ${docs.map(doc => `
                      <a href="${doc.fileUrl}" target="_blank" class="status-pill completed" style="font-size:0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                        <i class="fas fa-file-check"></i> ${doc.docType} <i class="fas fa-arrow-up-right-from-square" style="font-size:0.65rem;"></i>
                      </a>
                    `).join('')}
                  </div>
                </div>

                <!-- Admin Action Buttons -->
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button class="btn btn-outline btn-sm" style="color:#EF4444; border-color:#EF4444;" onclick="rejectOfficerAction('${item._id || item.tempId}', '${d.fullName}')">
                    <i class="fas fa-times"></i> Reject Application
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="approveOfficerAction('${item._id || item.tempId}', '${d.fullName}')">
                    <i class="fas fa-check-double"></i> Authorize & Issue Officer ID
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div style="color:#EF4444; padding:20px;">Failed to load applications: ${err.message}</div>`;
  }
};

const approveOfficerAction = async (id, name) => {
  if (!confirm(`Approve Procurement Officer "${name}"? An official Officer ID will be generated and access credentials sent.`)) return;

  const token = localStorage.getItem('kpms_token');
  showToast(`Approving and generating credentials for ${name}...`, 'info');

  try {
    const res = await fetch(`/api/registration/officer/${id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message, 'success');
      openPendingOfficersModal();
    } else {
      showToast(json.message, 'error');
    }
  } catch (err) {
    showToast('Approval error: ' + err.message, 'error');
  }
};

const rejectOfficerAction = async (id, name) => {
  const remarks = prompt(`Enter rejection remarks for ${name}:`, 'Documents failed administrative verification');
  if (!remarks) return;

  const token = localStorage.getItem('kpms_token');
  showToast(`Processing rejection for ${name}...`, 'info');

  try {
    const res = await fetch(`/api/registration/officer/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ remarks })
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message, 'success');
      openPendingOfficersModal();
    } else {
      showToast(json.message, 'error');
    }
  } catch (err) {
    showToast('Rejection error: ' + err.message, 'error');
  }
};

const scrollToAdminReadiness = () => {
  const el = document.getElementById('admin-readiness-widget');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
    el.style.borderColor = '#E06D14';
    el.style.boxShadow = '0 0 0 4px rgba(224, 109, 20, 0.35)';
    setTimeout(() => {
      el.style.boxShadow = '0 6px 20px rgba(224,109,20,0.08)';
    }, 2500);
  } else {
    loadAdminDashboard().then(() => {
      setTimeout(() => {
        const target = document.getElementById('admin-readiness-widget');
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

const testRazorpaySuperadminCheckout = (amount = 500, description = 'DBT_TEST_SETTLEMENT', farmerName = 'Verified Beneficiary Farmer') => {
  if (typeof initiateRazorpayPayment === 'function') {
    initiateRazorpayPayment(null, amount, description, farmerName);
  } else {
    showToast('Initializing Razorpay secure gateway...', 'info');
  }
};

window.testRazorpaySuperadminCheckout = testRazorpaySuperadminCheckout;
window.scrollToAdminReadiness = scrollToAdminReadiness;

const scrollToAdminCongestion = () => {
  const el = document.getElementById('admin-congestion-widget');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
    el.style.borderColor = '#0D5C3A';
    el.style.boxShadow = '0 0 0 4px rgba(13, 92, 58, 0.25)';
    setTimeout(() => {
      el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
      el.style.borderColor = 'var(--border-color)';
    }, 2500);
  } else {
    loadAdminDashboard().then(() => {
      setTimeout(() => {
        const target = document.getElementById('admin-congestion-widget');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
          target.style.borderColor = '#0D5C3A';
          target.style.boxShadow = '0 0 0 4px rgba(13, 92, 58, 0.25)';
          setTimeout(() => {
            target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
            target.style.borderColor = 'var(--border-color)';
          }, 2500);
        }
      }, 400);
    });
  }
};

const refreshAdminCongestionTable = async () => {
  const tbody = document.getElementById('admin-congestion-table-body');
  if (!tbody) return;
  try {
    showToast('Refreshing live mandi queue and congestion estimates...', 'info');
    const res = await fetch('/api/ai/dashboard');
    const json = await res.json();
    const insights = (json.data && json.data.centerInsights) || [];
    window.adminCenterInsights = insights;
    tbody.innerHTML = insights.length > 0 ? insights.map(c => `
      <tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:12px 14px; font-weight:700; color:var(--primary-navy);">${c.name}</td>
        <td style="padding:12px 14px; color:var(--text-muted);">${c.district}, ${c.state}</td>
        <td style="padding:12px 14px; font-weight:700;">${c.waitingFarmers || 0} Farmers</td>
        <td style="padding:12px 14px; font-weight:800; color:var(--saffron);">${c.estimatedWaitMinutes || 5} Minutes</td>
        <td style="padding:12px 14px;">
          <span class="status-pill ${c.congestionLevel === 'High' ? 'skipped' : (c.congestionLevel === 'Medium' ? 'waiting' : 'completed')}" style="font-weight:700; font-size:0.75rem; text-transform:uppercase;">
            ${c.congestionLevel || 'LOW'}
          </span>
        </td>
        <td style="padding:12px 14px; color:var(--green-gov); font-weight:700;">${Math.round((c.confidenceScore || 0.94) * 100)}%</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="6" style="padding:24px; text-align:center; color:var(--text-muted);">
          No live congestion records available currently.
        </td>
      </tr>
    `;
    showToast('Live mandi congestion estimates updated.', 'success');
  } catch (err) {
    showToast('Could not refresh congestion estimates: ' + err.message, 'error');
  }
};

window.scrollToAdminCongestion = scrollToAdminCongestion;
window.refreshAdminCongestionTable = refreshAdminCongestionTable;
window.openPendingOfficersModal = openPendingOfficersModal;
window.approveOfficerAction = approveOfficerAction;
window.rejectOfficerAction = rejectOfficerAction;

