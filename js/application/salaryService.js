/**
 * Salary Service
 * ---------------
 * Orchestrates salary calculations with event store data.
 * Bridges core/salaryEngine with infrastructure/salaryStore.
 */

import { salaryStore } from '../infrastructure/storage/salaryStore.js';
import * as salaryEngine from '../core/salaryEngine.js';
import { eventStore } from '../infrastructure/storage/eventStore.js';
import { time } from '../core/time.js';
import { eventBus } from '../shared/eventBus.js';
import { EVENT_TOPICS } from '../shared/config.js';

async function getMonthDaysData(year, month) {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const events = await eventStore.getEvents({ month: yearMonth });
  
  // Group events by date
  const eventsByDate = new Map();
  for (const e of events) {
    const date = e.date;
    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, []);
    }
    eventsByDate.get(date).push(e);
  }

  // Build array for each day of the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate.get(dayStr) || [];
    const status = salaryEngine.deriveDayStatus(dayEvents);
    daysData.push({
      date: dayStr,
      ...status,
    });
  }
  return daysData;
}

async function calculatePayroll(year, month) {
  const daysData = await getMonthDaysData(year, month);
  const baseSalary = salaryStore.getBaseSalary().baseSalary;
  const deductions = salaryStore.getDeductions();
  const allowances = salaryStore.getMonthlyAllowances(`${year}-${String(month).padStart(2, '0')}`);
  
  const result = salaryEngine.calculateNetSalary({
    baseSalary,
    daysData,
    allowances,
    deductions,
  });

  return result;
}

async function updateDayStatus(date, status, { lateMinutes = 0, overtimeHours = 0, note = '' } = {}) {
  const event = {
    userId: 'local',
    type: status, // present, absent, late, vacation, sick
    date,
    time: time.formatTime(new Date()),
    lateMinutes: lateMinutes,
    overtimeHours: overtimeHours,
    note,
    timestamp: new Date().toISOString(),
  };
  await eventStore.addEvent(event);
  eventBus.publish(EVENT_TOPICS.PAYROLL_UPDATED, { date, status });
  return event;
}

async function getMonthStats(year, month) {
  const daysData = await getMonthDaysData(year, month);
  const present = daysData.filter(d => d.status === 'present').length;
  const absent = daysData.filter(d => d.status === 'absent').length;
  const late = daysData.filter(d => d.status === 'late').length;
  const vacation = daysData.filter(d => d.status === 'vacation').length;
  const sick = daysData.filter(d => d.status === 'sick').length;
  
  return { present, absent, late, vacation, sick, total: daysData.length, daysData };
}

export const salaryService = {
  getMonthDaysData,
  calculatePayroll,
  updateDayStatus,
  getMonthStats,
  // Expose store methods for settings
  getBaseSalary: salaryStore.getBaseSalary,
  setBaseSalary: salaryStore.setBaseSalary,
  getDeductions: salaryStore.getDeductions,
  setDeductions: salaryStore.setDeductions,
  addDeduction: salaryStore.addDeduction,
  removeDeduction: salaryStore.removeDeduction,
  getMonthlyAllowances: salaryStore.getMonthlyAllowances,
  setMonthlyAllowances: salaryStore.setMonthlyAllowances,
  addMonthlyAllowance: salaryStore.addMonthlyAllowance,
  removeMonthlyAllowance: salaryStore.removeMonthlyAllowance,
};
