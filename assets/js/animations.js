/* ============================================================
   ANIMATIONS.JS
   Scroll-reveal via IntersectionObserver, cursor glow effect
   ============================================================ */

/* ── SCROLL REVEAL ───────────────────────────────────────────── */
function initRevealAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target); // trigger once
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -50px 0px',
  });

  // Observe all elements marked for reveal
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── MARK SECTION ELEMENTS FOR REVEAL ───────────────────────── */
// Called after main.js renders dynamic content
function markRevealElements() {
  const selectors = [
    ['#experience .section-title', 0],
    ['#experience .exp-container',  1],
    ['#projects .section-title',    0],
    ['#skills .section-title',      0],
    ['#education .section-title',   0],
    ['#contact .contact-inner',     0],
    ['.footer',                     0],
  ];

  selectors.forEach(([sel]) => {
    const el = document.querySelector(sel);
    if (el && !el.classList.contains('reveal')) {
      el.classList.add('reveal');
    }
  });
}

/* ── CURSOR GLOW ─────────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rafId = null;
  let isActive = false;

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;

    if (!isActive) {
      glow.style.opacity = '1';
      isActive = true;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
    isActive = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  function tick() {
    // Smooth lag (lerp toward target)
    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;

    glow.style.left = `${currentX}px`;
    glow.style.top  = `${currentY}px`;

    rafId = requestAnimationFrame(tick);
  }
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Give main.js renderers a tick to inject DOM nodes
  setTimeout(() => {
    markRevealElements();
    initRevealAnimations();
    initCursorGlow();
  }, 0);
});
