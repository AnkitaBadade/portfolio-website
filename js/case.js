import { site, projects } from './data.js';
import { $, esc, initReveal } from './util.js';
import { initNav } from './nav.js';
import { initTransitions } from './transition.js';
import { initMotion, initScrollChrome } from './motion.js';

initTransitions();
import { coverOf, placeholderCover } from './covers.js';

initNav(site);

const slug = new URLSearchParams(location.search).get('p');
const idx = Math.max(0, projects.findIndex((p) => p.slug === slug));
const p = projects[idx];
const c = p.case || {};
const prev = projects[(idx - 1 + projects.length) % projects.length];
const next = projects[(idx + 1) % projects.length];
document.title = `${p.title} — Ankita`;

const img = (im, i, style) =>
  `<figure class="fig reveal">
     <img src="${im.src ? esc(im.src) : placeholderCover(p.slug + i, style, 'Placeholder image')}" alt="${esc(im.caption || '')}" loading="lazy">
     ${im.caption ? `<figcaption class="mono"><span>${String(i + 1).padStart(2, '0')}</span>${esc(im.caption)}</figcaption>` : ''}
   </figure>`;

const section = (n, title, inner) => inner ? `
  <section class="case-sec reveal">
    <h2 class="case-sec__label mono"><span>${n}</span>${title}</h2>
    <div class="case-sec__body">${inner}</div>
  </section>` : '';
const para = (t) => (t ? `<p class="case-lead">${esc(t)}</p>` : '');
const styles = ['pixel', 'blocks', 'ascii', 'bars', 'dots'];
const alt = (k) => styles[(styles.indexOf(p.coverStyle) + k) % styles.length];
// The project's own long scroll: images stacked edge to edge, read top to bottom like on Behance.
// `images` is either a list of paths, or { count, ext } for assets/projects/<slug>/01.jpg, 02.jpg …
const scrollImgs = Array.isArray(p.images) ? p.images
  : p.images?.count ? Array.from({ length: p.images.count }, (_, i) => `assets/projects/${p.slug}/${String(i + 1).padStart(2, '0')}.${p.images.ext || 'jpg'}`)
  : [];
// a sticky step bar (after eemonroy.com): it pins under the nav while you read the long scroll,
// lights up the step you are on, and fills a progress line; click a step to jump to it
const processStrip = scrollImgs.length && p.process?.length ? `
  <nav class="steps" aria-label="Project steps">
    <ol class="steps__list plain" data-steps>${p.process.map((st, i) => `
      <li><button type="button" class="steps__item" data-at="${st.at[0]}" data-frac="${st.at[1] || 0}" title="${esc(st.text)}"><span class="mono">${String(i + 1).padStart(2, '0')}</span>${esc(st.title)}</button></li>`).join('')}
    </ol>
    <div class="steps__bar"><i data-steps-bar></i></div>
  </nav>` : '';
const longScroll = scrollImgs.length ? `
  <section class="scroll-case" aria-label="${esc(p.title)} — full project">
    ${scrollImgs.map((src, i) => /.(mp4|webm)$/i.test(src)
      ? `<video id="part-${i + 1}" width="2000" height="${p.imageHeights?.[i] || 1125}" src="${esc(src)}" autoplay muted loop playsinline preload="metadata" aria-label="${esc(p.title)} — walkthrough video"></video>`
      : `<img id="part-${i + 1}" width="2000"${p.imageHeights?.[i] ? ` height="${p.imageHeights[i]}"` : ''} src="${esc(src)}" alt="${esc(p.title)} — part ${i + 1} of ${scrollImgs.length}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('')}
    ${p.behance ? `<a class="mono behance__link" href="${esc(p.behance.url)}" target="_blank" rel="noopener">Also on Behance ↗</a>` : ''}
  </section>` : '';
// Until a written case study or the images exist, show the full Behance project inline.
const embed = longScroll ? processStrip + longScroll : p.behance && !p.case ? `
  <section class="behance wrap" aria-label="${esc(p.title)} — full project">
    <iframe src="https://www.behance.net/embed/project/${esc(p.behance.id)}?ilo0=1" title="${esc(p.title)} on Behance"
      loading="lazy" allowfullscreen allow="clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <a class="mono behance__link" href="${esc(p.behance.url)}" target="_blank" rel="noopener">Open on Behance ↗</a>
  </section>` : '';

$('[data-case]').innerHTML = `
  <header class="case-hero wrap">
    <a class="back mono" href="index.html#work">← All work</a>
    ${p.placeholder ? '<p class="notice mono">Placeholder content — edit this project in js/data.js</p>' : ''}
    <p class="mono case-hero__meta proj__top">
      <span class="proj__num">${String(idx + 1).padStart(2, '0')}</span>
      ${p.type ? `<span class="proj__type proj__type--${esc(p.type.toLowerCase())}">${esc(p.type)}</span>` : ''}
      ${p.org ? `<span class="proj__org">${esc(p.org)}</span>` : ''}${p.year ? `<span class="proj__org">${esc(p.year)}</span>` : ''}
    </p>
    <h1 class="case-hero__title" aria-label="${esc(p.title)}">${p.title.split(' ').map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i};--k:${i}">${esc(w)}</span></span>`).join(' ')}</h1>
    ${p.headline ? `<p class="case-hero__intro">${esc(p.headline)}</p>` : ''}
    <p class="case-hero__desc">${esc(c.intro || p.description)}</p>
    ${p.tags?.length ? `<ul class="proj__tags mono">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  </header>
  ${embed || `<div class="case-cover wrap"><img src="${coverOf(p)}" alt="${esc(p.title)} cover"></div>`}

  <div class="wrap">
    ${c.meta ? `<dl class="case-meta reveal">
      ${Object.entries({ Role: c.meta.role, Timeline: c.meta.timeline, Collaborators: c.meta.collaborators, Constraints: c.meta.constraints })
        .filter(([, v]) => v).map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>` : ''}

    ${section('01', 'Context & problem', para(c.context))}
    ${section('02', 'Research & insights', c.research ? para(c.research.text) +
      `<ol class="insights">${(c.research.insights || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : '')}
    ${section('03', 'Process & iterations', c.process ? para(c.process.text) : '')}
  </div>
  ${c.process?.images?.length ? `<div class="wrap spread">${c.process.images.map((im, i) => img(im, i, alt(i + 1))).join('')}</div>` : ''}
  <div class="wrap">${section('04', 'Outcome', c.outcome ? para(c.outcome.text) : '')}</div>
  ${c.outcome?.images?.length ? `<div class="wrap full">${c.outcome.images.map((im, i) => img(im, i + 2, alt(3))).join('')}</div>` : ''}
  <div class="wrap">${section('05', 'Reflection', para(c.reflection))}</div>

  <nav class="case-next wrap reveal" aria-label="More projects">
    <a href="case.html?p=${encodeURIComponent(prev.slug)}"><span class="mono">← Previous</span><strong aria-label="${esc(prev.title)}">${prev.title.split(' ').map((w, k) => `<span class="w" aria-hidden="true"><span style="--k:${k}">${esc(w)}</span></span>`).join(' ')}</strong></a>
    <a href="case.html?p=${encodeURIComponent(next.slug)}"><span class="mono">Next →</span><strong aria-label="${esc(next.title)}">${next.title.split(' ').map((w, k) => `<span class="w" aria-hidden="true"><span style="--k:${k}">${esc(w)}</span></span>`).join(' ')}</strong></a>
  </nav>
  <footer class="wrap footer footer--light mono"><a href="index.html#work">All work</a><span>© ${new Date().getFullYear()} Ankita</span></footer>
`;
initReveal();
initMotion();
initScrollChrome();

/* with a long scroll, the opening screen shows only the title and project info; the rest waits below the fold */
(function fitHero() {
  const hero = document.querySelector('.case-hero');
  if (!hero || !document.querySelector('.scroll-case')) return;
  hero.classList.add('case-hero--fit');
  hero.insertAdjacentHTML('beforeend', '<p class="case-hero__cue mono" aria-hidden="true">Scroll to see the work ↓</p>');
  const fit = () => { hero.style.minHeight = `calc(100svh - ${hero.getBoundingClientRect().top + scrollY}px)`; };
  fit(); addEventListener('resize', fit);

  // as you scroll off the title screen, the info drifts up and fades while the work rises in to meet you
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const inner = [...hero.children], steps = document.querySelector('.steps'), work = document.querySelector('.scroll-case');
  let raf = 0;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tick = () => {
    raf = 0;
    const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.75)));
    inner.forEach((el, i) => {
      const q = Math.min(1, Math.max(0, p * 1.4 - i * 0.04));     // lines leave one after another
      el.style.opacity = (1 - ease(q) * 0.92).toFixed(3);
      el.style.transform = `translateY(${(-ease(q) * 48).toFixed(1)}px)`;
    });
    const r = ease(Math.min(1, p * 1.25));
    work.style.opacity = (0.35 + r * 0.65).toFixed(3);
    work.style.transform = `translateY(${((1 - r) * 64).toFixed(1)}px) scale(${(0.975 + r * 0.025).toFixed(4)})`;
    steps.style.opacity = r.toFixed(3);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  tick();
})();

/* each part of the long scroll eases up a little as it arrives (first one is handled by the hand-off) */
(function partsIn() {
  const parts = [...document.querySelectorAll('.scroll-case > img, .scroll-case > video')].slice(1);
  if (!parts.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  parts.forEach((el) => el.classList.add('part-in'));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  parts.forEach((el) => io.observe(el));
})();

/* step bar: scroll-spy + progress + jump */
(function stepBar() {
  const list = document.querySelector('[data-steps]');
  if (!list) return;
  const items = [...list.querySelectorAll('.steps__item')];
  const bar = document.querySelector('[data-steps-bar]');
  const scroll = document.querySelector('.scroll-case');
  const nav = document.querySelector('[data-nav]');
  const pin = () => document.querySelector('.steps').style.setProperty('--nav-h', `${nav ? nav.offsetHeight : 0}px`); // sit flush under the nav
  pin(); addEventListener('resize', pin);
  const line = () => innerHeight * 0.4;     // a step is "reached" when its heading crosses 40% down the screen
  const targetY = (b) => { const el = document.getElementById(`part-${b.dataset.at}`); return el ? el.getBoundingClientRect().top + scrollY + el.offsetHeight * Number(b.dataset.frac) : Infinity; };
  // the progress line lives inside the scrolling list, so it can run up to the exact step you are on
  list.style.position = 'relative';
  list.append(bar.parentElement); bar.parentElement.classList.add('steps__bar--in');
  let current = -1, shown = 0, want = 0, raf = 0;
  const glide = () => {                     // ease the line toward its target every frame
    shown += (want - shown) * 0.16;
    bar.style.width = `${shown.toFixed(1)}px`;
    raf = Math.abs(want - shown) > 0.5 ? requestAnimationFrame(glide) : 0;
  };
  const update = () => {
    const y = scrollY + line(), ys = items.map(targetY);
    let k = -1;
    ys.forEach((t, i) => { if (t <= y) k = i; });
    if (k !== current) {
      current = k;
      items.forEach((b, i) => { b.classList.toggle('is-on', i === k); b.classList.toggle('is-done', i < k); });
      const on = items[Math.max(k, 0)];
      list.scrollTo({ left: on.offsetLeft - list.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
    }
    // fill to the active step, plus how far you are toward the next one
    const end = scroll.getBoundingClientRect().bottom + scrollY - innerHeight * 0.6;
    const from = k < 0 ? 0 : items[k].offsetLeft + items[k].offsetWidth;
    const to = k < 0 ? items[0].offsetLeft : k + 1 < items.length ? items[k + 1].offsetLeft + items[k + 1].offsetWidth : list.scrollWidth;
    const a0 = k < 0 ? scroll.getBoundingClientRect().top + scrollY - innerHeight : ys[k], a1 = k + 1 < items.length ? ys[k + 1] : end;
    const f = Math.min(1, Math.max(0, (y - a0) / Math.max(1, a1 - a0)));
    want = from + (to - from) * f;
    if (!raf) raf = requestAnimationFrame(glide);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
  items.forEach((b) => b.addEventListener('click', () => {
    const y = targetY(b) - line() + 2;
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.2 }); else scrollTo({ top: y, behavior: 'smooth' });
  }));
})();
