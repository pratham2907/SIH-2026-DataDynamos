// Smart Slot Booking & Reservations Controller

let selectedBookingSlot = '';
let selectedBookingCenterId = '';
let selectedBookingDate = '';

const loadBookingPortal = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) {
    routeTo('#landing');
    return;
  }

  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const centersRes = await fetch('/api/bookings/centers');
    const centersData = await centersRes.json();
    const centers = centersData.data || [];

    const today = new Date().toISOString().split('T')[0];
    const prefill = window.smartBookingPrefill || null;
    window.smartBookingPrefill = null; // consume once

    // Ensure prefilled centre is available in list if from smart engine
    let selectedCenterVal = prefill ? prefill.centerId : 'CTR-01';
    let matchedCenter = centers.find(c => c.centerId === selectedCenterVal);
    let centerOptionsHtml = centers.map(c => `
      <option value="${c.centerId}" ${c.centerId === selectedCenterVal ? 'selected' : ''}>
        ${c.name} (${c.district}, ${c.state}) - Cap: ${c.maxDailyCapacity} Q/day
      </option>
    `).join('');

    if (prefill && !matchedCenter && window.SmartBookingEngine) {
      const smartCentres = window.SmartBookingEngine.DEFAULT_PROCUREMENT_CENTRES || [];
      const sCenter = smartCentres.find(sc => sc.id === prefill.centerId || sc.code === prefill.centerId);
      if (sCenter) {
        centerOptionsHtml = `
          <option value="${sCenter.id}" selected>
            ${sCenter.name} (${sCenter.district}, ${sCenter.state}) - Cap: ${sCenter.maxDailyCapacity || 300} Q/day [Smart Recommended]
          </option>
        ` + centerOptionsHtml;
      }
    }

    container.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-heading">Slot Booking</div>
          <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
          <a class="nav-link" onclick="routeTo('#smart-booking')"><i class="fas fa-wand-magic-sparkles" style="color:var(--saffron);"></i> Smart Mandi Finder</a>
          <a class="nav-link active" onclick="loadBookingPortal()"><i class="fas fa-calendar-plus"></i> New Reservation</a>
          <a class="nav-link" onclick="loadMyBookings()"><i class="fas fa-ticket-alt"></i> My Active Bookings</a>
          <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> Live Queue</a>
        </aside>

        <main class="main-content">
          <div class="glass-panel" style="padding:28px; max-width:900px; margin:0 auto;">
            
            ${prefill ? `
              <div class="glass-panel" style="padding:14px 18px; margin-bottom:20px; background:linear-gradient(135deg, rgba(224,109,20,0.1), rgba(26,122,68,0.08)); border-left:4px solid var(--saffron); border-radius:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <i class="fas fa-wand-magic-sparkles" style="color:var(--saffron); font-size:1.2rem;"></i>
                  <span style="font-size:0.92rem; font-weight:700; color:var(--primary-navy);">
                    Pre-filled from Smart Recommendation: <strong>${prefill.crop}</strong> (${prefill.quantity} Quintals)
                  </span>
                </div>
                <span class="status-pill completed" style="font-size:0.75rem;">Optimized Route</span>
              </div>
            ` : ''}

            <div style="text-align:center; margin-bottom:24px;">
              <span class="hero-pill"><i class="fas fa-bolt"></i> Smart AI Slot Allocation Engine</span>
              <h2 style="font-size:2rem; font-weight:800; color:var(--primary-navy);">Reserve Mandi Procurement Slot</h2>
              <p style="color:var(--text-muted); font-size:0.92rem;">
                Select your preferred Mandi centre, crop quantity, and pick a guaranteed time slot to avoid physical queues.
              </p>
            </div>

            <form id="slot-booking-form" onsubmit="handleSlotBookingSubmit(event)">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <!-- Center Selection -->
                <div class="form-group">
                  <label class="form-label"><i class="fas fa-building"></i> Select Procurement Center (Mandi) *</label>
                  <select id="booking-center-select" class="form-control" onchange="onBookingCenterOrDateChange()" required>
                    <option value="">-- Choose Mandi Centre --</option>
                    ${centerOptionsHtml}
                  </select>
                </div>

                <!-- Date Picker -->
                <div class="form-group">
                  <label class="form-label"><i class="fas fa-calendar-day"></i> Preferred Procurement Date *</label>
                  <input type="date" id="booking-date-input" class="form-control" min="${today}" value="${today}" onchange="onBookingCenterOrDateChange()" required />
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1.2fr 0.8fr 1fr; gap:16px;">
                <!-- Crop Selection -->
                <div class="form-group">
                  <label class="form-label"><i class="fas fa-wheat-awn"></i> Crop Commodity *</label>
                  <select id="booking-crop-select" class="form-control" required>
                    <option value="Wheat (Sharbati)" ${prefill && prefill.crop && prefill.crop.includes('Wheat') ? 'selected' : ''}>Wheat (Sharbati) - MSP ₹2,275/Q</option>
                    <option value="Paddy (Common)" ${prefill && prefill.crop && prefill.crop.includes('Paddy') ? 'selected' : ''}>Paddy (Common) - MSP ₹2,300/Q</option>
                    <option value="Maize (Makka)" ${prefill && prefill.crop && prefill.crop.includes('Maize') ? 'selected' : ''}>Maize (Makka) - MSP ₹2,225/Q</option>
                    <option value="Gram (Chana)" ${prefill && prefill.crop && prefill.crop.includes('Gram') ? 'selected' : ''}>Gram (Chana) - MSP ₹5,440/Q</option>
                    <option value="Mustard (Sarson)" ${prefill && prefill.crop && prefill.crop.includes('Mustard') ? 'selected' : ''}>Mustard (Sarson) - MSP ₹5,650/Q</option>
                    <option value="Soyabean (Yellow)" ${prefill && prefill.crop && prefill.crop.includes('Soyabean') ? 'selected' : ''}>Soyabean (Yellow) - MSP ₹4,892/Q</option>
                  </select>
                </div>

                <!-- Quantity -->
                <div class="form-group">
                  <label class="form-label"><i class="fas fa-weight-scale"></i> Quantity (Quintals) *</label>
                  <input type="number" id="booking-quantity-input" class="form-control" min="1" max="5000" value="${prefill ? prefill.quantity : 45}" required />
                </div>

                <!-- Vehicle Number -->
                <div class="form-group">
                  <label class="form-label"><i class="fas fa-truck"></i> Vehicle / Tractor No.</label>
                  <input type="text" id="booking-vehicle-input" class="form-control" placeholder="e.g. MP-04-HE-1234" />
                </div>
              </div>

              <!-- Live Slots Availability Grid -->
              <div style="margin:20px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <label class="form-label" style="margin:0;"><i class="fas fa-clock"></i> Select Available Time Slot *</label>
                  <span id="capacity-meter-tag" style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">Loading slots...</span>
                </div>
                <div id="slots-grid-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px;">
                  <!-- Dynamic Slots Loaded Here -->
                </div>
              </div>

              <!-- Remarks -->
              <div class="form-group">
                <label class="form-label"><i class="fas fa-comment-dots"></i> Special Remarks / Notes (Optional)</label>
                <input type="text" id="booking-remarks-input" class="form-control" placeholder="e.g. Pre-cleaned grain, moisture tested below 11%" />
              </div>

              <div style="margin-top:24px; text-align:center;">
                <button type="submit" class="btn btn-primary" style="padding:12px 32px; font-size:1.05rem; justify-content:center;">
                  <i class="fas fa-check-circle"></i> Confirm & Generate QR Booking Pass
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    `;

    onBookingCenterOrDateChange();
  } catch (err) {
    showToast('Failed to load booking portal: ' + err.message, 'error');
  }
};

const onBookingCenterOrDateChange = async () => {
  const centerSelect = document.getElementById('booking-center-select');
  const dateInput = document.getElementById('booking-date-input');
  if (!centerSelect || !dateInput) return;

  const centerId = centerSelect.value;
  const date = dateInput.value;
  if (!centerId || !date) return;

  selectedBookingCenterId = centerId;
  selectedBookingDate = date;

  const container = document.getElementById('slots-grid-container');
  const capTag = document.getElementById('capacity-meter-tag');
  container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:15px;" class="skeleton">Checking slot availability...</div>`;

  try {
    const res = await fetch(`/api/bookings/slots?centerId=${centerId}&date=${date}`);
    const data = await res.json();

    if (data.isHoliday) {
      container.innerHTML = `
        <div style="grid-column:1/-1; background:#FEE2E2; color:#B91C1C; padding:16px; border-radius:8px; text-align:center;">
          <i class="fas fa-ban"></i> Mandi is closed on ${date} due to <strong>${data.holidayName}</strong>. Please select another date.
        </div>
      `;
      capTag.textContent = 'Mandi Closed';
      return;
    }

    capTag.textContent = `Today's Booked: ${data.totalBookedToday} / Capacity: ${data.maxDailyCapacity} Q`;

    if (!data.slots || data.slots.length === 0) {
      container.innerHTML = `<p style="grid-column:1/-1; color:var(--text-muted); text-align:center;">No slots available for this date.</p>`;
      return;
    }

    container.innerHTML = data.slots.map((s, idx) => `
      <div 
        class="glass-card slot-card ${s.isFull ? 'disabled' : ''} ${idx === 0 && !s.isFull ? 'selected' : ''}" 
        style="padding:14px; text-align:center; cursor:${s.isFull ? 'not-allowed' : 'pointer'}; border:${idx === 0 && !s.isFull ? '2px solid var(--saffron)' : '1px solid var(--border-color)'}; opacity:${s.isFull ? '0.5' : '1'}; background:${s.isFull ? '#F1F5F9' : 'var(--bg-card)'};"
        onclick="${s.isFull ? '' : `selectTimeSlot('${s.timeSlot}', this)`}"
      >
        <div style="font-weight:700; font-size:0.95rem; color:var(--primary-navy);">${s.timeSlot}</div>
        <div style="margin-top:6px;">
          <span class="status-pill ${s.isFull ? 'skipped' : (s.availableSlots <= 3 ? 'waiting' : 'completed')}" style="font-size:0.75rem;">
            ${s.isFull ? 'Full' : `${s.availableSlots} Slots Left`}
          </span>
        </div>
      </div>
    `).join('');

    // Default select first available
    const firstAvail = data.slots.find(s => !s.isFull);
    if (firstAvail) {
      selectedBookingSlot = firstAvail.timeSlot;
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#EF4444;">Error checking slots</p>`;
  }
};

const selectTimeSlot = (timeSlot, cardEl) => {
  selectedBookingSlot = timeSlot;
  document.querySelectorAll('.slot-card').forEach(el => {
    el.style.border = '1px solid var(--border-color)';
    el.classList.remove('selected');
  });
  cardEl.style.border = '2px solid var(--saffron)';
  cardEl.classList.add('selected');
};

const handleSlotBookingSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('kpms_token');
  if (!token) return routeTo('#landing');

  if (!selectedBookingSlot) {
    showToast('Please select an available time slot.', 'error');
    return;
  }

  const payload = {
    centerId: document.getElementById('booking-center-select').value,
    date: document.getElementById('booking-date-input').value,
    timeSlot: selectedBookingSlot,
    cropName: document.getElementById('booking-crop-select').value,
    quantity: document.getElementById('booking-quantity-input').value,
    vehicleNumber: document.getElementById('booking-vehicle-input').value,
    remarks: document.getElementById('booking-remarks-input').value
  };

  showToast('Reserving slot and generating official pass...', 'info');

  try {
    const res = await fetch('/api/bookings/book-slot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Procurement slot confirmed!', 'success');
      openBookingQRModal(data.data.bookingNumber, data.data);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Booking failed: ' + err.message, 'error');
  }
};

const openBookingQRModal = async (bookingNumber, existingData = null) => {
  let booking = existingData;
  if (!booking) {
    const res = await fetch(`/api/bookings/${bookingNumber}`);
    const r = await res.json();
    booking = r.data;
  }

  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = `Official Booking Pass - ${booking.bookingNumber}`;

  body.innerHTML = `
    <div style="text-align:center; padding:10px;">
      <div style="background:#FFF; padding:16px; border-radius:12px; display:inline-block; border:1px solid #CBD5E1; margin-bottom:16px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <img src="${booking.qrCodeDataUrl}" alt="Gate Entry QR" style="width:200px; height:200px;" />
        <div style="font-size:0.75rem; color:#64748B; margin-top:4px; font-weight:600;">Show this QR at Mandi Gate Scanner</div>
      </div>
      <div style="text-align:left; background:var(--bg-main); padding:16px; border-radius:8px; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--text-muted); font-size:0.88rem;">Booking ID:</span>
          <strong>${booking.bookingNumber}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--text-muted); font-size:0.88rem;">Mandi Center:</span>
          <strong>${booking.centerName || booking.centerId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:var(--text-muted); font-size:0.88rem;">Date & Slot:</span>
          <strong style="color:var(--saffron);">${booking.date} (${booking.timeSlot})</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-muted); font-size:0.88rem;">Commodity:</span>
          <strong>${booking.cropName} (${booking.quantity} Q)</strong>
        </div>
      </div>
      <div style="display:flex; gap:10px; justify-content:center;">
        <a href="/api/bookings/${booking.bookingNumber}/pdf" target="_blank" class="btn btn-primary"><i class="fas fa-download"></i> Download PDF Pass</a>
        <button class="btn btn-outline" onclick="closeModal(); routeTo('#farmer-queue');"><i class="fas fa-users-line"></i> View Live Queue</button>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

const loadMyBookings = async () => {
  const token = localStorage.getItem('kpms_token');
  if (!token) return routeTo('#landing');

  const container = document.getElementById('app-view-container');
  try {
    const res = await fetch('/api/bookings/my-bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    const bookings = result.data || [];

    container.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-heading">Farmer Menu</div>
          <a class="nav-link" onclick="routeTo('#farmer-dashboard')"><i class="fas fa-arrow-left"></i> Dashboard</a>
          <a class="nav-link" onclick="routeTo('#book-slot')"><i class="fas fa-plus"></i> Book New Slot</a>
          <a class="nav-link active" onclick="loadMyBookings()"><i class="fas fa-ticket-alt"></i> My Bookings</a>
          <a class="nav-link" onclick="routeTo('#farmer-queue')"><i class="fas fa-users-line"></i> Live Queue</a>
        </aside>

        <main class="main-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <div>
              <h2 style="color:var(--primary-navy); font-weight:800;">My Procurement Bookings</h2>
              <p style="color:var(--text-muted); font-size:0.9rem;">Track the real-time status and verification timeline of all your mandi reservations.</p>
            </div>
            <button class="btn btn-primary" onclick="routeTo('#book-slot')"><i class="fas fa-plus"></i> Book Another Slot</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:20px;">
            ${bookings.length === 0 ? '<div class="glass-card" style="padding:30px; text-align:center; color:var(--text-muted);">No bookings found. Click "Book Another Slot" to schedule your procurement.</div>' : ''}
            ${bookings.map(b => `
              <div class="glass-card" style="padding:22px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
                  <div>
                    <span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>
                    <h3 style="color:var(--primary-navy); font-size:1.3rem; margin-top:6px;">${b.cropName} (${b.quantity} Quintals)</h3>
                    <div style="color:var(--text-muted); font-size:0.88rem; margin-top:4px;">
                      Booking No: <strong>${b.bookingNumber}</strong> | Center: <strong>${b.centerName || b.centerId}</strong> | Date: <strong>${b.date} (${b.timeSlot})</strong>
                    </div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-outline btn-sm" onclick="openBookingQRModal('${b.bookingNumber}')"><i class="fas fa-qrcode"></i> QR Ticket</button>
                    <a href="/api/bookings/${b.bookingNumber}/pdf" target="_blank" class="btn btn-outline btn-sm"><i class="fas fa-file-pdf"></i> PDF</a>
                    ${b.status === 'Confirmed' ? `
                      <button class="btn btn-outline btn-sm" style="color:#EF4444; border-color:#EF4444;" onclick="cancelBookingAction('${b._id}')"><i class="fas fa-times"></i> Cancel</button>
                    ` : ''}
                  </div>
                </div>

                <!-- 8-Stage Animated Timeline -->
                <div style="background:var(--bg-main); padding:16px; border-radius:10px;">
                  <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">Procurement Workflow Timeline</div>
                  <div class="timeline-stepper">
                    ${(b.timeline || [
                      { stage: 'Booked', done: true },
                      { stage: 'Confirmed', done: true },
                      { stage: 'Checked In', done: b.status !== 'Confirmed' },
                      { stage: 'Quality Inspection', done: b.status === 'Completed' || b.status === 'Procurement Complete' },
                      { stage: 'Weight Verification', done: b.status === 'Completed' || b.status === 'Procurement Complete' },
                      { stage: 'Procurement Complete', done: b.status === 'Completed' || b.status === 'Procurement Complete' },
                      { stage: 'Payment Completed', done: b.status === 'Completed' }
                    ]).map(t => `
                      <div class="timeline-step ${t.done ? 'done' : ''}">
                        <div class="timeline-dot"></div>
                        <div style="font-size:0.75rem; font-weight:600; color:${t.done ? 'var(--green-gov)' : 'var(--text-muted)'};">${t.stage}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Error loading bookings: ' + err.message, 'error');
  }
};

const cancelBookingAction = async (id) => {
  if (!confirm('Are you sure you want to cancel this booking? This will free the slot for waiting farmers.')) return;
  const token = localStorage.getItem('kpms_token');
  try {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    if (d.success) {
      showToast('Booking cancelled successfully', 'info');
      loadMyBookings();
    } else {
      showToast(d.message, 'error');
    }
  } catch (err) {
    showToast('Failed to cancel booking', 'error');
  }
};
