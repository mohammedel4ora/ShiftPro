/**
 * Salary Engine — Pure Logic (no DOM, no storage)
 * ------------------------------------------------
 * Calculates net salary based on attendance, late penalties,
 * allowances, deductions, and overtime rules.
 */

// ─── Constants ────────────────
const DAY_HOURS = 8;

// ─── Day Wage ────────────────
export function dailyWage(baseSalary) {
  return baseSalary / 30;
}

// ─── Late Penalty (hours to deduct) ────────────────
export function latePenaltyMinutes(lateMinutes) {
  const m = Math.max(0, Math.floor(Number(lateMinutes) || 0));
  if (m <= 5) return 0;
  if (m <= 15) return 2 * 60;   // 2 hours
  if (m <= 30) return 6 * 60;   // 6 hours
  return DAY_HOURS * 60;        // full day
}

// ─── Overtime Multiplier ────────────────
export function overtimeMultiplier(dayOfWeek) {
  // dayOfWeek: 0=Sunday, ..., 5=Friday, 6=Saturday
  // Friday in many regions is the weekend
  return dayOfWeek === 5 ? 1.5 : 1.2;
}

// ─── Net Salary Calculation ────────────────
export function calculateNetSalary({
  baseSalary,
  daysData,
  allowances = [],
  deductions = [],
}) {
  const dWage = dailyWage(baseSalary);
  // daysData: [{ date, BaseSalary: number }]
  let presentDays = 0;
  let latePenaltyTotal = 0;
  let overtimeTotal = 0;

  for (const day of daysData) {
    const status = day.status;
    if (status === 'present' || status === 'late' || status === 'vacation' || status === 'sick') {
      presentDays++;
      // late penalty
      if (day.lateMinutes > 0) {
        presentDays--;
        const penaltyMinutes = latePenaltyMinutes(day.lateMinutes);
        const dayValue = dWage;
        const penaltyValue = (penaltyMinutes / (DAY_HOURS * 60)) * dayValue;
        latePenaltyTotal += penaltyValue;
      }
    }
    // overtime (manual entries or calculated from clock data)
    const otHours = day.overtimeHours !== undefined ? day.overtimeHours : (day.overtimeMinutes ? day.overtimeMinutes / 60 : 0);
    if (otHours > 0) {
      const dateObj = new Date(day.date);
      const multiplier = overtimeMultiplier(dateObj.getDay());
      const hourlyRate = dWage / DAY_HOURS;
      overtimeTotal += hourlyRate * multiplier * otHours;
    }
  }

  // Allowances (monthly bonuses)
  const totalAllowances = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // Deductions (fixed penalties, e.g., insurance)
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Final calculation
  const gross = (presentDays * dWage) + totalAllowances + overtimeTotal;
  const net = gross - latePenaltyTotal - totalDeductions;

  return {
    baseSalary,
    dailyWage: dWage,
    presentDays,
    grossSalary: Math.round(gross * 100) / 100,
    latePenalty: Math.round(latePenaltyTotal * 100) / 100,
    overtime: Math.round(overtimeTotal * 100) / 100,
    totalAllowances: Math.round(totalAllowances * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.max(0, Math.round(net * 100) / 100),
  };
}

// ─── Day Status from Events ────────────────
export function deriveDayStatus(eventsForDay) {
  // eventsForDay: all events for a specific date
  // priority: manual > clock-in/clock-out > auto-detected
  if (!eventsForDay || eventsForDay.length === 0) {
    return { status: 'absent', lateMinutes: 0, overtimeHours: 0 };
  }

  // Check for manual overrides first
  const manuals = eventsForDay.filter((e) =>
    ['present', 'absent', 'late', 'vacation', 'sick'].includes(e.type)
  );
  if (manuals.length > 0) {
    const manual = manuals[0]; // take the latest
    let otHours = 0;
    if (manual.overtimeHours !== undefined) {
      otHours = manual.overtimeHours;
    } else if (manual.overtimeMinutes !== undefined) {
      otHours = manual.overtimeMinutes / 60;
    }
    return {
      status: manual.type,
      lateMinutes: manual.lateMinutes || 0,
      overtimeHours: otHours,
      note: manual.note || '',
    };
  }

  // Check for clock-in/out
  const clockIns = eventsForDay.filter((e) => e.type === 'clock-in');
  const clockOuts = eventsForDay.filter((e) => e.type === 'clock-out');
  if (clockIns.length > 0 || clockOuts.length > 0) {
    // TODO: Compare clock-in time vs shift start to calculate late
    return { status: 'present', lateMinutes: 0, overtimeHours: 0 };
  }

  // Check for quick-logs
  const quickLog = eventsForDay.find((e) =>
    ['sick', 'vacation', 'overtime', 'remote'].includes(e.type)
  );
  if (quickLog) {
    let otHours = 0;
    if (quickLog.type === 'overtime') {
      if (quickLog.durationMinutes) {
        otHours = quickLog.durationMinutes / 60;
      } else if (quickLog.durationHours) {
        otHours = quickLog.durationHours;
      }
    }
    return {
      status: quickLog.type === 'overtime' ? 'present' : quickLog.type,
      lateMinutes: 0,
      overtimeHours: otHours,
      note: '',
    };
  }

  return { status: 'absent', lateMinutes: 0, overtimeHours: 0 };
}
