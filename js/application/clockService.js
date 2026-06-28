import { STORAGE_KEYS, EVENT_TOPICS } from '../shared/config.js';
import { localStore } from '../infrastructure/storage/localStore.js';
import { eventStore } from '../infrastructure/storage/eventStore.js';
import { notifier } from '../infrastructure/notifications/notifier.js';
import { browserGeo } from '../infrastructure/geolocation/browserGeo.js';
import { i18n } from '../infrastructure/i18n/index.js';
import { clock } from '../core/clock.js';
import { shifts } from '../core/shifts.js';
import { geofence } from '../core/geofence.js';
import { time } from '../core/time.js';
import { eventBus } from '../shared/eventBus.js';
import { settingsService } from './settingsService.js';

function shiftForNow() {
  const t = settingsService.loadThresholds();
  return shifts.getCurrentShift(new Date(), t, i18n.getShiftLabels());
}

function deriveShiftIdFromClockIn(clockInAt) {
  const t = settingsService.loadThresholds();
  const computed = shifts.getCurrentShift(clockInAt, t, i18n.getShiftLabels());
  return computed.id === 'off' ? null : computed.id;
}

function loadState() {
  const clocked = localStore.get(STORAGE_KEYS.CLOCKED);
  const isClocked = clocked === 'true' || clocked === true;
  const clockInIso = localStore.get(STORAGE_KEYS.CLOCK_IN);
  if (!isClocked || !clockInIso) {
    return clock.initial();
  }
  const clockInAt = new Date(clockInIso);
  if (Number.isNaN(clockInAt.getTime())) return clock.initial();
  return {
    status: clock.STATUS.CLOCKED_IN,
    clockInAt,
    date: clockInAt.toISOString().slice(0, 10),
    shift: deriveShiftIdFromClockIn(clockInAt),
  };
}

function saveState(state) {
  if (clock.isActive(state)) {
    localStore.set(STORAGE_KEYS.CLOCKED, 'true');
    localStore.set(STORAGE_KEYS.CLOCK_IN, state.clockInAt.toISOString());
  } else {
    localStore.remove(STORAGE_KEYS.CLOCKED);
    localStore.remove(STORAGE_KEYS.CLOCK_IN);
  }
}

async function start({ userId }) {
  const state = loadState();
  if (clock.isActive(state)) {
    return { state, event: null, alreadyClocked: true };
  }
  const currentShift = shiftForNow();
  const newState = clock.start(state, {
    clockInAt: new Date(),
    shift: currentShift.id === 'off' ? null : currentShift.id,
  });
  const event = {
    userId,
    type: 'clock-in',
    date: newState.date,
    time: time.formatTime(newState.clockInAt),
    shift: newState.shift,
    timestamp: newState.clockInAt.toISOString(),
  };
  await eventStore.addEvent(event);
  saveState(newState);
  eventBus.publish(EVENT_TOPICS.CLOCK_STARTED, {
    userId,
    shift: newState.shift,
    timestamp: event.timestamp,
  });
  return { state: newState, event, alreadyClocked: false };
}

async function stop({ userId }) {
  const state = loadState();
  if (!clock.isActive(state)) {
    return { state, event: null, alreadyClocked: false };
  }
  const result = clock.stop(state);
  const event = {
    userId,
    type: 'clock-out',
    date: result.clockInAt.toISOString().slice(0, 10),
    clockInTime: time.formatTime(result.clockInAt),
    time: time.formatTime(result.stoppedAt),   // clock-OUT time (was wrongly using clockInAt)
    shift: state.shift,
    durationMinutes: result.durationMinutes,
    timestamp: result.stoppedAt.toISOString(),
  };
  await eventStore.addEvent(event);
  saveState(result.state);
  eventBus.publish(EVENT_TOPICS.CLOCK_STOPPED, {
    userId,
    durationMinutes: result.durationMinutes,
    timestamp: event.timestamp,
  });
  return { state: result.state, event, alreadyClocked: true };
}

async function periodicStatusCheck({ userId, prefs }) {
  const currentShift = shiftForNow();
  const state = loadState();

  if (clock.isActive(state) && currentShift.id !== 'off' && state.shift && state.shift !== currentShift.id) {
    notifier.notify({
      title: 'Shift Started',
      body: `Your ${currentShift.label} has started.`,
      tag: 'shift-start',
    });
  }
  eventBus.publish(EVENT_TOPICS.SHIFT_CHANGED, { shift: currentShift });

  if (prefs && prefs.autoLocate) {
    const cfg = settingsService.loadGeo();
    try {
      const pos = await browserGeo.getCurrentPosition();
      const distance = geofence.haversine(pos.lat, pos.lng, cfg.lat, cfg.lng);
      const inside = distance <= cfg.radius;
      eventBus.publish(EVENT_TOPICS.GEO_CHANGED, { inside, distance, position: pos });
      if (!inside && clock.isActive(state)) {
        notifier.notify({
          title: 'Out of Work Area',
          body: 'You have left the geofence while clocked in.',
          tag: 'geo-out',
        });
        if (prefs.vibrate) notifier.vibrate([200, 100, 200]);
      }
    } catch (err) {
      eventBus.publish(EVENT_TOPICS.GEO_CHANGED, {
        inside: false,
        distance: null,
        error: err.message,
      });
    }
  }
}

function isActive() {
  return clock.isActive(loadState());
}

function getState() {
  return loadState();
}

export const clockService = {
  start,
  stop,
  isActive,
  getState,
  periodicStatusCheck,
};
