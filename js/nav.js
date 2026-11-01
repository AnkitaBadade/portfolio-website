/** Configures the Resume link and switches nav colour per section theme. */
export function initNav(site, { getHeroDark } = {}) {
  const nav = document.querySelector('[data-nav]');
  const resume = nav.querySelector('[data-resume]');
  if (site.resumeUrl) {
    resume.href = site.resumeUrl;
    resume.target = '_blank';
    resume.rel = 'noopener';
  } else {
    resume.removeAttribute('href');
    resume.setAttribute('role', 'link');
    resume.setAttribute('aria-disabled', 'true');
    resume.setAttribute('tabindex', '0');
    resume.title = 'Résumé PDF not yet configured';
    resume.addEventListener('click', (e) => e.preventDefault());
  }

  // Each link gets a tiny 5×5 pixel icon: a dotted outline at rest, and on hover the dots
  // shuffle into the link's own shape in a palette colour (house, blocks, person, arrow).
  const ICONS = {
    home:   ['10101 00000 10001 00000 10101', '00100 01110 11111 01010 01110', 'var(--purple)'],
    work:   ['11011 10001 00000 10001 11011', '11011 11011 00000 11011 11011', 'var(--orange)'],
    about:  ['01010 10001 00000 10001 01010', '01110 01110 00100 11111 01010', 'var(--pink)'],
    resume: ['11110 10010 10010 10010 11110', '00100 00100 10101 01110 00100', 'var(--green)'],
  };
  const dots = (key) => {
    const [rest, hover, color] = ICONS[key] || ICONS.home;
    const r = rest.replace(/ /g, ''), h = hover.replace(/ /g, '');
    let cells = '';
    for (let i = 0; i < 25; i++) {
      cells += `<rect x="${(i % 5) * 3}" y="${Math.floor(i / 5) * 3}" width="2" height="2" class="px" style="--a:${r[i]};--b:${h[i]};--d:${(Math.random() * 0.22).toFixed(3)}s"/>`;
    }
    return `<svg class="nav__px" viewBox="0 0 14 14" style="--px:${color}" aria-hidden="true">${cells}</svg>`;
  };

  // The name gets its own pixel mark that never sits still: its dots keep re-forming into what I do,
  // observe (eye), think (bulb), sketch (pencil), make (spark). Hovering the name speeds it up.
  const logo = nav.querySelector('.nav__logo');
  if (logo) {
    const SHAPES = [
      ['00000 01110 11011 01110 00000', 'var(--purple)'],      // eye     observe
      ['01110 10001 10001 01110 00100', 'var(--orange)'],      // bulb    ideas
      ['00011 00111 01110 11100 11000', 'var(--green)'],       // pencil  sketch
      ['00100 10101 01110 10101 00100', 'var(--pink)'],        // spark   make
    ].map(([p, c]) => [p.replace(/ /g, ''), c]);
    let cells = '';
    for (let i = 0; i < 25; i++) cells += `<rect x="${(i % 5) * 3}" y="${Math.floor(i / 5) * 3}" width="2" height="2" class="px" style="--d:${(Math.random() * 0.2).toFixed(3)}s"/>`;
    logo.insertAdjacentHTML('afterbegin', `<svg class="nav__px nav__px--me" viewBox="0 0 14 14" aria-hidden="true">${cells}</svg>`);
    const mark = logo.querySelector('.nav__px--me'), px = [...mark.querySelectorAll('.px')];
    const show = (k) => { const [p, c] = SHAPES[k]; mark.style.setProperty('--px', c); px.forEach((r, i) => r.style.setProperty('--on', p[i])); };
    let k = 0, timer = 0;
    show(0);
    const run = (ms) => { clearInterval(timer); timer = setInterval(() => { if (document.hidden) return; k = (k + 1) % SHAPES.length; show(k); }, ms); };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      run(1600);
      logo.addEventListener('mouseenter', () => run(600)); logo.addEventListener('focus', () => run(600));
      logo.addEventListener('mouseleave', () => run(1600)); logo.addEventListener('blur', () => run(1600));
    }
  }

  // Vertical roll on hover: two stacked copies of each label, letters roll up one after another.
  nav.querySelectorAll('.nav__links a').forEach((a) => {
    const text = a.textContent.trim();
    const row = [...text].map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    a.setAttribute('aria-label', text);
    a.innerHTML = `${dots(text.toLowerCase())}<span class="roll" aria-hidden="true"><span class="roll__row">${row}</span><span class="roll__row">${row}</span></span>`;
  });

  // in-page jumps (Home ↔ Work on the home page, Back to top…): a slow, eased glide rather than a dash
  const glide = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic: soft start, soft landing
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = url.hash === '#top' ? 0 : document.querySelector(url.hash);
    if (target === null) return;
    e.preventDefault();
    const y = target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - 72;
    const dur = Math.min(3, Math.max(1.8, Math.abs(y - scrollY) / 1500));     // unhurried; longer trips take a little longer
    const L = window.__lenis;
    if (L) {
      // the glide remembers its destination, so if the page above it changes height mid-way
      // (the opening section shrinks as you pass it) it can re-aim and still land exactly
      const where = () => (target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - 72);
      const done = () => { window.__navGlide = null; };
      window.__navGlide = { reaim: () => L.scrollTo(where(), { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3), force: true, onComplete: done }) };
      L.scrollTo(y, { duration: dur, easing: glide, force: true, onComplete: done });
    }
    else scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', url.hash === '#top' ? location.pathname : url.hash);
  });

  // arriving from another page with #work: land on "Pieces that fit" once the page has laid out
  // (in-page links like Home → #top and Work → #work are glided by the smooth-scroll engine's anchors)
  if (location.hash) addEventListener('load', () => setTimeout(() => {
    const t = document.querySelector(location.hash);
    if (!t) return;
    if (window.__lenis) window.__lenis.scrollTo(t, { offset: -80, immediate: true, force: true });
    else t.scrollIntoView();
  }, 60));

  const sections = [...document.querySelectorAll('[data-theme]')];
  function update() {
    const y = 32;
    let theme = 'light';
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { theme = s.dataset.theme; break; }
    }
    if (getHeroDark && getHeroDark()) theme = 'dark';
    nav.dataset.mode = theme;
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
  return update;
}
