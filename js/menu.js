// js/menu.js
(function () {
  const toggle = document.querySelector('.nav-menu-toggle');
  const panel = document.getElementById('mobile-menu');
  if (!toggle || !panel) return;

  const firstLink = () => panel.querySelector('a');

  function openMenu() {
    panel.hidden = false;
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    // focus first link for accessibility
    setTimeout(() => firstLink()?.focus(), 0);
  }

  function closeMenu() {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    // Wait for transition to finish before hiding for a11y
    setTimeout(() => { panel.hidden = true; }, 200);
    toggle.focus();
  }

  function isOpen() {
    return panel.classList.contains('open');
  }

  toggle.addEventListener('click', () => {
    isOpen() ? closeMenu() : openMenu();
  });

  // Close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closeMenu();
    }
  });

  // Close after clicking a link
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) closeMenu();
  });
})();
