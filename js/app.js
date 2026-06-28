import { PERIODIC_CHECK } from './shared/config.js';
import { router } from './shared/router.js';
import { notifier } from './infrastructure/notifications/notifier.js';

import { mount as mountNav } from './features/navigation/index.js';
import { mount as mountTheme } from './features/theme/index.js';
import { mount as mountLocale } from './features/locale/index.js';
import { mount as mountClock } from './features/clock/index.js';
import { mount as mountQuickLog } from './features/quickLog/index.js';
import { mount as mountDashboard, unmount as unmountDashboard } from './features/dashboard/index.js';
import { mount as mountSettings, unmount as unmountSettings } from './features/settings/index.js';
import { mount as mountLogs, unmount as unmountLogs } from './features/logs/index.js';
import { mount as mountPayroll, unmount as unmountPayroll } from './features/payroll/index.js';

import { clockService } from './application/clockService.js';
import { settingsService } from './application/settingsService.js';
import { attendanceService } from './application/attendanceService.js';

mountTheme();
mountLocale();
mountNav();
mountClock();
mountQuickLog();

router.register('dashboard', mountDashboard, unmountDashboard);
router.register('settings', mountSettings, unmountSettings);
router.register('payroll', mountPayroll, unmountPayroll);
router.register('logs', mountLogs, unmountLogs);
router.start('dashboard');

notifier.requestPermission();

function runPeriodic() {
  const prefs = settingsService.loadPrefs();
  clockService.periodicStatusCheck({ userId: 'local', prefs });
  if (clockService.isActive()) {
    attendanceService.checkAbsence({ userId: 'local' });
  }
}

setInterval(runPeriodic, PERIODIC_CHECK.INTERVAL_MS);
setTimeout(runPeriodic, PERIODIC_CHECK.INITIAL_DELAY_MS);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
