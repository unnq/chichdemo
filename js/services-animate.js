// js/services-animate.js
// Adds .is-visible to the .services section on first reveal.
// Also adds a .revealed class to each .service-item in order (optional progressive stagger).

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.section.services');
  if (!section) return;

  const items = Array.from(section.querySelectorAll('.service-item'));

  const io = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
      section.classList.add('is-visible');

      // Optional progressive stagger via JS (compliments CSS nth-child delays)
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 70); // 70ms per item
      });

      io.disconnect(); // run once
    }
  }, { root: null, threshold: 0.25 });

  io.observe(section);
});
