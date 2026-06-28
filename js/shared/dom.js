function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function on(target, event, handler, options) {
  if (!target) return () => {};
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

function delegate(root, selector, event, handler) {
  if (!root) return () => {};
  return on(root, event, (e) => {
    const match = e.target.closest(selector);
    if (match && root.contains(match)) {
      handler.call(match, e, match);
    }
  });
}

function onAll(targets, event, handler, options) {
  if (!targets) return () => {};
  const offs = [];
  for (const t of targets) offs.push(on(t, event, handler, options));
  return () => offs.forEach((off) => off());
}

export const dom = { qs, qsa, on, delegate, onAll };
