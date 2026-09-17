/* ============================================================
   MAIN.JS
   Content data, render functions, scroll-spy, theme, mobile nav

   TO ADD NEW CONTENT:
   - Experience: add an object to EXPERIENCE array
   - Projects:   add an object to PROJECTS array
   - Skills:     add items to a category in SKILLS, or add a new key
   - Education:  add an object to EDUCATION array
   No HTML editing required.
   ============================================================ */

/* ── EXPERIENCE DATA ─────────────────────────────────────────── */
const EXPERIENCE = [
  {
    id: 'mihoyo',
    company: 'miHoYo',
    role: 'Software Engineer',
    team: 'Petit Planet · Tools Group',
    period: 'Jun – Sep 2026',
    location: 'Shanghai, China',
    bullets: [
      'Built the front and back end of an internal <strong>automated testing platform</strong> (React + TypeScript / Flask + Socket.IO + MySQL) serving <strong>dozens of QA engineers</strong> across test case management, task orchestration, AI test report analysis, and automated failure repair.',
      'Led a <strong>conversational AI test-case generation system</strong>, fusing Unity Prefab/Lua, on-device UI, GM commands, protocol and config data into a hierarchical knowledge base of <strong>100K+ Prefab nodes</strong>.',
      'Generated executable <strong>Airtest + Poco</strong> scripts through semantic grounding and action blueprints, with structured clarification, a GM channel, deterministic runtime node correction, static validation, and false-pass auditing.',
      'Closed the loop from generation → on-device execution → failure repair → knowledge feedback, raising the effective on-device pass rate of the same regression suite from <strong>30% to 80%</strong>.',
      'Developed <strong>GM commands</strong> that replace failure-prone UI clicks with one-click entry into <strong>30+ game scenarios</strong> (reusing OpenLuaUI across <strong>59 UI categories</strong>), and authored large-scale automated cases with assertions and launch-latency collection for regression coverage.',
    ],
    tags: ['React', 'TypeScript', 'Flask', 'Socket.IO', 'MySQL', 'Unity', 'Lua', 'Airtest', 'Poco', 'LLM Agents'],
  },
  {
    id: 'vicino',
    company: 'Vicino AI',
    role: 'Machine Learning Engineer',
    team: 'Machine Learning Team',
    period: 'Nov 2025 – Apr 2026',
    location: 'US, Remote',
    bullets: [
      'Independently built a <strong>multi-agent four-view image generation system</strong> (front / back / left / right), orchestrating <strong>8+ specialized agents</strong> through <strong>ReAct</strong> loops and MCP/tool calling across requirement understanding, prompt optimization, image generation, image evaluation, and online retrieval.',
      'Designed a <strong>self-correcting generation loop</strong> with dynamic quality thresholds, cross-view consistency evaluation, up to 4 retry rounds, and version rollback — <strong>90%+</strong> of requests converged to a qualified output within <strong>2 iterations</strong>.',
      'Developed <strong>Storyboard</strong> generation, prompt-to-workflow, and a video editing agent end to end, supporting executable node graphs, conversational workflow updates, and <strong>10+</strong> structured video editing operations.',
    ],
    tags: ['Multi-Agent', 'ReAct', 'MCP', 'Tool Calling', 'LLM', 'Prompt Engineering'],
  },
  {
    id: 'tiktok',
    company: 'TikTok',
    role: 'Software Engineer',
    team: 'TikTok User Experience (TUX)',
    period: 'Jun – Sep 2025',
    location: 'Shanghai, China',
    bullets: [
      'Independently designed and built an <strong>AI on-call assistant</strong> (Python / React / SQLite) with an integrated <strong>LLM agent</strong> for issue intent recognition, automatic classification, and workflow routing — improving classification accuracy by <strong>80%</strong> over the manual process, adopted by <strong>1,000+ engineers</strong>.',
      'Designed a high-concurrency real-time messaging architecture on <strong>WebSocket</strong> long connections with multithreaded asynchronous LLM classification, backed by fault-tolerant queues, response caching, and a persistence layer for reliable delivery.',
      'Cut manual on-call requests by <strong>20%</strong> through a documentation-based interception mechanism.',
      'Built a <strong>React dashboard</strong> visualizing live on-call data — request volume, ticket status, platform distribution — with data persistence and trend analysis.',
      'Independently designed and shipped a reusable <strong>iOS Item Picker</strong> component supporting adaptive sheet/panel layouts, dynamic height caching, and single- and multi-select APIs.',
    ],
    tags: ['Python', 'React', 'Swift', 'LLM Agents', 'WebSocket', 'SQLite', 'iOS'],
  },
  {
    id: 'alibaba',
    company: 'Alibaba',
    role: 'Software Engineer',
    team: 'AIDC · Lazada',
    period: 'Jun – Sep 2024',
    location: 'Guangzhou, China',
    bullets: [
      'Led design and development of an <strong>Android network diagnostics</strong> feature for the complex, volatile weak-network environments of Southeast Asia.',
      'Independently designed a <strong>weak-network detection strategy</strong> where no mature application-layer diagnostic solution existed, targeting a <strong>~30%</strong> reduction in network-related issue reports.',
      'Implemented detection and diagnostic <strong>SDKs</strong> and supporting UIs in Kotlin/Java for three scenarios — blocked app network access, signal strength, and network proxies — each pairing detection with an actionable fix so users in weak-network regions could self-diagnose.',
    ],
    tags: ['Kotlin', 'Java', 'Android', 'SDK Development'],
  },
];

/* ── PROJECTS DATA ───────────────────────────────────────────── */
const PROJECTS = [
  {
    name: 'RogueForge — AI-Native Deck-Builder',
    period: 'May – Jun 2026',
    featured: true,
    bullets: [
      'Independently built an <strong>AI-native roguelike deck-building game</strong> where an LLM generates <strong>5 content types</strong> live during a run — cards, enemies, events, room rules, and characters — each routed through the same <strong>generate → validate → repair → retry</strong> pipeline to keep output playable and numerically balanced.',
      'Kept the LLM to combining predefined effects and copy, never touching deterministic combat logic, and enforced three validation layers — structure, mechanic allowlist, and numerical budget — auto-clamping out-of-range values and bouncing invalid structures back with a specific reason.',
      'Calibrated numerical budgets against real <em>Slay the Spire</em> card data as few-shot references, landing <strong>80%+</strong> of original cards in their correct tiers; a companion evaluation dashboard tracked accept / repair / reject ratios, with ~<strong>95%</strong> of <strong>2,658</strong> candidates directly usable.',
    ],
    github: 'https://github.com/kevinnie2003/rogueforge',
    live: null,
    tags: ['LLM', 'Procedural Generation', 'Validation Pipelines', 'Game Design', 'Evaluation'],
  },
  {
    name: 'Adaptive Moderation Agent',
    period: 'Jan – Mar 2026',
    bullets: [
      'Built a 2-stage LLM moderation pipeline with <strong>8+ structured risk signals</strong> including toxicity and uncertainty scoring.',
      'Implemented a <strong>ReAct-based action chooser</strong> for calibrated responses: do nothing, downrank, add friction, or throttle.',
      'Evaluated on the Jigsaw toxic comment dataset, demonstrating more calibrated action selection across severity levels.',
    ],
    github: 'https://github.com/Zihang-He/CSE291A_Group5_Adaptive_Moderation_Agent',
    live: null,
    tags: ['Python', 'LLM', 'ReAct', 'NLP', 'Content Moderation'],
  },
  {
    name: 'Enhanced U-Net for Ship Segmentation',
    period: 'Jun – Dec 2024',
    bullets: [
      'Developed an advanced <strong>U-Net</strong> with depthwise separable and atrous convolutions, achieving <strong>Dice 0.6325</strong> and <strong>precision 0.6678</strong> on the Airbus Ship Detection dataset (50k+ images).',
      'Designed custom loss functions (BCE, Dice, Focal) and enhanced skip connections in TensorFlow to improve small-ship segmentation.',
      'Published results as <strong>first author</strong> in <em>Applied and Computational Engineering</em> (CONF-SPML 2025).',
    ],
    github: 'https://github.com/kevinnie2003/ship-detection',
    live: null,
    tags: ['Python', 'TensorFlow', 'U-Net', 'Deep Learning', 'Computer Vision'],
    publication: 'Applied and Computational Engineering, CONF-SPML 2025',
  },
  {
    name: 'Successorator',
    period: 'Jan – Mar 2024',
    bullets: [
      'Spearheaded development of an <strong>Android productivity app</strong> for goal-setting and task prioritization using Java and Android Studio.',
      'Implemented adaptive UI with dynamic goal creation dialogs for varied task types, recurring goals, and context tagging.',
      'Designed modules using <strong>Strategy, Observer, Abstract Factory, and Builder patterns</strong>; led rigorous unit testing in an Agile team.',
    ],
    github: 'https://github.com/CSE-110-Winter-2024/TODO-List',
    live: null,
    tags: ['Java', 'Android', 'Android Studio', 'Agile', 'Design Patterns'],
  },
  {
    name: 'Deep Learning Applications in MTG',
    period: 'Jan – Mar 2024',
    bullets: [
      'Led development of <strong>CNN and Vision Transformer (ViT)</strong> models for Magic: The Gathering card creature type classification across <strong>15 classes</strong>, achieving up to <strong>60% accuracy</strong> with ViT and Supervised Contrastive Learning (SupCon).',
      'Utilized <strong>DCGAN</strong> to generate novel MTG card images, enhancing dataset diversity for model training.',
      'Addressed class imbalance and variation through effective data preprocessing and augmentation.',
    ],
    github: null,
    live: null,
    tags: ['Python', 'CNN', 'ViT', 'DCGAN', 'Deep Learning', 'Machine Learning'],
  },
  {
    name: 'Line Following Robot',
    period: 'Nov – Dec 2022',
    bullets: [
      'Designed and built a line-following robot from scratch with a team of 4, applying knowledge of sensors, actuators, programming, and controls.',
      '<strong>3D-printed</strong> the chassis, created and soldered circuits, and iteratively tested the robot’s functionality.',
      'Competed against fellow students using our uniquely designed robot.',
    ],
    github: null,
    live: null,
    tags: ['Arduino', 'Arduino IDE', '3D Printing', 'CAD', 'Embedded Systems'],
  },
];

/* ── SKILLS DATA ─────────────────────────────────────────────── */
const SKILLS = {
  'Languages':      ['Java', 'Python', 'C', 'C++', 'Kotlin', 'Swift', 'Objective-C', 'TypeScript', 'JavaScript', 'SQL', 'HTML', 'CSS', 'Assembly', 'SystemVerilog'],
  'AI / Agents':    ['Multi-Agent', 'MCP', 'Agent Skills', 'Tool Calling', 'ReAct', 'Prompt Engineering', 'RAG', 'LangGraph', 'LangChain'],
  'Development':    ['React', 'Spring Boot', 'Flask', 'Socket.IO', 'MySQL', 'SQLite', 'Android Studio', 'Xcode', 'Blender', 'Linux'],
  'Testing / Tools': ['Git', 'P4', 'JUnit', 'AirTest', 'Poco'],
};

/* ── EDUCATION DATA ──────────────────────────────────────────── */
const EDUCATION = [
  {
    abbr: 'MS',
    degree: 'Master of Science in Computer Science',
    school: 'University of California, San Diego',
    period: 'Sep 2025 – Mar 2027 (Expected)',
  },
  {
    abbr: 'BS',
    degree: 'Bachelor of Science in Computer Engineering',
    school: 'University of California, San Diego',
    period: 'Sep 2021 – Jun 2025',
  },
];

/* Brand mark, masked and filled with currentColor by .logo-mark. */
function logoMark(id) {
  return `<span class="logo-mark logo-${id}" aria-hidden="true"></span>`;
}

/* ── RENDER: EXPERIENCE ──────────────────────────────────────── */
function renderExperience() {
  const tabsEl   = document.getElementById('exp-tabs');
  const panelsEl = document.getElementById('exp-panels');
  if (!tabsEl || !panelsEl) return;

  // Render tab buttons
  tabsEl.innerHTML = EXPERIENCE.map((exp, i) =>
    `<button
      class="exp-tab${i === 0 ? ' active' : ''}"
      role="tab"
      aria-selected="${i === 0 ? 'true' : 'false'}"
      aria-controls="exp-panel-${exp.id}"
      id="exp-tab-${exp.id}"
      data-index="${i}"
    >${logoMark(exp.id)}<span>${exp.company}</span></button>`
  ).join('');

  // Render panels
  panelsEl.innerHTML = EXPERIENCE.map((exp, i) =>
    `<div
      class="exp-panel${i === 0 ? ' active' : ''}"
      role="tabpanel"
      id="exp-panel-${exp.id}"
      aria-labelledby="exp-tab-${exp.id}"
    >
      <div class="exp-body">
        <p class="exp-role-line">
          ${exp.role}&nbsp;<span class="exp-company">@ ${exp.company}</span>
        </p>
        <ul class="exp-bullets" aria-label="Responsibilities">
          ${exp.bullets.map(b =>
            `<li class="exp-bullet">
              <span class="exp-bullet-arrow" aria-hidden="true">▸</span>
              <span>${b}</span>
            </li>`
          ).join('')}
        </ul>
      </div>
      <div class="exp-side">
        <dl class="exp-facts">
          <div class="exp-fact"><dt>Period</dt><dd>${exp.period}</dd></div>
          <div class="exp-fact"><dt>Team</dt><dd>${exp.team}</dd></div>
          <div class="exp-fact"><dt>Location</dt><dd>${exp.location}</dd></div>
        </dl>
        <div class="exp-tags" aria-label="Technologies used">
          ${exp.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>`
  ).join('');

  // Tab interaction
  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.exp-tab');
    if (!tab) return;
    activateExperience(Number(tab.dataset.index));
  });
}

/* Switch the visible company. Driven by the tabs and by the hero ledger. */
function activateExperience(idx) {
  const tabsEl   = document.getElementById('exp-tabs');
  const panelsEl = document.getElementById('exp-panels');
  if (!tabsEl || !panelsEl) return;

  tabsEl.querySelectorAll('.exp-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-selected', String(i === idx));
  });

  panelsEl.querySelectorAll('.exp-panel').forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });
}

/* ── RENDER: HERO CAREER LEDGER ──────────────────────────────── */
/* Compact index of roles beside the hero bio on wide screens.
   Built from EXPERIENCE so it cannot drift out of sync. */
function renderLedger() {
  const el = document.getElementById('heroLedger');
  if (!el) return;

  const years = (period) => {
    const found = period.match(/\d{4}/g);
    if (!found) return '';
    const first = found[0];
    const last  = found[found.length - 1];
    return first === last ? first : `${first}–${last.slice(2)}`;
  };

  el.innerHTML = EXPERIENCE.map((exp, i) =>
    `<a class="ledger-row" href="#experience" data-index="${i}">
      ${logoMark(exp.id)}
      <span class="ledger-company">${exp.company}</span>
      <span class="ledger-year">${years(exp.period)}</span>
      <span class="ledger-role">${exp.role}</span>
    </a>`
  ).join('');

  el.addEventListener('click', (e) => {
    const row = e.target.closest('.ledger-row');
    if (row) activateExperience(Number(row.dataset.index));
  });
}

/* Company names in the hero bio jump to Experience and open that company. */
function initBioLinks() {
  document.querySelectorAll('.inline-link[data-exp-index]').forEach(link => {
    link.addEventListener('click', () => activateExperience(Number(link.dataset.expIndex)));
  });
}

/* ── RENDER: PROJECTS ────────────────────────────────────────── */
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = PROJECTS.map((p, i) =>
    `<article class="project-card${p.featured ? ' project-card-featured' : ''} reveal reveal-d${(i % 3) + 1}">
      <div class="project-card-top">
        <svg class="project-folder" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <div class="project-card-links">
          ${p.live ? `<a href="${p.live}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="${p.name} — live demo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : ''}
          ${p.github ? `<a href="${p.github}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="${p.name} — GitHub repository">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          </a>` : ''}
        </div>
      </div>
      <h3 class="project-name">${p.name}</h3>
      <p class="project-period">${p.period}</p>
      ${p.publication ? `<p class="project-publication">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        ${p.publication}
      </p>` : ''}
      <ul class="project-bullets" aria-label="Details">
        ${p.bullets.map(b => `<li class="project-bullet"><span class="project-bullet-arrow" aria-hidden="true">▸</span><span>${b}</span></li>`).join('')}
      </ul>
      <ul class="tag-list" aria-label="Technologies">
        ${p.tags.map(t => `<li class="tag">${t}</li>`).join('')}
      </ul>
    </article>`
  ).join('');
}

/* ── RENDER: SKILLS ──────────────────────────────────────────── */
function renderSkills() {
  const el = document.getElementById('skills-groups');
  if (!el) return;

  el.innerHTML = Object.entries(SKILLS).map(([cat, items]) =>
    `<div class="skill-group reveal">
      <span class="skill-category">${cat}</span>
      <ul class="skill-pills" aria-label="${cat} skills">
        ${items.map(s => `<li class="skill-pill">${s}</li>`).join('')}
      </ul>
    </div>`
  ).join('');
}

/* ── RENDER: EDUCATION ───────────────────────────────────────── */
function renderEducation() {
  const el = document.getElementById('edu-list');
  if (!el) return;

  el.innerHTML = EDUCATION.map((edu) =>
    `<div class="edu-item reveal">
      <div class="edu-badge" aria-hidden="true">${edu.abbr}</div>
      <div class="edu-body">
        <p class="edu-degree">${edu.degree}</p>
        <p class="edu-school"><span class="logo-mark logo-ucsd" aria-hidden="true"></span>${edu.school}</p>
        <p class="edu-period">${edu.period}</p>
      </div>
    </div>`
  ).join('');
}

/* ── SCROLL SPY ──────────────────────────────────────────────── */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  if (!sections.length || !navLinks.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0,
  });

  sections.forEach(s => obs.observe(s));
}

/* ── THEME TOGGLE ────────────────────────────────────────────── */
function initTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');

  // Restore saved preference
  const saved = localStorage.getItem('kn-theme') || 'dark';
  applyTheme(saved);

  btn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('kn-theme', next);
  });

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (!btn) return;
    const label = btn.querySelector('.theme-label');
    const isDark = theme === 'dark';
    if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

/* ── MOBILE NAV ──────────────────────────────────────────────── */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const backdrop  = document.getElementById('sidebarBackdrop');
  if (!hamburger || !sidebar) return;

  function openNav() {
    sidebar.classList.add('open');
    backdrop?.classList.add('visible');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    sidebar.classList.remove('open');
    backdrop?.classList.remove('visible');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeNav() : openNav();
  });

  // Close when a nav link is clicked (smooth scroll happens naturally)
  sidebar.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on backdrop click
  backdrop?.addEventListener('click', closeNav);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeNav();
  });
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Render dynamic content
  renderExperience();
  renderLedger();
  initBioLinks();
  renderProjects();
  renderSkills();
  renderEducation();

  // Initialize interactions
  initScrollSpy();
  initTheme();
  initMobileNav();
});
