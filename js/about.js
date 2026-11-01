import { site, aboutPage as A } from './data.js';
import { $, esc, initReveal } from './util.js';
import { initNav } from './nav.js';
import { initMotion, initScrollChrome } from './motion.js';
import { initTransitions } from './transition.js';

initTransitions();
import { createPointGrid } from './about/pointgrid.js';

/* ---------- written section (all copy lives in data.js → aboutPage) ---------- */
// heading and italic line are split into words so they can arrive one by one
const words = (t) => t.split(' ').map((w, k) => `<span class="w" aria-hidden="true"><span style="--k:${k}">${esc(w)}</span></span>`).join(' ');
$('[data-more-title]').innerHTML = words(A.title);
$('[data-more-title]').setAttribute('aria-label', A.title);
$('[data-more-lead]').textContent = A.body[0];
$('[data-more-italic]').innerHTML = words(A.italic);
$('[data-more-italic]').setAttribute('aria-label', A.italic);
$('[data-more-aside]').textContent = A.aside;
$('[data-photo-label]').textContent = A.photoLabel;
$('[data-photo-caption]').textContent = A.photoCaption;
if (A.photo) $('[data-photo] .ed__frame').innerHTML = `<img src="${esc(A.photo)}" alt="Ankita Badade" loading="lazy">`;
$('[data-journey-title]').textContent = A.journeyTitle;
$('[data-journey]').innerHTML = A.journey.map((g, k) => `<li class="journey__group reveal${k ? '' : ' is-now'}">
  <p class="mono journey__label">${esc(g.label)}</p>
  ${g.items.map((it) => `<div class="journey__item"><strong>${esc(it.org)}</strong><span>${esc(it.text)}</span></div>`).join('')}
</li>`).join('');

initNav(site);
initMotion();
initScrollChrome();
initReveal();
createPointGrid($('[data-pg]'), { clusters: A.clusters });

/* centre: the name builds in as ASCII-art pixels, a pink block lands as the full stop,
   then the sentence fades up word by word */
const title = $('[data-statement]'), role = $('[data-role]');
// each letter springs up from below on its own slightly offset beat (after GSAP's headline);
// the pink block ends the last line as its full stop
title.setAttribute('aria-label', `${A.statement.join(' ')}.`);
// slot reels (after GSAP's "Animate anything"): every letter is a short reel of random letters,
// with the odd palette shape, that scrolls up and stops on the real letter, each on its own beat
const FILL = 'abcdefghijklmnopqrstuvwxyz';
const SHAPES = [
  ['var(--orange)', '<path d="M10.5 0h3v8.4l6-6 2.1 2.1-6 6H24v3h-8.4l6 6-2.1 2.1-6-6V24h-3v-8.4l-6 6-2.1-2.1 6-6H0v-3h8.4l-6-6 2.1-2.1 6 6z"/>'],
  ['var(--pink)', '<path d="M12 0a6 6 0 0 1 6 6 6 6 0 0 1 0 12 6 6 0 0 1-12 0A6 6 0 0 1 6 6a6 6 0 0 1 6-6z"/>'],
  ['var(--green)', '<path d="M14 0 4 14h7l-2 10 11-15h-7z"/>'],
  ['var(--purple)', '<path d="M2 0h20L12 12l10 12H2l10-12z"/>'],
];
const reel = (ch) => {
  const d = (0.6 + n++ * 0.035 + Math.random() * 0.1).toFixed(3);
  if (Math.random() > 0.28) return `<span class="pg__plain" style="--d:${d}s">${esc(ch)}</span>`; // most letters simply rise in
  const len = 2 + ((Math.random() * 3) | 0);
  const items = Array.from({ length: len }, () => (Math.random() < 0.2
    ? (([c, d]) => `<i class="pg__glyph" style="color:${c}"><svg viewBox="0 0 24 24">${d}</svg></i>`)(SHAPES[(Math.random() * SHAPES.length) | 0])
    : `<i>${FILL[(Math.random() * FILL.length) | 0]}</i>`));
  return `<span class="pg__slot"><span class="pg__ghost">${esc(ch)}</span><span class="pg__reel" style="--n:${len};--d:${d}s;--t:${(0.6 + len * 0.07 + Math.random() * 0.15).toFixed(3)}s">${items.join('')}<i>${esc(ch)}</i></span></span>`;
};
let n = 0;
title.innerHTML = `<span class="pg__name-text" aria-hidden="true">${A.statement.map((line, l) => `<span class="pg__line">${
  [...line].map((ch) => (ch === ' ' ? ' ' : reel(ch))).join('')
}${l === A.statement.length - 1 ? '<i class="pg__stop"></i>' : ''}</span>`).join('')}</span>`;
// plain words blur up one by one; marked phrases land on a colour block that wipes in from the left
let i = 0, rest = A.role;
const parts = [];
for (const m of A.roleMarks || []) {
  const at = rest.indexOf(m.text);
  if (at < 0) continue;
  parts.push(rest.slice(0, at), m);
  rest = rest.slice(at + m.text.length);
}
parts.push(rest);
role.innerHTML = parts.map((p) => typeof p === 'string'
  ? p.split(' ').map((w) => (w ? `<span style="--i:${i++}">${esc(w)}</span>` : '')).join(' ')
  : `<mark class="pg__mark" style="--i:${i++};--c:var(--${p.color})"><b>${esc(p.text)}</b></mark>`).join('');

/* a very light depth on scroll: the photo and the italic line drift a few pixels at different speeds */
(function drift() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = [[document.querySelector('.ed__frame'), -24], [document.querySelector('.ed__italic'), 16]].filter(([el]) => el);
  let raf = 0;
  const tick = () => {
    raf = 0;
    for (const [el, amt] of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const p = (r.top + r.height / 2) / innerHeight - 0.5;      // -0.5 … 0.5 across the screen
      el.style.translate = `0 ${(p * amt).toFixed(1)}px`;
    }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  tick();
})();
