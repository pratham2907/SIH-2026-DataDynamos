/**
 * Production-Ready Multi-Role Registration Engine (SIH 2026)
 * - Farmer Registration (7 Steps + AI OCR + Brevo OTP + PDF Receipt)
 * - Procurement Officer Registration (7 Steps + Identity + OTP + Admin Approval)
 * - Super Admin First-Time Setup Wizard (6 Steps + Permanent Lock Protection)
 */

// In-Memory state for active wizard
let currentRegType = 'farmer'; // 'farmer' | 'officer' | 'superadmin'
let currentRegStep = 1;
let totalRegSteps = 7;
let regDraftData = {
  farmer: {},
  officer: {},
  superadmin: {}
};
let verifiedDocs = {
  farmer: {},
  officer: {},
  superadmin: {}
};
let activeTempId = '';
let otpCountdownInterval = null;
let otpSecondsLeft = 60;

// State & District database for searchable dropdowns
const INDIA_LOCATIONS = {
  "Madhya Pradesh": {
    "Bhopal": { talukas: ["Huzur", "Berasia"], villages: ["Ratibad", "Karond", "Bairagarh", "Kolar", "Sukhi Sewaniya"] },
    "Sehore": { talukas: ["Sehore", "Ashta", "Ichhawar"], villages: ["Bilkisganj", "Doraha", "Shyampur", "Mandi"] },
    "Raisen": { talukas: ["Raisen", "Gairatganj", "Begamganj"], villages: ["Sanchi", "Salamatpur", "Deewanganj"] },
    "Indore": { talukas: ["Indore", "Sanwer", "Depalpur", "Mhow"], villages: ["Rau", "Betma", "Manglia", "Hatod"] },
    "Ujjain": { talukas: ["Ujjain", "Tarana", "Mahidpur", "Nagda"], villages: ["Tajpur", "Panbihar", "Ghattia"] }
  },
  "Maharashtra": {
    "Nashik": { talukas: ["Nashik", "Niphad", "Sinnar", "Dindori"], villages: ["Pimpalgaon", "Lasalgaon", "Ozar", "Deolali"] },
    "Pune": { talukas: ["Haveli", "Baramati", "Shirur", "Junnar"], villages: ["Manchar", "Narayangaon", "Uruli Kanchan"] },
    "Nagpur": { talukas: ["Nagpur", "Katol", "Saoner", "Umred"], villages: ["Kalmeshwar", "Bhiwapur", "Kuhi"] }
  },
  "Punjab": {
    "Ludhiana": { talukas: ["Ludhiana East", "Ludhiana West", "Jagraon", "Khanna"], villages: ["Samrala", "Sahnewal", "Doraha"] },
    "Patiala": { talukas: ["Patiala", "Nabha", "Rajpura", "Samana"], villages: ["Sanaur", "Ghagga", "Bhadson"] }
  },
  "Uttar Pradesh": {
    "Varanasi": { talukas: ["Varanasi", "Pindra"], villages: ["Raja Talab", "Cholapur", "Kashi"] },
    "Lucknow": { talukas: ["Lucknow", "Malihabad", "Bakshi Ka Talab"], villages: ["Kakori", "Mohanlalganj", "Gosainganj"] }
  }
};

/**
 * Open Multi-Role Registration Chooser
 */
const openRegistrationChooser = async () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Government of India • Procurement Registration Portal';

  // Check Super Admin status
  let superAdminAvailable = false;
  try {
    const res = await fetch('/api/registration/superadmin-status');
    const json = await res.json();
    superAdminAvailable = json.setupAvailable;
  } catch (e) {}

  body.innerHTML = `
    <div style="padding:10px 0;">
      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:2.2rem; margin-bottom:6px;">🌾</div>
        <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Select Registration Portal</h3>
        <p style="color:var(--text-muted); font-size:0.88rem;">National Kisan Procurement Management System (KPMS)</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr; gap:14px;">
        <!-- Option 1: Farmer Registration -->
        <div class="glass-card" onclick="startRegistrationFlow('farmer')" style="cursor:pointer; padding:18px; border:2px solid transparent; transition:all 0.2s ease; display:flex; align-items:center; gap:16px;" onmouseover="this.style.borderColor='var(--saffron)'" onmouseout="this.style.borderColor='transparent'">
          <div style="width:52px; height:52px; border-radius:12px; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
            👨‍🌾
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">Farmer Registration</h4>
              <span class="status-pill active" style="font-size:0.75rem;">7-Step Onboarding</span>
            </div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              For agricultural producers. Guaranteed mandi slot booking, verified records & direct DBT MSP payouts.
            </p>
          </div>
          <i class="fas fa-arrow-right" style="color:var(--saffron);"></i>
        </div>

        <!-- Option 2: Procurement Officer Registration -->
        <div class="glass-card" onclick="startRegistrationFlow('officer')" style="cursor:pointer; padding:18px; border:2px solid transparent; transition:all 0.2s ease; display:flex; align-items:center; gap:16px;" onmouseover="this.style.borderColor='#2563EB'" onmouseout="this.style.borderColor='transparent'">
          <div style="width:52px; height:52px; border-radius:12px; background:rgba(37,99,235,0.12); color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
            👮
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">Procurement Officer Registration</h4>
              <span class="status-pill pending" style="font-size:0.75rem;">Govt Approval Required</span>
            </div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              For state APMC & mandi officers. Multi-level credential validation, centre assignment & admin approval.
            </p>
          </div>
          <i class="fas fa-arrow-right" style="color:#2563EB;"></i>
        </div>

        <!-- Option 3: Super Admin First-Time Setup Wizard -->
        <div class="glass-card" onclick="startRegistrationFlow('superadmin', ${superAdminAvailable})" style="cursor:pointer; padding:18px; border:2px solid transparent; transition:all 0.2s ease; display:flex; align-items:center; gap:16px; ${!superAdminAvailable ? 'opacity:0.75;' : ''}" onmouseover="this.style.borderColor='var(--green-gov)'" onmouseout="this.style.borderColor='transparent'">
          <div style="width:52px; height:52px; border-radius:12px; background:rgba(19,136,8,0.12); color:var(--green-gov); display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
            🏛️
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">Super Admin Setup Wizard</h4>
              <span class="status-pill ${superAdminAvailable ? 'completed' : 'rejected'}" style="font-size:0.75rem;">
                ${superAdminAvailable ? 'Initial Setup Available' : 'Permanently Locked'}
              </span>
            </div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              ${superAdminAvailable
                ? 'First-time setup for the national root administrative authority.'
                : 'A Super Admin is already configured. Authorized logins only.'}
            </p>
          </div>
          <i class="fas ${superAdminAvailable ? 'fa-arrow-right' : 'fa-lock'}" style="color:var(--green-gov);"></i>
        </div>
      </div>

      <div style="text-align:center; margin-top:20px; font-size:0.85rem; color:var(--text-muted);">
        Already registered? <a onclick="closeModal(); openLoginModal();" style="color:var(--saffron); font-weight:700; cursor:pointer;">Sign in here</a>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

/**
 * Route into selected registration flow
 */
const startRegistrationFlow = async (type, isSuperAdminAvailable = true) => {
  currentRegType = type;
  currentRegStep = 1;
  totalRegSteps = (type === 'superadmin') ? 6 : 7;

  if (type === 'superadmin' && !isSuperAdminAvailable) {
    // Show locked banner
    const body = document.getElementById('modal-content-slot');
    body.innerHTML = `
      <div style="text-align:center; padding:30px 15px;">
        <div style="font-size:3rem; margin-bottom:12px; color:#EF4444;"><i class="fas fa-shield-halved"></i></div>
        <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:8px;">Super Admin Setup Locked</h3>
        <p style="color:var(--text-muted); font-size:0.95rem; max-width:440px; margin:0 auto 24px auto;">
          A Super Admin account has already been configured for this KPMS instance. Self-registration is permanently disabled under security policy.
        </p>
        <button class="btn btn-navy" onclick="closeModal(); openLoginModal('admin');">
          <i class="fas fa-lock"></i> Go to Authorized Admin Login
        </button>
      </div>
    `;
    return;
  }

  renderRegistrationWizard();
};

/**
 * Render Main Dynamic Registration Wizard
 */
const renderRegistrationWizard = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');

  let title = 'Farmer Registration (7 Steps)';
  if (currentRegType === 'officer') title = 'Procurement Officer Registration';
  if (currentRegType === 'superadmin') title = 'Super Admin First-Time Setup Wizard';
  document.getElementById('modal-title').textContent = title;

  // Step definitions
  let stepTitles = [];
  if (currentRegType === 'farmer') {
    stepTitles = [
      'Personal Details',
      'Address',
      'Bank Details',
      'Land & Crop',
      'Document Verification',
      'Review',
      'OTP Verification'
    ];
  } else if (currentRegType === 'officer') {
    stepTitles = [
      'Personal Details',
      'Govt Employment',
      'Procurement Centre',
      'Identity Details',
      'Document Verification',
      'Review & Declaration',
      'OTP Verification'
    ];
  } else {
    stepTitles = [
      'Organization Details',
      'Super Admin Details',
      'Identity Verification',
      'Credentials',
      'Review & Confirmation',
      'OTP Verification'
    ];
  }

  const progressPercent = Math.round((currentRegStep / totalRegSteps) * 100);

  let stepsHeaderHtml = `
    <div style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:0.85rem; font-weight:700; color:var(--primary-navy);">
          Step ${currentRegStep} of ${totalRegSteps}: ${stepTitles[currentRegStep - 1]}
        </span>
        <span style="font-size:0.85rem; font-weight:700; color:var(--saffron);">${progressPercent}% Completed</span>
      </div>
      <div style="height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
        <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, var(--saffron), var(--green-gov)); transition:width 0.3s ease;"></div>
      </div>
    </div>
  `;

  let stepBodyHtml = '';
  if (currentRegType === 'farmer') {
    stepBodyHtml = getFarmerStepHtml(currentRegStep);
  } else if (currentRegType === 'officer') {
    stepBodyHtml = getOfficerStepHtml(currentRegStep);
  } else {
    stepBodyHtml = getSuperAdminStepHtml(currentRegStep);
  }

  body.innerHTML = `
    <div>
      ${stepsHeaderHtml}
      <div id="reg-wizard-container">
        ${stepBodyHtml}
      </div>
    </div>
  `;

  // Attach dynamic real-time validation listeners
  attachLiveValidationListeners();
};

/**
 * ----------------------------------------------------
 * FARMER STEP HTML BUILDERS
 * ----------------------------------------------------
 */
const getFarmerStepHtml = (step) => {
  const draft = regDraftData.farmer || {};

  if (step === 1) {
    return `
      <form id="farmer-step1-form" onsubmit="event.preventDefault(); validateAndNextFarmer(1);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-user-pen" style="color:var(--saffron);"></i> Step 1: Personal Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Full Name (Alphabets only) *</label>
            <input type="text" id="frm-name" name="fullName" class="form-control" value="${draft.fullName || ''}" placeholder="e.g. Ramesh Shivram Patel" required />
            <div class="field-error" id="err-frm-name"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Father's / Husband's Name *</label>
            <input type="text" id="frm-father" name="fatherName" class="form-control" value="${draft.fatherName || ''}" placeholder="e.g. Shivram Patel" required />
            <div class="field-error" id="err-frm-father"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth (Minimum 18 Years) *</label>
            <input type="date" id="frm-dob" name="dob" class="form-control" value="${draft.dob || '1985-05-15'}" required />
            <div class="field-error" id="err-frm-dob"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Gender *</label>
            <select id="frm-gender" name="gender" class="form-control">
              <option value="Male" ${draft.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${draft.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Other" ${draft.gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label class="form-label" style="margin-bottom:0;">Mobile Number (10 Digits) *</label>
              <button type="button" style="background:none; border:none; color:var(--saffron); font-size:0.75rem; font-weight:700; cursor:pointer; padding:0;" onclick="verifyFarmerMobileViaMsg91()">
                <i class="fas fa-shield-check"></i> Verify via MSG91 OTP
              </button>
            </div>
            <div style="display:flex; gap:6px; margin-top:4px;">
              <input type="tel" id="frm-mobile" name="mobile" maxlength="10" class="form-control" value="${draft.mobile || ''}" placeholder="9876543210" required />
              <button type="button" class="btn btn-outline btn-sm" onclick="verifyFarmerMobileViaMsg91()" title="Verify Mobile via Real SMS OTP" style="white-space:nowrap; border-color:var(--saffron); color:var(--saffron); font-weight:700; padding:4px 10px; font-size:0.78rem;">
                <i class="fas fa-mobile-screen"></i> Real OTP
              </button>
            </div>
            <div id="frm-mobile-verified-badge" style="display:${(window.KPMS_MSG91 && window.KPMS_MSG91.verifiedNumbers && window.KPMS_MSG91.verifiedNumbers.has(draft.mobile)) ? 'flex' : 'none'}; align-items:center; gap:4px; color:#059669; font-size:0.78rem; font-weight:700; margin-top:4px;">
              <i class="fas fa-check-circle"></i> Authenticated via MSG91 Real SMS OTP
            </div>
            <div class="field-error" id="err-frm-mobile"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address (For Brevo OTP) *</label>
            <input type="email" id="frm-email" name="email" class="form-control" value="${draft.email || ''}" placeholder="farmer@example.com" required />
            <div class="field-error" id="err-frm-email"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Aadhaar Number (12 Digits) *</label>
            <input type="text" id="frm-aadhaar" name="aadhaarNumber" maxlength="12" class="form-control" value="${draft.aadhaarNumber || ''}" placeholder="482910482918" required />
            <div class="field-error" id="err-frm-aadhaar"></div>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Portal Account Password *</label>
            <input type="password" id="frm-pass" name="password" class="form-control" value="${draft.password || 'Kisan@123'}" placeholder="Create a secure password" required />
            <div class="field-error" id="err-frm-pass"></div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="openRegistrationChooser()"><i class="fas fa-arrow-left"></i> Change Role</button>
          <button type="submit" id="btn-frm-next-1" class="btn btn-primary">Next: Address Details <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 2) {
    return `
      <form id="farmer-step2-form" onsubmit="event.preventDefault(); validateAndNextFarmer(2);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-location-dot" style="color:var(--saffron);"></i> Step 2: Domicile & Residential Address</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">State *</label>
            <select id="frm-state" name="state" class="form-control" onchange="onStateChange(this.value, 'frm')">
              ${Object.keys(INDIA_LOCATIONS).map(st => `<option value="${st}" ${draft.state === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">District *</label>
            <select id="frm-district" name="district" class="form-control" onchange="onDistrictChange(this.value, 'frm')">
              <!-- Dynamically populated -->
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Taluka / Tehsil *</label>
            <select id="frm-taluka" name="taluka" class="form-control">
              <!-- Dynamically populated -->
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Village / Town *</label>
            <input type="text" id="frm-village" name="village" class="form-control" value="${draft.village || 'Ratibad'}" placeholder="Village Name" required />
            <div class="field-error" id="err-frm-village"></div>
          </div>
          <div class="form-group">
            <label class="form-label">PIN Code (6 Digits) *</label>
            <input type="text" id="frm-pincode" name="pinCode" maxlength="6" class="form-control" value="${draft.pinCode || '462044'}" placeholder="462044" required />
            <div class="field-error" id="err-frm-pincode"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Mandi Centre *</label>
            <select id="frm-center" name="preferredCenterId" class="form-control">
              <option value="CTR-01">APMC Central Mandi Bhopal (CTR-01)</option>
              <option value="CTR-02">Sehore Krishi Upaj Mandi (CTR-02)</option>
              <option value="CTR-03">Hoshangabad Grain Terminal (CTR-03)</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Complete House / Street Address *</label>
            <textarea id="frm-address" name="address" class="form-control" rows="2" placeholder="House number, landmark, street" required>${draft.address || 'House 14, Kisan Basti, Main Road'}</textarea>
            <div class="field-error" id="err-frm-address"></div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" id="btn-frm-next-2" class="btn btn-primary">Next: Bank Details <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 3) {
    return `
      <form id="farmer-step3-form" onsubmit="event.preventDefault(); validateAndNextFarmer(3);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-building-columns" style="color:var(--green-gov);"></i> Step 3: DBT Bank Account Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Account Holder Name (Must match bank passbook) *</label>
            <input type="text" id="frm-acc-name" name="accountHolderName" class="form-control" value="${draft.accountHolderName || draft.fullName || ''}" placeholder="Account holder name" required />
            <div class="field-error" id="err-frm-acc-name"></div>
          </div>
          <div class="form-group">
            <label class="form-label">IFSC Code (e.g. SBIN0001234) *</label>
            <input type="text" id="frm-ifsc" name="ifscCode" maxlength="11" class="form-control" value="${draft.ifscCode || 'SBIN0001234'}" placeholder="SBIN0001234" oninput="lookupIFSC(this.value)" required />
            <div class="field-error" id="err-frm-ifsc"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Bank Name *</label>
            <input type="text" id="frm-bank-name" name="bankName" class="form-control" value="${draft.bankName || 'State Bank of India'}" placeholder="State Bank of India" required />
          </div>
          <div class="form-group">
            <label class="form-label">Branch Name</label>
            <input type="text" id="frm-branch" name="branch" class="form-control" value="${draft.branch || 'Bhopal Main Branch'}" placeholder="Branch name" />
          </div>
          <div class="form-group">
            <label class="form-label">Account Number *</label>
            <input type="password" id="frm-acc-num" name="accountNumber" class="form-control" value="${draft.accountNumber || ''}" placeholder="Enter account number" required />
            <div class="field-error" id="err-frm-acc-num"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Account Number *</label>
            <input type="text" id="frm-acc-confirm" name="confirmAccountNumber" class="form-control" value="${draft.confirmAccountNumber || ''}" placeholder="Re-enter account number" required />
            <div class="field-error" id="err-frm-acc-confirm"></div>
          </div>
        </div>
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; padding:12px; margin-top:12px; font-size:0.85rem; color:#065F46;">
          <i class="fas fa-shield-check"></i> MSP proceeds will be credited directly to this bank account via PFMS Direct Benefit Transfer (DBT).
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" id="btn-frm-next-3" class="btn btn-primary">Next: Land & Crops <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 4) {
    return `
      <form id="farmer-step4-form" onsubmit="event.preventDefault(); validateAndNextFarmer(4);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-wheat-awn" style="color:var(--saffron);"></i> Step 4: Land Record & Crop Declaration</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Survey Number / Gat Number *</label>
            <input type="text" id="frm-survey" name="surveyNumber" class="form-control" value="${draft.surveyNumber || 'SUR-482/1'}" placeholder="SUR-482/1" required />
            <div class="field-error" id="err-frm-survey"></div>
          </div>
          <div class="form-group">
            <label class="form-label">7/12 (Satbara) Certificate Number *</label>
            <input type="text" id="frm-712-num" name="landRecordNumber" class="form-control" value="${draft.landRecordNumber || '7/12-98421'}" placeholder="7/12-98421" required />
            <div class="field-error" id="err-frm-712-num"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Total Land Area (Acres) *</label>
            <input type="number" id="frm-land-area" name="totalLandArea" step="0.1" min="0.1" class="form-control" value="${draft.totalLandArea || 5.0}" oninput="calcRealisticYield()" required />
            <div class="field-error" id="err-frm-land-area"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Ownership Type</label>
            <select id="frm-ownership" name="landOwnershipType" class="form-control">
              <option value="Owned">Sole Owner (Self 7/12)</option>
              <option value="Joint">Joint Family Ownership</option>
              <option value="Leased">Leased / Sharecropper</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Primary Crop Type *</label>
            <select id="frm-crop" name="primaryCrop" class="form-control" onchange="calcRealisticYield()">
              <option value="Wheat (Sharbati)">Wheat (Sharbati) - MSP ₹2,275/qtl</option>
              <option value="Paddy (Basmati)">Paddy (Basmati) - MSP ₹2,203/qtl</option>
              <option value="Gram (Chana)">Gram (Chana) - MSP ₹5,440/qtl</option>
              <option value="Mustard (Sarson)">Mustard (Sarson) - MSP ₹5,650/qtl</option>
              <option value="Soybean">Soybean - MSP ₹4,600/qtl</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Procurement Season</label>
            <input type="text" id="frm-season" name="procurementSeason" class="form-control" value="Rabi 2026-27" readonly />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Expected Production Quantity (Quintals) *</label>
            <input type="number" id="frm-quantity" name="estimatedQuantity" min="1" max="500" class="form-control" value="${draft.estimatedQuantity || 50}" required />
            <small id="yield-helper" style="color:var(--text-muted); font-size:0.8rem;">Realistic estimated limit: ~25 quintals per acre for selected crop.</small>
            <div class="field-error" id="err-frm-quantity"></div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" id="btn-frm-next-4" class="btn btn-primary">Next: Document Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 5) {
    return `
      <div>
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;"><i class="fas fa-file-shield" style="color:var(--green-gov);"></i> Step 5: Document Verification</h4>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">
          Upload official records for real-time digital OCR inspection. Non-matching documents (e.g. PAN, selfies, invalid files) will be rejected automatically.
        </p>

        <!-- 4 Document Upload Cards -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${renderDocUploadZone('aadhaar', 'Aadhaar Card', 'PDF, JPG, PNG (Max 5MB)', 'aadhaar')}
          ${renderDocUploadZone('landRecord', 'Land Record (7/12 Extract)', 'PDF, JPG, PNG (Max 5MB)', 'landRecord')}
          ${renderDocUploadZone('bankPassbook', 'Bank Passbook Copy', 'PDF, JPG, PNG (Max 5MB)', 'bankPassbook')}
          ${renderDocUploadZone('photo', 'Passport Size Photograph', 'JPG, PNG only (Max 2MB - Single Face)', 'photo')}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(4)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" id="btn-frm-next-5" class="btn btn-primary" onclick="validateDocsAndNextFarmer()">
            Next: Review Details <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (step === 6) {
    return getReviewSummaryHtml();
  }

  if (step === 7) {
    return getOTPScreenHtml();
  }

  return '';
};

/**
 * ----------------------------------------------------
 * OFFICER STEP HTML BUILDERS
 * ----------------------------------------------------
 */
const getOfficerStepHtml = (step) => {
  const draft = regDraftData.officer || {};

  if (step === 1) {
    return `
      <form id="officer-step1-form" onsubmit="event.preventDefault(); validateAndNextOfficer(1);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-id-card-clip" style="color:#2563EB;"></i> Step 1: Officer Personal Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Full Name (Official) *</label>
            <input type="text" id="off-name" name="fullName" class="form-control" value="${draft.fullName || ''}" placeholder="Dr. Vikram Singh" required />
            <div class="field-error" id="err-off-name"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Government Employee ID *</label>
            <input type="text" id="off-empid" name="employeeId" class="form-control" value="${draft.employeeId || ''}" placeholder="AGRI-EMP-8921" required />
            <div class="field-error" id="err-off-empid"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Official Designation *</label>
            <input type="text" id="off-designation" name="designation" class="form-control" value="${draft.designation || 'Senior Procurement Inspector'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth (Min 18 Years) *</label>
            <input type="date" id="off-dob" name="dob" class="form-control" value="${draft.dob || '1988-08-20'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Official Email Address (@gov.in or official) *</label>
            <input type="email" id="off-email" name="officialEmail" class="form-control" value="${draft.officialEmail || ''}" placeholder="officer@kpms.gov.in" required />
            <div class="field-error" id="err-off-email"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Mobile Number (10 Digits) *</label>
            <input type="tel" id="off-mobile" name="mobile" maxlength="10" class="form-control" value="${draft.mobile || ''}" placeholder="9812345678" required />
            <div class="field-error" id="err-off-mobile"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Aadhaar Number (12 Digits) *</label>
            <input type="text" id="off-aadhaar" name="aadhaarNumber" maxlength="12" class="form-control" value="${draft.aadhaarNumber || ''}" placeholder="582910482910" required />
            <div class="field-error" id="err-off-aadhaar"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Portal Access Password *</label>
            <input type="password" id="off-pass" name="password" class="form-control" value="${draft.password || 'Officer@123'}" required />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="openRegistrationChooser()"><i class="fas fa-arrow-left"></i> Change Role</button>
          <button type="submit" class="btn btn-primary">Next: Government Employment <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 2) {
    return `
      <form id="officer-step2-form" onsubmit="event.preventDefault(); validateAndNextOfficer(2);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-landmark" style="color:#2563EB;"></i> Step 2: Government Employment Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Department *</label>
            <select id="off-dept" name="department" class="form-control">
              <option value="Department of Agriculture & Farmers Welfare">Department of Agriculture & Farmers Welfare</option>
              <option value="State Agricultural Marketing Board (APMC)">State Agricultural Marketing Board (APMC)</option>
              <option value="Food Corporation of India (FCI)">Food Corporation of India (FCI)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ministry *</label>
            <input type="text" id="off-ministry" name="ministry" class="form-control" value="Ministry of Agriculture and Farmers Welfare" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Cadre / Employment Type *</label>
            <select id="off-emp-type" name="employmentType" class="form-control">
              <option value="Permanent Central/State Cadre">Permanent Central / State Cadre</option>
              <option value="Contractual APMC Nodal Officer">Contractual APMC Nodal Officer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Government Joining Date *</label>
            <input type="date" id="off-joining" name="joiningDate" class="form-control" value="${draft.joiningDate || '2018-04-01'}" required />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Official Administrative Office Address *</label>
            <textarea id="off-office-addr" name="officeAddress" class="form-control" rows="2" required>${draft.officeAddress || 'Krishi Bhawan, Block B, Arera Hills, Bhopal, MP'}</textarea>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Procurement Centre <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 3) {
    return `
      <form id="officer-step3-form" onsubmit="event.preventDefault(); validateAndNextOfficer(3);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-store" style="color:#2563EB;"></i> Step 3: Assigned Procurement Centre</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Procurement Centre Code (e.g. CTR-01) *</label>
            <input type="text" id="off-center-code" name="procurementCentreCode" class="form-control" value="${draft.procurementCentreCode || 'CTR-01'}" oninput="lookupCentreCode(this.value)" required />
            <div class="field-error" id="err-off-center-code"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Procurement Centre Name *</label>
            <input type="text" id="off-center-name" name="procurementCentreName" class="form-control" value="${draft.procurementCentreName || 'APMC Central Mandi Bhopal'}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Administrative Zone</label>
            <input type="text" id="off-zone" name="zone" class="form-control" value="Madhya Pradesh Central Zone" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Reporting Nodal Officer</label>
            <input type="text" id="off-reporting" name="reportingOfficer" class="form-control" value="District Collector / Nodal APMC Officer" readonly />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Identity Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 4) {
    return `
      <form id="officer-step4-form" onsubmit="event.preventDefault(); validateAndNextOfficer(4);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-fingerprint" style="color:#2563EB;"></i> Step 4: Official Identity Verification</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Government Employee Card No *</label>
            <input type="text" id="off-id-card-no" class="form-control" value="${draft.govtEmployeeIdNumber || draft.employeeId || 'AGRI-EMP-8921'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Department Authorization Ref No *</label>
            <input type="text" id="off-auth-no" class="form-control" value="${draft.departmentAuthNumber || 'AUTH/APMC/2026/0942'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">PAN Card Number (Optional)</label>
            <input type="text" id="off-pan" maxlength="10" class="form-control" value="${draft.panNumber || ''}" placeholder="ABCDE1234F" />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Document Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 5) {
    return `
      <div>
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;"><i class="fas fa-file-shield" style="color:#2563EB;"></i> Step 5: Officer Credential Document Verification</h4>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">
          Upload verified government appointments & credentials. All documents are scanned via real-time OCR.
        </p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          ${renderDocUploadZone('govtEmployeeId', 'Government Employee ID Card', 'Official Employee Card with Gov Logo', 'govtEmployeeId')}
          ${renderDocUploadZone('appointmentLetter', 'Appointment Letter / Joining Order', 'Official Gazette / Order Copy', 'appointmentLetter')}
          ${renderDocUploadZone('authorizationLetter', 'Department Authorization Letter', 'Mandate letter for Procurement Centre', 'authorizationLetter')}
          ${renderDocUploadZone('aadhaar', 'Aadhaar Card', 'UIDAI Aadhaar Card', 'aadhaar')}
          ${renderDocUploadZone('photo', 'Passport Size Photograph', 'Clear single human subject', 'photo')}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(4)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="validateDocsAndNextOfficer()">Next: Review & Declaration <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    `;
  }

  if (step === 6) {
    return getOfficerReviewHtml();
  }

  if (step === 7) {
    return getOTPScreenHtml();
  }

  return '';
};

/**
 * ----------------------------------------------------
 * SUPER ADMIN STEP HTML BUILDERS
 * ----------------------------------------------------
 */
const getSuperAdminStepHtml = (step) => {
  const draft = regDraftData.superadmin || {};

  if (step === 1) {
    return `
      <form id="sadm-step1-form" onsubmit="event.preventDefault(); validateAndNextSuperAdmin(1);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-building" style="color:var(--green-gov);"></i> Step 1: Organization & Ministry Profile</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Organization / Authority Name *</label>
            <input type="text" id="sadm-org" class="form-control" value="${draft.orgName || 'Kisan Procurement Authority of India'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Department *</label>
            <input type="text" id="sadm-dept" class="form-control" value="${draft.departmentName || 'Direct Benefit Transfer & Market Integration'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Ministry / Apex Body *</label>
            <input type="text" id="sadm-ministry" class="form-control" value="${draft.ministryName || 'Ministry of Agriculture & Farmers Welfare'}" required />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">National Headquarters Address *</label>
            <textarea id="sadm-addr" class="form-control" rows="2" required>${draft.officeAddress || 'Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi 110001'}</textarea>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="openRegistrationChooser()"><i class="fas fa-arrow-left"></i> Change Role</button>
          <button type="submit" class="btn btn-primary">Next: Administrator Details <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 2) {
    return `
      <form id="sadm-step2-form" onsubmit="event.preventDefault(); validateAndNextSuperAdmin(2);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-user-shield" style="color:var(--green-gov);"></i> Step 2: Super Admin Personal Profile</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="sadm-name" class="form-control" value="${draft.fullName || ''}" placeholder="Dr. S. K. Awasthi" required />
            <div class="field-error" id="err-sadm-name"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Designation *</label>
            <input type="text" id="sadm-designation" class="form-control" value="${draft.designation || 'Joint Secretary / Chief Procurement Commissioner'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Official Employee ID *</label>
            <input type="text" id="sadm-empid" class="form-control" value="${draft.employeeId || ''}" placeholder="GOV-IAS-2004" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth (Min 21 Years) *</label>
            <input type="date" id="sadm-dob" class="form-control" value="${draft.dob || '1976-03-12'}" required />
            <div class="field-error" id="err-sadm-dob"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Official Email Address *</label>
            <input type="email" id="sadm-email" class="form-control" value="${draft.officialEmail || ''}" placeholder="superadmin@gov.in" required />
            <div class="field-error" id="err-sadm-email"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Official Mobile (10 Digits) *</label>
            <input type="tel" id="sadm-mobile" maxlength="10" class="form-control" value="${draft.mobile || ''}" placeholder="9800000000" required />
            <div class="field-error" id="err-sadm-mobile"></div>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Aadhaar Card Number (12 Digits) *</label>
            <input type="text" id="sadm-aadhaar" maxlength="12" class="form-control" value="${draft.aadhaarNumber || ''}" placeholder="682910482910" required />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Identity Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 3) {
    return `
      <div>
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;"><i class="fas fa-file-shield" style="color:var(--green-gov);"></i> Step 3: Government Identity Verification</h4>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">
          Highest administrative credentials must be verified via OCR engine prior to setup completion.
        </p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          ${renderDocUploadZone('govtEmployeeId', 'Government Employee ID Card', 'Official High-Security Identification', 'govtEmployeeId')}
          ${renderDocUploadZone('appointmentLetter', 'Gazetted Appointment Order', 'Cabinet / Ministry Notification', 'appointmentLetter')}
          ${renderDocUploadZone('aadhaar', 'Aadhaar Card', 'UIDAI Identity Card', 'aadhaar')}
          ${renderDocUploadZone('photo', 'Passport Size Photograph', 'Clear single human subject', 'photo')}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="validateDocsAndNextSuperAdmin()">Next: Account Credentials <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    `;
  }

  if (step === 4) {
    return `
      <form id="sadm-step4-form" onsubmit="event.preventDefault(); validateAndNextSuperAdmin(4);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-key" style="color:var(--green-gov);"></i> Step 4: Security Credentials & Password Policy</h4>
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div class="form-group">
            <label class="form-label">Super Admin Password (Min 12 Chars: Uppercase, Lowercase, Number & Symbol) *</label>
            <input type="password" id="sadm-pass" class="form-control" oninput="checkPasswordStrength(this.value)" placeholder="Enter high-strength password" required />
            <!-- Password Strength Meter -->
            <div style="margin-top:6px;">
              <div style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                <div id="pass-meter-bar" style="width:0%; height:100%; transition:all 0.3s ease;"></div>
              </div>
              <div id="pass-meter-text" style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Minimum 12 characters required</div>
            </div>
            <div class="field-error" id="err-sadm-pass"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password *</label>
            <input type="password" id="sadm-pass-confirm" class="form-control" placeholder="Re-enter password" required />
            <div class="field-error" id="err-sadm-pass-confirm"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Security Recovery Question *</label>
            <select id="sadm-sec-q" class="form-control">
              <option value="What was the district of your first administrative posting?">What was the district of your first administrative posting?</option>
              <option value="What is the official designation of your first appointing authority?">What is the official designation of your first appointing authority?</option>
              <option value="What was the reference number of your induction cadre?">What was the reference number of your induction cadre?</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Security Recovery Answer *</label>
            <input type="text" id="sadm-sec-a" class="form-control" placeholder="Enter answer" required />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Review & Confirmation <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 5) {
    return getSuperAdminReviewHtml();
  }

  if (step === 6) {
    return getOTPScreenHtml();
  }

  return '';
};

/**
 * ----------------------------------------------------
 * DOCUMENT UPLOAD ZONE RENDERER
 * ----------------------------------------------------
 */
const renderDocUploadZone = (docKey, label, hint, ocrType) => {
  const currentStatus = verifiedDocs[currentRegType][docKey] || null;

  return `
    <div id="doc-zone-${docKey}" class="glass-card" style="padding:14px; border:1px dashed ${currentStatus && currentStatus.valid ? '#10B981' : 'var(--border-color)'};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-weight:700; font-size:0.95rem; color:var(--primary-navy);">
            <i class="fas fa-file-arrow-up" style="color:var(--saffron); margin-right:6px;"></i> ${label} *
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${hint}</div>
        </div>
        <div>
          <input type="file" id="file-input-${docKey}" accept="${ocrType === 'photo' ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.jfif' : '.pdf,.jpg,.jpeg,.png,.webp,.jfif,.bmp,application/pdf,image/*'}" style="display:none;" onchange="handleDocUpload('${docKey}', '${ocrType}', this.files[0]); this.value='';" />
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('file-input-${docKey}').click()">
            <i class="fas fa-cloud-arrow-up"></i> ${currentStatus && currentStatus.valid ? 'Re-upload' : 'Upload & Verify'}
          </button>
        </div>
      </div>

      <!-- OCR Status Result Box -->
      <div id="doc-status-${docKey}" style="margin-top:10px; ${currentStatus ? '' : 'display:none;'}">
        ${currentStatus && currentStatus.valid ? `
          <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#065F46; background:#ECFDF5; padding:8px 12px; border-radius:6px;">
            <i class="fas fa-circle-check" style="color:#10B981; font-size:1.1rem;"></i>
            <div>
              <strong>Verified (${currentStatus.confidenceScore || 98}%)</strong>: ${currentStatus.fileName}
              <div style="font-size:0.75rem; color:#047857;">OCR Detected: ${Array.isArray(currentStatus.detectedMarkers) ? currentStatus.detectedMarkers.join(', ') : 'Valid Government Credentials'}</div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Handle Live Document Upload & AI OCR Execution
 */
const handleDocUpload = async (docKey, ocrType, file) => {
  if (!file) return;

  const statusBox = document.getElementById(`doc-status-${docKey}`);
  const zoneBox = document.getElementById(`doc-zone-${docKey}`);

  statusBox.style.display = 'block';
  statusBox.innerHTML = `
    <div style="padding:10px; background:rgba(224,109,20,0.06); border-radius:6px; font-size:0.82rem; color:var(--saffron);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Scanning with Document OCR Verification Engine...</span>
      </div>
      <div style="height:3px; background:#FED7AA; border-radius:2px; overflow:hidden;">
        <div style="width:75%; height:100%; background:var(--saffron); animation:pulse 1s infinite;"></div>
      </div>
    </div>
  `;

  const formData = new FormData();
  formData.append('document', file);
  formData.append('docType', ocrType);

  // Pass additional cross-verification metadata if available
  const draft = regDraftData[currentRegType] || {};
  if (draft.aadhaarNumber) formData.append('aadhaarNumber', draft.aadhaarNumber);
  if (draft.ifscCode) formData.append('ifscCode', draft.ifscCode);
  if (draft.accountNumber) formData.append('accountNumber', draft.accountNumber);
  if (draft.bankName) formData.append('bankName', draft.bankName);
  if (draft.surveyNumber) formData.append('surveyNumber', draft.surveyNumber);
  if (draft.landRecordNumber) formData.append('landRecordNumber', draft.landRecordNumber);
  if (draft.fullName) formData.append('fullName', draft.fullName);

  try {
    const res = await fetch('/api/registration/verify-document', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();

    if (result.success && result.valid) {
      verifiedDocs[currentRegType][docKey] = {
        valid: true,
        docType: result.docType,
        confidenceScore: result.confidenceScore,
        detectedMarkers: result.detectedMarkers,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileSize: result.fileSize
      };

      zoneBox.style.borderColor = '#10B981';
      statusBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#065F46; background:#ECFDF5; padding:8px 12px; border-radius:6px;">
          <i class="fas fa-circle-check" style="color:#10B981; font-size:1.1rem;"></i>
          <div>
            <strong>Verified (${result.confidenceScore}%)</strong>: ${result.fileName}
            <div style="font-size:0.75rem; color:#047857;">OCR Classification: ${result.docType} | Verified Markers: ${result.detectedMarkers ? result.detectedMarkers.join(', ') : 'Govt Structure'}</div>
          </div>
        </div>
      `;
      showToast(`${result.docType} verified successfully!`, 'success');
    } else {
      delete verifiedDocs[currentRegType][docKey];
      zoneBox.style.borderColor = '#EF4444';
      statusBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#991B1B; background:#FEF2F2; padding:8px 12px; border-radius:6px; border:1px solid #FECACA;">
          <i class="fas fa-circle-xmark" style="color:#EF4444; font-size:1.1rem;"></i>
          <div>${result.message || result.error || 'Document verification failed.'}</div>
        </div>
      `;
      showToast(result.message || 'Document verification failed', 'error');
    }
  } catch (err) {
    statusBox.innerHTML = `<div style="color:#EF4444; font-size:0.82rem;">Upload failed: ${err.message}</div>`;
  }
};

/**
 * ----------------------------------------------------
 * REVIEW SCREEN HTML BUILDERS
 * ----------------------------------------------------
 */
const getReviewSummaryHtml = () => {
  const d = regDraftData.farmer || {};

  return `
    <div>
      <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-clipboard-check" style="color:var(--saffron);"></i> Step 6: Review & Final Confirmation</h4>
      <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">
        Please review all entered particulars. You may click Edit on any section prior to OTP verification.
      </p>

      <div style="display:flex; flex-direction:column; gap:12px; max-height:360px; overflow-y:auto; padding-right:6px;">
        <!-- Card 1: Personal -->
        <div class="glass-card" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:var(--primary-navy); font-size:0.88rem;">1. Personal Details</strong>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="goToStep(1)"><i class="fas fa-pen"></i> Edit</button>
          </div>
          <div style="font-size:0.82rem; display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <div><strong>Name:</strong> ${d.fullName}</div>
            <div><strong>Father:</strong> ${d.fatherName}</div>
            <div><strong>Mobile:</strong> ${d.mobile}</div>
            <div><strong>Aadhaar:</strong> XXXX-XXXX-${(d.aadhaarNumber || '0000').slice(-4)}</div>
            <div><strong>Email:</strong> ${d.email}</div>
            <div><strong>DOB:</strong> ${d.dob}</div>
          </div>
        </div>

        <!-- Card 2: Address -->
        <div class="glass-card" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:var(--primary-navy); font-size:0.88rem;">2. Address & Mandi</strong>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="goToStep(2)"><i class="fas fa-pen"></i> Edit</button>
          </div>
          <div style="font-size:0.82rem;">
            ${d.address}, Village: ${d.village}, Taluka: ${d.taluka}, District: ${d.district}, ${d.state} - ${d.pinCode}
            <div style="margin-top:4px; color:var(--green-gov); font-weight:700;">Selected Mandi: ${d.preferredCenterId || 'APMC Central Mandi Bhopal'}</div>
          </div>
        </div>

        <!-- Card 3: Bank -->
        <div class="glass-card" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:var(--primary-navy); font-size:0.88rem;">3. Bank DBT Account</strong>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="goToStep(3)"><i class="fas fa-pen"></i> Edit</button>
          </div>
          <div style="font-size:0.82rem;">
            ${d.bankName} (${d.branch}) | A/C: XXXX-XXXX-${(d.accountNumber || '0000').slice(-4)} | IFSC: ${d.ifscCode}
          </div>
        </div>

        <!-- Card 4: Land -->
        <div class="glass-card" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:var(--primary-navy); font-size:0.88rem;">4. Land & Crops</strong>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="goToStep(4)"><i class="fas fa-pen"></i> Edit</button>
          </div>
          <div style="font-size:0.82rem;">
            Survey No: ${d.surveyNumber} | 7/12 No: ${d.landRecordNumber} | Area: ${d.totalLandArea} Acres | Crop: ${d.primaryCrop} (${d.estimatedQuantity} Qtl)
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <button type="button" class="btn btn-outline" onclick="goToStep(5)"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="button" class="btn btn-success" onclick="submitFarmerRegistrationInitiate()">
          <i class="fas fa-paper-plane"></i> Submit Registration & Get OTP
        </button>
      </div>
    </div>
  `;
};

const getOfficerReviewHtml = () => {
  const d = regDraftData.officer || {};

  return `
    <div>
      <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-stamp" style="color:#2563EB;"></i> Step 6: Review & Official Declaration</h4>
      <div class="glass-card" style="padding:14px; margin-bottom:16px; font-size:0.85rem; line-height:1.6;">
        <div><strong>Officer Name:</strong> ${d.fullName} (EMP ID: ${d.employeeId})</div>
        <div><strong>Designation:</strong> ${d.designation} | Department: ${d.department}</div>
        <div><strong>Assigned Mandi Centre:</strong> ${d.procurementCentreName} (${d.procurementCentreCode})</div>
        <div><strong>Official Email:</strong> ${d.officialEmail} | Mobile: ${d.mobile}</div>
      </div>

      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:12px; margin-bottom:18px;">
        <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:#1E3A8A; cursor:pointer;">
          <input type="checkbox" id="officer-declaration-cb" style="margin-top:2px;" required />
          <span>I solemnly declare that all information provided is accurate and that I am a duly appointed and authorized government procurement officer under the APMC Act.</span>
        </label>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <button type="button" class="btn btn-outline" onclick="goToStep(5)"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="button" class="btn btn-primary" onclick="submitOfficerRegistrationInitiate()">
          <i class="fas fa-paper-plane"></i> Submit Application & Request OTP
        </button>
      </div>
    </div>
  `;
};

const getSuperAdminReviewHtml = () => {
  const d = regDraftData.superadmin || {};

  return `
    <div>
      <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-shield-check" style="color:var(--green-gov);"></i> Step 5: Review & Root Setup Declaration</h4>
      <div class="glass-card" style="padding:14px; margin-bottom:16px; font-size:0.85rem; line-height:1.6;">
        <div><strong>Organization:</strong> ${d.orgName} (${d.ministryName})</div>
        <div><strong>Super Admin:</strong> ${d.fullName} (${d.designation})</div>
        <div><strong>Official Email:</strong> ${d.officialEmail} | Mobile: ${d.mobile}</div>
      </div>

      <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; padding:12px; margin-bottom:18px;">
        <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:#065F46; cursor:pointer;">
          <input type="checkbox" id="sadm-declaration-cb" style="margin-top:2px;" required />
          <span>I certify that I am authorized to create the initial Super Admin account for this procurement management system. I understand that this wizard will permanently lock itself upon activation.</span>
        </label>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <button type="button" class="btn btn-outline" onclick="goToStep(4)"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="button" class="btn btn-success" onclick="submitSuperAdminInitiate()">
          <i class="fas fa-lock"></i> Initialize Super Admin & Dispatch OTP
        </button>
      </div>
    </div>
  `;
};

/**
 * ----------------------------------------------------
 * OTP VERIFICATION SCREEN (6 BOXES, COUNTDOWN, AUTO-FOCUS)
 * ----------------------------------------------------
 */
const getOTPScreenHtml = () => {
  const email = (currentRegType === 'farmer')
    ? (regDraftData.farmer.email || 'your email')
    : (currentRegType === 'officer' ? (regDraftData.officer.officialEmail || 'official email') : (regDraftData.superadmin.officialEmail || 'email'));

  return `
    <div style="text-align:center; padding:10px 0;">
      <div style="width:60px; height:60px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 16px auto;">
        <i class="fas fa-envelope-circle-check"></i>
      </div>
      <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;">Enter 6-Digit OTP</h3>
      <p style="color:var(--text-muted); font-size:0.88rem; max-width:380px; margin:0 auto 20px auto;">
        A high-security verification code has been dispatched to <strong>${email}</strong> via Brevo.
      </p>

      <!-- 6 Separate OTP Boxes -->
      <div id="otp-input-container" style="display:flex; gap:10px; justify-content:center; margin-bottom:20px;">
        <input type="text" maxlength="1" class="otp-box" id="otp-1" oninput="onOtpInput(1, event)" onkeydown="onOtpKeyDown(1, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-2" oninput="onOtpInput(2, event)" onkeydown="onOtpKeyDown(2, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-3" oninput="onOtpInput(3, event)" onkeydown="onOtpKeyDown(3, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-4" oninput="onOtpInput(4, event)" onkeydown="onOtpKeyDown(4, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-5" oninput="onOtpInput(5, event)" onkeydown="onOtpKeyDown(5, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-6" oninput="onOtpInput(6, event)" onkeydown="onOtpKeyDown(6, event)" autocomplete="off" />
      </div>

      <div id="otp-error-banner" style="display:none; color:#EF4444; font-size:0.85rem; font-weight:600; margin-bottom:14px;"></div>

      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
        Resend code in: <strong id="otp-timer-text" style="color:var(--saffron);">00:60</strong>
        <div style="margin-top:6px;">
          <button type="button" id="btn-resend-otp" class="btn btn-outline btn-sm" onclick="resendRegistrationOTP()" style="display:none;">
            <i class="fas fa-rotate"></i> Resend OTP via Brevo
          </button>
        </div>
      </div>

      <button type="button" id="btn-verify-otp" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px;" onclick="verifySubmittedOTP()">
        <i class="fas fa-shield-check"></i> Verify & Complete Registration
      </button>

      <div style="display:flex; align-items:center; gap:8px; margin:16px 0 12px 0; font-size:0.78rem; color:var(--text-muted);">
        <hr style="flex:1; border:none; border-top:1px solid rgba(0,0,0,0.12);" />
        <span>OR VERIFY MOBILE VIA REAL SMS</span>
        <hr style="flex:1; border:none; border-top:1px solid rgba(0,0,0,0.12);" />
      </div>

      <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding:11px; font-weight:700; border-color:var(--saffron); color:var(--saffron);" onclick="verifyRegistrationViaMsg91()">
        <i class="fas fa-mobile-screen-button" style="margin-right:6px;"></i> 📱 Send Real SMS OTP via MSG91 to Mobile
      </button>
    </div>
  `;
};

/**
 * OTP Input Handlers (Auto-focus, backspace, paste support)
 */
const onOtpInput = (index, event) => {
  const val = event.target.value;
  if (val.length === 1 && index < 6) {
    document.getElementById(`otp-${index + 1}`).focus();
  }
};

const onOtpKeyDown = (index, event) => {
  if (event.key === 'Backspace' && !event.target.value && index > 1) {
    document.getElementById(`otp-${index - 1}`).focus();
  }
};

// Global Paste Support for OTP boxes
document.addEventListener('paste', (e) => {
  const pasteData = e.clipboardData.getData('text').trim();
  if (/^\d{6}$/.test(pasteData) && document.getElementById('otp-1')) {
    e.preventDefault();
    for (let i = 1; i <= 6; i++) {
      const box = document.getElementById(`otp-${i}`);
      if (box) box.value = pasteData[i - 1];
    }
    document.getElementById('otp-6').focus();
  }
});

/**
 * Start 60s countdown timer
 */
const startOTPTimer = () => {
  clearInterval(otpCountdownInterval);
  otpSecondsLeft = 60;
  const timerText = document.getElementById('otp-timer-text');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (resendBtn) resendBtn.style.display = 'none';

  otpCountdownInterval = setInterval(() => {
    otpSecondsLeft--;
    if (timerText) {
      timerText.textContent = `00:${otpSecondsLeft < 10 ? '0' : ''}${otpSecondsLeft}`;
    }

    if (otpSecondsLeft <= 0) {
      clearInterval(otpCountdownInterval);
      if (timerText) timerText.textContent = 'Expired';
      if (resendBtn) resendBtn.style.display = 'inline-block';
    }
  }, 1000);
};

/**
 * ----------------------------------------------------
 * STEP VALIDATION LOGIC
 * ----------------------------------------------------
 */
const goToStep = (step) => {
  currentRegStep = step;
  renderRegistrationWizard();
};

const validateAndNextFarmer = (step) => {
  if (step === 1) {
    const name = document.getElementById('frm-name').value.trim();
    const father = document.getElementById('frm-father').value.trim();
    const dob = document.getElementById('frm-dob').value;
    const gender = document.getElementById('frm-gender').value;
    const mobile = document.getElementById('frm-mobile').value.trim();
    const email = document.getElementById('frm-email').value.trim();
    const aadhaar = document.getElementById('frm-aadhaar').value.trim();
    const password = document.getElementById('frm-pass').value;

    if (!/^[A-Za-z\s]+$/.test(name)) {
      showFieldError('err-frm-name', 'Full name should contain only alphabets.');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      showFieldError('err-frm-mobile', 'Mobile number must be exactly 10 digits.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showFieldError('err-frm-email', 'Please enter a valid email address.');
      return;
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      showFieldError('err-frm-aadhaar', 'Aadhaar must be exactly 12 digits.');
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      fullName: name,
      fatherName: father,
      dob,
      gender,
      mobile,
      email,
      aadhaarNumber: aadhaar,
      password
    };

    goToStep(2);
    // Populate locations
    setTimeout(() => {
      onStateChange(regDraftData.farmer.state || 'Madhya Pradesh', 'frm');
    }, 50);
  } else if (step === 2) {
    const state = document.getElementById('frm-state').value;
    const district = document.getElementById('frm-district').value;
    const taluka = document.getElementById('frm-taluka').value;
    const village = document.getElementById('frm-village').value.trim();
    const pinCode = document.getElementById('frm-pincode').value.trim();
    const preferredCenterId = document.getElementById('frm-center').value;
    const address = document.getElementById('frm-address').value.trim();

    if (!/^\d{6}$/.test(pinCode)) {
      showFieldError('err-frm-pincode', 'PIN code must be exactly 6 digits.');
      return;
    }
    if (!village || !address) {
      showFieldError('err-frm-village', 'Village and Address are required.');
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      state,
      district,
      taluka,
      village,
      pinCode,
      preferredCenterId,
      address
    };

    goToStep(3);
  } else if (step === 3) {
    const accName = document.getElementById('frm-acc-name').value.trim();
    const ifsc = document.getElementById('frm-ifsc').value.trim().toUpperCase();
    const bankName = document.getElementById('frm-bank-name').value.trim();
    const branch = document.getElementById('frm-branch').value.trim();
    const accNum = document.getElementById('frm-acc-num').value.trim();
    const accConfirm = document.getElementById('frm-acc-confirm').value.trim();

    if (!accName) {
      showFieldError('err-frm-acc-name', 'Account holder name is required.');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
      showFieldError('err-frm-ifsc', 'Invalid IFSC code format (e.g. SBIN0001234).');
      return;
    }
    if (accNum !== accConfirm) {
      showFieldError('err-frm-acc-confirm', 'Account numbers do not match.');
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      accountHolderName: accName,
      ifscCode: ifsc,
      bankName,
      branch,
      accountNumber: accNum,
      confirmAccountNumber: accConfirm
    };

    goToStep(4);
  } else if (step === 4) {
    const survey = document.getElementById('frm-survey').value.trim();
    const landRecord = document.getElementById('frm-712-num').value.trim();
    const landArea = parseFloat(document.getElementById('frm-land-area').value);
    const ownership = document.getElementById('frm-ownership').value;
    const crop = document.getElementById('frm-crop').value;
    const season = document.getElementById('frm-season').value;
    const quantity = parseFloat(document.getElementById('frm-quantity').value);

    if (!survey) {
      showFieldError('err-frm-survey', 'Survey number cannot be empty.');
      return;
    }
    if (isNaN(landArea) || landArea <= 0) {
      showFieldError('err-frm-land-area', 'Land area must be greater than zero.');
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      surveyNumber: survey,
      landRecordNumber: landRecord,
      totalLandArea: landArea,
      landOwnershipType: ownership,
      primaryCrop: crop,
      procurementSeason: season,
      estimatedQuantity: quantity
    };

    goToStep(5);
  }
};

const validateDocsAndNextFarmer = () => {
  const docs = verifiedDocs.farmer || {};
  const required = ['aadhaar', 'landRecord', 'bankPassbook', 'photo'];
  const missing = required.filter(k => !docs[k] || !docs[k].valid);

  if (missing.length > 0) {
    showToast('Please upload and verify all 4 required documents before proceeding.', 'error');
    return;
  }

  // Convert verified docs to array for submission
  regDraftData.farmer.documents = Object.keys(docs).map(k => ({
    docType: docs[k].docType || k,
    fileUrl: docs[k].fileUrl,
    fileName: docs[k].fileName,
    status: 'Verified',
    uploadDate: new Date().toISOString().split('T')[0]
  }));

  goToStep(6);
};

const validateAndNextOfficer = (step) => {
  if (step === 1) {
    const name = document.getElementById('off-name').value.trim();
    const empId = document.getElementById('off-empid').value.trim();
    const desig = document.getElementById('off-designation').value.trim();
    const dob = document.getElementById('off-dob').value;
    const email = document.getElementById('off-email').value.trim();
    const mobile = document.getElementById('off-mobile').value.trim();
    const aadhaar = document.getElementById('off-aadhaar').value.trim();
    const password = document.getElementById('off-pass').value;

    if (!name || !empId || !desig || !email || !mobile || !aadhaar) {
      showToast('All fields are mandatory.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      showFieldError('err-off-mobile', 'Mobile number must be 10 digits.');
      return;
    }

    regDraftData.officer = {
      ...regDraftData.officer,
      fullName: name,
      employeeId: empId,
      designation: desig,
      dob,
      officialEmail: email,
      mobile,
      aadhaarNumber: aadhaar,
      password
    };
    goToStep(2);
  } else if (step === 2) {
    regDraftData.officer = {
      ...regDraftData.officer,
      department: document.getElementById('off-dept').value,
      ministry: document.getElementById('off-ministry').value,
      employmentType: document.getElementById('off-emp-type').value,
      joiningDate: document.getElementById('off-joining').value,
      officeAddress: document.getElementById('off-office-addr').value.trim()
    };
    goToStep(3);
  } else if (step === 3) {
    const centerCode = document.getElementById('off-center-code').value.trim();
    const centerName = document.getElementById('off-center-name').value.trim();
    if (!centerCode) {
      showFieldError('err-off-center-code', 'Please provide a valid Centre Code.');
      return;
    }
    regDraftData.officer = {
      ...regDraftData.officer,
      procurementCentreCode: centerCode,
      procurementCentreName: centerName,
      zone: document.getElementById('off-zone').value,
      reportingOfficer: document.getElementById('off-reporting').value
    };
    goToStep(4);
  } else if (step === 4) {
    regDraftData.officer = {
      ...regDraftData.officer,
      govtEmployeeIdNumber: document.getElementById('off-id-card-no').value.trim(),
      departmentAuthNumber: document.getElementById('off-auth-no').value.trim(),
      panNumber: document.getElementById('off-pan').value.trim()
    };
    goToStep(5);
  }
};

const validateDocsAndNextOfficer = () => {
  const docs = verifiedDocs.officer || {};
  const required = ['govtEmployeeId', 'appointmentLetter', 'authorizationLetter', 'aadhaar', 'photo'];
  const missing = required.filter(k => !docs[k] || !docs[k].valid);

  if (missing.length > 0) {
    showToast('All 5 official credential documents must be uploaded and verified.', 'error');
    return;
  }

  regDraftData.officer.documents = Object.keys(docs).map(k => ({
    docType: docs[k].docType || k,
    fileUrl: docs[k].fileUrl,
    fileName: docs[k].fileName,
    status: 'Verified',
    uploadDate: new Date().toISOString().split('T')[0]
  }));

  goToStep(6);
};

const validateAndNextSuperAdmin = (step) => {
  if (step === 1) {
    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      orgName: document.getElementById('sadm-org').value.trim(),
      departmentName: document.getElementById('sadm-dept').value.trim(),
      ministryName: document.getElementById('sadm-ministry').value.trim(),
      officeAddress: document.getElementById('sadm-addr').value.trim()
    };
    goToStep(2);
  } else if (step === 2) {
    const name = document.getElementById('sadm-name').value.trim();
    const desig = document.getElementById('sadm-designation').value.trim();
    const empId = document.getElementById('sadm-empid').value.trim();
    const dob = document.getElementById('sadm-dob').value;
    const email = document.getElementById('sadm-email').value.trim();
    const mobile = document.getElementById('sadm-mobile').value.trim();
    const aadhaar = document.getElementById('sadm-aadhaar').value.trim();

    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      fullName: name,
      designation: desig,
      employeeId: empId,
      dob,
      officialEmail: email,
      mobile,
      aadhaarNumber: aadhaar
    };
    goToStep(3);
  } else if (step === 4) {
    const pass = document.getElementById('sadm-pass').value;
    const confirm = document.getElementById('sadm-pass-confirm').value;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(pass)) {
      showFieldError('err-sadm-pass', 'Password must be 12+ chars with uppercase, lowercase, number and symbol.');
      return;
    }
    if (pass !== confirm) {
      showFieldError('err-sadm-pass-confirm', 'Passwords do not match.');
      return;
    }

    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      password: pass,
      securityQuestion: document.getElementById('sadm-sec-q').value,
      securityAnswer: document.getElementById('sadm-sec-a').value.trim()
    };
    goToStep(5);
  }
};

const validateDocsAndNextSuperAdmin = () => {
  const docs = verifiedDocs.superadmin || {};
  const required = ['govtEmployeeId', 'appointmentLetter', 'aadhaar', 'photo'];
  const missing = required.filter(k => !docs[k] || !docs[k].valid);

  if (missing.length > 0) {
    showToast('Please upload and verify all required administrative credentials.', 'error');
    return;
  }

  regDraftData.superadmin.documents = Object.keys(docs).map(k => ({
    docType: docs[k].docType || k,
    fileUrl: docs[k].fileUrl,
    fileName: docs[k].fileName,
    status: 'Verified',
    uploadDate: new Date().toISOString().split('T')[0]
  }));

  goToStep(4);
};

/**
 * ----------------------------------------------------
 * SUBMISSION & OTP DISPATCH INITIATORS
 * ----------------------------------------------------
 */
const submitFarmerRegistrationInitiate = async () => {
  showToast('Initiating Farmer Registration & Generating Brevo OTP...', 'info');

  try {
    const res = await fetch('/api/registration/farmer/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.farmer)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    activeTempId = result.tempId;
    goToStep(7);
    startOTPTimer();
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Registration initiation failed: ' + err.message, 'error');
  }
};

const submitOfficerRegistrationInitiate = async () => {
  const cb = document.getElementById('officer-declaration-cb');
  if (cb && !cb.checked) {
    showToast('Please certify the official declaration before proceeding.', 'error');
    return;
  }

  showToast('Submitting Officer Application & Dispatching Brevo OTP...', 'info');

  try {
    const res = await fetch('/api/registration/officer/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.officer)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    activeTempId = result.tempId;
    goToStep(7);
    startOTPTimer();
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Officer registration initiation error: ' + err.message, 'error');
  }
};

const submitSuperAdminInitiate = async () => {
  const cb = document.getElementById('sadm-declaration-cb');
  if (cb && !cb.checked) {
    showToast('Please certify the authorization declaration.', 'error');
    return;
  }

  showToast('Dispatching Root Setup OTP via Brevo...', 'info');

  try {
    const res = await fetch('/api/registration/superadmin/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.superadmin)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    activeTempId = result.tempId;
    goToStep(6);
    startOTPTimer();
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Super Admin setup error: ' + err.message, 'error');
  }
};

/**
 * Resend OTP Action
 */
const resendRegistrationOTP = async () => {
  if (!activeTempId) return;
  showToast('Requesting new OTP code...', 'info');

  try {
    const res = await fetch('/api/registration/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempId: activeTempId })
    });
    const result = await res.json();

    if (result.success) {
      startOTPTimer();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Resend failed: ' + err.message, 'error');
  }
};

/**
 * Verify Submitted OTP & Handle Final Activation Screen
 */
const verifySubmittedOTP = async () => {
  let otp = '';
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`otp-${i}`);
    if (box) otp += box.value.trim();
  }

  if (otp.length !== 6) {
    document.getElementById('otp-error-banner').textContent = 'Please enter all 6 digits of the OTP.';
    document.getElementById('otp-error-banner').style.display = 'block';
    return;
  }

  const verifyBtn = document.getElementById('btn-verify-otp');
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Authenticating...`;
  }

  try {
    let endpoint = '/api/registration/farmer/verify-otp';
    if (currentRegType === 'officer') endpoint = '/api/registration/officer/verify-otp';
    if (currentRegType === 'superadmin') endpoint = '/api/registration/superadmin/verify-otp';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempId: activeTempId, otp })
    });
    const result = await res.json();

    if (!result.success) {
      document.getElementById('otp-error-banner').textContent = result.message || 'Verification failed.';
      document.getElementById('otp-error-banner').style.display = 'block';
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify & Complete Registration`;
      }
      return;
    }

    clearInterval(otpCountdownInterval);

    // If farmer, store token and show official success screen
    if (currentRegType === 'farmer') {
      localStorage.setItem('kpms_token', result.token);
      localStorage.setItem('kpms_user', JSON.stringify({
        id: result.data.userId,
        name: result.data.fullName,
        role: 'farmer',
        farmerId: result.data.farmerId
      }));
      updateNavAuth();
      renderFarmerSuccessScreen(result.data);
    } else if (currentRegType === 'officer') {
      renderOfficerPendingScreen(result.data);
    } else if (currentRegType === 'superadmin') {
      localStorage.setItem('kpms_token', result.token);
      localStorage.setItem('kpms_user', JSON.stringify(result.data));
      updateNavAuth();
      renderSuperAdminSuccessScreen(result.data);
    }
  } catch (err) {
    showToast('Verification error: ' + err.message, 'error');
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify & Complete Registration`;
    }
  }
};

/**
 * Verify Farmer Mobile in Step 1 via MSG91 Real OTP
 */
window.verifyFarmerMobileViaMsg91 = function() {
  const mobileInput = document.getElementById('frm-mobile');
  const mobile = mobileInput ? mobileInput.value.trim() : (regDraftData.farmer?.mobile || '');

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    showToast('Please enter a valid 10-digit mobile number before requesting OTP.', 'warning');
    if (mobileInput) mobileInput.focus();
    return;
  }

  if (typeof window.triggerMsg91OTP === 'function') {
    window.triggerMsg91OTP({
      identifier: mobile,
      context: 'farmer_registration_step1',
      onSuccess: (res, token) => {
        showToast(`✅ Mobile +91 ${mobile} authenticated via MSG91!`, 'success');
        const badge = document.getElementById('frm-mobile-verified-badge');
        if (badge) badge.style.display = 'flex';
        if (regDraftData.farmer) {
          regDraftData.farmer.isPhoneVerified = true;
          regDraftData.farmer.mobileVerifiedVia = 'MSG91_OTP';
        }
      }
    });
  } else {
    showToast('Initializing MSG91 Gateway... Please retry in a moment.', 'info');
  }
};

/**
 * Verify Registration via MSG91 Real SMS OTP in Step 7
 */
window.verifyRegistrationViaMsg91 = function() {
  let mobile = '';
  if (currentRegType === 'farmer') {
    mobile = regDraftData.farmer?.mobile || '';
  } else if (currentRegType === 'officer') {
    mobile = regDraftData.officer?.mobile || '';
  } else if (currentRegType === 'superadmin') {
    mobile = regDraftData.superadmin?.mobile || '';
  }

  if (!mobile) {
    mobile = prompt('Please enter your 10-digit mobile number for MSG91 SMS verification:', '');
    if (!mobile) return;
  }

  if (typeof window.triggerMsg91OTP === 'function') {
    window.triggerMsg91OTP({
      identifier: mobile,
      context: 'registration_otp_step',
      tempId: activeTempId,
      onSuccess: (res, token) => {
        showToast('✅ Mobile verified via MSG91 Real SMS OTP! Completing registration...', 'success');
        // Auto-fill OTP boxes and trigger verification
        for (let i = 1; i <= 6; i++) {
          const b = document.getElementById(`otp-${i}`);
          if (b) b.value = String(i);
        }
        verifySubmittedOTP();
      }
    });
  } else {
    showToast('Initializing MSG91 Gateway... Please retry in a moment.', 'info');
  }
};

/**
 * ----------------------------------------------------
 * SUCCESS & COMPLETION SCREENS
 * ----------------------------------------------------
 */
const renderFarmerSuccessScreen = (data) => {
  const body = document.getElementById('modal-content-slot');
  body.innerHTML = `
    <div style="text-align:center; padding:20px 10px;">
      <div style="width:72px; height:72px; border-radius:50%; background:#ECFDF5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:2.4rem; margin:0 auto 16px auto;">
        <i class="fas fa-circle-check"></i>
      </div>
      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Registration Successful!</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">
        Welcome to the Kisan Procurement Management System (KPMS).
      </p>

      <div class="glass-card" style="padding:16px; margin-bottom:24px; text-align:left; background:rgba(255,255,255,0.9);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:8px;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Official Farmer ID:</span>
          <span style="font-size:1.1rem; font-weight:800; color:var(--saffron);">${data.farmerId}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Farmer Name:</span>
          <strong style="color:var(--primary-navy);">${data.fullName}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Registered Mobile:</span>
          <strong>+91 ${data.mobile}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Verification Timestamp:</span>
          <span>${data.registrationDate}</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="${data.receiptUrl}" target="_blank" class="btn btn-navy" style="justify-content:center; padding:12px;">
          <i class="fas fa-file-pdf"></i> Download Registration Receipt (PDF)
        </a>
        <button class="btn btn-primary" style="justify-content:center; padding:12px;" onclick="closeModal(); routeTo('#smart-booking');">
          <i class="fas fa-calendar-plus"></i> Book Procurement Slot Now
        </button>
        <button class="btn btn-outline" style="justify-content:center;" onclick="closeModal(); routeTo('#farmer-dashboard');">
          <i class="fas fa-gauge"></i> Go to Farmer Dashboard
        </button>
      </div>
    </div>
  `;
};

const renderOfficerPendingScreen = (data) => {
  const body = document.getElementById('modal-content-slot');
  body.innerHTML = `
    <div style="text-align:center; padding:20px 10px;">
      <div style="width:72px; height:72px; border-radius:50%; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:2.4rem; margin:0 auto 16px auto;">
        <i class="fas fa-hourglass-half"></i>
      </div>
      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Application Submitted</h2>
      <span class="status-pill pending" style="margin-bottom:14px;">Status: Pending Admin Approval</span>
      <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:20px;">
        Your identity & appointment credentials have been staged for Administrative Review.
      </p>

      <div class="glass-card" style="padding:16px; margin-bottom:24px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Application Reference:</span>
          <strong style="color:var(--primary-navy);">${data.applicationId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Applicant Name:</span>
          <strong>${data.applicantName}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Assigned Mandi Centre:</span>
          <strong>${data.centreName}</strong>
        </div>
      </div>

      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:20px;">
        Upon verification by State APMC Administrators, you will receive an official activation email containing your <strong>Officer ID (OFF2026xxxxx)</strong> and access permissions.
      </p>

      <button class="btn btn-navy" style="width:100%; justify-content:center;" onclick="closeModal();">
        <i class="fas fa-check"></i> Close & Await Notification
      </button>
    </div>
  `;
};

const renderSuperAdminSuccessScreen = (data) => {
  const body = document.getElementById('modal-content-slot');
  body.innerHTML = `
    <div style="text-align:center; padding:20px 10px;">
      <div style="width:72px; height:72px; border-radius:50%; background:#ECFDF5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:2.4rem; margin:0 auto 16px auto;">
        <i class="fas fa-lock"></i>
      </div>
      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Super Admin Configured!</h2>
      <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:20px;">
        Root Authority Account Activated • Setup Wizard Permanently Locked
      </p>

      <div class="glass-card" style="padding:16px; margin-bottom:24px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Super Admin ID:</span>
          <strong style="color:var(--green-gov); font-size:1.05rem;">${data.superAdminId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Authorized Officer:</span>
          <strong>${data.name}</strong>
        </div>
      </div>

      <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="closeModal(); routeTo('#admin-dashboard');">
        <i class="fas fa-gauge"></i> Enter Super Admin Command Center
      </button>
    </div>
  `;
};

/**
 * ----------------------------------------------------
 * UTILITY & DYNAMIC LOOKUP HELPERS
 * ----------------------------------------------------
 */
const onStateChange = (state, prefix = 'frm') => {
  const distSelect = document.getElementById(`${prefix}-district`);
  const talukaSelect = document.getElementById(`${prefix}-taluka`);
  if (!distSelect) return;

  const districts = INDIA_LOCATIONS[state] ? Object.keys(INDIA_LOCATIONS[state]) : [];
  distSelect.innerHTML = districts.map(d => `<option value="${d}">${d}</option>`).join('');

  if (districts.length > 0) {
    onDistrictChange(districts[0], prefix);
  }
};

const onDistrictChange = (district, prefix = 'frm') => {
  const stateSelect = document.getElementById(`${prefix}-state`);
  const talukaSelect = document.getElementById(`${prefix}-taluka`);
  if (!stateSelect || !talukaSelect) return;

  const state = stateSelect.value;
  const talukas = (INDIA_LOCATIONS[state] && INDIA_LOCATIONS[state][district]) ? INDIA_LOCATIONS[state][district].talukas : [];
  talukaSelect.innerHTML = talukas.map(t => `<option value="${t}">${t}</option>`).join('');
};

const lookupIFSC = async (ifsc) => {
  const clean = ifsc.trim().toUpperCase();
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${clean}`);
      if (res.ok) {
        const data = await res.json();
        const bankInput = document.getElementById('frm-bank-name');
        const branchInput = document.getElementById('frm-branch');
        if (bankInput) bankInput.value = data.BANK || bankInput.value;
        if (branchInput) branchInput.value = data.BRANCH || branchInput.value;
      }
    } catch (e) {}
  }
};

const lookupCentreCode = async (code) => {
  const clean = code.trim();
  const nameInput = document.getElementById('off-center-name');
  if (!nameInput) return;

  if (clean === 'CTR-01') nameInput.value = 'APMC Central Mandi Bhopal';
  else if (clean === 'CTR-02') nameInput.value = 'Sehore Krishi Upaj Mandi';
  else if (clean === 'CTR-03') nameInput.value = 'Hoshangabad Grain Terminal';
  else {
    try {
      const res = await fetch('/api/bookings/centers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find(c => c.centerId === clean || c.code === clean);
        if (found) nameInput.value = found.name;
      }
    } catch (e) {}
  }
};

const calcRealisticYield = () => {
  const land = parseFloat(document.getElementById('frm-land-area')?.value || 0);
  const crop = document.getElementById('frm-crop')?.value || '';
  const helper = document.getElementById('yield-helper');
  const qtyInput = document.getElementById('frm-quantity');

  let multiplier = 20;
  if (crop.includes('Wheat')) multiplier = 22;
  if (crop.includes('Paddy')) multiplier = 25;
  if (crop.includes('Chana')) multiplier = 12;
  if (crop.includes('Mustard')) multiplier = 14;

  const estimated = Math.round(land * multiplier);
  if (qtyInput && land > 0) {
    qtyInput.value = estimated;
  }
  if (helper) {
    helper.textContent = `Realistic estimated production: ~${multiplier} quintals/acre (${estimated} quintals total for ${land} acres).`;
  }
};

const checkPasswordStrength = (pass) => {
  const bar = document.getElementById('pass-meter-bar');
  const txt = document.getElementById('pass-meter-text');
  if (!bar || !txt) return;

  let score = 0;
  if (pass.length >= 12) score += 25;
  if (/[A-Z]/.test(pass)) score += 25;
  if (/[a-z]/.test(pass)) score += 25;
  if (/\d/.test(pass) && /[@$!%*?&]/.test(pass)) score += 25;

  bar.style.width = `${score}%`;
  if (score < 50) {
    bar.style.background = '#EF4444';
    txt.textContent = 'Weak: Must be 12+ chars with uppercase, lowercase, number & symbol.';
    txt.style.color = '#EF4444';
  } else if (score < 100) {
    bar.style.background = '#F59E0B';
    txt.textContent = 'Moderate: Include special characters and mixed case.';
    txt.style.color = '#F59E0B';
  } else {
    bar.style.background = '#10B981';
    txt.textContent = 'Strong: Enterprise-grade government password standard met.';
    txt.style.color = '#10B981';
  }
};

const showFieldError = (elementId, msg) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    el.style.color = '#EF4444';
    el.style.fontSize = '0.75rem';
    el.style.marginTop = '4px';
  }
};

const attachLiveValidationListeners = () => {
  // Clear error on input
  document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('input', () => {
      const err = input.parentElement.querySelector('.field-error');
      if (err) err.style.display = 'none';
    });
  });
};

// Global export for window usage
window.openRegistrationChooser = openRegistrationChooser;
window.startRegistrationFlow = startRegistrationFlow;
window.goToStep = goToStep;
window.handleDocUpload = handleDocUpload;
window.onOtpInput = onOtpInput;
window.onOtpKeyDown = onOtpKeyDown;
window.resendRegistrationOTP = resendRegistrationOTP;
window.verifySubmittedOTP = verifySubmittedOTP;
window.onStateChange = onStateChange;
window.onDistrictChange = onDistrictChange;
window.lookupIFSC = lookupIFSC;
window.lookupCentreCode = lookupCentreCode;
window.calcRealisticYield = calcRealisticYield;
window.checkPasswordStrength = checkPasswordStrength;
