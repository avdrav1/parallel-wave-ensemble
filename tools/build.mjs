#!/usr/bin/env node
// Builds the public site into dist/ from templates/ and content/.
//
//   node tools/build.mjs
//
// The words and photos the band edits (directly or through Pages CMS) live in
// content/*.json and content/photos/. This script checks them, escapes every
// value so no text can inject markup, grades and resizes the photos with
// ImageMagick (stripping all metadata, including GPS location), and writes a
// static site. If anything required is missing it stops with a message and
// writes nothing, so the live site keeps its last good version.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const CACHE = join(ROOT, '.cache', 'photos');

// --- Content ---------------------------------------------------------------

const errors = [];
const fail = (msg) => errors.push(msg);

function load(name) {
  const file = join(ROOT, 'content', `${name}.json`);
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`content/${name}.json can't be read: ${error.message}`);
    return {};
  }
}

const content = { ...load('home'), privacy: load('privacy'), site: load('site') };

const get = (path) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), content);
const text = (v) => (typeof v === 'string' ? v.trim() : '');

// Fields the page needs, with the most characters each may hold.
const REQUIRED = {
  'meta.title': 80, 'meta.description': 300,
  'hero.title': 50, 'hero.lede': 180, 'hero.bookLabel': 30, 'hero.aboutLabel': 30,
  'hero.photo': 0, 'hero.photoAlt': 300,
  'about.heading': 80, 'about.text': 2000, 'about.photo': 0, 'about.photoAlt': 300,
  'interlude.photo': 0,
  'booking.heading': 80, 'booking.intro': 400, 'booking.photo': 0,
  'newsletter.heading': 80, 'newsletter.intro': 300, 'newsletter.photo': 0, 'newsletter.photoAlt': 300,
  'privacy.intro': 600, 'privacy.updated': 40,
};
const OPTIONAL = {
  'meta.shareTitle': 100, 'meta.shareDescription': 300, 'about.photoCredit': 120,
  'booking.smallPrint': 300, 'excerpt.heading': 80, 'excerpt.note': 200,
};
for (const [path, max] of Object.entries({ ...REQUIRED, ...OPTIONAL })) {
  const v = get(path);
  if (v != null && typeof v !== 'string') fail(`${path} must be text`);
  else if (path in REQUIRED && !text(v)) fail(`${path} is empty`);
  else if (max && text(v).length > max) fail(`${path} is ${text(v).length} characters; keep it to ${max}`);
}
// Link previews fall back to the page's own title and description.
if (content.meta) {
  content.meta.shareTitle = text(content.meta.shareTitle) || content.meta.title;
  content.meta.shareDescription = text(content.meta.shareDescription) || content.meta.description;
}

const sections = get('privacy.sections');
if (!Array.isArray(sections) || !sections.length) fail('privacy.sections needs at least one section');
else sections.forEach((s, i) => {
  if (!text(s?.heading)) fail(`privacy section ${i + 1} has no heading`);
  if (!text(s?.text)) fail(`privacy section ${i + 1} has no text`);
});

// Site settings: contact, links and the excerpt recording.
const site = content.site;
const contactEmail = text(site.contactEmail);
if (contactEmail && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(contactEmail)) fail(`contactEmail "${contactEmail}" isn't an email address`);
const social = [];
for (const [i, link] of (Array.isArray(site.social) ? site.social : []).entries()) {
  const label = text(link?.label), url = text(link?.url);
  if (!label || !url) { fail(`social link ${i + 1} needs both a label and a web address`); continue; }
  if (!/^https?:\/\/[^\s<>"]+$/.test(url)) { fail(`social link "${label}" must start with https://`); continue; }
  social.push({ label, url });
}

// A path the CMS stored, checked to stay inside its own folder.
function mediaPath(value, folder, what) {
  const raw = text(value).replace(/^\/+/, '');
  const rel = normalize(raw);
  if (!raw || !rel.startsWith(`${folder}/`) || rel.includes('..')) { fail(`${what}: "${raw}" must be a file in ${folder}/`); return null; }
  if (!existsSync(join(ROOT, rel))) { fail(`${what}: ${rel} doesn't exist`); return null; }
  return rel;
}

let excerpt = null;
if (site.excerpt?.enabled) {
  const audio = mediaPath(site.excerpt.audio, 'content/audio', 'excerpt recording');
  if (!text(site.excerpt.title)) fail('the excerpt is turned on but has no title');
  if (!text(get('excerpt.heading'))) fail('the excerpt is turned on but excerpt.heading is empty');
  if (audio) excerpt = { src: audio, title: text(site.excerpt.title), credit: text(site.excerpt.credit) };
}

// --- Photos ------------------------------------------------------------------

// One warm, slightly matte grade so every photo reads as part of a set:
// muted colour, warm highlights, lifted blacks. Metadata (incl. GPS) is stripped.
const GRADE = [
  '-modulate', '102,70,100',
  '-channel', 'R', '-evaluate', 'multiply', '1.03', '-channel', 'B', '-evaluate', 'multiply', '0.93', '+channel',
  '-sigmoidal-contrast', '2,45%',
  '+level', '6%,97%',
];
const PEOPLE = { quality: 74, grain: 0.12, widths: [640, 1024, 1600] };
const NATURE = { quality: 64, grain: 0, widths: [640, 1024, 1600] };

// Where each photo appears and how it loads. Alt text comes from content.
const SLOTS = {
  hero: { ...PEOPLE, path: 'hero.photo', alt: 'hero.photoAlt', sizes: '(min-width: 1200px) 55vw, 100vw', extra: 'fetchpriority="high"' },
  about: { ...PEOPLE, path: 'about.photo', alt: 'about.photoAlt', sizes: '(min-width: 900px) 40vw, 100vw', extra: 'loading="lazy" decoding="async"' },
  interlude: { ...NATURE, path: 'interlude.photo', sizes: '100vw', extra: 'loading="lazy" decoding="async"' },
  leaf: { ...NATURE, quality: 62, widths: [640, 1024], path: 'booking.photo', className: 'booking__leaf', sizes: '(min-width: 960px) 24rem, 0px', extra: 'loading="lazy" decoding="async"' },
  newsletter: { ...PEOPLE, path: 'newsletter.photo', alt: 'newsletter.photoAlt', sizes: '(min-width: 900px) 40vw, 100vw', extra: 'loading="lazy" decoding="async"' },
};
for (const slot of Object.values(SLOTS)) slot.source = mediaPath(get(slot.path), 'content/photos', slot.path);

if (errors.length) {
  console.error(`The site wasn't built. Fix these in content/ (or in Pages CMS):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}

// ImageMagick 7 is `magick`; Ubuntu's ImageMagick 6 is `convert` and `identify`.
const IM7 = (() => { try { execFileSync('magick', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const convert = (args) => execFileSync(IM7 ? 'magick' : 'convert', args, { stdio: ['ignore', 'ignore', 'inherit'] });
const identify = (file, format) => execFileSync(IM7 ? 'magick' : 'identify', [...(IM7 ? ['identify'] : []), '-format', format, file]).toString().trim();

mkdirSync(CACHE, { recursive: true });
const RECIPE = JSON.stringify(GRADE) + '|v1';
const hashOf = (file, settings) => createHash('sha256').update(readFileSync(file)).update(RECIPE + JSON.stringify(settings)).digest('hex').slice(0, 10);

function processPhoto(name, slot) {
  const file = join(ROOT, slot.source);
  const key = hashOf(file, [slot.quality, slot.grain, slot.widths]);
  // Width after applying the camera's rotation, so portrait phone photos size correctly.
  const srcWidth = Number(execFileSync(IM7 ? 'magick' : 'convert', [file, '-auto-orient', '-format', '%w', 'info:']).toString());
  const widths = [...new Set(slot.widths.map((w) => Math.min(w, srcWidth)))];
  const files = [];
  for (const w of widths) {
    const out = `${name}-${key}-${w}.webp`;
    const cached = join(CACHE, out);
    if (!existsSync(cached)) {
      convert([file, '-auto-orient', '-strip', '-colorspace', 'sRGB', ...GRADE,
        '-resize', `${w}x>`, '-attenuate', String(slot.grain), '+noise', 'Gaussian',
        '-quality', String(slot.quality), '-define', 'webp:method=6', cached]);
      console.log(`  photo  ${out}`);
    }
    files.push({ w, out, cached });
  }
  const largest = files.at(-1);
  const [width, height] = identify(largest.cached, '%w %h').split(' ').map(Number);
  return { files, width, height, key };
}

function socialPreview(slot) {
  const file = join(ROOT, slot.source);
  const out = join(CACHE, `social-${hashOf(file, 'social')}.jpg`);
  if (!existsSync(out)) {
    convert([file, '-auto-orient', '-strip', ...GRADE, '-resize', '1200x', '-gravity', 'center',
      '-crop', '1200x630+0+0', '+repage', '-quality', '82', out]);
    console.log('  photo  social preview');
  }
  return out;
}

// --- Output -----------------------------------------------------------------

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paragraphs = (v, indent) => text(v).split(/\n\s*\n/).map((p) => `<p>${esc(p.replace(/\s*\n\s*/g, ' '))}</p>`).join(`\n${indent}`);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets', 'img', 'photos'), { recursive: true });
cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });
copyFileSync(join(ROOT, 'site.config.js'), join(DIST, 'site.config.js'));

const photos = {};
for (const [name, slot] of Object.entries(SLOTS)) {
  photos[name] = processPhoto(name, slot);
  for (const f of photos[name].files) copyFileSync(f.cached, join(DIST, 'assets', 'img', 'photos', f.out));
}
copyFileSync(socialPreview(SLOTS.about), join(DIST, 'assets', 'img', 'social-preview.jpg'));

if (excerpt) {
  mkdirSync(join(DIST, dirname(excerpt.src)), { recursive: true });
  copyFileSync(join(ROOT, excerpt.src), join(DIST, excerpt.src));
}

function photoTag(name, indent) {
  const slot = SLOTS[name], p = photos[name];
  const url = (f) => `assets/img/photos/${f.out}`;
  const mid = p.files.find((f) => f.w === 1024) || p.files.at(-1);
  const alt = slot.alt ? esc(text(get(slot.alt))) : '';
  return [
    `<img${slot.className ? ` class="${slot.className}"` : ''} srcset="${p.files.map((f) => `${url(f)} ${f.w}w`).join(', ')}"`,
    `     sizes="${slot.sizes}"`,
    `     src="${url(mid)}" width="${p.width}" height="${p.height}" ${slot.extra}`,
    `     alt="${alt}">`,
  ].join(`\n${indent}`);
}

function render(template) {
  const src = readFileSync(join(ROOT, 'templates', template), 'utf8');
  // Line by line, so multi-line output keeps the placeholder's indent.
  return src.split('\n').map((line) => {
    const indent = line.match(/^[ \t]*/)[0];
    return line.replace(/\{\{\s*(?:(\w+)\s+)?([\w.]+)\s*\}\}/g, (_, helper, path) => {
      switch (helper) {
        case undefined: {
          const v = get(path);
          if (typeof v !== 'string') throw new Error(`${template}: {{${path}}} has no text in content`);
          return esc(text(v));
        }
        case 'paragraphs': return paragraphs(get(path), indent);
        case 'photo': return photoTag(path, indent);
        case 'caption': return text(get(path)) ? `\n${indent}<figcaption>${esc(text(get(path)))}</figcaption>` : '';
        case 'sections': return get(path).map((s) =>
          `    <h2>${esc(text(s.heading))}</h2>\n    ${paragraphs(s.text, '    ')}`).join('\n\n');
        default: throw new Error(`${template}: unknown helper {{${helper} ${path}}}`);
      }
    });
  }).join('\n');
}

for (const page of ['index.html', 'privacy.html']) {
  const html = render(page);
  if (/\{\{/.test(html)) throw new Error(`${page}: a placeholder was left unfilled`);
  writeFileSync(join(DIST, page), html);
}

// Settings the page's scripts read (footer links, the excerpt player).
writeFileSync(join(DIST, 'assets', 'js', 'site-content.js'),
  `// Generated by tools/build.mjs from content/site.json.\nexport default ${JSON.stringify({ contactEmail, social, excerpt }, null, 2)};\n`);

console.log(`Built dist/ (${Object.keys(photos).length} photos, excerpt ${excerpt ? 'on' : 'off'}).`);
