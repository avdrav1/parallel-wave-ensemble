/**
 * Parallel Wave Ensemble: technical site settings.
 *
 * The band's own content (page words, photos, contact email, social links and
 * the excerpt recording) lives in content/ and is edited in Pages CMS.
 * tools/build.mjs turns content/site.json into assets/js/site-content.js,
 * which this file reads. What's left here is wiring: form destinations,
 * instrument sound and analytics.
 *
 * Never put service credentials or API keys in this file — it is public.
 * Point the form endpoints at a service (or your own server function) that
 * keeps credentials on the server.
 */
import content from './assets/js/site-content.js';

export default {
  bandName: 'Parallel Wave Ensemble',

  // From content/site.json. Shown in the footer; the email is also offered
  // when a form can't send.
  contactEmail: content.contactEmail,
  social: content.social,

  // Booking inquiries. `endpoint` must accept a POST and return a 2xx status
  // only when the inquiry has been accepted. Until it is set, the form says
  // honestly that it isn't connected and never shows a success message.
  booking: {
    endpoint: '',
    format: 'json', // 'json' or 'form' (URL-encoded)
  },

  // Mailing list. Use a provider (or proxy) that sends a confirmation email
  // and supports unsubscribe. Never subscribe booking-form senders.
  newsletter: {
    endpoint: '',
    format: 'json',
    requiresConfirmation: true, // changes the success message to "check your inbox"
  },

  // Optional live excerpt, from content/site.json (null while it's turned off).
  excerpt: content.excerpt,

  // The playable bowls in the hero. Prototype tuning — review with the band.
  instrument: {
    // Five pitches from one pentatonic collection (D major / B minor),
    // low to high, left to right: A3 B3 D4 E4 F#4.
    notes: [220.0, 246.94, 293.66, 329.63, 369.99],
    decaySeconds: 8, // time for a struck bowl to fade out (spec: ~6–10 s)
    defaultVolume: 0.5, // 0–1, conservative starting level
    maxVoices: 6, // simultaneous ringing bowls before the oldest is faded
    reverb: 0.3, // 0–1, amount of room
  },

  // Analytics hook. Receives only an event name — never form contents or
  // email addresses. Events: instrument_activated, booking_form_started,
  // booking_inquiry_sent, newsletter_signup_sent, excerpt_played.
  // Example (Plausible): send: (name) => window.plausible?.(name)
  analytics: {
    send: null,
  },
};
