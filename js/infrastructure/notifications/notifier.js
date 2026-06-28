const DEFAULT_ICON = '/assets/icons/icon-192.svg';

function requestPermission() {
  if (!('Notification' in window)) return Promise.resolve('denied');
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Promise.resolve(Notification.permission);
  }
  return Notification.requestPermission();
}

function notify({ title, body, tag, icon }) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, icon: icon || DEFAULT_ICON });
  } catch (err) {
    console.error('[notifier] notify failed:', err);
  }
}

function vibrate(pattern) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export const notifier = { requestPermission, notify, vibrate };
