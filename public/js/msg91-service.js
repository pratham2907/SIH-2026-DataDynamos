/**
 * Kisan Procurement Management System (KPMS)
 * MSG91 Real OTP Authentication Service & Widget Integration
 */

window.KPMS_MSG91 = {
  widgetId: "3669676d316f323335383235",
  tokenAuth: "568684TJ6Q4Cu9Q6a9ec1f4P1",
  isReady: false,
  verifiedNumbers: new Set(),
  lastVerifiedToken: null
};

// Fetch dynamic config from backend on startup
(async function initMsg91Config() {
  try {
    const res = await fetch('/api/auth/msg91/config');
    const data = await res.json();
    if (data.success && data.widgetId) {
      window.KPMS_MSG91.widgetId = data.widgetId;
      window.KPMS_MSG91.tokenAuth = data.tokenAuth;
    }
  } catch (e) {
    console.warn('MSG91 config fetch note:', e.message);
  }
})();

// Load MSG91 OTP Script using official failover loader
(function loadOtpScript(urls) {
  let i = 0;
  function attempt() {
    const s = document.createElement('script');
    s.src = urls[i];
    s.async = true;
    s.onload = () => {
      console.log('✅ MSG91 OTP Widget SDK initialized from:', urls[i]);
      window.KPMS_MSG91.isReady = true;
    };
    s.onerror = () => {
      i++;
      if (i < urls.length) {
        attempt();
      } else {
        console.warn('Failed to load MSG91 SDK from all mirror endpoints.');
      }
    };
    document.head.appendChild(s);
  }
  attempt();
})([
  'https://verify.msg91.com/otp-provider.js',
  'https://verify.phone91.com/otp-provider.js'
]);

/**
 * Format mobile number to international format (e.g. +91XXXXXXXXXX)
 */
function formatMsg91Identifier(mobile) {
  if (!mobile) return '';
  let clean = String(mobile).replace(/\D/g, '');
  if (clean.length === 10) {
    return '+91' + clean;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return '+' + clean;
  }
  if (String(mobile).trim().startsWith('+')) {
    return String(mobile).trim();
  }
  return clean ? ('+' + clean) : '';
}

/**
 * Launch MSG91 Real OTP Verification Widget
 * @param {Object} options
 * @param {string} options.identifier - Mobile number (e.g. '9876543210' or '+919876543210')
 * @param {string} options.context - e.g. 'farmer_registration', 'farmer_login', 'tester'
 * @param {string} [options.tempId] - Optional registration session temp ID
 * @param {string} [options.tempSessionId] - Optional login session temp ID
 * @param {Function} [options.onSuccess] - Callback when OTP is verified
 * @param {Function} [options.onFailure] - Callback when verification fails
 */
window.triggerMsg91OTP = function(options = {}) {
  const { identifier, context, tempId, tempSessionId, onSuccess, onFailure } = options;

  if (typeof window.initSendOTP !== 'function') {
    if (typeof showToast === 'function') {
      showToast('⏳ Loading MSG91 OTP Engine... Please retry in 2 seconds.', 'info');
    }
    // Attempt re-init
    setTimeout(() => {
      if (typeof window.initSendOTP === 'function') {
        window.triggerMsg91OTP(options);
      } else {
        alert('MSG91 OTP Service is loading. Please check your internet connection and click again.');
      }
    }, 1500);
    return;
  }

  const formattedId = formatMsg91Identifier(identifier);
  const cleanMobile = identifier ? String(identifier).replace(/\D/g, '').slice(-10) : '';

  if (typeof showToast === 'function') {
    showToast(`📱 Launching MSG91 Secure OTP Gateway for ${formattedId || 'mobile'}...`, 'info');
  }

  const configuration = {
    widgetId: window.KPMS_MSG91.widgetId,
    tokenAuth: window.KPMS_MSG91.tokenAuth,
    identifier: formattedId || undefined,
    exposeMethods: false,
    success: async (data) => {
      console.log('✅ [MSG91 OTP SUCCESS]:', data);
      window.KPMS_MSG91.lastVerifiedToken = data;
      if (cleanMobile) {
        window.KPMS_MSG91.verifiedNumbers.add(cleanMobile);
      }

      // Synchronize with KPMS backend
      try {
        const resp = await fetch('/api/auth/msg91/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: data,
            mobile: cleanMobile || identifier,
            context: context || 'direct_verification',
            tempId,
            tempSessionId
          })
        });
        const json = await resp.json();
        console.log('Backend MSG91 Token Sync:', json);

        if (typeof showToast === 'function') {
          showToast(`✅ Phone ${formattedId || cleanMobile} successfully authenticated via MSG91 Real OTP!`, 'success');
        }

        // Close tester modal if open
        const modal = document.getElementById('msg91-tester-modal');
        if (modal) modal.style.display = 'none';

        if (typeof onSuccess === 'function') {
          onSuccess(json, data);
        }
      } catch (err) {
        console.warn('Backend sync warning:', err);
        if (typeof showToast === 'function') {
          showToast(`✅ Mobile authenticated via MSG91 OTP!`, 'success');
        }
        if (typeof onSuccess === 'function') {
          onSuccess({ success: true, verified: true, mobile: cleanMobile }, data);
        }
      }
    },
    failure: (error) => {
      console.error('❌ [MSG91 OTP FAILURE]:', error);
      if (typeof showToast === 'function') {
        showToast(`❌ OTP Verification failed or was closed. Please try again.`, 'error');
      }
      if (typeof onFailure === 'function') {
        onFailure(error);
      }
    }
  };

  try {
    window.initSendOTP(configuration);
  } catch (err) {
    console.error('Error invoking initSendOTP:', err);
    alert('Could not open MSG91 OTP Widget: ' + err.message);
  }
};

/**
 * Open Standalone MSG91 Mobile Verification Modal
 * Accessible from navigation bar or any test button
 */
window.openMsg91TesterModal = function(prefill = '') {
  let modal = document.getElementById('msg91-tester-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'msg91-tester-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.75); z-index:99999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:16px;';
    modal.innerHTML = `
      <div style="background:var(--bg-card, #FFFFFF); width:100%; max-width:480px; border-radius:14px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.35); overflow:hidden; border:1px solid rgba(0,0,0,0.1); animation:fadeIn 0.2s ease;">
        <div style="background:linear-gradient(135deg, #0E2A47 0%, #1A446C 100%); color:#FFF; padding:18px 20px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(224,109,20,0.25); display:flex; align-items:center; justify-content:center; color:var(--saffron, #E06D14); font-size:1.2rem;">
              <i class="fas fa-shield-check"></i>
            </div>
            <div>
              <div style="font-weight:800; font-size:1.05rem; letter-spacing:0.3px;">MSG91 Real OTP Gateway</div>
              <div style="font-size:0.75rem; color:#94A3B8;">National Farmer Portal Authentication</div>
            </div>
          </div>
          <button onclick="document.getElementById('msg91-tester-modal').style.display='none'" style="background:transparent; border:none; color:#FFF; font-size:1.2rem; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="padding:22px 24px;">
          <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:12px; margin-bottom:18px; display:flex; gap:10px; font-size:0.83rem; color:#166534;">
            <i class="fas fa-info-circle" style="font-size:1.1rem; margin-top:2px;"></i>
            <div>
              Enter any real Indian mobile number below to receive a live SMS OTP from <strong>MSG91</strong>. The widget will verify the code in real-time.
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-main, #334155); margin-bottom:6px;">
              Mobile Number (10 Digits) <span style="color:#EF4444;">*</span>
            </label>
            <div style="display:flex; gap:8px;">
              <span style="display:flex; align-items:center; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:8px; padding:0 12px; font-weight:700; font-size:0.9rem; color:#475569;">
                🇮🇳 +91
              </span>
              <input 
                type="tel" 
                id="msg91-test-phone" 
                maxlength="10" 
                placeholder="9876543210" 
                value="${prefill || ''}"
                style="flex:1; border:1.5px solid #CBD5E1; border-radius:8px; padding:10px 14px; font-size:1rem; font-weight:600; outline:none;"
                oninput="this.value = this.value.replace(/\\D/g, '')"
              />
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-bottom:18px;">
            <button 
              type="button" 
              onclick="executeMsg91Test()" 
              class="btn btn-primary" 
              style="flex:1; justify-content:center; padding:12px; font-weight:700; background:linear-gradient(135deg, #E06D14, #C25607); border:none; box-shadow:0 4px 12px rgba(224,109,20,0.35);"
            >
              <i class="fas fa-paper-plane" style="margin-right:6px;"></i> Send Real SMS OTP
            </button>
          </div>

          <div id="msg91-result-box" style="display:none; border-radius:8px; padding:12px; font-size:0.85rem;"></div>

          <div style="border-top:1px solid #E2E8F0; padding-top:14px; margin-top:14px; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748B;">
            <span><i class="fas fa-lock"></i> Widget ID: <code>3669...8235</code></span>
            <span style="color:#059669; font-weight:700;"><i class="fas fa-check-circle"></i> MSG91 Active</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    const input = document.getElementById('msg91-test-phone');
    if (input && prefill) input.value = prefill;
    const resBox = document.getElementById('msg91-result-box');
    if (resBox) resBox.style.display = 'none';
    modal.style.display = 'flex';
  }
};

window.executeMsg91Test = async function() {
  const phone = document.getElementById('msg91-test-phone')?.value?.trim();
  const resBox = document.getElementById('msg91-result-box');

  if (!phone || phone.length < 10) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }

  if (resBox) {
    resBox.style.display = 'block';
    resBox.style.background = '#EFF6FF';
    resBox.style.color = '#1E40AF';
    resBox.style.border = '1px solid #BFDBFE';
    resBox.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Dispatching live SMS OTP via MSG91 to +91 ${phone}...`;
  }

  try {
    const res = await fetch('/api/auth/msg91/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: phone })
    });
    const data = await res.json();

    if (!data.success) {
      if (resBox) {
        resBox.style.background = '#FEF2F2';
        resBox.style.color = '#991B1B';
        resBox.style.border = '1px solid #FECACA';
        resBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed to send OTP: ${data.message || 'Error from MSG91'}`;
      }
      return;
    }

    if (typeof showToast === 'function') {
      showToast(`📲 Real SMS OTP sent to +91 ${phone} via MSG91!`, 'success');
    }

    if (resBox) {
      resBox.style.background = '#F8FAFC';
      resBox.style.color = '#0F172A';
      resBox.style.border = '1.5px solid #E2E8F0';
      resBox.innerHTML = `
        <div style="font-weight:700; color:#059669; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <i class="fas fa-check-circle"></i> Live SMS Delivered via MSG91!
        </div>
        <div style="font-size:0.8rem; color:#64748B; margin-bottom:12px;">
          Check SMS inbox on <strong>+91 ${phone}</strong> and enter the 6-digit code below:
        </div>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <input 
            type="text" 
            id="msg91-entered-otp" 
            maxlength="6" 
            placeholder="Enter 6-digit OTP" 
            style="flex:1; border:1.5px solid #CBD5E1; border-radius:8px; padding:10px 14px; font-size:1.1rem; font-weight:700; text-align:center; letter-spacing:4px; outline:none;"
            oninput="this.value = this.value.replace(/\\D/g, '')"
            autofocus
          />
          <button 
            type="button" 
            onclick="submitMsg91DirectVerify('${phone}')" 
            class="btn btn-success" 
            style="padding:10px 18px; font-weight:700;"
          >
            Verify OTP
          </button>
        </div>
        <div id="msg91-verify-status" style="font-size:0.78rem;"></div>
      `;
      setTimeout(() => document.getElementById('msg91-entered-otp')?.focus(), 100);
    }
  } catch (err) {
    if (resBox) {
      resBox.style.background = '#FEF2F2';
      resBox.style.color = '#991B1B';
      resBox.style.border = '1px solid #FECACA';
      resBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Network error: ${err.message}`;
    }
  }
};

window.submitMsg91DirectVerify = async function(phone) {
  const otpInput = document.getElementById('msg91-entered-otp');
  const otp = otpInput?.value?.trim();
  const statusDiv = document.getElementById('msg91-verify-status');
  const resBox = document.getElementById('msg91-result-box');

  if (!otp || otp.length !== 6) {
    if (statusDiv) {
      statusDiv.style.color = '#EF4444';
      statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter all 6 digits of the OTP.';
    }
    return;
  }

  if (statusDiv) {
    statusDiv.style.color = '#2563EB';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating OTP with MSG91...';
  }

  try {
    const res = await fetch('/api/auth/msg91/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: phone, otp })
    });
    const json = await res.json();

    if (!json.success) {
      if (statusDiv) {
        statusDiv.style.color = '#EF4444';
        statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${json.message || 'Invalid OTP'}`;
      }
      return;
    }

    // Success!
    window.KPMS_MSG91.verifiedNumbers.add(phone.slice(-10));
    if (typeof showToast === 'function') {
      showToast(`✅ Phone +91 ${phone} authenticated successfully!`, 'success');
    }

    if (resBox) {
      resBox.style.background = '#F0FDF4';
      resBox.style.color = '#166534';
      resBox.style.border = '1.5px solid #86EFAC';
      resBox.innerHTML = `
        <div style="font-weight:800; font-size:1rem; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
          <i class="fas fa-check-circle" style="color:#16A34A; font-size:1.2rem;"></i> Mobile +91 ${phone} Verified!
        </div>
        <div style="font-size:0.8rem; color:#15803D;">
          Cryptographic mobile authentication confirmed via MSG91 Real SMS OTP Gateway.
        </div>
      `;
    }
  } catch (err) {
    if (statusDiv) {
      statusDiv.style.color = '#EF4444';
      statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> Verification error: ${err.message}`;
    }
  }
};
