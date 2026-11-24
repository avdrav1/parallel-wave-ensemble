// Generates the hand-drawn graphic-score marks in assets/img/score/.
// Run: node tools/score-marks.mjs
// Each mark is drawn from a seeded random wobble, so the output is stable
// between runs. Change a SEED to redraw that mark differently.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../assets/img/score');
const INK = '#2D3434';
mkdirSync(OUT, { recursive: true });

// Small seeded PRNG (mulberry32).
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A smooth hand tremor: a few slow sine waves with random phases.
function tremor(rand, amount, waves = 4) {
  const parts = Array.from({ length: waves }, (_, i) => ({
    f: 0.6 + i * 1.7 + rand() * 1.5,
    p: rand() * Math.PI * 2,
    a: amount / (i + 1),
  }));
  return (t) => parts.reduce((sum, w) => sum + w.a * Math.sin(2 * Math.PI * w.f * t + w.p), 0);
}

const r1 = (n) => Math.round(n * 10) / 10;

// A filled, tapered stroke along a centreline — like a pen with varying pressure.
function inkStroke(points, width) {
  const left = [], right = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    const [ax, ay] = points[Math.max(0, i - 1)];
    const [bx, by] = points[Math.min(points.length - 1, i + 1)];
    let nx = -(by - ay), ny = bx - ax;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const w = width(i / (points.length - 1)) / 2;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  }
  const pts = [...left, ...right.reverse()];
  return `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`;
}

// A slightly irregular dot, like a mallet mark.
function inkDot(rand, cx, cy, r) {
  const n = 14, pts = [];
  const wob = tremor(rand, r * 0.12, 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + wob(i / n);
    pts.push([cx + Math.cos(a) * rr * 1.08, cy + Math.sin(a) * rr]);
  }
  return `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`;
}

function sample(from, to, fn, step = 2) {
  const pts = [];
  for (let x = from; x <= to; x += step) pts.push(fn(x, (x - from) / (to - from)));
  return pts;
}

const svg = (w, h, paths, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="${INK}"${extra}>${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>\n`;

// Cello: one long sustained line that swells and thins.
function cello(seed = 11) {
  const rand = rng(seed), wob = tremor(rand, 2.4);
  const pts = sample(6, 594, (x, t) => [x, 20 + wob(t)]);
  return svg(600, 40, [inkStroke(pts, (t) => 0.6 + 5.6 * Math.pow(Math.sin(Math.PI * t), 0.5) * (1 - 0.45 * t))]);
}

// Violin: a rising glissando that settles into vibrato.
function violin(seed = 23) {
  const rand = rng(seed), wob = tremor(rand, 1.4);
  const pts = sample(6, 594, (x, t) => {
    const rise = 33 - 24 * (t * t * (3 - 2 * t));
    const vib = t > 0.5 ? 5.5 * Math.sin(2 * Math.PI * 8 * t) * Math.min(1, (t - 0.5) * 4) * (1.2 - t) : 0;
    return [x, rise + vib + wob(t)];
  });
  return svg(600, 40, [inkStroke(pts, (t) => 0.5 + 3.4 * Math.pow(Math.sin(Math.PI * t), 0.5))]);
}

// Percussion: irregular dots, a few accented.
function percussion(seed = 37) {
  const rand = rng(seed), dots = [];
  let x = 14;
  while (x < 586) {
    const accent = rand() < 0.22;
    dots.push(inkDot(rand, x, 20 + (rand() - 0.5) * 10, accent ? 5.6 + rand() * 1.4 : 2 + rand() * 2));
    x += 26 + rand() * 46;
  }
  return svg(600, 40, dots);
}

// The ensemble as one phrase: dots gather into a line, the line lifts into
// a wavering curve, and the curve thins away into a last few dots.
function phrase(seed = 53) {
  const rand = rng(seed), paths = [];
  let x = 18;
  while (x < 230) {
    const t = (x - 18) / 212;
    paths.push(inkDot(rand, x, 66 + (rand() - 0.5) * 10, 1.8 + rand() * 3.6 * (1 - t * 0.5)));
    x += 30 - t * 18 + rand() * 10;
  }
  const wob = tremor(rand, 2.6);
  const line = sample(222, 1120, (px, t) => {
    const lift = t < 0.34 ? 0 : -46 * Math.pow((t - 0.34) / 0.66, 1.3);
    const vib = t > 0.58 ? 7 * Math.sin(2 * Math.PI * 22 * t) * Math.min(1, (t - 0.58) * 5) * (1.08 - t) : 0;
    return [px, 66 + lift + vib + wob(t)];
  });
  paths.push(inkStroke(line, (t) => 0.5 + 6 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.2)), 0.55) * (1 - 0.65 * t)));
  for (const [dx, dy, r] of [[1140, 20, 2.2], [1160, 15, 1.6], [1178, 12, 1.1]]) paths.push(inkDot(rand, dx, dy, r));
  return svg(1200, 90, paths);
}

// Staff: five faint hand-drawn lines. Stretched to fit with a constant line width.
function staff(seed = 71) {
  const rand = rng(seed), lines = [];
  for (let i = 0; i < 5; i++) {
    const wob = tremor(rand, 1.1, 3);
    const x0 = 4 + rand() * 30, x1 = 966 + rand() * 30, y = 30 + i * 35;
    const pts = sample(x0, x1, (x, t) => [x, y + wob(t)], 8);
    lines.push(`<path d="M${pts.map(([px, py]) => `${r1(px)} ${r1(py)}`).join('L')}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200" preserveAspectRatio="none" fill="none" stroke="${INK}" stroke-opacity=".17" stroke-width="1" stroke-linecap="round" vector-effect="non-scaling-stroke"><g vector-effect="non-scaling-stroke">${lines.join('').replaceAll('<path ', '<path vector-effect="non-scaling-stroke" ')}</g></svg>\n`;
}

const files = { 'cello.svg': cello(), 'violin.svg': violin(), 'percussion.svg': percussion(), 'phrase.svg': phrase(), 'staff.svg': staff() };
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`${name.padEnd(16)} ${content.length} bytes`);
}
