# Ankita — Personal Portfolio

A minimal, interaction-driven personal portfolio built around modularity, Lego/Tetris-inspired blocks, ASCII graphics, creative coding, and editorial typography.

## Quick Start

You don't need any build steps, bundlers, or heavy node_modules.

```bash
# Start local server (using Node.js native server)
npm run dev
# or: node server.mjs
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

---

## Content Customization

Everything is designed to be easily editable from a single file: **[`js/data.js`](js/data.js)**.

- **Personal Info & Links**: Change name, intro sentences, email, resume path, and social links in `site`.
- **Disciplines**: Edit the disciplines list rendered in the interactive field.
- **Selected Work**: Add, reorder, or update projects in `projects`.
  - Supports custom layouts: `'feature'`, `'left'`, `'right'`, `'offset'`, `'wide'`.
  - Set `cover: 'assets/your-screenshot.jpg'` to replace generated placeholders.
  - Set `placeholder: false` once real project information is ready.
  - Full structured case-study content (Problem, Research, Insights, Process, Outcomes, Reflections).
- **Experiments ("All Work & No Play?")**: Edit entries in `experiments`.
  - Interactive preview sketches: `'ascii'`, `'blocks'`, `'pixels'`, `'code'`, `'heat'`.
  - Add live demo URLs or screenshots.

---

## Architecture & Code Structure

```text
├── index.html          # Main portfolio entry point
├── case.html           # Reusable case-study template page
├── server.mjs          # Zero-dependency local dev server
├── package.json        # NPM scripts
├── css/
│   └── style.css       # Complete design system, editorial grids & responsive styles
└── js/
    ├── data.js         # Single source of truth for text, projects, and experiments
    ├── util.js         # Helpers: canvas fitting, PRNG, accessibility checks, reveal
    ├── nav.js          # Navigation bar theme switching (dark/light) & resume binding
    ├── hero.js         # Multilingual intro sequence & scroll stacking transition
    ├── field.js        # Cursor-responsive particle & letter field (sleeps when idle)
    ├── covers.js       # Generative SVG placeholder covers matching the visual language
    ├── experiments.js  # Micro-interactive canvas sketches for experiment tiles
    ├── motion.js       # Smooth scroll (Lenis, lazy-loaded), reveals & image parallax
    ├── main.js         # Home page controller & contact block-drop canvas
    └── case.js         # Dedicated case-study template loader
```

---

## Key Features

1. **Phase A: Dark Opening**:
   - Multilingual greeting cycling quickly (~2 seconds) through Hello, Bonjour, Namaste, Ciao, Hola, Olá, Hallo, and こんにちは.
   - Restrained background of drifting Tetris modules and ASCII glyphs.
   - Scroll-driven block stacking transition that builds into the warm paper background.
   - Respects `localStorage` to avoid repeating the full greeting on repeat visits and respects `prefers-reduced-motion`.

2. **Phase B: Light Editorial Portfolio**:
   - Oversized typography: *"I'm Ankita."*
   - Interactive letter & modular particle field inspired by the visual references: reacts to mouse movement, clusters together in vibrant colors, and drifts gently back to position.
   - Tap-friendly interaction on touch devices.

3. **Selected Work & Reusable Case Studies**:
   - Diverse editorial layout grid (featured banners, offset cards, asymmetric splits).
   - Click-through to dedicated case study pages with structured research, insights, process spreads, and adjacent project navigation.

4. **"All Work & No Play?" Experiments**:
   - Interactive creative coding tiles that activate on hover/focus/tap.

5. **Performance & Accessibility**:
   - Native ES modules, zero runtime dependencies.
   - 60+ FPS rendering with automatic sleep when idle.
   - Full keyboard navigation, `aria-*` attributes, contrast compliance, and zero horizontal overflow.
