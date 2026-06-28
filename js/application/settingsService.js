import {
  STORAGE_KEYS,
  DEFAULT_GEOFENCE,
  DEFAULT_PREFS,
  DEFAULT_VACATION_DAYS,
  EVENT_TOPICS,
} from '../shared/config.js';
import { localStore } from '../infrastructure/storage/localStore.js';
import { eventBus } from '../shared/eventBus.js';
import { shifts } from '../core/shifts.js';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function sanitizeGeo(cfg) {
  return {
    lat: Number.isFinite(Number(cfg.lat)) ? Number(cfg.lat) : DEFAULT_GEOFENCE.lat,
    lng: Number.isFinite(Number(cfg.lng)) ? Number(cfg.lng) : DEFAULT_GEOFENCE.lng,
    radius: Math.max(10, parseInt(cfg.radius, 10) || DEFAULT_GEOFENCE.radius),
  };
}

function loadGeo() {
  const stored = localStore.get(STORAGE_KEYS.GEOFENCE);
  if (stored && typeof stored === 'object') {
    return sanitizeGeo(stored);
  }
  return clone(DEFAULT_GEOFENCE);
}

function saveGeo(cfg) {
  const sanitized = sanitizeGeo(cfg);
  localStore.set(STORAGE_KEYS.GEOFENCE, sanitized);
  eventBus.publish(EVENT_TOPICS.SETTINGS_SAVED, { kind: 'geo' });
  return sanitized;
}

function sanitizeThresholds(t) {
  return {
    morning: { start: String(t.morning.start), end: String(t.morning.end) },
    evening: { start: String(t.evening.start), end: String(t.evening.end) },
    night:   { start: String(t.night.start),   end: String(t.night.end)   },
  };
}

function loadThresholds() {
  const stored = localStore.get(STORAGE_KEYS.THRESHOLDS);
  if (stored && typeof stored === 'object' && stored.morning && stored.evening && stored.night) {
    return sanitizeThresholds(stored);
  }
  return shifts.getDefaults();
}

function saveThresholds(t) {
  const sanitized = sanitizeThresholds(t);
  localStore.set(STORAGE_KEYS.THRESHOLDS, sanitized);
  eventBus.publish(EVENT_TOPICS.SETTINGS_SAVED, { kind: 'thresholds' });
  return sanitized;
}

function sanitizePrefs(p) {
  return {
    autoLocate: p.autoLocate !== false,
    notify: p.notify !== false,
    vibrate: p.vibrate === true,
  };
}

function loadPrefs() {
  const stored = localStore.get(STORAGE_KEYS.PREFERENCES);
  if (stored && typeof stored === 'object') {
    return sanitizePrefs(stored);
  }
  return clone(DEFAULT_PREFS);
}

function savePrefs(p) {
  const sanitized = sanitizePrefs(p);
  localStore.set(STORAGE_KEYS.PREFERENCES, sanitized);
  eventBus.publish(EVENT_TOPICS.SETTINGS_SAVED, { kind: 'prefs' });
  return sanitized;
}

function loadVacationTotal() {
  const stored = localStore.get(STORAGE_KEYS.VACATION);
  if (stored === null || stored === undefined) return DEFAULT_VACATION_DAYS;
  const n = parseInt(stored, 10);
  return Number.isNaN(n) ? DEFAULT_VACATION_DAYS : n;
}

function saveVacationTotal(n) {
  const sanitized = Math.max(0, parseInt(n, 10) || DEFAULT_VACATION_DAYS);
  localStore.set(STORAGE_KEYS.VACATION, sanitized);
  return sanitized;
}

export const settingsService = {
  loadGeo, saveGeo,
  loadThresholds, saveThresholds,
  loadPrefs, savePrefs,
  loadVacationTotal, saveVacationTotal,
};
