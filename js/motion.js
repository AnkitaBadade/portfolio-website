import { $$, clamp, reducedMotion, isCoarse } from './util.js';

/**
 * Site-wide scroll polish, kept deliberately light:
 *  - smooth, eased wheel scrolling (Lenis, ~4 KB, loaded after the page is interactive)
 *  - headings and blocks rise into place as they enter
 *  - project images unmask upward, then drift with a subtle parallax
 * Everything is skipped for reduced-motion users; touch devices keep native scrolling.
 */
export function initMotion() {
  // Mark extra elements for the shared reveal observer (initReveal picks up `.reveal`).
  $$('.section-head, .about__grid > *, .contact__row').forEach((el) => el.classList.add('reveal'));
  if (reducedMotion()) return;

  // initParallax(); — off: covers now show the whole Behance thumbnail, so there is no spare image to drift
  if (!isCoarse()) loadSmoothScroll();
}

function loadSmoothScroll() {
  const start = async () => {
    try {
      const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs');
      document.documentElement.style.scrollBehavior = 'auto'; // Lenis does the easing instead
      const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.85, smoothWheel: true });
      window.__lenis = lenis; // lets the hero adjust scroll position without fighting the smoothing
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) {
      /* offline or blocked CDN: native scrolling is fine */
    }
  };
  // start immediately so the very first scroll already feels the same as every other one
  start();
}

function initParallax() {
  const items = $$('.proj__media').map((el) => ({ el, img: el.querySelector('img') })).filter((i) => i.img);
  let queued = false;
  const update = () => {
    queued = false;
    const vh = innerHeight;
    for (const { el, img } of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      // -1 when the frame enters at the bottom, +1 when it leaves at the top
      const p = clamp((vh - r.top) / (vh + r.height)) * 2 - 1;
      img.style.setProperty('--py', `${(p * -8).toFixed(2)}%`);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
}

/** Progress bar and the contact curtain — one rAF-throttled scroll handler. */
export function initScrollChrome() {
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  const nav = document.querySelector('[data-nav]');
  const contact = document.querySelector('.contact');
  const reduced = reducedMotion();
  let lastY = scrollY, queued = false;
  const update = () => {
    queued = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${clamp(y / Math.max(1, max)).toFixed(4)})`;
    if (!reduced) {
      // the nav always stays in view (no auto-hide)
      if (contact) {
        const p = clamp((innerHeight - contact.getBoundingClientRect().top) / (innerHeight * 0.7));
        contact.style.setProperty('--inset', `${((1 - p) * 4).toFixed(2)}%`);
      }
    }
    lastY = y;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}
