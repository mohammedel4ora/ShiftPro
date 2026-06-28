const ANON_SESSION = Object.freeze({
  userId: 'local',
  displayName: 'Me',
  role: 'employee',
});

const ANON_USER = Object.freeze({
  id: 'local',
  displayName: 'Me',
  role: 'employee',
});

function getSession() {
  return Promise.resolve({ ...ANON_SESSION });
}

function getUser() {
  return Promise.resolve({ ...ANON_USER });
}

function getRole() {
  return Promise.resolve('employee');
}

function onAuthChange(cb) {
  const unsub = () => {};
  try {
    cb({ userId: 'local', role: 'employee' });
  } catch {
    // ignore
  }
  return unsub;
}

export const authAnon = { getSession, getUser, getRole, onAuthChange };
