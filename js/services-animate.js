// js/services-animate.js
// Column-aware item animations + label animation.
// Re-animates on every re-entry. Respects prefers-reduced-motion.

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.section.services');
  if (!section) return;

  const grid   = section.querySelector('.services-grid');
  const label  = section.querySelector('.services-label');
  const items  = Array.from(section.querySelectorAll('.service-item'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getColCount() {
    const cols = getComputedStyle(grid).gridTemplateColumns;
    return cols ? cols.split(' ').length : 3;
  }
  function getColIndex(i, colCount) { return i % colCount; }

  // --- Label ---
  function resetLabel() {
    if (!label) return;
    label.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    label.style.willChange = 'opacity, transform';
    label.style.opacity = '0';
    label.style.transform = 'translateX(-12px)'; // gentle slide in from left
  }
  function revealLabel(delay = 40) {
    if (!label) return;
    setTimeout(() => {
      label.style.opacity = '1';
      label.style.transform = 'none';
    }, delay);
  }

  // --- Items ---
  function resetItem(el, i) {
    const colCount = getColCount();
    const c = getColIndex(i, colCount);
    el.style.transition = 'opacity 420ms ease-out, transform 420ms cubic-bezier(.22,1,.36,1)';
    el.style.willChange = 'opacity, transform';
    el.style.opacity = '0';
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
  function revealItem(el, i, baseDelay = 70) {
    const rowStagger = Math.floor(i / getColCount()) * 40;
    const delay = i * baseDelay + rowStagger;
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        const arrow = el.querySelector('.s-arrow');
        if (arrow) {
          arrow.style.transform = 'translateX(4px)';
          setTimeout(() => { arrow.style.transform = 'translateX(0)'; }, 180);
        }
      }, delay);
    });
  }

  function showAll() {
    if (label) { label.style.transition = 'none'; label.style.opacity = '1'; label.style.transform = 'none'; }
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
    resetLabel();
    items.forEach((el, i) => resetItem(el, i));
  }

  // Recompute on resize (columns change at breakpoints)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resetLabel();
      items.forEach((el, i) => resetItem(el, i));
    }, 150);
  });

  // IO: reveal on enter, reset on exit so it can replay
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealLabel(40);
        items.forEach((el, i) => revealItem(el, i));
      } else {
        resetLabel();
        items.forEach((el, i) => resetItem(el, i));
      }
    });
  }, { threshold: 0.15 });

  io.observe(section);
});
