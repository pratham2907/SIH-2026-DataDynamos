const https = require('https');
const { Centers } = require('../models/dbStore');

// Known Indian District & Major Cities reference coordinates for robust offline/fallback lookup
const KNOWN_INDIAN_LOCATIONS = [
  { city: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { city: 'Sehore', district: 'Sehore', state: 'Madhya Pradesh', lat: 23.2032, lon: 77.0844 },
  { city: 'Vidisha', district: 'Vidisha', state: 'Madhya Pradesh', lat: 23.5251, lon: 77.8081 },
  { city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { city: 'Ujjain', district: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lon: 75.7885 },
  { city: 'Hoshangabad', district: 'Narmadapuram', state: 'Madhya Pradesh', lat: 22.7519, lon: 77.7289 },
  { city: 'Raisen', district: 'Raisen', state: 'Madhya Pradesh', lat: 23.3315, lon: 77.7831 },
  { city: 'Jabalpur', district: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864 },
  { city: 'Gwalior', district: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
  { city: 'New Delhi', district: 'North Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { city: 'Karnal', district: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905 },
  { city: 'Ambala', district: 'Ambala', state: 'Haryana', lat: 30.3782, lon: 76.7767 },
  { city: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
  { city: 'Amritsar', district: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
  { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { city: 'Kota', district: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648 },
  { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { city: 'Kanpur', district: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { city: 'Varanasi', district: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { city: 'Patna', district: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { city: 'Muzaffarpur', district: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lon: 85.3647 },
  { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { city: 'Surat', district: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
  { city: 'Rajkot', district: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
  { city: 'Nashik', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
  { city: 'Pune', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { city: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365 },
  { city: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
  { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 }
];

/**
 * Haversine formula to compute great-circle distance in kilometers between two coordinates
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// In-memory cache for reverse-geocoded coordinates (12 hour TTL)
const geocodeCache = new Map();

/**
 * Reverse geocode latitude & longitude to City, District, State, Country
 */
const reverseGeocode = async (lat, lon) => {
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);

  if (isNaN(numLat) || isNaN(numLon)) {
    return getFallbackLocation();
  }

  const cacheKey = `${numLat.toFixed(3)},${numLon.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    const nearestCenter = await findNearestCenter(numLat, numLon);
    return { ...cached, nearestCenter };
  }

  // 1. Attempt OpenStreetMap Nominatim reverse geocode
  try {
    const nominatimData = await queryNominatim(numLat, numLon);
    if (nominatimData && nominatimData.address) {
      const addr = nominatimData.address;
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || 'Local Area';
      const district = addr.state_district || addr.county || addr.city_district || city;
      const state = addr.state || 'India';
      const country = addr.country || 'India';
      const postcode = addr.postcode || '';

      const locationResult = {
        lat: numLat,
        lon: numLon,
        city,
        district,
        state,
        country,
        postcode,
        formattedName: `${city}, ${state}`,
        isLiveGPS: true,
        source: 'Nominatim GPS'
      };

      geocodeCache.set(cacheKey, locationResult);
      const nearestCenter = await findNearestCenter(numLat, numLon);
      return { ...locationResult, nearestCenter };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode notice, using Indian centroid fallback:', err.message);
  }

  // 2. Offline Fallback: Find closest known Indian city
  let closest = KNOWN_INDIAN_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of KNOWN_INDIAN_LOCATIONS) {
    const dist = calculateDistanceKm(numLat, numLon, loc.lat, loc.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  const fallbackResult = {
    lat: numLat,
    lon: numLon,
    city: closest.city,
    district: closest.district,
    state: closest.state,
    country: 'India',
    formattedName: `${closest.city}, ${closest.state}`,
    isLiveGPS: true,
    distanceToKnownCityKm: minDistance,
    source: 'Geo-Proximity'
  };

  geocodeCache.set(cacheKey, fallbackResult);
  const nearestCenter = await findNearestCenter(numLat, numLon);
  return { ...fallbackResult, nearestCenter };
};

/**
 * Query Nominatim OpenStreetMap API
 */
const queryNominatim = (lat, lon) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'KPMS-Agri-Portal/1.0 (Government-Agri-System; Contact: contact@kpms.gov.in)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } else {
            reject(new Error(`Nominatim HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Invalid JSON from Nominatim'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(4000, () => {
      req.destroy();
      reject(new Error('Nominatim timeout'));
    });
    req.end();
  });
};

/**
 * Find the closest active procurement centre to given coordinates
 */
const findNearestCenter = async (lat, lon) => {
  try {
    const centers = await Centers.find({ isActive: true });
    if (!centers || centers.length === 0) {
      return {
        centerId: 'CTR-01',
        name: 'APMC Central Mandi Bhopal',
        district: 'Bhopal',
        state: 'Madhya Pradesh',
        distanceKm: calculateDistanceKm(lat, lon, 23.2599, 77.4126)
      };
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const c of centers) {
      const cLat = c.latitude || 23.2599;
      const cLon = c.longitude || 77.4126;
      const dist = calculateDistanceKm(lat, lon, cLat, cLon);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = {
          centerId: c.centerId,
          name: c.name,
          district: c.district,
          state: c.state,
          latitude: cLat,
          longitude: cLon,
          distanceKm: dist
        };
      }
    }

    return nearest;
  } catch (err) {
    return {
      centerId: 'CTR-01',
      name: 'APMC Central Mandi Bhopal',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      distanceKm: calculateDistanceKm(lat, lon, 23.2599, 77.4126)
    };
  }
};

/**
 * Default fallback location (Bhopal, Madhya Pradesh)
 */
const getFallbackLocation = async () => {
  const fallback = {
    lat: 23.2599,
    lon: 77.4126,
    city: 'Bhopal',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    formattedName: 'Bhopal, Madhya Pradesh',
    isLiveGPS: false,
    source: 'Default Mandi Hub'
  };
  const nearestCenter = await findNearestCenter(23.2599, 77.4126);
  return { ...fallback, nearestCenter };
};

module.exports = {
  reverseGeocode,
  findNearestCenter,
  calculateDistanceKm,
  KNOWN_INDIAN_LOCATIONS
};
