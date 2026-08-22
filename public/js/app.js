// Central SPA Router & Application Controller

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('kpms_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-info-circle');
  toast.innerHTML = `
    <i class="fas ${icon}" style="font-size:1.2rem;"></i>
    <div style="flex:1; font-size:0.9rem; font-weight:600;">${message}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('kpms_theme', next);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
};

const openLoginModal = (presetRole = 'farmer') => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = getT('login_title');

  let defaultId = '9876543210';
  let defaultPass = 'Kisan@123';
  if (presetRole === 'officer') {
    defaultId = 'officer@kpms.gov.in';
    defaultPass = 'Officer@123';
  } else if (presetRole === 'admin') {
    defaultId = 'admin@kpms.gov.in';
    defaultPass = 'Admin@123';
  }

  body.innerHTML = `
    <div>
      <!-- Role Selection Tabs -->
      <div style="display:flex; gap:6px; margin-bottom:16px; background:var(--bg-main); padding:4px; border-radius:8px;">
        <button type="button" class="btn btn-sm ${presetRole === 'farmer' ? 'btn-primary' : 'btn-outline'}" style="flex:1; font-size:0.8rem; padding:8px 4px; justify-content:center;" onclick="openLoginModal('farmer')">👨‍🌾 ${getT('btn_farmer_login')}</button>
        <button type="button" class="btn btn-sm ${presetRole === 'officer' ? 'btn-primary' : 'btn-outline'}" style="flex:1; font-size:0.8rem; padding:8px 4px; justify-content:center;" onclick="openLoginModal('officer')">👮 ${getT('btn_officer_login')}</button>
        <button type="button" class="btn btn-sm ${presetRole === 'admin' ? 'btn-primary' : 'btn-outline'}" style="flex:1; font-size:0.8rem; padding:8px 4px; justify-content:center;" onclick="openLoginModal('admin')">🏛️ ${getT('btn_admin_login')}</button>
      </div>

      <form onsubmit="handleLoginForm(event)">
        <div class="form-group">
          <label class="form-label"><i class="fas fa-user"></i> ${getT('login_identifier')}</label>
          <input id="login-identifier" type="text" name="identifier" class="form-control" value="${defaultId}" placeholder="e.g. 9876543210, officer@kpms.gov.in, admin" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fas fa-lock"></i> ${getT('login_password')}</label>
          <input id="login-password" type="password" name="password" class="form-control" value="${defaultPass}" placeholder="Enter password" required autocomplete="current-password" />
        </div>
        <input type="hidden" name="role" value="${presetRole}" />
        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; margin-top:8px;"><i class="fas fa-right-to-bracket"></i> ${getT('login_btn')}</button>
      </form>

      <!-- Instant 1-Click Demo Login Bar -->
      <div style="margin-top:16px; padding:12px; background:var(--bg-main); border-radius:8px; border:1px dashed var(--border-color); font-size:0.82rem;">
        <div style="font-weight:700; color:var(--primary-navy); margin-bottom:8px;"><i class="fas fa-bolt" style="color:var(--saffron);"></i> 1-Click Instant Demo Login:</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="demoLogin('farmer')">👨‍🌾 Farmer (Ramesh)</button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="demoLogin('officer')">👮 Officer (Vikram)</button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="demoLogin('admin')">🏛️ Admin (Rajesh)</button>
        </div>
      </div>

      <div style="text-align:center; margin-top:16px; font-size:0.88rem;">
        <a onclick="closeModal(); openRegisterModal();" style="color:var(--saffron); cursor:pointer; font-weight:700;">${getT('login_new_farmer')}</a>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

const openRegisterModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = getT('register_title');
  regCurrentStep = 1;

  body.innerHTML = `
    <div>
      <!-- Step Indicators -->
      <div class="wizard-steps">
        <div class="step-item active"><div class="step-circle">1</div><div class="step-title">${getT('reg_step1')}</div></div>
        <div class="step-item"><div class="step-circle">2</div><div class="step-title">${getT('reg_step2')}</div></div>
        <div class="step-item"><div class="step-circle">3</div><div class="step-title">${getT('reg_step3')}</div></div>
        <div class="step-item"><div class="step-circle">4</div><div class="step-title">${getT('reg_step4')}</div></div>
        <div class="step-item"><div class="step-circle">5</div><div class="step-title">${getT('reg_step5')}</div></div>
      </div>

      <!-- Step 1: Personal -->
      <div id="reg-step-1" class="reg-step-container">
        <h4 style="color:var(--primary-navy); margin-bottom:12px;">Step 1: Personal & Security Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group"><label class="form-label">Full Name *</label><input type="text" name="fullName" class="form-control" value="Ramdas Solanki" required /></div>
          <div class="form-group"><label class="form-label">Father's Name *</label><input type="text" name="fatherName" class="form-control" value="Gokul Solanki" required /></div>
          <div class="form-group"><label class="form-label">Mobile Number *</label><input type="tel" name="mobile" class="form-control" maxlength="10" value="9823456789" required /></div>
          <div class="form-group"><label class="form-label">Email (Optional)</label><input type="email" name="email" class="form-control" value="ramdas@farmer.in" /></div>
          <div class="form-group"><label class="form-label">Password *</label><input type="password" name="password" class="form-control" value="Farmer@123" required /></div>
          <div class="form-group"><label class="form-label">Gender</label><select name="gender" class="form-control"><option value="Male">Male</option><option value="Female">Female</option></select></div>
        </div>
        <div style="text-align:right; margin-top:12px;"><button type="button" class="btn btn-primary" onclick="nextRegStep(2)">${getT('btn_next_step')} <i class="fas fa-arrow-right"></i></button></div>
      </div>

      <!-- Step 2: Location -->
      <div id="reg-step-2" class="reg-step-container" style="display:none;">
        <h4 style="color:var(--primary-navy); margin-bottom:12px;">Step 2: Aadhaar & Residential Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group"><label class="form-label">Aadhaar Card Number *</label><input type="text" name="aadhaarNumber" class="form-control" maxlength="12" value="482910482918" required /></div>
          <div class="form-group"><label class="form-label">State *</label><input type="text" name="state" class="form-control" value="Madhya Pradesh" required /></div>
          <div class="form-group"><label class="form-label">District *</label><input type="text" name="district" class="form-control" value="Bhopal" required /></div>
          <div class="form-group"><label class="form-label">Village / Town *</label><input type="text" name="village" class="form-control" value="Ratibad" required /></div>
          <div class="form-group"><label class="form-label">PIN Code *</label><input type="text" name="pinCode" class="form-control" maxlength="6" value="462044" required /></div>
          <div class="form-group"><label class="form-label">Full Address</label><input type="text" name="address" class="form-control" value="House 8, Kisan Mohalla, Ratibad" /></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px;">
          <button type="button" class="btn btn-outline" onclick="nextRegStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="nextRegStep(3)">Next: Bank Details <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>

      <!-- Step 3: Bank -->
      <div id="reg-step-3" class="reg-step-container" style="display:none;">
        <h4 style="color:var(--primary-navy); margin-bottom:12px;">Step 3: Direct Benefit Transfer (DBT) Bank Account</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group"><label class="form-label">Bank Name *</label><input type="text" name="bankName" class="form-control" value="State Bank of India" required /></div>
          <div class="form-group"><label class="form-label">Branch Name</label><input type="text" name="branch" class="form-control" value="Bhopal Main" /></div>
          <div class="form-group"><label class="form-label">IFSC Code *</label><input type="text" name="ifscCode" class="form-control" value="SBIN0001234" required /></div>
          <div class="form-group"><label class="form-label">Account Number *</label><input type="text" name="accountNumber" class="form-control" value="39482910482" required /></div>
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Account Holder Name *</label><input type="text" name="accountHolderName" class="form-control" value="Ramdas Solanki" required /></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px;">
          <button type="button" class="btn btn-outline" onclick="nextRegStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="nextRegStep(4)">Next: Land & Crops <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>

      <!-- Step 4: Land & Crop -->
      <div id="reg-step-4" class="reg-step-container" style="display:none;">
        <h4 style="color:var(--primary-navy); margin-bottom:12px;">Step 4: Land Record & Crop Declaration</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group"><label class="form-label">Total Land Area (Acres) *</label><input type="number" name="totalLandArea" class="form-control" step="0.1" value="7.5" required /></div>
          <div class="form-group"><label class="form-label">Ownership Type</label><select name="landOwnershipType" class="form-control"><option value="Owned">Owned (7/12)</option><option value="Leased">Leased / Shared</option></select></div>
          <div class="form-group"><label class="form-label">Primary Crop *</label><select name="primaryCrop" class="form-control"><option value="Wheat (Sharbati)">Wheat (Sharbati)</option><option value="Gram (Chana)">Gram (Chana)</option><option value="Mustard (Sarson)">Mustard (Sarson)</option></select></div>
          <div class="form-group"><label class="form-label">Estimated Output (Quintals) *</label><input type="number" name="estimatedQuantity" class="form-control" value="55" required /></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px;">
          <button type="button" class="btn btn-outline" onclick="nextRegStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="nextRegStep(5)">Next: Upload Docs <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>

      <!-- Step 5: Docs -->
      <div id="reg-step-5" class="reg-step-container" style="display:none;">
        <h4 style="color:var(--primary-navy); margin-bottom:12px;">Step 5: KYC Verification Documents</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group"><label class="form-label">Aadhaar Card Copy</label><input type="file" name="aadhaarDoc" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Land Record (7/12 Extract)</label><input type="file" name="landDoc" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Bank Passbook Copy</label><input type="file" name="passbookDoc" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Passport Photo</label><input type="file" name="photoDoc" class="form-control" /></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <button type="button" class="btn btn-outline" onclick="nextRegStep(4)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-success" onclick="submitRegistration()"><i class="fas fa-check-double"></i> Complete Registration & Get OTP</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

const closeModal = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
};

const updateNavAuth = () => {
  const user = getCurrentUser();
  const navContainer = document.getElementById('nav-auth-actions');
  if (!navContainer) return;

  if (user) {
    navContainer.innerHTML = `
      <span style="font-size:0.85rem; font-weight:700; color:var(--primary-navy);"><i class="fas fa-user-circle"></i> ${user.name} (${user.role.toUpperCase()})</span>
      <button class="btn btn-outline btn-sm" onclick="routeTo('${user.role === 'farmer' ? '#farmer-dashboard' : (user.role === 'officer' ? '#officer-dashboard' : '#admin-dashboard')}')"><i class="fas fa-gauge"></i> ${getT('nav_portal')}</button>
      <button class="btn btn-outline btn-sm" style="color:#EF4444;" onclick="logout()" title="${getT('nav_logout')}"><i class="fas fa-sign-out-alt"></i></button>
    `;
  } else {
    navContainer.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openLoginModal()"><i class="fas fa-right-to-bracket"></i> ${getT('nav_login')}</button>
      <button class="btn btn-primary btn-sm" onclick="openRegisterModal()"><i class="fas fa-user-plus"></i> ${getT('nav_register')}</button>
    `;
  }
};

const routeTo = (hash) => {
  window.location.hash = hash;
  renderRoute(hash);
};

const renderRoute = (hash = window.location.hash || '#landing') => {
  if (hash === '#landing' || hash === '' || hash === '#') {
    renderLandingPage();
  } else if (hash === '#smart-booking') {
    loadSmartBookingPage();
  } else if (hash === '#mandi-prices') {
    loadMandiPricesPage();
  } else if (hash === '#farmer-dashboard') {
    loadFarmerDashboard();
  } else if (hash === '#book-slot') {
    loadBookingPortal();
  } else if (hash === '#farmer-queue') {
    loadFarmerQueuePage();
  } else if (hash === '#my-bookings') {
    loadMyBookings();
  } else if (hash === '#farmer-payments') {
    loadFarmerPaymentsPage();
  } else if (hash === '#farmer-farms') {
    loadFarmerFarmsPage();
  } else if (hash === '#farmer-profile') {
    loadFarmerProfilePage();
  } else if (hash === '#officer-dashboard') {
    loadOfficerDashboard();
  } else if (hash === '#officer-queue') {
    loadOfficerQueueView();
  } else if (hash === '#admin-dashboard') {
    loadAdminDashboard();
  } else if (hash === '#tv-display') {
    loadDisplayBoard();
  } else if (hash === '#ai-insights') {
    loadAIInsightsDashboard();
  }
};

const renderLandingPage = () => {
  const container = document.getElementById('app-view-container');
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div>
        <div class="hero-pill"><i class="fas fa-shield-halved"></i> ${getT('hero_pill')}</div>
        <h1 class="hero-heading">
          ${getT('hero_heading')}
        </h1>
        <p class="hero-desc">
          ${getT('hero_desc')}
        </p>
        <div style="display:flex; gap:14px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles"></i> ${getT('btn_smart_mandi_finder')}</button>
          <button class="btn btn-navy" onclick="openLoginModal()"><i class="fas fa-calendar-plus"></i> ${getT('btn_book_slot')}</button>
          <button class="btn btn-outline" onclick="startJudgeGuidedTour()"><i class="fas fa-play"></i> ${getT('btn_guided_tour')}</button>
          <button class="btn btn-outline" onclick="openKisanAIChat()"><i class="fas fa-robot"></i> ${getT('nav_kisan_sahayak')}</button>
        </div>
      </div>
      <div>
        <div class="glass-panel" style="padding:28px; border:2px solid var(--saffron);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-weight:800; color:var(--primary-navy); font-size:1.1rem;"><i class="fas fa-bolt"></i> Live Mandi Throughput</div>
            <span class="status-pill completed"><i class="fas fa-circle-notch fa-spin"></i> Online</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:var(--bg-main); padding:12px; border-radius:8px; display:flex; justify-content:space-between;">
              <span>APMC Bhopal Central:</span>
              <strong style="color:var(--saffron);">Token A001 Serving (Counter 1)</strong>
            </div>
            <div style="background:var(--bg-main); padding:12px; border-radius:8px; display:flex; justify-content:space-between;">
              <span>Average Mandi Wait:</span>
              <strong style="color:var(--green-gov);">12 Minutes</strong>
            </div>
            <div style="background:var(--bg-main); padding:12px; border-radius:8px; display:flex; justify-content:space-between;">
              <span>Current MSP Wheat Rate:</span>
              <strong>₹2,425 / Quintal</strong>
            </div>
          </div>
          <button class="btn btn-navy" style="width:100%; margin-top:20px; justify-content:center;" onclick="routeTo('#tv-display')">
            <i class="fas fa-tv"></i> ${getT('nav_display_board')}
          </button>
        </div>
      </div>
    </section>

    <!-- National Statistics Banner -->
    <div class="hero-stats-banner">
      <div class="glass-card stat-kpi-card">
        <div class="stat-kpi-number" id="landing-stat-farmers">12,480+</div>
        <div class="stat-kpi-label">${getT('stat_farmers')}</div>
      </div>
      <div class="glass-card stat-kpi-card" style="border-left-color:var(--green-gov);">
        <div class="stat-kpi-number" id="landing-stat-centers">48</div>
        <div class="stat-kpi-label">${getT('stat_centers')}</div>
      </div>
      <div class="glass-card stat-kpi-card" style="border-left-color:var(--navy-light);">
        <div class="stat-kpi-number" id="landing-stat-procured">4,82,000 Q</div>
        <div class="stat-kpi-label">${getT('stat_procured')}</div>
      </div>
      <div class="glass-card stat-kpi-card" style="border-left-color:var(--gold);">
        <div class="stat-kpi-number" id="landing-stat-dbt">₹109.5 Cr</div>
        <div class="stat-kpi-label">${getT('stat_dbt')}</div>
      </div>
    </div>

    <!-- How It Works Section -->
    <section style="max-width:1300px; margin:40px auto 60px; padding:0 24px;">
      <div style="text-align:center; margin-bottom:40px;">
        <span class="hero-pill"><i class="fas fa-arrow-down-short-wide"></i> ${getT('how_it_works')}</span>
        <h2 style="font-size:2.4rem; font-weight:800; color:var(--primary-navy);">${getT('how_it_works')}</h2>
        <p style="color:var(--text-muted); max-width:600px; margin:0 auto;">From advance slot reservation to direct bank account payment in 5 simple steps.</p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:20px;">
        <div class="glass-card" style="padding:24px; text-align:center;">
          <div style="width:50px; height:50px; border-radius:50%; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:1.3rem;">1</div>
          <h4 style="color:var(--primary-navy); margin-bottom:8px;">${getT('step1_title')}</h4>
          <p style="color:var(--text-muted); font-size:0.85rem;">${getT('step1_desc')}</p>
        </div>
        <div class="glass-card" style="padding:24px; text-align:center;">
          <div style="width:50px; height:50px; border-radius:50%; background:#FFFBEB; color:#D97706; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:1.3rem;">2</div>
          <h4 style="color:var(--primary-navy); margin-bottom:8px;">${getT('step2_title')}</h4>
          <p style="color:var(--text-muted); font-size:0.85rem;">${getT('step2_desc')}</p>
        </div>
        <div class="glass-card" style="padding:24px; text-align:center;">
          <div style="width:50px; height:50px; border-radius:50%; background:#FAF5FF; color:#9333EA; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:1.3rem;">3</div>
          <h4 style="color:var(--primary-navy); margin-bottom:8px;">${getT('step3_title')}</h4>
          <p style="color:var(--text-muted); font-size:0.85rem;">${getT('step3_desc')}</p>
        </div>
        <div class="glass-card" style="padding:24px; text-align:center;">
          <div style="width:50px; height:50px; border-radius:50%; background:#ECFDF5; color:#059669; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:1.3rem;">4</div>
          <h4 style="color:var(--primary-navy); margin-bottom:8px;">${getT('step4_title')}</h4>
          <p style="color:var(--text-muted); font-size:0.85rem;">${getT('step4_desc')}</p>
        </div>
        <div class="glass-card" style="padding:24px; text-align:center;">
          <div style="width:50px; height:50px; border-radius:50%; background:#F0FDF4; color:#15803D; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:1.3rem;">5</div>
          <h4 style="color:var(--primary-navy); margin-bottom:8px;">${getT('step5_title')}</h4>
          <p style="color:var(--text-muted); font-size:0.85rem;">${getT('step5_desc')}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer style="background:var(--primary-navy); color:#E2E8F0; padding:40px 24px; margin-top:60px; border-top:4px solid var(--saffron);">
      <div style="max-width:1300px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr; gap:32px;">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
            <div class="brand-emblem" style="width:36px; height:36px; font-size:1.1rem;"><i class="fas fa-wheat-awn"></i></div>
            <span style="font-size:1.2rem; font-weight:800; color:#FFF;">KPMS National Agritech</span>
          </div>
          <p style="color:#94A3B8; font-size:0.85rem; line-height:1.6;">
            Ministry of Agriculture & Farmers Welfare, Government of India. Designed for transparent, queue-free, and rapid crop procurement operations nationwide.
          </p>
        </div>
        <div>
          <h5 style="color:#FFF; font-size:0.95rem; margin-bottom:12px;">Quick Portals</h5>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
            <a onclick="routeTo('#farmer-dashboard')" style="color:#CBD5E1; cursor:pointer;">${getT('btn_farmer_login')}</a>
            <a onclick="routeTo('#officer-dashboard')" style="color:#CBD5E1; cursor:pointer;">${getT('btn_officer_login')}</a>
            <a onclick="routeTo('#admin-dashboard')" style="color:#CBD5E1; cursor:pointer;">${getT('btn_admin_login')}</a>
            <a onclick="routeTo('#tv-display')" style="color:#CBD5E1; cursor:pointer;">${getT('nav_display_board')}</a>
          </div>
        </div>
        <div>
          <h5 style="color:#FFF; font-size:0.95rem; margin-bottom:12px;">Toll-Free Helpline</h5>
          <p style="font-size:1.1rem; font-weight:700; color:var(--saffron);">1800-180-1551</p>
          <p style="color:#94A3B8; font-size:0.8rem;">24x7 Kisan Call Center Support</p>
        </div>
      </div>
      <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); font-size:0.78rem; color:#94A3B8;">
        © 2026 Kisan Procurement Management System (KPMS). Built for Smart India Hackathon.
      </div>
    </footer>
  `;
};

// Global App Initialization
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('kpms_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

  initAuth();
  initSocketClient();
  initSIHTour();
  updateNavAuth();
  renderRoute();

  window.addEventListener('hashchange', () => {
    renderRoute();
  });
});
