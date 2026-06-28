import { EVENT_TOPICS } from '../shared/config.js';
import { eventStore } from '../infrastructure/storage/eventStore.js';
import { notifier } from '../infrastructure/notifications/notifier.js';
import { browserGeo } from '../infrastructure/geolocation/browserGeo.js';
import { geofence } from '../core/geofence.js';
import { time } from '../core/time.js';
import { eventBus } from '../shared/eventBus.js';
import { settingsService } from './settingsService.js';

const QUICK_LOG_TYPES = Object.freeze(['sick', 'vacation', 'overtime', 'remote']);

async function logAttendance({ userId, type, shift }) {
  if (QUICK_LOG_TYPES.indexOf(type) === -1) {
    throw new Error(`Invalid attendance type: ${type}`);
  }
  const now = new Date();
  const event = {
    userId,
    type,
    date: time.todayIso(),
    time: time.formatTime(now),
    shift: shift || null,
    timestamp: now.toISOString(),
  };
  await eventStore.addEvent(event);
  eventBus.publish(EVENT_TOPICS.ATTENDANCE_LOGGED, { userId, type, date: event.date });
  return event;
}

async function getMonthStats({ userId, yearMonth }) {
  return eventStore.getMonthStats({ userId, yearMonth });
}

async function getVacationBalance({ userId }) {
  return eventStore.getVacationBalance({ userId });
}

async function checkAbsence({ userId }) {
  const prefs = settingsService.loadPrefs();
  if (!prefs.notify) return { notified: false, reason: 'notify-disabled' };
  const today = time.todayIso();
  const events = await eventStore.getEvents({ userId, date: today });
  const hasClockedIn = events.some((e) => e.type === 'clock-in');
  if (hasClockedIn) return { notified: false, reason: 'clocked-in' };
  const cfg = settingsService.loadGeo();
  let pos = null;
  try {
    pos = await browserGeo.getCurrentPosition();
  } catch (err) {
    return { notified: false, reason: 'no-location' };
  }
  const distance = geofence.haversine(pos.lat, pos.lng, cfg.lat, cfg.lng);
  if (distance > cfg.radius) {
    notifier.notify({
      title: 'Out of Work Area',
      body: 'You are outside the geofence and have not clocked in today.',
      tag: 'absence-alert',
    });
    if (prefs.vibrate) notifier.vibrate([200, 100, 200]);
    eventBus.publish(EVENT_TOPICS.ABSENCE_DETECTED, { userId, date: today });
    return { notified: true, reason: 'outside-geofence' };
  }
  return { notified: false, reason: 'inside-geofence' };
}

export const attendanceService = {
  logAttendance,
  getMonthStats,
  getVacationBalance,
  checkAbsence,
};
