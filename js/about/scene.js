import { COLORS, ACCENTS, clamp, fitCanvas, reducedMotion, isCoarse } from '../util.js';
import { buildWorld } from './world.js';

/* The character: six square modules — a pink head, a dark body, one purple
   "watch" module on the wrist. Abstract on purpose: a little piece of me. */
const BODY = [
  { x: 0, y: 2, c: COLORS.yellow }, { x: 1, y: 2, c: COLORS.yellow },
  { x: 0, y: 1, c: COLORS.dark }, { x: 1, y: 1, c: COLORS.dark },
  { x: 0, y: 0, c: COLORS.dark }, { x: 1, y: 0, c: COLORS.lavender },
];
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * The Shape of Ankita — a small world built from pieces.
 * A modular character explores a block landscape: it hops between platforms,
 * climbs, drops through openings in the ground and pops up elsewhere, and pauses
 * beside short phrases. The pointer nudges nearby blocks and gets a reaction.
 */
export function createScene(root, { phrases, details }) {
  const canvas = root.querySelector('canvas');
  const phraseEl = root.querySelector('[data-phrase]');
  const detailsEl = root.querySelector('[data-details]');
  const intro = root.querySelector('.scene__intro');
  const reduced = reducedMotion();
  const coarse = isCoarse();

  let ctx, W, H, s, cols, rows, world;
  let me = { x: 0, y: 0, face: 1, squash: 0 };      // feet position in px
  let step = 0, move = null, waitUntil = 0, manualUntil = 0;
  let pointer = null, lastReact = 0, react = null;
  let raf = 0, visible = true, shifts = [];

  /* ---------- layout ---------- */
  function layout() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
    const target = W < 760 ? W / 11 : 34;
    cols = Math.max(10, Math.round(W / target));
    s = W / cols;
    rows = Math.ceil(H / s);
    // keep the intro text clear of blocks
    const ib = intro.getBoundingClientRect(), rb = root.getBoundingClientRect();
    const reserve = { x: 0, y: 0, w: Math.ceil((ib.right - rb.left + s * 0.6) / s), h: Math.ceil((ib.bottom - rb.top + s * 0.4) / s) };
    world = buildWorld({ cols, rows, reserve, accents: [COLORS.lavender, COLORS.green, COLORS.orange] });
    placeDetails();
    step = Math.min(step, world.route.length - 1);
    const p = spot(step);
    me = { ...me, x: p.x, y: p.y };
  }

  const spot = (i) => { const c = world.route[i]; return { x: (c.x + 0.5) * s, y: (c.y + 1) * s }; };

  /* small hover / tap labels hidden in a few surface blocks */
  function placeDetails() {
    detailsEl.innerHTML = '';
    world.details.forEach((d, i) => {
      const info = details[i];
      if (!info) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'scene__detail';
      b.style.cssText = `left:${d.x * s}px;top:${d.y * s}px;width:${s}px;height:${s}px;--c:${ACCENTS[i % ACCENTS.length]}`;
      b.setAttribute('aria-label', `${info.label}: ${info.note}`);
      b.innerHTML = `<span class="scene__tip" aria-hidden="true"><b>${info.label}</b>${info.note}</span>`;
      b.addEventListener('click', () => {
        const open = b.classList.toggle('is-open');
        detailsEl.querySelectorAll('.is-open').forEach((o) => o !== b && o.classList.remove('is-open'));
        if (open) goNear(d.x, d.y);
      });
      detailsEl.append(b);
    });
  }

  /* ---------- the character's journey ---------- */
  const phraseAt = (i) => {
    // spread the phrases along the route, skipping the very first stop
    const n = world.route.length, k = phrases.length;
    for (let j = 0; j < k; j++) if (Math.round(1 + (j * (n - 2)) / Math.max(1, k - 1)) === i) return phrases[j];
    return null;
  };

  function planMove(from, to) {
    const a = spot(from), b = spot(to);
    const last = world.route.length - 1;
    // the loop back from the far right goes underground: drop into an opening, pop out of another
    if (from === last && to === 0 && world.openings.length >= 2) {
      const o1 = world.openings[world.openings.length - 1], o0 = world.openings[0];
      return { kind: 'tunnel', a, b, o1: (o1.x + o1.w / 2) * s, o0: (o0.x + o0.w / 2) * s, dur: 2600 };
    }
    // highest obstacle between the two spots, so the arc clears walls
    const x0 = Math.min(world.route[from].x, world.route[to].x), x1 = Math.max(world.route[from].x, world.route[to].x);
    const yTop = Math.min(world.route[from].y, world.route[to].y);
    let apexRow = yTop;
    for (let x = x0; x <= x1; x++) for (let y = Math.max(0, yTop - 3); y < world.groundTop; y++) if (world.block[y][x]) { apexRow = Math.min(apexRow, y); break; }
    const apex = (apexRow - 0.9) * s;
    const dx = Math.abs(b.x - a.x);
    const kind = b.y > a.y + s * 1.5 ? 'drop' : b.y < a.y - s * 0.5 ? 'climb' : 'hop';
    return { kind, a, b, apex, dur: clamp(480 + dx * 1.1, 520, 1500) };
  }

  function go(to, manual) {
    if (!world.route.length) return;
    to = (to + world.route.length) % world.route.length;
    if (manual) manualUntil = performance.now() + 7000;
    hidePhrase();
    if (reduced) { step = to; Object.assign(me, spot(to)); arrive(); return; }
    move = { ...planMove(step, to), to, t0: performance.now() };
    me.face = move.b.x >= me.x ? 1 : -1;
    kick();
  }
  function goNear(x, y) {
    let best = 0, bd = 1e9;
    world.route.forEach((p, i) => { const d = Math.abs(p.x - x) + Math.abs(p.y - y) * 0.6; if (d < bd) { bd = d; best = i; } });
    go(best, true);
  }

  function arrive() {
    me.squash = 1;
    nudgeLoose();
    const text = phraseAt(step);
    if (text) showPhrase(text);
    waitUntil = performance.now() + (text ? 2800 : 1100 + Math.random() * 700);
  }

  /* landing nudges the nearest loose block one cell sideways — the world rearranges a little */
  function nudgeLoose() {
    if (reduced) return;
    const c = world.route[step];
    let best = null, bd = 9;
    for (const l of world.loose) { const d = Math.abs(l.x - c.x) + Math.abs(l.y - c.y); if (d < bd) { bd = d; best = l; } }
    if (!best) return;
    const dir = best.x < c.x ? -1 : 1, nx = best.x + dir;
    if (nx < 0 || nx >= cols || world.block[best.y][nx]) return;
    shifts.push({ l: best, from: best.x, to: nx, t0: performance.now() });
    best.x = nx;
  }

  /* the phrase sits in the nearest clear patch of paper beside the character */
  function showPhrase(text) {
    const p = spot(step);
    phraseEl.textContent = text;
    const w = Math.min(phraseEl.offsetWidth || 220, W - 32), h = phraseEl.offsetHeight || 36;
    const head = p.y - s * 1.6;
    const options = [
      [p.x - w / 2, head - h - 12], [p.x + s * 0.9, head - h / 2], [p.x - s * 0.9 - w, head - h / 2],
      [p.x - w / 2, p.y + 10], [p.x + s * 0.9, head - h - 12], [p.x - s * 0.9 - w, head - h - 12],
    ];
    const clear = ([l, t]) => {
      if (l < 12 || l + w > W - 12 || t < 84 || t + h > H - 8) return false;
      for (let y = Math.floor(t / s); y <= Math.floor((t + h) / s); y++) {
        for (let x = Math.floor(l / s); x <= Math.floor((l + w) / s); x++) if (world.block[y]?.[x]) return false;
      }
      return true;
    };
    const [left, top] = options.find(clear) || options[0];
    Object.assign(phraseEl.style, { left: `${clamp(left, 12, W - w - 12)}px`, top: `${Math.max(84, top)}px` });
    phraseEl.classList.add('is-on');
  }
  function hidePhrase() { phraseEl.classList.remove('is-on'); }

  /* ---------- drawing ---------- */
  function drawWorld(now) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);
    // hairline layout grid
    ctx.strokeStyle = 'rgba(0,0,0,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < cols; x++) { const X = Math.round(x * s) + 0.5; ctx.moveTo(X, 0); ctx.lineTo(X, H); }
    for (let y = 1; y < rows; y++) { const Y = Math.round(y * s) + 0.5; ctx.moveTo(0, Y); ctx.lineTo(W, Y); }
    ctx.stroke();

    // solid masses: draw runs per row so walls read as one shape
    const R = 90, push = (cx, cy) => {
      if (!pointer || coarse || reduced) return [0, 0];
      const dx = cx - pointer.x, dy = cy - pointer.y, d = Math.hypot(dx, dy);
      if (d > R || d < 1) return [0, 0];
      const k = Math.pow(1 - d / R, 2) * 3;              // a few px away from the cursor, very local
      return [(dx / d) * k, (dy / d) * k];
    };
    const nearPointer = (x, y) => pointer && Math.abs((x + 0.5) * s - pointer.x) < R + s && Math.abs((y + 0.5) * s - pointer.y) < R;
    ctx.fillStyle = COLORS.dark;
    for (let y = 0; y < rows; y++) {
      let x = 0;
      while (x < cols) {
        if (!world.block[y][x]) { x++; continue; }
        if (nearPointer(x, y)) {                          // around the cursor, draw cell by cell so blocks can shift
          const [ox, oy] = push((x + 0.5) * s, (y + 0.5) * s);
          ctx.fillRect(x * s + ox, y * s + oy, s + 0.6, s + 0.6);
          x++;
          continue;
        }
        const x0 = x;
        while (x < cols && world.block[y][x] && !nearPointer(x, y)) x++;
        ctx.fillRect(x0 * s, y * s, (x - x0) * s + 0.6, s + 0.6);
      }
    }
    // accent cells
    for (const a of world.accents) { const [ox, oy] = push((a.x + 0.5) * s, (a.y + 0.5) * s); ctx.fillStyle = a.c; ctx.fillRect(a.x * s + ox, a.y * s + oy, s, s); }
    // loose blocks: modular, slightly inset, they slide when nudged and light up near the cursor
    for (const l of world.loose) {
      let x = l.x;
      const sh = shifts.find((q) => q.l === l);
      if (sh) { const t = clamp((now - sh.t0) / 420); x = sh.from + (sh.to - sh.from) * easeInOut(t); if (t >= 1) shifts.splice(shifts.indexOf(sh), 1); }
      const cx = (x + 0.5) * s, cy = (l.y + 0.5) * s;
      const [ox, oy] = push(cx, cy);
      const hot = pointer && !coarse && Math.hypot(cx - pointer.x, cy - pointer.y) < R * 0.7;
      ctx.fillStyle = hot ? COLORS.green : COLORS.dark;
      ctx.fillRect(x * s + 2 + ox * 2, l.y * s + 2 + oy * 2, s - 4, s - 4);
    }
  }

  function drawMe(now) {
    const m = s * 0.48;
    let { x, y } = me, sq = me.squash, alpha = 1;
    if (move) {
      const t = clamp((now - move.t0) / move.dur);
      const { a, b } = move;
      if (move.kind === 'tunnel') {
        // walk to the far opening, fall in; pop out of the first one and land on the start
        const gy = world.groundTop * s;
        if (t < 0.3) { const u = easeInOut(t / 0.3); x = a.x + (move.o1 - a.x) * u; y = a.y - Math.sin(Math.PI * u) * s * 0.8; }
        else if (t < 0.45) { const u = (t - 0.3) / 0.15; x = move.o1; y = a.y + (H + s * 2 - a.y) * u * u; alpha = 1 - u; }
        else if (t < 0.55) { x = move.o0; y = H + s * 2; alpha = 0; }
        else { const u = (t - 0.55) / 0.45; x = move.o0 + (b.x - move.o0) * easeInOut(u); y = gy + s * 2 + (b.y - gy - s * 2) * u - Math.sin(Math.PI * u) * s * 3.2; alpha = clamp(u * 4); }
      } else if (move.kind === 'drop') {
        // step off the edge, then fall straight into the gap
        if (t < 0.55) { const u = easeInOut(t / 0.55); x = a.x + (b.x - a.x) * u; y = a.y - Math.sin(Math.PI * u) * s * 0.6; }
        else { const u = (t - 0.55) / 0.45; x = b.x; y = a.y + (b.y - a.y) * (u * u); }
      } else {
        // hop or climb: one arc that clears whatever is in between
        const e = easeInOut(t);
        x = a.x + (b.x - a.x) * e;
        const base = a.y + (b.y - a.y) * e;
        const lift = Math.max(s * 0.7, Math.min(a.y, b.y) - move.apex);
        y = base - Math.sin(Math.PI * t) * lift;
      }
      sq = t < 0.08 ? (0.08 - t) * 8 : 0;                 // small crouch before take-off
      if (t >= 1) { x = b.x; y = b.y; me.x = x; me.y = y; step = move.to; move = null; arrive(); }
    } else if (react) {
      const t = clamp((now - react.t0) / 360);
      y -= Math.sin(Math.PI * t) * s * 0.35;
      if (t >= 1) react = null;
    }
    me.squash = Math.max(0, me.squash - 0.07);
    const sy = 1 - sq * 0.18, sx = 1 + sq * 0.12;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    for (const c of BODY) { ctx.fillStyle = c.c; ctx.fillRect(-m + c.x * m + 0.5, -(c.y + 1) * m + 0.5, m - 1, m - 1); }
    // one tiny eye, looking where it's going (or at the cursor)
    ctx.fillStyle = COLORS.dark;
    const ex = me.face > 0 ? m * 0.35 : -m * 0.65;
    ctx.fillRect(ex, -3 * m + m * 0.3, Math.max(2, m * 0.22), Math.max(2, m * 0.22));
    ctx.restore();
  }

  function frame(now) {
    drawWorld(now);
    drawMe(now);
    // keep exploring on its own, unless someone is steering
    if (!reduced && !move && now > waitUntil && now > manualUntil && world.route.length > 1) go(step + 1, false);
  }

  function loop(now) { frame(now); raf = visible ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!raf && !reduced) raf = requestAnimationFrame(loop); }

  /* ---------- input ---------- */
  const local = (e) => { const b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer = local(e);
    // the character notices you
    const d = Math.hypot(pointer.x - me.x, pointer.y - (me.y - s * 0.6));
    if (!move && d < s * 2.4 && performance.now() - lastReact > 1400 && !reduced) {
      lastReact = performance.now();
      me.face = pointer.x >= me.x ? 1 : -1;
      react = { t0: lastReact };
    }
    kick();
  });
  root.addEventListener('pointerleave', () => { pointer = null; });
  // touch: tap somewhere and the character heads to the closest spot
  canvas.addEventListener('click', (e) => {
    const p = local(e);
    goNear(p.x / s, p.y / s);
  });
  addEventListener('keydown', (e) => {
    if (root.getBoundingClientRect().bottom < 120 || e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(step + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(step - 1, true); }
  });

  /* ---------- start ---------- */
  layout();
  if (reduced) { frame(performance.now()); arrive(); frame(performance.now()); }
  else { waitUntil = performance.now() + 900; kick(); }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }).observe(root);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); frame(performance.now()); }, 150); });
  document.fonts?.ready.then(() => { layout(); frame(performance.now()); });

  return { go };
}
