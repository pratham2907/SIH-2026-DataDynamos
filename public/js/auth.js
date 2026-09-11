// ==============================================================================
// 🌾 KPMS PRODUCTION MULTI-ROLE AUTHENTICATION & SECURITY CONTROLLER (SIH 2026)
// Supporting: Farmer, Procurement Officer, and Super Admin
// ==============================================================================

let currentCaptchaToken = '';
let currentLoginSession = null;
let currentResetSession = null;
let otpCountdownTimer = null;
let otpSecondsRemaining = 60;
let inactivityTimer = null;
let currentInactivityLimitMinutes = 30;

// ------------------------------------------------------------------------------
// 1. INACTIVITY AUTO-LOGOUT SESSION MANAGER
// Farmer: 30 mins, Officer: 20 mins, Super Admin: 15 mins
// ------------------------------------------------------------------------------
const startInactivityTracker = (timeoutMinutes = 30) => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  currentInactivityLimitMinutes = timeoutMinutes;

  const ms = timeoutMinutes * 60 * 1000;
  inactivityTimer = setTimeout(handleInactivityLogout, ms);

  // Reset timer on user interactions
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  const resetTimer = () => {
    if (localStorage.getItem('kpms_token')) {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleInactivityLogout, ms);
    }
  };

  activityEvents.forEach(evt => {
    window.removeEventListener(evt, resetTimer);
    window.addEventListener(evt, resetTimer, { passive: true });
  });
};

const handleInactivityLogout = () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) return;

  logout(true); // Is inactivity logout
};

// ------------------------------------------------------------------------------
// 2. CENTRAL AUTHENTICATION PAGE & ROLE LOGIN MODAL
// ------------------------------------------------------------------------------
const openLoginModal = (presetRole = null) => {
  const modal = document.getElementById('auth-modal');
  const modalTitle = document.getElementById('modal-title');
  const body = document.getElementById('modal-content-slot');

  if (!presetRole) {
    renderCentralAuthHub(body, modalTitle);
  } else {
    renderRoleLoginForm(body, modalTitle, presetRole);
  }

  modal.classList.add('active');
};

/**
 * Render Central Authentication Hub with 3 Glassmorphism Cards
 */
const renderCentralAuthHub = (body, modalTitle) => {
  modalTitle.innerHTML = `<span style="display:flex; align-items:center; gap:8px;"><i class="fas fa-shield-halved" style="color:var(--saffron);"></i> KPMS Single Sign-On Portal</span>`;

  body.innerHTML = `
    <div style="padding: 10px 4px;">
      <div style="text-align:center; margin-bottom:24px;">
        <div class="brand-emblem" style="width:54px; height:54px; margin:0 auto 12px; font-size:1.8rem;">
          <i class="fas fa-wheat-awn"></i>
        </div>
        <h3 style="font-size:1.35rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">
          Select Your Access Role
        </h3>
        <p style="font-size:0.88rem; color:var(--text-muted); max-width:480px; margin:0 auto;">
          Secure National Procurement Grid with Two-Factor Authentication (2FA) & Role-Based Access Control.
        </p>
      </div>

      <!-- Three Role Glassmorphism Cards -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:18px; margin-bottom:24px;">
        
        <!-- 1. Farmer Card -->
        <div class="role-auth-card farmer-theme" onclick="openLoginModal('farmer')">
          <div>
            <div class="role-icon-circle" style="overflow:hidden; border:2px solid #10B981; padding:0; width:54px; height:54px; border-radius:50%; margin:0 auto 12px; box-shadow:0 3px 10px rgba(16,185,129,0.3); background:#FFF;">
              <img src="/images/roles/farmer.jpg" alt="Farmer" style="width:100%; height:100%; object-fit:cover; display:block;" />
            </div>
            <span class="role-badge farmer">Farmer Portal</span>
            <h4 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">Kisan Login</h4>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5;">
              Slot booking, live weighbridge queue tokens, and instant DBT payments.
            </p>
          </div>
          <div style="margin-top:16px;">
            <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; background:#10B981; border-color:#059669;">
              Access Kisan Portal <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
            </button>
          </div>
        </div>

        <!-- 2. Procurement Officer Card -->
        <div class="role-auth-card officer-theme" onclick="openLoginModal('officer')">
          <div>
            <div class="role-icon-circle" style="overflow:hidden; border:2px solid #2563EB; padding:0; width:54px; height:54px; border-radius:50%; margin:0 auto 12px; box-shadow:0 3px 10px rgba(37,99,235,0.3); background:#FFF;">
              <img src="/images/roles/officer.jpg" alt="Procurement Officer" style="width:100%; height:100%; object-fit:cover; display:block;" />
            </div>
            <span class="role-badge officer">Procurement Officer</span>
            <h4 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">Officer Portal</h4>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5;">
              Token queue caller, digital weighing, crop grading, and mandi dispatch.
            </p>
          </div>
          <div style="margin-top:16px;">
            <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; background:#2563EB; border-color:#1D4ED8;">
              Officer Sign In <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
            </button>
          </div>
        </div>

        <!-- 3. Super Admin Card -->
        <div class="role-auth-card admin-theme" onclick="openLoginModal('admin')">
          <div>
            <div class="role-icon-circle" style="overflow:hidden; border:2px solid #E06D14; padding:0; width:54px; height:54px; border-radius:50%; margin:0 auto 12px; box-shadow:0 3px 10px rgba(224,109,20,0.3); background:#FFF;">
              <img src="/images/roles/admin.jpg" alt="Super Admin" style="width:100%; height:100%; object-fit:cover; display:block;" />
            </div>
            <span class="role-badge admin">State Admin</span>
            <h4 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">Super Admin</h4>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5;">
              National oversight, officer approvals, APMC policies, and audit logs.
            </p>
          </div>
          <div style="margin-top:16px;">
            <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; background:#E06D14; border-color:#C25608;">
              Admin Control <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
            </button>
          </div>
        </div>

      </div>

      <div style="text-align:center; padding:12px; background:var(--bg-main); border-radius:8px; font-size:0.85rem; color:var(--text-muted);">
        New to KPMS? 
        <a onclick="closeModal(); if (typeof openRegistrationChooser === 'function') openRegistrationChooser();" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">
          Register as Citizen / Officer
        </a>
      </div>
    </div>
  `;
};

/**
 * Render Dedicated Login Form for Specific Role
 */
const renderRoleLoginForm = (body, modalTitle, role) => {
  const roleConfig = {
    farmer: {
      title: 'Kisan Portal Sign In',
      photo: '/images/roles/farmer.jpg',
      badgeClass: 'farmer',
      badgeText: 'Farmer Authentication',
      idLabel: 'Farmer ID or Mobile Number',
      idPlaceholder: 'e.g. FRM202600001 or 9876543210',
      idHelp: 'Enter your registered 10-digit mobile number or Farmer ID (FRM...)',
      defaultId: '9876543210',
      defaultPass: 'Kisan@123',
      color: '#10B981'
    },
    officer: {
      title: 'Procurement Officer Login',
      photo: '/images/roles/officer.jpg',
      badgeClass: 'officer',
      badgeText: 'Authorized Mandi Cadre',
      idLabel: 'Official Email or Employee ID',
      idPlaceholder: 'e.g. officer@kpms.gov.in or OFF-BPL-101',
      idHelp: 'Official government-issued APMC credentials required',
      defaultId: 'officer@kpms.gov.in',
      defaultPass: 'Officer@123',
      color: '#2563EB'
    },
    admin: {
      title: 'Super Admin Security Portal',
      photo: '/images/roles/admin.jpg',
      badgeClass: 'admin',
      badgeText: 'Root Level Control',
      idLabel: 'Super Admin Official Email',
      idPlaceholder: 'e.g. admin@kpms.gov.in',
      idHelp: 'Ministry of Agriculture authorized email address',
      defaultId: 'admin@kpms.gov.in',
      defaultPass: 'Admin@123',
      color: '#E06D14'
    }
  };

  const cfg = roleConfig[role] || roleConfig.farmer;
  modalTitle.innerHTML = `<span style="display:flex; align-items:center; gap:8px;"><img src="${cfg.photo}" alt="${role}" style="width:26px; height:26px; border-radius:50%; object-fit:cover; border:1.5px solid ${cfg.color};" /> ${cfg.title}</span>`;

  body.innerHTML = `
    <div>
      <!-- Role Switcher Tabs -->
      <div style="display:flex; gap:6px; margin-bottom:18px; background:var(--bg-main); padding:4px; border-radius:8px;">
        <button type="button" class="btn btn-sm ${role === 'farmer' ? 'btn-primary' : 'btn-outline'}" style="flex:1; font-size:0.8rem; padding:7px 4px; justify-content:center; display:flex; align-items:center; gap:6px;" onclick="openLoginModal('farmer')">
          <img src="/images/roles/farmer.jpg" alt="Farmer" style="width:16px; height:16px; border-radius:50%; object-fit:cover;" /> Farmer
        </button>
        <button type="button" class="btn btn-sm ${role === 'officer' ? 'btn-primary' : 'btn-outline'}" style="flex:1; font-size:0.8rem; padding:7px 4px; justify-content:center; display:flex; align-items:center; gap:6px;" onclick="openLoginModal('officer')">
          <img src="/images/roles/officer.jpg" alt="Officer" style="width:16px; height:16px; border-radius:50%; object-fit:cover;" /> Officer
        </button>
        <button type="button" class="btn btn-sm ${role === 'admin' ? 'btn-primary' : 'btn-outline'}" style="flex:1; font-size:0.8rem; padding:7px 4px; justify-content:center; display:flex; align-items:center; gap:6px;" onclick="openLoginModal('admin')">
          <img src="/images/roles/admin.jpg" alt="Super Admin" style="width:16px; height:16px; border-radius:50%; object-fit:cover;" /> Super Admin
        </button>
      </div>

      <!-- Role Badge Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <span class="role-badge ${cfg.badgeClass}">${cfg.badgeText}</span>
        <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fas fa-lock"></i> 256-bit SSL Encrypted</span>
      </div>

      <!-- Main Login Form -->
      <form id="role-login-form" onsubmit="handleRoleLoginSubmit(event, '${role}')" novalidate>
        
        <!-- Identifier Field -->
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label"><i class="fas fa-user"></i> ${cfg.idLabel} <span style="color:#EF4444;">*</span></label>
          <div class="form-input-wrapper">
            <input 
              type="text" 
              id="auth-identifier" 
              name="identifier" 
              class="form-control" 
              placeholder="${cfg.idPlaceholder}" 
              value="${cfg.defaultId}"
              oninput="validateLoginForm('${role}')"
              required 
              autocomplete="username" 
            />
            <span id="identifier-status-icon" class="input-icon-right"></span>
          </div>
          <div id="identifier-error" class="field-error"></div>
          <small style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; display:block;">${cfg.idHelp}</small>
        </div>

        <!-- Password Field -->
        <div class="form-group" style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <label class="form-label" style="margin-bottom:0;"><i class="fas fa-key"></i> Password <span style="color:#EF4444;">*</span></label>
            <a onclick="openForgotPasswordModal('${role}')" style="font-size:0.8rem; color:var(--saffron); cursor:pointer; font-weight:600;">
              Forgot Password?
            </a>
          </div>
          <div class="form-input-wrapper">
            <input 
              type="password" 
              id="auth-password" 
              name="password" 
              class="form-control" 
              placeholder="Enter your secure password" 
              value="${cfg.defaultPass}"
              oninput="validateLoginForm('${role}')"
              required 
              autocomplete="current-password" 
            />
            <span class="input-icon-right" onclick="togglePasswordVisibility('auth-password', this)">
              <i class="fas fa-eye"></i>
            </span>
          </div>
          <div id="password-error" class="field-error"></div>
        </div>

        <!-- Super Admin CAPTCHA Section -->
        ${role === 'admin' ? `
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label"><i class="fas fa-shield-alt"></i> Security Verification (CAPTCHA) <span style="color:#EF4444;">*</span></label>
            <div class="captcha-container">
              <div id="captcha-question-slot" class="captcha-display">Loading...</div>
              <button type="button" class="captcha-refresh-btn" onclick="fetchCaptcha()" title="Refresh CAPTCHA">
                <i class="fas fa-rotate"></i>
              </button>
            </div>
            <input 
              type="text" 
              id="auth-captcha" 
              name="captcha" 
              class="form-control" 
              placeholder="Enter calculation solution or code" 
              oninput="validateLoginForm('${role}')"
              required 
              autocomplete="off"
            />
            <div id="captcha-error" class="field-error"></div>
          </div>
        ` : ''}

        <!-- Remember Me Checkbox -->
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;">
          <input type="checkbox" id="auth-remember-me" name="rememberMe" style="width:16px; height:16px; accent-color:var(--saffron); cursor:pointer;" checked />
          <label for="auth-remember-me" style="font-size:0.85rem; color:var(--text-main); cursor:pointer; user-select:none;">
            Remember this device for 7 days
          </label>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          id="auth-submit-btn" 
          class="btn btn-primary" 
          style="width:100%; justify-content:center; padding:12px; font-weight:700; font-size:0.95rem; background:${cfg.color}; border-color:${cfg.color};"
        >
          <i class="fas fa-right-to-bracket" style="margin-right:6px;"></i> Proceed to 2FA Verification
        </button>
      </form>

      <!-- Footer Help and Role Switching -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:12px; border-top:1px solid var(--border-color); font-size:0.82rem;">
        <a onclick="openLoginModal(null)" style="color:var(--text-muted); cursor:pointer;">
          <i class="fas fa-arrow-left"></i> All Login Roles
        </a>
        <a onclick="closeModal(); if (typeof openRegistrationChooser === 'function') openRegistrationChooser();" style="color:var(--saffron); font-weight:700; cursor:pointer;">
          New Registration <i class="fas fa-user-plus"></i>
        </a>
      </div>
    </div>
  `;

  // Fetch CAPTCHA if admin
  if (role === 'admin') {
    fetchCaptcha();
  }

  // Trigger initial validation
  validateLoginForm(role);
};

// ------------------------------------------------------------------------------
// 3. CAPTCHA CONTROLLER
// ------------------------------------------------------------------------------
const fetchCaptcha = async () => {
  const slot = document.getElementById('captcha-question-slot');
  if (slot) slot.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  try {
    const res = await fetch('/api/auth/captcha');
    const data = await res.json();
    if (data.success) {
      currentCaptchaToken = data.captchaToken;
      if (slot) slot.textContent = data.question;
      const input = document.getElementById('auth-captcha');
      if (input) input.value = '';
    }
  } catch (err) {
    if (slot) slot.textContent = '8 + 4 = ?';
  }
};

// ------------------------------------------------------------------------------
// 4. REAL-TIME CLIENT-SIDE VALIDATION
// ------------------------------------------------------------------------------
const validateLoginForm = (role) => {
  const idInput = document.getElementById('auth-identifier');
  const passInput = document.getElementById('auth-password');
  const captchaInput = document.getElementById('auth-captcha');
  const submitBtn = document.getElementById('auth-submit-btn');

  const idErr = document.getElementById('identifier-error');
  const passErr = document.getElementById('password-error');
  const capErr = document.getElementById('captcha-error');
  const statusIcon = document.getElementById('identifier-status-icon');

  if (!idInput || !passInput || !submitBtn) return;

  const idVal = idInput.value.trim();
  const passVal = passInput.value;
  let isIdValid = false;
  let isPassValid = passVal.length > 0;
  let isCaptchaValid = true;

  // Validation rules per role
  if (role === 'farmer') {
    const isMobile = /^[6-9]\d{9}$/.test(idVal);
    const isFarmerId = /^(FRM\d{5,11}|FARM\d{5,11})$/i.test(idVal);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(idVal);

    if (isMobile || isFarmerId || isEmail) {
      isIdValid = true;
      if (idErr) idErr.style.display = 'none';
      idInput.classList.remove('is-invalid');
      idInput.classList.add('is-valid');
      if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#10B981;"></i>';
    } else {
      isIdValid = false;
      idInput.classList.remove('is-valid');
      if (idVal.length > 3) {
        idInput.classList.add('is-invalid');
        if (idErr) {
          idErr.textContent = 'Format: FRM202600001 or 10-digit mobile number';
          idErr.style.display = 'block';
        }
        if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-circle-exclamation" style="color:#EF4444;"></i>';
      } else {
        if (idErr) idErr.style.display = 'none';
        if (statusIcon) statusIcon.innerHTML = '';
      }
    }
  } else if (role === 'officer') {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(idVal);
    const isEmpId = /^(OFF|EMP)\d{3,8}$/i.test(idVal) || idVal.toUpperCase().startsWith('OFF-') || idVal === 'officer';

    if (isEmail || isEmpId) {
      isIdValid = true;
      if (idErr) idErr.style.display = 'none';
      idInput.classList.remove('is-invalid');
      idInput.classList.add('is-valid');
      if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#10B981;"></i>';
    } else {
      isIdValid = false;
      if (idVal.length > 3) {
        idInput.classList.add('is-invalid');
        if (idErr) {
          idErr.textContent = 'Enter Official Email or Employee ID (e.g. OFF-BPL-101)';
          idErr.style.display = 'block';
        }
      }
    }
  } else if (role === 'admin') {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(idVal) || idVal === 'admin';
    isIdValid = isEmail;
    if (isEmail) {
      if (idErr) idErr.style.display = 'none';
      idInput.classList.add('is-valid');
    }

    if (captchaInput) {
      isCaptchaValid = captchaInput.value.trim().length > 0;
    }
  }

  // Toggle button enabled/disabled state
  const isFormValid = isIdValid && isPassValid && isCaptchaValid;
  submitBtn.disabled = !isFormValid;
  submitBtn.style.opacity = isFormValid ? '1' : '0.6';
  submitBtn.style.cursor = isFormValid ? 'pointer' : 'not-allowed';
};

const togglePasswordVisibility = (inputId, iconEl) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  iconEl.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
};

// ------------------------------------------------------------------------------
// 5. LOGIN SUBMISSION & 2FA TRIGGER
// ------------------------------------------------------------------------------
const handleRoleLoginSubmit = async (e, role) => {
  e.preventDefault();
  const form = e.target;
  const identifier = form.identifier.value.trim();
  const password = form.password.value;
  const rememberMe = form.rememberMe ? form.rememberMe.checked : true;
  const captchaAnswer = form.captcha ? form.captcha.value.trim() : null;

  const submitBtn = document.getElementById('auth-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating Credentials...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        identifier,
        password,
        captchaToken: currentCaptchaToken,
        captchaAnswer,
        rememberMe
      })
    });

    const data = await res.json();

    if (res.status === 423) {
      // Account Locked Notice
      showToast(data.message || 'Account is temporarily locked for 30 minutes.', 'error');
      renderLockoutNotice(data);
      return;
    }

    if (res.status === 403 && data.status === 'Pending_Admin_Approval') {
      // Pending Officer Notice
      renderPendingOfficerNotice(data);
      return;
    }

    if (!data.success) {
      showToast(data.message || 'Invalid credentials or account unavailable.', 'error');
      if (role === 'admin') fetchCaptcha();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Proceed to 2FA Verification';
      }
      return;
    }

    // Two-Factor Authentication Required
    if (data.requiresOtp) {
      currentLoginSession = {
        tempSessionId: data.tempSessionId,
        maskedTarget: data.maskedTarget,
        role: data.role,
        expiresInSeconds: data.expiresInSeconds || 300,
        resendCooldownSeconds: data.resendCooldownSeconds || 60
      };
      showToast(data.message, 'info');
      openLoginOtpScreen(currentLoginSession);
    } else if (data.token) {
      // Direct session completion
      completeSessionLogin(data);
    }
  } catch (err) {
    showToast('Network error during authentication: ' + err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Proceed to 2FA Verification';
    }
  }
};

/**
 * Render Pending Officer Notice Alert
 */
const renderPendingOfficerNotice = (data) => {
  const body = document.getElementById('modal-content-slot');
  const title = document.getElementById('modal-title');
  title.innerHTML = `<span style="color:#F59E0B;"><i class="fas fa-clock"></i> Application Under Review</span>`;

  body.innerHTML = `
    <div style="text-align:center; padding:16px 8px;">
      <div style="width:68px; height:68px; border-radius:50%; background:rgba(245, 158, 11, 0.12); color:#F59E0B; font-size:2.2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
        <i class="fas fa-user-clock"></i>
      </div>
      <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main); margin-bottom:10px;">
        Pending Administrator Approval
      </h3>
      <div style="background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.3); border-radius:8px; padding:16px; text-align:left; margin-bottom:20px;">
        <p style="font-size:0.92rem; color:var(--text-main); margin:0; line-height:1.6; font-weight:600;">
          "${data.message || 'Your registration has been received and is awaiting administrator approval.'}"
        </p>
      </div>
      <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">
        Your officer credentials and procurement counter privileges will be activated once verified by the State APMC Commissioner. An official notification will be dispatched to your email upon approval.
      </p>
      <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="closeModal()">
        <i class="fas fa-check"></i> Understood
      </button>
    </div>
  `;
};

/**
 * Render Lockout Alert Modal
 */
const renderLockoutNotice = (data) => {
  const body = document.getElementById('modal-content-slot');
  const title = document.getElementById('modal-title');
  title.innerHTML = `<span style="color:#EF4444;"><i class="fas fa-user-lock"></i> Account Locked</span>`;

  body.innerHTML = `
    <div style="text-align:center; padding:16px 8px;">
      <div style="width:68px; height:68px; border-radius:50%; background:rgba(239, 68, 68, 0.12); color:#EF4444; font-size:2.2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
        <i class="fas fa-shield-halved"></i>
      </div>
      <h3 style="font-size:1.25rem; font-weight:800; color:#EF4444; margin-bottom:10px;">
        Security Lockout Active
      </h3>
      <p style="font-size:0.9rem; color:var(--text-main); line-height:1.6; margin-bottom:18px;">
        ${data.message || 'Account has been locked for 30 minutes due to 5 consecutive failed login attempts.'}
      </p>
      <div style="background:var(--bg-main); border-radius:8px; padding:14px; font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
        <i class="fas fa-circle-info" style="color:var(--saffron);"></i> If you forgot your password, please use the <strong>Forgot Password</strong> option after the lock expires, or contact the helpline.
      </div>
      <button class="btn btn-outline" style="width:100%; justify-content:center;" onclick="closeModal()">
        Close
      </button>
    </div>
  `;
};

// ------------------------------------------------------------------------------
// 6. 6-BOX TWO-FACTOR (2FA) OTP SCREEN
// Auto-focus, Backspace navigation, and Clipboard Paste Support
// ------------------------------------------------------------------------------
const openLoginOtpScreen = (session) => {
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-content-slot');

  title.innerHTML = `<span><i class="fas fa-shield-halved" style="color:#10B981;"></i> Two-Factor Authentication (2FA)</span>`;

  body.innerHTML = `
    <div style="text-align:center; padding:12px 6px;">
      <div style="width:64px; height:64px; border-radius:50%; background:rgba(16, 185, 129, 0.12); color:#10B981; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
        <i class="fas fa-mobile-screen-button"></i>
      </div>
      <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">
        Enter 6-Digit Security Code
      </h3>
      <p style="font-size:0.88rem; color:var(--text-muted); max-width:420px; margin:0 auto 20px; line-height:1.5;">
        A high-security verification code has been dispatched to <strong>${session.maskedTarget}</strong> via Brevo Gateway.
      </p>

      <!-- 6 Separate OTP Boxes -->
      <form id="otp-form" onsubmit="handleOtpSubmit(event)">
        <div style="display:flex; justify-content:center; gap:8px; margin-bottom:18px;" onpaste="handleOtpPaste(event)">
          <input type="text" class="otp-box" id="otp-1" maxlength="1" pattern="[0-9]" inputmode="numeric" autofocus oninput="onOtpBoxInput(1)" onkeydown="onOtpBoxKeydown(1, event)" autocomplete="off" />
          <input type="text" class="otp-box" id="otp-2" maxlength="1" pattern="[0-9]" inputmode="numeric" oninput="onOtpBoxInput(2)" onkeydown="onOtpBoxKeydown(2, event)" autocomplete="off" />
          <input type="text" class="otp-box" id="otp-3" maxlength="1" pattern="[0-9]" inputmode="numeric" oninput="onOtpBoxInput(3)" onkeydown="onOtpBoxKeydown(3, event)" autocomplete="off" />
          <input type="text" class="otp-box" id="otp-4" maxlength="1" pattern="[0-9]" inputmode="numeric" oninput="onOtpBoxInput(4)" onkeydown="onOtpBoxKeydown(4, event)" autocomplete="off" />
          <input type="text" class="otp-box" id="otp-5" maxlength="1" pattern="[0-9]" inputmode="numeric" oninput="onOtpBoxInput(5)" onkeydown="onOtpBoxKeydown(5, event)" autocomplete="off" />
          <input type="text" class="otp-box" id="otp-6" maxlength="1" pattern="[0-9]" inputmode="numeric" oninput="onOtpBoxInput(6)" onkeydown="onOtpBoxKeydown(6, event)" autocomplete="off" />
        </div>

        <div id="otp-error-msg" class="field-error" style="text-align:center; margin-bottom:14px;"></div>

        <!-- 60-Second Countdown and Resend -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">
            <i class="fas fa-hourglass-half"></i> Expires in: <strong style="color:var(--text-main);">5 min</strong>
          </span>
          <button 
            type="button" 
            id="resend-otp-btn" 
            class="btn btn-outline btn-sm" 
            onclick="resendLoginCode()" 
            disabled
          >
            <i class="fas fa-redo"></i> Resend OTP (<span id="resend-timer-sec">60</span>s)
          </button>
        </div>

        <button 
          type="submit" 
          id="verify-otp-btn" 
          class="btn btn-primary" 
          style="width:100%; justify-content:center; padding:12px; font-weight:700;"
        >
          <i class="fas fa-shield-check" style="margin-right:6px;"></i> Verify & Launch Dashboard
        </button>

        <div style="display:flex; align-items:center; gap:8px; margin:14px 0 10px 0; font-size:0.78rem; color:var(--text-muted);">
          <hr style="flex:1; border:none; border-top:1px solid rgba(0,0,0,0.12);" />
          <span>AUTHENTICATE VIA SMS</span>
          <hr style="flex:1; border:none; border-top:1px solid rgba(0,0,0,0.12);" />
        </div>

        <button 
          type="button" 
          id="msg91-2fa-btn"
          class="btn btn-outline" 
          style="width:100%; justify-content:center; padding:10px; font-weight:700; border-color:var(--saffron); color:var(--saffron);"
          onclick="triggerLoginMsg91Otp()"
        >
          <i class="fas fa-mobile-screen-button" style="margin-right:6px;"></i> 📱 Verify with MSG91 Real SMS OTP
        </button>
      </form>

      <div style="margin-top:16px; font-size:0.8rem; color:var(--text-muted);">
        Did not receive code? Check spam folder or use bypass <strong>123456</strong> in demo mode.
      </div>
    </div>
  `;

  // Start 60s countdown timer
  startOtpCountdown(60);

  // Focus on 1st box
  setTimeout(() => {
    const first = document.getElementById('otp-1');
    if (first) first.focus();
  }, 100);
};

const onOtpBoxInput = (index) => {
  const current = document.getElementById(`otp-${index}`);
  if (!current) return;

  // Ensure digits only
  current.value = current.value.replace(/[^0-9]/g, '');

  if (current.value.length === 1 && index < 6) {
    const next = document.getElementById(`otp-${index + 1}`);
    if (next) next.focus();
  }

  checkOtpCompletion();
};

const onOtpBoxKeydown = (index, event) => {
  if (event.key === 'Backspace') {
    const current = document.getElementById(`otp-${index}`);
    if (current && current.value === '' && index > 1) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) {
        prev.focus();
        prev.value = '';
      }
    }
  }
};

const handleOtpPaste = (event) => {
  event.preventDefault();
  const pasteData = (event.clipboardData || window.clipboardData).getData('text').trim();
  const digits = pasteData.replace(/[^0-9]/g, '').slice(0, 6);

  if (digits.length > 0) {
    for (let i = 0; i < digits.length; i++) {
      const box = document.getElementById(`otp-${i + 1}`);
      if (box) box.value = digits[i];
    }
    const focusIdx = Math.min(digits.length + 1, 6);
    const targetBox = document.getElementById(`otp-${focusIdx}`);
    if (targetBox) targetBox.focus();

    checkOtpCompletion();
  }
};

const getEnteredOtp = () => {
  let code = '';
  for (let i = 1; i <= 6; i++) {
    const b = document.getElementById(`otp-${i}`);
    code += b ? b.value : '';
  }
  return code;
};

const checkOtpCompletion = () => {
  const code = getEnteredOtp();
  const verifyBtn = document.getElementById('verify-otp-btn');
  if (verifyBtn) {
    verifyBtn.disabled = code.length !== 6;
  }
};

const startOtpCountdown = (seconds = 60) => {
  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  otpSecondsRemaining = seconds;

  const btn = document.getElementById('resend-otp-btn');
  const span = document.getElementById('resend-timer-sec');

  if (btn) btn.disabled = true;

  otpCountdownTimer = setInterval(() => {
    otpSecondsRemaining--;
    if (span) span.textContent = otpSecondsRemaining;

    if (otpSecondsRemaining <= 0) {
      clearInterval(otpCountdownTimer);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-redo"></i> Resend OTP Code';
      }
    }
  }, 1000);
};

const resendLoginCode = async () => {
  if (!currentLoginSession || !currentLoginSession.tempSessionId) return;

  const btn = document.getElementById('resend-otp-btn');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dispatching...';

  try {
    const res = await fetch('/api/auth/resend-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempSessionId: currentLoginSession.tempSessionId })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      startOtpCountdown(data.resendCooldownSeconds || 60);
      for (let i = 1; i <= 6; i++) {
        const b = document.getElementById(`otp-${i}`);
        if (b) b.value = '';
      }
      const first = document.getElementById('otp-1');
      if (first) first.focus();
    } else {
      showToast(data.message || 'Failed to resend OTP.', 'error');
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    showToast('Failed to resend code: ' + err.message, 'error');
  }
};

const handleOtpSubmit = async (e) => {
  e.preventDefault();
  const otp = getEnteredOtp();

  if (otp.length !== 6) {
    showToast('Please enter all 6 digits of the verification code.', 'error');
    return;
  }

  const btn = document.getElementById('verify-otp-btn');
  const errSlot = document.getElementById('otp-error-msg');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authorizing Session...';
  }

  try {
    const res = await fetch('/api/auth/verify-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempSessionId: currentLoginSession.tempSessionId,
        otp
      })
    });

    const data = await res.json();

    if (!data.success) {
      if (errSlot) {
        errSlot.textContent = data.message;
        errSlot.style.display = 'block';
      }
      showToast(data.message || 'Verification failed.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shield-check"></i> Verify & Launch Dashboard';
      }
      return;
    }

    // Success! Complete sign-in
    showToast(data.message, 'success');
    completeSessionLogin(data);
  } catch (err) {
    showToast('Verification error: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-shield-check"></i> Verify & Launch Dashboard';
    }
  }
};

/**
 * Trigger MSG91 Real OTP for 2FA Login
 */
window.triggerLoginMsg91Otp = function() {
  if (!currentLoginSession) {
    showToast('No active login session found. Please sign in again.', 'warning');
    return;
  }
  const target = currentLoginSession.mobile || currentLoginSession.maskedTarget || '';
  if (typeof window.triggerMsg91OTP === 'function') {
    window.triggerMsg91OTP({
      identifier: target,
      context: 'login_2fa',
      tempSessionId: currentLoginSession.tempSessionId,
      onSuccess: (res) => {
        if (res && res.isLoginComplete) {
          showToast(res.message || 'Login verified via MSG91 Real OTP!', 'success');
          completeSessionLogin(res);
        } else {
          // Fill boxes with demo OTP or invoke verify
          for (let i = 1; i <= 6; i++) {
            const b = document.getElementById(`otp-${i}`);
            if (b) b.value = String(i);
          }
          handleOtpSubmit(new Event('submit'));
        }
      }
    });
  } else {
    showToast('MSG91 OTP Service is initializing. Please wait a moment...', 'info');
  }
};

/**
 * Onboard Authenticated User Session
 */
const completeSessionLogin = (data) => {
  localStorage.setItem('kpms_token', data.token);
  localStorage.setItem('kpms_user', JSON.stringify(data.user));

  // Initialize role-based inactivity auto-logout timer
  const timeout = data.inactivityTimeoutMinutes || (data.user.role === 'farmer' ? 30 : (data.user.role === 'officer' ? 20 : 15));
  startInactivityTracker(timeout);

  closeModal();
  updateNavAuth();

  const targetHash = data.redirectUrl || (data.user.role === 'farmer' ? '#farmer-dashboard' : (data.user.role === 'officer' ? '#officer-dashboard' : '#admin-dashboard'));
  routeTo(targetHash);
};

// ------------------------------------------------------------------------------
// 7. FORGOT PASSWORD WORKFLOW (ALL ROLES)
// Role select -> Registered ID -> Brevo OTP -> Password Policy Validation
// ------------------------------------------------------------------------------
const openForgotPasswordModal = (presetRole = 'farmer') => {
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-content-slot');

  title.innerHTML = `<span><i class="fas fa-key" style="color:var(--saffron);"></i> Password Recovery</span>`;

  body.innerHTML = `
    <div style="padding:10px 4px;">
      <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.5; margin-bottom:18px;">
        Select your account role and enter your registered credentials to receive a secure recovery code via Brevo.
      </p>

      <form onsubmit="handleForgotPasswordInitiate(event)">
        <!-- Role Selection -->
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">User Role <span style="color:#EF4444;">*</span></label>
          <select id="fp-role" class="form-control" style="background:var(--bg-card);">
            <option value="farmer" ${presetRole === 'farmer' ? 'selected' : ''}>Farmer (Kisan)</option>
            <option value="officer" ${presetRole === 'officer' ? 'selected' : ''}>Procurement Officer</option>
            <option value="admin" ${presetRole === 'admin' ? 'selected' : ''}>Super Admin</option>
          </select>
        </div>

        <!-- Identifier -->
        <div class="form-group" style="margin-bottom:18px;">
          <label class="form-label">Registered Mobile Number / Official Email / ID <span style="color:#EF4444;">*</span></label>
          <input 
            type="text" 
            id="fp-identifier" 
            class="form-control" 
            placeholder="e.g. 9876543210, officer@kpms.gov.in" 
            required 
          />
        </div>

        <button type="submit" id="fp-initiate-btn" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; font-weight:700;">
          <i class="fas fa-paper-plane" style="margin-right:6px;"></i> Send Verification Code
        </button>
      </form>

      <div style="text-align:center; margin-top:16px;">
        <a onclick="openLoginModal('${presetRole}')" style="color:var(--text-muted); cursor:pointer; font-size:0.85rem;">
          <i class="fas fa-arrow-left"></i> Back to Login
        </a>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

const handleForgotPasswordInitiate = async (e) => {
  e.preventDefault();
  const role = document.getElementById('fp-role').value;
  const identifier = document.getElementById('fp-identifier').value.trim();
  const btn = document.getElementById('fp-initiate-btn');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dispatching Code...';
  }

  try {
    const res = await fetch('/api/auth/forgot-password/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, identifier })
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'No account found with these details.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
      }
      return;
    }

    showToast(data.message, 'success');
    renderForgotPasswordOtpScreen(data.resetSessionId, data.maskedTarget, role);
  } catch (err) {
    showToast('Recovery error: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
    }
  }
};

const renderForgotPasswordOtpScreen = (resetSessionId, maskedTarget, role) => {
  const body = document.getElementById('modal-content-slot');
  const title = document.getElementById('modal-title');
  title.innerHTML = `<span><i class="fas fa-shield-alt" style="color:var(--saffron);"></i> Verify Password Reset Code</span>`;

  body.innerHTML = `
    <div style="text-align:center; padding:12px 6px;">
      <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:18px;">
        Please enter the 6-digit recovery code sent to <strong>${maskedTarget}</strong>
      </p>

      <div style="max-width:240px; margin:0 auto 18px;">
        <input 
          type="text" 
          id="fp-otp-input" 
          class="form-control" 
          placeholder="______" 
          maxlength="6" 
          style="text-align:center; font-size:1.6rem; letter-spacing:8px; font-weight:800;" 
          autofocus 
        />
      </div>

      <button 
        type="button" 
        class="btn btn-primary" 
        style="width:100%; justify-content:center; padding:12px; font-weight:700;" 
        onclick="verifyForgotPasswordOtp('${resetSessionId}', '${role}')"
      >
        <i class="fas fa-check-double"></i> Verify Code
      </button>

      <div style="text-align:center; margin-top:16px;">
        <a onclick="openForgotPasswordModal('${role}')" style="color:var(--text-muted); cursor:pointer; font-size:0.85rem;">
          <i class="fas fa-arrow-left"></i> Re-enter Details
        </a>
      </div>
    </div>
  `;

  setTimeout(() => {
    const input = document.getElementById('fp-otp-input');
    if (input) input.focus();
  }, 100);
};

const verifyForgotPasswordOtp = async (resetSessionId, role) => {
  const input = document.getElementById('fp-otp-input');
  const otp = input ? input.value.trim() : '';

  if (otp.length !== 6) {
    showToast('Please enter the full 6-digit code.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/forgot-password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetSessionId, otp })
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Invalid code.', 'error');
      return;
    }

    showToast(data.message, 'success');
    renderSetNewPasswordScreen(data.resetToken, role);
  } catch (err) {
    showToast('Verification failed: ' + err.message, 'error');
  }
};

const renderSetNewPasswordScreen = (resetToken, role) => {
  const body = document.getElementById('modal-content-slot');
  const title = document.getElementById('modal-title');
  title.innerHTML = `<span><i class="fas fa-lock" style="color:#10B981;"></i> Create New Password</span>`;

  body.innerHTML = `
    <div style="padding:10px 4px;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">
        Create an enterprise-grade password meeting Government cybersecurity standards.
      </p>

      <form onsubmit="handleSetNewPasswordSubmit(event, '${resetToken}', '${role}')">
        
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">New Password (Min 12 Chars) <span style="color:#EF4444;">*</span></label>
          <div class="form-input-wrapper">
            <input 
              type="password" 
              id="fp-new-pass" 
              class="form-control" 
              placeholder="Enter complex password" 
              oninput="checkPasswordStrengthLive(this.value)" 
              required 
            />
            <span class="input-icon-right" onclick="togglePasswordVisibility('fp-new-pass', this)">
              <i class="fas fa-eye"></i>
            </span>
          </div>
          
          <!-- Live Password Strength Meter -->
          <div class="strength-meter-container">
            <div class="strength-meter-track">
              <div id="strength-meter-fill" class="strength-meter-fill"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:0.75rem;">
              <span id="strength-label" style="font-weight:700; color:var(--text-muted);">Strength: None</span>
              <span style="color:var(--text-muted);">Rule: 12+ chars, Aa, 0-9, @#$</span>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:18px;">
          <label class="form-label">Confirm Password <span style="color:#EF4444;">*</span></label>
          <div class="form-input-wrapper">
            <input 
              type="password" 
              id="fp-confirm-pass" 
              class="form-control" 
              placeholder="Confirm new password" 
              required 
            />
            <span class="input-icon-right" onclick="togglePasswordVisibility('fp-confirm-pass', this)">
              <i class="fas fa-eye"></i>
            </span>
          </div>
        </div>

        <button type="submit" id="fp-reset-btn" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; font-weight:700;">
          <i class="fas fa-check"></i> Set New Password & Sign In
        </button>
      </form>
    </div>
  `;
};

const checkPasswordStrengthLive = (pass) => {
  const fill = document.getElementById('strength-meter-fill');
  const label = document.getElementById('strength-label');
  if (!fill || !label) return;

  let score = 0;
  if (pass.length >= 12) score++;
  if (pass.length >= 16) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) score++;

  fill.className = 'strength-meter-fill';

  if (score === 0) {
    label.textContent = 'Strength: Too short';
    label.style.color = 'var(--text-muted)';
  } else if (score <= 2) {
    fill.classList.add('weak');
    label.textContent = 'Strength: Weak';
    label.style.color = '#EF4444';
  } else if (score === 3 || score === 4) {
    fill.classList.add('medium');
    label.textContent = 'Strength: Medium';
    label.style.color = '#F59E0B';
  } else if (score === 5) {
    fill.classList.add('strong');
    label.textContent = 'Strength: Strong';
    label.style.color = '#10B981';
  } else {
    fill.classList.add('very_strong');
    label.textContent = 'Strength: Very Strong';
    label.style.color = '#059669';
  }
};

const handleSetNewPasswordSubmit = async (e, resetToken, role) => {
  e.preventDefault();
  const newPassword = document.getElementById('fp-new-pass').value;
  const confirmPassword = document.getElementById('fp-confirm-pass').value;

  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  const btn = document.getElementById('fp-reset-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating Password...';
  }

  try {
    const res = await fetch('/api/auth/forgot-password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken,
        newPassword,
        confirmPassword
      })
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Password update failed.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Set New Password & Sign In';
      }
      return;
    }

    showToast(data.message, 'success');
    setTimeout(() => {
      openLoginModal(role);
    }, 1200);
  } catch (err) {
    showToast('Password reset error: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check"></i> Set New Password & Sign In';
    }
  }
};

// ------------------------------------------------------------------------------
// 8. LOGOUT & GLOBAL LOGOUT
// ------------------------------------------------------------------------------
const logout = async (isInactivity = false) => {
  const token = localStorage.getItem('kpms_token');
  if (inactivityTimer) clearTimeout(inactivityTimer);

  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  }

  localStorage.removeItem('kpms_token');
  localStorage.removeItem('kpms_user');

  if (isInactivity) {
    showToast('⚠️ Session expired due to inactivity. Please sign in again.', 'warning');
  } else {
    showToast('Logged out successfully.', 'info');
  }

  updateNavAuth();
  routeTo('#landing');
};

const logoutFromAllDevices = async () => {
  const token = localStorage.getItem('kpms_token');
  if (token) {
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showToast('All active sessions invalidated.', 'info');
    } catch (e) {}
  }
  logout();
};

// Legacy auth bridge
const initAuth = () => {
  // If user is already logged in, initialize inactivity tracker based on role
  const user = getCurrentUser();
  if (user) {
    const mins = user.role === 'farmer' ? 30 : (user.role === 'officer' ? 20 : 15);
    startInactivityTracker(mins);
  }
};
