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
          <a class="nav-link active" onclick="loadAIInsightsDashboard()"><i class="fas fa-brain"></i> Mandi Insights</a>
          <a class="nav-link" onclick="openKisanFAQ()"><i class="fas fa-circle-question"></i> Kisan Sahayak FAQ</a>
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
              <h4 style="color:var(--primary-navy); font-weight:700; margin-bottom:4px;"><i class="fas fa-cloud-sun-rain"></i> Agro-Meteorological Weather Warnings</h4>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:14px;">
                ${weatherAlerts[0] && weatherAlerts[0].liveData
                  ? `<span style="color:#10B981; font-weight:600;"><i class="fas fa-circle" style="font-size:0.6rem;"></i> LIVE via OpenWeatherMap API &bull; Updated just now</span>`
                  : weatherAlerts[0] && weatherAlerts[0].apiStatus === 'KEY_ACTIVATING'
                    ? `<span style="color:#F59E0B; font-weight:600;"><i class="fas fa-clock"></i> API key activating (takes up to 2hrs) &bull; Showing advisory data</span>`
                    : `<span style="color:var(--text-muted);"><i class="fas fa-database"></i> Advisory data &bull; Live feed connecting...</span>`
                }
              </p>
              <div style="display:flex; flex-direction:column; gap:10px;">

                ${weatherAlerts.map(w => `
                  <div style="background:var(--bg-main); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                      <div>
                        <div style="font-weight:700; font-size:0.92rem; color:var(--primary-navy);">${w.type}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                          <i class="fas fa-map-marker-alt"></i> ${w.affectedDistricts.join(', ')}, ${w.state}
                        </div>
                      </div>
                      <span class="status-pill ${w.severityClass || (w.severity === 'FAVORABLE' || w.severity === 'Favorable' ? 'completed' : w.severity === 'HIGH RISK' ? 'skipped' : 'waiting')}">${w.severity}</span>
                    </div>
                    ${w.liveData ? `
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin:8px 0; padding:8px; background:var(--bg-card); border-radius:8px;">
                      <div style="display:flex; align-items:center; gap:4px; font-size:0.82rem;">
                        <img src="https://openweathermap.org/img/wn/${w.liveData.icon}.png" style="width:30px; height:30px;" alt="${w.liveData.description}" />
                        <span style="font-weight:700; color:var(--primary-navy); font-size:1rem;">${w.liveData.temp}°C</span>
                        <span style="color:var(--text-muted);">/ Feels ${w.liveData.feelsLike}°C</span>
                      </div>
                      <div style="display:flex; align-items:center; gap:5px; font-size:0.8rem; color:var(--text-muted);">
                        <i class="fas fa-tint" style="color:#3B82F6;"></i> ${w.liveData.humidity}% humidity
                      </div>
                      <div style="display:flex; align-items:center; gap:5px; font-size:0.8rem; color:var(--text-muted);">
                        <i class="fas fa-wind" style="color:#6366F1;"></i> ${w.liveData.windSpeed} m/s
                      </div>
                      <div style="display:flex; align-items:center; gap:5px; font-size:0.8rem; color:var(--text-muted);">
                        <i class="fas fa-eye" style="color:#10B981;"></i> ${w.liveData.visibility} km
                      </div>
                      <div style="display:flex; align-items:center; gap:5px; font-size:0.8rem; color:var(--text-muted);">
                        <i class="fas fa-sun" style="color:#F59E0B;"></i> ${w.liveData.sunrise} — ${w.liveData.sunset}
                      </div>
                    </div>
                    ` : ''}
                    <div style="font-size:0.83rem; color:var(--primary-navy); line-height:1.5;">${w.advisory}</div>
                  </div>
                `).join('')}
              </div>
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
            <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:16px;"><i class="fas fa-traffic-light"></i> Live Mandi Congestion & Wait Estimates</h3>
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

const FAQ_DATA = [
  {
    category: 'Slot Booking',
    icon: 'fa-calendar-check',
    color: '#3B82F6',
    questions: [
      { q: 'How do I book a Mandi slot?', a: 'Login to your Farmer Portal → Click "Book Slot" → Select your nearest Mandi Center, crop type, and preferred date → Confirm booking. You will receive an SMS confirmation with your token number.' },
      { q: 'Can I reschedule my booked slot?', a: 'Yes. Go to My Bookings → Click "Reschedule" on your booking → Choose a new available date and time slot. Rescheduling is allowed up to 24 hours before your appointment.' },
      { q: 'How many days in advance can I book?', a: 'You can book slots up to 7 days in advance. Each farmer can hold a maximum of 2 active bookings at a time.' },
      { q: 'What documents do I need at Mandi?', a: 'Carry your Aadhaar card, your booking QR code (received via SMS/app), and your Kisan Credit Card or bank passbook for DBT payment verification.' },
    ]
  },
  {
    category: 'MSP & Crop Rates',
    icon: 'fa-indian-rupee-sign',
    color: '#F59E0B',
    questions: [
      { q: 'What is the MSP for Wheat in 2025-26?', a: '₹2,425 per quintal for Wheat (Rabi 2025-26) as declared by CACP. This is the Minimum Support Price — you will not receive less than this amount for qualifying produce.' },
      { q: 'What is the MSP for Paddy (Rice) in 2025-26?', a: '₹2,369 per quintal for Common Grade Paddy and ₹2,409 per quintal for Grade A Paddy (Kharif 2025-26).' },
      { q: 'How is the final price determined at Mandi?', a: 'Your crop is weighed at the weighbridge, tested for moisture content and quality grade (FAQ/Good/Fair). The MSP is guaranteed as the floor price. If market rates are higher, you receive the market rate.' },
      { q: 'What is the moisture limit for procurement?', a: 'Wheat: ≤12% moisture. Paddy: ≤17% moisture. Maize: ≤14% moisture. Produce exceeding limits may be rejected or purchased at a deducted rate.' },
    ]
  },
  {
    category: 'DBT Payments',
    icon: 'fa-building-columns',
    color: '#10B981',
    questions: [
      { q: 'When will my DBT payment be credited?', a: 'Payments are processed within 72 hours (3 working days) of successful procurement. Funds are transferred directly to your Aadhaar-linked bank account via PFMS (Public Financial Management System).' },
      { q: 'How do I track my payment status?', a: 'Go to Farmer Portal → Payments → You will see real-time status: Pending → Processing → Approved → Released. You also receive SMS updates at each stage.' },
      { q: 'My payment is delayed — what should I do?', a: 'If payment is delayed beyond 7 working days: Go to Payments → Raise Complaint. Provide your procurement receipt number. The grievance is escalated to the District Officer within 24 hours.' },
      { q: 'Can I link a different bank account?', a: 'Yes. Visit your nearest Mandi Office with your Aadhaar and new passbook. Account change requests take 3-5 working days and must be Aadhaar-linked.' },
    ]
  },
  {
    category: 'Queue & Token System',
    icon: 'fa-list-ol',
    color: '#8B5CF6',
    questions: [
      { q: 'How does the token queue system work?', a: 'On arrival at Mandi, scan your booking QR code at the Check-in counter. You receive a token number. A live display board shows the current token being served. Wait in the designated area.' },
      { q: 'What if I miss my token call?', a: 'Your token will be skipped once. An officer may recall it. If missed twice, please report to the Help Desk to get a fresh token assigned. Your slot priority is maintained for the day.' },
      { q: 'Can I check my queue position from home?', a: 'Yes. Login to the app → Queue Status. You will see your token number, current serving token, and estimated wait time updated in real-time.' },
    ]
  },
  {
    category: 'Grievances & Support',
    icon: 'fa-headset',
    color: '#EF4444',
    questions: [
      { q: 'How do I raise a complaint?', a: 'Go to Payments or Bookings → Click "Raise Complaint" on the relevant record. Describe your issue. You will receive a complaint reference number and a response within 48 hours.' },
      { q: 'What is the Kisan Helpline number?', a: 'National Kisan Helpline: 1800-180-1551 (Toll Free, Mon–Sat, 6 AM – 10 PM). For technical support with this portal: 1800-XXX-KPMS.' },
      { q: 'I forgot my login password — how to reset?', a: 'On the login screen, click "Forgot Password" → Enter your registered mobile number → You will receive an OTP → Set a new password. If issues persist, visit your Mandi center with Aadhaar.' },
    ]
  },
];

const openKisanFAQ = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Kisan Sahayak FAQ / किसान सहायक';

  body.innerHTML = `
    <div style="max-height:520px; overflow-y:auto; padding-right:4px;">
      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:16px;">Find answers to the most common questions about KPMS — slot booking, payments, queue system, and more.</p>
      ${FAQ_DATA.map((cat, ci) => `
        <div style="margin-bottom:14px; border:1px solid var(--border-color); border-radius:12px; overflow:hidden;">
          <div style="background:var(--bg-main); padding:12px 16px; display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:700; color:var(--primary-navy); font-size:0.93rem;" onclick="toggleFaqCat(${ci})">
            <span style="width:30px; height:30px; border-radius:50%; background:${cat.color}20; display:flex; align-items:center; justify-content:center;">
              <i class="fas ${cat.icon}" style="color:${cat.color}; font-size:0.85rem;"></i>
            </span>
            ${cat.category}
            <i class="fas fa-chevron-down" id="faq-chevron-${ci}" style="margin-left:auto; font-size:0.75rem; color:var(--text-muted); transition:transform 0.2s;"></i>
          </div>
          <div id="faq-cat-${ci}" style="display:none;">
            ${cat.questions.map((faq, qi) => `
              <div style="border-top:1px solid var(--border-color); padding:12px 16px;">
                <div style="font-weight:600; color:var(--primary-navy); font-size:0.88rem; margin-bottom:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start; gap:8px;" onclick="toggleFaqItem(${ci},${qi})">
                  <span><i class="fas fa-circle-question" style="color:${cat.color}; font-size:0.7rem; margin-right:6px;"></i>${faq.q}</span>
                  <i class="fas fa-plus" id="faq-item-${ci}-${qi}" style="font-size:0.7rem; color:var(--text-muted); flex-shrink:0; margin-top:3px;"></i>
                </div>
                <div id="faq-ans-${ci}-${qi}" style="display:none; font-size:0.84rem; color:var(--text-muted); line-height:1.6; padding:8px 12px; background:var(--bg-main); border-radius:8px; border-left:3px solid ${cat.color};">
                  ${faq.a}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  modal.classList.add('active');
};

const toggleFaqCat = (ci) => {
  const el = document.getElementById('faq-cat-' + ci);
  const chevron = document.getElementById('faq-chevron-' + ci);
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
};

const toggleFaqItem = (ci, qi) => {
  const ans = document.getElementById('faq-ans-' + ci + '-' + qi);
  const icon = document.getElementById('faq-item-' + ci + '-' + qi);
  const open = ans.style.display !== 'none';
  ans.style.display = open ? 'none' : 'block';
  if (icon) { icon.className = open ? 'fas fa-plus' : 'fas fa-minus'; icon.style.color = open ? 'var(--text-muted)' : '#3B82F6'; }
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
