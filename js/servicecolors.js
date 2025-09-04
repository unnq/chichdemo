// js/servicecolors.js
// Randomizes your palette order on each page load
// Applies the colors in sequence to each .service-item

document.addEventListener('DOMContentLoaded', () => {
  let palette = [
    'var(--g1)',
    'var(--g2)',
    'var(--g3)',
    'var(--g4)',
    'var(--g5)',
    'var(--brand-blue)'
  ];

  // Fisher–Yates shuffle
  for (let i = palette.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [palette[i], palette[j]] = [palette[j], palette[i]];
  }

  const items = document.querySelectorAll('.s-arrow');
  items.forEach((el, i) => {
    el.style.color = palette[i % palette.length];
  });
});
