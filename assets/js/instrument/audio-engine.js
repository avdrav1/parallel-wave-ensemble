// Synthesized struck-bowl voices for the hero instrument.
//
// Signal path:  voice → bus ─┬─ dry ────────┐
//                            └─ reverb → wet ┴→ compressor → master (volume/mute) → speakers
//
// Each voice is a few sine partials (slightly inharmonic, like a bowl) with a
// soft mallet attack and a long natural decay. Voices are bounded and fade out
// with short ramps so stopping never clicks.

const PARTIALS = [
  // ratio to the fundamental, relative level, decay relative to the fundamental
  { ratio: 1, level: 1, decay: 1, beat: 0.7 },
  { ratio: 2.005, level: 0.16, decay: 0.7, beat: 1.1 },
  { ratio: 2.76, level: 0.2, decay: 0.5, beat: 1.6 },
  { ratio: 5.1, level: 0.06, decay: 0.28, beat: 2.3 },
];

const ATTACK = 0.025; // seconds — soft, no piercing transient
const SILENCE = 6.9; // time constants until −60 dB

export function createAudioEngine(settings) {
  const {
    decaySeconds = 8,
    defaultVolume = 0.5,
    maxVoices = 6,
    reverb: reverbAmount = 0.3,
  } = settings;

  let ctx = null;
  let bus, master;
  let volume = clamp(defaultVolume, 0, 1);
  let muted = false;
  const voices = [];

  function supported() {
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  // Must be called from a user gesture. The context is created synchronously
  // (before the first await) so browsers count it as user-initiated.
  async function start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Web Audio is not supported');
    if (ctx && ctx.state === 'closed') ctx = null;
    if (!ctx) {
      ctx = new AC({ latencyHint: 'interactive' });
      buildGraph();
    }
    if (ctx.state !== 'running') {
      await withTimeout(ctx.resume(), 3000);
    }
    if (ctx.state !== 'running') throw new Error(`Audio context is ${ctx.state}`);
  }

  function isRunning() {
    return Boolean(ctx && ctx.state === 'running');
  }

  // Resume after the browser suspended audio (e.g. iOS interruptions).
  // Call from a gesture; resolves true when sound is available again.
  async function ensureRunning() {
    if (isRunning()) return true;
    try {
      await start();
      return true;
    } catch {
      return false;
    }
  }

  function buildGraph() {
    bus = ctx.createGain();
    bus.gain.value = 1;

    const dry = ctx.createGain();
    dry.gain.value = 0.85;

    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(ctx, 3.4);
    const wet = ctx.createGain();
    wet.gain.value = clamp(reverbAmount, 0, 1) * 0.9;

    // Gentle bus limiting so rapid playing can't build up or clip.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 12;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.35;

    master = ctx.createGain();
    master.gain.value = targetMasterGain();

    bus.connect(dry).connect(compressor);
    bus.connect(convolver).connect(wet).connect(compressor);
    compressor.connect(master).connect(ctx.destination);
  }

  function targetMasterGain() {
    // Perceptual curve: slider position squared.
    return muted ? 0 : volume * volume * 0.9;
  }

  function applyMaster(time = 0.08) {
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(targetMasterGain(), now, time / 3);
  }

  function strike(index, frequency) {
    if (!isRunning() || muted) return;
    const now = ctx.currentTime + 0.01;

    prune(now);
    // Re-striking a ringing bowl damps it first, as a hand would.
    voices.filter((v) => v.index === index).forEach((v) => release(v, 0.12));
    while (voices.length >= maxVoices) release(voices[0], 0.15);

    // Lower bowls ring a little longer.
    const decay = decaySeconds * (1.12 - index * 0.06);
    const level = 0.32 / Math.sqrt(1 + voices.length * 0.5);

    const out = ctx.createGain();
    out.gain.value = level;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = Math.min(4200, frequency * 9);
    tone.Q.value = 0.3;
    tone.connect(out).connect(bus);

    const sources = [];
    const end = now + decay + 0.2;

    for (const p of PARTIALS) {
      const tau = (decay * p.decay) / SILENCE;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(p.level, now + ATTACK * (p.ratio > 2 ? 0.7 : 1));
      env.gain.setTargetAtTime(0, now + ATTACK, tau);
      env.connect(tone);

      // Two slightly detuned oscillators per partial give a slow shimmer.
      for (const offset of [-p.beat / 2, p.beat / 2]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency * p.ratio + offset;
        const half = ctx.createGain();
        half.gain.value = 0.5;
        osc.connect(half).connect(env);
        osc.start(now);
        osc.stop(Math.min(end, now + decay * p.decay + 0.3));
        sources.push(osc);
      }
    }

    // A soft felt-mallet touch: a brief, low, filtered breath of noise.
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 900;
    const noiseEnv = ctx.createGain();
    noiseEnv.gain.setValueAtTime(0, now);
    noiseEnv.gain.linearRampToValueAtTime(0.05, now + 0.006);
    noiseEnv.gain.setTargetAtTime(0, now + 0.006, 0.02);
    noise.connect(noiseFilter).connect(noiseEnv).connect(out);
    noise.start(now);
    noise.stop(now + 0.2);
    sources.push(noise);

    const voice = { index, out, sources, end, released: false };
    voices.push(voice);

    let remaining = sources.length;
    for (const s of sources) {
      s.onended = () => {
        remaining -= 1;
        if (remaining === 0) {
          out.disconnect();
          const i = voices.indexOf(voice);
          if (i !== -1) voices.splice(i, 1);
        }
      };
    }
  }

  function release(voice, fade) {
    const i = voices.indexOf(voice);
    if (i !== -1) voices.splice(i, 1);
    if (voice.released || !ctx) return;
    voice.released = true;
    const now = ctx.currentTime;
    const g = voice.out.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + fade);
    for (const s of voice.sources) {
      try {
        s.stop(now + fade + 0.05);
      } catch {
        // Already stopped.
      }
    }
  }

  function prune(now) {
    for (const v of [...voices]) if (v.end <= now) voices.splice(voices.indexOf(v), 1);
  }

  // Fade every ringing bowl to silence.
  function stopAll(fade = 0.6) {
    for (const v of [...voices]) release(v, fade);
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (muted) stopAll(0.25);
    applyMaster();
  }

  function setVolume(value) {
    volume = clamp(value, 0, 1);
    applyMaster();
  }

  return {
    supported,
    start,
    ensureRunning,
    isRunning,
    strike,
    stopAll,
    setMuted,
    setVolume,
    get muted() {
      return muted;
    },
    get volume() {
      return volume;
    },
  };
}

// Procedural room: decaying stereo noise, darkened over time.
function makeImpulse(ctx, seconds) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // One-pole low-pass whose cutoff falls over time: brighter early reflections, darker tail.
      const smooth = 0.2 + t * 0.7;
      last = last * smooth + (Math.random() * 2 - 1) * (1 - smooth);
      data[i] = last * Math.pow(1 - t, 2.4) * (i < rate * 0.012 ? i / (rate * 0.012) : 1);
    }
  }
  return buffer;
}

let sharedNoise = null;
function noiseBuffer(ctx) {
  if (sharedNoise && sharedNoise.sampleRate === ctx.sampleRate) return sharedNoise;
  const length = Math.floor(ctx.sampleRate * 0.2);
  sharedNoise = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = sharedNoise.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return sharedNoise;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms)),
  ]);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, Number(n) || 0));
}
