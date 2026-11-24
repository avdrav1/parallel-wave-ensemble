import config from '../../site.config.js';

const sent = new Set();

// Sends an event name only — never form contents or email addresses.
export function track(name, { once = false } = {}) {
  if (once && sent.has(name)) return;
  sent.add(name);
  try {
    config.analytics?.send?.(name);
  } catch {
    // Analytics must never break the page.
  }
}
