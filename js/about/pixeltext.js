/* Pixel reveal: the whole name fades in as soft, blocky pixels and sharpens in a few even steps
   to the real font. Each step is rendered once up front, so playback is just drawing images.
   The real text is laid out from the start (transparent), so nothing shifts when it finishes. */
export function pixelate(el, text, { delay = 0, steps = [0.11, 0.075, 0.05, 0.03], stepMs = 110, fadeMs = 240 } = {}) {
  el.textContent = text;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  el.style.position = 'relative';
  el.style.color = 'transparent';
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'absolute', pointerEvents: 'none' });
  el.appendChild(cv);
  const ctx = cv.getContext('2d');

  function start() {
    const cs = getComputedStyle(el), size = parseFloat(cs.fontSize);
    const fill = getComputedStyle(el.parentElement).color;
    const box = el.getBoundingClientRect(), pad = Math.round(size * 0.3);
    const W = box.width + pad * 2, H = box.height + pad * 2;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    Object.assign(cv.style, { left: `${-pad}px`, top: `${-pad}px`, width: `${W}px`, height: `${H}px` });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // one small canvas per step: the text drawn at 1/px scale, later scaled up without smoothing
    const frames = steps.map((f) => {
      const px = Math.max(2, Math.round(size * f));
      const c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = Math.ceil(W / px); c.height = Math.ceil(H / px);
      x.scale(1 / px, 1 / px);
      x.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      x.letterSpacing = cs.letterSpacing;                // match the heading's tight tracking
      x.textBaseline = 'middle'; x.fillStyle = fill;
      x.fillText(text, pad, H / 2);
      return c;
    });

    let t0 = 0;
    const end = steps.length * stepMs;
    function frame(now) {
      if (!t0) t0 = now;
      const t = now - t0;
      if (t >= end) { cv.remove(); el.style.color = ''; return; }
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, t / fadeMs);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frames[Math.floor(t / stepMs)], 0, 0, W, H);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.fonts.ready.then(() => setTimeout(start, delay));
}

/* ASCII reveal: each letter climbs a density ramp (. : - = + * # % @) and lands on itself,
   in a soft left-to-right wave. Plain text throughout, so it stays in the heading's font. */
const RAMP = '.:-=+*#%@';
export function asciify(el, text, { delay = 0, gap = 45, step = 45 } = {}) {
  el.textContent = text;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const chars = [...text], life = RAMP.length * step;
  el.textContent = '';
  let t0 = 0;
  function frame(now) {
    if (!t0) t0 = now;
    const t = now - t0;
    el.textContent = chars.map((ch, i) => {
      if (ch === ' ') return ' ';
      const s = t - i * gap;
      if (s < 0) return '\u2007';                       // figure space keeps the line from collapsing
      return s >= life ? ch : RAMP[Math.floor(s / step)];
    }).join('');
    if (t < (chars.length - 1) * gap + life) requestAnimationFrame(frame);
    else el.textContent = text;
  }
  setTimeout(() => requestAnimationFrame(frame), delay);
}

/* ASCII-pixel reveal: the name is rasterised into a grid of small cells and each cell is drawn as
   an ASCII character by how much of the letter covers it (. : - = + * # % @), like ASCII art.
   Cells switch on in a soft left-to-right wave, flicker up the ramp, then the art fades into the
   real font. The real text is laid out from the start (transparent), so nothing shifts. */
export function asciiPixels(el, text, { delay = 0, cell = 0.1, wave = 650, flicker = 260, hold = 250, fade = 350 } = {}) {
  el.textContent = text;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  el.style.position = 'relative';
  el.style.color = 'transparent';
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'absolute', pointerEvents: 'none' });
  el.appendChild(cv);
  const ctx = cv.getContext('2d');

  function start() {
    const cs = getComputedStyle(el), size = parseFloat(cs.fontSize);
    const fill = getComputedStyle(el.parentElement).color;
    const box = el.getBoundingClientRect(), pad = Math.round(size * 0.3);
    const W = box.width + pad * 2, H = box.height + pad * 2;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    Object.assign(cv.style, { left: `${-pad}px`, top: `${-pad}px`, width: `${W}px`, height: `${H}px` });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const drawText = (c) => { c.font = font; c.letterSpacing = cs.letterSpacing; c.textBaseline = 'middle'; c.fillStyle = fill; c.fillText(text, pad, H / 2); };

    // coverage of each cell, read once from a low-res render of the text
    const px = Math.max(4, Math.round(size * cell));
    const cols = Math.ceil(W / px), rows = Math.ceil(H / px);
    const m = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    m.canvas.width = cols; m.canvas.height = rows;
    m.scale(1 / px, 1 / px);
    drawText(m);
    const a = m.getImageData(0, 0, cols, rows).data, cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = a[(j * cols + i) * 4 + 3] / 255;
      if (v > 0.08) cells.push({ x: i * px + px / 2, y: j * px + px / 2, v, at: (i / cols) * wave + Math.random() * 120 });
    }

    // each ramp character pre-drawn once, so a frame is only cheap image copies
    const atlas = [...RAMP].map((ch) => {
      const c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = Math.ceil(px * dpr);
      x.scale(dpr, dpr);
      x.font = `600 ${px * 1.15}px ui-monospace, "Geist Mono", monospace`;
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = fill;
      x.fillText(ch, px / 2, px / 2);
      return c;
    });
    cells.forEach((c) => { c.top = Math.round(c.v * (RAMP.length - 1)); });
    const end = wave + 120 + flicker + hold + fade;
    let t0 = 0;
    function frame(now) {
      if (!t0) t0 = now;
      const t = now - t0;
      if (t >= end) { cv.remove(); el.style.color = ''; return; }
      ctx.clearRect(0, 0, W, H);
      const out = clamp01((t - (end - fade)) / fade);       // ASCII fades out as the real type fades in
      ctx.globalAlpha = 1 - out;
      for (const c of cells) {
        const s = t - c.at;
        if (s < 0) continue;
        const k = clamp01(s / flicker);                    // climbs the ramp up to its own density
        ctx.drawImage(atlas[Math.round(c.top * k)], c.x - px / 2, c.y - px / 2, px, px);
      }
      if (out > 0) { ctx.globalAlpha = out; drawText(ctx); }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.fonts.ready.then(() => setTimeout(start, delay));
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
