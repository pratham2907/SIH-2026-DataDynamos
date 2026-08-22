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
        <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${user.name}</div>
        <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-shield-halved"></i> ${user.designation || 'Senior Procurement Inspector'}</div>
        <div style="font-size:0.72rem; color:#94A3B8; margin-top:2px;">${center ? center.name : 'APMC Mandi'}</div>
      </div>
      <div class="sidebar-heading">Officer Console</div>
      <a class="nav-link ${activeKey === 'console' ? 'active' : ''}" onclick="loadOfficerDashboard()"><i class="fas fa-desktop"></i> Operations Console</a>
      <a class="nav-link" onclick="openGateScannerModal()"><i class="fas fa-qrcode"></i> Gate QR Scanner</a>
      <a class="nav-link ${activeKey === 'queue' ? 'active' : ''}" onclick="loadOfficerQueueView()"><i class="fas fa-list-check"></i> Multi-Counter Queue</a>
      <a class="nav-link" onclick="openProcurementStepper()"><i class="fas fa-scale-balanced"></i> Weighbridge & Quality</a>
      <a class="nav-link" onclick="openFarmerSearchModal()"><i class="fas fa-search"></i> Universal Farmer Lookup</a>
      <a class="nav-link" onclick="openAnnouncementModal()"><i class="fas fa-bullhorn"></i> Mandi Announcements</a>
      <a class="nav-link" onclick="routeTo('#tv-display')"><i class="fas fa-tv"></i> Public Display TV Mode</a>
      <div style="margin-top:auto; padding-top:16px;">
        <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>
    </aside>
  `;
};

/**
 * 1. OPERATIONS CONSOLE (MAIN DASHBOARD)
 */
const loadOfficerDashboard = async () => {
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
    const res = await fetch(`/api/officer/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    const { center, stats, currentQueue, inventory } = result;

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
                Operating Hours: <strong>${center.openingTime} - ${center.closingTime}</strong> | Active Counters: <strong>${center.countersCount || 4} Counters</strong> | Crowd Level: <span class="status-pill waiting">${stats.congestionLevel}</span>
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-primary" onclick="openGateScannerModal()"><i class="fas fa-qrcode"></i> Scan Farmer Pass</button>
              <button class="btn btn-navy" onclick="loadOfficerQueueView()"><i class="fas fa-list-check"></i> Multi-Counter Queue</button>
              <button class="btn btn-success" onclick="callNextTokenAction()"><i class="fas fa-bullhorn"></i> Call Next Farmer</button>
            </div>
          </div>

          <!-- KPI Metric Cards -->
          <div class="dashboard-grid">
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.waitingInQueue}</div>
                <div class="metric-title">Farmers Waiting in Queue</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706;"><i class="fas fa-hourglass-half"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.completedToday}</div>
                <div class="metric-title">Procurements Completed Today</div>
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

          <!-- Live Multi-Counter Queue Table with Controls -->
          <div class="glass-card" style="padding:24px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 style="color:var(--primary-navy); font-weight:800;"><i class="fas fa-users-line"></i> Today's Live Mandi Queue</h3>
                <p style="color:var(--text-muted); font-size:0.85rem;">Manage token progressions, initiate quality inspections, and trigger payments.</p>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary btn-sm" onclick="loadOfficerQueueView()"><i class="fas fa-table-columns"></i> Full Counter View</button>
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
                  All Counters (${allQueues.length})
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
                  ⚡ Priority Only (${allQueues.filter(q => q.isPriority).length})
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

const openGateScannerModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Gate QR Scanner & Token Dispenser';

  body.innerHTML = `
    <div style="padding:10px;">
      <div class="scanner-box" style="margin-bottom:18px;">
        <div class="scanner-laser"></div>
        <div style="color:#FFF; font-size:0.85rem; text-align:center; z-index:10;">
          <i class="fas fa-camera" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
          Align Farmer Booking Pass QR inside box
        </div>
      </div>

      <div style="text-align:center; margin-bottom:14px; font-weight:700; color:var(--text-muted); font-size:0.85rem;">
        OR ENTER BOOKING NUMBER MANUALLY
      </div>

      <form onsubmit="handleManualGateCheckin(event)">
        <div class="form-group">
          <input type="text" id="manual-booking-input" class="form-control" placeholder="Enter Booking No (e.g. BKG-2026-001)" style="text-align:center; font-size:1.1rem; font-weight:700;" value="BKG-2026-001" required />
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; justify-content:center;">
          <input type="checkbox" id="checkin-priority-check" />
          <label for="checkin-priority-check" style="font-size:0.88rem; font-weight:600; cursor:pointer;">
            Senior Citizen / Specially Abled / Priority Entry
          </label>
        </div>

        <div style="display:flex; gap:10px; justify-content:center;">
          <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;"><i class="fas fa-ticket"></i> Check-In & Generate Digital Token</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.add('active');
};

const handleManualGateCheckin = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const bookingNumber = document.getElementById('manual-booking-input').value.trim();
  const isPriority = document.getElementById('checkin-priority-check').checked;

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
      showToast(`Gate Check-in Success! Token ${data.data.tokenNumber} issued to ${data.data.farmerName}`, 'success');
      closeModal();
      refreshOfficerCurrentView();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Check-in error: ' + err.message, 'error');
  }
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
  document.getElementById('modal-title').textContent = 'Universal Farmer & KYC Lookup';

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
