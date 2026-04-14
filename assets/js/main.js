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
    id: 'vicino',
    company: 'Vicino AI',
    role: 'Machine Learning Engineer Intern',
    team: 'MLE',
    period: 'Nov 2025 – Present',
    location: 'Remote',
    bullets: [
      'Built a React + FastAPI multi-agent system for consistent 4-view image generation (front, left, right, rear), orchestrating <strong>8+ specialized agents</strong> for query understanding, prompt optimization, rendering, evaluation, search, pose editing, attribute editing, and detail refinement.',
      'Used <strong>ReAct-style reasoning loops</strong> and MCP/tool-calling workflows inside the multi-agent pipeline for online search, context retrieval, reasoning over intermediate results, and dynamic generation plan adaptation.',
      'Designed a self-correcting generation loop with up to 4 retry iterations, dynamic quality thresholds, cross-view consistency evaluation, memory/version tracking, and fallback heuristics.',
      'Developed the Storyboard platform end-to-end: board generation, prompt-to-workflow planning, video editor agent, 6 workflow templates, connected runnable node graphs, conversational workflow updates, and 10+ structured video editing operations.',
    ],
    tags: ['React', 'FastAPI', 'Python', 'Multi-Agent', 'LLM', 'MCP', 'ReAct'],
  },
  {
    id: 'tiktok',
    company: 'TikTok',
    role: 'Software Engineer Intern',
    team: 'TikTok User Experience (TUX)',
    period: 'Jun – Sep 2025',
    location: 'Shanghai, China',
    bullets: [
      'Built an AI-powered on-call assistant (Python, React, SQLite) with LLM Agent integration, improving incident classification accuracy by <strong>80%</strong> — adopted by <strong>1,000+ engineers</strong>.',
      'Designed real-time message handling architecture with WebSocket long connections and multi-threaded async LLM classification, reducing unnecessary manual on-call requests by <strong>20%</strong>.',
      'Built fault-tolerant async queues, LLM response caching, and a persistence layer engineered for high-concurrency incident management.',
      'Created a React analytics dashboard for live on-call statistics: request volume, ticket status, and platform distribution.',
      'Designed reusable iOS UI components in Swift — including an Item Picker with adaptive sheet/panel layouts, dynamic height caching, and single/multi-select API — increasing test coverage by <strong>5%</strong>.',
      'Participated in daily on-call rotations, resolving an average of <strong>2 tickets/day</strong> with a <strong>100%</strong> on-time resolution rate.',
    ],
    tags: ['Python', 'React', 'Swift', 'LLM Agents', 'WebSocket', 'SQLite', 'iOS'],
  },
  {
    id: 'alibaba',
    company: 'Alibaba International',
    role: 'Software Engineer Intern',
    team: 'Lazada',
    period: 'Jun – Sep 2024',
    location: 'Guangzhou, China',
    bullets: [
      'Developed the Android Network Diagnostic feature for Lazada, a leading Southeast Asian eCommerce platform with <strong>160M+ users</strong> across regions with highly variable network conditions.',
      'Built a Kotlin/Java SDK for real-time network diagnostics — detecting weak signal, connectivity loss, and proxy configuration issues.',
      'Independently researched and designed a novel weak-network detection strategy with no prior external solutions, reducing user-reported network issues by <strong>30%</strong>.',
      'Resolved <strong>100%</strong> of assigned bugs and support tickets before deadlines, maintaining a high level of app stability for a timely release.',
    ],
    tags: ['Kotlin', 'Android', 'Java', 'SDK Development', 'Spring Boot'],
  },
];

/* ── PROJECTS DATA ───────────────────────────────────────────── */
const PROJECTS = [
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
      '<strong>3D-printed</strong> the chassis, created and soldered circuits, and iteratively tested the robot\'s functionality.',
      'Competed against fellow students using our uniquely designed robot.',
    ],
    github: null,
    live: null,
    tags: ['Arduino', 'Arduino IDE', '3D Printing', 'CAD', 'Embedded Systems'],
  },
];

/* ── SKILLS DATA ─────────────────────────────────────────────── */
const SKILLS = {
  'Languages':  ['Python', 'Java', 'Kotlin', 'Swift', 'C', 'C++', 'TypeScript', 'SQL', 'Obj-C'],
  'Frontend':   ['React', 'HTML / CSS', 'UIKit', 'SwiftUI'],
  'Backend':    ['Spring Boot', 'FastAPI', 'PostgreSQL', 'MySQL', 'REST APIs'],
  'Mobile':     ['Android (Kotlin)', 'iOS (Swift)'],
  'AI / ML':    ['LLM Orchestration', 'Multi-Agent', 'ReAct', 'RAG', 'MCP', 'TensorFlow', 'U-Net', 'CNN', 'ViT', 'DCGAN'],
  'Tools':      ['Git', 'Android Studio', 'Xcode', 'Linux', 'JUnit', 'SQLite', 'Arduino', 'CAD'],
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
    >${exp.company}</button>`
  ).join('');

  // Render panels
  panelsEl.innerHTML = EXPERIENCE.map((exp, i) =>
    `<div
      class="exp-panel${i === 0 ? ' active' : ''}"
      role="tabpanel"
      id="exp-panel-${exp.id}"
      aria-labelledby="exp-tab-${exp.id}"
    >
      <p class="exp-role-line">
        ${exp.role}&nbsp;<span class="exp-company">@ ${exp.company}</span>
      </p>
      <div class="exp-meta">
        <span>${exp.period}</span>
        <span class="exp-meta-dot" aria-hidden="true">·</span>
        <span>${exp.team}</span>
        <span class="exp-meta-dot" aria-hidden="true">·</span>
        <span>${exp.location}</span>
      </div>
      <ul class="exp-bullets" aria-label="Responsibilities">
        ${exp.bullets.map(b =>
          `<li class="exp-bullet">
            <span class="exp-bullet-arrow" aria-hidden="true">▸</span>
            <span>${b}</span>
          </li>`
        ).join('')}
      </ul>
      <div class="exp-tags" aria-label="Technologies used">
        ${exp.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
    </div>`
  ).join('');

  // Tab interaction
  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.exp-tab');
    if (!tab) return;
    const idx = Number(tab.dataset.index);

    tabsEl.querySelectorAll('.exp-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
      t.setAttribute('aria-selected', String(i === idx));
    });

    panelsEl.querySelectorAll('.exp-panel').forEach((p, i) => {
      p.classList.toggle('active', i === idx);
    });
  });
}

/* ── RENDER: PROJECTS ────────────────────────────────────────── */
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = PROJECTS.map((p, i) =>
    `<article class="project-card reveal reveal-d${(i % 3) + 1}">
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
        <p class="edu-school">${edu.school}</p>
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
  renderProjects();
  renderSkills();
  renderEducation();

  // Initialize interactions
  initScrollSpy();
  initTheme();
  initMobileNav();
});
