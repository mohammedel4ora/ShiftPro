import { clockService } from '../../application/clockService.js';
import { i18n } from '../../infrastructure/i18n/index.js';
import { shifts } from '../../core/shifts.js';
import { settingsService } from '../../application/settingsService.js';
import { time } from '../../core/time.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { eventBus } from '../../shared/eventBus.js';

let timerInterval = null;

function startTimer(callback) {
  stopTimer();
  timerInterval = setInterval(callback, 1000);
  callback();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateMeta(state) {
  const items = document.querySelectorAll('.timer__meta-item');
  if (!items.length || !state.clockInAt) return;
  items[0].innerHTML =
    `<svg class="timer__meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Clock In: <strong>${time.formatTime(state.clockInAt)}</strong>`;
}

function updateUI() {
  const btn = document.getElementById('clockBtn');
  const display = document.getElementById('timerDisplay');
  if (!btn || !display) return;

  const isActive = clockService.isActive();
  const state = clockService.getState();

  btn.innerHTML = isActive
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${i18n.t('clockOut', 'Clock Out')}`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${i18n.t('clockInBtn', 'Clock In')}`;

  btn.className = `card__action-btn ${isActive ? 'card__action-btn--danger' : 'card__action-btn--primary'}`;

  if (isActive && state.clockInAt) {
    startTimer(() => {
      const elapsed = Math.floor((Date.now() - state.clockInAt.getTime()) / 1000);
      display.textContent = time.formatDurationSec(elapsed);
    });
    updateMeta(state);
  } else {
    stopTimer();
    display.textContent = '00:00:00';
  }
}

export function mount() {
  const btn = document.getElementById('clockBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const userId = 'local';
    if (clockService.isActive()) {
      await clockService.stop({ userId });
    } else {
      await clockService.start({ userId });
    }
    updateUI();
  });

  eventBus.subscribe(EVENT_TOPICS.CLOCK_STARTED, updateUI);
  eventBus.subscribe(EVENT_TOPICS.CLOCK_STOPPED, updateUI);
  eventBus.subscribe(EVENT_TOPICS.LOCALE_CHANGED, updateUI);
  eventBus.subscribe(EVENT_TOPICS.SETTINGS_SAVED, ({ kind }) => {
    if (kind === 'thresholds') updateUI();
  });

  updateUI();
}

export function unmount() {
  stopTimer();
}
