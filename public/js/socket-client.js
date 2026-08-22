let socket = null;

const initSocketClient = () => {
  try {
    if (typeof io !== 'undefined') {
      socket = io();

      socket.on('connect', () => {
        console.log('⚡ Connected to KPMS Real-time Stream ID:', socket.id);
        const user = getCurrentUser();
        if (user) {
          if (user.role === 'farmer' && user.farmerId) {
            socket.emit('join_farmer', user.farmerId);
          }
          if (user.assignedCenterId) {
            socket.emit('join_center', user.assignedCenterId);
          }
        }
      });

      socket.on('queue:called', (data) => {
        showToast(`🔔 Token ${data.tokenNumber} (${data.farmerName}) called to ${data.counterNumber}!`, 'info');
        playAudioChime();
        if (typeof refreshQueueView === 'function') refreshQueueView();
        if (typeof loadDisplayBoard === 'function') loadDisplayBoard();
      });

      socket.on('queue:new_token', (data) => {
        if (typeof refreshQueueView === 'function') refreshQueueView();
        if (typeof loadDisplayBoard === 'function') loadDisplayBoard();
      });

      socket.on('procurement:accepted', (data) => {
        showToast(`🌾 Procurement Complete: ${data.cropName} (${data.acceptedQuantity} Q) accepted!`, 'success');
        if (typeof loadOfficerDashboard === 'function') loadOfficerDashboard();
      });

      socket.on('announcement:new', (data) => {
        showToast(`📢 MANDI ANNOUNCEMENT: ${data.title}`, 'info');
      });
    }
  } catch (err) {
    console.warn('Socket client initialization error:', err);
  }
};

const playAudioChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Audio context may be restricted by browser until user gesture
  }
};
