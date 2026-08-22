// Farmer DBT Payment Management & Grievance Controller

const loadFarmerPaymentsPage = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) return routeTo('#landing');

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const res = await fetch('/api/payments/farmer', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    const { stats, payments } = result;

    container.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-heading">${getT('sidebar_navigation', 'Navigation')}</div>
          <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> ${getT('nav_dashboard', 'Dashboard')}</a>
          <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-calendar-plus"></i> ${getT('btn_book_slot', 'Book Slot')}</a>
          <a class="nav-link" onclick="routeTo('#my-bookings')"><i class="fas fa-ticket-alt"></i> ${getT('my_bookings', 'My Bookings')}</a>
          <a class="nav-link active" onclick="loadFarmerPaymentsPage()"><i class="fas fa-money-check-dollar"></i> ${getT('dbt_tracker', 'DBT Payment Tracker')}</a>
        </aside>

        <main class="main-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
            <div>
              <h2 style="color:var(--primary-navy); font-weight:800;">Direct Benefit Transfer (DBT) Payouts</h2>
              <p style="color:var(--text-muted); font-size:0.9rem;">Track real-time treasury disbursements and download digital tax-exempt vouchers.</p>
            </div>
            <button class="btn btn-outline" onclick="openGrievanceModal()"><i class="fas fa-circle-exclamation"></i> Raise Payment Grievance</button>
          </div>

          <!-- Summary Metric Cards -->
          <div class="dashboard-grid">
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val" style="color:var(--green-gov);">₹${stats.totalEarned.toLocaleString('en-IN')}</div>
                <div class="metric-title">Total Disbursed (Completed)</div>
              </div>
              <div class="metric-icon-box" style="background:#ECFDF5; color:#059669;"><i class="fas fa-vault"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val" style="color:var(--gold);">₹${stats.pendingAmount.toLocaleString('en-IN')}</div>
                <div class="metric-title">In-Treasury Processing</div>
              </div>
              <div class="metric-icon-box" style="background:#FFFBEB; color:#D97706;"><i class="fas fa-hourglass-start"></i></div>
            </div>
            <div class="glass-card metric-card">
              <div>
                <div class="metric-val">${stats.completedCount}</div>
                <div class="metric-title">Completed Vouchers</div>
              </div>
              <div class="metric-icon-box" style="background:#EFF6FF; color:#2563EB;"><i class="fas fa-file-circle-check"></i></div>
            </div>
          </div>

          <!-- Transaction List -->
          <div class="glass-card" style="padding:24px;">
            <h3 style="color:var(--primary-navy); font-weight:700; margin-bottom:16px;"><i class="fas fa-receipt"></i> Official Payment Transactions</h3>

            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                    <th style="padding:12px 14px;">Voucher No</th>
                    <th style="padding:12px 14px;">Bank & A/C</th>
                    <th style="padding:12px 14px;">UTR Number</th>
                    <th style="padding:12px 14px;">Amount (₹)</th>
                    <th style="padding:12px 14px;">Status</th>
                    <th style="padding:12px 14px; text-align:right;">Receipt PDF</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No DBT transactions found.</td></tr>' : ''}
                  ${payments.map(p => `
                    <tr style="border-bottom:1px solid var(--border-color);">
                      <td style="padding:12px 14px; font-weight:700; color:var(--primary-navy);">${p.receiptNumber}</td>
                      <td style="padding:12px 14px;">
                        <div>${p.bankName}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">A/C: XXXX-XXXX-${(p.accountNumber || '1234').slice(-4)}</div>
                      </td>
                      <td style="padding:12px 14px; font-family:monospace; font-weight:600; color:var(--primary-navy);">${p.utrNumber || 'Processing'}</td>
                      <td style="padding:12px 14px; font-weight:800; color:var(--green-gov); font-size:1.05rem;">₹${p.amount.toLocaleString('en-IN')}</td>
                      <td style="padding:12px 14px;"><span class="status-pill ${p.status.toLowerCase()}">${p.status}</span></td>
                      <td style="padding:12px 14px; text-align:right;">
                        <a href="/api/procurement/${p.receiptNumber}/receipt-pdf" target="_blank" class="btn btn-outline btn-sm">
                          <i class="fas fa-download"></i> PDF Voucher
                        </a>
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
    showToast('Failed to load payments: ' + err.message, 'error');
  }
};

const openGrievanceModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Raise Direct DBT Payment Grievance';

  body.innerHTML = `
    <form onsubmit="handleGrievanceSubmit(event)">
      <div class="form-group">
        <label class="form-label">Receipt / Voucher Number (Optional)</label>
        <input type="text" id="grv-receipt" class="form-control" placeholder="e.g. RCP-2026-081" />
      </div>
      <div class="form-group">
        <label class="form-label">Issue Subject *</label>
        <select id="grv-subject" class="form-control" required>
          <option value="DBT Amount Not Credited after 72 Hours">DBT Amount Not Credited after 72 Hours</option>
          <option value="Incorrect Bank Account / IFSC Linked">Incorrect Bank Account / IFSC Linked</option>
          <option value="MSP Quality Deductions Discrepancy">MSP Quality Deductions Discrepancy</option>
          <option value="Other Mandi Issue">Other Mandi Issue</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Grievance Description *</label>
        <textarea id="grv-desc" class="form-control" rows="3" placeholder="Please describe the issue in detail..." required></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;"><i class="fas fa-paper-plane"></i> Submit Grievance to District Office</button>
    </form>
  `;
  modal.classList.add('active');
};

const handleGrievanceSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const payload = {
    receiptNumber: document.getElementById('grv-receipt').value,
    subject: document.getElementById('grv-subject').value,
    description: document.getElementById('grv-desc').value
  };

  try {
    const res = await fetch('/api/payments/complaint', {
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
    } else {
      showToast(d.message, 'error');
    }
  } catch (err) {
    showToast('Failed to submit complaint', 'error');
  }
};
