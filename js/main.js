import { site, projects, experiments } from './data.js';
import { $, esc, clamp, initReveal, fitCanvas, rng, reducedMotion, ACCENTS, whenVisible } from './util.js';
import { initNav } from './nav.js';
import { initHero } from './hero.js';
import { createField } from './field.js';
import { coverOf } from './covers.js';
import { initExperiments } from './experiments.js';
import { initMotion, initScrollChrome } from './motion.js';
import { initTransitions } from './transition.js';

initTransitions();

/* ---------- Intro copy ---------- */
tessellateTitle($('[data-intro-title]'), site.intro.heading);

/**
 * "I'm Ankita." in the block style, kept minimal: the name surfaces through a mosaic of
 * paper-coloured tiles that clear in a loose left-to-right sweep, and the full stop is a
 * small orange block that drops into place last. Replays each time the title comes back into view.
 */
function tessellateTitle(el, text) {
  const dot = text.endsWith('.');
  el.setAttribute('aria-label', text);
  el.innerHTML = `<span aria-hidden="true">${esc(dot ? text.slice(0, -1) : text)}${dot ? '<i class="title-block"></i>' : ''}</span><span class="tiles" aria-hidden="true"></span>`;
  if (reducedMotion()) return;
  const tiles = el.querySelector('.tiles'), block = el.querySelector('.title-block');
  const r = rng('title');
  function run() {
    const s = Math.max(10, Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.13));
    const w = el.firstElementChild.getBoundingClientRect().width + s, h = el.offsetHeight; // only over the words, not the field beside them
    const cols = Math.ceil(w / s), rows = Math.ceil(h / s);
    tiles.style.setProperty('--s', `${s}px`);
    tiles.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = document.createElement('b');
      t.style.left = `${x * s}px`; t.style.top = `${y * s}px`;
      // a handful of tiles flash an accent on the way out — just enough to feel like blocks
      if (r() < 0.05) t.style.background = ACCENTS[(r() * ACCENTS.length) | 0];
      frag.append(t);
      t.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 260, delay: (x / cols) * 520 + r() * 260, easing: 'steps(2, end)', fill: 'both',
      });
    }
    tiles.append(frag);
    block?.animate(
      [{ transform: 'translateY(-260%)', opacity: 0 }, { transform: 'translateY(-260%)', opacity: 1, offset: 0.2 }, { transform: 'none', opacity: 1 }],
      { duration: 520, delay: 820, easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'both' }
    );
    setTimeout(() => { tiles.innerHTML = ''; }, 1500);
  }
  let shown = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !shown) { shown = true; run(); }
    else if (!e.isIntersecting) shown = false;
  }, { threshold: 0.6 }).observe(el);
}
$('[data-intro-lines]').innerHTML = site.intro.lines
  .map((l) => `<p aria-label="${esc(l)}">${l.split(' ').map((w) => `<span class="rw" aria-hidden="true">${esc(w)}</span>`).join(' ')}</p>`)
  .join('');
revealOnScroll($('[data-intro-lines]'));

/** Framer-style text reveal: words brighten one by one as the block scrolls into place. */
function revealOnScroll(block) {
  const words = [...block.querySelectorAll('.rw')];
  if (reducedMotion()) return words.forEach((w) => (w.style.opacity = 1));
  let queued = false;
  const update = () => {
    queued = false;
    const vh = innerHeight, top = block.getBoundingClientRect().top;
    // starts as the block enters the lower part of the screen, done by the time it settles
    const p = clamp((vh * 0.95 - top) / (vh * 0.6));
    const n = words.length;
    words.forEach((w, i) => (w.style.opacity = (0.14 + 0.86 * clamp(p * (n + 4) - i - 2, 0, 1)).toFixed(3)));
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- Selected work ---------- */
// each project is one large row: cover on one side; beside it a label row, the title, one line, and a link
$('[data-projects]').innerHTML = projects
  .map((p, i) => `
  <article class="proj reveal">
    <a class="proj__link" href="case.html?p=${encodeURIComponent(p.slug)}">
      <div class="proj__media"><img src="${coverOf(p)}" alt="${esc(p.title)} — cover${p.cover ? '' : ' (placeholder)'}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">${
        p.tags?.length ? `<ul class="proj__labels mono" aria-label="Focus">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>
      <div class="proj__info">
        <p class="proj__eyebrow mono"><span>${String(i + 1).padStart(2, '0')}</span>${[p.type, p.org].filter(Boolean).map(esc).join(' · ')}</p>
        <h3 class="proj__title" aria-label="${esc(p.headline || p.title)}">${(p.headline || p.title).split(' ').map((w, k) => `<span class="w" aria-hidden="true"><span style="--k:${k}">${esc(w)}</span></span>`).join(' ')}</h3>
        ${p.description ? `<p class="proj__desc">${esc(p.description)}</p>` : ''}
        <span class="proj__cta">View case study <i aria-hidden="true">→</i></span>
      </div>
    </a>
  </article>`)
  .join('');

/* ---------- Experiments ---------- */
$('[data-experiments]').innerHTML = experiments
  .map((x) => {
    const tag = x.url ? 'a' : 'div';
    const attrs = x.url ? `href="${esc(x.url)}" target="_blank" rel="noopener"` : 'tabindex="0" role="group"';
    const status = (x.status || '').toLowerCase().replace(/\s+/g, '-');
    return `
  <${tag} class="exp ${x.size === 'wide' ? 'exp--wide' : x.size === 'feature' ? 'exp--feature' : ''} reveal" ${attrs} data-sketch="${esc(x.preview)}" aria-label="${esc(x.title)}">
    <div class="exp__media">${x.image ? `<img src="${esc(x.image)}" alt="">` : '<canvas aria-hidden="true"></canvas>'}</div>
    <div class="exp__info">
      <h3 class="exp__title">${esc(x.title)}</h3>
      ${x.status ? `<span class="status status--${status} mono">${esc(x.status)}</span>` : ''}
      <p class="exp__desc">${esc(x.description)}${x.url ? '' : ' <span class="muted">Link coming soon.</span>'}</p>
    </div>
  </${tag}>`;
  })
  .join('');


/* ---------- Contact & links ---------- */
const resumeHtml = site.resumeUrl
  ? `<li><a href="${esc(site.resumeUrl)}" target="_blank" rel="noopener">Résumé ↗</a></li>`
  : '<li><span class="muted" title="Résumé link not added yet">Résumé — coming soon</span></li>';
const linksHtml = site.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></li>`).join('') + resumeHtml;
document.querySelectorAll('[data-links]').forEach((ul) => {
  ul.innerHTML = linksHtml || '<li class="muted">Profiles to be added</li>';
});
const email = $('[data-email]');
if (site.email) {
  email.innerHTML = `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`;
} else {
  email.innerHTML = '<span class="muted">Email address to be added</span>';
}

/* ---------- Behaviour ---------- */
let heroProgress = 0, heroOnScreen = true;
const updateNav = initNav(site, { getHeroDark: () => heroOnScreen && heroProgress < 0.55 });
const hero = $('[data-hero]');
whenVisible(hero, (v) => { heroOnScreen = v; updateNav(); });
initHero(hero, { greetings: site.greetings, onProgress: (p) => { heroProgress = p; updateNav(); } });
createField($('[data-field]'), $('[data-disciplines]'), site.disciplines);
initExperiments($('[data-experiments]'));
playBoard($('[data-experiments]'));

/** A few loose accent squares around the playground, plus a gentle depth drift with the cursor. */
function playBoard(board) {
  const r = rng('play');
  const spots = [[31, 2], [96, 30], [12, 34], [50, 70], [4, 94], [92, 96]];
  board.insertAdjacentHTML('beforeend', spots.map(([l, t], i) =>
    `<i class="bit" aria-hidden="true" style="left:${l}%;top:${t}%;--c:${ACCENTS[i % ACCENTS.length]};--d:${Math.round((r() - 0.5) * 40)};--dur:${(2.4 + r() * 2.4).toFixed(1)}s"></i>`).join(''));

  // tiles drop onto the board one by one, like pieces landing, the first time it comes into view
  [...board.querySelectorAll('.exp')].forEach((el, i) => el.style.setProperty('--i', i));
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { board.classList.add('is-dropped'); o.disconnect(); } }, { threshold: 0.25 }).observe(board);
  if (reducedMotion()) return;

  // the whole board drifts in depth with the cursor: tiles and loose squares move by different amounts
  // eased every frame toward the cursor, so the drift glides instead of stepping
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const tick = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    board.style.setProperty('--mx', x.toFixed(4));
    board.style.setProperty('--my', y.toFixed(4));
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(tick) : 0;
  };
  const aim = (nx, ny) => { tx = nx; ty = ny; if (!raf) raf = requestAnimationFrame(tick); };
  board.addEventListener('pointermove', (e) => {
    const b = board.getBoundingClientRect();
    aim(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1);
  });
  board.addEventListener('pointerleave', () => aim(0, 0));
  // touch screens have no cursor to follow, so the board sways by itself while it is on screen
  if (matchMedia('(pointer: coarse)').matches) {
    let on = false;
    const sway = (now) => { if (!on) return; aim(Math.sin(now / 1700), Math.cos(now / 2300)); requestAnimationFrame(sway); };
    new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) requestAnimationFrame(sway); }).observe(board);
  }
}
initMotion();
initScrollChrome();
// the text sits at the bottom of each tall row, so it gets its own trigger
{
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.35 });
  document.querySelectorAll('.proj__info').forEach((el) => io.observe(el));
}
initReveal();
const fit = $('.fit-word');
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fit.classList.add('in'); o.disconnect(); } }, { threshold: 0.6 }).observe(fit);
contactBlocks($('[data-blocks]'));

/** Closing strip: modular pieces fall and lock together once. Then it's a toy:
 *  the columns under the cursor lift and light up like a little equaliser, and a click drops
 *  a new block into that column — fill one to the top and it clears with a pop. */
function contactBlocks(canvas) {
  const reduced = reducedMotion();
  let ctx, w, h, c, cols, rows, stacks = [], start = 0, landed = false, raf = 0, px = -1, live = false;
  const DARK = '#1f1f1f', rand = (arr) => arr[(Math.random() * arr.length) | 0];

  function build() {
    ({ ctx, w, h } = fitCanvas(canvas));
    c = w < 600 ? 18 : 26; cols = Math.floor(w / c); rows = Math.floor(h / c);
    const r = rng('end');
    stacks = [];
    for (let x = 0; x < cols; x++) {
      const hgt = Math.max(1, Math.min(rows - 2, 1 + Math.floor(Math.abs(Math.sin(x * 0.35)) * 2) + (r() < 0.25 ? 1 : 0))); // leave room to stack
      const col = { lift: 0, glow: 0, cells: [] };
      for (let i = 0; i < hgt; i++) {
        const y = rows - 1 - i;
        col.cells.push({ y, col: r() < 0.14 ? ACCENTS[(r() * ACCENTS.length) | 0] : DARK, fall: 1, delay: (rows - y) * 140 + (x / cols) * 600 + r() * 200 });
      }
      stacks.push(col);
    }
  }

  function draw(now) {
    raf = 0;
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    let busy = false;
    stacks.forEach((col, x) => {
      // cursor influence: a soft bump centred on the hovered column
      const d = px < 0 ? 99 : Math.abs(x - px);
      const target = d < 4 ? Math.cos((d / 4) * Math.PI / 2) : 0;
      col.lift += (target - col.lift) * 0.18;
      if (Math.abs(target - col.lift) > 0.002) busy = true;
      col.cells.forEach((k, i) => {
        let e = 1;
        if (!landed) { const p = reduced ? 1 : Math.min(1, Math.max(0, (t - k.delay) / 380)); if (p < 1) busy = true; if (p <= 0) return; e = 1 - Math.pow(1 - p, 3); }
        if (k.fall < 1) { k.fall = Math.min(1, k.fall + 0.06); busy = true; e = 1 - Math.pow(1 - k.fall, 3); }
        if (k.pop) { k.pop += 0.08; busy = true; }
        const y = k.y * c - (1 - e) * (h + 40) - col.lift * c * 0.5 * (i + 1) / col.cells.length;
        const lit = k.col === DARK && col.lift > 0.35 ? (k.tint ||= rand(ACCENTS)) : k.col;
        ctx.globalAlpha = k.pop ? Math.max(0, 1 - k.pop) : 1;
        ctx.fillStyle = lit;
        const s = k.pop ? (c - 2) * (1 + k.pop * 0.6) : c - 2, o = (s - (c - 2)) / 2;
        ctx.fillRect(x * c + 1 - o, y + 1 - o, s, s);
        if (col.lift < 0.2) k.tint = null;
      });
      col.cells = col.cells.filter((k) => !k.pop || k.pop < 1);
    });
    ctx.globalAlpha = 1;
    if (!landed && !busy) landed = true;
    if (busy || live) raf = requestAnimationFrame(draw);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

  build();
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { io.disconnect(); start = performance.now(); kick(); }
  }, { threshold: 0.4 });
  io.observe(canvas);
  new ResizeObserver(() => { build(); if (start) { landed = true; kick(); } }).observe(canvas);
  if (reduced) return;

  canvas.style.cursor = 'pointer';
  canvas.addEventListener('pointermove', (e) => { px = Math.floor((e.clientX - canvas.getBoundingClientRect().left) / c); live = true; kick(); });
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; px = -1; live = false; kick(); });
  // touch: the wave follows your finger, then settles after you let go
  let settle = 0;
  const fromTouch = (e) => { clearTimeout(settle); px = Math.floor((e.touches[0].clientX - canvas.getBoundingClientRect().left) / c); live = true; kick(); };
  canvas.addEventListener('touchstart', fromTouch, { passive: true });
  canvas.addEventListener('touchmove', fromTouch, { passive: true });
  canvas.addEventListener('touchend', () => { settle = setTimeout(() => { px = -1; live = false; kick(); }, 500); });
  canvas.addEventListener('click', (e) => {
    if (!landed) return;
    const x = Math.floor((e.clientX - canvas.getBoundingClientRect().left) / c), col = stacks[x];
    if (!col) return;
    const solid = col.cells.filter((k) => !k.pop);
    if (solid.length >= rows) { solid.forEach((k) => { k.pop = 0.01; }); }           // full: clear with a pop
    else col.cells.push({ y: rows - 1 - solid.length, col: rand(ACCENTS), fall: 0 }); // drop a new piece in
    kick();
  });
}

/* Footer credit: a few lines take turns in the same spot, with a soft fade. */
(function rotateCredits() {
  const el = $('.footer__made');
  if (!el || reducedMotion()) return;
  const heart = el.querySelector('.heart').outerHTML;
  const lines = [
    `Designed with ${heart} (and many, many tabs open)`,
    'all the pieces, falling into place.',
    'a work in progress, just like me :)',
    `that’s all, folks! ${heart}`,
  ];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % lines.length;
    el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 350, easing: 'ease-in', fill: 'forwards' })
      .onfinish = () => {
        el.innerHTML = lines[i];
        el.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'ease-out', fill: 'forwards' });
      };
  }, 3600);
})();
