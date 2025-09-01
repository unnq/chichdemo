// js/gradient-hero.js
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  const getCSS = (v) => getComputedStyle(root).getPropertyValue(v).trim();

  const colors = [
    getCSS('--g1') || '#8b5cf6', // violet
    getCSS('--g2') || '#06b6d4', // cyan
    getCSS('--g3') || '#22c55e', // mint
    getCSS('--g4') || '#f59e0b'  // amber (sparingly)
  ];

  const host = document.querySelector('.hero-3d');
  if (!host) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let t = 0;

  // Parallax targets
  let pointerX = 0.5, pointerY = 0.5; // normalized
  let scrollBias = 0;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = host.clientWidth;
    h = host.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, m) { return a + (b - a) * m; }

  function drawFrame(ts) {
    if (!prefersReduced) t = ts * 0.0003; // slow drift

    // Clear with dark base
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getCSS('--bg-dark') || '#0b0b0e';
    ctx.fillRect(0, 0, w, h);

    // Parameters
    const cx = w * lerp(0.35, 0.65, pointerX);
    const cy = h * lerp(0.35, 0.65, pointerY);
    const maxR = Math.max(w, h) * 0.9;

    // Gentle orbit offsets
    const orbits = [
      { r: maxR * 0.9,  k: 0.85,  speed: 0.6,  a: 0.35 },
      { r: maxR * 0.7,  k: 0.55,  speed: -0.45, a: 0.32 },
      { r: maxR * 0.6,  k: 0.35,  speed: 0.35,  a: 0.27 },
      { r: maxR * 1.1,  k: 0.95,  speed: -0.25, a: 0.18 }, // accent
    ];

    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < colors.length; i++) {
      const o = orbits[i];
      const angle = (t * o.speed) + i * Math.PI * 0.5 + scrollBias * 0.25;

      const ox = cx + Math.cos(angle) * (w * 0.15 * o.k);
      const oy = cy + Math.sin(angle) * (h * 0.15 * o.k);

      const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
      grad.addColorStop(0.0, hexWithAlpha(colors[i], o.a));
      grad.addColorStop(0.5, hexWithAlpha(colors[i], o.a * 0.35));
      grad.addColorStop(1.0, hexWithAlpha(colors[i], 0.0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';

    if (!prefersReduced) requestAnimationFrame(drawFrame);
  }

  function hexWithAlpha(hex, alpha) {
    // Accepts #rgb, #rrggbb, or already rgba()
    if (!hex) return `rgba(255,255,255,${alpha})`;
    if (hex.startsWith('rgb')) {
      return hex.replace(/\)$/, `, ${alpha})`).replace('rgb(', 'rgba(');
    }
    let r, g, b;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else {
      r = parseInt(hex.slice(1,3), 16);
      g = parseInt(hex.slice(3,5), 16);
      b = parseInt(hex.slice(5,7), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Parallax from pointer
  window.addEventListener('pointermove', (e) => {
    const rect = host.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / Math.max(1, rect.width);
    pointerY = (e.clientY - rect.top) / Math.max(1, rect.height);
  }, { passive: true });

  // Subtle scroll bias
  window.addEventListener('scroll', () => {
    const y = window.scrollY || 0;
    scrollBias = (y % window.innerHeight) / Math.max(1, window.innerHeight);
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();

  if (prefersReduced) {
    // Draw a single static frame for reduced motion users
    drawFrame(0);
  } else {
    requestAnimationFrame(drawFrame);
  }
})();
