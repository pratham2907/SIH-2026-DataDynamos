const fs = require('fs');
const path = require('path');

const landingPath = path.join(__dirname, '..', 'public', 'js', 'landing-page.js');
let code = fs.readFileSync(landingPath, 'utf8');

// Replace Hero section
code = code.replace(
`<h1 class="sp-hero-title">
                Smart Procurement.<br />
                Less Waiting.<br />
                <span class="sp-text-highlight">Better Returns for Farmers.</span>
              </h1>`,
`<h1 class="sp-hero-title">
                \${getT('hero_title_1', 'Smart Procurement.')}<br />
                \${getT('hero_title_2', 'Less Waiting.')}<br />
                <span class="sp-text-highlight">\${getT('hero_title_3', 'Better Returns for Farmers.')}</span>
              </h1>`
);

code = code.replace(
`<p class="sp-hero-desc">
                Find the right procurement centre, book your verified slot, track your live queue position, and monitor direct benefit transfer (DBT) payments — all from one unified government platform.
              </p>`,
`<p class="sp-hero-desc">
                \${getT('hero_desc_main', 'Find the right procurement centre, book your verified slot, track your live queue position, and monitor direct benefit transfer (DBT) payments — all from one unified government platform.')}
              </p>`
);

code = code.replace(
`<button class="btn btn-primary btn-lg" onclick="handleHeroMandiCta(\${isAuthenticated})">
                  <i class="fas fa-location-crosshairs"></i> Find Best Mandi
                </button>`,
`<button class="btn btn-primary btn-lg" onclick="handleHeroMandiCta(\${isAuthenticated})">
                  <i class="fas fa-location-crosshairs"></i> \${getT('btn_find_best_mandi', 'Find Best Mandi')}
                </button>`
);

code = code.replace(
`<button class="btn btn-outline btn-lg sp-btn-hero-secondary" onclick="handleHeroTrackCta(\${isAuthenticated})">
                  <i class="fas fa-clipboard-check"></i> Track Procurement
                </button>`,
`<button class="btn btn-outline btn-lg sp-btn-hero-secondary" onclick="handleHeroTrackCta(\${isAuthenticated})">
                  <i class="fas fa-clipboard-check"></i> \${getT('btn_track_procurement', 'Track Procurement')}
                </button>`
);

// Quick stats
code = code.replace(
`<strong>Reduced Waiting</strong>
                    <span>Transparent digital token scheduling</span>`,
`<strong>\${getT('stat_reduced_waiting', 'Reduced Waiting')}</strong>
                    <span>\${getT('stat_reduced_waiting_desc', 'Transparent digital token scheduling')}</span>`
);

code = code.replace(
`<strong>MSP Transparency</strong>
                    <span>Direct MSP assurance & zero middlemen</span>`,
`<strong>\${getT('stat_msp_transparency', 'MSP Transparency')}</strong>
                    <span>\${getT('stat_msp_transparency_desc', 'Direct MSP assurance & zero middlemen')}</span>`
);

code = code.replace(
`<strong>Direct Bank Transfer</strong>
                    <span>Sanctioned J-Forms linked to PFMS/DBT</span>`,
`<strong>\${getT('stat_dbt_transfer', 'Direct Bank Transfer')}</strong>
                    <span>\${getT('stat_dbt_transfer_desc', 'Sanctioned J-Forms linked to PFMS/DBT')}</span>`
);

// Badge tagline
code = code.replace(
`<i class="fas fa-seedling"></i> Smart Agriculture &bull; Digital Procurement`,
`<i class="fas fa-seedling"></i> \${getT('hero_badge_tagline', 'Smart Agriculture • Digital Procurement')}`
);

// Auth Card Header
code = code.replace(
`<h3 class="sp-auth-title">Welcome to SmartProcure</h3>
        <p class="sp-auth-subtitle">Your trusted partner in agricultural procurement</p>`,
`<h3 class="sp-auth-title">\${getT('auth_welcome_title', 'Welcome to SmartProcure')}</h3>
        <p class="sp-auth-subtitle">\${getT('auth_welcome_sub', 'Your trusted partner in agricultural procurement')}</p>`
);

// Auth Tabs
code = code.replace(
`<i class="fas fa-right-to-bracket"></i> LOGIN`,
`<i class="fas fa-right-to-bracket"></i> \${getT('tab_login', 'LOGIN')}`
);

code = code.replace(
`<i class="fas fa-user-plus"></i> REGISTER`,
`<i class="fas fa-user-plus"></i> \${getT('tab_register', 'REGISTER')}`
);

// Role configs in renderHeroLoginForm
code = code.replace(
`  const roleConfigs = {
    farmer: {
      label: 'Mobile Number / Farmer ID',
      placeholder: 'e.g. 9876543210 or FRM202600001',
      defaultVal: '9876543210',
      passVal: 'Kisan@123',
      btnText: 'Login to Kisan Portal',
      btnColor: '#0D5C3A',
      photo: '/images/roles/farmer.jpg'
    },
    officer: {
      label: 'Official Email / Employee ID',
      placeholder: 'e.g. officer@kpms.gov.in',
      defaultVal: 'officer@kpms.gov.in',
      passVal: 'Officer@123',
      btnText: 'Login to Officer Portal',
      btnColor: '#2563EB',
      photo: '/images/roles/officer.jpg'
    },
    admin: {
      label: 'Super Admin Email',
      placeholder: 'e.g. admin@kpms.gov.in',
      defaultVal: 'admin@kpms.gov.in',
      passVal: 'Admin@123',
      btnText: 'Login as Administrator',
      btnColor: '#E06D14',
      photo: '/images/roles/admin.jpg'
    }
  };`,
`  const roleConfigs = {
    farmer: {
      label: getT('field_farmer_id', 'Mobile Number / Farmer ID'),
      placeholder: getT('placeholder_farmer_id', 'e.g. 9876543210 or FRM202600001'),
      defaultVal: '9876543210',
      passVal: 'Kisan@123',
      btnText: getT('login_role_farmer_btn', 'Login to Kisan Portal'),
      btnColor: '#0D5C3A',
      photo: '/images/roles/farmer.jpg'
    },
    officer: {
      label: getT('field_officer_id', 'Official Email / Employee ID'),
      placeholder: getT('placeholder_officer_id', 'e.g. officer@kpms.gov.in'),
      defaultVal: 'officer@kpms.gov.in',
      passVal: 'Officer@123',
      btnText: getT('login_role_officer_btn', 'Login to Officer Portal'),
      btnColor: '#2563EB',
      photo: '/images/roles/officer.jpg'
    },
    admin: {
      label: getT('field_admin_email', 'Super Admin Email'),
      placeholder: getT('placeholder_admin_id', 'e.g. admin@kpms.gov.in'),
      defaultVal: 'admin@kpms.gov.in',
      passVal: 'Admin@123',
      btnText: getT('login_role_admin_btn', 'Login as Administrator'),
      btnColor: '#E06D14',
      photo: '/images/roles/admin.jpg'
    }
  };`
);

// Role Pills in Hero Login Form
code = code.replace(
`<img src="/images/roles/farmer.jpg" alt="Farmer" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> Farmer`,
`<img src="/images/roles/farmer.jpg" alt="Farmer" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> \${getT('role_farmer', 'Farmer')}`
);

code = code.replace(
`<img src="/images/roles/officer.jpg" alt="Officer" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> Officer`,
`<img src="/images/roles/officer.jpg" alt="Officer" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> \${getT('role_officer', 'Officer')}`
);

code = code.replace(
`<img src="/images/roles/admin.jpg" alt="Super Admin" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> Super Admin`,
`<img src="/images/roles/admin.jpg" alt="Super Admin" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> \${getT('role_admin', 'Super Admin')}`
);

// Password label & placeholder & forgot password
code = code.replace(
`<i class="fas fa-key" style="color:var(--primary-dark);"></i> Password <span style="color:#EF4444;">*</span>`,
`<i class="fas fa-key" style="color:var(--primary-dark);"></i> \${getT('login_password', 'Password')} <span style="color:#EF4444;">*</span>`
);

code = code.replace(
`Forgot Password?`,
`\${getT('form_forgot_pass', 'Forgot Password?')}`
);

code = code.replace(
`placeholder="Enter secure password"`,
`placeholder="\${getT('placeholder_password', 'Enter secure password')}"`
);

// Remember device
code = code.replace(
`Remember this device`,
`\${getT('form_remember', 'Remember this device')}`
);

// Aadhaar & Coming soon
code = code.replace(
`<i class="fas fa-fingerprint" style="color:#0D5C3A;"></i> Login with Aadhaar <span class="badge" style="background:#E5E7EB; color:#4B5563; font-size:0.68rem; margin-left:6px;">Coming Soon</span>`,
`<i class="fas fa-fingerprint" style="color:#0D5C3A;"></i> \${getT('auth_login_aadhaar', 'Login with Aadhaar')} <span class="badge" style="background:#E5E7EB; color:#4B5563; font-size:0.68rem; margin-left:6px;">\${getT('status_coming_soon', 'Coming Soon')}</span>`
);

// Don't have an account? Register Now
code = code.replace(
`Don't have an account? \n        <a onclick="switchHeroAuthTab('register')" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">\n          Register Now\n        </a>`,
`\${getT('auth_no_account', "Don't have an account?")} \n        <a onclick="switchHeroAuthTab('register')" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">\n          \${getT('auth_register_now', 'Register Now')}\n        </a>`
);

// Register Hero Form
code = code.replace(
`Create a verified digital identity on the National Kisan Procurement Grid.`,
`\${getT('reg_hero_sub', 'Create a verified digital identity on the National Kisan Procurement Grid.')}`
);

code = code.replace(
`<strong style="font-size:0.9rem; color:var(--text-main); display:block;">Farmer / Kisan Registration</strong>\n              <small style="font-size:0.75rem; color:var(--text-muted);">Aadhaar e-KYC, land verification, and instant token booking</small>`,
`<strong style="font-size:0.9rem; color:var(--text-main); display:block;">\${getT('reg_farmer_card_title', 'Farmer / Kisan Registration')}</strong>\n              <small style="font-size:0.75rem; color:var(--text-muted);">\${getT('reg_farmer_card_sub', 'Aadhaar e-KYC, land verification, and instant token booking')}</small>`
);

code = code.replace(
`<strong style="font-size:0.9rem; color:var(--text-main); display:block;">Procurement Officer Registration</strong>\n              <small style="font-size:0.75rem; color:var(--text-muted);">Official APMC cadre allocation (Requires Admin Approval)</small>`,
`<strong style="font-size:0.9rem; color:var(--text-main); display:block;">\${getT('reg_officer_card_title', 'Procurement Officer Registration')}</strong>\n              <small style="font-size:0.75rem; color:var(--text-muted);">\${getT('reg_officer_card_sub', 'Official APMC cadre allocation (Requires Admin Approval)')}</small>`
);

code = code.replace(
`<span>Super Admin accounts require ministry provisioning and cannot be registered publicly.</span>`,
`<span>\${getT('reg_admin_note', 'Super Admin accounts require ministry provisioning and cannot be registered publicly.')}</span>`
);

code = code.replace(
`Already registered? \n        <a onclick="switchHeroAuthTab('login')" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">\n          Back to Login\n        </a>`,
`\${getT('auth_already_registered', 'Already registered?')} \n        <a onclick="switchHeroAuthTab('login')" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">\n          \${getT('auth_back_to_login', 'Back to Login')}\n        </a>`
);

// Authenticated Card
code = code.replace(
`<i class="fas fa-circle-check" style="color:#10B981;"></i> Active Session`,
`<i class="fas fa-circle-check" style="color:#10B981;"></i> \${getT('active_session_badge', 'Active Session')}`
);

code = code.replace(
`Welcome back, \${user.name || 'Farmer'}!`,
`\${getT('welcome_back_user', 'Welcome back,')} \${user.name || getT('role_farmer', 'Farmer')}!`
);

code = code.replace(
`<i class="fas fa-sign-out-alt"></i> Sign Out`,
`<i class="fas fa-sign-out-alt"></i> \${getT('sign_out', 'Sign Out')}`
);

// Why SmartProcure Section
code = code.replace(
`<span class="sp-subheading-tag"><i class="fas fa-bullseye"></i> CORE CAPABILITIES</span>\n            <h2 class="sp-section-title">Why SmartProcure?</h2>`,
`<span class="sp-subheading-tag"><i class="fas fa-bullseye"></i> \${getT('sec_core_capabilities', 'CORE CAPABILITIES')}</span>\n            <h2 class="sp-section-title">\${getT('sec_why_title', 'Why SmartProcure?')}</h2>`
);

code = code.replace(
`Engineered specifically for Indian farmers and APMC mandi operations to eliminate bottleneck congestion and ensure complete transparency.`,
`\${getT('sec_why_sub', 'Engineered specifically for Indian farmers and APMC mandi operations to eliminate bottleneck congestion and ensure complete transparency.')}`
);

code = code.replace(
`<h3 class="sp-why-title">Smart Mandi Finder</h3>\n              <p class="sp-why-text">\n                Find the most suitable procurement centre based on price, distance, capacity, weather and expected waiting time.\n              </p>`,
`<h3 class="sp-why-title">\${getT('pillar_mandi_title', 'Smart Mandi Finder')}</h3>\n              <p class="sp-why-text">\n                \${getT('pillar_mandi_desc', 'Find the most suitable procurement centre based on price, distance, capacity, weather and expected waiting time.')}\n              </p>`
);

code = code.replace(
`Explore Mandis <i class="fas fa-arrow-right"></i>`,
`\${getT('link_explore_mandis', 'Explore Mandis')} <i class="fas fa-arrow-right"></i>`
);

code = code.replace(
`<h3 class="sp-why-title">Smart Slot Booking</h3>\n              <p class="sp-why-text">\n                Book your preferred procurement date and time slot and receive a digital token.\n              </p>`,
`<h3 class="sp-why-title">\${getT('pillar_slot_title', 'Smart Slot Booking')}</h3>\n              <p class="sp-why-text">\n                \${getT('pillar_slot_desc', 'Book your preferred procurement date and time slot and receive a digital token.')}\n              </p>`
);

code = code.replace(
`Book Slot <i class="fas fa-arrow-right"></i>`,
`\${getT('link_book_slot', 'Book Slot')} <i class="fas fa-arrow-right"></i>`
);

code = code.replace(
`<h3 class="sp-why-title">Live Queue Tracking</h3>\n              <p class="sp-why-text">\n                Know your token position and estimated waiting time before reaching the centre.\n              </p>`,
`<h3 class="sp-why-title">\${getT('pillar_queue_title', 'Live Queue Tracking')}</h3>\n              <p class="sp-why-text">\n                \${getT('pillar_queue_desc', 'Know your token position and estimated waiting time before reaching the centre.')}\n              </p>`
);

code = code.replace(
`Track Queue <i class="fas fa-arrow-right"></i>`,
`\${getT('link_track_queue', 'Track Queue')} <i class="fas fa-arrow-right"></i>`
);

code = code.replace(
`<h3 class="sp-why-title">Transparent Payment Tracking</h3>\n              <p class="sp-why-text">\n                Track procurement, J-Form processing, payment sanction and DBT status.\n              </p>`,
`<h3 class="sp-why-title">\${getT('pillar_msp_title', 'Guaranteed MSP & Direct DBT')}</h3>\n              <p class="sp-why-text">\n                \${getT('pillar_msp_desc', 'Transparent digital weighment and direct bank payment without middlemen.')}\n              </p>`
);

// Journey Timeline
code = code.replace(
`<h2 class="sp-section-title">Your Complete Procurement Journey</h2>`,
`<h2 class="sp-section-title">\${getT('sec_journey_title', 'Your Complete Procurement Journey')}</h2>`
);

code = code.replace(
`From arrival at the APMC gate to the final DBT credit into your bank account, every phase is verified on the digital ledger.`,
`\${getT('sec_journey_sub', 'From arrival at the APMC gate to the final DBT credit into your bank account, every phase is verified on the digital ledger.')}`
);

fs.writeFileSync(landingPath, code, 'utf8');
console.log('Successfully updated landing-page.js with getT() translations');
