// Fullscreen Public TV Display Board Controller (Mandi Yard TV Screen)

let displayBoardInterval = null;

const loadDisplayBoard = async () => {
  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:100vh; border-radius:0;"></div>`;

  try {
    const res = await fetch('/api/queue/display-board?centerId=CTR-01');
    const result = await res.json();
    const { center, currentlyServing, nextInLine, stats, currentTime } = result;

    const mainServing = currentlyServing[0] || { tokenNumber: '---', counterNumber: 'Counter 1', farmerName: 'Awaiting Next Farmer' };

    container.innerHTML = `
      <div class="tv-display-mode">
        <!-- TV Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--saffron); padding-bottom:18px; margin-bottom:28px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="brand-emblem" style="width:60px; height:60px; font-size:2rem;"><i class="fas fa-wheat-awn"></i></div>
            <div>
              <h1 style="font-size:2.2rem; font-weight:800; color:#FFF; margin:0;">${center.name}</h1>
              <div style="font-size:1.1rem; color:var(--saffron); font-weight:600;">OFFICIAL PUBLIC DIGITAL TOKEN QUEUE BOARD</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div id="tv-clock" style="font-size:2rem; font-family:monospace; font-weight:800; color:#FFF;">${currentTime || '09:45 AM'}</div>
            <button class="btn btn-outline btn-sm" style="color:#FFF; border-color:#FFF; margin-top:6px;" onclick="routeTo('#landing')"><i class="fas fa-arrow-left"></i> Exit Fullscreen</button>
          </div>
        </div>

        <!-- Giant Now Serving Token Display -->
        <div class="tv-token-hero" style="margin-bottom:28px;">
          <div style="font-size:1.5rem; color:#94A3B8; text-transform:uppercase; letter-spacing:4px; font-weight:700; margin-bottom:8px;">
            NOW SERVING / वर्तमान टोकन
          </div>
          <div style="font-size:6.5rem; font-weight:900; color:var(--saffron); letter-spacing:4px; text-shadow:0 0 40px rgba(224,109,20,0.6);" class="animate-saffron-pulse">
            ${mainServing.tokenNumber}
          </div>
          <div style="font-size:2.8rem; font-weight:800; color:#10B981; margin-top:8px;">
            PROCEED TO: ${mainServing.counterNumber}
          </div>
          <div style="font-size:1.4rem; color:#E2E8F0; margin-top:6px;">
            Farmer: <strong>${mainServing.farmerName}</strong>
          </div>
        </div>

        <!-- Next in Line Grid -->
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
          <div style="background:#0F172A; border:1px solid #1E293B; border-radius:16px; padding:24px;">
            <h3 style="color:#FFF; font-size:1.4rem; font-weight:800; margin-bottom:16px;"><i class="fas fa-list-ol"></i> NEXT IN LINE / आगामी टोकन</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px;">
              ${nextInLine.length === 0 ? '<p style="color:#64748B;">No waiting tokens.</p>' : ''}
              ${nextInLine.map(t => `
                <div style="background:#1E293B; padding:16px; border-radius:12px; text-align:center; border:1px solid #334155;">
                  <div style="font-size:1.8rem; font-weight:800; color:var(--saffron);">${t.tokenNumber}</div>
                  <div style="font-size:0.85rem; color:#CBD5E1; margin-top:4px; font-weight:600;">${t.counterNumber}</div>
                  <div style="font-size:0.75rem; color:#94A3B8;">${t.cropName || 'Grain'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background:#0F172A; border:1px solid #1E293B; border-radius:16px; padding:24px;">
            <h3 style="color:#FFF; font-size:1.4rem; font-weight:800; margin-bottom:16px;"><i class="fas fa-chart-simple"></i> MANDI METRICS</h3>
            <div style="display:flex; flex-direction:column; gap:16px;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1E293B; padding-bottom:8px;">
                <span style="color:#94A3B8;">Total Arrivals Today:</span>
                <strong style="font-size:1.2rem; color:#FFF;">${stats.totalCheckedIn} Farmers</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1E293B; padding-bottom:8px;">
                <span style="color:#94A3B8;">Completed Today:</span>
                <strong style="font-size:1.2rem; color:#10B981;">${stats.completedCount} Completed</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#94A3B8;">Average Processing Time:</span>
                <strong style="font-size:1.2rem; color:var(--saffron);">${stats.averageWait}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrolling Ticker -->
        <div style="margin-top:28px; background:#1E1B4B; border:1px solid #4338CA; border-radius:8px; padding:12px 20px; font-size:1.05rem; font-weight:600; color:#E0E7FF; overflow:hidden; white-space:nowrap;">
          📢 [ANNOUNCEMENT] Farmers please ensure produce moisture is below 12% for Grade A bonus • Keep original Aadhaar Card and Bank Passbook ready for weighbridge scanning • Mandi helpline: 1800-180-1551.
        </div>
      </div>
    `;

    if (!displayBoardInterval) {
      displayBoardInterval = setInterval(() => {
        const clk = document.getElementById('tv-clock');
        if (clk) clk.textContent = new Date().toLocaleTimeString('en-IN');
      }, 1000);
    }
  } catch (err) {
    showToast('Failed to load display board', 'error');
  }
};
