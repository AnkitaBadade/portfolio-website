import { rng } from '../util.js';

/**
 * Builds the About scene's landscape on a grid of square cells.
 * Everything is deterministic for a given size, so the composition is stable
 * between visits and only re-flows when the viewport changes.
 *
 * Returns
 *   block[y][x]  true where a black block sits
 *   accents      [{x, y, c}] the few coloured cells
 *   loose        [{x, y}]    single floating blocks that can shift
 *   details      [{x, y}]    surface cells that hide a small label
 *   openings     [{x, w}]    gaps in the ground the character can drop through
 *   route        [{x, y}]    standing spots, left → right, for the character
 */
export function buildWorld({ cols, rows, reserve, accents: palette, details: nDetails = 4 }) {
  const r = rng(`world-${cols}x${rows}`);
  const block = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const inReserve = (x, y) => x >= reserve.x && x < reserve.x + reserve.w && y >= reserve.y && y < reserve.y + reserve.h;
  const navRows = 2;
  const ground = 2;
  const groundTop = rows - ground;
  const set = (x, y) => { if (x >= 0 && x < cols && y >= navRows && y < rows && !inReserve(x, y)) block[y][x] = true; };
  const empty = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && !block[y][x];
  const clearAround = (x0, y0, w, h, m = 1) => {
    for (let y = y0 - m; y < y0 + h + m; y++) for (let x = x0 - m; x < x0 + w + m; x++) {
      if (x < 0 || x >= cols || y < navRows || y >= rows) continue;
      if (block[y][x] || inReserve(x, y)) return false;
    }
    return true;
  };

  /* 1. ground, broken by a few openings */
  const nOpen = cols > 30 ? 3 : 2;
  const openings = [];
  for (let i = 0; i < nOpen; i++) {
    const w = 2;
    const x = Math.round(((i + 1) / (nOpen + 1)) * cols + (r() - 0.5) * cols * 0.08);
    openings.push({ x: Math.max(2, Math.min(cols - w - 2, x)), w });
  }
  for (let y = groundTop; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (!openings.some((o) => x >= o.x && x < o.x + o.w)) block[y][x] = true;
  }
  const nearOpening = (x0, w, m = 2) => openings.some((o) => x0 < o.x + o.w + m && x0 + w > o.x - m);

  /* 2. walls and buildings rising from the ground — the big positive shapes */
  const nWalls = Math.max(3, Math.round(cols / 7));
  for (let i = 0, tries = 0; i < nWalls && tries < 400; tries++) {
    const w = 1 + ((r() * 4) | 0), h = 1 + ((r() * 5) | 0);
    const x = (r() * (cols - w)) | 0, y = groundTop - h;
    if (nearOpening(x, w) || !clearAround(x, y, w, h, 2) && tries < 300) continue;
    if (!clearAround(x, y, w, h, 0)) continue;
    for (let yy = y; yy < groundTop; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy);
    i++;
  }

  /* 3. one short staircase — something to climb */
  for (let tries = 0; tries < 200; tries++) {
    const x = 2 + ((r() * (cols - 8)) | 0), up = r() < 0.5;
    if (nearOpening(x, 4) || !clearAround(x, groundTop - 3, 4, 3, 1)) continue;
    for (let k = 0; k < 3; k++) for (let h = 0; h <= k; h++) set(up ? x + k : x + 2 - k, groundTop - 1 - h);
    break;
  }

  /* 4. floating platforms at different heights — the paths and corridors */
  const nPlat = Math.max(4, Math.round(cols / 5));
  const top = navRows + 1, bottom = groundTop - 3;
  for (let i = 0, tries = 0; i < nPlat && tries < 800; tries++) {
    const w = 3 + ((r() * 5) | 0);
    const x = (r() * (cols - w)) | 0, y = top + ((r() * Math.max(1, bottom - top)) | 0);
    if (!clearAround(x, y, w, 1, 2)) continue;
    for (let xx = x; xx < x + w; xx++) set(xx, y);
    // now and then a platform grows a short wall down or a lip up, so shapes interlock
    if (r() < 0.35 && empty(x, y + 1) && empty(x, y + 2)) { set(x, y + 1); if (r() < 0.5) set(x, y + 2); }
    if (r() < 0.25) set(x + w - 1, y - 1);
    i++;
  }

  /* 5. a few loose blocks floating in the open — these drift as the character passes */
  const loose = [];
  for (let tries = 0; tries < 600 && loose.length < Math.max(4, Math.round(cols / 7)); tries++) {
    const x = (r() * cols) | 0, y = top + ((r() * (bottom - top)) | 0);
    if (!clearAround(x, y, 1, 1, 1)) continue;
    loose.push({ x, y, fx: x, fy: y });
  }

  /* standing spots: open cell with a block underneath and headroom above */
  const stand = (x, y) => y > navRows + 2 && y < rows - 1 && block[y + 1][x] && empty(x, y) && empty(x, y - 1) && !inReserve(x, y) && !inReserve(x, y - 1);
  const spots = [];
  for (let y = 0; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) if (stand(x, y)) spots.push({ x, y });

  /* 6. a handful of accent cells on surfaces, and the detail spots */
  const surfaces = [];
  for (let y = navRows + 1; y < rows; y++) for (let x = 0; x < cols; x++) if (block[y][x] && empty(x, y - 1)) surfaces.push({ x, y });
  const pick = (list, n, minGap) => {
    const out = [];
    for (let tries = 0; tries < 500 && out.length < n; tries++) {
      const c = list[(r() * list.length) | 0];
      if (c && out.every((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) >= minGap)) out.push(c);
    }
    return out;
  };
  const accents = pick(surfaces.filter((c) => c.y < groundTop), 5, 6).map((c, i) => ({ ...c, c: palette[i % palette.length] }));
  const details = pick(surfaces.filter((c) => c.y < groundTop && !accents.some((a) => a.x === c.x && a.y === c.y)), nDetails, Math.round(cols / 5))
    .sort((a, b) => a.x - b.x);

  /* 7. the route: one spot per slice of the width, alternating high and low */
  const n = Math.max(6, Math.min(10, Math.round(cols / 5)));
  const route = [];
  for (let i = 0; i < n; i++) {
    const x0 = (i / n) * cols, x1 = ((i + 1) / n) * cols;
    const inSlice = spots.filter((p) => p.x >= x0 && p.x < x1);
    if (!inSlice.length) continue;
    inSlice.sort((a, b) => (i % 2 ? b.y - a.y : a.y - b.y));          // odd slices: low, even: high
    route.push(inSlice[Math.min(inSlice.length - 1, (r() * Math.min(3, inSlice.length)) | 0)]);
  }

  return { block, accents, loose, details, openings, route, groundTop, navRows };
}
