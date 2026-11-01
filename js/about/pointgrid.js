import { COLORS, ACCENTS, clamp, fitCanvas, rng, reducedMotion, isCoarse } from '../util.js';

/**
 * About opening — a point grid that reads like a research map, on black.
 * Clusters of small squares of different sizes sit off-balance around the name and breathe
 * gently. A faint network links them; a pink focus travels it, lighting each link. Text stays
 * out of the way: a cluster's label and phrase type themselves in only when the pointer
 * reaches it (or a keyboard user tabs to it). Everything arrives in sequence on load.
 */

// hand-placed, deliberately uneven: [x, y, size] as fractions of the canvas
const SPOTS_WIDE = [[0.19, 0.3, 1.45], [0.71, 0.2, 0.75], [0.87, 0.7, 1.1], [0.56, 0.86, 0.6], [0.17, 0.76, 0.9]];
const SPOTS_NARROW = [[0.27, 0.22, 1.1], [0.8, 0.3, 0.7], [0.78, 0.76, 1], [0.42, 0.9, 0.6], [0.2, 0.68, 0.8]];
const WHITE = (a) => `rgba(255,255,255,${a})`;

/** Decode text in: each character flickers through a few glyphs before settling, left to right. */
const GLYPHS = '▪▫◼□#/<>=+-_';
export function decode(el, text, { speed = 22, settle = 4, delay = 0 } = {}) {
  clearTimeout(el._decode);
  if (reducedMotion()) { el.textContent = text; return; }
  let frame = 0;
  const run = () => {
    const done = Math.floor(frame / settle);
    el.textContent = [...text].map((ch, i) => (i < done || ch === ' ' ? ch : i < done + 6 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : '')).join('');
    frame++;
    if (done < text.length) el._decode = setTimeout(run, speed);
    else el.textContent = text;
  };
  el._decode = setTimeout(run, delay);
}
const T = { dots: 0, clusters: 300, clusterGap: 250, links: 1700, linkGap: 180, focus: 1850, burst: 1800, depart: 2500 }; // entrance timeline (ms)

// tetromino shapes as grid-cell offsets; clusters show a faint one at a time, joined like Tetris pieces
const PIECES = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [0, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[1, 0], [1, 1], [1, 2], [0, 2]], [[0, 0], [1, 0], [2, 0], [0, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]],
];

export function createPointGrid(root, { clusters }) {
  const canvas = root.querySelector('canvas');
  const labelsEl = root.querySelector('[data-labels]');
  const phraseEl = root.querySelector('[data-phrase]');
  const reduced = reducedMotion();
  const coarse = isCoarse();

  let ctx, W, H, g, cols, rows, ox, oy, groups = [], network = [], lit = new Set(), pointer = null;
  let at = 0, travel = null, waitUntil = 0, manualUntil = 0, raf = 0, visible = true, t0 = performance.now();
  let focus = { x: 0, y: 0 }, pulse = null, near = -1, burst = null;

  /* ---------- layout ---------- */
  function layout() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
    const narrow = W < 760;
    g = narrow ? 18 : 22;
    cols = Math.floor(W / g); rows = Math.floor(H / g);
    ox = (W - (cols - 1) * g) / 2; oy = (H - (rows - 1) * g) / 2;
    const P = (i, j) => ({ x: ox + i * g, y: oy + j * g });
    const spots = narrow ? SPOTS_NARROW : SPOTS_WIDE;
    const r = rng('pointgrid' + (narrow ? 'n' : 'w'));
    groups = clusters.map((c, k) => {
      const [fx, fy, size] = spots[k % spots.length];
      const ci = Math.round((fx * W - ox) / g), cj = Math.round((fy * H - oy) / g);
      const rad = (narrow ? 2.4 : 3) * size;
      const span = Math.ceil(rad) + 1;
      const pts = [];
      for (let j = -span; j <= span; j++) for (let i = -span - 1; i <= span + 1; i++) {
        const d = Math.hypot(i * 0.8, j);
        if (d <= rad * (0.62 + r() * 0.5) && ci + i > 0 && ci + i < cols - 1 && cj + j > 2 && cj + j < rows - 1) {
          pts.push({ ...P(ci + i, cj + j), i: ci + i, j: cj + j, d, accent: false, w: 0.55 + r() * 0.45, ph: r() * 6.283, sp: 0.6 + r() * 0.8 });
        }
      }
      pts.sort((a, b) => a.d - b.d);
      if (pts.length > 2) pts[1 + ((r() * Math.min(5, pts.length - 1)) | 0)].accent = true;
      const cells = new Set(pts.map((q) => q.i + ',' + q.j));
      return { ...c, k, ...P(ci, cj), rad: rad * g, pts, cells, piece: null, born: T.clusters + k * T.clusterGap, lit: 0, color: ACCENTS[k % ACCENTS.length] };
    });
    network = groups.map((gp, k) => route(gp, groups[(k + 1) % groups.length]));
    if (reduced) network.forEach((_, k) => lit.add(k));
    placeLabels();
    at = -1;                                              // the square starts on the name's full stop
    focus = findHome();
    burst = null;                                         // built once the name has settled, so it sits beside it
  }

  /* where the pink full stop of the name sits, in canvas space */
  function findHome() {
    const stop = root.querySelector('.pg__stop');
    if (!stop) return { x: W / 2, y: H / 2 };
    const c = canvas.getBoundingClientRect(), s = stop.getBoundingClientRect();
    return { x: s.left + s.width / 2 - c.left, y: s.bottom - s.width / 2 - c.top };
  }

  /* after the name lands, small grid dots pop out beside it, a few stretching into dashes */
  function makeBurst() {
    const h = findHome(), out = [];
    const r = rng('burst');
    for (let j = -4; j <= 4; j++) for (let i = 1; i <= 9; i++) {
      const x = ox + Math.round((h.x - ox) / g + i) * g, y = oy + Math.round((h.y - oy) / g + j) * g;
      const d = Math.hypot(i, j * 1.3);
      if (d > 8 || r() > 0.42 - d * 0.03) continue;
      out.push({ x, y, delay: d * 70 + r() * 120, dash: r() < 0.18 ? 1 + ((r() * 3) | 0) : 0, c: r() < 0.5 ? COLORS.purple : COLORS.pink });
    }
    return out;
  }

  /* a faint tetromino that fits inside the cluster's points */
  function newPiece(gp, now) {
    for (let n = 0; n < 30; n++) {
      const a = gp.pts[(Math.random() * gp.pts.length) | 0], shape = PIECES[(Math.random() * PIECES.length) | 0];
      const cells = shape.map(([dx, dy]) => [a.i + dx, a.j + dy]);
      if (cells.every(([i, j]) => gp.cells.has(i + ',' + j))) return { cells, t0: now, dur: 2200 + Math.random() * 1600 };
    }
    return { cells: [], t0: now, dur: 1200 };
  }

  /* labels are real buttons (keyboard + touch); each decodes in as its cluster arrives */
  function placeLabels() {
    labelsEl.innerHTML = '';
    groups.forEach((gp, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg__label mono';
      b.dataset.full = gp.label;
      b.style.cssText = `top:${gp.y - gp.rad - g * 1.4}px;--c:${gp.color}`;
      b.innerHTML = `<span class="pg__num">${String(k + 1).padStart(2, '0')}</span><span class="pg__name">${gp.label}</span>`;
      if (reduced) b.classList.add('is-shown');
      b.setAttribute('aria-label', `${gp.label}: ${gp.phrase} ${gp.note}`);
      requestAnimationFrame(() => {
        const w = b.offsetWidth;
        b.style.left = `${clamp(gp.x - w / 2, 12, W - w - 12)}px`;
      });
      b.addEventListener('click', () => go(k, true));
      b.addEventListener('focus', () => setNear(k));
      b.addEventListener('blur', () => setNear(-1));
      labelsEl.append(b);
    });
  }

  /* a label is visible only for the cluster the square is heading to (or the one under the pointer) */
  let target = -1;
  function syncLabels() {
    [...labelsEl.children].forEach((el, i) => {
      const show = reduced || i === target || i === near;
      if (show && !el.classList.contains('is-shown')) decode(el.querySelector('.pg__name'), groups[i].label, { speed: 18 });
      el.classList.toggle('is-shown', show);
      el.classList.toggle('is-on', i === near);
    });
  }
  function setTarget(k) { target = k; syncLabels(); }

  /* the cluster the pointer (or keyboard) is at lights up and types its phrase */
  function setNear(k) {
    if (k === near) return;
    near = k;
    syncLabels();
    if (k < 0) { if (!travel && at >= 0) showPhrase(groups[at]); else hidePhrase(); return; } // back to the square's step
    showPhrase(groups[k]);
  }
  function typeInto(el, text) {
    clearTimeout(el._typing);                           // each element types on its own timer
    if (reduced) { el.textContent = text; return; }
    let n = 0;
    const tick = () => { el.textContent = text.slice(0, ++n); if (n < text.length) el._typing = setTimeout(tick, 28); };
    tick();
  }

  /* routes run along grid lines: across, then down or up — never diagonally */
  function route(a, b) { return { pts: [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }] }; }
  const len = (p) => p.pts.reduce((s, q, i) => (i ? s + Math.hypot(q.x - p.pts[i - 1].x, q.y - p.pts[i - 1].y) : 0), 0);
  function strokePart(p, upto) {
    let rem = upto;
    ctx.beginPath();
    ctx.moveTo(p.pts[0].x, p.pts[0].y);
    for (let i = 1; i < p.pts.length && rem > 0; i++) {
      const a = p.pts[i - 1], b = p.pts[i], l = Math.hypot(b.x - a.x, b.y - a.y);
      const q = rem >= l ? b : { x: a.x + ((b.x - a.x) * rem) / l, y: a.y + ((b.y - a.y) * rem) / l };
      ctx.lineTo(q.x, q.y);
      rem -= l;
    }
    ctx.stroke();
  }
  const along = (p, d) => {
    for (let i = 1; i < p.pts.length; i++) {
      const a = p.pts[i - 1], b = p.pts[i], l = Math.hypot(b.x - a.x, b.y - a.y);
      if (d <= l) return { x: a.x + ((b.x - a.x) * d) / Math.max(1, l), y: a.y + ((b.y - a.y) * d) / Math.max(1, l) };
      d -= l;
    }
    return p.pts[p.pts.length - 1];
  };

  function go(k, manual) {
    k = (k + groups.length) % groups.length;
    if (manual) manualUntil = performance.now() + 8000;
    if (k === at && !travel) { arrive(); return; }
    if (at < 0) { focus = findHome(); root.querySelector('.pg__stop')?.classList.add('is-gone'); } // the stop itself sets off
    const p = route({ x: focus.x, y: focus.y }, groups[k]);
    const edge = (at + 1) % groups.length === k ? at : -1;
    if (reduced) { at = k; focus = { x: groups[k].x, y: groups[k].y }; arrive(); draw(performance.now()); return; }
    travel = { p, to: k, edge, t0: performance.now(), dur: clamp(len(p) / 0.55, 550, 1500) };
    if (near < 0) hidePhrase();                // the line clears while the square moves on
    setTarget(k);                                        // the destination's name decodes in as the square sets off
    kick();
  }
  function arrive() {
    const gp = groups[at];
    setTarget(at);
    pulse = { x: gp.x, y: gp.y, t0: performance.now(), c: gp.color, s: gp.rad * 2 };
    if (near < 0) showPhrase(gp);              // the step's line types in when the square arrives
    waitUntil = performance.now() + 1400 + gp.phrase.length * 28;   // long enough to read the label and its line
  }
  function showPhrase(gp) {
    phraseEl.classList.remove('is-on');
    phraseEl.textContent = '';
    const w = Math.min(280, W - 32);
    phraseEl.style.maxWidth = `${w}px`;
    phraseEl.textContent = gp.phrase;
    const pw = Math.min(phraseEl.offsetWidth || w, w);
    phraseEl.textContent = '';
    const left = clamp(gp.x - pw / 2, 16, W - pw - 16);
    const below = gp.y + gp.rad + g * 1.4;
    const top = below > H - 70 ? gp.y - gp.rad - g * 3.6 : below;
    Object.assign(phraseEl.style, { left: `${left}px`, top: `${top}px`, width: `${pw}px` });
    phraseEl.classList.add('is-on');
    typeInto(phraseEl, gp.phrase);
  }
  function hidePhrase() { phraseEl.classList.remove('is-on'); }

  /* ---------- drawing ---------- */
  function draw(now) {
    const age = reduced ? 1e6 : now - t0;
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(0, 0, W, H);

    // 1. the dot field fades in as a soft diagonal wave; the cursor brightens what it passes
    const R = 110;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = ox + i * g, y = oy + j * g;
      const appear = clamp((age - T.dots - (i + j) * 6) / 500);
      if (appear <= 0) continue;
      let k = 0;
      if (pointer && !coarse) { const d = Math.hypot(x - pointer.x, y - pointer.y); if (d < R) k = Math.pow(1 - d / R, 1.8); }
      const s = 1 + k * 2.2;
      ctx.fillStyle = WHITE((0.13 + k * 0.6) * appear);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }

    // 2. the network draws itself in, link by link, after the clusters have arrived
    ctx.lineWidth = 1;
    network.forEach((p, k) => {
      const reveal = clamp((age - T.links - k * T.linkGap) / 700);
      if (reveal <= 0 && !lit.has(k)) return;
      ctx.strokeStyle = WHITE(lit.has(k) ? 0.3 : 0.08);
      strokePart(p, len(p) * (lit.has(k) ? 1 : reveal));
    });

    // 3. the focus in motion
    if (travel) {
      const t = clamp((now - travel.t0) / travel.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const L = len(travel.p) * e;
      ctx.strokeStyle = COLORS.pink;
      ctx.lineWidth = 1.5;
      strokePart(travel.p, L);
      ctx.lineWidth = 1;
      focus = along(travel.p, L);
      if (t >= 1) { if (travel.edge >= 0) lit.add(travel.edge); at = travel.to; travel = null; arrive(); }
    }

    // 4. clusters: arrive one by one, then breathe gently — each square on its own slow rhythm
    for (const gp of groups) {
      const grow = clamp((age - gp.born) / 700);
      if (grow <= 0) continue;
      const active = (gp.k === at && !travel) || gp.k === near;
      gp.lit += ((active ? 1 : 0.42) - gp.lit) * 0.07;
      gp.pts.forEach((q, n) => {
        const local = clamp(grow * 1.7 - n / gp.pts.length);
        if (local <= 0) return;
        const breathe = reduced ? 1 : 1 + 0.16 * Math.sin(now / 1000 * q.sp + q.ph);
        const size = g * (0.12 + 0.24 * local * q.w) * breathe;
        const blink = reduced ? 0 : Math.max(0, Math.sin(now / 900 * q.sp + q.ph * 3) - 0.94) * 16; // the odd square flashes
        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(now / 1100 * q.sp + q.ph * 2) + blink;
        if (q.accent) { ctx.fillStyle = gp.color; ctx.globalAlpha = (0.5 + gp.lit * 0.5) * local; }
        else { ctx.fillStyle = COLORS.paper; ctx.globalAlpha = (0.18 + gp.lit * 0.72) * twinkle * local; }
        ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
      });
      ctx.globalAlpha = 1;

      // faint tetromino: fades in, holds, fades out, then another takes its place
      if (!reduced && grow >= 1) {
        if (!gp.piece || now - gp.piece.t0 > gp.piece.dur) gp.piece = newPiece(gp, now + Math.random() * 600);
        const t = (now - gp.piece.t0) / gp.piece.dur;
        if (t > 0) {
          ctx.globalAlpha = 0.09 * Math.min(1, t * 5, (1 - t) * 4);
          ctx.fillStyle = gp.color;
          for (const [i, j] of gp.piece.cells) ctx.fillRect(ox + i * g - g / 2 + 1, oy + j * g - g / 2 + 1, g - 2, g - 2);
          ctx.globalAlpha = 1;
        }
      }
    }

    // the burst beside the name: pops in outward, holds a beat, then fades as the square leaves
    if (!reduced && !burst && age > T.burst) burst = makeBurst();
    if (!reduced && burst) for (const b of burst) {
      const t = (age - T.burst - b.delay) / 1700;
      if (t <= 0 || t >= 1) continue;
      const a = Math.min(1, t * 8, (1 - t) * 3);
      const w = b.dash ? g * (0.3 + b.dash * Math.min(1, t * 4)) : g * 0.22;
      ctx.globalAlpha = a * (b.dash ? 0.9 : 0.55);
      ctx.fillStyle = b.dash ? b.c : COLORS.paper;
      ctx.fillRect(b.x - g * 0.11, b.y - g * 0.11, w, g * 0.22);
    }
    ctx.globalAlpha = 1;

    // 5. arrival pulse
    if (pulse) {
      const t = clamp((now - pulse.t0) / 1000);
      const s = pulse.s + g * 1.5 + t * g * 4;
      ctx.strokeStyle = pulse.c;
      ctx.globalAlpha = 0.9 * (1 - t);
      ctx.strokeRect(pulse.x - s / 2 + 0.5, pulse.y - s / 2 + 0.5, s, s);
      ctx.globalAlpha = 1;
      if (t >= 1) pulse = null;
    }

    // 6. the focus — appears once the network is in
    const show = reduced ? 1 : clamp((age - T.focus) / 300);
    if (show > 0) {
      const fs = g * 0.5;
      ctx.globalAlpha = show;
      ctx.fillStyle = COLORS.pink;
      ctx.fillRect(focus.x - fs / 2, focus.y - fs / 2, fs, fs);
      ctx.globalAlpha = 1;
    }

    const startAt = at < 0 ? T.depart : T.links + network.length * T.linkGap + 400;
    if (!reduced && !travel && now > waitUntil && now > manualUntil && age > startAt) go(at + 1, false);
  }

  function loop(now) { draw(now); raf = visible ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!raf && !reduced) raf = requestAnimationFrame(loop); }

  /* ---------- input: text only where the pointer is ---------- */
  root.addEventListener('pointermove', (e) => {
    const b = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - b.left, y: e.clientY - b.top };
    let k = -1;
    groups.forEach((gp, i) => { if (Math.hypot(gp.x - pointer.x, gp.y - pointer.y) < gp.rad + g * 2) k = i; });
    setNear(k);
    kick();
  });
  root.addEventListener('pointerleave', () => { pointer = null; setNear(-1); });
  canvas.addEventListener('click', (e) => {
    const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    let best = -1, bd = 1e9;
    groups.forEach((gp, k) => { const d = Math.hypot(gp.x - x, gp.y - y); if (d < gp.rad + g * 3 && d < bd) { bd = d; best = k; } });
    if (best >= 0) { setNear(best); go(best, true); }
  });

  /* ---------- start ---------- */
  layout();
  root.classList.add('is-in');                         // CSS staggers the centre text and corner notes
  if (reduced) { draw(performance.now()); } else { kick(); }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }).observe(root);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { travel = null; lit = new Set(); near = -1; layout(); draw(performance.now()); kick(); }, 150); });
}
