import { GEOLOCATION } from '../../shared/config.js';

const ERROR_MESSAGES = {
  1: 'Location permission denied. Allow in browser settings.',
  2: 'Location unavailable (GPS signal lost).',
  3: 'Location request timed out. Try again.',
};

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: parseFloat(pos.coords.latitude.toFixed(6)),
        lng: parseFloat(pos.coords.longitude.toFixed(6)),
      }),
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
