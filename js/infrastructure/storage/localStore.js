const memoryFallback = new Map();
let useMemory = false;

function detectStorage() {
  try {
    const k = '__sp_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return false;
  } catch {
    return true;
  }
}
useMemory = detectStorage();

function get(key) {
  const raw = useMemory ? memoryFallback.get(key) : window.localStorage.getItem(key);
  if (raw === null || raw === undefined) return null;
  const first = raw.charAt(0);
  if (first !== '{' && first !== '[' && first !== '"') {
    return raw;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function set(key, value) {
  const serialized = (value !== null && typeof value === 'object')
    ? JSON.stringify(value)
    : String(value);
  if (useMemory) {
    memoryFallback.set(key, serialized);
    return;
  }
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    useMemory = true;
    memoryFallback.set(key, serialized);
  }
}

function remove(key) {
  if (useMemory) {
    memoryFallback.delete(key);
  } else {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

function has(key) {
  if (useMemory) return memoryFallback.has(key);
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function keys() {
  if (useMemory) return Array.from(memoryFallback.keys());
  const out = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) out.push(k);
    }
  } catch {
    // ignore
  }
  return out;
}

export const localStore = { get, set, remove, has, keys };
