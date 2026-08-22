// Smart India Hackathon (SIH) Presentation & Demo Engine

let presentationTimerInterval = null;
let presentationSecondsRemaining = 300; // 5 Minutes

const initSIHTour = () => {
  const timerEl = document.getElementById('sih-judge-timer');
  if (timerEl && !presentationTimerInterval) {
    presentationTimerInterval = setInterval(() => {
      if (presentationSecondsRemaining > 0) {
        presentationSecondsRemaining--;
        const m = Math.floor(presentationSecondsRemaining / 60);
        const s = presentationSecondsRemaining % 60;
        timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
    }, 1000);
  }
};

const trigger1ClickDemoReset = async () => {
  if (!confirm('Reset entire KPMS database to realistic SIH Hackathon demo state?')) return;
  showToast('Refreshing sample Farmers, Officers, Mandis, Bookings, and Live Queues...', 'info');

  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (err) {
    showToast('Failed to reset demo dataset', 'error');
  }
};

const triggerSIHSimulation = async () => {
  showToast('⚡ Running 30-Second Automated Procurement Simulation...', 'info');

  try {
    const res = await fetch('/api/demo/simulate', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`Simulation Step 1: Booking ${data.data.bookingNumber} created & Token ${data.data.tokenNumber} checked in at Gate!`, 'success');
      
      // Auto open display board or officer console to show live token
      routeTo('#tv-display');
    }
  } catch (err) {
    showToast('Simulation failed: ' + err.message, 'error');
  }
};

const startJudgeGuidedTour = () => {
  const steps = [
    { title: "1. Farmer Portal & KYC", text: "Farmers register with Aadhaar & Bank accounts, getting a unique Farmer ID (e.g. FARM000001)." },
    { title: "2. Smart Slot Booking", text: "Farmers select Mandi and book guaranteed 30-min time slots to eliminate physical congestion." },
    { title: "3. Gate QR Check-in", text: "At Mandi entrance, Officer scans the QR code to dispense digital tokens (e.g. A001) and assign counters." },
    { title: "4. Digital Weighbridge & Inspection", text: "Quality inspection parameters (moisture %, grade) and digital scale measurements are captured transparently with canvas signatures." },
    { title: "5. Direct DBT Treasury Release", text: "MSP funds are transferred straight to the farmer's bank account with UTR tracking within 48 hours." }
  ];

  let currentStepIdx = 0;
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'SIH Guided Tour: KPMS Architecture';

  const renderTourStep = () => {
    const s = steps[currentStepIdx];
    body.innerHTML = `
      <div style="padding:10px; text-align:center;">
        <span class="hero-pill" style="margin-bottom:12px;">Step ${currentStepIdx + 1} of ${steps.length}</span>
        <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:12px;">${s.title}</h3>
        <p style="color:var(--text-muted); font-size:1rem; line-height:1.6; margin-bottom:24px;">${s.text}</p>
        <div style="display:flex; justify-content:space-between;">
          <button class="btn btn-outline" ${currentStepIdx === 0 ? 'disabled' : ''} onclick="prevTourStep()"><i class="fas fa-arrow-left"></i> Previous</button>
          ${currentStepIdx < steps.length - 1 ? `
            <button class="btn btn-primary" onclick="nextTourStep()">Next Step <i class="fas fa-arrow-right"></i></button>
          ` : `
            <button class="btn btn-success" onclick="closeModal(); demoLogin('farmer');">Launch Farmer Demo <i class="fas fa-rocket"></i></button>
          `}
        </div>
      </div>
    `;
  };

  window.nextTourStep = () => { if (currentStepIdx < steps.length - 1) { currentStepIdx++; renderTourStep(); } };
  window.prevTourStep = () => { if (currentStepIdx > 0) { currentStepIdx--; renderTourStep(); } };

  renderTourStep();
  modal.classList.add('active');
};
