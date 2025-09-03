// js/services-animate.js
// Mobile-safe reveal: per-item observers + hysteresis reset.
// Replays on re-entry without flicker. Alternates by column (L / U / R).
// Respects prefers-reduced-motion.

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.section.services');
  if (!section) return;

  const grid   = section.querySelector('.services-grid');
  const label  = section.querySelector('.services-label');
  const items  = Array.from(section.querySelectorAll('.service-item'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- helpers ---
  const now = () => performance.now();
  let lastFullyOutTs = 0;
  const REPLAY_RESET_DELAY = 350; // ms after section fully out of view

  function getColCount() {
    const cols = getComputedStyle(grid).gridTemplateColumns;
    return cols ? cols.split(' ').length : 3;
  }
  function colIndex(i) { return i % getColCount(); } // 0-based

  // --- label prep / reveal / reset ---
  function prepLabel() {
    if (!label) return;
    label.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    label.style.willChange = 'opacity, transform';
    label.style.opacity = '0';
    label.style.transform = 'translateX(-12px)';
  }
  function revealLabel() {
    if (!label) return;
    label.style.opacity = '1';
    label.style.transform = 'none';
  }
  function resetLabel() { prepLabel(); }

  // --- item prep / reveal / reset ---
  function prepItem(el, i) {
    el.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    el.style.willChange = 'opacity, transform';
    el.style.opacity = '0';

    const c = colIndex(i);
    if (c === 0) el.style.transform = 'translateX(-12px)';
    else if (c === 1) el.style.transform = 'translateY(12px)';
    else el.style.transform = 'translateX(12px)';

    const arrow = el.querySelector('.s-arrow');
    if (arrow) {
      arrow.style.transition = 'transform 360ms cubic-bezier(.22,1,.36,1), opacity 360ms ease-out';
      arrow.style.willChange = 'transform, opacity';
      arrow.style.opacity = '0.85';
      arrow.style.transform = 'translateX(0)';
    }
  }
  function revealItem(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    const arrow = el.querySelector('.s-arrow');
    if (arrow) {
      arrow.style.transform = 'translateX(4px)';
      setTimeout(() => { arrow.style.transform = 'translateX(0)'; }, 180);
    }
  }
  function resetItem(el, i) { prepItem(el, i); }

  function showAllInstant() {
    if (label) { label.style.transition = 'none'; label.style.opacity = '1'; label.style.transform = 'none'; }
    items.forEach(el => { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  // Initial state
  if (reduce) {
    showAllInstant();
    return;
  } else {
    prepLabel();
    items.forEach((el, i) => prepItem(el, i));
  }

  // --- Observers ---
  // 1) Track when entire section is *fully out* of view to allow reset (hysteresis)
  const sectionOutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio === 0) {
        lastFullyOutTs = now();
      }
    });
  }, {
    root: null,
    threshold: 0,                 // fires when fully out
    rootMargin: '0px 0px 0px 0px'
  });
  sectionOutObserver.observe(section);

  // 2) Label observer (reveal on enter; reset only when section has been out for a bit)
  if (label) {
    const labelObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealLabel();
        } else {
          // Only reset if the whole section has been out for a moment (prevents iOS flicker)
          if (now() - lastFullyOutTs > REPLAY_RESET_DELAY) resetLabel();
        }
      });
    }, {
      root: null,
      threshold: 0.2,
      rootMargin: '-10% 0px -10% 0px' // a bit of hysteresis top/bottom
    });
    labelObserver.observe(label);
  }

  // 3) Per-item observer
  const itemObserver = new IntersectionObserver((entries) => {
    // Stagger by index for nicer cadence
    entries.forEach(entry => {
      const el = entry.target;
      const i  = items.indexOf(el);
      if (i === -1) return;

      if (entry.isIntersecting) {
        const rowStagger = Math.floor(i / getColCount()) * 40;
        const delay = i * 70 + rowStagger; // ms
        setTimeout(() => revealItem(el), delay);
      } else {
        if (now() - lastFullyOutTs > REPLAY_RESET_DELAY) resetItem(el, i);
      }
    });
  }, {
    root: null,
    threshold: 0.2,
    rootMargin: '-10% 0px -10% 0px'
  });

  items.forEach(el => itemObserver.observe(el));

  // No window resize listener (iOS fires it while scrolling).
  // We recalc columns lazily each time we need them via getColCount().
});
