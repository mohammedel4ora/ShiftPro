import { STORAGE_KEYS, DEFAULT_LOCALE, SUPPORTED_LOCALES, EVENT_TOPICS } from '../../shared/config.js';
import { localStore } from '../storage/localStore.js';
import { eventBus } from '../../shared/eventBus.js';

const STRINGS = {
  en: {
    appTitle: 'ShiftPro',
    themeToggle: 'Toggle theme',
    notifications: 'Notifications',
    currentStatus: 'Current Status',
    insideWorkArea: 'Inside Work Area',
    outsideWorkArea: 'Outside Work Area',
    morningShift: 'Morning Shift',
    eveningShift: 'Evening Shift',
    nightShift: 'Night Shift',
    offDuty: 'Off Duty',
    todaysHours: "Today's Hours",
    hoursWorked: 'hours worked',
    clockIn: 'Clock In',
    break: 'Break',
    clockOut: 'Clock Out',
    clockInBtn: 'Clock In',
    quickLog: 'Quick Log',
    sickLeave: 'Sick Leave',
    vacation: 'Vacation',
    overtime: 'Overtime',
    remote: 'Remote',
    thisWeek: 'This Week',
    hours: 'Hours',
    shifts: 'Shifts',
    monthlyOverview: 'Monthly Overview',
    totalHours: 'Total Hours',
    daysWorked: 'Days Worked',
    vacationLeft: 'Vacation Left',
    dailyHistory: 'Daily History',
    noRecords: 'No records this month',
    thDate: 'Date',
    thShift: 'Shift',
    thIn: 'In',
    thOut: 'Out',
    thTotal: 'Total',
    badgeMorning: 'M',
    badgeEvening: 'E',
    badgeNight: 'N',
    workLocation: 'Work Location',
    latitude: 'Latitude',
    longitude: 'Longitude',
    geofenceRadius: 'Geofence Radius (meters)',
    detectLocation: 'Detect Current Location',
    saveLocation: 'Save Location',
    shiftThresholds: 'Shift Thresholds',
    shift1Start: 'Shift 1 (Morning) Start',
    shift1End: 'Shift 1 End',
    shift2Start: 'Shift 2 (Evening) Start',
    shift2End: 'Shift 2 End',
    shift3Start: 'Shift 3 (Night) Start',
    shift3End: 'Shift 3 End',
    saveThresholds: 'Save Thresholds',
    preferences: 'Preferences',
    autoDetectLocation: 'Auto-detect location',
    notifEnabled: 'Notifications',
    vibrateOnAction: 'Vibrate on clock in/out',
    navDashboard: 'Dashboard',
    navSettings: 'Settings',
    navPayroll: 'Payroll',
    navLogs: 'Logs',
    localeToggle: 'Toggle language',
    ariaPayroll: 'Payroll',
    financialSettings: 'Financial Settings',
    baseSalary: 'Base Salary',
    saveSalary: 'Save Salary',
    deductions: 'Deductions',
    addDeduction: 'Add Deduction',
    saveDeductions: 'Save Deductions',
    payrollSummary: 'Payroll Summary',
    netSalary: 'Net Salary',
    presentDays: 'Present Days',
    grossSalary: 'Gross Salary',
    latePenalty: 'Late Penalty',
    dailyWage: 'Daily Wage',
    monthlyAllowances: 'Monthly Allowances',
    allowanceName: 'Name',
    allowanceAmount: 'Amount',
    dateLabel: 'Date',
    dayLabel: 'Day',
    dayStatus: 'Status',
    lateMinutes: 'Late (min)',
    overtimeHours: 'OT (hrs)',
    note: 'Note',
    statusPresent: 'Present',
    statusAbsent: 'Absent',
    statusLate: 'Late',
    statusVacation: 'Vacation',
    statusSick: 'Sick',
    ariaDashboard: 'Dashboard',
    ariaSettings: 'Settings',
    ariaLogs: 'Logs',
    mainNav: 'Main navigation',
    vacationSettings: 'Vacation Settings',
    vacationAnnual: 'Annual (Regular)',
    vacationCasual: 'Casual (Emergency)',
    saveVacation: 'Save Vacation',
    vacationBalance: 'Vacation Balance',
    vacationType: 'Type',
    vacationTotal: 'Total',
    vacationUsed: 'Used',
    vacationRemaining: 'Remaining',
    annualLeave: 'Annual',
    casualLeave: 'Casual'
  },
  ar: {
    appTitle: 'ShiftPro',
    themeToggle: 'تبديل المظهر',
    notifications: 'الإشعارات',
    currentStatus: 'الحالة الحالية',
    insideWorkArea: 'داخل منطقة العمل',
    outsideWorkArea: 'خارج منطقة العمل',
    morningShift: 'وردية صباحية',
    eveningShift: 'وردية مسائية',
    nightShift: 'وردية ليلية',
    offDuty: 'خارج الخدمة',
    todaysHours: 'ساعات اليوم',
    hoursWorked: 'ساعات العمل',
    clockIn: 'بدء الدوام',
    break: 'استراحة',
    clockOut: 'انتهاء الدوام',
    clockInBtn: 'بدء الدوام',
    quickLog: 'تسجيل سريع',
    sickLeave: 'إجازة مرضية',
    vacation: 'إجازة',
    overtime: 'ساعات إضافية',
    remote: 'عن بُعد',
    thisWeek: 'هذا الأسبوع',
    hours: 'الساعات',
    shifts: 'الورديات',
    monthlyOverview: 'النظرة الشهرية',
    totalHours: 'إجمالي الساعات',
    daysWorked: 'أيام العمل',
    vacationLeft: 'رصيد الإجازات',
    dailyHistory: 'السجل اليومي',
    noRecords: 'لا توجد سجلات لهذا الشهر',
    thDate: 'التاريخ',
    thShift: 'الوردية',
    thIn: 'حضور',
    thOut: 'انصراف',
    thTotal: 'المجموع',
    badgeMorning: 'ص',
    badgeEvening: 'م',
    badgeNight: 'ل',
    workLocation: 'موقع العمل',
    latitude: 'خط العرض',
    longitude: 'خط الطول',
    geofenceRadius: 'نطاق الموقع (متر)',
    detectLocation: 'كشف الموقع الحالي',
    saveLocation: 'حفظ الموقع',
    shiftThresholds: 'حدود الورديات',
    shift1Start: 'بداية الوردية 1 (صباحية)',
    shift1End: 'نهاية الوردية 1',
    shift2Start: 'بداية الوردية 2 (مسائية)',
    shift2End: 'نهاية الوردية 2',
    shift3Start: 'بداية الوردية 3 (ليلية)',
    shift3End: 'نهاية الوردية 3',
    saveThresholds: 'حفظ الحدود',
    preferences: 'التفضيلات',
    autoDetectLocation: 'كشف الموقع تلقائيًا',
    notifEnabled: 'الإشعارات',
    vibrateOnAction: 'اهتزاز عند بدء/انتهاء الدوام',
    navDashboard: 'الرئيسية',
    navSettings: 'الإعدادات',
    navLogs: 'السجلات',
    navPayroll: 'الرواتب',
    localeToggle: 'تبديل اللغة',
    ariaPayroll: 'الرواتب',
    financialSettings: 'الإعدادات المالية',
    baseSalary: 'الراتب الأساسي',
    saveSalary: 'حفظ الراتب',
    deductions: 'الخصومات',
    addDeduction: 'إضافة خصم',
    saveDeductions: 'حفظ الخصومات',
    payrollSummary: 'ملخص الراتب',
    netSalary: 'صافي الراتب',
    presentDays: 'أيام الحضور',
    grossSalary: 'إجمالي الراتب',
    latePenalty: 'غرامة التأخير',
    dailyWage: 'الأجر اليومي',
    monthlyAllowances: 'البدلات الشهرية',
    allowanceName: 'الاسم',
    allowanceAmount: 'المبلغ',
    dateLabel: 'التاريخ',
    dayLabel: 'اليوم',
    dayStatus: 'الحالة',
    lateMinutes: 'تأخير (د)',
    overtimeHours: 'إضافي (س)',
    note: 'ملاحظة',
    statusPresent: 'حاضر',
    statusAbsent: 'غائب',
    statusLate: 'متأخر',
    statusVacation: 'إجازة',
    statusSick: 'مرضي',
    ariaDashboard: 'الرئيسية',
    ariaSettings: 'الإعدادات',
    ariaLogs: 'السجلات',
    mainNav: 'التنقل الرئيسي',
    vacationSettings: 'إعدادات الإجازات',
    vacationAnnual: 'إجازة اعتيادية',
    vacationCasual: 'إجازة عارضة',
    saveVacation: 'حفظ الإجازات',
    vacationBalance: 'رصيد الإجازات',
    vacationType: 'النوع',
    vacationTotal: 'الإجمالي',
    vacationUsed: 'المستخدم',
    vacationRemaining: 'المتبقي',
    annualLeave: 'اعتيادية',
    casualLeave: 'عارضة'
  }
};

function isSupported(lang) {
  return SUPPORTED_LOCALES.indexOf(lang) !== -1;
}

function detectInitialLocale() {
  const saved = localStore.get(STORAGE_KEYS.LOCALE);
  if (saved && isSupported(saved)) return saved;
  const nav = (navigator.language || DEFAULT_LOCALE).toLowerCase();
  return nav.startsWith('ar') ? 'ar' : DEFAULT_LOCALE;
}

function getLocale() {
  const fromHtml = document.documentElement.getAttribute('lang');
  return isSupported(fromHtml) ? fromHtml : DEFAULT_LOCALE;
}

function setLocale(lang) {
  if (!isSupported(lang)) lang = DEFAULT_LOCALE;
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStore.set(STORAGE_KEYS.LOCALE, lang);
  applyTranslations(lang);
  document.dispatchEvent(new CustomEvent('localechange', { detail: { lang } }));
  eventBus.publish(EVENT_TOPICS.LOCALE_CHANGED, { from: getLocale(), to: lang });
}

function toggleLocale() {
  setLocale(getLocale() === 'ar' ? 'en' : 'ar');
}

function applyTranslations(lang) {
  const dict = STRINGS[lang] || STRINGS[DEFAULT_LOCALE];
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = el.getAttribute('data-i18n');
    if (key && dict[key] != null) el.textContent = dict[key];
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    const key = el.getAttribute('data-i18n-aria');
    if (key && dict[key] != null) el.setAttribute('aria-label', dict[key]);
  }
}

function t(key, fallback) {
  const lang = getLocale();
  const dict = STRINGS[lang] || STRINGS[DEFAULT_LOCALE];
  return dict[key] != null ? dict[key] : (fallback != null ? fallback : key);
}

function getShiftLabels() {
  const dict = STRINGS[getLocale()] || STRINGS[DEFAULT_LOCALE];
  return {
    morning: dict.morningShift || 'Morning',
    evening: dict.eveningShift || 'Evening',
    night: dict.nightShift || 'Night',
    off: dict.offDuty || 'Off Duty',
  };
}

function getBadgeLetters() {
  const dict = STRINGS[getLocale()] || STRINGS[DEFAULT_LOCALE];
  return {
    morning: dict.badgeMorning || 'M',
    evening: dict.badgeEvening || 'E',
    night: dict.badgeNight || 'N',
  };
}

export const i18n = {
  STRINGS,
  detectInitialLocale,
  getLocale,
  setLocale,
  toggleLocale,
  applyTranslations,
  t,
  getShiftLabels,
  getBadgeLetters,
};
