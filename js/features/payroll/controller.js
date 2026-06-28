import { salaryService } from '../../application/salaryService.js';
import { renderPayrollSummary, renderDayEditor, renderAllowancesEditor } from './view.js';
import { eventBus } from '../../shared/eventBus.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { i18n } from '../../infrastructure/i18n/index.js';

let unsubPayroll;

export function mount(rootEl) {
  const summaryContainer = document.getElementById('payroll-summary-container');
  const editorContainer = document.getElementById('payroll-day-editor');
  const allowancesContainer = document.getElementById('payroll-allowances-editor');

  if (!summaryContainer || !editorContainer || !allowancesContainer) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  function refresh() {
    salaryService.calculatePayroll(year, month).then((data) => {
      renderPayrollSummary(summaryContainer, data);
    });
    salaryService.getMonthDaysData(year, month).then((daysData) => {
      const labels = {
        headers: {
          date: i18n.t('dateLabel', 'Date'),
          status: i18n.t('dayStatus', 'Status'),
          late: i18n.t('lateMinutes', 'Late (min)'),
          ot: i18n.t('overtimeHours', 'OT (hrs)'),
          note: i18n.t('note', 'Note')
        },
        statuses: {
          present: i18n.t('statusPresent', 'Present'),
          absent: i18n.t('statusAbsent', 'Absent'),
          late: i18n.t('statusLate', 'Late'),
          vacation: i18n.t('statusVacation', 'Vacation'),
          sick: i18n.t('statusSick', 'Sick')
        }
      };

      renderDayEditor(editorContainer, daysData, labels, async (date, updates) => {
        await salaryService.updateDayStatus(date, updates.status || 'present', {
          lateMinutes: updates.lateMinutes || 0,
          overtimeHours: updates.overtimeHours || 0,
          note: updates.note || '',
        });
      });
    });
  }

  refresh();

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const allowances = salaryService.getMonthlyAllowances(yearMonth) || [];
  renderAllowancesEditor(allowancesContainer, allowances, (newAllowances) => {
    salaryService.setMonthlyAllowances(yearMonth, newAllowances);
    salaryService.calculatePayroll(year, month).then((data) => {
      renderPayrollSummary(summaryContainer, data);
    });
  });

  unsubPayroll = eventBus.subscribe(EVENT_TOPICS.PAYROLL_UPDATED, refresh);
}

export function unmount() {
  if (unsubPayroll) unsubPayroll();
}