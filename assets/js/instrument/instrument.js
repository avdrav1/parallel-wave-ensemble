// The playable bowls: input handling, visuals, sound controls and status.
import { createAudioEngine } from './audio-engine.js';
import { announceSoundStart, onOtherSoundStart } from '../sound-bus.js';
import { track } from '../analytics.js';

const MAX_RIPPLES = 24;
const FIRST_NOTE_WINDOW = 700; // ms — play the first tap only if audio was ready this quickly

export function initInstrument(root, settings) {
  const engine = createAudioEngine(settings);
  const notes = settings.notes;
  const decayMs = (settings.decaySeconds ?? 8) * 1000;

  const bowls = [...root.querySelectorAll('[data-bowl]')];
  const rippleLayer = root.querySelector('[data-ripples]');
  const statusEl = root.querySelector('[data-instrument-status]');
  const retryButton = root.querySelector('[data-instrument-retry]');
  const mutedLabel = root.querySelector('[data-instrument-muted]');
  const controls = root.querySelector('[data-sound-controls]');
  const muteButton = root.querySelector('[data-mute]');
  const volumeInput = root.querySelector('[data-volume]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 'idle' → 'preparing' → 'ready' | 'failed'
  let state = 'idle';
  let statusTimer = 0;
  // Bowls already struck on mouse/pen press; their following click is skipped.
  const pressed = new Set();

  volumeInput.value = String(Math.round(engine.volume * 100));

  // Input ----------------------------------------------------------------

  for (const bowl of bowls) {
    const index = Number(bowl.dataset.bowl);

    // Mouse and pen strike on press, for immediacy. Touch waits for the tap to
    // complete so a swipe that starts on a bowl still scrolls the page.
    bowl.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      pressed.add(index);
      activate(index);
    });

    // Enter / Space, ignoring key repeat while held.
    bowl.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) activate(index);
    });
    bowl.addEventListener('keyup', (event) => {
      if (event.key === ' ') event.preventDefault();
    });

    // Touch taps and assistive-technology activations arrive as clicks.
    bowl.addEventListener('click', () => {
      if (pressed.delete(index)) return;
      activate(index);
    });
    bowl.addEventListener('pointercancel', () => pressed.delete(index));
    bowl.addEventListener('pointerleave', () => pressed.delete(index));
  }

  function activate(index) {
    track('instrument_activated', { once: true });
    showStrike(index);
    announceSoundStart('instrument');

    if (state === 'idle') {
      prepare(index);
    } else if (state === 'ready') {
      if (engine.isRunning()) {
        engine.strike(index, notes[index]);
      } else {
        // The browser suspended audio (tab switch, phone call). Resume from this
        // gesture; don't play late if it takes a while.
        const started = performance.now();
        engine.ensureRunning().then((ok) => {
          if (!ok) return fail();
          if (performance.now() - started < FIRST_NOTE_WINDOW) engine.strike(index, notes[index]);
        });
      }
    }
    // 'preparing' and 'failed': visual response only — no backlog of notes.
  }

  // Audio start-up ----------------------------------------------------------

  function prepare(firstIndex) {
    state = 'preparing';
    retryButton.hidden = true;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => setStatus('Preparing sound…'), 150);
    const started = performance.now();

    let starting;
    try {
      starting = engine.start();
    } catch (error) {
      starting = Promise.reject(error);
    }

    starting
      .then(() => {
        clearTimeout(statusTimer);
        state = 'ready';
        setStatus('');
        controls.hidden = false;
        if (firstIndex != null && performance.now() - started < FIRST_NOTE_WINDOW) {
          engine.strike(firstIndex, notes[firstIndex]);
        } else if (firstIndex == null) {
          setStatus('Sound is ready.');
          statusTimer = setTimeout(() => setStatus(''), 2500);
        }
      })
      .catch(fail);
  }

  function fail() {
    clearTimeout(statusTimer);
    state = 'failed';
    setStatus('Sound couldn’t start.');
    retryButton.hidden = false;
  }

  retryButton.addEventListener('click', () => prepare(null));

  function setStatus(text) {
    statusEl.textContent = text;
  }

  // Controls ----------------------------------------------------------------

  muteButton.addEventListener('click', () => {
    const muted = !engine.muted;
    engine.setMuted(muted);
    muteButton.setAttribute('aria-pressed', String(muted));
    muteButton.textContent = muted ? 'Unmute' : 'Mute';
    mutedLabel.hidden = !muted;
  });

  volumeInput.addEventListener('input', () => {
    engine.setVolume(Number(volumeInput.value) / 100);
  });

  // Interruptions -----------------------------------------------------------

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) engine.stopAll(0.4);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) if (!entry.isIntersecting) engine.stopAll(0.8);
    }).observe(root);
  }

  onOtherSoundStart('instrument', () => engine.stopAll(0.6));

  // Visuals -----------------------------------------------------------------

  function showStrike(index) {
    const bowl = bowls[index];
    const glow = bowl.querySelector('.bowl__glow');
    const ringMs = engine.muted || state !== 'ready' ? Math.min(decayMs, 3500) : decayMs;

    if (reducedMotion.matches) {
      glow.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 1200, easing: 'ease-out' });
      return;
    }

    glow.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0.9, offset: 0.015 },
        { opacity: 0.35, offset: 0.25 },
        { opacity: 0 },
      ],
      { duration: ringMs, easing: 'ease-out' },
    );
    bowl.querySelector('.bowl__body').animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }],
      { duration: 500, easing: 'ease-out' },
    );

    addRipple(bowl, ringMs * 0.85, 0);
    addRipple(bowl, ringMs * 0.75, 380);
  }

  function addRipple(bowl, duration, delay) {
    const layer = rippleLayer.getBoundingClientRect();
    const body = bowl.querySelector('.bowl__body').getBoundingClientRect();
    const width = body.width;
    const height = body.height;
    const x = body.left - layer.left + width / 2;
    const y = body.top - layer.top + height / 2;

    const ring = document.createElement('span');
    ring.className = 'ripple';
    ring.style.setProperty('--tint', getComputedStyle(bowl).getPropertyValue('--tint'));
    ring.style.width = `${width}px`;
    ring.style.height = `${height}px`;
    ring.style.left = `${x - width / 2}px`;
    ring.style.top = `${y - height / 2}px`;
    rippleLayer.append(ring);

    while (rippleLayer.childElementCount > MAX_RIPPLES) rippleLayer.firstElementChild.remove();

    const animation = ring.animate(
      [
        { transform: 'scale(0.9)', opacity: 0 },
        { transform: 'scale(1.05)', opacity: 0.75, offset: 0.04 },
        { transform: 'scale(3.4)', opacity: 0 },
      ],
      { duration, delay, easing: 'cubic-bezier(.15,.55,.3,1)', fill: 'both' },
    );
    animation.onfinish = () => ring.remove();
  }
}
