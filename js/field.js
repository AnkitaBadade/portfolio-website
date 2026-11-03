import { COLORS, clamp, fitCanvas, rng, reducedMotion } from './util.js';

const FILLS = [COLORS.lavender, COLORS.orange, COLORS.yellow, COLORS.green];
const LETTERS = 'ANKITAUXANKITA';

/**
 * Cursor-responsive field of small letter-discs, arrows, dots and pixels.
 * Near the pointer they warm up (colour), get pulled into an orbiting
 * cluster, then slowly drift back home. Sleeps when nothing moves.
 */
export function createField(container, labelsEl, disciplines) {
  const canvas = container.querySelector('canvas');
  const reduced = reducedMotion();
  const R = 115;
  let ctx, W, H, parts = [], labels = [], raf = 0, visible = false;
  const ptr = { x: -9999, y: -9999, active: false, until: 0 };

  // Real, readable text labels positioned around the field.
  const POS = [[2, 4], [56, 8], [26, 22], [68, 32], [4, 46], [46, 56], [18, 72], [62, 80], [6, 92]];
  labelsEl.innerHTML = disciplines
    .map((d, i) => {
      const [x, y] = POS[i % POS.length];
      return `<li style="--x:${x}%;--y:${y}%;--c:${FILLS[i % FILLS.length]}">${d}</li>`;
    })
    .join('');

  function layout() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
    const r = rng('field');
    const s = W < 520 ? 22 : 27;
    parts = [];
    for (let y = s / 2; y < H; y += s) {
      for (let x = s / 2; x < W; x += s) {
        if (r() < 0.16) continue; // breathing gaps
        const k = r();
        const kind = k < 0.68 ? 'ring' : k < 0.82 ? 'arrow' : k < 0.93 ? 'dot' : 'px';
        const hx = x + (r() - 0.5) * s * 0.5, hy = y + (r() - 0.5) * s * 0.5;
        parts.push({
          hx, hy, x: hx, y: hy, vx: 0, vy: 0, heat: 0,
          kind, ch: LETTERS[(r() * LETTERS.length) | 0],
          rad: s * (0.3 + r() * 0.08),
          fill: FILLS[(r() * FILLS.length) | 0],
          ring: 26 + r() * 52,
          spin: r() < 0.5 ? 1 : -1,
          rot: r() * Math.PI * 2,
        });
      }
    }
    const cb = canvas.getBoundingClientRect();
    labels = [...labelsEl.children].map((li) => {
      li.style.left = '';
      const w = li.offsetWidth, x = li.offsetLeft;
      if (x + w > W - 4) li.style.left = `${Math.max(4, W - w - 4)}px`;
      const b = li.getBoundingClientRect();
      return { li, x: b.left - cb.left + b.width / 2, y: b.top - cb.top + b.height / 2, on: false };
    });
    draw();
  }

  function step() {
    const now = performance.now();
    const active = ptr.active || now < ptr.until;
    let moving = false;
    for (const p of parts) {
      let fx = 0, fy = 0;
      if (active) {
        const dx = p.x - ptr.x, dy = p.y - ptr.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < R) {
          const f = 1 - d / R;
          p.heat = Math.min(1, p.heat + f * 0.035);       // warms up gently
          const nx = dx / d, ny = dy / d;
          const pull = (p.ring - d) * 0.01 * f;          // gather onto an orbit
          fx += nx * pull - ny * f * 0.12 * p.spin;      // + gentle swirl
          fy += ny * pull + nx * f * 0.12 * p.spin;
        }
      }
      p.heat *= 0.992;
      const k = 0.005 + 0.016 * (1 - p.heat);           // warm parts linger, cool ones return
      fx += (p.hx - p.x) * k;
      fy += (p.hy - p.y) * k;
      p.vx = (p.vx + fx) * 0.75;
      p.vy = (p.vy + fy) * 0.75;
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === 'arrow') p.rot += (Math.atan2(ptr.y - p.y, ptr.x - p.x) - p.rot) * 0.08 * p.heat;
      if (p.heat > 0.01 || Math.abs(p.vx) + Math.abs(p.vy) > 0.02 || Math.abs(p.x - p.hx) > 0.3) moving = true;
    }
    for (const l of labels) {
      const on = active && Math.hypot(l.x - ptr.x, l.y - ptr.y) < 110;
      if (on !== l.on) { l.on = on; l.li.classList.toggle('on', on); }
    }
    return moving || active;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // cool parts first, warm on top
    const warm = [];
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0,0.22)';
    ctx.fillStyle = '#000000';
    ctx.font = '500 11px "Geist", system-ui, sans-serif';
    for (const p of parts) {
      if (p.heat > 0.06) { warm.push(p); continue; }
      shape(p, false);
    }
    warm.sort((a, b) => a.heat - b.heat);
    for (const p of warm) shape(p, true);
  }

  function shape(p, hot) {
    const r = p.rad * (hot ? 1 + p.heat * 0.35 : 1);
    if (hot) { ctx.globalAlpha = clamp(0.35 + p.heat); ctx.fillStyle = p.fill; }
    if (p.kind === 'px') {
      if (hot) ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      else { ctx.fillStyle = 'rgba(0, 0, 0,0.55)'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); ctx.fillStyle = '#000000'; }
    } else if (p.kind === 'dot') {
      const d = hot ? r * 0.8 : 2; ctx.beginPath(); ctx.rect(p.x - d, p.y - d, d * 2, d * 2);
      if (hot) ctx.fill(); else ctx.fill();
    } else {
      ctx.beginPath(); ctx.rect(p.x - r, p.y - r, r * 2, r * 2); // square cells, Tetris-like
      if (hot) ctx.fill(); else ctx.stroke();
      ctx.fillStyle = '#000000';
      if (p.kind === 'arrow') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(r * 0.45, 0);
        ctx.moveTo(r * 0.15, -r * 0.3); ctx.lineTo(r * 0.45, 0); ctx.lineTo(r * 0.15, r * 0.3);
        ctx.strokeStyle = '#000000'; ctx.stroke(); ctx.restore();
        ctx.strokeStyle = 'rgba(0, 0, 0,0.22)';
      } else {
        ctx.fillText(p.ch, p.x, p.y + 0.5);
      }
    }
    if (hot) { ctx.globalAlpha = 1; ctx.fillStyle = '#000000'; }
  }

  function loop() {
    const alive = step();
    draw();
    raf = alive && visible ? requestAnimationFrame(loop) : 0;
  }
  const wake = () => { if (!raf && visible && !reduced) raf = requestAnimationFrame(loop); };

  function local(e) {
    const b = canvas.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top, inside: e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom };
  }
  container.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const p = local(e);
    ptr.x = p.x; ptr.y = p.y; ptr.active = p.inside;
    wake();
  });
  container.addEventListener('pointerleave', () => { ptr.active = false; wake(); });
  // Touch: the cluster follows your finger, even while the page scrolls, then lingers after you let go.
  const fromTouch = (e) => {
    const p = local(e.touches[0]);
    if (!p.inside) return;
    ptr.x = p.x; ptr.y = p.y; ptr.active = true;
    wake();
  };
  container.addEventListener('touchstart', fromTouch, { passive: true });
  container.addEventListener('touchmove', fromTouch, { passive: true });
  const lift = () => { ptr.active = false; ptr.until = performance.now() + 1400; wake(); };
  container.addEventListener('touchend', lift);
  container.addEventListener('touchcancel', lift);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(container);
  let rt;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 100); }).observe(container);
  layout();
  if (document.fonts) document.fonts.ready.then(layout);
}
