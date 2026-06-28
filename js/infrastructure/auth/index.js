import { FEATURE_FLAGS } from '../../shared/config.js';

let adapter = null;
let currentFlag = null;

async function resolveAdapter() {
  const flag = FEATURE_FLAGS.AUTH_ADAPTER;
  if (adapter && currentFlag === flag) return adapter;
  currentFlag = flag;
  if (flag === 'supabase') {
    const m = await import('./supabase.js');
    adapter = m.authSupabase;
  } else {
    const m = await import('./anon.js');
    adapter = m.authAnon;
  }
  return adapter;
}

export async function getSession() {
  const a = await resolveAdapter();
  return a.getSession();
}

export async function getUser() {
  const a = await resolveAdapter();
  return a.getUser();
}

export async function getRole() {
  const a = await resolveAdapter();
  return a.getRole();
}

export function onAuthChange(cb) {
  resolveAdapter().then((a) => a.onAuthChange(cb));
  return () => {};
}
