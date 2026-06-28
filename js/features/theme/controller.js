import { STORAGE_KEYS, EVENT_TOPICS } from '../../shared/config.js';
import { localStore } from '../../infrastructure/storage/localStore.js';
import { eventBus } from '../../shared/eventBus.js';
import { updateIcon } from './view.js';

export function mount() {
  const html = document.documentElement;
  const saved = localStore.get(STORAGE_KEYS.THEME) || 'dark';
  html.setAttribute('data-theme', saved);
  updateIcon(saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', current);
    localStore.set(STORAGE_KEYS.THEME, current);
    updateIcon(current);
    eventBus.publish(EVENT_TOPICS.THEME_CHANGED, { theme: current });
  });
}

export function unmount() {}
