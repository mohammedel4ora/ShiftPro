import { attendanceService } from '../../application/attendanceService.js';
import { settingsService } from '../../application/settingsService.js';
import { i18n } from '../../infrastructure/i18n/index.js';
import { shifts } from '../../core/shifts.js';
import { time } from '../../core/time.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { eventBus } from '../../shared/eventBus.js';
import { updateSummary, renderLogRows } from './view.js';

async function render() {
  const yearMonth = time.currentMonthIso();
  const stats = await attendanceService.getMonthStats({ userId: 'local', yearMonth });
  const balance = await attendanceService.getVacationBalance({ userId: 'local' });

  updateSummary(
    time.formatDuration(stats.totalMinutes),
    stats.daysWorked,
    balance.remaining
  );

  const body = document.querySelector('.logs-table__body');
  if (!body) return;

  const currentShift = shifts.getCurrentShift(
    new Date(),
    settingsService.loadThresholds(),
    i18n.getShiftLabels()
  );
  const badgeLetters = i18n.getBadgeLetters();
  const noRecords = i18n.t('noRecords', 'No records this month');

  renderLogRows(body, stats.events, currentShift, badgeLetters, noRecords);
}

export function mount() {
  render();

  eventBus.subscribe(EVENT_TOPICS.LOCALE_CHANGED, render);
  eventBus.subscribe(EVENT_TOPICS.CLOCK_STOPPED, render);
  eventBus.subscribe(EVENT_TOPICS.ATTENDANCE_LOGGED, render);
  eventBus.subscribe(EVENT_TOPICS.SETTINGS_SAVED, ({ kind }) => {
    if (kind === 'thresholds') render();
  });
}

export function unmount() {}
