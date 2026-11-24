# Band website specification

Draft v1 · November 24, 2026

Band name: Parallel Wave Ensemble

## 1. Product concept

A simple, spacious website for a band making ethereal, improvisational classical music with cello, violin, and percussion. Each performance takes shape through interaction with the audience; no two performances are the same.

The website gives visitors a small experience of that idea before explaining it. The hero contains five playable, resonant bowls. A visitor touches one, hears a note, and watches a soft ring of light expand and disappear. Additional touches create a brief improvisation. After the last note fades, the page returns to quiet.

The emotional intention is rest, presence, and connection. Express the healing quality through the experience and the band's own language; avoid promises of clinical benefits or special healing frequencies.

**Primary goal:** Generate inquiries to book the band for an experience.

**Secondary goal:** Invite visitors to join the mailing list.

## 2. Confirmed direction and working assumptions

| Item | Direction |
| --- | --- |
| Band sound | Ethereal, improvisational classical music |
| Instruments | Cello, violin, percussion |
| Hero interaction | Tap resonant bowls or chimes |
| Visual mood | Spacious and meditative; soft light and slow movement |
| Main action | Book the band for an experience |
| Secondary action | Join the mailing list |
| Site structure | Proposed: one scrolling page, plus a short privacy page |
| Visitor's improvisation | Proposed: personal and temporary; no recording or shared online performance |
| Reference recording | Supplied by the band; instrument information and musical description supplied by the user. This draft does not claim an auditory review of the file. |

The bowls are an invitation into the band's world. Their final tuning and timbre should be reviewed against the ensemble's actual music. They should complement the cello, violin, and percussion rather than establish a separate musical identity.

## 3. Page structure

| Section | What visitors encounter | Action |
| --- | --- | --- |
| Header | Band name; About and Book links | Reach the booking section immediately |
| Hero | Short introduction and playable bowls | Make a little music or book an experience |
| About the experience | The ensemble, improvisation, and the audience's role | Understand what makes a performance distinctive |
| Optional live excerpt | One approved recording with a simple player | Hear the actual band |
| Booking | Brief invitation and compact inquiry form | Send a booking inquiry |
| Mailing list and footer | Email signup, contact, selected social links, privacy | Stay connected |

Booking must be available without playing the instrument, listening to a recording, or joining the mailing list. Avoid popups and full-screen introductions.

### Hero copy

Eyebrow: **Cello · Violin · Percussion**

Headline: **Music that only happens once.**

Supporting text: **An ethereal, improvised musical experience shaped by the people in the room.**

Instrument instruction: **Touch a bowl. Let it ring.**

Primary button: **Book an experience**

Secondary text link: **Meet the music** — scrolls to the About section.

The hero should show the band's name, its musical identity, at least part of the playable instrument, and a clear booking action in the initial view on a typical mobile screen. Let the content scroll naturally on short screens.

### About copy

**Every room changes the music.**

“Cello, violin, and percussion meet in a performance that takes shape as it unfolds. We listen to one another and to the people gathered with us, allowing the music to move with the moment.

Each performance is an invitation to slow down, listen closely, and share something that will never happen in quite the same way again.”

Pair this with one authentic ensemble photograph when available. Use real instruments and performers to establish the band's identity. Describe any specific audience participation only after the band confirms how it works; do not imply that guests must sing, speak, or perform.

### Optional recording

Heading: **A moment from a performance**

Use one band-approved excerpt, approximately 30–60 seconds, with play/pause, seek, elapsed time, and a clear title. Identify it as a past moment, since future performances differ.

The supplied file is a reference asset, not automatically approved public website content. Keep the section optional until the band selects the excerpt and confirms it can be published. Do not make the recording a download requirement for the homepage.

### Booking copy

Heading: **Make room for something unrepeatable.**

Body: **Tell us about your gathering. We’ll explore what a musical experience could look like together.**

Button: **Send an inquiry**

An inquiry starts a conversation; it does not reserve a date or confirm a booking.

### Mailing-list copy

Heading: **Hear about the next gathering.**

Body: **Occasional notes about performances and new music.**

Button: **Stay in touch**

Keep this invitation quiet and separate from the booking form.

## 4. Playable hero instrument

### Appearance

Show five abstract, shallow bowls as softly lit circles or ellipses. Use a loose arc on wider screens and two staggered rows on mobile. Avoid rigid piano-key styling, realistic 3D rendering, or decorative controls that resemble a music production app.

Each bowl needs a generous touch area. Its visual response should begin immediately on activation: a small change in light followed by a slowly expanding ripple. Overlapping ripples provide a temporary visual trace of the visitor's playing. Return to the original appearance after the sound and ripple fade.

### Playing behavior

- Start in silence. The instruction makes clear that touching a bowl creates sound.
- The first intentional tap, click, or keyboard activation enables audio and plays that bowl. Do not require a separate introductory screen.
- Each activation produces one note. Holding a finger down does not repeatedly strike it.
- Let notes overlap so visitors can create simple phrases and chords.
- Choose five compatible pitches from one pentatonic collection. Prototype the tuning, then finalize its register with the band.
- Keep the timbre warm, resonant, and gently struck, with a soft attack and a natural decay of roughly 6–10 seconds. Avoid piercing transients and continuous bass drones.
- Initial development can use synthesized tones. A later sound-design pass can explore purpose-recorded percussion and cello or violin harmonics. Do not treat those assets as already available.
- Generate no background composition and no automatic response notes in v1. The visitor controls when sound happens.
- Preserve the ephemeral quality through natural decay. No save, replay, score, account, or sharing flow.

The interface should feel welcoming without musical knowledge. Do not display note names, scales, or theory in the main experience.

### Sound controls and interruptions

After audio is activated, show clearly labeled mute/unmute and volume controls. Start at a conservative application volume; device volume still determines the actual listening level.

Explicit mute must remain in effect while visitors keep interacting. Bowls can still respond visually, with a visible “Sound is muted” label. Unmuting does not replay earlier notes.

Fade active notes to silence when the browser tab becomes hidden or the instrument leaves the viewport. Returning does not restart sound; visitors must play again.

If the live excerpt begins playing, fade the instrument out. Activating a bowl while the excerpt is playing pauses the excerpt first. Keep only one sound source active at a time.

Bound simultaneous voices and manage their combined volume so rapid tapping does not create uncontrolled buildup or audible clipping. Use short fades when stopping voices to avoid clicks.

### Failure behavior

If sound initialization fails, retain the visual response and show a concise message: “Sound couldn’t start. Try again.” Provide a retry action. The rest of the page and booking flow must remain usable.

While audio is preparing, give immediate visual feedback and a short loading status. Avoid playing a backlog of taps once initialization finishes.

## 5. Visual direction

The site should feel like entering a quiet performance space: open, human, and attentive.

| Element | Proposed treatment |
| --- | --- |
| Background | Warm ivory, approximately #F5F2EB |
| Main text | Deep charcoal, approximately #2D3434 |
| Secondary surfaces | Pale stone and mist blue |
| Instrument light | Restrained silver, muted lavender, and warm amber |
| Typography | Expressive, readable serif headlines with a plain sans-serif for body text and controls |
| Composition | Wide margins, short passages, generous spacing, few visible elements at once |
| Motion | Slow diffusion and soft fades tied to musical gestures |
| Photography | Authentic, intimate images of the ensemble and instruments |

Treat these colors as art-direction candidates. Verify contrast in the implemented combinations, especially muted labels and buttons. Keep text over a stable surface rather than moving light.

Favor stillness between interactions. Avoid continuous particles, scroll hijacking, flashing effects, and animation that competes with reading.

## 6. Booking and mailing-list behavior

### Booking form

| Field | Requirement |
| --- | --- |
| Name | Required |
| Email | Required |
| Preferred date or timeframe | Optional; accept flexible text |
| Location | Optional |
| Tell us about your gathering | Required multiline field |

Show clear labels, useful validation messages, a submitting state, and a success state only after the configured service accepts the inquiry. Suggested success copy: **“Thank you. We’ve received your inquiry and will be in touch.”** Do not promise a response time until the band chooses one.

On failure, preserve the visitor's entries, offer retry, and show the band's contact email as an alternative. Include basic spam protection without making ordinary visitors solve an unnecessary puzzle.

### Mailing list

Require only an email address. State what subscribers will receive and provide a privacy link. Use an email service with confirmation and unsubscribe support. If confirmation is required, the success state must explain that the visitor needs to check their inbox.

Do not automatically subscribe people who submit a booking inquiry. Keep booking messages and newsletter consent separate.

Both forms require real service connections before launch. A visual prototype must label any nonfunctional form honestly and must not display a false submission success.

## 7. Accessibility and mobile behavior

- Implement the bowls as semantic buttons with individual accessible names, such as “Play bowl one.”
- Support touch, mouse, and keyboard. Enter and Space activate the focused bowl; additional shortcuts are optional.
- Show a visible focus indicator. All actions must work without dragging, hovering, or precise gestures.
- Use touch targets of at least 44 by 44 CSS pixels, with enough separation to avoid accidental strikes.
- Respect reduced-motion preferences: replace expanding ripples and drift with a brief, subtle change in appearance. Retain sound controls and visual activation feedback.
- Present every meaningful message in text. Do not rely on sound or color alone.
- Avoid announcing every note to screen readers; announce relevant loading and form status instead.
- Keep reading, navigation, booking, and signup usable when audio or animation is unavailable.
- Preserve normal page scrolling around the instrument. Support small screens and zoom without horizontal overflow.

## 8. Implementation boundaries

Use semantic page content, lightweight vector or CSS visuals, and a browser audio engine. The particular framework is an implementation choice, not a product requirement.

Render essential content and the booking link before loading optional media. Keep the audio module separate from navigation and forms so an instrument failure does not break the page. Load the live recording only when needed.

Keep band copy, links, sound settings, and service destinations in an easily editable configuration or content file. Keep service credentials on the server. Do not collect microphone input or record visitor performances.

Add a descriptive page title, summary, social preview, and band contact information once the name and assets are available. A custom content-management system is unnecessary for v1.

For measurement, track instrument activation, booking form starts, successful inquiry submissions, and mailing-list confirmations where supported. Keep form contents and email addresses out of analytics events. Track the visitor's first bowl activation rather than every note.

## 9. Acceptance criteria

| Scenario | Expected result |
| --- | --- |
| First arrival | No sound starts automatically; band identity and booking action are immediately understandable |
| First bowl activation | Immediate visual response; audio starts from an intentional gesture, or a clear preparation/retry state appears |
| Several bowls played | Notes overlap and fade naturally; repeated input does not cause uncontrolled volume buildup |
| Silence after playing | Sound ends and temporary visuals disappear without another action |
| Visitor mutes | Active notes fade promptly; later bowl activations do not override mute |
| Visitor changes tabs or scrolls away | Instrument fades out and does not restart automatically |
| Visitor plays the live excerpt | Hero instrument fades out; two sound sources do not compete |
| Keyboard-only visit | Navigation, bowls, controls, and both forms work with clear focus states |
| Reduced motion | Interaction remains understandable without expansive animation |
| Small-screen visit | Layout works at 320 CSS pixels and above without horizontal overflow |
| Successful form submission | Confirm only after service acceptance; deliver to the configured destination |
| Failed submission | Preserve entries, explain the issue, and allow retry |
| Audio unavailable | Band information and both conversion paths remain usable |

Verify these behaviors on desktop and mobile browsers, including at least one real iPhone and Android device. Sound quality and playing feel need a short review with the band before release.

## 10. Delivery scope and remaining inputs

**V1 includes:** The single-page site, five playable bowls, About section, booking inquiry form, mailing-list signup, responsive layouts, accessible controls, and a short privacy page. Include the live excerpt only if its content and publication rights are confirmed.

**Possible later additions:** Band-recorded instrument samples, performance dates, a small press section, or a richer explanation of how the audience shapes a performance. Prioritize these only when real content and visitor needs justify them.

Before launch, obtain:

1. The band's name, logo or preferred wordmark, and final biography.
2. An authentic ensemble photograph and any image credits.
3. A confirmed description of how audience interaction works in person.
4. The booking destination email and mailing-list service.
5. The final instrument tuning and sound palette, reviewed with the band.
6. An approved live excerpt and credit, if that section is included.
7. Final contact links and privacy copy matching the actual services used.

These are content and integration decisions for launch, not prerequisites for designing the first version.
