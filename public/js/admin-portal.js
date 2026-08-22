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
          <a class="nav-link" onclick="openDatabaseBackupModal()"><i class="fas fa-database"></i> Database Backup & Restore</a>
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

// Center Management CRUD Modal
let cachedAdminCenters = [];

const openCenterManagementModal = async () => {
  const token = localStorage.getItem('kpms_token');
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = '🏢 Mandi Procurement Centers Management';

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
  document.getElementById('modal-title').textContent = isEdit ? `✏️ Edit Center: ${center.name}` : '➕ Add New Mandi Center';

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
  document.getElementById('modal-title').textContent = '👮 Mandi Officer Deployments & Desk Allocations';

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
  document.getElementById('modal-title').textContent = isEdit ? `👮 Re-Allocate Officer: ${officer.name}` : '➕ Allocate New Officer';

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
  document.getElementById('modal-title').textContent = '💾 National Database Backup & Disaster Recovery';

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
