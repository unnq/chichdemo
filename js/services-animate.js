// js/services-animate.js
// Column-aware, JS-only transitions (no new CSS needed).
// - Col 1 items slide in from LEFT
// - Col 2 items slide in from DOWN
// - Col 3 items slide in from RIGHT
// Replays every time the section re-enters view.
// Respects prefers-reduced-motion.

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.section.services');
  if (!section) return;

  const grid   = section.querySelector('.services-grid');
  const items  = Array.from(section.querySelectorAll('.service-item'));
  const arrows = items.map(el => el.querySelector('.s-arrow'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Helper: number of CSS grid columns currently active
  function getColCount() {
    const cols = getComputedStyle(grid).gridTemplateColumns;
    // e.g. "1fr 1fr 1fr" -> 3
    return cols ? cols.split(' ').length : 3;
  }

  // Determine item column by index (works as items flow into grid)
  function getColIndex(i, colCount) {
    return i % colCount; // 0-based: 0,1,2 for 3 columns
  }

  // Reset a single item to its "pre-reveal" state based on its column
  function resetItem(el, i) {
    const colCount = getColCount();
    const c = getColIndex(i, colCount);

    // Inline transitions so we don't need extra CSS
    el.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    el.style.willChange = 'opacity, transform';

    // Start hidden + offset by column
    el.style.opacity = '0';
    if (c === 0) {
      el.style.transform = 'translateX(-12px)';
    } else if (c === 1) {
      el.style.transform = 'translateY(12px)';
    } else {
      el.style.transform = 'translateX(12px)';
    }

    // Arrow subtle nudge pre-state
    const arrow = el.querySelector('.s-arrow');
    if (arrow) {
      arrow.style.transition = 'transform 360ms cubic-bezier(.22,1,.36,1), opacity 360ms ease-out';
      arrow.style.willChange = 'transform, opacity';
      arrow.style.opacity = '0.85';
      arrow.style.transform = 'translateX(0)';
    }
  }

  // Reveal an item with stagger
  function revealItem(el, i, baseDelay = 70) {
    const rowStagger = Math.floor(i / getColCount()) * 40; // tiny extra per row
    const delay = i * baseDelay + rowStagger;

    // Force a reflow so transitions apply from reset state
    // (avoid layout thrash by batching inside rAF)
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';

        // tiny arrow glide (forward then settle)
        const arrow = el.querySelector('.s-arrow');
        if (arrow) {
          // glide out a bit, then settle back
          arrow.style.transform = 'translateX(4px)';
          setTimeout(() => {
            arrow.style.transform = 'translateX(0)';
          }, 180);
        }
      }, delay);
    });
  }

  function showAll() {
    items.forEach((el) => {
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  // Initial prep
  if (reduceMotion) {
    showAll();
    return;
  } else {
    items.forEach((el, i) => resetItem(el, i));
  }

  // Recompute on resize (columns can change at breakpoints)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-apply reset for correct directions when layout changes
      items.forEach((el, i) => resetItem(el, i));
    }, 150);
  });

  // IntersectionObserver: reveal on enter, reset on exit (so it can replay)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // reveal with stagger
        items.forEach((el, i) => revealItem(el, i));
      } else {
        // reset when the whole section leaves (top or bottom)
        items.forEach((el, i) => resetItem(el, i));
      }
    });
  }, {
    root: null,
    threshold: 0.15,         // reveal when ~15% visible
  });

  io.observe(section);
});
