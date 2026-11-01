/* ==========================================================================
   SITE CONTENT — edit everything here. No other file needs to change to
   update text, projects, experiments, links or images.
   ========================================================================== */

export const site = {
  name: 'Ankita',
  tagline: 'Design · Research · Creative code',

  // Leave empty until you have them. Nothing is invented.
  email: 'ankita.badade09@gmail.com',
  resumeUrl: 'https://drive.google.com/file/d/1iezRQGcpO-Y2mpTYHo1_ErESy1zaIUKT/view?usp=drive_link', // opens in a new tab from the nav and the contact section
  links: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ankita-badade-724002262/' },
    { label: 'Behance', url: 'https://www.behance.net/ankitabadade3' },
    // { label: 'GitHub',   url: 'https://github.com/…' },
  ],

  // Hindi, Spanish, French, German, Italian, Portuguese → typed "Hello!" to finish
  greetings: ['Namaste', 'Hola', 'Bonjour', 'Hallo', 'Ciao', 'Olá', 'Hello!'],

  intro: {
    heading: "I'm Ankita.",
    lines: [
      'I’m a Product & Experience Designer interested in the intersection of people, technology and everyday experiences.',
      'From untangling complex workflows to exploring how people interact with AI, I enjoy turning research and observations into thoughtful design solutions.',
    ],
  },

  disciplines: [
    'UX Design', 'UX Research', 'System Design', 'Service Design', 'Strategy',
    'Visual Design', 'Visual Communication', 'Design Research', 'Vibe Coding',
  ],

  about: {
    text: [
      'I like the part of a project where nothing is clear yet — sitting with people, listening, and mapping what is actually happening before deciding what to make.',
      'Then I like making it: on paper, in Figma, or in code.',
    ],
    interests: ['Behaviour & technology', 'Fieldwork & ethnography', 'Systems thinking', 'Creative coding', 'Type & image'],
  },
};

/* --------------------------------------------------------------------------
   SELECTED WORK
   Order in this array = order on the page.
   layout: 'feature' | 'left' | 'right' | 'offset' | 'wide'  (controls emphasis)
   cover:  path to an image in /assets — leave '' to show a generated placeholder
   coverStyle (placeholder only): 'pixel' | 'blocks' | 'ascii' | 'bars' | 'dots'
   placeholder: true shows a visible "Placeholder" tag — remove when real.
   -------------------------------------------------------------------------- */
const caseTemplate = (kind) => ({
  intro: `Placeholder introduction for this ${kind}. One or two sentences on what the project is and why it mattered.`,
  meta: {
    role: 'Add your role',
    timeline: 'Add timeline',
    collaborators: 'Add collaborators',
    constraints: 'Add constraints',
  },
  context: 'Describe the situation, who was affected and the problem you set out to understand. Keep it concrete.',
  research: {
    text: 'Summarise the methods you used — interviews, observation, desk research, workshops — and with whom.',
    insights: ['Add a key insight.', 'Add a second insight.', 'Add a third insight.'],
  },
  process: {
    text: 'Show how ideas developed: sketches, flows, prototypes, tests and what changed between iterations.',
    images: [
      { src: '', caption: 'Exploration — replace with a sketch or early concept' },
      { src: '', caption: 'Iteration — replace with a tested prototype' },
    ],
  },
  outcome: {
    text: 'Present the final design. Let the images do the work; annotate what matters.',
    images: [{ src: '', caption: 'Final design — replace with key screens or artefacts' }],
  },
  reflection: 'What did you learn? What would you do differently? Avoid metrics you cannot verify.',
});

export const projects = [
  // headline: the outcome in ≤ 6 words · description: ≤ 8 words · type: 'Internship' | 'Academic' | 'Personal' · tags: what kind of work
  // Case study pages show, in order of preference: your long-scroll images (`images`), else the Behance embed.
  // images: put them in assets/projects/<slug>/ named 01.jpg, 02.jpg … then set images: { count: 14 } (add ext: 'png' if needed),
  //         or list them yourself: images: ['assets/projects/<slug>/intro.jpg', …]
  // Later: fill in `case: { … }` (see caseTemplate above) and the written version takes over.
  {
    slug: 'production-monitoring',
    title: 'Redesigning Production Monitoring',
    headline: 'Making downtime visible on the shop floor',
    description: 'Production monitoring, redesigned for Maruti Suzuki.',
    type: 'Internship',
    org: 'Maruti Suzuki',
    tags: ['Enterprise UX', 'UX Research', 'Dashboard Design'],
    category: 'UX Research · Interaction Design',
    year: '',
    cover: 'https://mir-s3-cdn-cf.behance.net/projects/max_808/5b33ec256969467.Y3JvcCwzMjMyLDI1MjgsMCww.jpg',
    behance: { id: '256969467', url: 'https://www.behance.net/gallery/256969467/Redesigning-Production-Monitoring' },
    // the long scroll, in order (files in assets/projects/production-monitoring/); .mp4 entries play as silent loops
    // the process strip above the long scroll; `at` = [image number, how far down it (0–1)] to jump to
    process: [
      { phase: 'Understand', title: 'Context', text: 'How the weld shop runs, and why one stopped subline drags the rest down.', at: [4, 0] },
      { phase: 'Understand', title: 'Personas', text: 'A plant manager and a line supervisor reading the same line from different distances.', at: [5, 0] },
      { phase: 'Define', title: 'Current flow', text: 'Three tools to find a cause: Andon TV, Prodigi II and Excel, often after the shift.', at: [5, 0.26] },
      { phase: 'Define', title: 'Pain points & journey', text: 'Where time is lost, mapped against how the day feels now and with a redesign.', at: [5, 0.66] },
      { phase: 'Explore', title: 'Ideation', text: 'Four clickable concepts built in Figma Make to test with the plant team.', at: [7, 0] },
      { phase: 'Explore', title: 'Evaluation', text: 'Scored against five questions with my manager; kept the best of concept three.', at: [7, 0.77] },
      { phase: 'Deliver', title: 'Final solution', text: 'Two layers: an Andon TV view for the floor and Inspect for the why.', at: [8, 0] },
      { phase: 'Deliver', title: 'User flow', text: 'From a glance at the TV to a fix, with four decision points.', at: [9, 0] },
      { phase: 'Deliver', title: 'Key features', text: 'Shift toggle, priority zone, efficiency loss, ranked downtimes, heatmap, light and dark.', at: [10, 0] },
      { phase: 'Reflect', title: 'Learnings', text: 'Understand the system first, connect the dots, design for context, let feedback shape it.', at: [12, 0] },
    ],
    // heights of each part at 2000px wide, so the page knows its full length before images load
    imageHeights: [1125, 1125, 1125, 2251, 5803, 1125, 5127, 1562, 1683, 7958, 1125, 1174],
    images: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg', '08.jpg', '09.jpg', '10.jpg', 'walkthrough.mp4', '11.jpg'].map((f) => 'assets/projects/production-monitoring/' + f),
  },
  {
    slug: 'chatgpt-contextual-inquiry',
    title: 'Feature Addition in ChatGPT',
    headline: 'What ChatGPT users were missing',
    description: 'A feature concept, grounded in contextual inquiry.',
    type: 'Academic',
    org: 'IIT Delhi · Research Methods',
    tags: ['UX Research', 'Contextual Inquiry', 'Product Design'],
    category: 'UX Research · Contextual Inquiry',
    year: '',
    cover: 'https://mir-s3-cdn-cf.behance.net/projects/max_808/3f51fc245911195.Y3JvcCwzMjMyLDI1MjgsMCww.png',
    behance: { id: '245911195', url: 'https://www.behance.net/gallery/245911195/Feature-addition-in-ChatGPT-using-Contextual-Inquiry' },
    process: [
      { phase: 'Understand', title: 'Research questions', text: 'How people use ChatGPT for study, work and planning, and where it falls short.', at: [2, 0] },
      { phase: 'Understand', title: 'Methods & setup', text: 'Contextual inquiry in their natural setting, with a scribe, an explorer and a shadow.', at: [2, 0.36] },
      { phase: 'Understand', title: 'User group', text: 'Four students, their setups, how they use ChatGPT and what they need.', at: [3, 0] },
      { phase: 'Define', title: 'Journey map', text: 'Following four users through their tasks, from opening ChatGPT to switching accounts.', at: [5, 0] },
      { phase: 'Define', title: 'Insights', text: 'Every observed behaviour mapped into seven themes.', at: [5, 0.36] },
      { phase: 'Explore', title: 'Ideation', text: 'From each insight, a how-might-we and three ideas.', at: [6, 0] },
      { phase: 'Explore', title: 'Priority matrix', text: 'Ideas plotted on effort and impact to pick the most viable ones.', at: [6, 0.51] },
      { phase: 'Deliver', title: 'GPT Planner', text: 'A planner inside ChatGPT: schedules, notes and tasks set by just talking.', at: [8, 0] },
      { phase: 'Deliver', title: 'Desktop widget', text: 'The week and a quick ask box, always in sight on the desktop.', at: [11, 0] },
      { phase: 'Deliver', title: 'Prompt guide', text: 'Structured help in every new chat, to get the answer right the first time.', at: [12, 0] },
      { phase: 'Reflect', title: 'Why it’s different', text: 'A planner that looks ahead, spots conflicts and suggests the next step.', at: [13, 0] },
    ],
    imageHeights: [1125, 3395, 4519, 1125, 3400, 3371, 1125, 3583, 2395, 4623, 1319, 2442, 2901],
    images: ['01.gif', '02.jpg', '03.jpg', '04.gif', '05.jpg', '06.jpg', '07.gif', '08.jpg', '09.jpg', '10.jpg', '11.jpg', '12.jpg', '13.jpg'].map((f) => 'assets/projects/chatgpt-contextual-inquiry/' + f),
  },
  {
    slug: 'cultural-probes',
    title: 'Exploring Ideation Behaviour',
    headline: 'How people come up with ideas',
    description: 'A cultural-probes study of everyday ideation.',
    type: 'Academic',
    org: 'IIT Delhi',
    tags: ['Design Research', 'Cultural Probes', 'Behaviour'],
    category: 'Design Research · Cultural Probes',
    year: '',
    cover: 'https://mir-s3-cdn-cf.behance.net/projects/max_808/1ed9e5247933887.Y3JvcCwzMjMyLDI1MjgsMCww.png',
    behance: { id: '247933887', url: 'https://www.behance.net/gallery/247933887/Exploring-Ideation-Behaviour-through-Cultural-Probes' },
    process: [
      { phase: 'Frame', title: 'The idea', text: 'We always see the final idea. This kit captures everything before it.', at: [1, 0.33] },
      { phase: 'Frame', title: 'UN SDGs', text: 'Quality Education, and Industry, Innovation & Infrastructure.', at: [1, 0.7] },
      { phase: 'Research', title: 'Secondary research', text: 'Fixation, creative anxiety, tacit ideation, self-censorship and drawing as thinking.', at: [2, 0] },
      { phase: 'Research', title: 'Research goal', text: 'How design students generate, develop and refine ideas in studio projects.', at: [2, 0.33] },
      { phase: 'Research', title: 'Research questions', text: 'What triggers ideas, what blocks them, and which tools and spaces are used.', at: [2, 0.54] },
      { phase: 'Research', title: 'Why a probe', text: 'Thinking doesn’t happen in one sitting, so we needed something that stays with the user.', at: [2, 0.79] },
      { phase: 'Design', title: 'The probe kit', text: 'One task and a short reflection, kept by the user for a week.', at: [3, 0] },
      { phase: 'Design', title: 'What’s inside', text: 'Task cards, an accordion booklet, reflection cards, stickers and stationery.', at: [3, 0.5] },
      { phase: 'Use', title: 'How to use it', text: 'Pick a task card, work through the booklet, then open the reflection folder.', at: [4, 0] },
      { phase: 'Use', title: 'What it captures', text: 'Where ideas start, where they stall, and what helps them move forward.', at: [4, 0.78] },
    ],
    imageHeights: [3379, 4507, 2248, 5621],
    images: ['01.jpg', '02.jpg', '03.jpg', '04.jpg'].map((f) => 'assets/projects/cultural-probes/' + f),
  },
  {
    slug: 'fading-ink',
    title: 'Fading Ink',
    headline: 'Documenting a fading craft',
    description: 'A visual ethnography of Urdu calligraphers.',
    type: 'Academic',
    org: 'IIT Delhi',
    tags: ['Ethnography', 'Visual Storytelling', 'Design Research'],
    category: 'Ethnography · Visual Communication',
    year: '',
    cover: 'https://mir-s3-cdn-cf.behance.net/projects/max_808/a9aa57245876005.Y3JvcCwxNjE2LDEyNjQsMCww.jpg',
    behance: { id: '245876005', url: 'https://www.behance.net/gallery/245876005/Fading-Ink-A-Visual-Ethnography-of-Urdu-Calligraphy' },
    process: [
      { phase: 'Context', title: 'The spark', text: 'Headlines about Delhi’s last calligraphers made us look deeper.', at: [1, 0.15] },
      { phase: 'Context', title: 'Who are Kaatibs?', text: 'Our only lead was Chandni Chowk, so we followed it through Old Delhi.', at: [1, 0.25] },
      { phase: 'Context', title: 'Urdu Bazaar', text: 'Once a haven for Kaatibs, in the shadow of Jama Masjid.', at: [1, 0.5] },
      { phase: 'Context', title: 'Kitabat', text: 'The art of calligraphy, once known as the royal profession.', at: [1, 0.74] },
      { phase: 'Fieldwork', title: 'Guardians of the craft', text: 'Interviews with Syed Salahuddin and the legacy of Syed Manzooruddin.', at: [2, 0] },
      { phase: 'Fieldwork', title: 'Mohammad Ghalib', text: 'Four decades of kitabat, from Deoband to the lanes of Urdu Bazaar.', at: [2, 0.44] },
      { phase: 'The craft', title: 'Pen, ink & script', text: 'Kalam, dawat and Nastaliq: the tools and discipline behind every line.', at: [3, 0] },
      { phase: 'The craft', title: 'Kaatib’s kitabat', text: 'Ghalib’s own work, from Tughra compositions to wedding cards.', at: [4, 0] },
      { phase: 'Change', title: 'Beyond paper', text: 'Shakeel Artist carries the craft onto signboards, cinema and street walls.', at: [5, 0] },
      { phase: 'Change', title: 'Screens took over', text: 'How commissions disappeared and the bazaar’s labour shifted to food.', at: [5, 0.76] },
      { phase: 'Change', title: 'Methods & thanks', text: 'Secondary research, field observation, conversations and visual documentation.', at: [6, 0] },
    ],
    imageHeights: [7860, 11114, 4533, 5427, 5284, 2026],
    images: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'].map((f) => 'assets/projects/fading-ink/' + f),
  },
];

/* --------------------------------------------------------------------------
   EXPERIMENTS — "All Work & No Play?"
   preview: live mini-sketch ('ascii' | 'blocks' | 'pixels' | 'code' | 'heat' | 'type')
   image:   optional path to a real screenshot/GIF (replaces the sketch)
   url:     link to the experiment, or '' if not published yet
   size:    'wide' for a double-width tile, 'feature' for the large centre piece
   -------------------------------------------------------------------------- */
export const experiments = [
  { title: 'Frog Pond', description: 'A night-time pond where you feed pixel frogs by typing. Vibe-coded and live — click to play.', status: 'Live', preview: 'frog', size: 'wide', url: 'https://frog-pond.vercel.app', image: '' },
  { title: 'Jama Masjid Typewalk', description: 'A wander through Old Delhi’s hand-painted signboards — hover to light them up, then paint your own name.', status: 'Live', preview: 'ascii', size: 'feature', url: 'https://for-the-love-of-type.vercel.app', image: 'assets/typewalk.jpg' },
  { title: 'ASCII Weather', description: 'Placeholder — a density field rendered in characters.', status: 'Experiment', preview: 'ascii', url: '', image: '' },
  { title: 'Falling Blocks', description: 'Placeholder — modular pieces that assemble on their own.', status: 'In progress', preview: 'blocks', url: '', image: '' },
  { title: 'Pixel Drift', description: 'Placeholder — colour fields that shift like a city map.', status: 'Experiment', preview: 'pixels', url: '', image: '' },
  { title: 'Code Ribbon', description: 'Placeholder — source code as graphic material.', status: 'Concept', preview: 'code', url: '', image: '' },
  { title: 'Heat Glyphs', description: 'Placeholder — characters that warm up around a moving point.', status: 'Experiment', preview: 'heat', url: '', image: '' },
];

/* --------------------------------------------------------------------------
   ABOUT PAGE (about.html) — "The Shape of Ankita". Everything here is editable.
   phrases:  short lines the character pauses beside as it explores the scene.
   details:  small hover / tap labels hidden in a few blocks (also listed below).
   -------------------------------------------------------------------------- */
export const aboutPage = {
  // opening: who I am, in one line, plus the five clusters of the point-grid map
  statement: ['Hello there!', 'I’m Ankita'],   // one entry per line; a small pink block is added as the full stop
  role: 'a Product & Experience Designer with a curious mind and probably too many questions.',
  // phrases from the line above that land on a colour block (pink | orange | green | purple)
  roleMarks: [{ text: 'Product & Experience Designer', color: 'pink' }, { text: 'too many questions', color: 'green' }],
  clusters: [
    { label: 'Observe', phrase: 'I notice the little things.', note: 'Fieldwork, shadowing, sitting with people.' },
    { label: 'Ask why', phrase: 'I like asking why.', note: 'Contextual inquiry and interviews.' },
    { label: 'Map the system', phrase: 'I like connecting things that don’t seem connected.', note: 'Journeys, service blueprints, systems maps.' },
    { label: 'Make it tangible', phrase: 'I enjoy making ideas tangible.', note: 'Sketches, prototypes, interfaces.' },
    { label: 'Test & refine', phrase: 'Sometimes I build things just to see what happens.', note: 'Prototyping in code, testing, iterating.' },
  ],
  phrases: [
    'I like asking why.',
    'I notice the little things.',
    'I enjoy making ideas tangible.',
    'Sometimes I build things just to see what happens.',
    'I like connecting things that don’t seem connected.',
  ],
  details: [
    { label: 'Research', note: 'Sitting with people and listening first.' },
    { label: 'Visual storytelling', note: 'Making the findings easy to see.' },
    { label: 'Interaction design', note: 'Turning observations into something usable.' },
    { label: 'Creative coding', note: 'Building things to think with.' },
  ],
  // a short journey, shown as a stacked timeline under the intro
  journeyTitle: 'Where I’ve been so far',
  journey: [
    { label: 'Currently', items: [
      { org: 'IIT Delhi', text: 'Doing my Master’s in Design, spending my time across product design, research and experience design.' },
    ] },
    { label: 'Previously', items: [
      { org: 'Maruti Suzuki', text: 'Worked on UX for production and operational dashboards, making complex information easier to understand and act on.' },
      { org: 'Amar Chitra Katha', text: 'Explored illustration and visual storytelling.' },
      { org: 'DViO Digital', text: 'Worked on digital campaigns.' },
    ] },
  ],
  title: 'A little more about me.',
  body: [
    'I like observing people, collecting little details, asking too many questions and turning all of that into something meaningful.',
    'Sometimes that’s an interface, sometimes an experience, sometimes an illustration.',
  ],
  // the editorial spread: italic line, the bracketed side note, and your photo
  italic: 'sometimes an interface, sometimes an experience, sometimes an illustration',
  aside: 'Outside structured projects, I enjoy experimenting, making things with code and following ideas simply to see where they lead.',
  photo: 'assets/ankita.jpg',                                   // e.g. 'assets/ankita.jpg' — leave '' for the placeholder
  photoLabel: 'Me, as usual',
  photoCaption: 'talking about something or the other.',
  exploring: ['Placeholder — a topic', 'Placeholder — a tool', 'Placeholder — a question'],
  facts: [
    'Placeholder — yellow is my favourite colour.',
    'Placeholder — I never take my watch off.',
    'Placeholder — a small, true thing about you.',
  ],
};
