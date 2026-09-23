const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'farmer-portal.js');
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Sidebar Promo
  {
    from: '<div class="sp-promo-title">Digital Mandi 2026</div>',
    to: '<div class="sp-promo-title">${getT(\'digital_mandi_promo\', \'Digital Mandi 2026\')}</div>'
  },
  {
    from: 'Book slots ahead, avoid long queues at procurement centres. Get fair MSP directly in bank.',
    to: '${getT(\'digital_mandi_promo_desc\', \'Book slots ahead, avoid long queues at procurement centres. Get fair MSP directly in bank.\')}'
  },
  {
    from: '<button class="sp-promo-btn" onclick="openSihInfoModal()">Learn More</button>',
    to: '<button class="sp-promo-btn" onclick="openSihInfoModal()">${getT(\'btn_learn_more\', \'Learn More\')}</button>'
  },

  // Hero Banner
  {
    from: `<h1 class="sp-hero-title">\n              Smart Agricultural Procurement System\n            </h1>`,
    to: `<h1 class="sp-hero-title">\n              \${getT('hero_system_title', 'Smart Agricultural Procurement System')}\n            </h1>`
  },
  {
    from: `Find the best procurement centre, book your slot, track your queue and monitor your payment — all from one platform.`,
    to: `\${getT('hero_system_sub', 'Find the best procurement centre, book your slot, track your queue and monitor your payment — all from one platform.')}`
  },
  {
    from: `<i class="fas fa-wand-magic-sparkles"></i> 🌾 Find Best Mandi`,
    to: `<i class="fas fa-wand-magic-sparkles"></i> 🌾 \${getT('finder_title', 'Find Best Mandi')}`
  },
  {
    from: `<i class="fas fa-users-line"></i> Track Procurement`,
    to: `<i class="fas fa-users-line"></i> \${getT('btn_track_procurement', 'Track Procurement')}`
  },
  {
    from: `<div class="sp-floating-stat-label">On-time Procurement</div>`,
    to: `<div class="sp-floating-stat-label">\${getT('hero_ontime_procurement', 'On-time Procurement')}</div>`
  },
  {
    from: `<div class="sp-floating-stat-label">Mandis Connected</div>`,
    to: `<div class="sp-floating-stat-label">\${getT('hero_mandis_connected', 'Mandis Connected')}</div>`
  },
  {
    from: `<div class="sp-floating-stat-label">Direct Bank Transfer</div>`,
    to: `<div class="sp-floating-stat-label">\${getT('hero_dbt_disbursal', 'Direct Bank Transfer')}</div>`
  },

  // 5 Stat Cards
  {
    from: `<div class="sp-stat-label">Active Bookings</div>`,
    to: `<div class="sp-stat-label">\${getT('stat_active_bookings', 'Active Bookings')}</div>`
  },
  {
    from: `<div class="sp-stat-change">+12% this week</div>`,
    to: `<div class="sp-stat-change">\${getT('stat_this_week', '+12% this week')}</div>`
  },
  {
    from: `<div class="sp-stat-label">Mandis Nearby</div>`,
    to: `<div class="sp-stat-label">\${getT('stat_mandis_nearby', 'Mandis Nearby')}</div>`
  },
  {
    from: `<div class="sp-stat-change" style="color:#2563EB;">Within 50 km</div>`,
    to: `<div class="sp-stat-change" style="color:#2563EB;">\${getT('stat_within_50km', 'Within 50 km')}</div>`
  },
  {
    from: `<div class="sp-stat-label">Current Stock</div>`,
    to: `<div class="sp-stat-label">\${getT('stat_current_stock', 'Current Stock')}</div>`
  },
  {
    from: `<div class="sp-stat-change" style="color:#EA580C;">Wheat & Mustard</div>`,
    to: `<div class="sp-stat-change" style="color:#EA580C;">\${getT('stat_wheat_mustard', 'Wheat & Mustard')}</div>`
  },
  {
    from: `<div class="sp-stat-label">On-time Arrival</div>`,
    to: `<div class="sp-stat-label">\${getT('stat_ontime_arrival', 'On-time Arrival')}</div>`
  },
  {
    from: `<div class="sp-stat-change" style="color:#9333EA;">High reliability</div>`,
    to: `<div class="sp-stat-change" style="color:#9333EA;">\${getT('stat_high_reliability', 'High reliability')}</div>`
  },
  {
    from: `<div class="sp-stat-label">Total Earnings</div>`,
    to: `<div class="sp-stat-label">\${getT('stat_total_earnings', 'Total Earnings')}</div>`
  },
  {
    from: `<div class="sp-stat-change">This season</div>`,
    to: `<div class="sp-stat-change">\${getT('stat_this_season', 'This season')}</div>`
  },

  // Finder Card
  {
    from: `<div class="sp-finder-title">Find Best Mandi</div>`,
    to: `<div class="sp-finder-title">\${getT('finder_title', 'Find Best Mandi')}</div>`
  },
  {
    from: `<div class="sp-finder-sub">AI-powered optimal mandi locator with live transit & queue tracking</div>`,
    to: `<div class="sp-finder-sub">\${getT('finder_sub', 'AI-powered optimal mandi locator with live transit & queue tracking')}</div>`
  },
  {
    from: `<span class="sp-pulse-dot"></span> Live Rates`,
    to: `<span class="sp-pulse-dot"></span> \${getT('live_rates', 'Live Rates')}`
  },
  {
    from: `<label><i class="fas fa-location-dot" style="color:#0D5C3A;"></i> Your Location</label>`,
    to: `<label><i class="fas fa-location-dot" style="color:#0D5C3A;"></i> \${getT('your_location', 'Your Location')}</label>`
  },
  {
    from: `<span class="sp-change-link" onclick="openLocationPickerModal()">Change</span>`,
    to: `<span class="sp-change-link" onclick="openLocationPickerModal()">\${getT('btn_change', 'Change')}</span>`
  },
  {
    from: `<label><i class="fas fa-seedling" style="color:#0D5C3A;"></i> Crop Type</label>`,
    to: `<label><i class="fas fa-seedling" style="color:#0D5C3A;"></i> \${getT('crop_type', 'Crop Type')}</label>`
  },
  {
    from: `<label><i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> Quantity (qtl)</label>`,
    to: `<label><i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> \${getT('quantity_qtl', 'Quantity (qtl)')}</label>`
  },
  {
    from: `<label><i class="fas fa-calendar-day" style="color:#0D5C3A;"></i> Preferred Date</label>`,
    to: `<label><i class="fas fa-calendar-day" style="color:#0D5C3A;"></i> \${getT('preferred_date', 'Preferred Date')}</label>`
  },

  // Recommended Procurement Centres
  {
    from: `<div class="sp-recommend-title">\n                <i class="fas fa-bullseye" style="color:#0D5C3A;"></i> Recommended Procurement Centres\n              </div>`,
    to: `<div class="sp-recommend-title">\n                <i class="fas fa-bullseye" style="color:#0D5C3A;"></i> \${getT('recommended_centres', 'Recommended Procurement Centres')}\n              </div>`
  },
  {
    from: `View All Mandis <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('view_all_mandis', 'View All Mandis')} <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<div style="font-weight:700; color:#111827; font-size:0.95rem;">Finding best procurement centres...</div>`,
    to: `<div style="font-weight:700; color:#111827; font-size:0.95rem;">\${getT('finding_best_centres', 'Finding best procurement centres...')}</div>`
  },
  {
    from: `<div style="font-size:0.78rem; color:#6B7280; margin-top:3px;">Matching location, live mandi rates & weather transit delays</div>`,
    to: `<div style="font-size:0.78rem; color:#6B7280; margin-top:3px;">\${getT('finding_best_sub', 'Matching location, live mandi rates & weather transit delays')}</div>`
  },
  {
    from: `<div><strong>Why these centres?</strong></div>`,
    to: `<div><strong>\${getT('why_these_centres', 'Why these centres?')}</strong></div>`
  },
  {
    from: `<div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> Best net price after transit</div>`,
    to: `<div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> \${getT('why_best_price', 'Best net price after transit')}</div>`
  },
  {
    from: `<div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> Lowest yard waiting time</div>`,
    to: `<div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> \${getT('why_lowest_wait', 'Lowest yard waiting time')}</div>`
  },
  {
    from: `<div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> Fair grading guarantee</div>`,
    to: `<div class="sp-callout-item"><i class="fas fa-check-circle" style="color:#16A34A;"></i> \${getT('why_fair_grading', 'Fair grading guarantee')}</div>`
  },

  // Active Booking
  {
    from: `Active Booking &amp; Token Pass`,
    to: `\${getT('active_booking_token', 'Active Booking & Token Pass')}`
  },
  {
    from: `View Digital Pass &gt;`,
    to: `\${getT('view_digital_pass', 'View Digital Pass')} &gt;`
  },
  {
    from: `<span style="font-size:0.75rem; color:#6B7280; display:block;">Gate Entry Pass Ready</span>`,
    to: `<span style="font-size:0.75rem; color:#6B7280; display:block;">\${getT('pass_ready', 'Gate Entry Pass Ready')}</span>`
  },

  // MSP Table
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Live MSP Rates &amp; Market Intelligence</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('live_msp_rates', 'Live MSP Rates & Market Intelligence')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Official Government declared MSP floor prices vs active wholesale arrivals</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('live_msp_sub', 'Official Government declared MSP floor prices vs active wholesale arrivals')}</span>`
  },
  {
    from: `View All Prices <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('view_all_prices', 'View All Prices')} <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<th style="padding:10px 8px;">Commodity</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_commodity', 'Commodity')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">FAQ Grade</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_faq_grade', 'FAQ Grade')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">MSP Rate</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_msp_rate', 'MSP Rate')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Modal Mandi Rate</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_modal_rate', 'Modal Mandi Rate')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Difference</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_difference', 'Difference')}</th>`
  },
  {
    from: `<th style="padding:10px 8px; text-align:right;">Arrival Status</th>`,
    to: `<th style="padding:10px 8px; text-align:right;">\${getT('col_arrival_status', 'Arrival Status')}</th>`
  },
  {
    from: `<span class="sp-tag-badge sp-tag-green">Heavy Intake</span>`,
    to: `<span class="sp-tag-badge sp-tag-green">\${getT('badge_heavy_intake', 'Heavy Intake')}</span>`
  },
  {
    from: `<span class="sp-tag-badge sp-tag-blue">Normal Intake</span>`,
    to: `<span class="sp-tag-badge sp-tag-blue">\${getT('badge_normal_intake', 'Normal Intake')}</span>`
  },
  {
    from: `<span class="sp-tag-badge sp-tag-green">High Demand</span>`,
    to: `<span class="sp-tag-badge sp-tag-green">\${getT('badge_high_demand', 'High Demand')}</span>`
  },
  {
    from: `<span class="sp-tag-badge sp-tag-orange">Moderate</span>`,
    to: `<span class="sp-tag-badge sp-tag-orange">\${getT('badge_moderate', 'Moderate')}</span>`
  },
  {
    from: `<span class="sp-tag-badge sp-tag-green">Active Mandi</span>`,
    to: `<span class="sp-tag-badge sp-tag-green">\${getT('badge_active_mandi', 'Active Mandi')}</span>`
  },

  // Quick Actions
  {
    from: `<strong style="font-size:0.88rem; color:#111827; display:block;">Book Preferred Slot</strong>`,
    to: `<strong style="font-size:0.88rem; color:#111827; display:block;">\${getT('btn_book_preferred_slot', 'Book Preferred Slot')}</strong>`
  },
  {
    from: `<span style="font-size:0.75rem; color:#6B7280;">Pre-reserve mandi arrival</span>`,
    to: `<span style="font-size:0.75rem; color:#6B7280;">\${getT('sub_pre_reserve', 'Pre-reserve mandi arrival')}</span>`
  },
  {
    from: `<strong style="font-size:0.88rem; color:#111827; display:block;">Live Queue Position</strong>`,
    to: `<strong style="font-size:0.88rem; color:#111827; display:block;">\${getT('btn_live_queue_pos', 'Live Queue Position')}</strong>`
  },
  {
    from: `<span style="font-size:0.75rem; color:#6B7280;">Real-time token caller</span>`,
    to: `<span style="font-size:0.75rem; color:#6B7280;">\${getT('sub_realtime_token', 'Real-time token caller')}</span>`
  },
  {
    from: `<strong style="font-size:0.88rem; color:#111827; display:block;">DBT Payment Ledger</strong>`,
    to: `<strong style="font-size:0.88rem; color:#111827; display:block;">\${getT('btn_dbt_ledger', 'DBT Payment Ledger')}</strong>`
  },
  {
    from: `<span style="font-size:0.75rem; color:#6B7280;">Direct bank transfer status</span>`,
    to: `<span style="font-size:0.75rem; color:#6B7280;">\${getT('sub_dbt_status', 'Direct bank transfer status')}</span>`
  },
  {
    from: `<strong style="font-size:0.88rem; color:#111827; display:block;">Kisan Helpline</strong>`,
    to: `<strong style="font-size:0.88rem; color:#111827; display:block;">\${getT('btn_kisan_helpline', 'Kisan Helpline')}</strong>`
  },
  {
    from: `<span style="font-size:0.75rem; color:#6B7280;">Toll-Free 1800-180-1551</span>`,
    to: `<span style="font-size:0.75rem; color:#6B7280;">\${getT('sub_toll_free', 'Toll-Free 1800-180-1551')}</span>`
  },

  // Recent Bookings Table
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Recent Slot Bookings &amp; Digital Passes</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('recent_bookings_title', 'Recent Slot Bookings & Digital Passes')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Confirmed mandi arrivals, electronic token caller and gate check-in passes</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('recent_bookings_sub', 'Confirmed mandi arrivals, electronic token caller and gate check-in passes')}</span>`
  },
  {
    from: `View All Bookings (\${recentBookings.length}) <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('view_all_bookings', 'View All Bookings')} (\${recentBookings.length}) <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<th style="padding:10px 8px;">Pass / Token</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_pass_token', 'Pass / Token')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Procurement Mandi</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_mandi', 'Procurement Mandi')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Date &amp; Slot</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_date_slot', 'Date & Slot')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Crop &amp; Qty</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_crop_qty', 'Crop & Qty')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Status</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_status', 'Status')}</th>`
  },
  {
    from: `<th style="padding:10px 8px; text-align:right;">Action</th>`,
    to: `<th style="padding:10px 8px; text-align:right;">\${getT('col_action', 'Action')}</th>`
  },

  // Recent Payments Table
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Direct Bank Transfer (DBT) Payment Settlements</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('recent_dbt_title', 'Direct Bank Transfer (DBT) Payment Settlements')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Government treasury payments transferred directly to your bank account</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('recent_dbt_sub', 'Government treasury payments transferred directly to your bank account')}</span>`
  },
  {
    from: `View All Payments (\${recentPayments.length}) <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('view_all_payments', 'View All Payments')} (\${recentPayments.length}) <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<th style="padding:10px 8px;">Transaction ID / UTR</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_txn_utr', 'Transaction ID / UTR')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Crop Intake</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_crop_intake', 'Crop Intake')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">MSP Payout</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_msp_payout', 'MSP Payout')}</th>`
  },
  {
    from: `<th style="padding:10px 8px;">Credited Bank Account</th>`,
    to: `<th style="padding:10px 8px;">\${getT('col_bank_account', 'Credited Bank Account')}</th>`
  },
  {
    from: `<th style="padding:10px 8px; text-align:right;">DBT Status</th>`,
    to: `<th style="padding:10px 8px; text-align:right;">\${getT('col_dbt_status', 'DBT Status')}</th>`
  },

  // Land Records Section
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Land Record &amp; Crop Inward Declaration (Khasra 7/12)</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('land_record_title', 'Land Record & Crop Inward Declaration (Khasra 7/12)')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Government verified cadastral parcel records and central procurement quota</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('land_record_sub', 'Government verified cadastral parcel records and central procurement quota')}</span>`
  },
  {
    from: `Manage Land Records <i class="fas fa-arrow-right"></i>`,
    to: `\${getT('manage_land_records', 'Manage Land Records')} <i class="fas fa-arrow-right"></i>`
  },
  {
    from: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">Survey / Gat Number</span>`,
    to: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">\${getT('lbl_survey_no', 'Survey / Gat Number')}</span>`
  },
  {
    from: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">Total Cultivated Area</span>`,
    to: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">\${getT('lbl_cultivated_area', 'Total Cultivated Area')}</span>`
  },
  {
    from: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">Declared Sown Crop</span>`,
    to: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">\${getT('lbl_sown_crop', 'Declared Sown Crop')}</span>`
  },
  {
    from: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">KYC &amp; Verification</span>`,
    to: `<span style="font-size:0.72rem; color:#6B7280; font-weight:700; text-transform:uppercase;">\${getT('lbl_kyc_verification', 'KYC & Verification')}</span>`
  },
  {
    from: `<i class="fas fa-shield-check"></i> 100% Approved`,
    to: `<i class="fas fa-shield-check"></i> \${getT('badge_approved', '100% Approved')}`
  },
  {
    from: `<span style="font-size:0.72rem; color:#0D5C3A;">Aadhaar &amp; Bank Verified</span>`,
    to: `<span style="font-size:0.72rem; color:#0D5C3A;">\${getT('badge_aadhaar_verified', 'Aadhaar & Bank Verified')}</span>`
  },
  {
    from: `Official 7/12 Land Record Extract on file (Uploaded: <strong>Verified</strong>)`,
    to: `\${getT('official_record_verified', 'Official 7/12 Land Record Extract on file (Uploaded: Verified)')}`
  },
  {
    from: `<i class="fas fa-plus"></i> Declare Additional Crop`,
    to: `<i class="fas fa-plus"></i> \${getT('btn_declare_crop', 'Declare Additional Crop')}`
  },
  {
    from: `<i class="fas fa-calendar-plus"></i> Book Delivery Slot`,
    to: `<i class="fas fa-calendar-plus"></i> \${getT('btn_book_delivery_slot', 'Book Delivery Slot')}`
  },

  // Kisan AI Advisory
  {
    from: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">Kisan AI Advisory &bull; Moisture &amp; Mandi Transit Guide</h4>`,
    to: `<h4 style="font-size:1.15rem; font-weight:800; color:#111827; margin:0;">\${getT('kisan_ai_advisory', 'Kisan AI Advisory • Moisture & Mandi Transit Guide')}</h4>`
  },
  {
    from: `<span style="font-size:0.78rem; color:#6B7280;">Automated algorithmic recommendations based on live weather and mandi terminal influx</span>`,
    to: `<span style="font-size:0.78rem; color:#6B7280;">\${getT('kisan_ai_sub', 'Automated algorithmic recommendations based on live weather and mandi terminal influx')}</span>`
  },
  {
    from: `<span class="sp-pulse-dot"></span> Active Advisory`,
    to: `<span class="sp-pulse-dot"></span> \${getT('badge_active_advisory', 'Active Advisory')}`
  },
  {
    from: `<i class="fas fa-droplet" style="color:#16A34A;"></i> Moisture Management`,
    to: `<i class="fas fa-droplet" style="color:#16A34A;"></i> \${getT('adv_moisture_title', 'Moisture Management')}`
  },
  {
    from: `<i class="fas fa-truck-ramp-box" style="color:#2563EB;"></i> Dedicated Fast-Track Lane`,
    to: `<i class="fas fa-truck-ramp-box" style="color:#2563EB;"></i> \${getT('adv_fastlane_title', 'Dedicated Fast-Track Lane')}`
  },
  {
    from: `<i class="fas fa-scale-balanced" style="color:#D97706;"></i> 100% Minimum Support Price`,
    to: `<i class="fas fa-scale-balanced" style="color:#D97706;"></i> \${getT('adv_msp_title', '100% Minimum Support Price')}`
  },

  // Right Column Timeline
  {
    from: `<div class="sp-widget-title">\n                  <i class="fas fa-route" style="color:#0D5C3A;"></i> Your Procurement Journey\n                </div>`,
    to: `<div class="sp-widget-title">\n                  <i class="fas fa-route" style="color:#0D5C3A;"></i> \${getT('procurement_journey_title', 'Your Procurement Journey')}\n                </div>`
  },
  {
    from: `<span class="sp-step-name">1. Centre Selection</span>`,
    to: `<span class="sp-step-name">\${getT('step_centre_selection', '1. Centre Selection')}</span>`
  },
  {
    from: `<span class="sp-step-name">2. Slot Booking</span>`,
    to: `<span class="sp-step-name">\${getT('step_slot_booking', '2. Slot Booking')}</span>`
  },
  {
    from: `<span class="sp-step-name">3. Digital QR Pass</span>`,
    to: `<span class="sp-step-name">\${getT('step_digital_pass', '3. Digital QR Pass')}</span>`
  },
  {
    from: `<span class="sp-step-name">4. Gate Entry</span>`,
    to: `<span class="sp-step-name">\${getT('step_gate_entry', '4. Gate Entry')}</span>`
  },
  {
    from: `<span class="sp-step-name">5. Quality Testing</span>`,
    to: `<span class="sp-step-name">\${getT('step_quality_testing', '5. Quality Testing')}</span>`
  },
  {
    from: `<span class="sp-step-name">6. Weighment</span>`,
    to: `<span class="sp-step-name">\${getT('step_weighment', '6. Weighment')}</span>`
  },
  {
    from: `<span class="sp-step-name">7. J-Form Receipt</span>`,
    to: `<span class="sp-step-name">\${getT('step_jform_receipt', '7. J-Form Receipt')}</span>`
  },
  {
    from: `<span class="sp-step-name">8. DBT Payment</span>`,
    to: `<span class="sp-step-name">\${getT('step_dbt_payment', '8. DBT Payment')}</span>`
  },

  // Weather Widget
  {
    from: `<div class="sp-widget-title">\n                  <i class="fas fa-location-dot" style="color:#0D5C3A;"></i> Weather - Vidisha\n                </div>`,
    to: `<div class="sp-widget-title">\n                  <i class="fas fa-location-dot" style="color:#0D5C3A;"></i> \${getT('weather_widget_title', 'Weather - Vidisha')}\n                </div>`
  },
  {
    from: `Clear &amp; Sunny`,
    to: `\${getT('weather_clear_sunny', 'Clear & Sunny')}`
  },
  {
    from: `Ideal transit conditions`,
    to: `\${getT('weather_ideal', 'Ideal transit conditions')}`
  },
  {
    from: `<span class="sp-forecast-name">Today</span>`,
    to: `<span class="sp-forecast-name">\${getT('forecast_today', 'Today')}</span>`
  },
  {
    from: `<span class="sp-forecast-name">Tue</span>`,
    to: `<span class="sp-forecast-name">\${getT('forecast_tue', 'Tue')}</span>`
  },
  {
    from: `<span class="sp-forecast-name">Wed</span>`,
    to: `<span class="sp-forecast-name">\${getT('forecast_wed', 'Wed')}</span>`
  },
  {
    from: `<span class="sp-forecast-name">Thu</span>`,
    to: `<span class="sp-forecast-name">\${getT('forecast_thu', 'Thu')}</span>`
  },
  {
    from: `<span class="sp-forecast-name">Fri</span>`,
    to: `<span class="sp-forecast-name">\${getT('forecast_fri', 'Fri')}</span>`
  },

  // Nearby Mandis Widget
  {
    from: `<div class="sp-widget-title">\n                  <i class="fas fa-map-marked-alt" style="color:#0D5C3A;"></i> Nearby Mandis\n                </div>`,
    to: `<div class="sp-widget-title">\n                  <i class="fas fa-map-marked-alt" style="color:#0D5C3A;"></i> \${getT('nearby_mandis_title', 'Nearby Mandis')}\n                </div>`
  },
  {
    from: `View on Map &gt;`,
    to: `\${getT('view_on_map', 'View on Map')} &gt;`
  },

  // Notifications Widget
  {
    from: `<div class="sp-widget-title">\n                  <i class="far fa-bell" style="color:#0D5C3A;"></i> Notifications\n                </div>`,
    to: `<div class="sp-widget-title">\n                  <i class="far fa-bell" style="color:#0D5C3A;"></i> \${getT('notifications_title', 'Notifications')}\n                </div>`
  },

  // Mandi Operations Widget
  {
    from: `<div class="sp-widget-title">\n                  <i class="fas fa-headset" style="color:#0D5C3A;"></i> Mandi Operations &amp; Support\n                </div>`,
    to: `<div class="sp-widget-title">\n                  <i class="fas fa-headset" style="color:#0D5C3A;"></i> \${getT('mandi_ops_title', 'Mandi Operations & Support')}\n                </div>`
  },
  {
    from: `<span class="sp-pulse-dot"></span> Live Helpdesk`,
    to: `<span class="sp-pulse-dot"></span> \${getT('live_helpdesk', 'Live Helpdesk')}`
  },
  {
    from: `Yard Operating Hours`,
    to: `\${getT('operating_hours', 'Yard Operating Hours')}`
  },
  {
    from: `Weighbridges Operational`,
    to: `\${getT('weighbridges_active', 'Weighbridges Operational')}`
  },
  {
    from: `Moisture Testing Lab`,
    to: `\${getT('testing_lab', 'Moisture Testing Lab')}`
  },
  {
    from: `Kisan Call Centre (Toll-Free)`,
    to: `\${getT('kisan_call_centre', 'Kisan Call Centre (Toll-Free)')}`
  },
  {
    from: `Mandi Support &amp; Grievances`,
    to: `\${getT('support_grievances', 'Mandi Support & Grievances')}`
  },

  // Quality Guide Widget
  {
    from: `<div class="sp-widget-title">\n                  <i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> Fair Assay &amp; Quality Guide\n                </div>`,
    to: `<div class="sp-widget-title">\n                  <i class="fas fa-scale-balanced" style="color:#0D5C3A;"></i> \${getT('fair_assay_guide', 'Fair Assay & Quality Guide')}\n                </div>`
  },
  {
    from: `Meet Central Government Fair Average Quality (FAQ) benchmarks to avoid deductions:`,
    to: `\${getT('faq_benchmarks', 'Meet Central Government Fair Average Quality (FAQ) benchmarks to avoid deductions:')}`
  },
  {
    from: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">Max Moisture</div>`,
    to: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">\${getT('max_moisture', 'Max Moisture')}</div>`
  },
  {
    from: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">Foreign Matter</div>`,
    to: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">\${getT('foreign_matter', 'Foreign Matter')}</div>`
  },
  {
    from: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">Damaged Grains</div>`,
    to: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">\${getT('damaged_grains', 'Damaged Grains')}</div>`
  },
  {
    from: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">Sound Grains</div>`,
    to: `<div style="font-size:0.7rem; color:#6B7280; font-weight:600;">\${getT('sound_grains', 'Sound Grains')}</div>`
  },
  {
    from: `Bring Aadhaar card &amp; Khasra copy for instant gate entry.`,
    to: `\${getT('bring_documents', 'Bring Aadhaar card & Khasra copy for instant gate entry.')}`
  },

  // Assurance Banner
  {
    from: `<div class="sp-advisory-title">National Agricultural Procurement Assurance &amp; Fair Weighment Guarantee</div>`,
    to: `<div class="sp-advisory-title">\${getT('national_assurance_title', 'National Agricultural Procurement Assurance & Fair Weighment Guarantee')}</div>`
  },
  {
    from: `<div class="sp-advisory-desc">\n              All procurement centres operate certified electronic weighbridges calibrated per Legal Metrology Standards. Assayed moisture readings and gross/tare weighments are cryptographically stamped into your digital J-Form receipt and transmitted instantly to the DBT Public Financial Management System (PFMS).\n            </div>`,
    to: `<div class="sp-advisory-desc">\n              \${getT('national_assurance_desc', 'All procurement centres operate certified electronic weighbridges calibrated per Legal Metrology Standards. Assayed moisture readings and gross/tare weighments are cryptographically stamped into your digital J-Form receipt and transmitted instantly to the DBT Public Financial Management System (PFMS).')}\n            </div>`
  },
  {
    from: `<span class="sp-adv-badge"><i class="fas fa-certificate"></i> ISO 9001 Certified</span>`,
    to: `<span class="sp-adv-badge"><i class="fas fa-certificate"></i> \${getT('iso_certified', 'ISO 9001 Certified')}</span>`
  },
  {
    from: `<span class="sp-adv-badge"><i class="fas fa-lock"></i> SHA-256 Tamper-Proof</span>`,
    to: `<span class="sp-adv-badge"><i class="fas fa-lock"></i> \${getT('tamper_proof', 'SHA-256 Tamper-Proof')}</span>`
  },

  // Footer Band
  {
    from: `Empowering India's Farmers Through Smart Procurement`,
    to: `\${getT('footer_empower_title', "Empowering India's Farmers Through Smart Procurement")}`
  },
  {
    from: `<div class="sp-pillar-label">Fair MSP Pricing</div>`,
    to: `<div class="sp-pillar-label">\${getT('pillar_fair_msp', 'Fair MSP Pricing')}</div>`
  },
  {
    from: `<div class="sp-pillar-label">Zero Queue Delays</div>`,
    to: `<div class="sp-pillar-label">\${getT('pillar_zero_queue', 'Zero Queue Delays')}</div>`
  },
  {
    from: `<div class="sp-pillar-label">Instant DBT Transfer</div>`,
    to: `<div class="sp-pillar-label">\${getT('pillar_instant_dbt', 'Instant DBT Transfer')}</div>`
  },
  {
    from: `<div class="sp-pillar-label">24/7 Farmer Support</div>`,
    to: `<div class="sp-pillar-label">\${getT('pillar_support', '24/7 Farmer Support')}</div>`
  }
];

let replacedCount = 0;
for (const r of replacements) {
  if (code.includes(r.from)) {
    code = code.replace(r.from, r.to);
    replacedCount++;
  } else {
    console.warn('Could not find match for:', r.from.substring(0, 40));
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log(`Successfully replaced ${replacedCount} / ${replacements.length} strings in farmer-portal.js!`);
