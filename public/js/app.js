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

// Legacy bridge - openLoginModal is managed by auth.js with full multi-role 2FA suite
// (Preserving function presence for any inline callers)
if (typeof window.openLoginModal === 'undefined') {
  window.openLoginModal = (presetRole = null) => {
    if (typeof renderCentralAuthHub === 'function') {
      const modal = document.getElementById('auth-modal');
      const modalTitle = document.getElementById('modal-title');
      const body = document.getElementById('modal-content-slot');
      if (!presetRole) renderCentralAuthHub(body, modalTitle);
      else renderRoleLoginForm(body, modalTitle, presetRole);
      modal.classList.add('active');
    }
  };
}

const openRegisterModal = () => {
  if (typeof openRegistrationChooser === 'function') {
    openRegistrationChooser();
  }
};

const closeModal = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
};

const updateNavAuth = () => {
  const user = getCurrentUser();
  
  // Update SmartProcure Topbar Profile Chip
  const nameEl = document.getElementById('sp-profile-name');
  const roleEl = document.getElementById('sp-profile-role');
  const avatarEl = document.getElementById('sp-avatar-el');

  if (user) {
    if (nameEl) nameEl.textContent = user.name || 'Ramesh Kumar';
    if (roleEl) roleEl.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Farmer';
    if (avatarEl) {
      const initial = (user.name || 'R').charAt(0).toUpperCase();
      avatarEl.innerHTML = initial;
      avatarEl.style.fontWeight = '800';
    }
  } else {
    if (nameEl) nameEl.textContent = 'Ramesh Kumar';
    if (roleEl) roleEl.textContent = 'Farmer (Demo)';
    if (avatarEl) {
      avatarEl.innerHTML = '<i class="fas fa-user"></i>';
    }
  }

  // Legacy nav actions container support if present
  const navContainer = document.getElementById('nav-auth-actions');
  if (navContainer) {
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
  }
};

const routeTo = (hash) => {
  window.location.hash = hash;
  renderRoute(hash);
};

const renderRoute = (hash = window.location.hash || '#landing') => {
  if (hash === '#landing' || hash === '' || hash === '#') {
    renderLandingPage();
  } else if (hash === '#login' || hash === '#login/') {
    renderLandingPage();
    openLoginModal(null);
  } else if (hash === '#login/farmer') {
    renderLandingPage();
    openLoginModal('farmer');
  } else if (hash === '#login/officer') {
    renderLandingPage();
    openLoginModal('officer');
  } else if (hash === '#login/admin') {
    renderLandingPage();
    openLoginModal('admin');
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
window.renderRoute = renderRoute;
window.routeTo = routeTo;

const renderLandingPage = () => {
  if (typeof window.renderSmartProcureFarmerView === 'function') {
    window.renderSmartProcureFarmerView();
    return;
  }
  if (typeof renderSmartProcureFarmerView === 'function') {
    renderSmartProcureFarmerView();
    return;
  }
  if (typeof window.loadFarmerDashboard === 'function') {
    window.loadFarmerDashboard();
    return;
  }
  if (typeof loadFarmerDashboard === 'function') {
    loadFarmerDashboard();
    return;
  }
};
window.renderLandingPage = renderLandingPage;


// ==========================================
// SmartProcure Interactive Features & Modals
// ==========================================

const showGenericModal = (title, htmlContent) => {
  const modal = document.getElementById('auth-modal');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-content-slot');
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.innerHTML = title;
  bodyEl.innerHTML = htmlContent;
  modal.classList.add('active');
};
window.showGenericModal = showGenericModal;

const openAboutModal = () => {
  showGenericModal(
    `<i class="fas fa-leaf" style="color:#0D5C3A;"></i> About SmartProcure`,
    `
    <div style="padding:10px 0; line-height:1.6; color:#374151;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
        <span style="background:#DCFCE7; color:#15803D; font-weight:800; padding:4px 10px; border-radius:6px; font-size:0.8rem;">
          SIH 2026 PS 26032
        </span>
        <span style="font-size:0.82rem; color:#6B7280; font-weight:600;">Smart Automation Theme</span>
      </div>
      <h4 style="color:#111827; font-size:1.1rem; font-weight:800; margin-bottom:8px;">
        Solving Congestion & Waiting Delays for Indian Farmers
      </h4>
      <p style="font-size:0.88rem; margin-bottom:12px;">
        Farmers across India often face grueling 12–36 hour yard waiting times, zero transit visibility, uncertainty regarding crop grading, and payment anxiety.
      </p>
      <p style="font-size:0.88rem; margin-bottom:14px;">
        <strong>SmartProcure</strong> is an end-to-end digital procurement platform that unites <strong>AI Mandi Finding</strong>, <strong>Dynamic Paced Slot Reservations</strong>, <strong>Real-Time Live Queue Monitoring</strong>, and <strong>Automated PFMS Direct Benefit Transfer (DBT)</strong> within 48–72 hours.
      </p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:16px;">
        <div style="background:#F9FAFB; padding:12px; border-radius:8px; border:1px solid #E5E7EB;">
          <div style="font-weight:700; color:#0D5C3A; font-size:0.85rem;"><i class="fas fa-robot"></i> AI Spatial Routing</div>
          <div style="font-size:0.75rem; color:#6B7280; margin-top:3px;">Optimizes travel distance, queue length, and net MSP profit.</div>
        </div>
        <div style="background:#F9FAFB; padding:12px; border-radius:8px; border:1px solid #E5E7EB;">
          <div style="font-weight:700; color:#0D5C3A; font-size:0.85rem;"><i class="fas fa-qrcode"></i> Digital Token Pacing</div>
          <div style="font-size:0.75rem; color:#6B7280; margin-top:3px;">Quotas prevent gate crowding and eliminate vehicle blockades.</div>
        </div>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button class="sp-btn-book" style="width:auto; padding:8px 18px;" onclick="closeModal()">Close</button>
      </div>
    </div>
    `
  );
};
window.openAboutModal = openAboutModal;

const openHowItWorksModal = () => {
  showGenericModal(
    `<i class="fas fa-route" style="color:#0D5C3A;"></i> How SmartProcure Works`,
    `
    <div style="padding:10px 0; color:#374151;">
      <p style="font-size:0.86rem; color:#6B7280; margin-bottom:16px;">
        From crop harvest to direct bank transfer in 5 simple, guaranteed steps:
      </p>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; gap:12px; align-items:flex-start; background:#F9FAFB; padding:10px 14px; border-radius:10px; border:1px solid #E5E7EB;">
          <div style="width:28px; height:28px; border-radius:50%; background:#0D5C3A; color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">1</div>
          <div>
            <div style="font-weight:700; font-size:0.88rem; color:#111827;">Find Best Mandi</div>
            <div style="font-size:0.76rem; color:#6B7280;">Enter your location and crop. SmartProcure ranks nearby mandis by net returns and queue.</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:flex-start; background:#F9FAFB; padding:10px 14px; border-radius:10px; border:1px solid #E5E7EB;">
          <div style="width:28px; height:28px; border-radius:50%; background:#0D5C3A; color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">2</div>
          <div>
            <div style="font-weight:700; font-size:0.88rem; color:#111827;">Book Guaranteed Slot</div>
            <div style="font-size:0.76rem; color:#6B7280;">Select date, arrival window, and vehicle. Receive a digital QR token instantly via SMS and web.</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:flex-start; background:#F9FAFB; padding:10px 14px; border-radius:10px; border:1px solid #E5E7EB;">
          <div style="width:28px; height:28px; border-radius:50%; background:#0D5C3A; color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">3</div>
          <div>
            <div style="font-weight:700; font-size:0.88rem; color:#111827;">Express Gate Entry</div>
            <div style="font-size:0.76rem; color:#6B7280;">Scan your QR token at Gate 2. System directs your tractor straight to the unloading yard.</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:flex-start; background:#F9FAFB; padding:10px 14px; border-radius:10px; border:1px solid #E5E7EB;">
          <div style="width:28px; height:28px; border-radius:50%; background:#0D5C3A; color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">4</div>
          <div>
            <div style="font-weight:700; font-size:0.88rem; color:#111827;">Electronic Weighment & J-Form</div>
            <div style="font-size:0.76rem; color:#6B7280;">Calibrated weighbridge measures tare & gross weight. Digital J-Form slip is generated on the spot.</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:flex-start; background:#F0FDF4; padding:10px 14px; border-radius:10px; border:1px solid #DCFCE7;">
          <div style="width:28px; height:28px; border-radius:50%; background:#16A34A; color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">5</div>
          <div>
            <div style="font-weight:700; font-size:0.88rem; color:#064E3B;">Direct Bank Transfer (DBT)</div>
            <div style="font-size:0.76rem; color:#15803D;">Money is credited directly to Aadhaar-linked bank account within 48 to 72 hours via PFMS.</div>
          </div>
        </div>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button class="sp-btn-book" style="width:auto; padding:8px 18px;" onclick="closeModal()">Got It</button>
      </div>
    </div>
    `
  );
};
window.openHowItWorksModal = openHowItWorksModal;

const openFaqModal = () => {
  showGenericModal(
    `<i class="fas fa-circle-question" style="color:#0D5C3A;"></i> Frequently Asked Questions`,
    `
    <div style="padding:10px 0; color:#374151; display:flex; flex-direction:column; gap:14px;">
      <div>
        <div style="font-weight:700; font-size:0.9rem; color:#111827; margin-bottom:4px;">
          Q: What documents are required at the mandi?
        </div>
        <div style="font-size:0.8rem; color:#6B7280; line-height:1.4;">
          Aadhaar Card, Kisan Credit Card / Bank Passbook copy, 7/12 Land Record, and your digital QR Token pass on your phone or printout.
        </div>
      </div>
      <div>
        <div style="font-weight:700; font-size:0.9rem; color:#111827; margin-bottom:4px;">
          Q: What happens if I get delayed on the road?
        </div>
        <div style="font-size:0.8rem; color:#6B7280; line-height:1.4;">
          SmartProcure provides an automatic 30-minute grace window. If significantly delayed, use the 'Reschedule' button on My Bookings with zero penalty.
        </div>
      </div>
      <div>
        <div style="font-weight:700; font-size:0.9rem; color:#111827; margin-bottom:4px;">
          Q: When will the payment reflect in my bank account?
        </div>
        <div style="font-size:0.8rem; color:#6B7280; line-height:1.4;">
          Govt DBT SLA guarantees payment dispatch within 48 to 72 hours of J-Form receipt generation. Track live UTR in the Payments tab.
        </div>
      </div>
      <div style="text-align:right; margin-top:16px;">
        <button class="sp-btn-book" style="width:auto; padding:8px 18px;" onclick="closeModal()">Close</button>
      </div>
    </div>
    `
  );
};
window.openFaqModal = openFaqModal;

const openContactModal = () => {
  showGenericModal(
    `<i class="fas fa-headset" style="color:#0D5C3A;"></i> Kisan Helpline & Contact`,
    `
    <div style="padding:10px 0; color:#374151;">
      <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:12px; padding:16px; margin-bottom:16px; text-align:center;">
        <div style="font-size:0.78rem; color:#15803D; font-weight:700; text-transform:uppercase;">National Toll-Free Helpline (24x7)</div>
        <div style="font-size:1.6rem; font-weight:900; color:#064E3B; margin:6px 0;">1800-180-1551</div>
        <div style="font-size:0.75rem; color:#4B5563;">Available in Hindi, English, Punjabi, Gujarati, Marathi & 7 other languages</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px; font-size:0.85rem;">
        <div style="display:flex; gap:10px; align-items:center;">
          <i class="fas fa-envelope" style="color:#0D5C3A; width:20px;"></i>
          <span>Email: <strong>support@smartprocure.gov.in</strong></span>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <i class="fas fa-phone" style="color:#0D5C3A; width:20px;"></i>
          <span>MP State Mandi Board Control Room: <strong>0755-2550100</strong></span>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <i class="fas fa-building" style="color:#0D5C3A; width:20px;"></i>
          <span>Ministry of Agriculture & Farmers Welfare, Krishi Bhawan, New Delhi</span>
        </div>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button class="sp-btn-book" style="width:auto; padding:8px 18px;" onclick="closeModal()">Close</button>
      </div>
    </div>
    `
  );
};
window.openContactModal = openContactModal;

const openNotificationsModal = () => {
  showGenericModal(
    `<i class="far fa-bell" style="color:#0D5C3A;"></i> All Notifications`,
    `
    <div style="padding:10px 0; color:#374151;">
      <div class="sp-notif-list">
        <div class="sp-notif-item">
          <div class="sp-notif-icon sp-chip-green"><i class="fas fa-check"></i></div>
          <div class="sp-notif-content">
            <div class="sp-notif-title-row">
              <span class="sp-notif-title">Slot Confirmed - Centre C Vidisha</span>
              <span class="sp-notif-time">2h ago</span>
            </div>
            <div class="sp-notif-desc">Your appointment for Wheat (50 Q) is booked for 12 Apr 2026, 10:00 AM. QR Token TK-204 generated.</div>
          </div>
        </div>
        <div class="sp-notif-item">
          <div class="sp-notif-icon sp-chip-blue"><i class="fas fa-ticket-alt"></i></div>
          <div class="sp-notif-content">
            <div class="sp-notif-title-row">
              <span class="sp-notif-title">Token #TK-204 Called at Gate 2</span>
              <span class="sp-notif-time">4h ago</span>
            </div>
            <div class="sp-notif-desc">Weighbridge scale #3 is ready for your tractor. Please proceed to Gate 2 scanner.</div>
          </div>
        </div>
        <div class="sp-notif-item">
          <div class="sp-notif-icon sp-chip-orange"><i class="fas fa-indian-rupee-sign"></i></div>
          <div class="sp-notif-content">
            <div class="sp-notif-title-row">
              <span class="sp-notif-title">DBT Payment Credited ₹48,500</span>
              <span class="sp-notif-time">1d ago</span>
            </div>
            <div class="sp-notif-desc">PFMS UTR SBIN0048291 confirmed into SBI Bank A/c ending 4829. J-Form receipt archived.</div>
          </div>
        </div>
        <div class="sp-notif-item">
          <div class="sp-notif-icon sp-chip-yellow"><i class="fas fa-cloud-sun"></i></div>
          <div class="sp-notif-content">
            <div class="sp-notif-title-row">
              <span class="sp-notif-title">Weather Advisory: Clear Transit</span>
              <span class="sp-notif-time">2d ago</span>
            </div>
            <div class="sp-notif-desc">Sunny conditions expected across Bhopal and Vidisha yards. 0% rain forecast for the week.</div>
          </div>
        </div>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button class="sp-btn-book" style="width:auto; padding:8px 18px;" onclick="closeModal()">Dismiss</button>
      </div>
    </div>
    `
  );
};
window.openNotificationsModal = openNotificationsModal;


const openSihInfoModal = () => {
  showGenericModal(
    `<i class="fas fa-award" style="color:#0D5C3A;"></i> Digital Mandi 2026 &bull; SIH Hackathon`,
    `
    <div style="padding:10px 0; color:#374151; line-height:1.6;">
      <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:10px; padding:14px; margin-bottom:14px;">
        <div style="font-weight:800; color:#064E3B; font-size:0.95rem;">Smart India Hackathon 2026</div>
        <div style="font-size:0.8rem; color:#15803D; margin-top:2px;">Problem Statement: PS 26032 &bull; Theme: Smart Automation</div>
      </div>
      <p style="font-size:0.86rem; margin-bottom:10px;">
        <strong>Problem Statement:</strong> "Farmers often face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status."
      </p>
      <p style="font-size:0.86rem; margin-bottom:12px;">
        <strong>DataDynamos Solution:</strong> An automated, high-throughput digital procurement ecosystem delivering AI-based optimal mandi discovery, congestion-free slot allocation, live token queuing with multi-channel SMS/WhatsApp alerts, and tamper-proof DBT disbursement.
      </p>
      <div style="text-align:right; margin-top:16px;">
        <button class="sp-btn-book" style="width:auto; padding:8px 18px;" onclick="closeModal()">Close</button>
      </div>
    </div>
    `
  );
};
window.openSihInfoModal = openSihInfoModal;

// Profile Dropdown Toggle
const toggleProfileDropdown = (event) => {
  if (event) event.stopPropagation();
  const menu = document.getElementById('sp-profile-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
};
window.toggleProfileDropdown = toggleProfileDropdown;

// Close dropdown on outside click
window.addEventListener('click', (e) => {
  const menu = document.getElementById('sp-profile-menu');
  const chip = document.getElementById('sp-user-chip');
  if (menu && menu.classList.contains('active')) {
    if (!chip || !chip.contains(e.target)) {
      menu.classList.remove('active');
    }
  }
});

// Dynamic Debounce Timer for Quantity Input
let mandiSearchDebounceTimer = null;
const debounceMandiSearch = () => {
  if (mandiSearchDebounceTimer) clearTimeout(mandiSearchDebounceTimer);
  mandiSearchDebounceTimer = setTimeout(() => {
    runSmartMandiFinderSearch(true);
  }, 400);
};
window.debounceMandiSearch = debounceMandiSearch;

// Interactive Smart Mandi Finder Search with Live API, Proximity & Weather Integration
const runSmartMandiFinderSearch = async (silent = false) => {
  const locInput = document.getElementById('sp-search-location');
  const cropInput = document.getElementById('sp-search-crop');
  const qtyInput = document.getElementById('sp-search-quantity');
  const dateInput = document.getElementById('sp-search-date');
  const container = document.getElementById('sp-centres-container');

  const userLoc = (window.KPMS_USER_LOCATION && window.KPMS_USER_LOCATION.lat)
    ? window.KPMS_USER_LOCATION
    : {
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        lat: 23.2599,
        lng: 77.4126,
        formattedName: 'Bhopal, Madhya Pradesh'
      };

  if (locInput) {
    locInput.value = userLoc.city ? `${userLoc.city}, ${userLoc.state}` : (userLoc.formattedName || 'Bhopal, Madhya Pradesh');
  }

  const crop = (cropInput && cropInput.value) || 'Wheat';
  const qty = (qtyInput && parseFloat(qtyInput.value)) || 50;
  const date = (dateInput && dateInput.value) || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  if (isNaN(qty) || qty <= 0) {
    if (!silent && typeof showToast === 'function') {
      showToast('Please enter a valid procurement quantity greater than 0.', 'error');
    }
    return;
  }

  if (container && !silent) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 28px 20px; text-align: center; background: #FFF; border: 1px solid #E5E7EB; border-radius: 14px;">
        <i class="fas fa-circle-notch fa-spin" style="color:#0D5C3A; font-size:1.6rem; margin-bottom:8px;"></i>
        <div style="font-weight:700; color:#111827; font-size:0.95rem;">Finding best procurement centres for ${crop}...</div>
        <div style="font-size:0.78rem; color:#6B7280; margin-top:3px;">Querying centres near ${userLoc.city || userLoc.formattedName} & live weather feeds</div>
      </div>
    `;
  }

  try {
    // 1. Fetch active centers from backend with proximity scoring
    let candidateCentres = [];
    try {
      const res = await fetch(`/api/bookings/centers?lat=${userLoc.lat}&lon=${userLoc.lng || userLoc.lon}&radius=400`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        candidateCentres = json.data;
      }
    } catch (e) {
      console.warn('Center query notice:', e.message);
    }

    if (!candidateCentres || candidateCentres.length === 0) {
      candidateCentres = (window.SmartBookingEngine && window.SmartBookingEngine.DEFAULT_PROCUREMENT_CENTRES) || [];
    }

    // 2. Fetch live weather for candidate centers
    const weatherMap = {};
    const topCandidates = candidateCentres.slice(0, 8);
    await Promise.all(topCandidates.map(async (c) => {
      const cId = c.id || c.centerId || c.code;
      const cLat = c.latitude || 23.2599;
      const cLon = c.longitude || 77.4126;
      try {
        const wRes = await fetch(`/api/weather/centre?lat=${cLat}&lon=${cLon}&city=${encodeURIComponent(c.district || c.name)}`);
        const wJson = await wRes.json();
        if (wJson.success && wJson.data) {
          weatherMap[cId] = wJson.data;
        }
      } catch (err) {}
    }));

    // 3. Execute deterministic multi-factor recommendation algorithm
    if (!window.SmartBookingEngine || typeof window.SmartBookingEngine.runSmartProcurementAlgorithm !== 'function') {
      console.warn('SmartBookingEngine not loaded');
      return;
    }

    const algoResult = window.SmartBookingEngine.runSmartProcurementAlgorithm(
      crop,
      qty,
      candidateCentres,
      { lat: userLoc.lat, lng: userLoc.lng || userLoc.lon, location: userLoc.city || userLoc.formattedName },
      weatherMap
    );

    if (!algoResult || !algoResult.success || !algoResult.rankedResults || algoResult.rankedResults.length === 0) {
      if (container) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 32px 20px; text-align: center; background: #FFF; border: 1px solid #E5E7EB; border-radius: 14px; color: #6B7280;">
            <i class="fas fa-circle-exclamation" style="color: #D97706; font-size: 1.8rem; margin-bottom: 8px;"></i>
            <div style="font-weight: 700; color: #111827; font-size: 0.95rem;">No active centres found for ${crop}</div>
            <div style="font-size: 0.8rem; margin-top: 4px;">Try selecting another crop or increasing the search radius.</div>
          </div>
        `;
      }
      return;
    }

    const topCentres = algoResult.rankedResults.slice(0, 3);
    const tagClasses = ['sp-tag-green', 'sp-tag-blue', 'sp-tag-orange'];

    if (container) {
      container.innerHTML = topCentres.map((r, idx) => {
        const tagClass = tagClasses[idx] || 'sp-tag-green';
        const tagLabel = idx === 0 ? '★ Best Choice' : (idx === 1 ? 'Fastest Delivery' : 'Top Net Return');
        const matchPct = r.matchScore || Math.max(70, 95 - (idx * 6));
        const price = r.pricePerQuintal || 2425;
        const availableCap = r.availableQuota || r.availableCapacity || 150;
        const capPct = Math.min(100, Math.round((r.acceptedQuantity / availableCap) * 100));
        const weatherLabel = (r.weatherClassification && r.weatherClassification.label) || 'Clear';
        const weatherTemp = (r.weather && r.weather.temp) ? `${r.weather.temp}°C` : '29°C';
        const weatherIcon = (r.weatherClassification && r.weatherClassification.category === 'CLEAR') ? 'fa-sun' : 'fa-cloud-sun';

        return `
          <div class="sp-centre-card">
            <div class="sp-centre-top">
              <span class="sp-tag-badge ${tagClass}">${tagLabel}</span>
              <span class="sp-match-score">${matchPct}% Match</span>
            </div>
            <div class="sp-centre-info-row">
              <div>
                <div class="sp-centre-name">${r.shortName || r.centerName}</div>
                <div class="sp-centre-loc">${r.district}, ${r.state}</div>
                <div class="sp-centre-dist"><i class="fas fa-route" style="color:#0D5C3A;"></i> ${r.distance} km away &bull; ~${r.travelTimeDisplay}</div>
              </div>
              <img src="/images/sp_mandi_thumb.jpg" alt="${r.shortName}" class="sp-centre-thumb" />
            </div>
            <div class="sp-centre-price">
              ₹${price.toLocaleString('en-IN')} <small>/ Quintal</small>
            </div>
            ${r.capacityExceeded ? `
              <div class="sp-capacity-advisory">
                <i class="fas fa-triangle-exclamation" style="margin-top:1px;"></i>
                <div>${r.capacityWarningText}</div>
              </div>
            ` : ''}
            ${r.keyReasons && r.keyReasons.length > 0 ? `
              <div class="sp-why-recommended">
                <i class="fas fa-check-circle" style="color:#16A34A;"></i> ${r.keyReasons[0]}
              </div>
            ` : ''}
            <div class="sp-card-divider"></div>
            <div class="sp-mini-stats-row">
              <div class="sp-mini-stat-col">
                <span class="sp-mini-stat-label"><i class="fas fa-users"></i> Queue</span>
                <span class="sp-mini-stat-val">${r.waitingDays} • ~${r.waitingDays * 20} min</span>
              </div>
              <div class="sp-mini-stat-col">
                <span class="sp-mini-stat-label"><i class="fas fa-warehouse"></i> Capacity</span>
                <span class="sp-mini-stat-val">${r.acceptedQuantity}/${availableCap} Q (${capPct}%)</span>
              </div>
              <div class="sp-mini-stat-col">
                <span class="sp-mini-stat-label"><i class="fas ${weatherIcon}"></i> Weather</span>
                <span class="sp-mini-stat-val">${weatherLabel} ${weatherTemp}</span>
              </div>
            </div>
            <button class="sp-btn-book" onclick="bookRecommendedSlot('${r.centerId}', '${crop}', ${r.acceptedQuantity})">
              Book Slot
            </button>
          </div>
        `;
      }).join('');
    }

    // 4. Update Leaflet mini-map dynamically
    updateNearbyMandisMiniMap(userLoc, topCentres, crop, qty);

    // 5. Update Right Column Weather Widget with top recommended centre's weather
    if (topCentres.length > 0) {
      updateDashboardWeatherWidget(topCentres[0]);
    }

    if (!silent && typeof showToast === 'function') {
      showToast(`🌾 Ranked ${topCentres.length} optimal centres for ${crop} (${qty} Q) from ${userLoc.city || 'your area'}`, 'success');
    }
  } catch (err) {
    console.error('Error running Smart Mandi search:', err);
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #EF4444; background: #FEF2F2; border-radius: 12px;">
          <i class="fas fa-triangle-exclamation"></i> Unable to complete dynamic mandi ranking: ${err.message}. Please retry.
        </div>
      `;
    }
  }
};
window.runSmartMandiFinderSearch = runSmartMandiFinderSearch;

// Update Dashboard Weather Widget Dynamically
const updateDashboardWeatherWidget = (topCentre) => {
  if (!topCentre) return;
  const w = topCentre.weather || {};
  const cClass = topCentre.weatherClassification || {};

  const titleEl = document.querySelector('#sp-weather-widget-title, .sp-widget-card .sp-widget-title');
  if (titleEl && titleEl.textContent.includes('Weather')) {
    titleEl.innerHTML = `<i class="fas fa-location-dot" style="color:#0D5C3A;"></i> Weather - ${topCentre.district || topCentre.shortName}`;
  }

  const tempEl = document.querySelector('.sp-weather-temp');
  if (tempEl && w.temp !== undefined) {
    tempEl.textContent = `${w.temp}°C`;
  }

  const condEl = document.querySelector('.sp-weather-cond');
  if (condEl) {
    condEl.textContent = `${cClass.label || 'Favorable'} • ${cClass.travelRisk ? cClass.travelRisk + ' transit risk' : 'Ideal conditions'}`;
  }
};

// Book recommended slot action with prefilled data
const bookRecommendedSlot = (centerId = 'CTR-01', crop = 'Wheat', quantity = 50) => {
  window.smartBookingPrefill = {
    centerId: centerId,
    crop: crop,
    quantity: quantity
  };
  if (typeof showToast === 'function') {
    showToast(`Pre-filling slot booking for ${crop} (${quantity} Q) at ${centerId}`, 'info');
  }
  routeTo('#book-slot');
};
window.bookRecommendedSlot = bookRecommendedSlot;

// Leaflet Mini Map Instance Tracker
window.spMiniMap = null;
window.spMiniMapMarkers = [];

// Interactive Leaflet Mini Map Initializer & Dynamic Updater
const initNearbyMandisMiniMap = () => {
  const mapEl = document.getElementById('sp-nearby-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (!window.spMiniMap) {
    try {
      const defaultCenter = (window.KPMS_USER_LOCATION && window.KPMS_USER_LOCATION.lat)
        ? [window.KPMS_USER_LOCATION.lat, window.KPMS_USER_LOCATION.lng || window.KPMS_USER_LOCATION.lon]
        : [23.2599, 77.4126];

      window.spMiniMap = L.map('sp-nearby-map', {
        center: defaultCenter,
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(window.spMiniMap);

      setTimeout(() => {
        if (window.spMiniMap) window.spMiniMap.invalidateSize();
      }, 300);
    } catch (e) {
      console.warn('Map initialization notice:', e.message);
    }
  }

  // Trigger initial search if not already done
  if (typeof runSmartMandiFinderSearch === 'function') {
    runSmartMandiFinderSearch(true);
  }
};
window.initNearbyMandisMiniMap = initNearbyMandisMiniMap;

// Dynamic Marker, Polyline Corridor and Bounds Updater for Mini Map
const updateNearbyMandisMiniMap = (userLoc, topCentres, crop = 'Wheat', qty = 50) => {
  if (!window.spMiniMap || typeof L === 'undefined') return;

  try {
    // Clear previous markers and polylines
    if (window.spMiniMapMarkers && window.spMiniMapMarkers.length > 0) {
      window.spMiniMapMarkers.forEach(m => window.spMiniMap.removeLayer(m));
      window.spMiniMapMarkers = [];
    }

    const bounds = [];
    let originCoord = null;

    // Add Farmer Location Marker
    if (userLoc && userLoc.lat && (userLoc.lng || userLoc.lon)) {
      const uLat = userLoc.lat;
      const uLng = userLoc.lng || userLoc.lon;
      originCoord = [uLat, uLng];
      bounds.push(originCoord);

      const farmerIcon = L.divIcon({
        html: '<div style="background:#15803D; color:#FFF; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(21,128,61,0.5); border:2px solid #FFF;"><i class="fas fa-tractor" style="font-size:12px;"></i></div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const farmerMarker = L.marker(originCoord, { icon: farmerIcon }).addTo(window.spMiniMap);

      farmerMarker.bindPopup(`
        <div style="font-family:sans-serif; font-size:0.82rem; padding:4px;">
          <strong style="color:#065F46;"><i class="fas fa-tractor"></i> Your Farm Origin</strong><br>
          ${userLoc.city || userLoc.formattedName || 'Current Location'}
        </div>
      `);
      window.spMiniMapMarkers.push(farmerMarker);
    }

    // Add Candidate Centre Markers and Route Lines
    const colors = ['#0D5C3A', '#2563EB', '#D97706'];
    topCentres.forEach((c, idx) => {
      const cLat = (c.centre && c.centre.latitude) || c.latitude || (c.coordinates && c.coordinates[1]);
      const cLng = (c.centre && c.centre.longitude) || c.longitude || (c.coordinates && c.coordinates[0]);
      if (!cLat || !cLng) return;

      const mandiCoord = [cLat, cLng];
      bounds.push(mandiCoord);

      // Draw corridor line to recommended centre
      if (originCoord && idx === 0) {
        const routeLine = L.polyline([originCoord, mandiCoord], {
          color: '#0D5C3A',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '6, 8'
        }).addTo(window.spMiniMap);
        window.spMiniMapMarkers.push(routeLine);
      }

      const mandiIcon = L.divIcon({
        html: `<div style="background:${colors[idx] || '#0D5C3A'}; color:#FFF; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid #FFF; font-weight:800; font-size:11px;">${idx + 1}</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker(mandiCoord, { icon: mandiIcon }).addTo(window.spMiniMap);

      marker.bindPopup(`
        <div style="font-family:sans-serif; font-size:0.82rem; padding:4px;">
          <strong style="color:#0F5132;">${c.shortName || c.centerName}</strong><br>
          ${c.distance} km away &bull; Match: <strong>${c.matchScore}%</strong><br>
          Price: <strong>₹${c.pricePerQuintal}/Q</strong><br>
          <a onclick="bookRecommendedSlot('${c.centerId}', '${crop}', ${qty})" style="color:#15803D; font-weight:700; cursor:pointer; text-decoration:underline; display:inline-block; margin-top:4px;">Book This Mandi</a>
        </div>
      `);
      window.spMiniMapMarkers.push(marker);
    });

    if (bounds.length > 0) {
      window.spMiniMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      setTimeout(() => {
        if (window.spMiniMap) window.spMiniMap.invalidateSize();
      }, 300);
    }
  } catch (err) {
    console.warn('Map update notice:', err.message);
  }
};
window.updateNearbyMandisMiniMap = updateNearbyMandisMiniMap;


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

  // Initialize Global Geolocation & Spatial Intelligence
  if (window.KPMS_Location) {
    window.KPMS_Location.init();
  }

  renderRoute();

  window.addEventListener('hashchange', () => {
    renderRoute();
  });

  // When user's location is detected or switched, adapt current view
  window.addEventListener('kpms:location-changed', (e) => {
    const hash = window.location.hash || '#landing';
    if (document.getElementById('sp-centres-container')) {
      const locInput = document.getElementById('sp-search-location');
      if (locInput && e.detail) {
        locInput.value = e.detail.city ? `${e.detail.city}, ${e.detail.state}` : (e.detail.formattedName || 'Your Location');
      }
      if (typeof runSmartMandiFinderSearch === 'function') {
        runSmartMandiFinderSearch(false);
      }
    } else if (hash === '#landing' || hash === '' || hash === '#') {
      renderLandingPage();
    }
  });
});
