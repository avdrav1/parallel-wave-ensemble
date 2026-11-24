// Page wiring. Each feature starts independently so one failing (for example,
// audio) never blocks navigation, booking or signup.
import config from '../../site.config.js';

function safely(label, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) result.catch((error) => console.error(`[${label}]`, error));
  } catch (error) {
    console.error(`[${label}]`, error);
  }
}

safely('footer', () => {
  const contact = document.querySelector('[data-contact]');
  if (contact && config.contactEmail) {
    const link = document.createElement('a');
    link.href = `mailto:${config.contactEmail}`;
    link.textContent = config.contactEmail;
    contact.replaceChildren(link);
    contact.hidden = false;
  }
  const social = document.querySelector('[data-social]');
  if (social && config.social?.length) {
    for (const { label, url } of config.social) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = url;
      a.textContent = label;
      a.rel = 'me noopener';
      li.append(a);
      social.append(li);
    }
    social.hidden = false;
  }
});

safely('forms', () => import('./forms.js').then((m) => m.initForms(config)));

safely('excerpt', () => {
  const section = document.querySelector('[data-excerpt]');
  if (section && config.excerpt?.src) return import('./excerpt.js').then((m) => m.initExcerpt(section, config.excerpt));
});

safely('instrument', () => {
  const root = document.querySelector('[data-instrument]');
  if (!root) return;
  return import('./instrument/instrument.js')
    .then((m) => m.initInstrument(root, config.instrument))
    .catch((error) => {
      root.hidden = true; // The rest of the page carries on without the instrument.
      throw error;
    });
});
