import { COLORS, ACCENTS, clamp, reducedMotion, fitCanvas, rng } from './util.js';

const SHAPES = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],          // I
  [[0, 0], [1, 0], [0, 1], [1, 1]],          // O
  [[0, 0], [1, 0], [2, 0], [1, 1]],          // T
  [[0, 0], [0, 1], [0, 2], [1, 2]],          // L
  [[1, 0], [1, 1], [1, 2], [0, 2]],          // J
  [[1, 0], [2, 0], [0, 1], [1, 1]],          // S
  [[0, 0], [1, 0], [1, 1], [2, 1]],          // Z
];
const STACK = '#1f1f1f';      // resting blocks: quiet, near-black
const FALL_SPEED = 1.9;       // blocks per second — deliberately slow

/** Rotate a shape 0–3 quarter turns and normalise to (0,0). */
function rotate(shape, turns) {
  let s = shape;
  for (let i = 0; i < turns; i++) s = s.map(([x, y]) => [-y, x]);
  const mx = Math.min(...s.map((p) => p[0])), my = Math.min(...s.map((p) => p[1]));
  return s.map(([x, y]) => [x - mx, y - my]);
}

/**
 * Dark opening: multilingual greeting + Tetris pieces that
 * fall slowly onto a pile resting on the bottom edge, then a scroll-driven
 * "stacking" transition into the light portfolio.
 */
export function initHero(root, { greetings, onProgress }) {
  const canvas = root.querySelector('canvas');
  const word = root.querySelector('.greet__word');
  const mark = root.querySelector('.greet__mark');
  const greet = root.querySelector('.greet');
  const meta = root.querySelector('.hero__meta');
  const reduced = reducedMotion();
  const rand = rng('ankita');

  let ctx, W, H, cell, bs, cols, rows, cells = [];
  let grid = [], falling = [], flashes = [], maxStack = 4, nextSpawn = 0;
  let progress = 0, visible = true, raf = 0, last = performance.now(), started = performance.now();

  /* ---------------- greeting ---------------- */
  let hintTimer = 0;
  const finish = () => {
    root.classList.add('is-ready');
    // a small 'Drag a block' hint, 3s after the greeting has settled
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => root.classList.add('hint-on'), 3000);
  };

  // One easing for everything: fast start, long soft settle (expo-out).
  const EASE = 'cubic-bezier(.19,1,.22,1)';
  // Returning visitors get a quicker version of the same greeting.
  let repeat = false;
  try { repeat = !!localStorage.getItem('ankita:greeted'); localStorage.setItem('ankita:greeted', '1'); } catch (e) { /* private mode */ }
  const OUT = repeat ? 60 : 80, IN = repeat ? 200 : 260;

  /** Clean swap: current word lifts away and fades, next rises in from just below. */
  function show(text, i, first = false) {
    const enter = () => {
      word.textContent = text;
      mark.style.background = ACCENTS[i % ACCENTS.length];
      if (!reduced) {
        word.animate(
          [{ transform: 'translateY(28%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: IN, easing: EASE, fill: 'both' }
        );
      }
    };
    if (reduced || first) return enter();
    word.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-22%)', opacity: 0 }],
      { duration: OUT, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'both' }
    ).onfinish = enter;
  }

  // Each play gets an id; timers from an older play bail out, so a replay never mixes with the last one.
  let gen = 0;
  const later = (id, fn, ms) => setTimeout(() => { if (id === gen) fn(); }, ms);

  /** The full greeting: languages at an even rhythm, then "Hello" typed out and the "!" landing. */
  function play(quick) {
    const id = ++gen;
    word.getAnimations().forEach((a) => a.cancel());
    if (reduced) { show(greetings[greetings.length - 1], 1); finish(); return; }
    const hold = quick ? 260 : 420, step = quick ? 110 : 175;
    show(greetings[0], 0, true);
    greetings.slice(1, -1).forEach((g, i) => later(id, () => show(g, i + 1), hold + i * step));
    later(id, () => type(greetings[greetings.length - 1], id, quick), hold + (greetings.length - 2) * step);
  }
  play(repeat);

  /** Clear the word, then type the text one letter at a time; a trailing "!" pops in last. */
  function type(text, id, quick) {
    const bang = text.endsWith('!');
    const body = bang ? text.slice(0, -1) : text;
    word.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT, fill: 'both' }).onfinish = () => {
      if (id !== gen) return;
      word.getAnimations().forEach((a) => a.cancel());
      word.textContent = '';
      mark.style.background = ACCENTS[1];
      let n = 0;
      const tick = () => {
        word.textContent = body.slice(0, ++n);
        if (n < body.length) return later(id, tick, quick ? 55 : 85);
        if (!bang) return finish();
        later(id, () => {
          const b = document.createElement('span');
          b.style.display = 'inline-block';
          b.textContent = '!';
          word.append(b);
          b.animate(
            [{ transform: 'translateY(-40%) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)' }
          );
          finish();
        }, quick ? 140 : 220);
      };
      later(id, tick, 60);
    };
  }

  /* ---------------- canvas ---------------- */
  const at = (x, y) => (y < 0 ? null : grid[y * cols + x]);
  const heightOf = (x) => { for (let y = 0; y < rows; y++) if (grid[y * cols + x]) return rows - y; return 0; };

  function layout() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
    cell = W < 700 ? 22 : 30;
    // Tetris blocks and the scroll transition share one fine grid
    bs = Math.round(cell * 0.45);
    cols = Math.ceil(W / bs);
    rows = Math.ceil(H / bs);
    maxStack = 6; // the pile stays a thin strip below the hero labels
    const r = rng('cells');
    cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const fromBottom = (rows - 1 - y) / rows;
        // stack bottom-up, column-staggered like pieces landing
        const colBias = Math.sin(x * 0.3) * 0.03 + r() * 0.12;
        cells.push({ x, y, t: fromBottom * 0.8 + colBias, c: r() < 0.14 ? ACCENTS[(r() * ACCENTS.length) | 0] : STACK });
      }
    }
    // the pile already resting on the bottom edge
    const g = rng('pile');
    grid = new Array(cols * rows).fill(null);
    for (let x = 0; x < cols; x++) {
      const h = 1 + Math.floor(Math.abs(Math.sin(x * 0.45 + 1)) * 2) + (g() < 0.2 ? 1 : 0);
      for (let y = rows - h; y < rows; y++) grid[y * cols + x] = g() < 0.12 ? ACCENTS[(g() * ACCENTS.length) | 0] : STACK;
    }
    // a few pieces have already landed on the pile when the page opens
    for (let i = 0; i < Math.round(cols / 9); i++) {
      const shape = rotate(SHAPES[(g() * SHAPES.length) | 0], (g() * 4) | 0);
      const w = Math.max(...shape.map((p) => p[0])) + 1;
      const x = (g() * (cols - w + 1)) | 0;
      let y = 0;
      while (fits(shape, x, y + 1)) y++;
      if (!fits(shape, x, y) || rows - y > maxStack) continue;
      const c = ACCENTS[(g() * ACCENTS.length) | 0];
      for (const [sx, sy] of shape) grid[(y + sy) * cols + x + sx] = c;
    }
    falling = [];
    flashes = [];
    nextSpawn = 0;
    buildGrid();
  }

  /** Uneven guide grid: lines snap to the block grid but gaps vary, segments get their own rhythm. */
  let gridX = [], gridY = [], gridV = [], gridH = [];
  function buildGrid() {
    const r = rng('grid');
    const lines = (len, from) => {
      const out = [];
      for (let p = from; p < len; p += bs * (4 + ((r() * 6) | 0))) out.push(Math.round(p));
      return out;
    };
    gridX = lines(W, (bs * ((r() * 4) | 0)));
    gridY = lines(H, (H - rows * bs) % bs);
    const segParams = () => ({
      sp: 0.7 + r() * 1.3,          // speed (rad/s)
      ph: r() * 6.283,              // phase
      cut: -0.2 + r() * 0.9,        // higher = visible less often
      base: r() < 0.3 ? 0.25 : 0,   // a few segments never fully disappear
    });
    gridV = gridX.map(() => gridY.map(segParams));
    gridH = gridY.map(() => gridX.map(segParams));
  }

  /** Can `shape` sit with its top-left at grid (x, y)? */
  function fits(shape, x, y) {
    for (const [sx, sy] of shape) {
      const gx = x + sx, gy = y + sy;
      if (gx < 0 || gx >= cols || gy >= rows) return false;
      if (at(gx, gy)) return false;
    }
    return true;
  }

  let side = false;
  /** burst = the opening few seconds: pieces fade in below the greeting and drop quickly. */
  function spawn(now, burst) {
    const shape = rotate(SHAPES[(rand() * SHAPES.length) | 0], (rand() * 4) | 0);
    const w = Math.max(...shape.map((p) => p[0])) + 1;
    side = !side; // alternate left / right so both sides stay alive
    let x, y, fade, v;
    if (burst) {
      // anywhere across the width, starting just below the greeting line
      const half = Math.floor(cols / 2) - w;
      x = side ? (rand() * half) | 0 : cols - w - ((rand() * half) | 0);
      y = Math.floor(rows * (0.56 + rand() * 0.24)); // some start just above the pile and land almost at once
      fade = true;
      v = FALL_SPEED * (3 + rand() * 1.5);
    } else {
      // keep clear of the greeting: drop down the left and right thirds
      const band = Math.max(1, Math.floor(cols * 0.32) - w);
      x = side ? (rand() * band) | 0 : cols - w - ((rand() * band) | 0);
      // about half the pieces appear mid-air (fading in) so they reach the pile sooner
      fade = rand() < 0.5;
      y = fade ? Math.floor(rows * (0.2 + rand() * 0.4)) : -4;
      // pieces appearing mid-air drop faster than the ones drifting in from the top
      v = FALL_SPEED * (fade ? 2 + rand() * 0.8 : 0.85 + rand() * 0.3);
    }
    if (falling.some((p) => Math.abs(p.x - x) < (burst ? 4 : 8) && Math.abs(p.y - y) < 6)) return;
    if (!fits(shape, x, y)) return;
    falling.push({ shape, x, y, born: now, fade, fadeMs: burst ? 650 : 900, v, c: ACCENTS[(rand() * ACCENTS.length) | 0] });
  }

  function lock(p, gy) {
    for (const [sx, sy] of p.shape) {
      const y = gy + sy;
      if (y >= 0) grid[y * cols + p.x + sx] = p.c;
    }
    flashes.push({ shape: p.shape, x: p.x, y: gy, t: 1 });
    // keep the pile low: when it grows too tall, the bottom row sinks away
    const tallest = () => { let t = 0; for (let x = 0; x < cols; x++) t = Math.max(t, heightOf(x)); return t; };
    while (tallest() > maxStack) {
      grid.splice((rows - 1) * cols, cols);
      grid.unshift(...new Array(cols).fill(null));
    }
    // there is always ground to land on
    for (let x = 0; x < cols; x++) grid[(rows - 1) * cols + x] ??= STACK;
  }

  function step(dt, now) {
    const burst = now - started < 4200;
    const cap = burst ? (W < 700 ? 5 : 10) : (W < 700 ? 3 : 5);
    if (now > nextSpawn && falling.length < cap) {
      spawn(now, burst);
      nextSpawn = now + (burst ? 180 + rand() * 220 : 1400 + rand() * 1800);
    }
    for (let i = falling.length - 1; i >= 0; i--) {
      const p = falling[i];
      if (p === held) continue; // in the visitor's hand
      const ny = p.y + p.v * (p.dropped ? 4 : 1) * dt;
      const gy = Math.floor(ny);
      if (!fits(p.shape, p.x, gy + 1)) { lock(p, gy); falling.splice(i, 1); }
      else p.y = ny;
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t -= dt * 1.6;
      if (flashes[i].t <= 0) flashes.splice(i, 1);
    }
  }

  function draw(now) {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    const age = now - started;
    if (!reduced) step(dt, now);
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(0, 0, W, H);

    const intro = clamp(age / 900);
    const oy = H - rows * bs; // anchor the grid to the bottom edge

    // faint guide grid behind the greeting: uneven columns and rows; each segment fades in and out
    // on its own rhythm, so parts of the grid appear, drift and disappear. Strongest around the centre.
    const t = reduced ? 0 : age / 1000;
    const cx = W / 2, cy = H * 0.5, reach = Math.max(W, H) * 0.6;
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.paper;
    const seg = (s, x1, y1, x2, y2) => {
      const fall = clamp(1 - Math.hypot((x1 + x2) / 2 - cx, (y1 + y2) / 2 - cy) / reach);
      if (fall <= 0) return;
      const wave = Math.sin(t * s.sp + s.ph);              // -1..1 at the segment's own speed
      const on = clamp((wave - s.cut) / (1 - s.cut));       // only visible above its threshold
      const a = intro * 0.16 * fall * (s.base + (1 - s.base) * on * on);
      if (a < 0.004) return;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    for (let i = 0; i < gridX.length; i++) for (let j = 0; j < gridY.length - 1; j++) {
      const x = gridX[i] + 0.5; seg(gridV[i][j], x, gridY[j], x, gridY[j + 1]);
    }
    for (let j = 0; j < gridY.length; j++) for (let i = 0; i < gridX.length - 1; i++) {
      const y = gridY[j] + 0.5; seg(gridH[j][i], gridX[i], y, gridX[i + 1], y);
    }

    // the pile on the bottom edge
    ctx.globalAlpha = intro;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y * cols + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * bs + 1, oy + y * bs + 1, bs - 2, bs - 2);
      }
    }
    // a brief glow where a piece has just landed
    for (const f of flashes) {
      ctx.globalAlpha = intro * f.t * 0.5;
      ctx.fillStyle = COLORS.paper;
      for (const [sx, sy] of f.shape) ctx.fillRect((f.x + sx) * bs + 1, oy + (f.y + sy) * bs + 1, bs - 2, bs - 2);
    }
    // pieces on their way down
    ctx.globalAlpha = intro;
    for (const p of falling) {
      const k = p.fade ? clamp((now - p.born) / p.fadeMs) : 1;
      ctx.globalAlpha = intro * k;
      ctx.filter = k < 1 ? `blur(${((1 - k) * 6).toFixed(1)}px)` : 'none'; // soft focus-in
      ctx.fillStyle = p.c;
      for (const [sx, sy] of p.shape) ctx.fillRect((p.x + sx) * bs + 1, oy + (p.y + sy) * bs + 1, bs - 2, bs - 2);
      if (p === held) {
        ctx.filter = 'none';
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = COLORS.paper;
        ctx.lineWidth = 1.5;
        for (const [sx, sy] of p.shape) ctx.strokeRect((p.x + sx) * bs + 0.5, oy + (p.y + sy) * bs + 0.5, bs - 1, bs - 1);
      }
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

    // scroll transition: Lego-sized blocks stack up from the bottom, then settle into paper
    if (progress > 0) {
      const pe = progress * 1.12;
      for (const c of cells) {
        if (pe <= c.t - 0.06) continue;
        const px = c.x * bs, py = oy + c.y * bs;
        const settle = clamp((pe - c.t) / 0.05); // 0 = coloured block, 1 = paper
        if (settle < 1) {
          ctx.globalAlpha = clamp((pe - c.t + 0.06) / 0.03);
          ctx.fillStyle = c.c;
          ctx.fillRect(px + 1, py + 1, bs - 2, bs - 2);
        }
        if (settle > 0) {
          ctx.globalAlpha = settle;
          ctx.fillStyle = COLORS.paper;
          ctx.fillRect(px, py, bs + 0.5, bs + 0.5);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  function loop(now) {
    draw(now);
    raf = visible && !reduced ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  /* The tall scroll-through (greeting → paper transition) only plays on the way down.
     Once the intro has reached the top of the screen, the hero collapses to one screen — the scroll position
     is shifted by the same amount so nothing visibly moves — and scrolling back up is short.
     Back at the very top, the full-length version returns. */
  let collapsed = false;
  function setCollapsed(on) {
    if (on === collapsed) return;
    const before = root.offsetHeight;
    collapsed = on;
    root.classList.toggle('is-collapsed', on);
    const delta = root.offsetHeight - before;
    if (delta && on) {
      const top = scrollY + delta;
      const L = window.__lenis;
      const aim = L && L.isScrolling === 'smooth' ? L.targetScroll : null; // e.g. gliding to #work from a nav click
      window.scrollTo({ top, behavior: 'instant' });
      // keep the smooth-scroll engine in step with the corrected position
      L?.scrollTo(top, { immediate: true, force: true });
      if (window.__navGlide) window.__navGlide.reaim();                  // a nav glide is under way: let it re-aim at its section
      else if (aim !== null) L.scrollTo(aim + delta, { force: true, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) }); // keep gliding to the same spot
      requestAnimationFrame(() => { if (Math.abs(scrollY - top) > 2) window.scrollTo({ top, behavior: 'instant' }); });
    }
  }

  function onScroll() {
    const r = root.getBoundingClientRect();
    // collapse once the next section (the intro, which overlaps the hero slightly) has reached the top
    const nextTop = root.nextElementSibling ? root.nextElementSibling.getBoundingClientRect().top : r.bottom;
    if (!collapsed && nextTop <= 0) setCollapsed(true);
    else if (collapsed && scrollY <= 2) setCollapsed(false);
    const total = root.offsetHeight - window.innerHeight;
    progress = collapsed ? 0 : clamp(-r.top / Math.max(1, total));
    const fade = clamp(1 - progress * 2.4);
    greet.style.opacity = fade;
    greet.style.transform = `translateY(${(-progress * 80).toFixed(1)}px)`;
    meta.style.opacity = root.classList.contains('is-ready') ? clamp(1 - progress * 4) : '';
    onProgress?.(progress);
    if (reduced) draw(performance.now()); else kick();
  }

  /* ---- pick up a falling piece: drag it across (and down), tap to rotate, let go to drop ---- */
  let held = null, grab = null;
  const local = (e) => { const b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top - (H - rows * bs) }; };
  const pieceAt = ({ x, y }) => {
    const gx = Math.floor(x / bs), gy = y / bs;
    for (let i = falling.length - 1; i >= 0; i--) {
      const p = falling[i];
      // generous hit area: one block of slack around the piece
      if (p.shape.some(([sx, sy]) => Math.abs(p.x + sx + 0.5 - (gx + 0.5)) <= 1 && gy >= p.y + sy - 1 && gy <= p.y + sy + 2)) return p;
    }
    return null;
  };
  if (!reduced) {
    canvas.addEventListener('pointerdown', (e) => {
      const pt = local(e), p = pieceAt(pt);
      if (!p) return;
      held = p; p.fade = false; p.dropped = false;
      root.classList.add('hint-done'); // they found it — retire the hint
      grab = { dx: pt.x / bs - p.x, dy: pt.y / bs - p.y, sx: e.clientX, sy: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      kick();
    });
    canvas.addEventListener('pointermove', (e) => {
      const pt = local(e);
      if (!held) { canvas.style.cursor = pieceAt(pt) ? 'grab' : ''; return; }
      if (Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) > 6) grab.moved = true;
      // follow the pointer column by column; never into the pile or off the edges
      const w = Math.max(...held.shape.map((q) => q[0])) + 1;
      let nx = Math.round(pt.x / bs - grab.dx);
      nx = Math.max(0, Math.min(cols - w, nx));
      const ny = Math.max(held.y, pt.y / bs - grab.dy); // pieces only ever move down, like Tetris
      if (fits(held.shape, nx, Math.floor(held.y))) held.x = nx;
      let y = held.y;
      while (y < ny && fits(held.shape, held.x, Math.floor(Math.min(ny, y + 1)) + 1)) y = Math.min(ny, y + 1);
      held.y = y;
    });
    const release = (e) => {
      if (!held) return;
      if (!grab.moved) {
        // a tap: rotate a quarter turn if it fits
        const r = rotate(held.shape, 1);
        if (fits(r, held.x, Math.floor(held.y))) held.shape = r;
      } else held.dropped = true; // let go after a drag: it drops quickly into place
      held = null; grab = null;
      canvas.style.cursor = '';
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  layout();
  draw(performance.now());
  // replay the greeting whenever you come back to the hero (not just a still "Hello!")
  let left = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) left = true;
    else { kick(); if (left) { left = false; play(true); } }
  }, { threshold: 0.35 }).observe(root);
  addEventListener('scroll', onScroll, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); onScroll(); draw(performance.now()); }, 120); });
  onScroll();
  kick();
}
