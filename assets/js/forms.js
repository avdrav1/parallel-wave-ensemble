// Booking inquiry and mailing-list forms.
// Success is shown only after the configured service accepts the submission.
import { track } from './analytics.js';

const MESSAGES = {
  name: { valueMissing: 'Please enter your name.' },
  email: {
    valueMissing: 'Please enter your email address.',
    typeMismatch: 'Please enter an email address like name@example.com.',
  },
  message: { valueMissing: 'Please tell us a little about your gathering.' },
};

export function initForms(config) {
  const booking = document.querySelector('[data-form="booking"]');
  const newsletter = document.querySelector('[data-form="newsletter"]');

  if (booking) {
    setUp(booking, {
      service: config.booking,
      contactEmail: config.contactEmail,
      submitLabel: 'Send an inquiry',
      submittingLabel: 'Sending…',
      retryLabel: 'Try again',
      notConnected: 'Booking inquiries aren’t connected yet, so this form can’t send. Nothing was submitted.',
      failure: 'We couldn’t send your inquiry. Your details are still here, so please try again.',
      success: () => ({
        heading: 'Thank you.',
        body: 'We’ve received your inquiry and will be in touch.',
      }),
      onStart: () => track('booking_form_started', { once: true }),
      onSuccess: () => track('booking_inquiry_sent'),
    });
  }

  if (newsletter) {
    const confirm = config.newsletter?.requiresConfirmation !== false;
    if (!confirm) {
      newsletter.querySelector('#n-email-note').firstChild.textContent = 'Unsubscribe anytime. ';
    }
    setUp(newsletter, {
      service: config.newsletter,
      contactEmail: config.contactEmail,
      submitLabel: 'Stay in touch',
      submittingLabel: 'Joining…',
      retryLabel: 'Try again',
      notConnected: 'The mailing list isn’t connected yet, so this form can’t sign you up. Nothing was submitted.',
      failure: 'We couldn’t add you to the list. Please try again.',
      success: () =>
        confirm
          ? { heading: 'Almost there.', body: 'Please check your inbox and confirm your subscription.' }
          : { heading: 'Thank you.', body: 'You’re on the list.' },
      onSuccess: () => track('newsletter_signup_sent'),
    });
  }
}

function setUp(form, options) {
  const status = form.querySelector('[data-status]');
  const submit = form.querySelector('[data-submit]');
  const fields = [...form.querySelectorAll('input[required], textarea[required]')];
  let busy = false;

  form.addEventListener('input', () => options.onStart?.(), { once: true });

  // Clear a field's error as soon as it becomes valid.
  for (const field of fields) {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true' && field.validity.valid) showError(form, field, '');
    });
    field.addEventListener('blur', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate(form, field);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const invalid = fields.filter((field) => !validate(form, field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const service = options.service ?? {};
    if (!service.endpoint) {
      setStatus(status, 'error', `<p>${options.notConnected}${contactLine(options.contactEmail)}</p>`);
      return;
    }

    busy = true;
    submit.disabled = true;
    submit.textContent = options.submittingLabel;
    form.setAttribute('aria-busy', 'true');
    setStatus(status, '', '');

    try {
      const data = new FormData(form);
      const response = await fetch(service.endpoint, {
        method: 'POST',
        headers:
          service.format === 'form'
            ? { Accept: 'application/json' }
            : { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: service.format === 'form' ? new URLSearchParams(data) : JSON.stringify(Object.fromEntries(data)),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { heading, body } = options.success();
      options.onSuccess?.();
      const done = document.createElement('div');
      done.className = 'form__status';
      done.dataset.tone = 'success';
      done.tabIndex = -1;
      done.setAttribute('role', 'status');
      done.innerHTML = `<p><strong>${heading}</strong> ${body}</p>`;
      form.replaceWith(done);
      done.focus();
    } catch {
      setStatus(status, 'error', `<p>${options.failure}${contactLine(options.contactEmail)}</p>`);
      submit.textContent = options.retryLabel;
    } finally {
      busy = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}

function validate(form, field) {
  const v = field.validity;
  if (field.type !== 'email' && field.value.trim() === '' && field.required) {
    showError(form, field, MESSAGES[field.name]?.valueMissing ?? 'This field is required.');
    return false;
  }
  if (v.valid) {
    showError(form, field, '');
    return true;
  }
  const messages = MESSAGES[field.name] ?? {};
  const key = Object.keys(messages).find((k) => v[k]);
  showError(form, field, (key && messages[key]) || field.validationMessage);
  return false;
}

function showError(form, field, message) {
  const el = form.querySelector(`[data-error-for="${field.name}"]`);
  if (el) el.textContent = message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

function setStatus(el, tone, html) {
  el.dataset.tone = tone;
  el.innerHTML = html;
}

function contactLine(email) {
  if (!email) return '';
  const safe = encodeURI(email);
  return ` You can also email us at <a href="mailto:${safe}">${escapeHtml(email)}</a>.`;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
