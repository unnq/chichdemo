// js/gradient-hero.js
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  const cssVar = (v) => getComputedStyle(root).getPropertyValue(v).trim();

  const colors = [
    cssVar('--g1') || '#8b5cf6',
    cssVar('--g2') || '#06b6d4',
    cssVar('--g3') || '#22c55e',
    cssVar('--g4') || '#f59e0b'
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

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = host.clientWidth;
    h = host.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  function hexWithAlpha(hex, alpha) {
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

  // Self-driven animation (no pointer/scroll input)
  function draw(ts) {
    const t = (ts || 0) * 0.00035; // slow, fluid

    // Base fill (very dark, so the colors pop)
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = cssVar('--bg-dark') || '#0b0b0e';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.max(w, h);

    // Four orbiting blobs with different radii/speeds/phases
    const blobs = [
      { r: maxR * 0.95, ampX: w * 0.18, ampY: h * 0.14, speed: 0.60, phase: 0.00, a: 0.60 },
      { r: maxR * 0.75, ampX: w * 0.22, ampY: h * 0.18, speed: -0.45, phase: 1.20, a: 0.52 },
      { r: maxR * 0.65, ampX: w * 0.16, ampY: h * 0.22, speed: 0.36, phase: 2.40, a: 0.48 },
      { r: maxR * 1.15, ampX: w * 0.14, ampY: h * 0.10, speed: -0.25, phase: 3.10, a: 0.40 }
    ];

    // Use 'screen' for a brighter blend without overblown whites
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < colors.length; i++) {
      const b = blobs[i];
      const ax = Math.cos(t * b.speed + b.phase) * b.ampX;
      const ay = Math.sin(t * b.speed * 0.85 + b.phase * 0.8) * b.ampY;

      const x = cx + ax;
      const y = cy + ay;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      // Stronger inner stops for more pop
      grad.addColorStop(0.0, hexWithAlpha(colors[i], b.a));
      grad.addColorStop(0.35, hexWithAlpha(colors[i], b.a * 0.55));
      grad.addColorStop(1.0, hexWithAlpha(colors[i], 0.0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    if (!prefersReduced) requestAnimationFrame(draw);
  }

  if (prefersReduced) {
    draw(0); // single static frame
  } else {
    requestAnimationFrame(draw);
  }
})();
