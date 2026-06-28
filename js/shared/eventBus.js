const subscribers = new Map();

function publish(topic, payload) {
  const list = subscribers.get(topic);
  if (!list || list.size === 0) return;
  for (const cb of list) {
    try {
      cb(payload);
    } catch (err) {
      console.error(`[eventBus] subscriber error on "${topic}":`, err);
    }
  }
}

function subscribe(topic, cb) {
  let set = subscribers.get(topic);
  if (!set) {
    set = new Set();
    subscribers.set(topic, set);
  }
  set.add(cb);
  return () => set.delete(cb);
}

function clear() {
  subscribers.clear();
}

function listenerCount(topic) {
  const set = subscribers.get(topic);
  return set ? set.size : 0;
}

export const eventBus = { publish, subscribe, clear, listenerCount };
