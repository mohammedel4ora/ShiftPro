import { GEOLOCATION } from '../../shared/config.js';

const ERROR_MESSAGES = {
  1: 'Location permission denied. Allow in browser settings.',
  2: 'Location unavailable (GPS signal lost).',
  3: 'Location request timed out. Try again.',
};

const CACHE_TTL_MS = 300000; // 5 minutes

let cachedPos = null;
let lastFetch = 0;

function getCurrentPosition(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedPos && (now - lastFetch) < CACHE_TTL_MS) {
    return Promise.resolve(cachedPos);
  }
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedPos = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        lastFetch = Date.now();
        resolve(cachedPos);
      },
      (err) => reject(new Error(ERROR_MESSAGES[err.code] || 'Unknown location error')),
      {
        enableHighAccuracy: GEOLOCATION.ENABLE_HIGH_ACCURACY,
        timeout: GEOLOCATION.TIMEOUT_MS,
        maximumAge: GEOLOCATION.MAX_AGE_MS,
      }
    );
  });
}

export const browserGeo = { getCurrentPosition };