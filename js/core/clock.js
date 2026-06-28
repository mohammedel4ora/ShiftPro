const STATUS = Object.freeze({
  IDLE: 'idle',
  CLOCKED_IN: 'clocked-in',
});

function initial() {
  return { status: STATUS.IDLE, clockInAt: null, date: null, shift: null };
}

function start(state, opts) {
  const o = opts || {};
  if (state.status === STATUS.CLOCKED_IN) return state;
  const now = o.clockInAt instanceof Date ? o.clockInAt : new Date();
  return {
    status: STATUS.CLOCKED_IN,
    clockInAt: now,
    date: now.toISOString().slice(0, 10),
    shift: o.shift || null,
  };
}

function stop(state, opts) {
  const o = opts || {};
  if (state.status !== STATUS.CLOCKED_IN) {
    return { state, durationMinutes: 0, clockInAt: null, stoppedAt: o.stoppedAt || null };
  }
  const now = o.stoppedAt instanceof Date ? o.stoppedAt : new Date();
  const durationMs = now.getTime() - state.clockInAt.getTime();
  const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));
  return {
    state: initial(),
    durationMinutes,
    clockInAt: state.clockInAt,
    stoppedAt: now,
  };
}

function isActive(state) {
  return state.status === STATUS.CLOCKED_IN;
}

function durationSince(clockInAt, now) {
  if (!(clockInAt instanceof Date)) return 0;
  const ref = now instanceof Date ? now : new Date();
  return Math.max(0, Math.floor((ref.getTime() - clockInAt.getTime()) / 60000));
}

export const clock = { STATUS, initial, start, stop, isActive, durationSince };
