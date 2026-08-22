// Farmer Dashboard & Operations Controller

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
        <aside class="sidebar">
          <div style="padding:10px 14px; border-bottom:1px solid var(--border-color); margin-bottom:12px;">
            <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${farmer.fullName}</div>
            <div style="font-size:0.75rem; color:var(--saffron); font-weight:600;"><i class="fas fa-id-card"></i> ${farmer.farmerId}</div>
          </div>
          <div class="sidebar-heading">Farmer Menu</div>
          <a class="nav-link active" onclick="loadFarmerDashboard()"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
          <a class="nav-link" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles" style="color:var(--saffron);"></i> 🌾 Smart Mandi Finder</a>
          <a class="nav-link" onclick="routeTo('#mandi-prices')"><i class="fas fa-carrot" style="color:var(--green-gov);"></i> 🥕 Mandi Live Prices</a>
          <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> Slot Booking</a>
          <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> Live Queue Tracker</a>
          <a class="nav-link" onclick="routeTo('#my-bookings')"><i class="fas fa-ticket-alt"></i> My Bookings</a>
          <a class="nav-link" onclick="routeTo('#farmer-payments')"><i class="fas fa-money-check-dollar"></i> DBT Payment Tracker</a>
          <a class="nav-link" onclick="routeTo('#farmer-farms')"><i class="fas fa-tractor"></i> My Farms & Crops</a>
          <a class="nav-link" onclick="routeTo('#farmer-profile')"><i class="fas fa-user-circle"></i> KYC Profile & Docs</a>
          <div style="margin-top:auto; padding-top:16px;">
            <a class="nav-link" style="color:#EF4444;" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </aside>

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
