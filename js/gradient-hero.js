// js/gradient-hero.js
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.querySelector('.hero-3d');
  if (!host) return;

  // Helpers
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const TAU = Math.PI * 2;

  // Punchy palette (falls back if CSS vars missing)
  const palette = [
    css('--g1') || '#7c3aed', // violet
    css('--g2') || '#06b6d4', // cyan
    css('--g3') || '#22c55e', // mint
    css('--g4') || '#f59e0b', // amber
    '#ef4444'                 // red accent to boost contrast
  ];

  // Base fill — force dark so colors pop regardless of body bg
  const bg = '#0b0b0e';

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = host.clientWidth | 0;
    h = host.clientHeight | 0;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Color utilities
  const hexToRgb = (hex) => {
    if (hex.startsWith('rgb')) {
      const m = hex.match(/(\d+),\s*(\d+),\s*(\d+)/);
      return m ? { r: +m[1], g: +m[2], b: +m[3] } : { r: 255, g: 255, b: 255 };
    }
    const h = hex.replace('#','');
    const r = h.length === 3 ? parseInt(h[0]+h[0],16) : parseInt(h.slice(0,2),16);
    const g = h.length === 3 ? parseInt(h[1]+h[1],16) : parseInt(h.slice(2,4),16);
    const b = h.length === 3 ? parseInt(h[2]+h[2],16) : parseInt(h.slice(4,6),16);
    return { r, g, b };
  };
  const rgba = (hex, a=1) => {
    const { r,g,b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  const darken = (hex, f=0.7) => {
    const { r,g,b } = hexToRgb(hex);
    return `rgb(${(r*f)|0}, ${(g*f)|0}, ${(b*f)|0})`;
  };

  // Blob config factory
  function makeBlob(i, color) {
    const base = Math.min(w, h);
    return {
      color,
      // Size & motion
      R: base * (0.22 + 0.06 * (i % 3)),           // base radius
      orbitAmpX: w * (0.12 + 0.04 * (i % 2)),
      orbitAmpY: h * (0.10 + 0.05 * ((i+1) % 2)),
      orbitSpeed: 0.2 + 0.08 * i,
      orbitPhase: i * 1.3,
      // Shape morph
      segs: 28,                           // more segments = smoother edge
      freq: 3 + (i % 3),                  // lobes around the ring
      morphSpeed: 0.7 + 0.12 * i,         // how quickly shape wiggles
      morphPhase: i * 2.1,
      // Rendering
      alpha: 0.85                         // strong, not see-through
    };
  }

  let blobs = [];

  function rebuild() {
    blobs = [];
    for (let i = 0; i < Math.min(5, palette.length); i++) {
      blobs.push(makeBlob(i, palette[i]));
    }
  }
  rebuild();

  // Draw a single morphing, solid-color blob (no gradients)
  function drawBlob(t, cx, cy, b) {
    const pts = [];
    const R = b.R * (1.0 + 0.03 * Math.sin(t*0.8 + b.morphPhase)); // slow breathing

    for (let k = 0; k < b.segs; k++) {
      const a = (k / b.segs) * TAU;
      // Radial offset driven by a couple of sin terms for organic wobble
      const rMod =
        0.25 * Math.sin(b.freq * a + t * b.morphSpeed + b.morphPhase) +
        0.12 * Math.cos((b.freq * 0.5) * a - t * (b.morphSpeed*0.7) + b.morphPhase*1.3);
      const r = R * (1 + rMod);
      pts.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r
      });
    }

    // Smooth closed path via quadratic curves between midpoints
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      const midX = (p0.x + p1.x) * 0.5;
      const midY = (p0.y + p1.y) * 0.5;
      if (i === 0) ctx.moveTo(midX, midY);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    ctx.closePath();

    // Fill solid with additive mixing for overlap “pop”
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(b.color, b.alpha);
    ctx.fill();

    // Optional crisp edge to “define” shapes (very subtle)
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = Math.max(1, Math.min(2, Math.floor(Math.min(w,h) / 600)));
    ctx.strokeStyle = rgba(darken(b.color, 0.7), 0.9);
    ctx.stroke();
    ctx.restore();
  }

  function frame(ts) {
    const t = (ts || 0) * 0.001; // seconds

    // Paint dark base so blobs read with high contrast
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Center + orbits
    const cx = w * 0.5;
    const cy = h * 0.5;

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const ox = Math.cos(t * b.orbitSpeed + b.orbitPhase) * b.orbitAmpX;
      const oy = Math.sin(t * b.orbitSpeed * 0.83 + b.orbitPhase * 0.9) * b.orbitAmpY;
      drawBlob(t, cx + ox, cy + oy, b);
    }

    if (!prefersReduced) requestAnimationFrame(frame);
  }

  if (prefersReduced) {
    frame(0); // single static
  } else {
    requestAnimationFrame(frame);
  }
})();
