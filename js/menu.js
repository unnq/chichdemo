// js/menu.js
// Slide-down mobile menu with blur background.
// Keeps the toggle accessible, supports ESC + outside click,
// closes on resize to desktop, and syncs datetime from the tagline.
// No changes needed to your datetime.js.

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  // a11y setup
  toggle.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function openMenu() {
    menu.classList.add('is-open');
    menu.removeAttribute('hidden'); // if present
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');

    // lock body scroll optionally (comment out if you don't want this)
    document.documentElement.style.overflow = 'hidden';

    // sync datetime on open
    syncMobileDatetime();

    // listeners
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onOutsidePointerDown);
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');

    // allow page scroll again
    document.documentElement.style.overflow = '';

    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onOutsidePointerDown);
  }

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && isOpen()) {
      closeMenu();
      toggle.focus();
    }
  }

  function onOutsidePointerDown(e) {
    const withinToggle = toggle.contains(e.target);
    const withinMenu   = menu.contains(e.target);
    if (!withinToggle && !withinMenu && isOpen()) {
      closeMenu();
    }
  }

  toggle.addEventListener('click', () => {
    isOpen() ? closeMenu() : openMenu();
  });

  // Close when switching to desktop layout
  const onResize = () => {
    if (window.innerWidth > 900 && isOpen()) closeMenu();
  };
  window.addEventListener('resize', onResize);

  // --- Datetime sync ---
  // Copy text from the existing tagline datetime (#tagline-datetime) if present.
  // Falls back gracefully if not found.
  function syncMobileDatetime() {
    const src = document.getElementById('tagline-datetime');
    const dst = document.getElementById('mobile-datetime');
    if (!src || !dst) return;

    const sDay  = src.querySelector('.dt-day')?.textContent || '';
    const sDate = src.querySelector('.dt-date')?.textContent || '';
    const sTime = src.querySelector('.dt-time')?.textContent || '';

    const dDay  = dst.querySelector('.dt-day');
    const dDate = dst.querySelector('.dt-date');
    const dTime = dst.querySelector('.dt-time');

    if (dDay)  dDay.textContent  = sDay;
    if (dDate) dDate.textContent = sDate;
    if (dTime) dTime.textContent = sTime;
  }

  // Keep the mobile datetime reasonably fresh without touching your datetime.js
  // (updates every 30s while the page is open)
  setInterval(syncMobileDatetime, 30000);

  // If menu starts hidden via [hidden], ensure correct state
  menu.removeAttribute('hidden');
  if (!reduce) {
    // keep it visually hidden until opened
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
  }
});
