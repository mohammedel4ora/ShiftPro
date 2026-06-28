import { clockService } from '../../application/clockService.js';
import { settingsService } from '../../application/settingsService.js';
import { i18n } from '../../infrastructure/i18n/index.js';
import { shifts } from '../../core/shifts.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { eventBus } from '../../shared/eventBus.js';

function renderStatusCard() {
  const isActive = clockService.isActive();
  const t = settingsService.loadThresholds();
  const shift = shifts.getCurrentShift(new Date(), t, i18n.getShiftLabels());

  const title = document.querySelector('.card--status .card__title');
  const badge = document.querySelector('.card--status .card__badge');
  const indicator = document.querySelector('.card__status-indicator');

  if (title) {
    title.textContent = isActive
      ? i18n.t('insideWorkArea', 'Inside Work Area')
      : i18n.t('outsideWorkArea', 'Outside Work Area');
  }
  if (badge) {
    badge.textContent = shift.label;
    badge.className = `card__badge ${shift.badgeClass}`;
  }
  if (indicator) {
    indicator.className = `card__status-indicator ${isActive ? 'card__status-indicator--active' : ''}`;
  }
}

export function mount() {
  renderStatusCard();

  eventBus.subscribe(EVENT_TOPICS.CLOCK_STARTED, renderStatusCard);
  eventBus.subscribe(EVENT_TOPICS.CLOCK_STOPPED, renderStatusCard);
  eventBus.subscribe(EVENT_TOPICS.SHIFT_CHANGED, renderStatusCard);
  eventBus.subscribe(EVENT_TOPICS.LOCALE_CHANGED, renderStatusCard);
  eventBus.subscribe(EVENT_TOPICS.SETTINGS_SAVED, ({ kind }) => {
    if (kind === 'thresholds') renderStatusCard();
  });
  eventBus.subscribe(EVENT_TOPICS.GEO_CHANGED, ({ inside }) => {
    const title = document.querySelector('.card--status .card__title');
    if (title) {
      title.textContent = inside
        ? i18n.t('insideWorkArea', 'Inside Work Area')
        : i18n.t('outsideWorkArea', 'Outside Work Area');
    }
  });
}

export function unmount() {}
