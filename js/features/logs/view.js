import { time } from '../../core/time.js';

export function updateSummary(totalHours, daysWorked, vacationRemaining) {
  const hoursEl = document.querySelector('.card--summary .summary-item--highlight .summary-item__value');
  const daysEl = document.querySelectorAll('.card--summary .summary-item')[1]?.querySelector('.summary-item__value');
  const vacEl = document.querySelector('.card--summary .summary-item--accent .summary-item__value');
  if (hoursEl) hoursEl.textContent = totalHours;
  if (daysEl) daysEl.textContent = String(daysWorked);
  if (vacEl) vacEl.textContent = String(vacationRemaining);
}

function typeBadge(type) {
  return type === 'sick' ? 'S' : type === 'vacation' ? 'V' : type === 'overtime' ? 'O' : type === 'remote' ? 'R' : '\u2014';
}

export function renderLogRows(body, events, currentShift, badgeLetters, noRecordsText) {
  const rows = events.filter((e) => e.type !== 'clock-in').slice(0, 30);
  if (!rows.length) {
    body.innerHTML = `<div class="logs-table__row" style="justify-content:center;padding:16px;color:var(--on-surface-muted)">${noRecordsText}</div>`;
    return;
  }
  body.innerHTML = rows.map((e) => {
    if (e.type === 'clock-out') {
      const shiftId = e.shift || currentShift.id;
      const letter = badgeLetters[shiftId] || '\u2014';
      return `<div class="logs-table__row">
        <span class="logs-table__cell logs-table__cell--date">${e.date ? e.date.slice(5) : '\u2014'}</span>
        <span class="logs-table__cell logs-table__cell--shift"><span class="badge badge--${escapeHtml(shiftId)}">${letter}</span></span>
        <span class="logs-table__cell logs-table__cell--time">${e.clockInTime || '\u2014'}</span>
        <span class="logs-table__cell logs-table__cell--time">${e.time || '\u2014'}</span>
        <span class="logs-table__cell logs-table__cell--hours">${time.formatDuration(e.durationMinutes || 0)}</span>
      </div>`;
    }
    const letter = typeBadge(e.type);
    return `<div class="logs-table__row">
      <span class="logs-table__cell logs-table__cell--date">${e.date ? e.date.slice(5) : '\u2014'}</span>
      <span class="logs-table__cell logs-table__cell--shift"><span class="badge badge--${escapeHtml(e.type)}">${letter}</span></span>
      <span class="logs-table__cell logs-table__cell--time">${e.time || '\u2014'}</span>
      <span class="logs-table__cell logs-table__cell--time">\u2014</span>
      <span class="logs-table__cell logs-table__cell--hours">${escapeHtml(e.type)}</span>
    </div>`;
  }).join('');
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
