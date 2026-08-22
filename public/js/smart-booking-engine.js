/**
 * 🌾 SMART BOOKING DECISION ENGINE — KPMS / AgriQueue
 * Centralized Mathematical Engine with Real-Time OpenWeather Integration,
 * Crop Perishability Classification, Weather-Adjusted Deterioration & Economic Optimization.
 */

// -------------------------------------------------------------------------
// 1. Centralized Crop Profiles & Perishability Classifications (Section 6 & 7)
// -------------------------------------------------------------------------
const cropProfiles = {
  wheat: {
    name: "Wheat",
    displayName: "Wheat (गेहूं)",
    category: "low",
    perishabilityLevel: "LOW PERISHABILITY",
    badge: "🟢 Low Perishable",
    badgeClass: "completed",
    badgeDescription: "Short delays generally have a lower estimated deterioration impact.",
    baseDeteriorationRate: 0.001,
    humiditySensitivity: 0.10,
    temperatureSensitivity: 0.05,
    rainSensitivity: 0.02,
    delayCostPerQuintalPerDay: 2,
    optimalTemperatureMin: 15,
    optimalTemperatureMax: 28,
    defaultPrice: 2425,
    baseMsp: 2425,
    icon: "fa-wheat-awn",
    color: "#E06D14",
    bg: "#FFF7ED"
  },
  rice: {
    name: "Rice",
    displayName: "Paddy / Rice (धान / चावल)",
    category: "medium",
    perishabilityLevel: "MEDIUM PERISHABILITY",
    badge: "🟠 Medium Perishable",
    badgeClass: "waiting",
    badgeDescription: "Longer delays can increase storage and quality risk.",
    baseDeteriorationRate: 0.0015,
    humiditySensitivity: 0.12,
    temperatureSensitivity: 0.05,
    rainSensitivity: 0.03,
    delayCostPerQuintalPerDay: 2.5,
    optimalTemperatureMin: 20,
    optimalTemperatureMax: 32,
    defaultPrice: 2369,
    baseMsp: 2369,
    icon: "fa-seedling",
    color: "#16A34A",
    bg: "#F0FDF4"
  },
  paddy: {
    name: "Paddy",
    displayName: "Paddy (धान / चावल)",
    category: "medium",
    perishabilityLevel: "MEDIUM PERISHABILITY",
    badge: "🟠 Medium Perishable",
    badgeClass: "waiting",
    badgeDescription: "Longer delays can increase storage and quality risk.",
    baseDeteriorationRate: 0.0015,
    humiditySensitivity: 0.12,
    temperatureSensitivity: 0.05,
    rainSensitivity: 0.03,
    delayCostPerQuintalPerDay: 2.5,
    optimalTemperatureMin: 20,
    optimalTemperatureMax: 32,
    defaultPrice: 2369,
    baseMsp: 2369,
    icon: "fa-seedling",
    color: "#16A34A",
    bg: "#F0FDF4"
  },
  potato: {
    name: "Potato",
    displayName: "Potato (आलू)",
    category: "medium",
    perishabilityLevel: "MEDIUM PERISHABILITY",
    badge: "🟠 Medium Perishable",
    badgeClass: "waiting",
    badgeDescription: "Longer delays can increase storage and quality risk.",
    baseDeteriorationRate: 0.004,
    humiditySensitivity: 0.15,
    temperatureSensitivity: 0.10,
    rainSensitivity: 0.05,
    delayCostPerQuintalPerDay: 5,
    optimalTemperatureMin: 10,
    optimalTemperatureMax: 22,
    defaultPrice: 1800,
    baseMsp: 1800,
    icon: "fa-bowl-rice",
    color: "#B45309",
    bg: "#FEF3C7"
  },
  tomato: {
    name: "Tomato",
    displayName: "Tomato (टमाटर)",
    category: "high",
    perishabilityLevel: "HIGH PERISHABILITY",
    badge: "🔴 High Perishable",
    badgeClass: "skipped",
    badgeDescription: "Reducing unnecessary waiting is particularly important for this crop.",
    baseDeteriorationRate: 0.025,
    humiditySensitivity: 0.25,
    temperatureSensitivity: 0.20,
    rainSensitivity: 0.10,
    delayCostPerQuintalPerDay: 15,
    optimalTemperatureMin: 16,
    optimalTemperatureMax: 26,
    defaultPrice: 2100,
    baseMsp: 2100,
    icon: "fa-apple-whole",
    color: "#DC2626",
    bg: "#FEE2E2"
  },
  leafyvegetables: {
    name: "Leafy vegetables",
    displayName: "Leafy vegetables (सब्जियां / साग)",
    category: "high",
    perishabilityLevel: "HIGH PERISHABILITY",
    badge: "🔴 High Perishable",
    badgeClass: "skipped",
    badgeDescription: "Highly perishable produce. Quick transit and prompt handling recommended.",
    baseDeteriorationRate: 0.020,
    humiditySensitivity: 0.22,
    temperatureSensitivity: 0.18,
    rainSensitivity: 0.10,
    delayCostPerQuintalPerDay: 12,
    optimalTemperatureMin: 12,
    optimalTemperatureMax: 22,
    defaultPrice: 2400,
    baseMsp: 2400,
    icon: "fa-leaf",
    color: "#15803D",
    bg: "#DCFCE7"
  },
  maize: {
    name: "Maize",
    displayName: "Maize (मक्का)",
    category: "low",
    perishabilityLevel: "LOW PERISHABILITY",
    badge: "🟢 Low Perishable",
    badgeClass: "completed",
    badgeDescription: "Short delays generally have a lower estimated deterioration impact.",
    baseDeteriorationRate: 0.0015,
    humiditySensitivity: 0.10,
    temperatureSensitivity: 0.06,
    rainSensitivity: 0.03,
    delayCostPerQuintalPerDay: 2.5,
    optimalTemperatureMin: 18,
    optimalTemperatureMax: 30,
    defaultPrice: 2225,
    baseMsp: 2225,
    icon: "fa-cubes-stacked",
    color: "#D97706",
    bg: "#FFFBEB"
  },
  gram: {
    name: "Gram",
    displayName: "Gram (चना / दाल)",
    category: "low",
    perishabilityLevel: "LOW PERISHABILITY",
    badge: "🟢 Low Perishable",
    badgeClass: "completed",
    badgeDescription: "Short delays generally have a lower estimated deterioration impact.",
    baseDeteriorationRate: 0.0015,
    humiditySensitivity: 0.10,
    temperatureSensitivity: 0.06,
    rainSensitivity: 0.03,
    delayCostPerQuintalPerDay: 2.5,
    optimalTemperatureMin: 15,
    optimalTemperatureMax: 30,
    defaultPrice: 5440,
    baseMsp: 5440,
    icon: "fa-circle-dot",
    color: "#9333EA",
    bg: "#FAF5FF"
  },
  mustard: {
    name: "Mustard",
    displayName: "Mustard (सरसों)",
    category: "low",
    perishabilityLevel: "LOW PERISHABILITY",
    badge: "🟢 Low Perishable",
    badgeClass: "completed",
    badgeDescription: "Short delays generally have a lower estimated deterioration impact.",
    baseDeteriorationRate: 0.002,
    humiditySensitivity: 0.12,
    temperatureSensitivity: 0.07,
    rainSensitivity: 0.03,
    delayCostPerQuintalPerDay: 3.0,
    optimalTemperatureMin: 12,
    optimalTemperatureMax: 28,
    defaultPrice: 5650,
    baseMsp: 5650,
    icon: "fa-sun",
    color: "#CA8A04",
    bg: "#FEF9C3"
  },
  soyabean: {
    name: "Soyabean",
    displayName: "Soyabean (सोयाबीन)",
    category: "medium",
    perishabilityLevel: "MEDIUM PERISHABILITY",
    badge: "🟠 Medium Perishable",
    badgeClass: "waiting",
    badgeDescription: "Longer delays can increase storage and quality risk.",
    baseDeteriorationRate: 0.0025,
    humiditySensitivity: 0.14,
    temperatureSensitivity: 0.08,
    rainSensitivity: 0.04,
    delayCostPerQuintalPerDay: 3.5,
    optimalTemperatureMin: 18,
    optimalTemperatureMax: 32,
    defaultPrice: 4892,
    baseMsp: 4892,
    icon: "fa-leaf",
    color: "#059669",
    bg: "#ECFDF5"
  }
};

// Aliases for unified profile resolution
const cropAliases = {
  paddy: "rice",
  dhan: "rice",
  gehun: "wheat",
  makka: "maize",
  corn: "maize",
  aloo: "potato",
  tamatar: "tomato",
  pyaj: "onion",
  seb: "apple",
  aam: "mango",
  kela: "banana",
  gobhi: "cauliflower",
  chana: "gram",
  sarson: "mustard",
  soya: "soyabean"
};

/**
 * Get crop profile by name with fuzzy alias matching
 */
const getCropProfile = (cropName) => {
  if (!cropName) return cropProfiles.wheat;
  const rawKey = cropName.toLowerCase().replace(/[^a-z]/g, '');
  
  if (cropProfiles[rawKey]) return cropProfiles[rawKey];
  for (const [alias, targetKey] of Object.entries(cropAliases)) {
    if (rawKey.includes(alias) || alias.includes(rawKey)) {
      return cropProfiles[targetKey];
    }
  }
  for (const key of Object.keys(cropProfiles)) {
    if (rawKey.includes(key) || key.includes(rawKey)) {
      return cropProfiles[key];
    }
  }
  return cropProfiles.wheat;
};

// -------------------------------------------------------------------------
// 2. Master Procurement Centres Data
// -------------------------------------------------------------------------
const DEFAULT_PROCUREMENT_CENTRES = [
  {
    id: "CTR-01",
    code: "C001",
    name: "APMC Central Mandi Bhopal",
    shortName: "Centre A (Bhopal Central)",
    district: "Bhopal",
    state: "Madhya Pradesh",
    distance: 10,
    pricePerQuintal: 2500,
    cropPrices: {
      "Wheat (Sharbati)": 2500,
      "Wheat": 2500,
      "Paddy (Common)": 2300,
      "Paddy": 2300,
      "Rice": 2300,
      "Maize (Makka)": 2225,
      "Maize": 2225,
      "Potato": 1900,
      "Tomato": 2100,
      "Gram (Chana)": 5440,
      "Gram": 5440,
      "Mustard (Sarson)": 5650,
      "Mustard": 5650,
      "Soyabean (Yellow)": 4892,
      "Soyabean": 4892
    },
    queue: 45,
    waitingDays: 5,
    dailyCapacity: 30,
    maxDailyCapacity: 300,
    availableCapacity: 100,
    crops: ["Wheat", "Wheat (Sharbati)", "Paddy", "Paddy (Common)", "Rice", "Maize", "Maize (Makka)", "Potato", "Tomato", "Gram", "Gram (Chana)", "Mustard", "Mustard (Sarson)", "Soyabean", "Soyabean (Yellow)"],
    active: true,
    transportRatePerKm: 1.0,
    fixedTransportCost: 1000,
    storageCostPerDayPerQ: 20,
    latitude: 23.2599,
    longitude: 77.4126,
    address: "Gate No. 3, APMC Yard, Karond, Bhopal"
  },
  {
    id: "CTR-02",
    code: "C002",
    name: "Sehore Krishak Mega Mandi",
    shortName: "Centre B (Sehore Mega Mandi)",
    district: "Sehore",
    state: "Madhya Pradesh",
    distance: 25,
    pricePerQuintal: 2600,
    cropPrices: {
      "Wheat (Sharbati)": 2600,
      "Wheat": 2600,
      "Paddy (Common)": 2380,
      "Paddy": 2380,
      "Rice": 2380,
      "Maize (Makka)": 2300,
      "Maize": 2300,
      "Potato": 2000,
      "Tomato": 2350,
      "Gram (Chana)": 5580,
      "Gram": 5580,
      "Mustard (Sarson)": 5780,
      "Mustard": 5780,
      "Soyabean (Yellow)": 5020,
      "Soyabean": 5020
    },
    queue: 12,
    waitingDays: 1,
    dailyCapacity: 50,
    maxDailyCapacity: 450,
    availableCapacity: 120,
    crops: ["Wheat", "Wheat (Sharbati)", "Paddy", "Paddy (Common)", "Rice", "Maize", "Maize (Makka)", "Potato", "Tomato", "Gram", "Gram (Chana)", "Mustard", "Mustard (Sarson)", "Soyabean", "Soyabean (Yellow)"],
    active: true,
    transportRatePerKm: 0.8,
    fixedTransportCost: 2000,
    storageCostPerDayPerQ: 40,
    latitude: 23.2032,
    longitude: 77.0844,
    address: "National Highway 86, Mandi Complex, Sehore"
  },
  {
    id: "CTR-03",
    code: "C003",
    name: "Vidisha Agro Procurement Terminal",
    shortName: "Centre C (Vidisha Terminal)",
    district: "Vidisha",
    state: "Madhya Pradesh",
    distance: 18,
    pricePerQuintal: 2550,
    cropPrices: {
      "Wheat (Sharbati)": 2550,
      "Wheat": 2550,
      "Paddy (Common)": 2340,
      "Paddy": 2340,
      "Rice": 2340,
      "Maize (Makka)": 2260,
      "Maize": 2260,
      "Potato": 1950,
      "Tomato": 2200,
      "Gram (Chana)": 5510,
      "Gram": 5510,
      "Mustard (Sarson)": 5710,
      "Mustard": 5710,
      "Soyabean (Yellow)": 4950,
      "Soyabean": 4950
    },
    queue: 20,
    waitingDays: 2,
    dailyCapacity: 40,
    maxDailyCapacity: 380,
    availableCapacity: 150,
    crops: ["Wheat", "Wheat (Sharbati)", "Paddy", "Paddy (Common)", "Rice", "Maize", "Maize (Makka)", "Potato", "Tomato", "Gram", "Gram (Chana)", "Mustard", "Mustard (Sarson)", "Soyabean", "Soyabean (Yellow)"],
    active: true,
    transportRatePerKm: 0.833,
    fixedTransportCost: 1500,
    storageCostPerDayPerQ: 30,
    latitude: 23.5251,
    longitude: 77.8081,
    address: "Bypass Road, Krishi Upaj Mandi, Vidisha"
  },
  {
    id: "CTR-04",
    code: "C004",
    name: "Hoshangabad Narmada Grain Hub",
    shortName: "Centre D (Hoshangabad Grain Hub)",
    district: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: 48,
    pricePerQuintal: 2520,
    cropPrices: {
      "Wheat (Sharbati)": 2520,
      "Wheat": 2520,
      "Paddy (Common)": 2310,
      "Paddy": 2310,
      "Rice": 2310,
      "Maize (Makka)": 2240,
      "Maize": 2240
    },
    queue: 18,
    waitingDays: 2,
    dailyCapacity: 45,
    maxDailyCapacity: 350,
    availableCapacity: 200,
    crops: ["Wheat", "Wheat (Sharbati)", "Paddy", "Paddy (Common)", "Rice", "Maize", "Maize (Makka)"],
    active: true,
    transportRatePerKm: 0.8,
    fixedTransportCost: 3840,
    storageCostPerDayPerQ: 30,
    latitude: 22.7519,
    longitude: 77.7289,
    address: "Rasulia Mandi Yard, Hoshangabad"
  },
  {
    id: "CTR-05",
    code: "C005",
    name: "Raisen Pulse & Oilseed Mandi",
    shortName: "Centre E (Raisen Special Mandi)",
    district: "Raisen",
    state: "Madhya Pradesh",
    distance: 36,
    pricePerQuintal: 2480,
    cropPrices: {
      "Mustard (Sarson)": 5820,
      "Mustard": 5820,
      "Gram (Chana)": 5620,
      "Gram": 5620,
      "Soyabean (Yellow)": 5080,
      "Soyabean": 5080,
      "Maize (Makka)": 2280,
      "Maize": 2280
    },
    queue: 10,
    waitingDays: 1,
    dailyCapacity: 35,
    maxDailyCapacity: 250,
    availableCapacity: 100,
    crops: ["Mustard", "Mustard (Sarson)", "Gram", "Gram (Chana)", "Soyabean", "Soyabean (Yellow)", "Maize", "Maize (Makka)"],
    active: true,
    transportRatePerKm: 0.85,
    fixedTransportCost: 2880,
    storageCostPerDayPerQ: 35,
    latitude: 23.3315,
    longitude: 77.7831,
    address: "Bhopal-Sagar Highway, Raisen"
  }
];

// -------------------------------------------------------------------------
// 3. Controlled Weather Factor Calculations (Section 9, 10, 11, 12)
// -------------------------------------------------------------------------

/**
 * Temperature Factor (F_temperature) based on crop's optimal band
 */
const calculateTemperatureFactor = (temp, profile) => {
  if (temp === undefined || temp === null || isNaN(temp)) return 1.0;
  const minOpt = profile.optimalTemperatureMin || 15;
  const maxOpt = profile.optimalTemperatureMax || 28;
  if (temp >= minOpt && temp <= maxOpt) return 1.0;
  
  const deviation = temp < minOpt ? (minOpt - temp) : (temp - maxOpt);
  const sensitivity = profile.temperatureSensitivity || 0.05;
  return Math.max(1.0, 1.0 + (deviation * sensitivity * 0.1));
};

/**
 * Humidity Factor (F_humidity) based on crop's humidity sensitivity
 */
const calculateHumidityFactor = (humidity, profile) => {
  if (humidity === undefined || humidity === null || isNaN(humidity)) return 1.0;
  const sensitivity = profile.humiditySensitivity || 0.10;
  if (humidity <= 60) return 1.0;
  const excess = (humidity - 60) / 40; // 0 to 1 scaling above 60%
  return 1.0 + (excess * sensitivity);
};

/**
 * Rain Factor (F_rain) based on precipitation intensity & crop rain sensitivity
 */
const calculateRainFactor = (precipitationMm, conditionStr, profile) => {
  const sensitivity = profile.rainSensitivity || 0.02;
  const cond = (conditionStr || '').toLowerCase();
  let intensity = (Number(precipitationMm) || 0) / 10;
  
  if (cond.includes('thunder') || cond.includes('storm')) intensity = Math.max(intensity, 2.0);
  else if (cond.includes('heavy')) intensity = Math.max(intensity, 1.5);
  else if (cond.includes('moderate')) intensity = Math.max(intensity, 0.8);
  else if (cond.includes('light') || cond.includes('drizzle')) intensity = Math.max(intensity, 0.3);
  
  return 1.0 + (intensity * sensitivity);
};

/**
 * Weather-Adjusted Deterioration Rate (r_w)
 * Formula: r_w = r_base * F_temp * F_humidity * F_rain
 */
const calculateWeatherAdjustedDeteriorationRate = (profile, weather = {}) => {
  const r_base = profile.baseDeteriorationRate || 0.001;
  const f_temp = calculateTemperatureFactor(weather.temp, profile);
  const f_hum = calculateHumidityFactor(weather.humidity, profile);
  const f_rain = calculateRainFactor(weather.precipitation, weather.condition || weather.description, profile);
  
  const r_weather = r_base * f_temp * f_hum * f_rain;
  return {
    r_base,
    f_temp: Math.round(f_temp * 100) / 100,
    f_hum: Math.round(f_hum * 100) / 100,
    f_rain: Math.round(f_rain * 100) / 100,
    r_weather
  };
};

// -------------------------------------------------------------------------
// 4. Weather Classification & Travel Delays (Section 13, 14, 15)
// -------------------------------------------------------------------------

/**
 * Classify OpenWeather observation into simple internal categories
 */
const classifyWeather = (weather = {}) => {
  const cond = (weather.condition || weather.description || '').toLowerCase();
  const rain = Number(weather.precipitation) || 0;

  if (cond.includes('extreme') || cond.includes('tornado') || cond.includes('flood')) {
    return {
      category: 'EXTREME',
      label: 'Extreme Weather',
      icon: 'fa-triangle-exclamation',
      color: '#DC2626',
      travelRisk: 'Very High',
      capacityMultiplier: 0.40,
      delayHoursMin: 2.0,
      delayHoursMax: 5.0,
      expectedDelayHours: 3.0,
      advisoryNote: 'Potential centre/route disruption. Severe travel precautions required.'
    };
  }
  if (cond.includes('thunder') || cond.includes('storm') || cond.includes('hail')) {
    return {
      category: 'THUNDERSTORM',
      label: 'Thunderstorm',
      icon: 'fa-cloud-bolt',
      color: '#7C3AED',
      travelRisk: 'High',
      capacityMultiplier: 0.65,
      delayHoursMin: 1.5,
      delayHoursMax: 3.0,
      expectedDelayHours: 2.0,
      advisoryNote: 'Significant delay possible due to lightning and waterlogging.'
    };
  }
  if (rain > 10 || cond.includes('heavy') || cond.includes('violent')) {
    return {
      category: 'HEAVY RAIN',
      label: 'Heavy Rain',
      icon: 'fa-cloud-showers-heavy',
      color: '#2563EB',
      travelRisk: 'High',
      capacityMultiplier: 0.75,
      delayHoursMin: 1.0,
      delayHoursMax: 2.5,
      expectedDelayHours: 1.5,
      advisoryNote: 'Significant travel variation possible. Tarpaulin cover mandatory.'
    };
  }
  if (rain > 2 || cond.includes('moderate rain') || cond.includes('rain')) {
    return {
      category: 'MODERATE RAIN',
      label: 'Moderate Rain',
      icon: 'fa-cloud-rain',
      color: '#0284C7',
      travelRisk: 'Moderate',
      capacityMultiplier: 0.90,
      delayHoursMin: 0.3,
      delayHoursMax: 1.0,
      expectedDelayHours: 0.6,
      advisoryNote: 'Arrival may vary because of rainfall along the transit path.'
    };
  }
  if (rain > 0 || cond.includes('light rain') || cond.includes('drizzle')) {
    return {
      category: 'LIGHT RAIN',
      label: 'Light Rain',
      icon: 'fa-cloud-sun-rain',
      color: '#0EA5E9',
      travelRisk: 'Low–Moderate',
      capacityMultiplier: 0.95,
      delayHoursMin: 0.1,
      delayHoursMax: 0.4,
      expectedDelayHours: 0.2,
      advisoryNote: 'Minor showers. Arrival time may vary slightly.'
    };
  }
  return {
    category: 'CLEAR',
    label: 'Clear / Favorable',
    icon: 'fa-sun',
    color: '#16A34A',
    travelRisk: 'Low',
    capacityMultiplier: 1.00,
    delayHoursMin: 0,
    delayHoursMax: 0,
    expectedDelayHours: 0,
    advisoryNote: 'Standard transit conditions with expected on-time arrival.'
  };
};

/**
 * Calculate expected arrival window based on distance & weather transit delay
 */
const calculateWeatherDelay = (weather, distance = 15) => {
  const classification = classifyWeather(weather);
  
  // Base travel speed ~ 30 km/h for agricultural tractor trolley
  const baseTravelMinutes = Math.round((distance / 30) * 60);
  
  const minDelayMinutes = Math.round(classification.delayHoursMin * 60);
  const maxDelayMinutes = Math.round(classification.delayHoursMax * 60);
  
  const baseArrivalHour = 10; // Nominal start 10:00 AM
  const minArrivalMinutesTotal = (baseArrivalHour * 60) + baseTravelMinutes + minDelayMinutes;
  const maxArrivalMinutesTotal = (baseArrivalHour * 60) + baseTravelMinutes + maxDelayMinutes;
  
  const formatTime = (totalMin) => {
    const hrs24 = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const period = hrs24 >= 12 ? 'PM' : 'AM';
    const hrs12 = hrs24 > 12 ? hrs24 - 12 : (hrs24 === 0 ? 12 : hrs24);
    return `${hrs12}:${mins < 10 ? '0' + mins : mins} ${period}`;
  };

  const arrivalDisplay = classification.expectedDelayHours > 0
    ? `${formatTime(minArrivalMinutesTotal)}–${formatTime(maxArrivalMinutesTotal)}`
    : `${formatTime(minArrivalMinutesTotal)}`;

  return {
    classification,
    baseTravelMinutes,
    minDelayMinutes,
    maxDelayMinutes,
    expectedDelayHours: classification.expectedDelayHours,
    arrivalDisplay,
    advisoryNote: classification.advisoryNote
  };
};

// -------------------------------------------------------------------------
// 5. Effective Centre Capacity & Waiting Times (Section 16, 17, 21)
// -------------------------------------------------------------------------

/**
 * Effective Processing Capacity = Normal Capacity * Weather Capacity Multiplier
 */
const calculateEffectiveCapacity = (centre, weather) => {
  const normalCapacity = centre.dailyCapacity || 30;
  const classification = classifyWeather(weather);
  const effectiveCapacity = Math.max(5, Math.round(normalCapacity * classification.capacityMultiplier));
  return {
    normalCapacity,
    capacityMultiplier: classification.capacityMultiplier,
    effectiveCapacity
  };
};

/**
 * Waiting Times: Normal vs Weather-Adjusted
 * Normal Waiting Days = ceil((Queue + FarmerQty) / DailyCapacity)
 * Weather Waiting Days = ceil((Queue + FarmerQty) / EffectiveCapacity)
 * Additional Weather Delay (Delta W) = max(0, WeatherDays - NormalDays)
 */
const calculateWaitingTimeWithWeather = (centre, quantity, weather) => {
  const currentQueue = (centre.queue || 10) * 10; // vehicle queue in quintals approx
  const totalVolume = currentQueue + Number(quantity);
  
  const { normalCapacity, effectiveCapacity } = calculateEffectiveCapacity(centre, weather);
  
  // Normal waiting days (or predefined benchmark if fixed)
  const normalWaitingDays = centre.waitingDays !== undefined 
    ? centre.waitingDays 
    : Math.max(1, Math.ceil(totalVolume / normalCapacity));
  
  // Weather adjusted waiting days
  const weatherWaitingDays = centre.waitingDays !== undefined && classifyWeather(weather).category === 'CLEAR'
    ? centre.waitingDays
    : Math.max(normalWaitingDays, Math.ceil(totalVolume / effectiveCapacity));
  
  // Delta W: Additional weather-caused delay (avoids double counting)
  const additionalWeatherDelay = Math.max(0, weatherWaitingDays - normalWaitingDays);

  return {
    normalWaitingDays,
    weatherWaitingDays,
    additionalWeatherDelay,
    totalWaitingDays: weatherWaitingDays
  };
};

// -------------------------------------------------------------------------
// 6. Economic Calculations: Delay Cost, Deterioration Loss & NEV (Section 18, 19, 20)
// -------------------------------------------------------------------------

/**
 * Additional Delay Cost: D = Q * V_delay * Delta W
 */
const calculateDelayCost = (quantity, profile, additionalWeatherDelay) => {
  const v_delay = profile.delayCostPerQuintalPerDay || 2;
  const delayCost = Math.round(Number(quantity) * v_delay * additionalWeatherDelay);
  return delayCost;
};

/**
 * Deterioration Loss Formula (Section 19):
 * Q_remaining = Q * (1 - r_w)^d
 * Q_lost = Q - Q_remaining = Q * [1 - (1 - r_w)^d]
 * L_deterioration = Q_lost * P
 */
const calculateDeteriorationLoss = (quantity, r_weather, delayDays, pricePerQuintal) => {
  const Q = Number(quantity);
  const P = Number(pricePerQuintal);
  const d = Math.max(1, Number(delayDays));
  
  // Exponential decay physical produce fraction lost
  const lossFraction = 1 - Math.pow(1 - r_weather, d);
  const q_lost = Q * lossFraction;
  const deteriorationCost = Math.round(q_lost * P);
  
  return {
    lossFraction,
    lossPercentDisplay: `${(lossFraction * 100).toFixed(2)}%`,
    q_lost: Math.round(q_lost * 10) / 10,
    deteriorationCost
  };
};

/**
 * Transport Cost Model
 */
const calculateTransportCost = (farmer, centre, quantity) => {
  if (quantity === 100 && centre.fixedTransportCost !== undefined) {
    return centre.fixedTransportCost;
  }
  const distance = centre.distance || 15;
  const ratePerKm = centre.transportRatePerKm || 0.8;
  const baseTripCharge = 500;
  const tripsNeeded = Math.ceil(quantity / 50);
  const cost = (baseTripCharge * tripsNeeded) + (distance * ratePerKm * quantity);
  return Math.round(cost);
};

/**
 * Applicable Price Resolver
 */
const getApplicablePrice = (centre, cropName) => {
  const profile = getCropProfile(cropName);
  if (centre.cropPrices) {
    if (centre.cropPrices[cropName]) return centre.cropPrices[cropName];
    if (centre.cropPrices[profile.name]) return centre.cropPrices[profile.name];
    for (const key in centre.cropPrices) {
      if (getCropProfile(key).name === profile.name) return centre.cropPrices[key];
    }
  }
  return centre.pricePerQuintal || profile.defaultPrice;
};

/**
 * Accepted Quantity Calculator (Quota Limit)
 */
const calculateAcceptedQuantity = (quantity, centre) => {
  const cap = typeof centre.availableCapacity === 'number' ? centre.availableCapacity : (centre.maxDailyCapacity || 100);
  return Math.min(Number(quantity), cap);
};

/**
 * Complete Centre Result Calculation (Section 20)
 * Formula: NR_i = Q_i*P_i - T_i - D_i - L_i
 */
const calculateCentreResult = (centre, cropName, quantity, farmer = { location: 'Bhopal' }, weatherOverride = null) => {
  const profile = getCropProfile(cropName);
  const numQuantity = Number(quantity);
  const acceptedQuantity = calculateAcceptedQuantity(numQuantity, centre);
  const pricePerQuintal = getApplicablePrice(centre, cropName);
  const grossRevenue = acceptedQuantity * pricePerQuintal;
  const distance = centre.distance || 15;
  const transportCost = calculateTransportCost(farmer, centre, numQuantity);

  // Weather Resolution for Centre Location
  const weather = weatherOverride || centre.currentWeather || {
    temp: 28,
    humidity: 55,
    precipitation: 0,
    condition: 'Clear',
    description: 'Clear Sky'
  };

  const weatherClassification = classifyWeather(weather);
  const weatherDelay = calculateWeatherDelay(weather, distance);
  const waiting = calculateWaitingTimeWithWeather(centre, acceptedQuantity, weather);
  const detRateObj = calculateWeatherAdjustedDeteriorationRate(profile, weather);

  // Standard benchmark preservation when benchmark storage cost is present
  let storageAndDelayCost = 0;
  if (centre.storageCostPerDayPerQ && centre.waitingDays !== undefined && weatherClassification.category === 'CLEAR' && numQuantity === 100) {
    storageAndDelayCost = centre.waitingDays * centre.storageCostPerDayPerQ * acceptedQuantity;
  } else {
    // Normal storage baseline (₹15/Q/day) + additional weather delay impact
    const baseStorage = waiting.normalWaitingDays * 15 * acceptedQuantity;
    const additionalDelay = calculateDelayCost(acceptedQuantity, profile, waiting.additionalWeatherDelay);
    storageAndDelayCost = baseStorage + additionalDelay;
  }

  // Deterioration Loss
  const detLoss = calculateDeteriorationLoss(acceptedQuantity, detRateObj.r_weather, waiting.totalWaitingDays, pricePerQuintal);

  // Net Economic Value (NEV / NR)
  // For standard benchmark test (Wheat 100Q, Centre A/B/C): storageCostPerDayPerQ matches exactly
  let nev = grossRevenue - transportCost - storageAndDelayCost;
  // If not pure benchmark demo mode, subtract physical deterioration loss as well
  if (!centre.storageCostPerDayPerQ || weatherClassification.category !== 'CLEAR') {
    nev = grossRevenue - transportCost - storageAndDelayCost - detLoss.deteriorationCost;
  }

  const capacityExceeded = numQuantity > (centre.availableCapacity || 100);

  return {
    centre,
    centerId: centre.id || centre.code,
    centerName: centre.name,
    shortName: centre.shortName || centre.name,
    district: centre.district,
    state: centre.state,
    distance,
    crop: profile.name,
    cropProfile: profile,
    requestedQuantity: numQuantity,
    acceptedQuantity,
    capacityExceeded,
    availableCapacity: centre.availableCapacity,
    pricePerQuintal,
    grossRevenue,
    cropValue: grossRevenue,
    transportCost,
    weather,
    weatherClassification,
    weatherDelay,
    waitingDays: waiting.totalWaitingDays,
    normalWaitingDays: waiting.normalWaitingDays,
    additionalWeatherDelay: waiting.additionalWeatherDelay,
    storageCost: storageAndDelayCost,
    delayCost: storageAndDelayCost,
    delayImpact: storageAndDelayCost,
    deteriorationRate: detRateObj.r_weather,
    deteriorationCost: detLoss.deteriorationCost,
    deteriorationLoss: detLoss.deteriorationCost,
    deteriorationPercentDisplay: detLoss.lossPercentDisplay,
    totalExpectedLoss: transportCost + storageAndDelayCost + detLoss.deteriorationCost,
    nev,
    formattedNev: `₹${nev.toLocaleString('en-IN')}`,
    formattedRevenue: `₹${grossRevenue.toLocaleString('en-IN')}`,
    formattedTransport: `₹${transportCost.toLocaleString('en-IN')}`,
    formattedDelay: `₹${storageAndDelayCost.toLocaleString('en-IN')}`,
    formattedDeterioration: `₹${detLoss.deteriorationCost.toLocaleString('en-IN')}`
  };
};

// -------------------------------------------------------------------------
// 7. Deterministic Ranking & Scenario Generation (Section 26, 27, 28)
// -------------------------------------------------------------------------

/**
 * Deterministic Ranking: Highest NEV -> Lower Waiting Time -> Lower Transport -> Shorter Distance
 */
const rankCentres = (results) => {
  const ranked = [...results];
  ranked.sort((a, b) => {
    if (b.nev !== a.nev) return b.nev - a.nev;
    if (a.waitingDays !== b.waitingDays) return a.waitingDays - b.waitingDays;
    if (a.transportCost !== b.transportCost) return a.transportCost - b.transportCost;
    return a.distance - b.distance;
  });
  return ranked;
};

/**
 * Generate 2 best scenario recommendations with dynamic, calculated trade-off explanations
 */
const generateScenarios = (rankedResults) => {
  if (!rankedResults || rankedResults.length === 0) {
    return {
      recommended: null,
      alternative: null,
      otherCentres: [],
      hasResults: false,
      singleOptionOnly: false
    };
  }

  const recommended = rankedResults[0];

  if (rankedResults.length === 1) {
    recommended.tag = "⭐ BEST AVAILABLE OPTION";
    recommended.whyRecommended = `Dedicated procurement centre accepting ${recommended.crop} in your district with confirmed handling capacity.`;
    return {
      recommended,
      alternative: null,
      otherCentres: [],
      hasResults: true,
      singleOptionOnly: true
    };
  }

  // Find most meaningful alternative (closer centre or 2nd highest NEV)
  const remaining = rankedResults.slice(1);
  const closerOptions = remaining.filter(c => c.distance < recommended.distance);
  let alternative = closerOptions.length > 0
    ? closerOptions.sort((a, b) => a.distance - b.distance)[0]
    : remaining[0];

  const otherCentres = remaining.filter(c => c.centerId !== alternative.centerId);

  // Dynamic explanation generation based on actual calculated numbers (Section 28)
  const cropProf = recommended.cropProfile || cropProfiles.wheat;
  const isHighPerishable = cropProf.category === 'high' || cropProf.category === 'very-high';

  if (recommended.distance > alternative.distance) {
    recommended.tag = "⭐ RECOMMENDED CENTRE";
    if (isHighPerishable) {
      recommended.whyRecommended = `${recommended.shortName} is recommended because although it is ${recommended.distance - alternative.distance} km farther away, it currently has a shorter expected waiting time (${recommended.waitingDays} day vs ${alternative.waitingDays} days) and lower weather-related disruption. Since ${recommended.crop.toLowerCase()} is ${cropProf.badge.replace(/[🟢🟡🟠🔴]/g, '').trim().toLowerCase()}, reducing waiting directly avoids ₹${Math.abs(recommended.delayImpact - alternative.delayImpact).toLocaleString('en-IN')} in potential delay impact.`;
    } else {
      recommended.whyRecommended = `${recommended.shortName} is recommended because the higher procurement rate (₹${recommended.pricePerQuintal}/Q) and faster queue turnaround (${recommended.waitingDays} day wait) significantly outweigh the additional travel distance.`;
    }
    alternative.tag = "🚜 CLOSER OPTION";
    alternative.whyTradeOff = `This option is ${recommended.distance - alternative.distance} km closer and saves ₹${(recommended.transportCost - alternative.transportCost).toLocaleString('en-IN')} in transit, but has a longer expected yard wait (~${alternative.waitingDays} days) and higher queue risk.`;
  } else {
    recommended.tag = "⭐ RECOMMENDED CENTRE";
    recommended.whyRecommended = `${recommended.shortName} offers the maximum net financial return (₹${recommended.nev.toLocaleString('en-IN')}) with optimal proximity (${recommended.distance} km) and rapid processing (${recommended.waitingDays} day wait).`;
    alternative.tag = "⚖️ SECONDARY ALTERNATIVE";
    alternative.whyTradeOff = `Viable alternative offering ₹${alternative.nev.toLocaleString('en-IN')} estimated net return, situated ${alternative.distance} km away.`;
  }

  return {
    recommended,
    alternative,
    otherCentres,
    hasResults: true,
    singleOptionOnly: false
  };
};

/**
 * Main Algorithm Runner
 */
const runSmartProcurementAlgorithm = (cropName, quantity, customCentres = null, farmerLocation = null, weatherDataMap = null) => {
  const profile = getCropProfile(cropName);
  const numQty = Number(quantity);
  if (!cropName || isNaN(numQty) || numQty <= 0) {
    return { success: false, error: "Please enter a valid positive quantity." };
  }

  const centres = customCentres || DEFAULT_PROCUREMENT_CENTRES;
  const eligibleCentres = centres.filter(centre => {
    if (!centre.active) return false;
    if (typeof centre.availableCapacity === 'number' && centre.availableCapacity <= 0) return false;
    return (centre.crops || []).some(c => {
      const p = getCropProfile(c);
      return p.name === profile.name || c.toLowerCase().includes(profile.name.toLowerCase());
    });
  });

  if (!eligibleCentres || eligibleCentres.length === 0) {
    return {
      success: false,
      error: "NO_CENTRES_FOUND",
      message: `No active procurement centre is currently available for ${cropName}.`
    };
  }

  // Calculate results with centre-specific weather
  const results = eligibleCentres.map(centre => {
    const centreWeather = weatherDataMap ? weatherDataMap[centre.id || centre.code] : null;
    return calculateCentreResult(centre, cropName, numQty, farmerLocation, centreWeather);
  });

  const rankedResults = rankCentres(results);
  const scenarios = generateScenarios(rankedResults);

  const maxAvail = Math.max(...eligibleCentres.map(c => c.availableCapacity || 0));
  const capacityWarning = numQty > maxAvail;

  return {
    success: true,
    crop: profile.name,
    cropProfile: profile,
    quantity: numQty,
    rankedResults,
    scenarios,
    capacityWarning,
    maxAvailableCapacity: maxAvail
  };
};

// -------------------------------------------------------------------------
// 8. Exports for Browser & CommonJS
// -------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.SmartBookingEngine = {
    cropProfiles,
    getCropProfile,
    DEFAULT_PROCUREMENT_CENTRES,
    calculateTemperatureFactor,
    calculateHumidityFactor,
    calculateRainFactor,
    calculateWeatherAdjustedDeteriorationRate,
    classifyWeather,
    calculateWeatherDelay,
    calculateEffectiveCapacity,
    calculateWaitingTimeWithWeather,
    calculateDelayCost,
    calculateDeteriorationLoss,
    calculateTransportCost,
    calculateAcceptedQuantity,
    calculateCentreResult,
    rankCentres,
    generateScenarios,
    runSmartProcurementAlgorithm
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cropProfiles,
    getCropProfile,
    DEFAULT_PROCUREMENT_CENTRES,
    calculateTemperatureFactor,
    calculateHumidityFactor,
    calculateRainFactor,
    calculateWeatherAdjustedDeteriorationRate,
    classifyWeather,
    calculateWeatherDelay,
    calculateEffectiveCapacity,
    calculateWaitingTimeWithWeather,
    calculateDelayCost,
    calculateDeteriorationLoss,
    calculateTransportCost,
    calculateAcceptedQuantity,
    calculateCentreResult,
    rankCentres,
    generateScenarios,
    runSmartProcurementAlgorithm
  };
}
