function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDuration(minutes) {
  const safe = Math.max(0, Math.floor(Number(minutes) || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function formatDurationSec(totalSec) {
  const safe = Math.max(0, Math.floor(Number(totalSec) || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function formatTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function nowIso() {
  return new Date().toISOString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthIso() {
  return new Date().toISOString().slice(0, 7);
}

function addMinutes(date, minutes) {
  const d = new Date(date.getTime());
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export const time = {
  formatDuration,
  formatDurationSec,
  formatTime,
  nowIso,
  todayIso,
  currentMonthIso,
  addMinutes,
};
