import { settingsService } from '../../application/settingsService.js';
import { salaryService } from '../../application/salaryService.js';
import { browserGeo } from '../../infrastructure/geolocation/browserGeo.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { eventBus } from '../../shared/eventBus.js';

function loadUI() {
  const geo = settingsService.loadGeo();
  document.getElementById('lat').value = geo.lat;
  document.getElementById('lng').value = geo.lng;
  document.getElementById('radius').value = geo.radius;

  const t = settingsService.loadThresholds();
  document.getElementById('shift1-start').value = t.morning.start;
  document.getElementById('shift1-end').value = t.morning.end;
  document.getElementById('shift2-start').value = t.evening.start;
  document.getElementById('shift2-end').value = t.evening.end;
  document.getElementById('shift3-start').value = t.night.start;
  document.getElementById('shift3-end').value = t.night.end;

  const prefs = settingsService.loadPrefs();
  document.getElementById('autoLocate').checked = prefs.autoLocate;
  document.getElementById('notificationsEnabled').checked = prefs.notify;
  document.getElementById('vibrateOnAction').checked = prefs.vibrate;
}

function loadFinancial() {
  const salary = salaryService.getBaseSalary();
  document.getElementById('baseSalary').value = salary.baseSalary;
  renderDeductions();
}

function renderDeductions() {
  const container = document.getElementById('deductionsList');
  if (!container) return;
  const deductions = salaryService.getDeductions();
  container.innerHTML = '';
  for (const d of deductions) {
    const row = document.createElement('div');
    row.className = 'deduction-row';
    row.dataset.id = d.id;
    row.innerHTML = `
      <input type="text" class="deduction-name" value="${escapeHtml(d.name)}" placeholder="Deduction name">
      <input type="number" class="deduction-amount" value="${d.amount}" placeholder="Amount" min="0" step="10">
      <button class="deduction-remove" data-id="${d.id}">\u2013</button>
    `;
    container.appendChild(row);
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function collectDeductions() {
  const container = document.getElementById('deductionsList');
  if (!container) return [];
  const rows = container.querySelectorAll('.deduction-row');
  return Array.from(rows).map((row) => ({
    id: row.dataset.id,
    name: row.querySelector('.deduction-name')?.value?.trim() || '',
    amount: parseFloat(row.querySelector('.deduction-amount')?.value) || 0,
  })).filter((d) => d.name && d.amount > 0);
}

export function mount() {
  loadUI();
  loadFinancial();

  document.getElementById('detectLocationBtn').addEventListener('click', async () => {
    const btn = document.getElementById('detectLocationBtn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Detecting\u2026';
    try {
      const pos = await browserGeo.getCurrentPosition();
      document.getElementById('lat').value = pos.lat;
      document.getElementById('lng').value = pos.lng;
    } catch (err) {
      btn.innerHTML = '<span style="color:#f87171">\u2715 ' + (err.message || 'Error') + '</span>';
      setTimeout(() => { btn.innerHTML = orig; }, 4000);
      return;
    }
    btn.disabled = false;
    btn.innerHTML = orig;
  });

  document.getElementById('saveLocationBtn').addEventListener('click', () => {
    settingsService.saveGeo({
      lat: parseFloat(document.getElementById('lat').value) || 0,
      lng: parseFloat(document.getElementById('lng').value) || 0,
      radius: parseInt(document.getElementById('radius').value, 10) || 150,
    });
  });

  document.getElementById('saveThresholdsBtn').addEventListener('click', () => {
    settingsService.saveThresholds({
      morning: {
        start: document.getElementById('shift1-start').value,
        end: document.getElementById('shift1-end').value,
      },
      evening: {
        start: document.getElementById('shift2-start').value,
        end: document.getElementById('shift2-end').value,
      },
      night: {
        start: document.getElementById('shift3-start').value,
        end: document.getElementById('shift3-end').value,
      },
    });
  });

  const prefIDs = [
    ['autoLocate', (p, v) => { p.autoLocate = v; }],
    ['notificationsEnabled', (p, v) => { p.notify = v; }],
    ['vibrateOnAction', (p, v) => { p.vibrate = v; }],
  ];

  for (const [id, setter] of prefIDs) {
    document.getElementById(id).addEventListener('change', (e) => {
      const prefs = settingsService.loadPrefs();
      setter(prefs, e.target.checked);
      settingsService.savePrefs(prefs);
    });
  }

  document.getElementById('saveSalaryBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('baseSalary').value) || 0;
    salaryService.setBaseSalary(val);
    eventBus.publish(EVENT_TOPICS.PAYROLL_UPDATED, {});
  });

  document.getElementById('deductionsList').addEventListener('click', (e) => {
    const btn = e.target.closest('.deduction-remove');
    if (!btn) return;
    const row = btn.closest('.deduction-row');
    if (row) row.remove();
  });

  document.getElementById('addDeductionBtn').addEventListener('click', () => {
    const container = document.getElementById('deductionsList');
    const row = document.createElement('div');
    row.className = 'deduction-row';
    row.dataset.id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    row.innerHTML = `
      <input type="text" class="deduction-name" placeholder="Deduction name">
      <input type="number" class="deduction-amount" placeholder="Amount" min="0" step="10">
      <button class="deduction-remove">\u2013</button>
    `;
    container.appendChild(row);
  });

  document.getElementById('saveDeductionsBtn').addEventListener('click', () => {
    salaryService.setDeductions(collectDeductions());
    renderDeductions();
    eventBus.publish(EVENT_TOPICS.PAYROLL_UPDATED, {});
  });

  eventBus.subscribe(EVENT_TOPICS.LOCALE_CHANGED, () => {
    loadUI();
    loadFinancial();
  });
}

export function unmount() {}