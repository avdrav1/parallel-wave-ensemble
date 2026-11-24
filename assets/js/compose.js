// Composes the page for this visit before it is first drawn: the light follows
// the visitor's time of day, and the bowls get a fresh contour, spacing, size
// and tint. Nothing moves afterwards. Nothing here leaves the browser.
//
// Loaded as a small blocking script in <head> so the first paint is already
// composed. For review, append ?tone=dawn|day|dusk|night and/or &seed=<number>
// to the URL to see a specific light or arrangement.
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var now = new Date();
  var hour = now.getHours();

  var tone = params.get('tone');
  var chosen = /^(dawn|day|dusk|night)$/.test(tone || '');
  if (!chosen) {
    tone = hour >= 5 && hour < 11 ? 'dawn' : hour >= 11 && hour < 17 ? 'day' : hour >= 17 && hour < 21 ? 'dusk' : 'night';
  }
  // The words follow the clock; the light buckets above are a little wider.
  var label = chosen
    ? { dawn: 'morning', day: 'afternoon', dusk: 'evening', night: 'night' }[tone]
    : hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'night';

  var seed = Number(params.get('seed')) >>> 0;
  if (!seed) {
    try { seed = crypto.getRandomValues(new Uint32Array(1))[0]; } catch (e) { seed = (Math.random() * 4294967296) >>> 0; }
  }
  var rand = (function (s) {
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(seed);
  var spread = function (n) { return (rand() * 2 - 1) * n; };

  root.dataset.tone = tone;
  var style = root.style;

  // Tints: the five lights of this time of day, shuffled across the bowls.
  var lights = [1, 2, 3, 4, 5];
  for (var i = lights.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var tmp = lights[i]; lights[i] = lights[j]; lights[j] = tmp;
  }

  // Wide screens: a rising line, bent up or down a little each visit.
  var bend = spread(16);
  // Phones: two rows, low three below and high two above, nudged a little.
  var narrowBase = [8, 0, -8, 4, -6];
  var sizes = [1, 0.93, 0.86, 0.8, 0.74];

  for (var b = 0; b < 5; b++) {
    style.setProperty('--bowl-tint-' + b, 'var(--tone-' + lights[b] + ')');
    style.setProperty('--bowl-size-' + b, (sizes[b] * (0.95 + rand() * 0.1)).toFixed(3));
    style.setProperty('--bowl-dy-wide-' + b, (40 - b * 15 + bend * Math.sin((Math.PI * b) / 4) + spread(5)).toFixed(1) + 'px');
    style.setProperty('--bowl-dx-wide-' + b, spread(8).toFixed(1) + 'px');
    style.setProperty('--bowl-dy-narrow-' + b, (narrowBase[b] + spread(5)).toFixed(1) + 'px');
    style.setProperty('--bowl-dx-narrow-' + b, spread(6).toFixed(1) + 'px');
  }

  var themeColor = { dawn: '#F8EEEA', day: '#F5F2EB', dusk: '#F6EADD', night: '#ECEBF2' }[tone];
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', themeColor);

  window.pweComposition = { tone: tone, label: label, seed: seed, time: now, chosen: chosen };
})();
