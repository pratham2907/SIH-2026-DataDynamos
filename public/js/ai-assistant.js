// AI Insights, Kisan Sahayak Chatbot & Voice Assistant Controller

let recognitionInstance = null;

const loadAIInsightsDashboard = async () => {
  const container = document.getElementById('app-view-container');
  container.innerHTML = `<div class="skeleton" style="height:400px; border-radius:12px;"></div>`;

  try {
    const res = await fetch('/api/ai/dashboard');
    const result = await res.json();
    const { centerInsights, weatherAlerts, demandForecast } = result.data;

    container.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-heading">AI & Forecasting</div>
          <a class="nav-link" onclick="routeTo('#landing')"><i class="fas fa-arrow-left"></i> Main Portal</a>
          <a class="nav-link active" onclick="loadAIInsightsDashboard()"><i class="fas fa-brain"></i> AI Mandi Insights</a>
          <a class="nav-link" onclick="openKisanAIChat()"><i class="fas fa-robot"></i> Kisan Sahayak Chatbot</a>
          <a class="nav-link" onclick="startVoiceAssistant()"><i class="fas fa-microphone"></i> Voice Assistant</a>
        </aside>

        <main class="main-content">
          <div style="margin-bottom:24px;">
            <span class="hero-pill"><i class="fas fa-wand-magic-sparkles"></i> Heuristic & Machine Learning Intelligence</span>
            <h2 style="color:var(--primary-navy); font-weight:800;">AI Congestion & Mandi Demand Forecast</h2>
            <p style="color:var(--text-muted); font-size:0.9rem;">Predictive queue lengths, weather advisory alerts, and storage capacity optimization.</p>
          </div>

          <!-- Demand & Weather Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
            <div class="glass-card" style="padding:22px; border-left:6px solid var(--saffron);">
              <h4 style="color:var(--primary-navy); font-weight:700; margin-bottom:12px;"><i class="fas fa-cloud-sun-rain"></i> Agro-Meteorological Weather Warnings</h4>
              ${weatherAlerts.map(w => `
                <div style="background:var(--bg-main); padding:12px; border-radius:8px; margin-bottom:10px;">
                  <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.92rem;">
                    <span>${w.type}</span>
                    <span class="status-pill waiting">${w.severity}</span>
                  </div>
                  <div style="font-size:0.82rem; color:var(--text-muted); margin:4px 0;">Affected: ${w.affectedDistricts.join(', ')}</div>
                  <div style="font-size:0.85rem; color:var(--primary-navy);">${w.advisory}</div>
                </div>
              `).join('')}
            </div>

            <div class="glass-card" style="padding:22px; border-left:6px solid var(--green-gov);">
              <h4 style="color:var(--primary-navy); font-weight:700; margin-bottom:12px;"><i class="fas fa-chart-line"></i> Demand & Capacity Intelligence</h4>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                  <span style="color:var(--text-muted);">Peak Arrival Window:</span>
                  <strong style="color:var(--saffron);">${demandForecast.peakArrivalHours}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                  <span style="color:var(--text-muted);">Expected Arrivals Today:</span>
                  <strong>${demandForecast.expectedDailyQuintals} Quintals</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                  <span style="color:var(--text-muted);">Warehouse Utilization:</span>
                  <strong style="color:var(--green-gov);">${demandForecast.storageUtilizationRisk}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-muted);">Recommended Action:</span>
                  <strong>${demandForecast.recommendedExtraCounters > 0 ? `Open ${demandForecast.recommendedExtraCounters} Additional Counters` : 'All Counters Balanced'}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Centers Congestion Forecast Table -->
          <div class="glass-card" style="padding:24px;">
            <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:16px;"><i class="fas fa-traffic-light"></i> Live Mandi Congestion & AI Wait Estimates</h3>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:2px solid var(--border-color); color:var(--text-muted);">
                    <th style="padding:12px 14px;">Mandi Center</th>
                    <th style="padding:12px 14px;">District & State</th>
                    <th style="padding:12px 14px;">Waiting Queue</th>
                    <th style="padding:12px 14px;">Predicted Wait Time</th>
                    <th style="padding:12px 14px;">Congestion Risk</th>
                    <th style="padding:12px 14px;">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  ${centerInsights.map(c => `
                    <tr style="border-bottom:1px solid var(--border-color);">
                      <td style="padding:12px 14px; font-weight:700; color:var(--primary-navy);">${c.name}</td>
                      <td style="padding:12px 14px; color:var(--text-muted);">${c.district}, ${c.state}</td>
                      <td style="padding:12px 14px; font-weight:700;">${c.waitingFarmers} Farmers</td>
                      <td style="padding:12px 14px; font-weight:800; color:var(--saffron);">${c.estimatedWaitMinutes} Minutes</td>
                      <td style="padding:12px 14px;"><span class="status-pill ${c.congestionLevel === 'High' ? 'skipped' : (c.congestionLevel === 'Medium' ? 'waiting' : 'completed')}">${c.congestionLevel}</span></td>
                      <td style="padding:12px 14px; color:var(--green-gov); font-weight:700;">${Math.round((c.confidenceScore || 0.94) * 100)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load AI dashboard: ' + err.message, 'error');
  }
};

const openKisanAIChat = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Kisan Sahayak AI Chatbot / किसान सहायक';

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; height:420px;">
      <div id="ai-chat-messages" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; background:var(--bg-main); border-radius:10px; margin-bottom:12px;">
        <div style="background:var(--bg-card); padding:10px 14px; border-radius:10px; max-width:80%; align-self:flex-start; box-shadow:0 2px 6px rgba(0,0,0,0.05); font-size:0.9rem;">
          🌾 <strong>Namaste!</strong> I am your Kisan Sahayak AI. Ask me about slot booking, MSP rates for 2025-26, moisture quality guidelines, or DBT payment timelines.
        </div>
      </div>

      <!-- Suggestion chips -->
      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:8px;" id="ai-suggestions-row">
        <button class="btn btn-outline btn-sm" onclick="sendQuickAiQuery('How to book a slot?')">How to book a slot?</button>
        <button class="btn btn-outline btn-sm" onclick="sendQuickAiQuery('Check MSP rates for 2025-26')">Check MSP rates</button>
        <button class="btn btn-outline btn-sm" onclick="sendQuickAiQuery('When will DBT payment be credited?')">Payment DBT Time</button>
      </div>

      <form onsubmit="handleAIChatSubmit(event)" style="display:flex; gap:8px;">
        <input type="text" id="ai-chat-input" class="form-control" placeholder="Type your question or problem..." required />
        <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
      </form>
    </div>
  `;
  modal.classList.add('active');
};

const handleAIChatSubmit = async (e) => {
  e.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  await executeAIQuery(query);
};

const sendQuickAiQuery = (query) => {
  executeAIQuery(query);
};

const executeAIQuery = async (query) => {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  // Add User Message
  container.innerHTML += `
    <div style="background:var(--primary-navy); color:#FFF; padding:10px 14px; border-radius:10px; max-width:80%; align-self:flex-end; font-size:0.9rem;">
      ${query}
    </div>
  `;
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const d = await res.json();

    container.innerHTML += `
      <div style="background:var(--bg-card); color:var(--text-main); padding:12px 14px; border-radius:10px; max-width:85%; align-self:flex-start; box-shadow:0 2px 6px rgba(0,0,0,0.05); font-size:0.9rem; white-space:pre-line;">
        ${d.reply || 'Thank you for your query.'}
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  } catch (err) {}
};

const startVoiceAssistant = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('Voice speech recognition not supported in this browser. Please use the AI Chatbot.', 'info');
    openKisanAIChat();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognitionInstance = new SpeechRecognition();
  recognitionInstance.lang = 'hi-IN'; // Default Hindi / English
  recognitionInstance.continuous = false;

  showToast('🎙️ Listening... Speak now (e.g., "Book Slot", "Check Queue", "Payment Status")', 'info');

  recognitionInstance.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    showToast(`You said: "${transcript}"`, 'success');

    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceText: transcript })
      });
      const data = await res.json();
      showToast(data.reply, 'info');

      if (data.action === 'NAVIGATE_BOOKING') routeTo('#book-slot');
      else if (data.action === 'NAVIGATE_QUEUE') routeTo('#farmer-queue');
      else if (data.action === 'NAVIGATE_PAYMENTS') routeTo('#farmer-payments');
    } catch (e) {}
  };

  recognitionInstance.onerror = () => {
    showToast('Voice input ended. Try again.', 'info');
  };

  recognitionInstance.start();
};
