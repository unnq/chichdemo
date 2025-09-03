// js/clientwork-colors.js
// Randomizes your palette order on each page load
// Applies colors to:
// - Client Work overlay asterisks
// - Scroll indicator asterisks + text
// - Mobile menu dots (::after of each link)

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

  // 1) Client Work asterisks + scroll indicator
  const asters = document.querySelectorAll(
    '.cw-asterisk, .asterisk-left, .asterisk-right, .scroll-text'
  );
  asters.forEach((el, i) => {
    el.style.color = palette[i % palette.length];
  });

  // 2) Mobile menu links (assign color via CSS variable)
  const menuLinks = document.querySelectorAll('.mobile-menu a');
  menuLinks.forEach((el, i) => {
    el.style.setProperty('color', palette[i % palette.length]);
  });
});
