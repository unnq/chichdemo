// js/halftone-hero.js
// Generates a transparent PNG halftone that’s edge-heavier with subtle center and mild “swells”.
// Applies it as background-image to both .halftone-base and .halftone-ripple.
// Non-invasive: if the two divs aren’t present, it will create them.

(function(){
  const DARK = 'rgba(44,45,46,0.65)'; // dot color (matches your --text-dark vibe, semi-transparent)
  const MAX_DPR = 2;                  // cap for perf / crispness

  function debounce(fn, delay){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), delay); }; }

  function ensureLayers(hero){
    let base   = hero.querySelector('.halftone-base');
    let ripple = hero.querySelector('.halftone-ripple');
    if(!base){   base   = document.createElement('div');   base.className   = 'halftone-base';   hero.appendChild(base); }
    if(!ripple){ ripple = document.createElement('div');   ripple.className = 'halftone-ripple'; hero.appendChild(ripple); }
    return { base, ripple };
  }

  // Simple “swell” function (deterministic, cheap, looks organic enough for subtle motionless texture)
  function swell2(x, y){
    // Combine two low-frequency waves; returns ~[-1, +1]
    return Math.sin(x*0.012 + y*0.008) * Math.cos(x*0.006 - y*0.010);
  }

  function generateHalftonePNG(w, h, opts={}){
    const {
      pitch = 8,         // px between dot centers (visual density)
      minR  = 0.30,      // min radius (center)
      maxR  = 2.20,      // max radius (edges)
      edgePower = 1.35,  // how quickly size grows toward edges
      swellAmp  = 0.28,  // 0..~0.4 is subtle; increases local variation
      color     = DARK
    } = opts;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cw = Math.max(2, Math.round(w * dpr));
    const ch = Math.max(2, Math.round(h * dpr));

    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,cw,ch);
    ctx.fillStyle = color;

    const cx = cw/2, cy = ch/2;
    const maxD = Math.hypot(cx, cy);
    const step = Math.max(4, Math.round(pitch * dpr));

    // Draw circles in a grid; radius increases toward edges + tiny “swells”
    for(let y = 0; y <= ch + step; y += step){
      for(let x = 0; x <= cw + step; x += step){
        const dx = x - cx, dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const edge = Math.pow(dist / maxD, edgePower); // 0 at center → 1 at corner radius

        // Subtle swells (centered around 1.0)
        const sRaw = swell2(x, y);              // [-1, +1]
        const swell = 1 + swellAmp * sRaw;      // ~[1-amp, 1+amp]

        const r = (minR + (maxR - minR) * edge) * swell * dpr;

        if (r > 0.08){
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
    return c.toDataURL('image/png');
  }

  function applyHalftone(hero){
    const { base, ripple } = ensureLayers(hero);
    const rect = hero.getBoundingClientRect();

    // Generate once per size (base + ripple share the same PNG)
    const dataURL = generateHalftonePNG(rect.width, rect.height);

    base.style.backgroundImage   = `url(${dataURL})`;
    ripple.style.backgroundImage = `url(${dataURL})`;
  }

  function init(){
    const hero = document.querySelector('.hero');
    if(!hero) return; // nothing to do

    // Make sure the hero is positioned properly (it already is in your CSS)
    hero.style.position = hero.style.position || 'relative';

    const run = ()=>applyHalftone(hero);
    window.addEventListener('load', run, { once: true });
    window.addEventListener('resize', debounce(run, 200));
  }

  init();
})();
