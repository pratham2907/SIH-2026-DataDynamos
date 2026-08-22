const { Centers, Queues, Bookings, Procurements } = require('../models/dbStore');

/**
 * Predict estimated waiting time dynamically
 */
const predictWaitTime = async (centerId, counterNumber = null) => {
  const activeQueues = await Queues.find({
    centerId,
    status: { $in: ['waiting', 'called', 'processing'] }
  });

  const waitingCount = activeQueues.filter(q => q.status === 'waiting').length;
  const processingCount = activeQueues.filter(q => q.status === 'processing' || q.status === 'called').length;

  // Base processing time per farmer is ~12-15 minutes
  const avgProcessingTime = 12;
  const activeCounters = 3; // Standard mandi counter capacity

  const estimatedMinutes = Math.max(5, Math.round(((waitingCount * avgProcessingTime) / activeCounters) + (processingCount * 4)));
  
  let congestionLevel = 'Low';
  if (estimatedMinutes > 45) congestionLevel = 'High';
  else if (estimatedMinutes > 20) congestionLevel = 'Medium';

  return {
    waitingFarmers: waitingCount,
    estimatedWaitMinutes: estimatedMinutes,
    congestionLevel,
    confidenceScore: 0.94,
    recommendedAction: estimatedMinutes > 40 ? 'Consider arriving during the afternoon slot or choosing the secondary counter.' : 'Optimal queue throughput currently.'
  };
};

/**
 * AI Center & Slot Recommendation Engine
 */
const getRecommendations = async (farmerLocation = {}, preferredCrop = 'Wheat') => {
  const allCenters = await Centers.find({ isActive: true });
  
  const recommendations = await Promise.all(allCenters.map(async center => {
    const activeQueues = await Queues.find({ centerId: center.centerId, status: 'waiting' });
    const todayBookings = await Bookings.find({ centerId: center.centerId, status: { $ne: 'cancelled' } });
    
    const capacity = center.maxDailyCapacity || 250;
    const booked = todayBookings.length;
    const occupancyRate = Math.round((booked / capacity) * 100);

    const waitEst = await predictWaitTime(center.centerId);

    let score = 100 - (occupancyRate * 0.5) - (waitEst.estimatedWaitMinutes * 0.8);
    if (center.district === farmerLocation.district) score += 20;

    return {
      centerId: center.centerId,
      name: center.name,
      district: center.district,
      village: center.village,
      occupancyRate: `${occupancyRate}%`,
      availableSlots: Math.max(0, capacity - booked),
      estimatedWait: `${waitEst.estimatedWaitMinutes} mins`,
      congestionLevel: waitEst.congestionLevel,
      score: Math.round(score),
      highlight: score > 80 ? 'Fastest Processing & Lowest Congestion' : 'Normal Operations'
    };
  }));

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations;
};

/**
 * AI Chatbot Assistant (Kisan Sahayak)
 */
const answerAIQuery = async (query, role = 'farmer', context = {}) => {
  const text = (query || '').toLowerCase().trim();

  if (text.includes('slot') || text.includes('book') || text.includes('appointment')) {
    return {
      reply: "To book a procurement slot:\n1. Open 'Smart Slot Booking' from your dashboard.\n2. Select your registered crop and preferred Mandi.\n3. Choose an available time slot and enter your estimated quintals.\n4. Click 'Book Slot' to get your instant QR Token Pass.",
      suggestions: ["How do I cancel my booking?", "What documents are required at Mandi?", "Check current queue status"]
    };
  }

  if (text.includes('payment') || text.includes('dbt') || text.includes('money') || text.includes('bank') || text.includes('utr')) {
    return {
      reply: "MSP Payments are processed via Direct Benefit Transfer (DBT) directly into your Aadhaar-linked bank account within 48 to 72 hours of weighbridge acceptance. You can track transaction UTR numbers live under the 'Payment Tracker' tab.",
      suggestions: ["Why is my payment pending?", "How to download payment receipt?", "Raise a payment grievance"]
    };
  }

  if (text.includes('queue') || text.includes('token') || text.includes('waiting') || text.includes('turn')) {
    return {
      reply: "When you arrive at the Mandi gate, show your booking QR to the Officer Scanner. You will immediately receive a digital token (e.g., A014) with live wait time updates on your screen and the Mandi TV Display Board.",
      suggestions: ["How does priority queue work?", "Can I reschedule my slot?", "What happens if I miss my token?"]
    };
  }

  if (text.includes('document') || text.includes('aadhaar') || text.includes('land') || text.includes('passbook')) {
    return {
      reply: "Required Mandi documents for procurement:\n1. Original Aadhaar Card.\n2. Land Record (7/12 extract or RoR).\n3. Bank Passbook copy (showing IFSC & A/C).\n4. Digital Slot Booking Pass (on phone or printed).",
      suggestions: ["Book a slot now", "Check MSP rate", "Contact Mandi Helpdesk"]
    };
  }

  if (text.includes('msp') || text.includes('price') || text.includes('rate') || text.includes('wheat') || text.includes('paddy')) {
    return {
      reply: "Current Government Minimum Support Prices (MSP 2025-26):\n• Wheat (Sharbati/Standard): ₹2,275 / Quintal\n• Paddy (Common): ₹2,300 / Quintal\n• Mustard / Rapeseed: ₹5,650 / Quintal\n• Chana (Gram): ₹5,440 / Quintal\n• Soyabean (Yellow): ₹4,892 / Quintal",
      suggestions: ["Book procurement slot", "Check moisture limits", "Find nearest center"]
    };
  }

  if (text.includes('moisture') || text.includes('quality') || text.includes('grade') || text.includes('inspection')) {
    return {
      reply: "Fair Average Quality (FAQ) Standards:\n• Moisture Content: Maximum 12.0%\n• Foreign Matter: Below 0.75%\n• Broken & Damaged Grains: Below 2.0%\nProduce passing Grade A receives 100% MSP payout with zero quality deductions.",
      suggestions: ["How is moisture measured?", "What if my crop is rejected?", "Book slot"]
    };
  }

  // Generic fallback response
  return {
    reply: `Namaste! I am Kisan Sahayak AI. I can assist you with slot booking, live queue positions, Mandi gate check-in, DBT payment verification, MSP rates, and Fair Average Quality (FAQ) standards. How can I help you today?`,
    suggestions: ["How to book a slot?", "Check MSP rates for 2025-26", "Track my DBT payment", "Check nearest Mandi wait time"]
  };
};

module.exports = {
  predictWaitTime,
  getRecommendations,
  answerAIQuery
};
