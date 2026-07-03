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

async function getMonthDaysData(year, month) {
  const startMonth = month === 1 ? 12 : month - 1;
  const startYear = month === 1 ? year - 1 : year;

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-26`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-25`;

  const events = await eventStore.getEvents({ dateFrom: startDate, dateTo: endDate });

  // Group events by date
  const eventsByDate = new Map();
  for (const e of events) {
    const date = e.date;
    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, []);
    }
    eventsByDate.get(date).push(e);
  }

  // Build array for each day in the payroll period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysData = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayStr = d.toISOString().slice(0, 10);
    const dayEvents = eventsByDate.get(dayStr) || [];
    const status = salaryEngine.deriveDayStatus(dayEvents);
    daysData.push({
      date: dayStr,
      ...status,
    });
  }
  return daysData;
}

async function calculatePayroll(year, month, existingDaysData) {
  const daysData = existingDaysData || await getMonthDaysData(year, month);
  const baseSalary = salaryStore.getBaseSalary().baseSalary;
  const deductions = salaryStore.getDeductions();
  const allowances = salaryStore.getMonthlyAllowances(`${year}-${String(month).padStart(2, '0')}`);
  
  const result = salaryEngine.calculateNetSalary({
    baseSalary,
    daysData,
    allowances,
    deductions,
  });

  const vacationConfig = salaryStore.getVacationConfig();
  const usedDays = await getUsedVacationDays();
  const totalVacation = vacationConfig.annual + vacationConfig.casual;
  result.vacationTotal = totalVacation;
  result.vacationUsed = usedDays;
  result.vacationRemaining = Math.max(0, totalVacation - usedDays);

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

async function getUsedVacationDays() {
  const events = await eventStore.getEvents({ type: 'vacation' });
  const uniqueDates = new Set(events.map(e => e.date).filter(Boolean));
  return uniqueDates.size;
}

export const salaryService = {
  getMonthDaysData,
  calculatePayroll,
  updateDayStatus,
  getMonthStats,
  getUsedVacationDays,
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
  // Vacation config
  getVacationConfig: salaryStore.getVacationConfig,
  setVacationConfig: salaryStore.setVacationConfig,
};
