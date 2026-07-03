export const STORAGE_KEYS = Object.freeze({
  LOCALE: 'shiftpulse-locale',
  THEME: 'shiftpulse-theme',
  PREFERENCES: 'shiftpulse-preferences',
  GEOFENCE: 'shiftpulse-geofence',
  THRESHOLDS: 'shiftpulse-thresholds',
  VACATION: 'shiftpulse-vacation',
  VACATION_CONFIG: 'shiftpulse-vacation-config',
  CLOCKED: 'shiftpulse-clocked',
  CLOCK_IN: 'shiftpulse-clockin',
  SALARY: 'shiftpulse-salary',               // { baseSalary: number }
  DEDUCTIONS: 'shiftpulse-deductions',       // [{ id, name, amount }]
  PAYROLL_MONTHLY: 'shiftpulse-payroll-monthly', // { "2025-06": { allowances: [{ id, name, amount }] } }
});

export const DEFAULT_GEOFENCE = Object.freeze({
  lat: 25.2048,
  lng: 55.2708,
  radius: 150,
});

export const DEFAULT_THRESHOLDS = Object.freeze({
  morning: { start: '06:00', end: '14:00' },
  evening: { start: '14:00', end: '22:00' },
  night:   { start: '22:00', end: '06:00' },
});

export const DEFAULT_PREFS = Object.freeze({
  autoLocate: true,
  notify: true,
  vibrate: true,
});

export const DEFAULT_VACATION_DAYS = 30;
export const DEFAULT_VACATION_CONFIG = Object.freeze({ annual: 30, casual: 15 });
export const DEFAULT_LOCALE = 'en';
export const DEFAULT_THEME = 'dark';
export const SUPPORTED_LOCALES = Object.freeze(['en', 'ar']);

export const EVENT_TOPICS = Object.freeze({
  CLOCK_STARTED:    'clock:started',
  CLOCK_STOPPED:    'clock:stopped',
  ATTENDANCE_LOGGED:'attendance:logged',
  SHIFT_CHANGED:    'shift:changed',
  GEO_CHANGED:      'geo:changed',
  ABSENCE_DETECTED: 'absence:detected',
  LOCALE_CHANGED:   'locale:changed',
  THEME_CHANGED:    'theme:changed',
  SECTION_CHANGED:  'section:changed',
  SETTINGS_SAVED:   'settings:saved',
  STORAGE_QUOTA_WARN: 'storage:quota-warn',
  PAYROLL_UPDATED:  'payroll:updated',
});

export const DB = Object.freeze({
  NAME: 'ShiftProDB',
  VERSION: 1,
  STORE: 'events',
  INDEX_DATE: 'date',
  INDEX_TYPE: 'type',
});

export const FEATURE_FLAGS = Object.freeze({
  AUTH_ADAPTER: 'anon',
  STORAGE_ADAPTER: 'local',
});

export const GEOLOCATION = Object.freeze({
  TIMEOUT_MS: 15000,
  MAX_AGE_MS: 60000,
  ENABLE_HIGH_ACCURACY: false,
});

export const PERIODIC_CHECK = Object.freeze({
  INTERVAL_MS: 60000,
  INITIAL_DELAY_MS: 5000,
  POST_LOCALE_DELAY_MS: 2000,
});
