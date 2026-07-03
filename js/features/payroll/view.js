/**
 * Payroll View
 * Renders the payroll UI components
 */

import { i18n } from '../../infrastructure/i18n/index.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function renderPayrollSummary(container, data) {
  if (!container) return;

  const html = `
    <div class="payroll-summary">
      <div class="payroll-summary__item payroll-summary__item--net">
        <span class="payroll-summary__label">Net Salary</span>
        <span class="payroll-summary__value">${escapeHtml(data.netSalary.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item">
        <span class="payroll-summary__label">Base Salary</span>
        <span class="payroll-summary__value">${escapeHtml(data.baseSalary.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item">
        <span class="payroll-summary__label">Daily Wage</span>
        <span class="payroll-summary__value">${escapeHtml(data.dailyWage.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item">
        <span class="payroll-summary__label">Present Days</span>
        <span class="payroll-summary__value">${escapeHtml(data.presentDays.toString())}</span>
      </div>
      <div class="payroll-summary__item">
        <span class="payroll-summary__label">Gross Salary</span>
        <span class="payroll-summary__value">${escapeHtml(data.grossSalary.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item payroll-summary__item--negative">
        <span class="payroll-summary__label">Late Penalty</span>
        <span class="payroll-summary__value">${escapeHtml(data.latePenalty.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item">
        <span class="payroll-summary__label">Overtime</span>
        <span class="payroll-summary__value">${escapeHtml(data.overtime.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item">
        <span class="payroll-summary__label">Total Allowances</span>
        <span class="payroll-summary__value">${escapeHtml(data.totalAllowances.toFixed(2))}</span>
      </div>
      <div class="payroll-summary__item payroll-summary__item--negative">
        <span class="payroll-summary__label">Total Deductions</span>
        <span class="payroll-summary__value">${escapeHtml(data.totalDeductions.toFixed(2))}</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

export function renderDayEditor(container, daysData, labels, onStatusChange) {
  if (!container) return;

  let html = '<div class="day-editor">';
  html += '<div class="day-editor__header">';
  html += `<span>${escapeHtml(labels.headers.date)}</span>
           <span>${escapeHtml(labels.headers.day)}</span>
           <span>${escapeHtml(labels.headers.status)}</span>
           <span>${escapeHtml(labels.headers.late)}</span>
           <span>${escapeHtml(labels.headers.ot)}</span>
           <span>${escapeHtml(labels.headers.note)}</span>`;
  html += '</div>';

  for (const day of daysData) {
    const dateObj = new Date(day.date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const dayName = dateObj.toLocaleDateString(i18n.getLocale(), { weekday: 'short' });
    const selectedStatus = day.status || 'present';
    const isFriday = dayOfWeek === 5;
    html += `<div class="day-editor__row${isFriday ? ' day-editor__row--friday' : ''}">
      <span class="day-editor__date">${escapeHtml(day.date)}</span>
      <span class="day-editor__day-name">${escapeHtml(dayName)}</span>
      <div class="day-editor__status-group" data-date="${escapeHtml(day.date)}">
        <button type="button" class="status-btn ${selectedStatus === 'present' ? 'status-btn--active' : ''}" data-value="present">${escapeHtml(labels.statuses.present)}</button>
        <button type="button" class="status-btn ${selectedStatus === 'absent' ? 'status-btn--active' : ''}" data-value="absent">${escapeHtml(labels.statuses.absent)}</button>
        <button type="button" class="status-btn ${selectedStatus === 'late' ? 'status-btn--active' : ''}" data-value="late">${escapeHtml(labels.statuses.late)}</button>
        <button type="button" class="status-btn ${selectedStatus === 'vacation' ? 'status-btn--active' : ''}" data-value="vacation">${escapeHtml(labels.statuses.vacation)}</button>
        <button type="button" class="status-btn ${selectedStatus === 'sick' ? 'status-btn--active' : ''}" data-value="sick">${escapeHtml(labels.statuses.sick)}</button>
      </div>
      <input type="number" class="day-editor__late" data-date="${escapeHtml(day.date)}" value="${day.lateMinutes || 0}" min="0" max="480">
      <input type="number" class="day-editor__ot" data-date="${escapeHtml(day.date)}" value="${day.overtimeHours || 0}" min="0" max="24" step="any">
      <input type="text" class="day-editor__note" data-date="${escapeHtml(day.date)}" value="${escapeHtml(day.note || '')}">
    </div>`;
  }

  html += '</div>';
  container.innerHTML = html;

  function getDayData(date) {
    const activeBtn = container.querySelector(`.day-editor__status-group[data-date="${date}"] .status-btn--active`);
    const late = container.querySelector(`.day-editor__late[data-date="${date}"]`);
    const ot = container.querySelector(`.day-editor__ot[data-date="${date}"]`);
    const note = container.querySelector(`.day-editor__note[data-date="${date}"]`);
    return {
      status: activeBtn ? activeBtn.dataset.value : 'present',
      lateMinutes: late ? parseInt(late.value, 10) || 0 : 0,
      overtimeHours: ot ? parseFloat(ot.value) || 0 : 0,
      note: note ? note.value : '',
    };
  }

  // Attach change listeners for input fields using event delegation
  container.addEventListener('change', (e) => {
    const el = e.target;
    if (el.classList.contains('status-btn')) return; // handled by click listener
    const date = el.dataset.date;
    if (!date) return;
    const data = getDayData(date);
    onStatusChange(date, data);
  });

  // Attach click listeners for status buttons using event delegation
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.status-btn');
    if (!btn) return;

    const group = btn.closest('.day-editor__status-group');
    if (!group) return;

    const date = group.dataset.date;
    if (!date) return;

    // Toggle active state in the DOM
    group.querySelectorAll('.status-btn').forEach(b => b.classList.remove('status-btn--active'));
    btn.classList.add('status-btn--active');

    // Trigger update
    const data = getDayData(date);
    onStatusChange(date, data);
  });
}

export function renderAllowancesEditor(container, allowances, onChange) {
  if (!container) return;

  let html = '<div class="allowances-editor">';
  html += '<h3>Monthly Allowances</h3>';

  for (const allowance of allowances || []) {
    html += `<div class="allowance-row">
      <input type="text" class="allowance-name" value="${escapeHtml(allowance.name)}" placeholder="Allowance name">
      <input type="number" class="allowance-amount" value="${allowance.amount}" placeholder="Amount">
      <button class="allowance-remove">\u2013</button>
    </div>`;
  }

  html += '<button class="allowance-add">+ Add Allowance</button>';
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.allowance-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('.allowance-row');
      if (row) {
        row.remove();
        onChange(collectAllowances(container));
      }
    });
  });

  container.querySelector('.allowance-add').addEventListener('click', () => {
    const newRow = document.createElement('div');
    newRow.className = 'allowance-row';
    newRow.innerHTML = `<input type="text" class="allowance-name" placeholder="Allowance name"><input type="number" class="allowance-amount" placeholder="Amount"><button class="allowance-remove">\u2013</button>`;
    const editorDiv = container.querySelector('.allowances-editor');
    editorDiv.insertBefore(newRow, container.querySelector('.allowance-add'));

    newRow.querySelector('.allowance-remove').addEventListener('click', () => {
      newRow.remove();
      onChange(collectAllowances(container));
    });

    newRow.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => onChange(collectAllowances(container)));
    });
  });
}

function collectAllowances(container) {
  const rows = container.querySelectorAll('.allowance-row');
  return Array.from(rows)
    .map((row) => ({
      id: row.dataset.id || crypto.randomUUID(),
      name: row.querySelector('.allowance-name')?.value?.trim() || '',
      amount: parseFloat(row.querySelector('.allowance-amount')?.value) || 0,
    }))
    .filter((a) => a.name && a.amount > 0);
}

export function renderVacationBalance(container, config, usedDays) {
  if (!container) return;
  const total = config.annual + config.casual;
  const remaining = Math.max(0, total - usedDays);
  container.innerHTML = `
    <div class="vacation-balance__grid">
      <div class="vacation-balance__item">
        <span class="vacation-balance__label">${escapeHtml(i18n.t('vacationType', 'Type'))}</span>
        <span class="vacation-balance__value">${escapeHtml(i18n.t('annualLeave', 'Annual'))} + ${escapeHtml(i18n.t('casualLeave', 'Casual'))}</span>
      </div>
      <div class="vacation-balance__item">
        <span class="vacation-balance__label">${escapeHtml(i18n.t('vacationTotal', 'Total'))}</span>
        <span class="vacation-balance__value">${total}</span>
      </div>
      <div class="vacation-balance__item">
        <span class="vacation-balance__label">${escapeHtml(i18n.t('vacationUsed', 'Used'))}</span>
        <span class="vacation-balance__value">${usedDays}</span>
      </div>
      <div class="vacation-balance__item vacation-balance__item--remaining">
        <span class="vacation-balance__label">${escapeHtml(i18n.t('vacationRemaining', 'Remaining'))}</span>
        <span class="vacation-balance__value">${remaining}</span>
      </div>
    </div>
  `;
}
