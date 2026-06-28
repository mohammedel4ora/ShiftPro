import { EVENT_TOPICS } from './config.js';
import { eventBus } from './eventBus.js';

const registry = new Map();
let active = null;
const activeUnmounts = new Map();
const onChangeListeners = new Set();

function setActiveDom(sectionId) {
  for (const el of document.querySelectorAll('.section')) {
    el.classList.toggle('section--active', el.id === `section-${sectionId}`);
  }
  for (const el of document.querySelectorAll('[data-section]')) {
    const isActive = el.dataset.section === sectionId;
    el.classList.toggle('bottom-nav__item--active', isActive);
    if (el.getAttribute('role') === 'tab') {
      el.setAttribute('aria-selected', String(isActive));
    }
  }
}

function activate(sectionId) {
  if (active === sectionId) return;
  const prev = active;

  const prevUnmount = activeUnmounts.get(prev);
  if (prevUnmount) {
    try {
      prevUnmount();
    } catch (err) {
      console.error(`[router] unmount failed for "${prev}":`, err);
    }
    activeUnmounts.delete(prev);
  }

  active = sectionId;

  setActiveDom(sectionId);

  const entry = registry.get(sectionId);
  const root = document.getElementById(`section-${sectionId}`);
  if (entry && root) {
    try {
      const result = entry.mount(root);
      if (entry.unmount) activeUnmounts.set(sectionId, entry.unmount);
    } catch (err) {
      console.error(`[router] mount failed for "${sectionId}":`, err);
    }
  }

  for (const cb of onChangeListeners) {
    try {
      cb({ from: prev, to: sectionId });
    } catch (err) {
      console.error('[router] onChange listener error:', err);
    }
  }

  eventBus.publish(EVENT_TOPICS.SECTION_CHANGED, { from: prev, to: sectionId });
}

function register(sectionId, mountFn, unmountFn) {
  if (typeof mountFn !== 'function') {
    throw new TypeError(`[router] mount for "${sectionId}" must be a function`);
  }
  registry.set(sectionId, { mount: mountFn, unmount: unmountFn || (() => {}) });
}

function start(initialSectionId) {
  activate(initialSectionId);
}

function go(sectionId) {
  if (!registry.has(sectionId)) {
    console.warn(`[router] no feature registered for "${sectionId}"`);
    return;
  }
  activate(sectionId);
}

function onChange(cb) {
  onChangeListeners.add(cb);
  return () => onChangeListeners.delete(cb);
}

function current() {
  return active;
}

function isActive(sectionId) {
  return active === sectionId;
}

export const router = { register, start, go, onChange, current, isActive };
