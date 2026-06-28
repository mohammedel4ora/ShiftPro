import { dom } from '../../shared/dom.js';
import { router } from '../../shared/router.js';

export function mount() {
  dom.onAll(dom.qsa('.bottom-nav__item'), 'click', (e) => {
    router.go(e.currentTarget.dataset.section);
  });
}

export function unmount() {}
