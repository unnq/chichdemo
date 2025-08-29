// js/noise.js
(function () {
  const SIZE = 160; // tile size in px

  // Create a tiny grayscale noise tile
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(SIZE, SIZE);

  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;  // 0..255 grayscale
    img.data[i]     = v; // R
    img.data[i + 1] = v; // G
    img.data[i + 2] = v; // B
    img.data[i + 3] = 255; // opaque
  }

  ctx.putImageData(img, 0, 0);

  const url = c.toDataURL('image/png');
  const el = document.querySelector('.nav-left');
  if (!el) return;

  // Apply as a repeated background; CSS will clip it to the text
  el.style.backgroundImage = `url(${url})`;
  el.style.backgroundRepeat = 'repeat';
  el.style.backgroundSize = '160px 160px';
})();
