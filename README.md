# Parallel Wave Ensemble — website

A single-page site for Parallel Wave Ensemble (cello, violin, percussion), with five playable bowls in the hero, a booking inquiry form, a mailing-list signup, and a short privacy page. The spec is in [`docs/spec.md`](docs/spec.md).

It's plain HTML, CSS and JavaScript modules. There's no build step and nothing to install.

## Run it locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

The page needs to be served over HTTP, because ES modules don't load from `file://`.

## Where things live

| What | Where |
| --- | --- |
| Contact email, social links, form endpoints, excerpt, instrument sound, analytics | `site.config.js` |
| Page copy | `index.html`, `privacy.html` (the copy is in the HTML so it renders without JavaScript) |
| Styles and colors | `assets/css/styles.css` (color tokens at the top) |
| Sound synthesis | `assets/js/instrument/audio-engine.js` |
| Bowl input, visuals, mute/volume, interruptions | `assets/js/instrument/instrument.js` |
| Forms | `assets/js/forms.js` |
| Optional live excerpt | `assets/js/excerpt.js` |
| "One sound source at a time" coordination | `assets/js/sound-bus.js` |

Each feature starts independently from `assets/js/main.js`, so if the instrument fails, navigation, booking and signup still work.

## Connecting the forms

Until an endpoint is set, each form tells visitors that it isn't connected yet. It never shows a false success.

- **Booking:** set `booking.endpoint` to a URL that accepts a POST and returns a 2xx status only after it accepts the inquiry. Examples: Formspree, Basin, or your own serverless function. The site sends JSON (`name`, `email`, `when`, `location`, `message`, `_gotcha`). Set `format: 'form'` if the service wants URL-encoded data instead. `_gotcha` is a honeypot field; let the service reject submissions where it isn't empty.
- **Mailing list:** set `newsletter.endpoint` to a provider or proxy that sends a confirmation email and supports unsubscribing. Keep any API keys on the server. A small serverless function in front of the provider is the usual approach. The endpoint has to allow cross-origin requests from the site. If confirmation isn't required, set `requiresConfirmation: false`.

Booking and newsletter submissions stay separate. Sending an inquiry never subscribes anyone.

## Adding the live excerpt

Only add it after the band approves an excerpt and confirms it can be published. Put the file in `media/` and set:

```js
excerpt: { src: 'media/excerpt.mp3', title: '…', credit: 'Recorded at …' },
```

The section stays hidden while `excerpt` is `null`. The audio file loads only when someone presses play.

## The instrument

- The prototype tuning is A3 B3 D4 E4 F♯4, a D major / B minor pentatonic set, rising from left to right. Change `instrument.notes` in `site.config.js` after reviewing it with the band.
- Each bowl is a synthesized tone: a few sine partials, slightly inharmonic and detuned for shimmer, with a soft felt-mallet attack, a gentle procedural room reverb, and a natural decay of about 8 seconds.
- Simultaneous voices are capped (6 by default). Re-striking a ringing bowl damps it first. A bus compressor keeps rapid playing from building up or clipping, and every stop uses a short fade.
- No sound plays until the first tap, click or key press. Notes fade out when the tab is hidden, when the instrument scrolls out of view, or when the excerpt starts. Muting stays on until the visitor turns it off.
- The bowls never record or store anything, and the site never asks for the microphone.

**iPhone note:** iOS mutes web audio while the ring/silent switch is set to silent. That respects the visitor's setting, but it can make the bowls seem broken. If the band would rather play through the switch, add `if (navigator.audioSession) navigator.audioSession.type = 'playback';` in `audio-engine.js` before the context is created (Safari 17+).

## Analytics

`analytics.send` receives event names only: `instrument_activated` (first bowl only), `booking_form_started`, `booking_inquiry_sent`, `newsletter_signup_sent` and `excerpt_played`. It never receives form contents or email addresses. If analytics is added, mention it on the privacy page.

## Before launch

1. Wordmark or logo, final biography, and the About copy confirmed by the band.
2. An authentic ensemble photograph and credit. There's a commented-out `<figure>` in the About section, and the photo can also serve as `og:image` / `twitter:image` in `index.html`.
3. A confirmed description of how audience interaction works in person.
4. The booking destination and mailing-list service (the endpoints in `site.config.js`), plus `contactEmail`.
5. Final tuning and sound palette, reviewed with the band.
6. An approved excerpt and credit, if that section is included.
7. Privacy copy updated to name the services actually used. See the comment in `privacy.html`.
8. Tests on a real iPhone and a real Android device, and a listening session with the band.
