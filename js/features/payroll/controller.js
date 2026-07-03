import { salaryService } from '../../application/salaryService.js';
import { renderPayrollSummary, renderDayEditor, renderAllowancesEditor, renderVacationBalance } from './view.js';
import { eventBus } from '../../shared/eventBus.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { i18n } from '../../infrastructure/i18n/index.js';

let unsubPayroll;
let currentYear, currentMonth;

function updateMonthTitle() {
  const el = document.getElementById('payrollMonthTitle');
  if (!el) return;
  const date = new Date(currentYear, currentMonth - 1);
  const label = date.toLocaleDateString(i18n.getLocale() === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' });
  el.textContent = label;
}

export function mount(rootEl) {
  const summaryContainer = document.getElementById('payroll-summary-container');
  const editorContainer = document.getElementById('payroll-day-editor');
  const allowancesContainer = document.getElementById('payroll-allowances-editor');
  const balanceContainer = document.getElementById('vacation-balance-display');

  if (!summaryContainer || !editorContainer || !allowancesContainer) return;

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1;

  const labels = {
    headers: {
      date: i18n.t('dateLabel', 'Date'),
      day: i18n.t('dayLabel', 'Day'),
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

  function refreshSummary() {
    return salaryService.getMonthDaysData(currentYear, currentMonth).then((daysData) => {
      return salaryService.calculatePayroll(currentYear, currentMonth, daysData);
    }).then((data) => {
      renderPayrollSummary(summaryContainer, data);
    });
  }

  function refreshBalance() {
    if (!balanceContainer) return;
    const config = salaryService.getVacationConfig();
    salaryService.getUsedVacationDays().then((used) => {
      renderVacationBalance(balanceContainer, config, used);
    });
  }

  function refresh() {
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    updateMonthTitle();
    salaryService.getMonthDaysData(currentYear, currentMonth).then((daysData) => {
      renderDayEditor(editorContainer, daysData, labels, async (date, updates) => {
        await salaryService.updateDayStatus(date, updates.status || 'present', {
          lateMinutes: updates.lateMinutes || 0,
          overtimeHours: updates.overtimeHours || 0,
          note: updates.note || '',
        });
        refreshSummary();
        refreshBalance();
      });
      return salaryService.calculatePayroll(currentYear, currentMonth, daysData);
    }).then((data) => {
      renderPayrollSummary(summaryContainer, data);
    });

    const allowances = salaryService.getMonthlyAllowances(yearMonth) || [];
    renderAllowancesEditor(allowancesContainer, allowances, (newAllowances) => {
      salaryService.setMonthlyAllowances(yearMonth, newAllowances);
      refreshSummary();
    });
    refreshBalance();
  }

  function goMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    refresh();
  }

  refresh();

  document.getElementById('payrollPrevMonth').addEventListener('click', () => goMonth(-1));
  document.getElementById('payrollNextMonth').addEventListener('click', () => goMonth(1));

  unsubPayroll = eventBus.subscribe(EVENT_TOPICS.PAYROLL_UPDATED, () => {
    refreshSummary();
    refreshBalance();
  });
}

export function unmount() {
  if (unsubPayroll) unsubPayroll();
}