/**
 * Parallel Wave Ensemble — site settings.
 *
 * Everything the band is likely to change lives here: contact details, links,
 * form destinations, the optional recording, instrument sound, and analytics.
 * Page copy lives directly in index.html and privacy.html so it renders without
 * JavaScript.
 *
 * Never put service credentials or API keys in this file — it is public.
 * Point the form endpoints at a service (or your own server function) that
 * keeps credentials on the server.
 */
export default {
  bandName: 'Parallel Wave Ensemble',

  // Shown in the footer and offered as an alternative when a form can't send.
  // Leave empty until the band confirms the address.
  contactEmail: '',

  // Selected social links, e.g. { label: 'Instagram', url: 'https://instagram.com/…' }
  social: [],

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

  // Optional live excerpt. Leave null until the band approves an excerpt and
  // confirms it can be published. Example:
  // { src: 'media/excerpt.mp3', title: 'Improvisation in D', credit: 'Recorded at …, 2026' }
  excerpt: null,

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
