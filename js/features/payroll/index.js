/**
 * Payroll Feature Index
 */

import { mount as controllerMount, unmount as controllerUnmount } from './controller.js';

export function mount(rootEl) {
  controllerMount(rootEl);
}

export function unmount() {
  controllerUnmount();
}
