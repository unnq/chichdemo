// js/clientwork-colors.js
// Randomizes your palette order on each page load
// Applies colors in sequence to each .cw-asterisk

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

  const asters = document.querySelectorAll('.cw-asterisk');
  asters.forEach((el, i) => {
    el.style.color = palette[i % palette.length];
  });
});
