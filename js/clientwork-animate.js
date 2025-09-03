// js/clientwork-animate.js
// Client Work reveal animations, matching services style.
// Replays on re-entry with hysteresis. Prefers-reduced-motion safe.

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.section.client-work');
  if (!section) return;

  const grid   = section.querySelector('.cw-grid');
  const title  = section.querySelector('.client-work-title');
  const cta    = section.querySelector('.btn-cta-pink');
  const cards  = Array.from(section.querySelectorAll('.cw-card'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- helpers ---
  const now = () => performance.now();
  let lastFullyOutTs = 0;
  const REPLAY_RESET_DELAY = 350; // ms after section fully out of view

  function getColCount() {
    const cols = getComputedStyle(grid).gridTemplateColumns;
    return cols ? cols.split(' ').length : 2; // your grid is fixed 2 cols
  }
  function colIndex(i) { return i % getColCount(); } // 0-based

  // --- head prep / reveal / reset (title + CTA) ---
  function prepHeadEl(el, dir = 'x', dist = 12) {
    if (!el) return;
    el.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    el.style.willChange = 'opacity, transform';
    el.style.opacity = '0';
    if (dir === 'x') el.style.transform = `translateX(${dist}px)`;
    else el.style.transform = `translateY(${dist}px)`;
  }
  function revealHeadEl(el) {
    if (!el) return;
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  function resetHeadEl(el, dir = 'x', dist = 12) { prepHeadEl(el, dir, dist); }

  // --- card prep / reveal / reset ---
  function prepCard(el, i) {
    el.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    el.style.willChange = 'opacity, transform';
    el.style.opacity = '0';

    const c = colIndex(i); // 0 = left, 1 = right
    if (c === 0) el.style.transform = 'translateX(-12px)';
    else el.style.transform = 'translateX(12px)';
  }
  function revealCard(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  function resetCard(el, i) { prepCard(el, i); }

  function showAllInstant() {
    if (title) { title.style.transition = 'none'; title.style.opacity = '1'; title.style.transform = 'none'; }
    if (cta)   { cta.style.transition   = 'none'; cta.style.opacity   = '1'; cta.style.transform   = 'none'; }
    cards.forEach(el => { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  // Initial state
  if (reduce) {
    showAllInstant();
    return;
  } else {
    // Title from left, CTA from right
    prepHeadEl(title, 'x', -12);
    prepHeadEl(cta,   'x',  12);
    cards.forEach((el, i) => prepCard(el, i));
  }

  // --- Observers ---

  // 1) Track when entire section is fully out of view for hysteresis reset
  const sectionOutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio === 0) {
        lastFullyOutTs = now();
      }
    });
  }, {
    root: null,
    threshold: 0,
    rootMargin: '0px'
  });
  sectionOutObserver.observe(section);

  // 2) Header observer (title + CTA)
  const headTargets = [title, cta].filter(Boolean);
  if (headTargets.length) {
    const headObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          // small stagger between title and CTA
          const baseDelay = el === title ? 60 : 160;
          setTimeout(() => revealHeadEl(el), baseDelay);
        } else {
          if (now() - lastFullyOutTs > REPLAY_RESET_DELAY) {
            // reset direction per element
            if (el === title) resetHeadEl(el, 'x', -12);
            else resetHeadEl(el, 'x', 12);
          }
        }
      });
    }, {
      root: null,
      threshold: 0.2,
      rootMargin: '-10% 0px -10% 0px'
    });
    headTargets.forEach(t => headObserver.observe(t));
  }

  // 3) Per-card observer
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const i  = cards.indexOf(el);
      if (i === -1) return;

      if (entry.isIntersecting) {
        // Stagger by index + row for cadence, same idea as services
        const rowStagger = Math.floor(i / getColCount()) * 60;
        const delay = i * 90 + rowStagger; // ms
        setTimeout(() => revealCard(el), delay);
      } else {
        if (now() - lastFullyOutTs > REPLAY_RESET_DELAY) resetCard(el, i);
      }
    });
  }, {
    root: null,
    threshold: 0.2,
    rootMargin: '-10% 0px -10% 0px'
  });
  cards.forEach(el => cardObserver.observe(el));
});
