// js/servicecolors.js
// Cycles through your defined CSS variables and applies them
// to each .service-item (affects both .s-name and .s-arrow thanks to inheritance)

document.addEventListener('DOMContentLoaded', () => {
  const palette = [
    'var(--g1)',
    'var(--g2)',
    'var(--g3)',
    'var(--g4)',
    'var(--g5)',
    'var(--brand-blue)'
  ];

  const items = document.querySelectorAll('.services .service-item');
  items.forEach((el, i) => {
    el.style.color = palette[i % palette.length];
  });
});
