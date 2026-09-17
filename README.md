# kevinnie2003.github.io

Personal portfolio site for Mingxuan (Kevin) Nie. Built with vanilla HTML, CSS, and JavaScript — no build tools, no framework. Push to `main` and it deploys.

Live at **[kevinnie2003.github.io](https://kevinnie2003.github.io)**

---

## Structure

```
├── index.html               # Single-page site
├── assets/
│   ├── css/
│   │   ├── main.css         # Variables, reset, layout
│   │   ├── components.css   # All component styles
│   │   └── animations.css   # Scroll reveals, page-load sequence
│   ├── fonts/               # Self-hosted Syne / DM Sans / JetBrains Mono (woff2)
│   ├── js/
│   │   ├── main.js          # Content data + render functions
│   │   └── animations.js    # IntersectionObserver, cursor glow
│   └── img/
│       ├── avatar.png       # Cartoon avatar (active)
│       ├── avatar-photo.jpg # Real photo (swap src in index.html to use)
│       ├── og-cover.png     # Link preview image
│       └── logos/           # Company / school marks
└── tools/
    └── og-cover.html        # Template used to render og-cover.png (1200×630)
```

## Adding content

All content lives as data arrays at the top of `assets/js/main.js`. No HTML editing needed.

**New experience entry:**
```js
const EXPERIENCE = [
  {
    id: 'company-id',
    company: 'Company Name',
    role: 'Your Role',
    team: 'Team Name',
    period: 'Jun – Sep 2026',
    location: 'City, Country',
    bullets: ['Did X, achieving Y impact.'],
    tags: ['Python', 'React'],
  },
  // ...
];
```

**New project:**
```js
const PROJECTS = [
  {
    name: 'Project Name',
    period: 'Jan – Mar 2026',
    bullets: ['What it does and why it matters.'],
    github: 'https://github.com/kevinnie2003/repo',
    live: null,              // or a URL
    tags: ['Python', 'LLM'],
    publication: null,       // or 'Journal Name, CONF 2025'
    featured: false,         // true = full-width card at the top of the grid
  },
  // ...
];
```

## Deploying updates

```bash
git add .
git commit -m "describe what changed"
git push
```

GitHub Pages rebuilds automatically on every push to `main`.
