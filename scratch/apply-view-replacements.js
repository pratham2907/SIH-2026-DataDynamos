const fs = require('fs');
const path = require('path');

function updateFile(relPath, pairs) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error('File does not exist:', relPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let replaced = 0;
  for (const { from, to } of pairs) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      replaced++;
    } else {
      // try trimmed match
      const trimmedFrom = from.trim();
      if (content.includes(trimmedFrom)) {
        content = content.replace(trimmedFrom, to.trim());
        replaced++;
      }
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`${relPath}: replaced ${replaced} / ${pairs.length} strings`);
}

// 1. Farmer Portal updates
updateFile('public/js/farmer-portal.js', [
  {
    from: `<i class="fas fa-circle-check"></i> Active Procurement Token`,
    to: `<i class="fas fa-circle-check"></i> \${getT('active_procurement_token', 'Active Procurement Token')}`
  },
  {
    from: `<i class="fas fa-users-rays"></i> Track Live Queue`,
    to: `<i class="fas fa-users-rays"></i> \${getT('track_live_queue', 'Track Live Queue')}`
  },
  {
    from: `<i class="fas fa-qrcode"></i> View QR Pass`,
    to: `<i class="fas fa-qrcode"></i> \${getT('view_qr_pass', 'View QR Pass')}`
  },
  {
    from: `<div><strong style="color:#111827;">Gate Entry:</strong> Counter Gate 2</div>`,
    to: `<div><strong style="color:#111827;">\${getT('lbl_gate_entry', 'Gate Entry:')}</strong> Counter Gate 2</div>`
  },
  {
    from: `<div><strong style="color:#111827;">Expected Weighment:</strong> Weighbridge #3</div>`,
    to: `<div><strong style="color:#111827;">\${getT('lbl_expected_weighment', 'Expected Weighment:')}</strong> Weighbridge #3</div>`
  },
  {
    from: `<div><strong style="color:#111827;">Estimated Payout:</strong>`,
    to: `<div><strong style="color:#111827;">\${getT('lbl_estimated_payout', 'Estimated Payout:')}</strong>`
  },
  {
    from: `<strong style="font-size:0.95rem; color:#111827; display:block;">No Active Procurement Token Today</strong>`,
    to: `<strong style="font-size:0.95rem; color:#111827; display:block;">\${getT('no_token_today', 'No Active Procurement Token Today')}</strong>`
  },
  {
    from: `Book your arrival slot in advance to avoid mandi gate queues and secure guaranteed MSP weighment.`,
    to: `\${getT('no_token_today_desc', 'Book your arrival slot in advance to avoid mandi gate queues and secure guaranteed MSP weighment.')}`
  },
  {
    from: `<i class="fas fa-calendar-plus"></i> Book Slot Now`,
    to: `<i class="fas fa-calendar-plus"></i> \${getT('btn_book_slot_now', 'Book Slot Now')}`
  },
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Live APMC Market Rates &bull; MSP Benchmark</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('live_apmc_rates', 'Live APMC Market Rates • MSP Benchmark')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Real-time Agmarknet mandi terminal rates & central MSP floor prices</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('live_apmc_sub', 'Real-time Agmarknet mandi terminal rates & central MSP floor prices')}</span>`
  },
  {
    from: `Full Mandi Price Board <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('full_price_board', 'Full Mandi Price Board')} <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Direct Benefit Transfer (DBT) &bull; Bank Remittances</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('dbt_bank_remittances', 'Direct Benefit Transfer (DBT) • Bank Remittances')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Real-time treasury disbursements, PFMS transaction tracking and J-Form vouchers</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('dbt_remittances_sub', 'Real-time treasury disbursements, PFMS transaction tracking and J-Form vouchers')}</span>`
  },
  {
    from: `Full Payment Ledger <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('full_payment_ledger', 'Full Payment Ledger')} <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<span style="font-size:0.72rem; color:#166534; font-weight:700; text-transform:uppercase;">Total Credited (MSP)</span>`,
    to: `<span style="font-size:0.72rem; color:#166534; font-weight:700; text-transform:uppercase;">\${getT('total_credited_msp', 'Total Credited (MSP)')}</span>`
  },
  {
    from: `<i class="fas fa-circle-check"></i> 100% PFMS Disbursed`,
    to: `<i class="fas fa-circle-check"></i> \${getT('pfms_disbursed', '100% PFMS Disbursed')}`
  },
  {
    from: `<span style="font-size:0.72rem; color:#92400E; font-weight:700; text-transform:uppercase;">In-Treasury Processing</span>`,
    to: `<span style="font-size:0.72rem; color:#92400E; font-weight:700; text-transform:uppercase;">\${getT('in_treasury_processing', 'In-Treasury Processing')}</span>`
  },
  {
    from: `<span style="font-size:0.72rem; color:#4B5563; font-weight:700; text-transform:uppercase;">Verified Bank Account</span>`,
    to: `<span style="font-size:0.72rem; color:#4B5563; font-weight:700; text-transform:uppercase;">\${getT('col_bank_account', 'Verified Bank Account')}</span>`
  },
  {
    from: `<i class="fas fa-check-circle"></i> Direct DBT Credited`,
    to: `<i class="fas fa-check-circle"></i> \${getT('dbt_credited_badge', 'Direct DBT Credited')}`
  },
  {
    from: `<i class="fas fa-file-invoice"></i> J-Form`,
    to: `<i class="fas fa-file-invoice"></i> \${getT('download_jform', 'J-Form')}`
  }
]);

// 2. Mandi Prices updates
updateFile('public/js/mandi-prices.js', [
  {
    from: `<span><i class="fas fa-location-dot" style="color:#2563EB;"></i> Your Location</span>`,
    to: `<span><i class="fas fa-location-dot" style="color:#2563EB;"></i> \${getT('your_location', 'Your Location')}</span>`
  },
  {
    from: `<span><i class="fas fa-store" style="color:#10B981;"></i> High Price Mandi</span>`,
    to: `<span><i class="fas fa-store" style="color:#10B981;"></i> \${getT('high_price_mandi', 'High Price Mandi')}</span>`
  },
  {
    from: `<span><i class="fas fa-store" style="color:#E06D14;"></i> Standard APMC Mandi</span>`,
    to: `<span><i class="fas fa-store" style="color:#E06D14;"></i> \${getT('standard_mandi', 'Standard APMC Mandi')}</span>`
  },
  {
    from: `placeholder="Search item (e.g. Tomato, Onion)..."`,
    to: `placeholder="\${getT('search_commodity', 'Search item (e.g. Tomato, Onion)...')}"`
  },
  {
    from: `<h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">\n                  Interactive Mandi Geospatial Map\n                </h3>`,
    to: `<h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-navy); margin:0;">\n                  \${getT('interactive_map_title', 'Interactive Mandi Geospatial Map')}\n                </h3>`
  },
  {
    from: `<i class="fas fa-arrow-down-short-wide"></i> Sorted by distance`,
    to: `<i class="fas fa-arrow-down-short-wide"></i> \${getT('sorted_by_distance', 'Sorted by distance')}`
  }
]);

// 3. Queue Portal updates
updateFile('public/js/queue-portal.js', [
  {
    from: `<h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:12px;">No Active Queue Token</h2>`,
    to: `<h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:12px;">\${getT('no_active_queue_token', 'No Active Queue Token')}</h2>`
  },
  {
    from: `<button class="btn btn-primary" onclick="routeTo('#book-slot')"><i class="fas fa-plus"></i> Book Procurement Slot</button>`,
    to: `<button class="btn btn-primary" onclick="routeTo('#book-slot')"><i class="fas fa-plus"></i> \${getT('btn_book_slot', 'Book Procurement Slot')}</button>`
  },
  {
    from: `<button class="btn btn-outline" onclick="routeTo('#my-bookings')"><i class="fas fa-qrcode"></i> View QR Passes</button>`,
    to: `<button class="btn btn-outline" onclick="routeTo('#my-bookings')"><i class="fas fa-qrcode"></i> \${getT('btn_view_qr_passes', 'View QR Passes')}</button>`
  },
  {
    from: `<i class="fas fa-rotate"></i> Refresh`,
    to: `<i class="fas fa-rotate"></i> \${getT('btn_refresh', 'Refresh')}`
  },
  {
    from: 'Assigned to: <span style="color:var(--green-gov);">${queue.counterNumber}</span>',
    to: "${getT('assigned_counter', 'Assigned Counter')}: <span style=\"color:var(--green-gov);\">\${queue.counterNumber}</span>"
  }
]);

// 4. Payment Portal updates
updateFile('public/js/payment-portal.js', [
  {
    from: `<h2 style="color:var(--primary-navy); font-weight:800; margin:0;">Direct Benefit Transfer (DBT) Payouts</h2>`,
    to: `<h2 style="color:var(--primary-navy); font-weight:800; margin:0;">\${getT('dbt_payouts_title', 'Direct Benefit Transfer (DBT) Payouts')}</h2>`
  },
  {
    from: `Track real-time treasury disbursements, test gateway settlements, and download digital tax-exempt vouchers.`,
    to: `\${getT('dbt_payouts_sub', 'Track real-time treasury disbursements, test gateway settlements, and download digital tax-exempt vouchers.')}`
  },
  {
    from: `<i class="fas fa-credit-card"></i> ⚡ Test Razorpay Checkout`,
    to: `<i class="fas fa-credit-card"></i> ⚡ \${getT('btn_test_checkout', 'Test Razorpay Checkout')}`
  },
  {
    from: `<i class="fas fa-circle-exclamation"></i> Raise Payment Grievance`,
    to: `<i class="fas fa-circle-exclamation"></i> \${getT('btn_raise_grievance', 'Raise Payment Grievance')}`
  },
  {
    from: `<div class="metric-title">Total Disbursed (Completed)</div>`,
    to: `<div class="metric-title">\${getT('total_disbursed_completed', 'Total Disbursed (Completed)')}</div>`
  },
  {
    from: `<div class="metric-title">In-Treasury Processing</div>`,
    to: `<div class="metric-title">\${getT('in_treasury_processing', 'In-Treasury Processing')}</div>`
  },
  {
    from: `<div class="metric-title">Completed Vouchers</div>`,
    to: `<div class="metric-title">\${getT('completed_vouchers', 'Completed Vouchers')}</div>`
  },
  {
    from: `<i class="fas fa-receipt"></i> Official Payment Transactions`,
    to: `<i class="fas fa-receipt"></i> \${getT('official_payment_transactions', 'Official Payment Transactions')}`
  },
  {
    from: `<th style="padding:12px 14px;">Voucher No</th>`,
    to: `<th style="padding:12px 14px;">\${getT('col_voucher_no', 'Voucher No')}</th>`
  },
  {
    from: `<th style="padding:12px 14px;">Bank & A/C</th>`,
    to: `<th style="padding:12px 14px;">\${getT('col_bank_ac', 'Bank & A/C')}</th>`
  },
  {
    from: `<th style="padding:12px 14px;">UTR Number</th>`,
    to: `<th style="padding:12px 14px;">\${getT('col_utr_no', 'UTR Number')}</th>`
  },
  {
    from: `<th style="padding:12px 14px;">Amount (₹)</th>`,
    to: `<th style="padding:12px 14px;">\${getT('col_amount_inr', 'Amount (₹)')}</th>`
  },
  {
    from: `<th style="padding:12px 14px;">Status</th>`,
    to: `<th style="padding:12px 14px;">\${getT('col_status', 'Status')}</th>`
  },
  {
    from: `<th style="padding:12px 14px; text-align:right;">Receipt PDF</th>`,
    to: `<th style="padding:12px 14px; text-align:right;">\${getT('col_receipt_pdf', 'Receipt PDF')}</th>`
  }
]);

// 5. Officer Portal updates
updateFile('public/js/officer-portal.js', [
  {
    from: `<div class="sidebar-heading">Officer Console</div>`,
    to: `<div class="sidebar-heading">\${getT('officer_console', 'Officer Console')}</div>`
  },
  {
    from: `<i class="fas fa-desktop"></i> Operations Console`,
    to: `<i class="fas fa-desktop"></i> \${getT('operations_console', 'Operations Console')}`
  },
  {
    from: `<i class="fas fa-qrcode"></i> Gate QR Scanner`,
    to: `<i class="fas fa-qrcode"></i> \${getT('gate_qr_scanner', 'Gate QR Scanner')}`
  },
  {
    from: `<i class="fas fa-list-check"></i> Multi-Counter Queue`,
    to: `<i class="fas fa-list-check"></i> \${getT('multi_counter_queue', 'Multi-Counter Queue')}`
  },
  {
    from: `<i class="fas fa-scale-balanced"></i> Weighbridge & Quality`,
    to: `<i class="fas fa-scale-balanced"></i> \${getT('weighbridge_quality', 'Weighbridge & Quality')}`
  },
  {
    from: `<i class="fas fa-search"></i> Universal Farmer Lookup`,
    to: `<i class="fas fa-search"></i> \${getT('farmer_lookup', 'Universal Farmer Lookup')}`
  },
  {
    from: `<i class="fas fa-bullhorn"></i> Mandi Announcements`,
    to: `<i class="fas fa-bullhorn"></i> \${getT('mandi_announcements', 'Mandi Announcements')}`
  },
  {
    from: `<i class="fas fa-tv"></i> Public Display TV Mode`,
    to: `<i class="fas fa-tv"></i> \${getT('tv_display_mode', 'Public Display TV Mode')}`
  },
  {
    from: `<i class="fas fa-sign-out-alt"></i> Logout`,
    to: `<i class="fas fa-sign-out-alt"></i> \${getT('nav_logout', 'Logout')}`
  },
  {
    from: `<i class="fas fa-qrcode"></i> Scan Pass`,
    to: `<i class="fas fa-qrcode"></i> \${getT('btn_scan_pass', 'Scan Pass')}`
  },
  {
    from: `<i class="fas fa-bullhorn"></i> Call Next Farmer`,
    to: `<i class="fas fa-bullhorn"></i> \${getT('btn_call_next_farmer', 'Call Next Farmer')}`
  },
  {
    from: `<div class="metric-title">Farmers Waiting in Queue</div>`,
    to: `<div class="metric-title">\${getT('farmers_waiting_in_queue', 'Farmers Waiting in Queue')}</div>`
  },
  {
    from: `<div class="metric-title">Procurements Completed Today</div>`,
    to: `<div class="metric-title">\${getT('procurements_completed_today', 'Procurements Completed Today')}</div>`
  }
]);

// 6. Admin Portal updates
updateFile('public/js/admin-portal.js', [
  {
    from: `<div class="sidebar-heading">National Administration</div>`,
    to: `<div class="sidebar-heading">\${getT('national_administration', 'National Administration')}</div>`
  },
  {
    from: `<i class="fas fa-chart-line"></i> National Overview`,
    to: `<i class="fas fa-chart-line"></i> \${getT('national_overview', 'National Overview')}`
  },
  {
    from: `<i class="fas fa-building-wheat"></i> Mandi Centers CRUD`,
    to: `<i class="fas fa-building-wheat"></i> \${getT('mandi_centers_crud', 'Mandi Centers CRUD')}`
  },
  {
    from: `<i class="fas fa-user-shield"></i> Officer Allocations`,
    to: `<i class="fas fa-user-shield"></i> \${getT('officer_allocations', 'Officer Allocations')}`
  },
  {
    from: `<i class="fas fa-user-clock"></i> Pending Officer Approvals`,
    to: `<i class="fas fa-user-clock"></i> \${getT('pending_officer_approvals', 'Pending Officer Approvals')}`
  },
  {
    from: `<i class="fas fa-money-bill-transfer"></i> Bulk DBT Treasury Release`,
    to: `<i class="fas fa-money-bill-transfer"></i> \${getT('bulk_dbt_release', 'Bulk DBT Treasury Release')}`
  },
  {
    from: `<i class="fas fa-database"></i> Database Backup & Restore`,
    to: `<i class="fas fa-database"></i> \${getT('db_backup_restore', 'Database Backup & Restore')}`
  },
  {
    from: `<i class="fas fa-chart-line"></i> Congestion & Demand Predictor`,
    to: `<i class="fas fa-chart-line"></i> \${getT('congestion_predictor', 'Congestion & Demand Predictor')}`
  }
]);

console.log('Finished updating all views!');
