// js/gradient-hero.js
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.querySelector('.hero-3d');
  if (!host) return;

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const TAU = Math.PI * 2;

  // High-pop palette (falls back if CSS vars missing)
  const PALETTE = [
    css('--g1') || '#7c3aed', // violet
    css('--g2') || '#06b6d4', // cyan
    css('--g3') || '#22c55e', // mint
    css('--g4') || '#f59e0b', // amber
    '#ef4444'                 // red accent
  ];

  // Canvas (transparent)
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.background = 'transparent';
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

  function makeBlob(i, color) {
    const base = Math.min(w, h);
    return {
      color,
      R: base * (0.24 + 0.05 * (i % 3)),
      orbitAmpX: w * (0.14 + 0.04 * (i % 2)),
      orbitAmpY: h * (0.12 + 0.05 * ((i+1) % 2)),
      orbitSpeed: 0.18 + 0.08 * i,
      orbitPhase: i * 1.35,
      segs: 60,                         // smoother silhouette
      freq: 3 + (i % 3),
      morphSpeed: 0.6 + 0.1 * i,
      morphPhase: i * 2.0,
      alpha: 0.95
    };
  }

  let blobs = [];
  function rebuild() {
    blobs = [];
    for (let i = 0; i < Math.min(5, PALETTE.length); i++) {
      blobs.push(makeBlob(i, PALETTE[i]));
    }
  }
  rebuild();

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function drawBlob(t, cx, cy, b) {
    const pts = [];
    const Rbase = b.R * (1.0 + 0.02 * Math.sin(t*0.7 + b.morphPhase)); // gentle breathe
    const Rmin = Rbase * 0.78;  // clamp to avoid spikes
    const Rmax = Rbase * 1.22;

    for (let k = 0; k < b.segs; k++) {
      const a = (k / b.segs) * TAU;

      // Two-term wobble; lower amplitudes to keep edges round
      const rMod =
        0.18 * Math.sin(b.freq * a + t * b.morphSpeed + b.morphPhase) +
        0.08 * Math.cos((b.freq * 0.5) * a - t * (b.morphSpeed*0.6) + b.morphPhase*1.1);

      let r = Rbase * (1 + rMod);
      r = clamp(r, Rmin, Rmax);

      pts.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r
      });
    }

    // Smooth closed path via quadratic curves
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

    // Soft feather to prevent crunchy seams, no stroke
    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // smoother than 'lighter'
    ctx.shadowColor = rgba(b.color, 0.6);
    ctx.shadowBlur = 5;                      // tiny feather
    ctx.fillStyle = rgba(b.color, b.alpha);  // solid, bright
    ctx.fill();
    ctx.restore();
  }

  function frame(ts) {
    const t = (ts || 0) * 0.001;

    // Transparent clear (no black base)
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const ox = Math.cos(t * b.orbitSpeed + b.orbitPhase) * b.orbitAmpX;
      const oy = Math.sin(t * b.orbitSpeed * 0.85 + b.orbitPhase * 0.9) * b.orbitAmpY;
      drawBlob(t, cx + ox, cy + oy, b);
    }

    if (!prefersReduced) requestAnimationFrame(frame);
  }

  if (prefersReduced) {
    frame(0);
  } else {
    requestAnimationFrame(frame);
  }
})();
