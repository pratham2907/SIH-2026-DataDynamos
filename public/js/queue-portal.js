// Farmer Live Queue Tracker Controller

const loadFarmerQueuePage = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) return routeTo('#landing');

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const res = await fetch('/api/queue/farmer-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();

    if (!result.success || !result.hasActiveQueue) {
      container.innerHTML = `
        <div class="app-container">
          <aside class="sidebar">
            <div class="sidebar-heading">Queue Navigation</div>
            <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> Dashboard</a>
            <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> Book Slot</a>
            <a class="nav-link active" onclick="loadFarmerQueuePage()"><i class="fas fa-users-line"></i> Live Queue</a>
          </aside>
          <main class="main-content">
            <div class="glass-panel" style="padding:40px; text-align:center; max-width:700px; margin:40px auto;">
              <div style="font-size:3.5rem; color:var(--text-muted); margin-bottom:16px;"><i class="fas fa-ticket-alt"></i></div>
              <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:12px;">No Active Queue Token</h2>
              <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;">
                You do not have an active queue token for today. Once you book a slot and arrive at the Mandi entrance, show your QR Pass to the Officer Gate Scanner to enter the digital queue.
              </p>
              <div style="display:flex; gap:12px; justify-content:center;">
                <button class="btn btn-primary" onclick="routeTo('#book-slot')"><i class="fas fa-plus"></i> Book Procurement Slot</button>
                <button class="btn btn-outline" onclick="routeTo('#my-bookings')"><i class="fas fa-qrcode"></i> View QR Passes</button>
              </div>
            </div>
          </main>
        </div>
      `;
      return;
    }

    const { queue, farmersAhead, currentlyServingToken, currentlyServingCounter, estimatedWaitMinutes, congestionLevel } = result;

    container.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-heading">Queue Tracking</div>
          <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> Dashboard</a>
          <a class="nav-link active" onclick="loadFarmerQueuePage()"><i class="fas fa-users-line"></i> Live Queue Status</a>
          <a class="nav-link" onclick="routeTo('#my-bookings')"><i class="fas fa-ticket-alt"></i> My Bookings</a>
          <a class="nav-link" onclick="routeTo('#tv-display')"><i class="fas fa-tv"></i> Public TV Display Board</a>
        </aside>

        <main class="main-content">
          <div style="max-width:900px; margin:0 auto;">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
              <div>
                <h2 style="color:var(--primary-navy); font-weight:800;">Real-Time Mandi Queue Monitor</h2>
                <p style="color:var(--text-muted); font-size:0.9rem;">Auto-updates continuously via Socket.IO stream.</p>
              </div>
              <button class="btn btn-outline" onclick="loadFarmerQueuePage()"><i class="fas fa-rotate"></i> Refresh Now</button>
            </div>

            <!-- Big Live Token Showcase Card -->
            <div class="glass-panel" style="padding:32px; text-align:center; margin-bottom:24px; border:2px solid var(--saffron); background:radial-gradient(circle at center, var(--bg-card), var(--bg-main));">
              <span class="status-pill ${queue.status.toLowerCase()} ${queue.status === 'called' ? 'animate-pulse-glow' : ''}" style="font-size:0.9rem; padding:6px 16px; margin-bottom:12px;">
                <i class="fas fa-circle-notch fa-spin"></i> Status: ${queue.status.toUpperCase()}
              </span>

              <div style="color:var(--text-muted); font-size:0.95rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-top:8px;">Your Queue Token</div>
              <div class="queue-token-badge animate-saffron-pulse">${queue.tokenNumber}</div>

              <div style="font-size:1.3rem; font-weight:700; color:var(--primary-navy); margin-top:8px;">
                Assigned to: <span style="color:var(--green-gov);">${queue.counterNumber}</span>
              </div>

              ${queue.status === 'called' ? `
                <div style="background:#DBEAFE; color:#1E40AF; padding:12px; border-radius:8px; margin:20px auto 0; max-width:500px; font-weight:700; font-size:1.05rem;">
                  🔔 YOUR TOKEN IS CALLED! Please proceed immediately to ${queue.counterNumber}.
                </div>
              ` : ''}
            </div>

            <!-- Queue Progress Matrix -->
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px;">
              <div class="glass-card" style="padding:20px; text-align:center;">
                <div style="font-size:2rem; font-weight:800; color:var(--primary-navy);">${farmersAhead}</div>
                <div style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">Farmers Ahead of You</div>
              </div>
              <div class="glass-card" style="padding:20px; text-align:center;">
                <div style="font-size:2rem; font-weight:800; color:var(--saffron);">${estimatedWaitMinutes} Mins</div>
                <div style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">Estimated Wait Time</div>
              </div>
              <div class="glass-card" style="padding:20px; text-align:center;">
                <div style="font-size:2rem; font-weight:800; color:var(--green-gov);">${currentlyServingToken}</div>
                <div style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">Currently Serving at ${currentlyServingCounter}</div>
              </div>
            </div>

            <!-- Guidelines and Live Audio Alert Notice -->
            <div class="glass-card" style="padding:20px; border-left:4px solid var(--green-gov);">
              <h4 style="color:var(--primary-navy); margin-bottom:8px;"><i class="fas fa-bell"></i> Audio Chime & Visual Callout Enabled</h4>
              <p style="color:var(--text-muted); font-size:0.88rem;">
                Keep this screen open or your phone nearby. When the Procurement Officer clicks "Call Next", an audio chime will sound, and your screen will turn blue with your counter directions.
              </p>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load queue status: ' + err.message, 'error');
  }
};

const refreshQueueView = () => {
  const hash = window.location.hash;
  if (hash === '#farmer-queue') {
    loadFarmerQueuePage();
  }
};
