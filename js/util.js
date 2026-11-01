// Palette: purple, pink, orange and green on true black and white.
export const COLORS = {
  dark: '#000000',
  ink: '#000000',
  paper: '#ffffff',
  purple: '#694aff', pink: '#ff80ea', orange: '#ff5500', green: '#06df72',
  indigo: '#2b1680', maroon: '#7a2300', umber: '#6e1d60', olive: '#023b1f',
};
// legacy names used around the codebase
COLORS.lavender = COLORS.purple;
COLORS.yellow = COLORS.pink;
COLORS.blue = COLORS.purple;
COLORS.violet = COLORS.purple;
export const ACCENTS = [COLORS.purple, COLORS.orange, COLORS.pink, COLORS.green];

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isCoarse = () => matchMedia('(pointer: coarse)').matches;

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Deterministic PRNG seeded by any string. */
export function rng(seed = 'x') {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Size a canvas to its CSS box at device pixel ratio (capped at 2). */
export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/** Fade/slide elements in as they enter the viewport. */
export function initReveal(root = document) {
  const els = $$('.reveal', root);
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  els.forEach((e) => io.observe(e));
}

/** Run a callback only while an element is on screen. */
export function whenVisible(el, onChange) {
  const io = new IntersectionObserver(([en]) => onChange(en.isIntersecting), { threshold: 0 });
  io.observe(el);
  return io;
}
