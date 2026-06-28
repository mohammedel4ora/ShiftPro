import { i18n } from '../../infrastructure/i18n/index.js';
import { EVENT_TOPICS } from '../../shared/config.js';
import { eventBus } from '../../shared/eventBus.js';

export function mount() {
  const initial = i18n.detectInitialLocale();
  i18n.setLocale(initial);

  document.getElementById('localeToggle').addEventListener('click', () => {
    i18n.toggleLocale();
  });

  eventBus.subscribe(EVENT_TOPICS.LOCALE_CHANGED, ({ to }) => {
    document.querySelectorAll('.section--active').forEach(() => {
      document.dispatchEvent(new CustomEvent('section-localechange'));
    });
  });
}

export function unmount() {}
