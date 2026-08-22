// Super Admin & Government Executive Control Center

let adminMapInstance = null;
let adminAnalyticsChart = null;

const loadAdminDashboard = async () => {
  const token = localStorage.getItem('kpms_token');
  const user = getCurrentUser();
  if (!token || !user || user.role !== 'admin') {
    routeTo('#landing');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const [dashRes, mapRes, analyticsRes] = await Promise.all([
      fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/admin/map-data'),
      fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const dashData = await dashRes.json();
    const mapData = await mapRes.json();
    const analyticsData = await analyticsRes.json();

    const { kpis, centersSummary, recentTransactions } = dashData;

    container.innerHTML = `
      <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
          <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
            <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${user.name}</div>
            <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-landmark"></i> Super Admin / Govt Portal</div>
          </div>
          <div class="sidebar-heading">National Administration</div>
          <a class="nav-link active" onclick="loadAdminDashboard()"><i class="fas fa-chart-line"></i> National Overview</a>
          <a class="nav-link" onclick="openCenterManagementModal()"><i class="fas fa-building-wheat"></i> Mandi Centers CRUD</a>
          <a class="nav-link" onclick="openOfficerManagementModal()"><i class="fas fa-user-shield"></i> Officer Allocations</a>
          <a class="nav-link" onclick="openPaymentReleaseModal()"><i class="fas fa-money-bill-transfer"></i> Bulk DBT Treasury Release</a>
          <a class="nav-link" onclick="triggerDatabaseBackup()"><i class="fas fa-database"></i> Database Backup & Restore</a>
          <a class="nav-link" onclick="routeTo('#ai-insights')"><i class="fas fa-brain"></i> AI & Congestion Predictor</a>
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
            <div style="display:flex; gap:10px;">
              <button class="btn btn-primary" onclick="openPaymentReleaseModal()"><i class="fas fa-bolt"></i> Release Pending DBT</button>
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | KPMS Gov India'
    }).addTo(adminMapInstance);

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
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; padding:16px; border-radius:8px; margin-bottom:16px;">
          <div style="font-size:1.1rem; font-weight:800; color:var(--green-gov);">
            Pending Verified Disbursements: ${verifiedPayments.length} Vouchers (₹${d.totalValue.toLocaleString('en-IN')})
          </div>
          <p style="font-size:0.85rem; color:#065F46; margin-top:4px;">
            Releasing will disburse direct funds into Aadhaar-linked accounts via PFMS/DBT gateway.
          </p>
        </div>

        <div style="max-height:240px; overflow-y:auto; margin-bottom:18px;">
          ${verifiedPayments.length === 0 ? '<p style="color:var(--text-muted); text-align:center; padding:20px;">All DBT disbursements are up to date.</p>' : ''}
          ${verifiedPayments.map(p => `
            <div style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700;">${p.farmerName} (${p.receiptNumber})</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">${p.bankName} - A/C ${p.accountNumber}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800; color:var(--green-gov);">₹${p.amount.toLocaleString('en-IN')}</div>
                <button class="btn btn-success btn-sm" style="margin-top:4px;" onclick="releaseSinglePayment('${p._id}')">Release DBT</button>
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

const triggerDatabaseBackup = async () => {
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.message, 'success');
    }
  } catch (e) {}
};
