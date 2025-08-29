// js/noise.js
(function () {
  const SIZE = 32; // noise tile size (px)

  // Build a tiny grayscale noise tile
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(SIZE, SIZE);

  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;   // 0..255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; // gray
    img.data[i + 3] = 255;                 // opaque
  }
  ctx.putImageData(img, 0, 0);

  // Turn into data URL and apply to hero title
  const url = c.toDataURL('image/png');
  const el = document.querySelector('.hero-title');
  if (!el) return;

  // Apply as background on the element (keeps it isolated to the title)
  el.style.backgroundImage = `url(${url})`;
  // Optional: tiny tint/boost for brightness—uncomment if you want a colder look
  // el.style.filter = 'contrast(1.1) brightness(1.1)';
})();
