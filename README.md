# Parallel Wave Ensemble website

A single-page site for Parallel Wave Ensemble (cello, violin, percussion), with five playable bowls in the hero, a booking inquiry form, a mailing-list signup, and a short privacy page. The spec is in [`docs/spec.md`](docs/spec.md).

It's plain HTML, CSS and JavaScript modules. The band edits the words, photos and links in [Pages CMS](https://pagescms.org), and a small build script (`tools/build.mjs`, no dependencies) turns `templates/` and `content/` into the published site.

## Editing the site (for the band)

1. Open https://app.pagescms.org and sign in with the email address you were invited with. No GitHub account is needed.
2. Pick **Parallel Wave Ensemble**, then one of:
   - **Home page:** every heading, paragraph, button label and photo, plus how the site appears in search results and when shared
   - **Site and links:** contact email, social links, and the recording (with a switch to show or hide it)
   - **Privacy page**
3. Make your change and press **Save**. The live site updates in about two minutes.

Tips:

- **Paragraphs:** leave an empty line between them.
- **Photos:** upload the original from your phone or camera. The site grades, resizes and compresses it to match the others, so there's no need to edit it first. Use JPEG, PNG or WebP (on an iPhone, choose **Most Compatible** under Settings → Camera → Formats, or share the photo as JPEG).
- **Turn off location before uploading** (iPhone: tap **Options** at the top of the share sheet and turn off **Location**). The published photos never include location, and a workflow strips it from the uploaded file. But this repository is public, and the upload itself stays in its history.
- **Photo descriptions** are read aloud to people who can't see the photo. One plain sentence about who is in it and what they're doing is perfect.
- **If a save doesn't appear on the site**, something required is probably empty or too long. The site keeps showing the last good version. Ask the developer, who can see the reason in the repository's Actions tab.

## Run it locally

```sh
node tools/build.mjs                          # needs ImageMagick for the photos
python3 -m http.server 8000 -d dist
# open http://localhost:8000
```

Edit `templates/` for markup and `content/` for words, then rebuild. The page has to be served over HTTP, because ES modules don't load from `file://`. Graded photos are cached in `.cache/photos/`, so rebuilds after a text change are quick.

## Deploy

Every push to `main`, including every save from Pages CMS, builds the site and publishes it to GitHub Pages at https://avdrav1.github.io/parallel-wave-ensemble/ through `.github/workflows/pages.yml`. Only the built `dist/` folder is published. If the content fails a check, the build stops and the live site stays as it was. Running the workflow by hand on another branch only checks that the site builds.

`.github/workflows/clean-photos.yml` strips metadata from newly uploaded photos in `content/photos/` and commits the cleaned files back.

### Setting up Pages CMS (once)

1. Sign in at https://app.pagescms.org with GitHub, and install the Pages CMS GitHub App on this repository. It asks for read and write access to contents and administration.
2. Open the repository there and invite each band member by email under **Collaborators**.

The editing screen is defined in `.pages.yml`. If you add a field there, use it in `templates/` and add a check in `tools/build.mjs`.

## Where things live

| What | Where |
| --- | --- |
| Page words, photo choices and descriptions | `content/home.json`, `content/privacy.json` (edited in Pages CMS) |
| Contact email, social links, the recording | `content/site.json` (edited in Pages CMS) |
| Uploaded photos and recordings | `content/photos/`, `content/audio/` |
| Page markup | `templates/index.html`, `templates/privacy.html` (placeholders like `{{hero.title}}`; the words render into the HTML, so they work without JavaScript) |
| Build: checks, escaping, photo grading | `tools/build.mjs` |
| Pages CMS editing screen | `.pages.yml` |
| Form endpoints, instrument sound, analytics | `site.config.js` |
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

Only add it after the band approves an excerpt and confirms it can be published. In Pages CMS, open **Site and links → Recording**, upload the audio file, give it a title and a credit, and turn on **Show the recording on the page**. The section heading and note are under **Home page → Recording section**.

The section stays hidden while the switch is off. The audio file loads only when someone presses play.

## The instrument

- The prototype tuning is A3 B3 D4 E4 F♯4, a D major / B minor pentatonic set, rising from left to right. Change `instrument.notes` in `site.config.js` after reviewing it with the band.
- Each bowl is a synthesized tone: a few sine partials, slightly inharmonic and detuned for shimmer, with a soft felt-mallet attack, a gentle procedural room reverb, and a natural decay of about 8 seconds.
- Simultaneous voices are capped (6 by default). Re-striking a ringing bowl damps it first. A bus compressor keeps rapid playing from building up or clipping, and every stop uses a short fade.
- No sound plays until the first tap, click or key press. Notes fade out when the tab is hidden, when the instrument scrolls out of view, or when the excerpt starts. Muting stays on until the visitor turns it off.
- The bowls never record or store anything, and the site never asks for the microphone.

**iPhone note:** iOS mutes web audio while the ring/silent switch is set to silent. That respects the visitor's setting, but it can make the bowls seem broken. If the band would rather play through the switch, add `if (navigator.audioSession) navigator.audioSession.type = 'playback';` in `audio-engine.js` before the context is created (Safari 17+).

## Photos

The originals live in `content/photos/`, stripped of metadata. `tools/build.mjs` grades and resizes each one into `dist/assets/img/photos/` as WebP at 640, 1024 and up to 1600 px wide, and writes the link-sharing image (`social-preview.jpg`, 1200×630) from the About photo. It applies one muted, warm grade so the photos read as a set, adds light grain to the ensemble shots, and strips all metadata, including any GPS location. The settings are `GRADE` and `SLOTS` near the top of the script. Output file names include a hash of the photo, so a replaced photo is never served from an old cache.

| Slot | Photo now | Where it appears |
| --- | --- | --- |
| Hero | `listening` (rooftop, eyes down) | Side by side at 1200 px and wider, a wide band above the text on smaller screens |
| About | `rooftop` (percussionist facing the room) | About section and social preview |
| Interlude | `lake` | Full width before Booking (decorative) |
| Booking side photo | `leaf` | Beside the booking text on wide screens only (decorative) |
| Mailing list | `winter` (the three of you) | Mailing-list section |

## Graphic score

The site borrows from graphic notation, where music is written as lines and shapes:

- **Staff:** faint, hand-drawn staff lines sit behind the bowls. The bowls rise with pitch, like notes on a staff: in a rising arc on wide screens, and with the two highest bowls on the upper row on phones.
- **Ink traces:** each strike draws a thin wave to the right of the bowl, like time moving across a score. Higher bowls draw tighter waves, and the line fades as the note dies away. Traces are random, so no two are alike. They're capped at 10 at once and skipped when reduced motion is on. The code is `addTrace()` in `assets/js/instrument/instrument.js`.
- **Marks:** the cello is a sustained line, the violin a rising line that settles into vibrato, and the percussion scattered dots. They appear as a key in the About section and combine into one phrase above Booking.

The marks in `assets/img/score/` come from a generator, so they look hand-drawn but are fully reproducible:

```sh
node tools/score-marks.mjs
```

Change a mark's seed in that file to redraw it differently.

## A page composed for each visit

`assets/js/compose.js` runs before the page is first drawn and makes each visit a little different. Nothing moves once the page is showing.

- **Light by time of day**, from the visitor's own clock: morning (5–11) is rosy ivory, afternoon (11–17) the original ivory, evening (17–21) apricot and lavender, and night cool moonlit lavender-blue. Each time of day has its own background, its own five bowl lights, and a faint wash over the photos. The palettes are the `:root[data-tone=…]` blocks at the top of `assets/css/styles.css`. Every text colour passes WCAG AA on every background.
- **A fresh arrangement of the bowls:** the curve of the rising arc, the spacing, the sizes (±5%) and the tints vary on every visit. Bowls always run low to high from left to right, and on phones the two highest stay on the upper row.
- **A footer line** names the arrangement, for example "This page was arranged for your evening, at 7:42 pm."
- **Privacy:** the time never leaves the browser, and the privacy page says so.

To review a specific light or arrangement, add `?tone=dawn` (or `day`, `dusk`, `night`) and/or `&seed=123` to the URL. Without JavaScript, the page uses the afternoon light and a fixed arrangement.

## Analytics

`analytics.send` receives event names only: `instrument_activated` (first bowl only), `booking_form_started`, `booking_inquiry_sent`, `newsletter_signup_sent` and `excerpt_played`. It never receives form contents or email addresses. If analytics is added, mention it on the privacy page.

## Before launch

1. Wordmark or logo, final biography, and the About copy confirmed by the band.
2. Photo credits. The About photo has a credit field in Pages CMS. Confirm the band is happy to publish each photo.
3. A confirmed description of how audience interaction works in person.
4. The booking destination and mailing-list service (the endpoints in `site.config.js`), plus the contact email (Pages CMS → Site and links).
5. Final tuning and sound palette, reviewed with the band.
6. An approved excerpt and credit, if that section is included.
7. Privacy copy updated to name the services actually used (Pages CMS → Privacy page). See the comment in `templates/privacy.html`.
8. Tests on a real iPhone and a real Android device, and a listening session with the band.
