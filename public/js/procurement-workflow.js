// Digital Weighbridge, Quality Inspection & Procurement Workflow Controller

let currentProcStep = 1;
let currentProcContext = null;
let officerSigCanvas = null;

const openProcurementStepper = async (tokenNumber = 'A001', bookingNumber = 'BKG-2026-001') => {
  const token = localStorage.getItem('kpms_token');
  showToast('Loading farmer weighbridge & inspection context...', 'info');

  try {
    const res = await fetch(`/api/procurement/context?tokenNumber=${tokenNumber}&bookingNumber=${bookingNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) {
      showToast('Could not load context for token ' + tokenNumber, 'error');
      return;
    }

    currentProcContext = result.data;
    renderProcurementModal();
  } catch (err) {
    showToast('Procurement load error: ' + err.message, 'error');
  }
};

const renderProcurementModal = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  const { farmer, booking, queue, suggestedMSP, cropName, declaredQuantity } = currentProcContext;

  document.getElementById('modal-title').textContent = `Procurement Console - Token ${queue.tokenNumber}`;

  body.innerHTML = `
    <div style="padding:10px;">
      <!-- Step Indicators -->
      <div class="wizard-steps" style="margin-bottom:20px;">
        <div class="step-item active" id="proc-step-ind-1">
          <div class="step-circle">1</div>
          <div class="step-title">KYC & Crop</div>
        </div>
        <div class="step-item" id="proc-step-ind-2">
          <div class="step-circle">2</div>
          <div class="step-title">Quality Inspection</div>
        </div>
        <div class="step-item" id="proc-step-ind-3">
          <div class="step-circle">3</div>
          <div class="step-title">Weighbridge</div>
        </div>
        <div class="step-item" id="proc-step-ind-4">
          <div class="step-circle">4</div>
          <div class="step-title">DBT & Sign</div>
        </div>
      </div>

      <form id="procurement-stepper-form" onsubmit="handleProcurementSubmit(event)">
        <!-- Step 1: Farmer & Crop Verification -->
        <div id="proc-step-1" class="proc-step-pane">
          <div class="glass-card" style="padding:16px; margin-bottom:16px;">
            <h4 style="color:var(--primary-navy); margin-bottom:10px;"><i class="fas fa-id-card"></i> Farmer Identity & Crop Declaration</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.88rem;">
              <div><strong>Farmer Name:</strong> ${farmer.fullName}</div>
              <div><strong>Farmer ID:</strong> ${farmer.farmerId}</div>
              <div><strong>Aadhaar No:</strong> XXXX-XXXX-${(farmer.aadhaarNumber || '1234').slice(-4)}</div>
              <div><strong>Village:</strong> ${farmer.village || 'N/A'}</div>
              <div><strong>Registered Crop:</strong> ${cropName}</div>
              <div><strong>Declared Quantity:</strong> ${declaredQuantity} Q</div>
              <div><strong>Bank Account:</strong> ${farmer.bankName} (${farmer.accountNumber})</div>
              <div><strong>IFSC Code:</strong> ${farmer.ifscCode}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <button type="button" class="btn btn-primary" onclick="goToProcStep(2)">Proceed to Quality Inspection <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>

        <!-- Step 2: Quality Inspection Form -->
        <div id="proc-step-2" class="proc-step-pane" style="display:none;">
          <h4 style="color:var(--primary-navy); margin-bottom:12px;"><i class="fas fa-microscope"></i> Fair Average Quality (FAQ) Testing</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div class="form-group">
              <label class="form-label">Moisture Content (%) * [Max 12.0%]</label>
              <input type="number" id="proc-moisture" class="form-control" step="0.1" value="11.2" oninput="calculateProcGrade()" required />
            </div>
            <div class="form-group">
              <label class="form-label">Foreign Material (%) * [Max 0.75%]</label>
              <input type="number" id="proc-foreign" class="form-control" step="0.1" value="0.4" required />
            </div>
            <div class="form-group">
              <label class="form-label">Broken Grain (%) * [Max 2.0%]</label>
              <input type="number" id="proc-broken" class="form-control" step="0.1" value="1.0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Assigned Quality Grade *</label>
              <select id="proc-grade" class="form-control" required>
                <option value="A">Grade A (Superior - 100% MSP + Bonus)</option>
                <option value="B">Grade B (Standard FAQ)</option>
                <option value="C">Grade C (Slight Deduction)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Inspection Officer Notes</label>
            <input type="text" id="proc-insp-notes" class="form-control" value="Grain lustrous, sound, no infestation detected." />
          </div>
          <div style="display:flex; justify-content:space-between;">
            <button type="button" class="btn btn-outline" onclick="goToProcStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
            <button type="button" class="btn btn-primary" onclick="goToProcStep(3)">Proceed to Weighbridge <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>

        <!-- Step 3: Weighbridge Measurement -->
        <div id="proc-step-3" class="proc-step-pane" style="display:none;">
          <h4 style="color:var(--primary-navy); margin-bottom:12px;"><i class="fas fa-scale-balanced"></i> Digital Weighbridge Scale Measurement</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label class="form-label">Gross Weight (Q) *</label>
              <input type="number" id="proc-gross" class="form-control" step="0.1" value="${(parseFloat(declaredQuantity) + 2.5).toFixed(1)}" oninput="calcNetWeight()" required />
            </div>
            <div class="form-group">
              <label class="form-label">Tare Weight (Q) *</label>
              <input type="number" id="proc-tare" class="form-control" step="0.1" value="2.5" oninput="calcNetWeight()" required />
            </div>
            <div class="form-group">
              <label class="form-label">Net Measured Weight (Q)</label>
              <input type="number" id="proc-net" class="form-control" step="0.1" value="${declaredQuantity}" readonly style="background:var(--bg-main); font-weight:700; color:var(--green-gov);" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div class="form-group">
              <label class="form-label">Accepted Quantity (Q) *</label>
              <input type="number" id="proc-accepted-qty" class="form-control" step="0.1" value="${declaredQuantity}" oninput="calcProcPricing()" required />
            </div>
            <div class="form-group">
              <label class="form-label">Rejected Quantity (Q)</label>
              <input type="number" id="proc-rejected-qty" class="form-control" step="0.1" value="0.0" />
            </div>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <button type="button" class="btn btn-outline" onclick="goToProcStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
            <button type="button" class="btn btn-primary" onclick="goToProcStep(4)">Calculate Payment & Sign <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>

        <!-- Step 4: Price Calculation & Digital Signatures -->
        <div id="proc-step-4" class="proc-step-pane" style="display:none;">
          <h4 style="color:var(--primary-navy); margin-bottom:12px;"><i class="fas fa-file-invoice-dollar"></i> Direct Benefit Transfer (DBT) Voucher</h4>
          <div class="glass-card" style="padding:16px; margin-bottom:16px; background:#F0FDF4; border:1px solid #BBF7D0;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.9rem;">
              <div>Minimum Support Price (MSP): <strong>₹${suggestedMSP} / Quintal</strong></div>
              <div>Accepted Quantity: <strong id="summary-accepted-q">${declaredQuantity} Q</strong></div>
              <div>Government Bonus: <strong>+ ₹2,500</strong></div>
              <div>Deductions: <strong>₹0.00</strong></div>
            </div>
            <div style="margin-top:12px; font-size:1.25rem; font-weight:800; color:var(--green-gov); border-top:1px solid #86EFAC; padding-top:8px;">
              Total DBT Payout: <span id="summary-final-payout">₹${((parseFloat(declaredQuantity) * suggestedMSP) + 2500).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Digital Signature Pad -->
          <div class="form-group">
            <label class="form-label"><i class="fas fa-pen-nib"></i> Officer Digital Signature Pad</label>
            <div style="border:1px solid #CBD5E1; border-radius:8px; background:#FFF; overflow:hidden;">
              <canvas id="officer-sig-canvas" width="480" height="90" style="width:100%; display:block; cursor:crosshair;"></canvas>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:4px;">
              <span style="font-size:0.75rem; color:var(--text-muted);">Sign with mouse/finger above</span>
              <a onclick="clearSignaturePad()" style="font-size:0.75rem; color:#EF4444; cursor:pointer;">Clear Signature</a>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:20px;">
            <button type="button" class="btn btn-outline" onclick="goToProcStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
            <button type="submit" class="btn btn-success" style="padding:10px 24px;"><i class="fas fa-check-double"></i> Complete Procurement & Issue Receipt</button>
          </div>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('active');
  initCanvasSignature();
};

const goToProcStep = (step) => {
  document.querySelectorAll('.proc-step-pane').forEach(el => el.style.display = 'none');
  const target = document.getElementById(`proc-step-${step}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.step-item').forEach((el, idx) => {
    el.classList.remove('active');
    if (idx + 1 < step) el.classList.add('completed');
    if (idx + 1 === step) el.classList.add('active');
  });

  currentProcStep = step;
  if (step === 4) {
    calcProcPricing();
  }
};

const calcNetWeight = () => {
  const gross = parseFloat(document.getElementById('proc-gross').value) || 0;
  const tare = parseFloat(document.getElementById('proc-tare').value) || 0;
  const net = Math.max(0, gross - tare);
  document.getElementById('proc-net').value = net.toFixed(1);
  document.getElementById('proc-accepted-qty').value = net.toFixed(1);
};

const calcProcPricing = () => {
  const accepted = parseFloat(document.getElementById('proc-accepted-qty').value) || 0;
  const msp = currentProcContext ? currentProcContext.suggestedMSP : 2275;
  const bonus = 2500;
  const total = (accepted * msp) + bonus;

  const elQ = document.getElementById('summary-accepted-q');
  const elPay = document.getElementById('summary-final-payout');
  if (elQ) elQ.textContent = `${accepted} Q`;
  if (elPay) elPay.textContent = `₹${total.toLocaleString('en-IN')}`;
};

const calculateProcGrade = () => {
  const moisture = parseFloat(document.getElementById('proc-moisture').value) || 12;
  const gradeSel = document.getElementById('proc-grade');
  if (moisture <= 11.5) gradeSel.value = 'A';
  else if (moisture <= 12.5) gradeSel.value = 'B';
  else gradeSel.value = 'C';
};

const initCanvasSignature = () => {
  setTimeout(() => {
    const canvas = document.getElementById('officer-sig-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0E2A47';
    ctx.lineWidth = 2;
    let drawing = false;

    // Draw default initial signature
    ctx.font = '20px cursive';
    ctx.fillStyle = '#0E2A47';
    ctx.fillText('V. S. Rathore (Officer)', 30, 50);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
        y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
      };
    };

    canvas.onmousedown = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    canvas.onmousemove = (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    window.onmouseup = () => { drawing = false; };
  }, 100);
};

const clearSignaturePad = () => {
  const canvas = document.getElementById('officer-sig-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

const handleProcurementSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  const { farmer, booking, queue, suggestedMSP, cropName } = currentProcContext;

  const acceptedQty = parseFloat(document.getElementById('proc-accepted-qty').value) || 50;
  const moisture = parseFloat(document.getElementById('proc-moisture').value) || 11.2;
  const grade = document.getElementById('proc-grade').value;
  const gross = parseFloat(document.getElementById('proc-gross').value) || 52.5;
  const tare = parseFloat(document.getElementById('proc-tare').value) || 2.5;
  const net = parseFloat(document.getElementById('proc-net').value) || 50.0;

  const canvas = document.getElementById('officer-sig-canvas');
  const signatureDataUrl = canvas ? canvas.toDataURL() : '';

  const payload = {
    bookingNumber: queue.bookingNumber || booking.bookingNumber,
    farmerId: farmer.farmerId,
    centerId: queue.centerId,
    cropName,
    variety: 'FAQ Standard',
    moisturePercentage: moisture,
    foreignMaterial: document.getElementById('proc-foreign').value,
    brokenGrain: document.getElementById('proc-broken').value,
    grade,
    inspectionNotes: document.getElementById('proc-insp-notes').value,
    grossWeight: gross,
    tareWeight: tare,
    netWeight: net,
    acceptedQuantity: acceptedQty,
    rejectedQuantity: document.getElementById('proc-rejected-qty').value,
    msp: suggestedMSP,
    bonus: 2500,
    deductions: 0,
    totalAmount: (acceptedQty * suggestedMSP) + 2500,
    officerSignature: signatureDataUrl,
    officerRemarks: 'Procurement verified under MSP scheme 2025-26.'
  };

  showToast('Finalizing procurement, issuing receipt & updating inventory...', 'info');

  try {
    const res = await fetch('/api/procurement/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Procurement completed! Voucher ${result.data.receiptNumber} generated.`, 'success');
      closeModal();
      loadOfficerDashboard();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Procurement failed: ' + err.message, 'error');
  }
};
