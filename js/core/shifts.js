import { DEFAULT_THRESHOLDS } from '../shared/config.js';

function cloneThresholds(t) {
  return {
    morning: { start: t.morning.start, end: t.morning.end },
    evening: { start: t.evening.start, end: t.evening.end },
    night:   { start: t.night.start,   end: t.night.end   },
  };
}

function getDefaults() {
  return cloneThresholds(DEFAULT_THRESHOLDS);
}

function timeToMinutes(str) {
  const parts = String(str || '').split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

const BADGE_CLASSES = Object.freeze({
  morning: 'badge--morning',
  evening: 'badge--evening',
  night:   'badge--night',
  off:     '',
});

function getCurrentShift(now, thresholds, labels) {
  const t = thresholds || getDefaults();
  const safe = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const cur = safe.getHours() * 60 + safe.getMinutes();
  const mStart = timeToMinutes(t.morning.start);
  const mEnd   = timeToMinutes(t.morning.end);
  const eStart = timeToMinutes(t.evening.start);
  const eEnd   = timeToMinutes(t.evening.end);
  const nStart = timeToMinutes(t.night.start);
  const nEnd   = timeToMinutes(t.night.end);

  const L = labels || {};

  if (cur >= mStart && cur < mEnd) {
    return { id: 'morning', label: L.morning || 'Morning', badgeClass: BADGE_CLASSES.morning, color: 'morning' };
  }
  if (cur >= eStart && cur < eEnd) {
    return { id: 'evening', label: L.evening || 'Evening', badgeClass: BADGE_CLASSES.evening, color: 'evening' };
  }
  if (cur >= nStart || cur < nEnd) {
    return { id: 'night', label: L.night || 'Night', badgeClass: BADGE_CLASSES.night, color: 'night' };
  }
  return { id: 'off', label: L.off || 'Off Duty', badgeClass: BADGE_CLASSES.off, color: '' };
}

function shiftLabelFor(id, labels) {
  const L = labels || {};
  return L[id] || '—';
}

export const shifts = { getDefaults, getCurrentShift, shiftLabelFor };
