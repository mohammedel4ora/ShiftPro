/**
 * Salary / Payroll localStorage facade
 * --------------------------------------
 * Stores base salary, fixed deductions, and monthly allowances.
 * Only depends on `localStore` (no DOM).
 */

import { localStore } from './localStore.js';
import { STORAGE_KEYS, DEFAULT_VACATION_CONFIG } from '../../shared/config.js';

// ─── Defaults ───────────────────────────────────────────────
const DEFAULTS = Object.freeze({
  BASE_SALARY: 0,
  DEDUCTIONS: [],
});

function nowYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Base Salary ───────────────────────────────────────
function getBaseSalary() {
  const raw = localStore.get(STORAGE_KEYS.SALARY);
  if (raw && typeof raw === 'object' && 'baseSalary' in raw) {
    return { baseSalary: Number(raw.baseSalary) || 0 };
  }
  return { baseSalary: DEFAULTS.BASE_SALARY };
}

function setBaseSalary(amount) {
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  localStore.set(STORAGE_KEYS.SALARY, { baseSalary: Math.max(0, n) });
}

// ─── Fixed Deductions ─────────────────────────────────────
function getDeductions() {
  const raw = localStore.get(STORAGE_KEYS.DEDUCTIONS);
  return Array.isArray(raw) ? raw.map(sanitizeDeduction) : [...DEFAULTS.DEDUCTIONS];
}

function setDeductions(list) {
  const sanitized = Array.isArray(list) ? list.map(sanitizeDeduction) : [];
  localStore.set(STORAGE_KEYS.DEDUCTIONS, sanitized);
}

function addDeduction({ name, amount }) {
  const existing = getDeductions();
  existing.push(sanitizeDeduction({ name, amount }));
  setDeductions(existing);
}

function removeDeduction(id) {
  setDeductions(getDeductions().filter((d) => d.id !== id));
}

function sanitizeDeduction(item) {
  return {
    id: String(item.id || crypto.randomUUID?.() || Math.random().toString(36).slice(2)),
    name: String(item.name || '').trim(),
    amount: Number.isFinite(Number(item.amount)) ? Math.max(0, Number(item.amount)) : 0,
  };
}

// ─── Monthly Allowances ───────────────────────────────────
function getMonthlyAllowances(yearMonth) {
  const key = yearMonth || nowYYYYMM();
  const raw = localStore.get(STORAGE_KEYS.PAYROLL_MONTHLY);
  if (raw && typeof raw === 'object' && raw[key]) {
    const entry = raw[key];
    return Array.isArray(entry.allowances) ? entry.allowances.map(sanitizeAllowance) : [];
  }
  return [];
}

function setMonthlyAllowances(yearMonth, allowances) {
  const key = yearMonth || nowYYYYMM();
  const raw = localStore.get(STORAGE_KEYS.PAYROLL_MONTHLY) || {};
  raw[key] = { allowances: Array.isArray(allowances) ? allowances.map(sanitizeAllowance) : [] };
  localStore.set(STORAGE_KEYS.PAYROLL_MONTHLY, raw);
}

function addMonthlyAllowance(yearMonth, { name, amount }) {
  const existing = getMonthlyAllowances(yearMonth);
  existing.push(sanitizeAllowance({ name, amount }));
  setMonthlyAllowances(yearMonth, existing);
}

function removeMonthlyAllowance(yearMonth, id) {
  setMonthlyAllowances(yearMonth, getMonthlyAllowances(yearMonth).filter((a) => a.id !== id));
}

function sanitizeAllowance(item) {
  return {
    id: String(item.id || crypto.randomUUID?.() || Math.random().toString(36).slice(2)),
    name: String(item.name || '').trim(),
    amount: Number.isFinite(Number(item.amount)) ? Math.max(0, Number(item.amount)) : 0,
  };
}

// ─── Vacation Config ─────────────────────────────────
function getVacationConfig() {
  const raw = localStore.get(STORAGE_KEYS.VACATION_CONFIG);
  if (raw && typeof raw === 'object') {
    return {
      annual: Number.isFinite(raw.annual) ? Math.max(0, raw.annual) : DEFAULT_VACATION_CONFIG.annual,
      casual: Number.isFinite(raw.casual) ? Math.max(0, raw.casual) : DEFAULT_VACATION_CONFIG.casual,
    };
  }
  return { ...DEFAULT_VACATION_CONFIG };
}

function setVacationConfig(config) {
  localStore.set(STORAGE_KEYS.VACATION_CONFIG, {
    annual: Number.isFinite(config?.annual) ? Math.max(0, config.annual) : DEFAULT_VACATION_CONFIG.annual,
    casual: Number.isFinite(config?.casual) ? Math.max(0, config.casual) : DEFAULT_VACATION_CONFIG.casual,
  });
}

// ─── Export ─────────────────────────────────────────────────
export const salaryStore = {
  // Base salary
  getBaseSalary,
  setBaseSalary,
  // Deductions
  getDeductions,
  setDeductions,
  addDeduction,
  removeDeduction,
  // Monthly allowances
  getMonthlyAllowances,
  setMonthlyAllowances,
  addMonthlyAllowance,
  removeMonthlyAllowance,
  // Vacation config
  getVacationConfig,
  setVacationConfig,
};
