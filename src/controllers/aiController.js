const {
  Centers, Queues, Bookings, Procurements
} = require('../models/dbStore');
const { predictWaitTime, getRecommendations, answerAIQuery } = require('../services/aiService');

/**
 * AI Insights Dashboard
 */
const getAIDashboard = async (req, res) => {
  try {
    const centers = await Centers.find({ isActive: true });
    
    // Calculate congestion prediction across centers
    const centerInsights = await Promise.all(centers.map(async c => {
      const waitData = await predictWaitTime(c.centerId);
      return {
        centerId: c.centerId,
        name: c.name,
        state: c.state,
        district: c.district,
        ...waitData
      };
    }));

    const highRiskCenters = centerInsights.filter(c => c.congestionLevel === 'High');

    const weatherAlerts = [
      {
        type: 'Rain & Humidity Warning',
        severity: 'Moderate',
        affectedDistricts: ['Bhopal', 'Sehore', 'Raisen'],
        advisory: 'Light scattered rainfall expected in 24 hours. Ensure grain tarpaulins and covered shed storage at Mandi Gate 2 & 3.'
      },
      {
        type: 'Optimal Harvest Window',
        severity: 'Favorable',
        affectedDistricts: ['Karnal', 'Kurukshetra'],
        advisory: 'Clear skies with 31°C dry conditions. Ideal time for wheat harvesting and direct Mandi delivery.'
      }
    ];

    const demandForecast = {
      peakArrivalHours: '09:30 AM - 12:30 PM',
      expectedDailyQuintals: 4200,
      storageUtilizationRisk: 'Normal (54% Warehouse Occupancy)',
      recommendedExtraCounters: highRiskCenters.length > 0 ? 2 : 0
    };

    return res.json({
      success: true,
      data: {
        centerInsights,
        highRiskCenters,
        weatherAlerts,
        demandForecast,
        systemHealth: 'Optimal (AI Heuristic Prediction Active)'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Smart Slot & Center Recommendations
 */
const getSlotRecommendations = async (req, res) => {
  try {
    const { district, crop } = req.query;
    const recommendations = await getRecommendations({ district }, crop);
    return res.json({ success: true, data: recommendations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * AI Chatbot Assistant (Kisan Sahayak)
 */
const chatWithAI = async (req, res) => {
  try {
    const { query, role, context } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    const response = await answerAIQuery(query, role || (req.user ? req.user.role : 'farmer'), context);
    return res.json({ success: true, ...response });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Voice Assistant Intent Handler
 */
const handleVoiceIntent = async (req, res) => {
  try {
    const { voiceText, language } = req.body;
    const clean = (voiceText || '').toLowerCase().trim();

    let action = 'OPEN_ASSISTANT';
    let reply = `Understood: "${voiceText}". How can I help you today?`;

    if (clean.includes('book') || clean.includes('slot') || clean.includes('booking')) {
      action = 'NAVIGATE_BOOKING';
      reply = 'Opening the Smart Slot Booking wizard for you now.';
    } else if (clean.includes('queue') || clean.includes('token') || clean.includes('status')) {
      action = 'NAVIGATE_QUEUE';
      reply = 'Loading your real-time Mandi queue status.';
    } else if (clean.includes('payment') || clean.includes('money') || clean.includes('dbt')) {
      action = 'NAVIGATE_PAYMENTS';
      reply = 'Opening your DBT Payment Tracker and bank receipt history.';
    } else if (clean.includes('mandi') || clean.includes('center') || clean.includes('map')) {
      action = 'NAVIGATE_MAP';
      reply = 'Displaying the live national Mandi crowd map.';
    }

    return res.json({
      success: true,
      action,
      reply,
      transcript: voiceText
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAIDashboard,
  getSlotRecommendations,
  chatWithAI,
  handleVoiceIntent
};
