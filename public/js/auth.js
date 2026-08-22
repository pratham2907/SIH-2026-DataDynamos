// Authentication & KYC Manager
let regCurrentStep = 1;
let registrationFormData = new FormData();
let pendingMobileForOtp = '';

const initAuth = () => {
  // Quick Demo Login buttons
  document.querySelectorAll('[data-demo-login]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const role = btn.getAttribute('data-demo-login');
      demoLogin(role);
    });
  });
};

const demoLogin = async (role) => {
  let identifier = 'ramesh@farmer.in';
  let password = 'Kisan@123';

  if (role === 'officer') {
    identifier = 'officer@kpms.gov.in';
    password = 'Officer@123';
  } else if (role === 'admin') {
    identifier = 'admin@kpms.gov.in';
    password = 'Admin@123';
  }

  showToast(`Logging in as Demo ${role.toUpperCase()}...`, 'info');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('kpms_token', data.token);
      localStorage.setItem('kpms_user', JSON.stringify(data.user));
      showToast(`Welcome ${data.user.name}!`, 'success');
      closeModal();
      routeTo(data.user.role === 'farmer' ? '#farmer-dashboard' : (data.user.role === 'officer' ? '#officer-dashboard' : '#admin-dashboard'));
      updateNavAuth();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
};

const handleLoginForm = async (e) => {
  e.preventDefault();
  const form = e.target;
  const identifier = form.identifier.value;
  const password = form.password.value;
  const role = form.role ? form.role.value : null;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('kpms_token', data.token);
      localStorage.setItem('kpms_user', JSON.stringify(data.user));
      showToast(`Login Successful! Welcome, ${data.user.name}`, 'success');
      closeModal();
      routeTo(data.user.role === 'farmer' ? '#farmer-dashboard' : (data.user.role === 'officer' ? '#officer-dashboard' : '#admin-dashboard'));
      updateNavAuth();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Login error: ' + err.message, 'error');
  }
};

const nextRegStep = (step) => {
  // Save current step inputs to FormData
  const stepForm = document.getElementById(`reg-step-${regCurrentStep}`);
  if (stepForm) {
    const inputs = stepForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.type === 'file') {
        if (input.files[0]) {
          registrationFormData.set(input.name, input.files[0]);
        }
      } else if (input.type === 'checkbox') {
        registrationFormData.set(input.name, input.checked);
      } else {
        registrationFormData.set(input.name, input.value);
      }
    });
  }

  // Update UI
  document.querySelectorAll('.reg-step-container').forEach(el => el.style.display = 'none');
  const nextContainer = document.getElementById(`reg-step-${step}`);
  if (nextContainer) nextContainer.style.display = 'block';

  document.querySelectorAll('.step-item').forEach((el, idx) => {
    el.classList.remove('active');
    if (idx + 1 < step) el.classList.add('completed');
    if (idx + 1 === step) el.classList.add('active');
  });

  regCurrentStep = step;
};

const submitRegistration = async () => {
  // Capture Step 5 inputs
  nextRegStep(5);
  showToast('Submitting Farmer Registration & KYC...', 'info');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: registrationFormData
    });
    const data = await res.json();
    if (data.success) {
      pendingMobileForOtp = data.data.mobile;
      showToast('Registration received! Please enter verification OTP.', 'success');
      openOtpModal(data.data.demoOtp);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Registration error: ' + err.message, 'error');
  }
};

const openOtpModal = (demoOtp) => {
  closeModal();
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Farmer OTP Verification';

  body.innerHTML = `
    <div style="text-align:center; padding: 10px;">
      <div style="font-size:3rem; color:var(--green-gov); margin-bottom:12px;"><i class="fas fa-shield-alt"></i></div>
      <h4>Verify Mobile Number</h4>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:18px;">
        A 6-digit OTP has been dispatched to <strong>${pendingMobileForOtp}</strong>
      </p>
      ${demoOtp ? `<div style="background:#FEF3C7; color:#92400E; padding:8px; border-radius:6px; font-size:0.85rem; margin-bottom:16px; font-weight:600;">Demo Verification OTP: ${demoOtp}</div>` : ''}
      <form onsubmit="handleOtpSubmit(event)">
        <div class="form-group" style="max-width:240px; margin:0 auto 20px;">
          <input type="text" id="otp-input-field" class="form-control" placeholder="Enter 6-digit OTP" maxlength="6" style="text-align:center; font-size:1.4rem; letter-spacing:6px; font-weight:700;" value="${demoOtp || ''}" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">Verify & Activate Account</button>
      </form>
    </div>
  `;
  modal.classList.add('active');
};

const handleOtpSubmit = async (e) => {
  e.preventDefault();
  const otp = document.getElementById('otp-input-field').value;
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: pendingMobileForOtp, otp })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('kpms_token', data.token);
      localStorage.setItem('kpms_user', JSON.stringify(data.user));
      showToast('Account activated successfully!', 'success');
      closeModal();
      routeTo('#farmer-dashboard');
      updateNavAuth();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Verification failed: ' + err.message, 'error');
  }
};

const logout = () => {
  localStorage.removeItem('kpms_token');
  localStorage.removeItem('kpms_user');
  showToast('Logged out successfully.', 'info');
  routeTo('#landing');
  updateNavAuth();
};
