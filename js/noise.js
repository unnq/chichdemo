// js/noise.js
(function () {
  const SIZE = 160;              // noise tile size in px (smaller = finer grain)
  const ALPHA = 0.5;            // overall transparency (0..1). 0.5 ≈ 50%
  const MAGENTA = [139, 0, 139]; // your brand magenta (RGB)
  const MAGENTA_PROB = 0.008;   // ~0.8% of pixels become magenta speckles

  // Build a tiny RGBA noise tile
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(SIZE, SIZE);
  const aByte = Math.round(ALPHA * 255);
  const aByteMagenta = Math.min(255, Math.round(aByte * 1.1)); // tiny boost if you want magenta to pop a hair

  for (let i = 0; i < img.data.length; i += 4) {
    if (Math.random() < MAGENTA_PROB) {
      // rare magenta pixel
      img.data[i]     = MAGENTA[0];
      img.data[i + 1] = MAGENTA[1];
      img.data[i + 2] = MAGENTA[2];
      img.data[i + 3] = aByteMagenta;
    } else {
      // grayscale pixel
      const v = (Math.random() * 255) | 0;
      img.data[i]     = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = aByte;
    }
  }

  ctx.putImageData(img, 0, 0);

  const url = c.toDataURL('image/png');
  const el = document.querySelector('.hero-title');
  if (!el) return;

  // Apply tile as the text fill (CSS already does background-clip:text)
  el.style.backgroundImage = `url(${url})`;
  el.style.backgroundRepeat = 'repeat';
  el.style.backgroundSize = '128px 128px'; // adjust with your CSS if you want
})();
