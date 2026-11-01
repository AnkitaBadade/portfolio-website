import { reducedMotion } from './util.js';

/**
 * Page-to-page transition: a panel sweep.
 * Leaving: a dark panel sweeps up from the bottom, the destination's name rises into the middle
 *          (with a small pink square), then we navigate.
 * Arriving: the new page opens under the same panel (set by a one-line script in each page's <head>,
 *          so there is no flash), the panel sweeps off the top and the content settles in.
 * Same-page anchors, new tabs, downloads and modified clicks are left alone.
 */
const KEY = 'ankita:transition';
const COVER = 650;                                       // ms for the panel to cover the screen

const nameFor = (url, a) => {
  const p = url.pathname.split('/').pop() || 'index.html';
  if (p.startsWith('about')) return 'About';
  if (p.startsWith('case')) {
    const t = a.closest('.proj, .case-next a')?.querySelector('[aria-label]')?.getAttribute('aria-label');
    return t || 'Project';
  }
  return url.hash === '#work' ? 'Work' : url.hash === '#contact' ? 'Contact' : 'Home';
};

export function initTransitions() {
  const root = document.documentElement;
  try { sessionStorage.removeItem(KEY); } catch (e) { /* storage blocked */ }

  // arriving: sweep the panel away, let the content settle
  if (root.classList.contains('is-arriving')) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('is-arrived');
      setTimeout(() => { root.classList.remove('is-arriving', 'is-arrived'); delete root.dataset.pt; }, 1300);
    }));
  }
  if (reducedMotion()) return;

  // leaving: intercept same-site page links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.getAttribute('aria-disabled') === 'true') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const page = (u) => u.pathname.replace(/index\.html$/, '') + u.search;
    if (page(url) === page(location)) return;           // same page: let anchors scroll as usual
    e.preventDefault();
    const label = nameFor(url, a);
    const pt = document.createElement('div');
    pt.className = 'pt';
    pt.setAttribute('aria-hidden', 'true');
    pt.innerHTML = `<span class="pt__label"><i></i><span>${label.replace(/[<&>]/g, '')}</span></span>`;
    document.body.append(pt);
    root.classList.add('is-leaving');
    requestAnimationFrame(() => requestAnimationFrame(() => pt.classList.add('is-in')));
    try { sessionStorage.setItem(KEY, label); } catch (err) { /* fine: just no sweep on arrival */ }
    setTimeout(() => { location.href = url.href; }, COVER + 120);
  });

  // back/forward from the cache: never stay covered
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    root.classList.remove('is-leaving', 'is-arriving', 'is-arrived');
    document.querySelectorAll('.pt').forEach((n) => n.remove());
  });
}
