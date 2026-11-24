// Optional live excerpt. The audio file loads only when a visitor presses play.
import { announceSoundStart, onOtherSoundStart } from './sound-bus.js';
import { track } from './analytics.js';

export function initExcerpt(section, excerpt) {
  if (!excerpt?.src) return;

  const toggle = section.querySelector('[data-excerpt-toggle]');
  const seek = section.querySelector('[data-excerpt-seek]');
  const time = section.querySelector('[data-excerpt-time]');
  const status = section.querySelector('[data-excerpt-status]');

  section.querySelector('[data-excerpt-title]').textContent = excerpt.title || 'Live excerpt';
  section.querySelector('[data-excerpt-credit]').textContent = excerpt.credit || '';
  seek.setAttribute('aria-label', `Seek in ${excerpt.title || 'excerpt'}`);
  section.hidden = false;

  let audio = null;
  let seeking = false;

  function load() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'metadata';
    audio.src = excerpt.src;

    audio.addEventListener('loadedmetadata', () => {
      seek.disabled = false;
      seek.max = String(audio.duration);
      render();
    });
    audio.addEventListener('timeupdate', () => {
      if (!seeking) seek.value = String(audio.currentTime);
      render();
    });
    audio.addEventListener('play', () => {
      announceSoundStart('excerpt');
      track('excerpt_played', { once: true });
      setPlaying(true);
    });
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => setPlaying(false));
    audio.addEventListener('error', () => {
      setPlaying(false);
      status.textContent = 'The recording couldn’t load. Please try again later.';
    });
    return audio;
  }

  toggle.addEventListener('click', () => {
    const a = load();
    status.textContent = '';
    if (a.paused) {
      a.play().catch(() => {
        status.textContent = 'The recording couldn’t play. Please try again.';
      });
    } else {
      a.pause();
    }
  });

  seek.addEventListener('input', () => {
    seeking = true;
    render(Number(seek.value));
  });
  seek.addEventListener('change', () => {
    seeking = false;
    if (audio) audio.currentTime = Number(seek.value);
  });

  // Bowls take over: pause the recording first.
  onOtherSoundStart('excerpt', () => audio?.pause());

  function setPlaying(playing) {
    toggle.toggleAttribute('data-playing', playing);
    toggle.setAttribute('aria-label', playing ? 'Pause excerpt' : 'Play excerpt');
  }

  function render(position) {
    const current = position ?? audio?.currentTime ?? 0;
    const total = audio && Number.isFinite(audio.duration) ? audio.duration : 0;
    time.textContent = total ? `${format(current)} / ${format(total)}` : format(current);
    seek.setAttribute('aria-valuetext', total ? `${format(current)} of ${format(total)}` : format(current));
  }
}

function format(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
