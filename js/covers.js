import { rng, COLORS } from './util.js';

/**
 * Generated placeholder covers in the site's visual language.
 * Clearly labelled — replace by setting `cover` in data.js.
 */
export function placeholderCover(seed, style = 'pixel', label = 'Placeholder', w = 1600, h = 1000) {
  const r = rng(seed + style);
  let bg = COLORS.paper, body = '', ink = '#111';
  const rect = (x, y, rw, rh, f, o = 1) => `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${f}"${o < 1 ? ` fill-opacity="${o}"` : ''}/>`;
  const text = (x, y, t, f, s = 22, extra = '') => `<text x="${x}" y="${y}" fill="${f}" font-size="${s}" font-family="ui-monospace,Menlo,Consolas,monospace"${extra}>${t}</text>`;

  if (style === 'pixel') {
    const c = 40, cols = w / c, rows = Math.ceil(h / c);
    const blues = ['#694aff', '#5636e8', '#c4b8ff', '#ebe6ff'], greens = ['#06df72', '#05b862', '#9df2c6', '#d5fbe7'];
    for (let x = 0; x < cols; x++) {
      const bias = Math.sin(x * 0.45 + r() * 2) * 0.18;
      for (let y = 0; y < rows; y++) {
        const t = y / rows + bias + (r() - 0.5) * 0.35;
        const set = t < 0.5 ? blues : greens;
        let f = set[(r() * set.length) | 0];
        if (r() < 0.02) f = '#c4b8ff';
        body += rect(x * c, y * c, c, c, f);
      }
    }
    for (let i = 0; i < 7; i++) {
      const x = 60 + r() * (w - 420), y = 90 + r() * (h - 200);
      body += rect(x, y - 16, 16, 16, '#111') + text(x + 28, y, ['FIELD NOTE', 'INSIGHT', 'JOURNEY', 'TOUCHPOINT', 'PATTERN', 'SIGNAL', 'PEOPLE'][i], '#111');
    }
  } else if (style === 'blocks') {
    bg = '#141414'; ink = '#ffffff';
    const c = 56;
    for (let x = 0; x < w; x += c * 4) body += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#2e2e2e"/>`;
    const accents = [COLORS.orange, COLORS.yellow, COLORS.pink, '#694aff', COLORS.green, '#ff5500'];
    for (let i = 0; i < 26; i++) {
      const x = ((r() * w) / c | 0) * c, y = ((r() * h) / c | 0) * c;
      body += rect(x, y, c, c, accents[(r() * accents.length) | 0]);
      if (r() < 0.4) body += rect(x, y + c * 1.6, c * 0.7, 4, accents[(r() * accents.length) | 0]);
    }
    body += `<text x="90" y="230" fill="#ffffff" font-size="150" font-family="Helvetica,Arial,sans-serif" font-weight="500" letter-spacing="-6">Aa</text>`;
  } else if (style === 'ascii') {
    bg = '#000000'; ink = '#ffffff';
    const cs = 28, chars = '#+=-:.[]{}@%$/\\';
    const blobs = [[0.3, 0.45, '#06df72'], [0.7, 0.4, '#694aff'], [0.55, 0.75, '#ff5500']];
    for (let y = cs; y < h; y += cs) {
      for (let x = cs; x < w; x += cs) {
        let best = null, bd = 1e9;
        for (const b of blobs) { const d = Math.hypot(x / w - b[0], (y / h - b[1]) * 0.7); if (d < bd) { bd = d; best = b; } }
        if (bd < 0.13 + r() * 0.05) {
          body += rect(x - cs / 2, y - cs / 2, cs, cs, best[2], 0.35 + r() * 0.6);
          body += text(x - 7, y + 7, chars[(r() * chars.length) | 0], '#111', 20);
        } else if (r() < 0.12) {
          body += text(x - 6, y + 6, r() < 0.5 ? '.' : '#', '#444444', 18);
        }
      }
    }
  } else if (style === 'bars') {
    const lines = ['field = curl(noise(p))', 'insight = observe(people)', 'map(journey, 0, 255)', 'filter(data, by=need)',
      'group = cluster(themes)', 'chart.update(dt)', 'decision = weigh(evidence)', 'render(view)'];
    const fills = ['#694aff', '#ff5500', '#694aff', '#06df72', '#7a2300', '#023b1f'];
    lines.forEach((l, i) => {
      const y = h - 160 - i * 82, x = 120 + i * 120;
      let cx = x;
      l.split(/(?=[=(.])/).forEach((seg) => {
        const sw = seg.length * 26 + 20;
        body += rect(cx, y - 50, sw, 64, fills[(r() * fills.length) | 0]) + text(cx + 10, y - 6, seg.replace(/&/g, '&amp;').replace(/</g, '&lt;'), '#111', 40);
        cx += sw;
      });
    });
  } else if (style === 'dots') {
    const s = 52, ls = 'PEOPLEFIELDNOTES';
    const cx = w * 0.62, cy = h * 0.55;
    const fills = [COLORS.pink, COLORS.yellow, '#694aff', '#023b1f', '#555'];
    for (let y = s; y < h; y += s) for (let x = s; x < w; x += s) {
      const d = Math.hypot(x - cx, y - cy);
      const warm = d > 160 && d < 300 && r() < 0.8;
      body += `<circle cx="${x}" cy="${y}" r="20" ${warm ? `fill="${fills[(r() * 5) | 0]}"` : 'fill="none" stroke="#111" stroke-opacity=".25"'}/>`;
      body += text(x - 7, y + 8, ls[(r() * ls.length) | 0], '#111', 22);
    }
  }

  const tagW = label.length * 13 + 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<rect width="100%" height="100%" fill="${bg}"/>${body}
${rect(40, h - 84, tagW, 44, ink === '#111' ? '#111' : '#ffffff')}${text(60, h - 55, label.toUpperCase(), ink === '#111' ? '#ffffff' : '#111', 20)}
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const coverOf = (p) => p.cover || placeholderCover(p.slug, p.coverStyle, 'Placeholder — replace cover');
