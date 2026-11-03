import { fitCanvas, rng, reducedMotion, isCoarse } from './util.js';

/* Tiny generative sketches used as experiment previews.
   Each draws a static frame; animation runs only on hover/focus/tap. */
const MONO = 'ui-monospace, "Geist Mono", Consolas, monospace';
const SKETCH = {
  // Frog Pond preview: a pixel frog under the moon, snapping at drifting flies.
  frog(ctx, w, h, t) {
    ctx.fillStyle = '#0f1a14'; ctx.fillRect(0, 0, w, h);
    const r = rng('pond');
    ctx.fillStyle = 'rgba(255, 255, 255,0.35)';
    for (let i = 0; i < 40; i++) ctx.fillRect((r() * w) | 0, (r() * h * 0.6) | 0, 1, 1); // stars
    ctx.fillStyle = '#e8e4c8'; ctx.beginPath(); ctx.arc(w * 0.86, h * 0.2, h * 0.09, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#0f1a14'; ctx.beginPath(); ctx.arc(w * 0.88, h * 0.18, h * 0.08, 0, 6.283); ctx.fill();
    const p = Math.max(3, Math.round(h / 34)); // pixel size
    const FROG = ['.GG...GG.', 'GWKG.GWKG', 'GGGGGGGGG', 'GGGGGGGGG', 'GLLLLLLLG', '.GGGGGGG.', 'GG.....GG'];
    const hop = Math.max(0, Math.sin(t * 3)) * p * 2;
    const fx = w * 0.18, fy = h * 0.72 - FROG.length * p - hop;
    const col = { G: '#06df72', W: '#ffffff', K: '#000000', L: '#9df2c6' };
    FROG.forEach((row, y) => [...row].forEach((c, x) => { if (col[c]) { ctx.fillStyle = col[c]; ctx.fillRect(fx + x * p, fy + y * p, p, p); } }));
    ctx.fillStyle = '#023b1f'; ctx.fillRect(fx - p * 2, h * 0.72, p * 13, p); // lily pad
    ctx.fillStyle = '#ff80ea';
    for (let i = 0; i < 4; i++) {
      const a = t * (0.8 + i * 0.3) + i * 2;
      ctx.fillRect(w * (0.45 + i * 0.12) + Math.cos(a) * 14, h * (0.35 + (i % 2) * 0.15) + Math.sin(a * 1.6) * 8, p, p);
    }
    ctx.fillStyle = 'rgba(160,156,255,0.5)';
    ctx.font = `${Math.max(9, p * 2)}px ${MONO}`;
    ctx.fillText('type to feed →', w * 0.45, h * 0.88);
  },
  ascii(ctx, w, h, t) {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, w, h);
    const s = 14, ramp = ' .:-=+*#%@';
    ctx.font = `12px ${MONO}`;
    for (let y = s; y < h; y += s) for (let x = s / 2; x < w; x += s * 0.75) {
      const v = (Math.sin(x * 0.018 + t * 1.2) + Math.cos(y * 0.035 - t * 0.8) + Math.sin((x + y) * 0.01 + t)) / 3;
      const i = Math.max(0, Math.min(ramp.length - 1, ((v + 1) / 2 * ramp.length) | 0));
      ctx.fillStyle = v > 0.55 ? '#06df72' : v > 0.35 ? '#048a4a' : '#3a3a3a';
      ctx.fillText(ramp[i], x, y);
    }
  },
  blocks(ctx, w, h, t) {
    ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, w, h);
    const c = Math.round(w / 12), cols = Math.ceil(w / c), r = rng('blk');
    const cs = ['#ff5500', '#ff80ea', '#ff5500', '#694aff', '#06df72'];
    for (let x = 0; x < cols; x++) {
      const base = 1 + ((r() * 4) | 0);
      const hgt = base + Math.round((Math.sin(t * 1.5 + x * 0.9) + 1) * 1.5);
      for (let y = 0; y < hgt; y++) {
        ctx.fillStyle = (x + y) % 3 === 0 ? cs[(x * 7 + y) % cs.length] : '#1f1f1f';
        ctx.fillRect(x * c + 1, h - (y + 1) * c + 1, c - 2, c - 2);
      }
    }
    const fy = ((t * 120) % (h + c)) - c;
    ctx.fillStyle = '#ff5500';
    [[0, 0], [1, 0], [2, 0], [1, 1]].forEach(([a, b]) => ctx.fillRect((5 + a) * c + 1, fy + b * c + 1, c - 2, c - 2));
  },
  pixels(ctx, w, h, t) {
    const c = 16, r = rng('px');
    const blues = ['#694aff', '#5636e8', '#c4b8ff', '#ebe6ff'], greens = ['#06df72', '#05b862', '#9df2c6', '#d5fbe7'];
    for (let x = 0; x < w; x += c) for (let y = 0; y < h; y += c) {
      const n = y / h + Math.sin(x * 0.03 + t * 0.9) * 0.15 + (r() - 0.5) * 0.3;
      const set = n < 0.5 ? blues : greens;
      ctx.fillStyle = set[(r() * 4) | 0];
      ctx.fillRect(x, y, c, c);
    }
    ctx.fillStyle = '#111'; ctx.font = `11px ${MONO}`;
    ctx.fillRect(18, 26, 8, 8); ctx.fillText('WALKING #5', 32, 34);
  },
  code(ctx, w, h, t) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const lines = ['hue = (t * 20) % 360', 'warp += noise(p) * .02', 'pos = lerp(a, b, k)', 'z = fbm(vec3(p, t))', 'draw(grid)', 'if (near) gather()'];
    const fills = ['#694aff', '#ff5500', '#694aff', '#06df72', '#7a2300', '#ff80ea'];
    ctx.font = `13px ${MONO}`;
    lines.forEach((l, i) => {
      const y = h - 40 - i * 24, shift = Math.sin(t * 2 + i) * 10;
      let x = 20 + i * 34 + shift;
      l.split(' ').forEach((wd, j) => {
        const tw = ctx.measureText(wd + ' ').width + 6;
        ctx.fillStyle = fills[(i + j) % fills.length]; ctx.fillRect(x, y - 15, tw, 20);
        ctx.fillStyle = '#111'; ctx.fillText(wd, x + 3, y);
        x += tw;
      });
    });
  },
  heat(ctx, w, h, t) {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, w, h);
    const s = 14, cx = w / 2 + Math.cos(t * 1.1) * w * 0.25, cy = h / 2 + Math.sin(t * 1.7) * h * 0.2;
    const chars = '#+=:[]{}%$@', r = rng('heat');
    ctx.font = `11px ${MONO}`;
    for (let y = s; y < h; y += s) for (let x = s; x < w; x += s) {
      const d = Math.hypot(x - cx, y - cy), k = r();
      if (d < 70) {
        const hh = 1 - d / 70;
        ctx.fillStyle = hh > 0.7 ? '#ffd9f7' : hh > 0.45 ? '#ff80ea' : hh > 0.2 ? '#ff5500' : '#7a2300';
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = '#111'; ctx.fillText(chars[(k * chars.length) | 0], x - 3, y + 4);
      } else if (k < 0.18) {
        ctx.fillStyle = '#3a3a3a'; ctx.fillText(k < 0.09 ? '#' : '.', x - 3, y + 4);
      }
    }
  },
};

export function initExperiments(container) {
  const reduced = reducedMotion();
  container.querySelectorAll('[data-sketch]').forEach((tile) => {
    const canvas = tile.querySelector('canvas');
    if (!canvas) return; // tiles with a real image/GIF have no sketch to run
    const fn = SKETCH[tile.dataset.sketch] || SKETCH.ascii;
    let ctx, w, h, raf = 0, t0 = 0, t = 0.6;
    const paint = () => fn(ctx, w, h, t);
    const size = () => { ({ ctx, w, h } = fitCanvas(canvas)); paint(); };
    const loop = (now) => { t = 0.6 + (now - t0) / 1000; paint(); raf = requestAnimationFrame(loop); };
    const start = () => { if (reduced || raf) return; t0 = performance.now() - (t - 0.6) * 1000; raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    tile.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && start());
    tile.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && stop());
    tile.addEventListener('focusin', start);
    tile.addEventListener('focusout', stop);
    // no hover on touch screens: each sketch plays while it is on screen
    if (isCoarse()) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(tile);
    new ResizeObserver(size).observe(canvas);
  });
}
