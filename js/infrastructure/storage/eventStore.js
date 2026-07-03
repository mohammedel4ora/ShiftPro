import { DB, STORAGE_KEYS, DEFAULT_VACATION_DAYS } from '../../shared/config.js';
import { localStore } from './localStore.js';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB.NAME, DB.VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB.STORE)) {
        const store = db.createObjectStore(DB.STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex(DB.INDEX_DATE, 'date', { unique: false });
        store.createIndex(DB.INDEX_TYPE, 'type', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
  });
}

async function getAllEvents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(DB.STORE, 'readonly');
    const req = t.objectStore(DB.STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function applyFilter(events, filter) {
  if (!filter) return events;
  return events.filter((e) => {
    if (filter.userId != null && e.userId !== filter.userId) return false;
    if (filter.date && e.date !== filter.date) return false;
    if (filter.type && e.type !== filter.type) return false;
    if (filter.month && (!e.date || !e.date.startsWith(filter.month))) return false;
    if (filter.dateFrom && (!e.date || e.date < filter.dateFrom)) return false;
    if (filter.dateTo && (!e.date || e.date > filter.dateTo)) return false;
    return true;
  });
}

async function addEvent(event) {
  const db = await openDB();
  const record = { ...event, createdAt: new Date().toISOString() };
  return new Promise((resolve, reject) => {
    const t = db.transaction(DB.STORE, 'readwrite');
    const req = t.objectStore(DB.STORE).add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getEvents(filter) {
  const all = await getAllEvents();
  let filtered = applyFilter(all, filter);
  if (filter && (filter.month || filter.dateFrom)) {
    filtered = deduplicateManualEvents(filtered);
  }
  return filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// Manual events (present, absent, late, vacation, sick) should take precedence
// for the same day. Keep only the latest manual event per date.
function deduplicateManualEvents(events) {
  const manualTypes = new Set(['present', 'absent', 'late', 'vacation', 'sick']);
  const dateGroups = new Map();

  for (const e of events) {
    if (!dateGroups.has(e.date)) {
      dateGroups.set(e.date, []);
    }
    dateGroups.get(e.date).push(e);
  }

  const result = [];
  for (const [date, dayEvents] of dateGroups) {
    const manuals = dayEvents.filter((e) => manualTypes.has(e.type));
    if (manuals.length > 0) {
      // latest manual wins
      const latestManual = manuals.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
      result.push(latestManual);
      // Keep non-manual events too for display/history
      result.push(...dayEvents.filter((e) => !manualTypes.has(e.type)));
    } else {
      result.push(...dayEvents);
    }
  }
  return result;
}

async function getMonthStats({ userId, yearMonth }) {
  const events = await getEvents({ userId, month: yearMonth });
  const clockOuts = events.filter((e) => e.type === 'clock-out');
  let totalMinutes = 0;
  for (const e of clockOuts) {
    if (e.durationMinutes) totalMinutes += e.durationMinutes;
  }
  const daysSet = new Set(clockOuts.map((e) => e.date).filter(Boolean));
  const vacation = events.filter((e) => e.type === 'vacation');
  const sick = events.filter((e) => e.type === 'sick');
  return {
    totalMinutes,
    daysWorked: daysSet.size,
    vacationUsed: vacation.length,
    sickDays: sick.length,
    events,
  };
}

async function getVacationBalance({ userId }) {
  const stored = localStore.get(STORAGE_KEYS.VACATION);
  const total = stored !== null && !Number.isNaN(parseInt(stored, 10))
    ? parseInt(stored, 10)
    : DEFAULT_VACATION_DAYS;
  const events = await getEvents({ userId, type: 'vacation' });
  const used = events.filter((e) => e.date).length;
  return { total, used, remaining: total - used };
}

export const eventStore = { addEvent, getEvents, getMonthStats, getVacationBalance };
