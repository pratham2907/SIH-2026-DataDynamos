const https = require('https');

// Open-Meteo API — 100% free, no API key, works instantly
// Docs: https://open-meteo.com/en/docs
const OPEN_METEO_HOST = 'api.open-meteo.com';

// WMO Weather Interpretation Codes → human-readable condition
const WMO_CODES = {
  0:  { label: 'Clear Sky',            main: 'Clear' },
  1:  { label: 'Mainly Clear',          main: 'Clear' },
  2:  { label: 'Partly Cloudy',         main: 'Clouds' },
  3:  { label: 'Overcast',              main: 'Clouds' },
  45: { label: 'Foggy',                 main: 'Fog' },
  48: { label: 'Icy Fog',               main: 'Fog' },
  51: { label: 'Light Drizzle',         main: 'Drizzle' },
  53: { label: 'Moderate Drizzle',      main: 'Drizzle' },
  55: { label: 'Dense Drizzle',         main: 'Drizzle' },
  61: { label: 'Light Rain',            main: 'Rain' },
  63: { label: 'Moderate Rain',         main: 'Rain' },
  65: { label: 'Heavy Rain',            main: 'Rain' },
  71: { label: 'Light Snowfall',        main: 'Snow' },
  73: { label: 'Moderate Snowfall',     main: 'Snow' },
  75: { label: 'Heavy Snowfall',        main: 'Snow' },
  77: { label: 'Snow Grains',           main: 'Snow' },
  80: { label: 'Light Rain Showers',    main: 'Rain' },
  81: { label: 'Moderate Rain Showers', main: 'Rain' },
  82: { label: 'Violent Rain Showers',  main: 'Rain' },
  85: { label: 'Light Snow Showers',    main: 'Snow' },
  86: { label: 'Heavy Snow Showers',    main: 'Snow' },
  95: { label: 'Thunderstorm',          main: 'Thunderstorm' },
  96: { label: 'Thunderstorm w/ Hail',  main: 'Thunderstorm' },
  99: { label: 'Thunderstorm w/ Heavy Hail', main: 'Thunderstorm' },
};

// Major mandi districts with coordinates
const MANDI_LOCATIONS = [
  { city: 'Bhopal',   lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
  { city: 'Karnal',   lat: 29.6857, lon: 76.9905, state: 'Haryana' },
  { city: 'Lucknow',  lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
  { city: 'Nagpur',   lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
  { city: 'Patna',    lat: 25.5941, lon: 85.1376, state: 'Bihar' },
  { city: 'Jaipur',   lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
];

/**
 * Fetch live weather from Open-Meteo (no API key required)
 */
const fetchWeatherOpenMeteo = (lat, lon) => {
  return new Promise((resolve, reject) => {
    const path = `/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,` +
      `weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility` +
      `&daily=sunrise,sunset&timezone=Asia%2FKolkata&forecast_days=1`;

    const options = { hostname: OPEN_METEO_HOST, path, method: 'GET' };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`Open-Meteo error: ${parsed.reason}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Invalid JSON from Open-Meteo API'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Open-Meteo timeout')); });
    req.end();
  });
};

/**
 * Map WMO weather code to an OpenWeatherMap-style icon code (for display)
 */
const getIconCode = (wmoCode, isDay = true) => {
  const suffix = isDay ? 'd' : 'n';
  const map = {
    0: `01${suffix}`, 1: `01${suffix}`, 2: `02${suffix}`, 3: `04${suffix}`,
    45: `50${suffix}`, 48: `50${suffix}`,
    51: `09${suffix}`, 53: `09${suffix}`, 55: `09${suffix}`,
    61: `10${suffix}`, 63: `10${suffix}`, 65: `10${suffix}`,
    71: `13${suffix}`, 73: `13${suffix}`, 75: `13${suffix}`,
    80: `09${suffix}`, 81: `09${suffix}`, 82: `09${suffix}`,
    95: `11${suffix}`, 96: `11${suffix}`, 99: `11${suffix}`,
  };
  return map[wmoCode] || `02${suffix}`;
};

/**
 * Classify Open-Meteo data into agro-advisory alert
 */
const classifyOpenMeteoAlert = (data, location) => {
  const cur = data.current;
  const daily = data.daily;

  const temp        = cur.temperature_2m;
  const feelsLike   = cur.apparent_temperature;
  const humidity    = cur.relative_humidity_2m;
  const windSpeed   = (cur.wind_speed_10m / 3.6).toFixed(1); // km/h → m/s
  const precipitation = cur.precipitation;
  const wmoCode     = cur.weather_code;
  const pressure    = cur.surface_pressure;
  const visibility  = cur.visibility ? (cur.visibility / 1000).toFixed(1) : 'N/A';

  const condition = WMO_CODES[wmoCode] || { label: 'Unknown', main: 'Clear' };

  // Sunrise & Sunset (from daily forecast)
  const sunriseRaw = daily && daily.sunrise && daily.sunrise[0];
  const sunsetRaw  = daily && daily.sunset  && daily.sunset[0];
  const sunrise = sunriseRaw ? new Date(sunriseRaw).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const sunset  = sunsetRaw  ? new Date(sunsetRaw).toLocaleTimeString('en-IN',  { hour: '2-digit', minute: '2-digit' }) : 'N/A';

  // Determine if it's daytime
  const now = new Date();
  const isDay = sunriseRaw && sunsetRaw
    ? now >= new Date(sunriseRaw) && now <= new Date(sunsetRaw)
    : true;

  const icon = getIconCode(wmoCode, isDay);

  let type, severity, severityClass, advisory;

  // Thunderstorm
  if (condition.main === 'Thunderstorm') {
    type = 'Thunderstorm Warning';
    severity = 'HIGH RISK';
    severityClass = 'skipped';
    advisory = `${condition.label} with ${precipitation.toFixed(1)}mm precipitation. Wind ${windSpeed} m/s. Halt all outdoor Mandi operations immediately. Secure grain storage.`;
  }
  // Heavy rain
  else if ((condition.main === 'Rain' || condition.main === 'Drizzle') && precipitation > 5) {
    type = 'Heavy Rain Warning';
    severity = 'HIGH RISK';
    severityClass = 'skipped';
    advisory = `${condition.label} — ${precipitation.toFixed(1)}mm rainfall recorded. Humidity ${humidity}%. Cover all grain storage at Mandi Gate 2 & 3. Delay outdoor procurement.`;
  }
  // Light rain / drizzle
  else if (condition.main === 'Rain' || condition.main === 'Drizzle') {
    type = 'Rain & Humidity Warning';
    severity = 'MODERATE';
    severityClass = 'waiting';
    advisory = `${condition.label} with ${humidity}% humidity and ${precipitation.toFixed(1)}mm precipitation. Ensure grain tarpaulins are deployed. Covered shed storage recommended.`;
  }
  // Fog
  else if (condition.main === 'Fog') {
    type = 'Low Visibility Advisory';
    severity = 'MODERATE';
    severityClass = 'waiting';
    advisory = `${condition.label} — visibility ${visibility} km. Wind ${windSpeed} m/s. Farmers transporting grain advised to delay arrival until visibility improves.`;
  }
  // Clear & hot & dry → Optimal harvest
  else if (condition.main === 'Clear' && temp > 28 && humidity < 65) {
    type = 'Optimal Harvest Window';
    severity = 'FAVORABLE';
    severityClass = 'completed';
    advisory = `${condition.label} with ${temp.toFixed(0)}°C and ${humidity}% humidity. Ideal dry conditions for harvesting and direct Mandi delivery. Wind: ${windSpeed} m/s.`;
  }
  // Extreme heat
  else if (temp > 42) {
    type = 'Extreme Heat Advisory';
    severity = 'HIGH RISK';
    severityClass = 'skipped';
    advisory = `Temperature ${temp.toFixed(0)}°C — extreme heat stress alert. Restrict outdoor procurement 12–3 PM. Ensure water and shade for farmers at Mandi premises.`;
  }
  // Partly cloudy / overcast
  else if (condition.main === 'Clouds') {
    type = 'Overcast Conditions';
    severity = 'LOW RISK';
    severityClass = 'completed';
    advisory = `${condition.label} at ${temp.toFixed(0)}°C with ${humidity}% humidity. Harvest operations can proceed. Monitor for possible showers in the next 6 hours.`;
  }
  // Normal clear conditions
  else {
    type = 'Normal Weather';
    severity = 'CLEAR';
    severityClass = 'completed';
    advisory = `${condition.label}. Temperature ${temp.toFixed(0)}°C, humidity ${humidity}%, wind ${windSpeed} m/s. Standard Mandi operations can proceed normally.`;
  }

  return {
    type,
    severity,
    severityClass,
    affectedDistricts: [location.city],
    state: location.state,
    advisory,
    liveData: {
      temp: temp.toFixed(1),
      feelsLike: feelsLike.toFixed(1),
      humidity,
      windSpeed,
      condition: condition.main,
      description: condition.label,
      icon,
      pressure: pressure ? Math.round(pressure) : 'N/A',
      visibility,
      sunrise,
      sunset,
    }
  };
};

/**
 * Get live weather alerts for all mandi districts
 */
const getLiveWeatherAlerts = async () => {
  const results = await Promise.allSettled(
    MANDI_LOCATIONS.map(loc =>
      fetchWeatherOpenMeteo(loc.lat, loc.lon).then(data => classifyOpenMeteoAlert(data, loc))
    )
  );

  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason.message);
  const alerts = results.filter(r => r.status === 'fulfilled').map(r => r.value);

  if (errors.length > 0) {
    console.log(`⚠️  Open-Meteo issues: ${[...new Set(errors)].join(' | ')}`);
  }

  if (alerts.length === 0) {
    return getFallbackAlerts();
  }

  return alerts;
};

/**
 * Fallback static alerts when API is unavailable
 */
const getFallbackAlerts = () => [
  {
    type: 'Rain & Humidity Warning',
    severity: 'MODERATE',
    severityClass: 'waiting',
    affectedDistricts: ['Bhopal', 'Sehore', 'Raisen'],
    state: 'Madhya Pradesh',
    advisory: 'Light scattered rainfall expected in 24 hours. Ensure grain tarpaulins and covered shed storage at Mandi Gate 2 & 3.',
    liveData: null
  },
  {
    type: 'Optimal Harvest Window',
    severity: 'FAVORABLE',
    severityClass: 'completed',
    affectedDistricts: ['Karnal', 'Kurukshetra'],
    state: 'Haryana',
    advisory: 'Clear skies with 31°C dry conditions. Ideal time for wheat harvesting and direct Mandi delivery.',
    liveData: null
  }
];

module.exports = { getLiveWeatherAlerts };
