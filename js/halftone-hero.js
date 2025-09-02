// js/halftone-hero.js
// Static, transparent halftone PNG (edge-heavier, subtle center).
// No filters, no animation. Applies the same image to both layers.

(function(){
  const DOT_RGBA   = 'rgba(44,45,46,0.65)'; // dark semi-opaque dots to play nice on your f2f1f0 background
  const MAX_DPR    = 2;                     // cap for perf + crispness
  const DEFAULTS   = {
    pitch: 7,         // px between dot centers (visual density)
    minR:  0.25,      // min dot radius near center
    maxR:  1,      // max dot radius near edges
    edgePower: 2.35,  // edge falloff curve; higher = heavier edges  - default 3.35
    swellAmp: 0.85    // subtle local variation; set to 0 to disable “swells” - default 0.45
  };

  const debounce = (fn, ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

  // Cheap deterministic “swell” to avoid sterile grid look (kept very light)
  function swell2(x, y){
    return Math.sin(x*0.012 + y*0.008) * Math.cos(x*0.006 - y*0.010); // ~[-1,+1]
  }

  function generateHalftonePNG(w, h, opts = {}){
    const cfg = { ...DEFAULTS, ...opts };
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const cw = Math.max(2, Math.round(w * dpr));
    const ch = Math.max(2, Math.round(h * dpr));

    const c  = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d', { alpha: true });
    ctx.clearRect(0,0,cw,ch);
    ctx.fillStyle = DOT_RGBA;

    const cx = cw/2, cy = ch/2;
    const maxD = Math.hypot(cx, cy);
    const step = Math.max(4, Math.round(cfg.pitch * dpr));

    for(let y = 0; y <= ch + step; y += step){
      for(let x = 0; x <= cw + step; x += step){
        const dx = x - cx, dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const edge = Math.pow(dist / maxD, cfg.edgePower); // 0 (center) → 1 (corners)

        const s = cfg.swellAmp ? (1 + cfg.swellAmp * swell2(x, y)) : 1;
        const r = (cfg.minR + (cfg.maxR - cfg.minR) * edge) * s * dpr;

        if (r > 0.08){
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }

    return c.toDataURL('image/png');
  }

  function ensureLayers(hero){
    let base   = hero.querySelector('.halftone-base');
    let ripple = hero.querySelector('.halftone-ripple');
    if(!base){   base   = document.createElement('div');   base.className   = 'halftone-base';   hero.appendChild(base); }
    if(!ripple){ ripple = document.createElement('div');   ripple.className = 'halftone-ripple'; hero.appendChild(ripple); }
    return { base, ripple };
  }

  function applyStaticHalftone(hero){
    const { base, ripple } = ensureLayers(hero);
    const rect = hero.getBoundingClientRect();
    const dataURL = generateHalftonePNG(rect.width, rect.height);

    base.style.backgroundImage   = `url(${dataURL})`;
    ripple.style.backgroundImage = `url(${dataURL})`;
  }

  function init(){
    const hero = document.querySelector('.hero');
    if(!hero) return;
    hero.style.position = hero.style.position || 'relative';

    const run = ()=>applyStaticHalftone(hero);
    window.addEventListener('load', run, { once: true });
    window.addEventListener('resize', debounce(run, 200));
  }

  init();
})();
