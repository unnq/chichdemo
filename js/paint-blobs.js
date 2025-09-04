// paint-blobs-bg.js — make the "Thick Paint" blobs usable as a background on any element
// Usage: add class "paint-blobs" or attribute data-paint-blobs to a container with a set height.
// Optional: set CSS vars (--g1..--g4) on that element to customize colors per-instance.

(() => {
  const SELECTOR = '.paint-blobs,[data-paint-blobs]';

  // One shader program per instance so we can size to each host.
  // (We keep the exact shader from your version—no dynamic uniform indexing.)
  const VERT = `
    attribute vec2 a;
    void main() { gl_Position = vec4(a, 0.0, 1.0); }
  `;

  const FRAG = `
    precision mediump float;

    uniform vec2  u_res;
    uniform float u_time;
    uniform vec4  u_cols[6];

    const float SHARP  = 12.0;
    const float THRESH = 0.55;
    const float EDGE   = 0.010;

    float hash(float n) { return fract(sin(n * 43758.5453123) * 12345.6789); }
    vec2  hash2(float n){ return vec2(hash(n * 1.7), hash(n * 3.1)); }

    vec2 aspectify(vec2 p, float ar) { return vec2(p.x * ar, p.y); }
    vec2 superWarp(vec2 p, float n) { return sign(p) * pow(abs(p), vec2(n)); }

    vec2 orbit(float i, float t) {
      vec2 amp = mix(vec2(0.12, 0.10), vec2(0.28, 0.24), hash2(10.0 + i));
      float spd = mix(0.12, 0.35, hash(20.0 + i));
      float ph  = 6.28318 * hash(30.0 + i);
      return vec2(
        0.5 + amp.x * cos(t * spd + ph),
        0.5 + amp.y * sin(t * spd * 0.85 + ph * 0.9)
      );
    }

    float blobField(vec2 uv, vec2 c, vec2 sc, float t, float seed) {
      float breathe = 1.0 + 0.08 * sin(t * 0.8 + seed * 5.0);
      vec2  s = sc * breathe;
      vec2  d = (uv - c) / s;
      float q = dot(d, d);
      return exp(-q * SHARP);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      float ar = u_res.x / u_res.y;
      uv = aspectify(uv, ar);

      float t = u_time;

      vec2 c0 = orbit(0.0, t); c0 = aspectify(c0, ar);
      vec2 c1 = orbit(1.0, t); c1 = aspectify(c1, ar);
      vec2 c2 = orbit(2.0, t); c2 = aspectify(c2, ar);
      vec2 c3 = orbit(3.0, t); c3 = aspectify(c3, ar);
      vec2 c4 = orbit(4.0, t); c4 = aspectify(c4, ar);
      vec2 c5 = orbit(5.0, t); c5 = aspectify(c5, ar);

      vec2 s0 = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0 + 0.0));
      vec2 s1 = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0 + 1.0));
      vec2 s2 = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0 + 2.0));
      vec2 s3 = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0 + 3.0));
      vec2 s4 = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0 + 4.0));
      vec2 s5 = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0 + 5.0));

      float n0 = mix(1.05, 1.35, hash(50.0 + 0.0));
      float n1 = mix(1.05, 1.35, hash(50.0 + 1.0));
      float n2 = mix(1.05, 1.35, hash(50.0 + 2.0));
      float n3 = mix(1.05, 1.35, hash(50.0 + 3.0));
      float n4 = mix(1.05, 1.35, hash(50.0 + 4.0));
      float n5 = mix(1.05, 1.35, hash(50.0 + 5.0));

      float f0 = blobField(superWarp(uv - c0, n0) + c0, c0, s0, t, 0.0);
      float f1 = blobField(superWarp(uv - c1, n1) + c1, c1, s1, t, 1.0);
      float f2 = blobField(superWarp(uv - c2, n2) + c2, c2, s2, t, 2.0);
      float f3 = blobField(superWarp(uv - c3, n3) + c3, c3, s3, t, 3.0);
      float f4 = blobField(superWarp(uv - c4, n4) + c4, c4, s4, t, 4.0);
      float f5 = blobField(superWarp(uv - c5, n5) + c5, c5, s5, t, 5.0);

      float m01 = max(f0, f1);
      float m23 = max(f2, f3);
      float m45 = max(f4, f5);
      float fBest = max(max(m01, m23), m45);

      float win0 = step(f1, f0) * step(f2, f0) * step(f3, f0) * step(f4, f0) * step(f5, f0);
      float win1 = step(f0, f1) * step(f2, f1) * step(f3, f1) * step(f4, f1) * step(f5, f1);
      float win2 = step(f0, f2) * step(f1, f2) * step(f3, f2) * step(f4, f2) * step(f5, f2);
      float win3 = step(f0, f3) * step(f1, f3) * step(f2, f3) * step(f4, f3) * step(f5, f3);
      float win4 = step(f0, f4) * step(f1, f4) * step(f2, f4) * step(f3, f4) * step(f5, f4);
      float win5 = step(f0, f5) * step(f1, f5) * step(f2, f5) * step(f3, f5) * step(f4, f5);

      float alpha = smoothstep((THRESH - EDGE), (THRESH + EDGE), fBest);

      vec3 col =
          u_cols[0].rgb * win0 +
          u_cols[1].rgb * win1 +
          u_cols[2].rgb * win2 +
          u_cols[3].rgb * win3 +
          u_cols[4].rgb * win4 +
          u_cols[5].rgb * win5;

      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  function hexToRGBA(hex) {
    hex = (hex && hex[0] === '#') ? hex.slice(1) : (hex || '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0,2) || 'ff', 16) / 255;
    const g = parseInt(hex.slice(2,4) || 'ff', 16) / 255;
    const b = parseInt(hex.slice(4,6) || 'ff', 16) / 255;
    return [r, g, b, 1];
  }

  function createPaintBackground(host) {
    // Ensure positioned container so the canvas can be absolutely positioned inside
    const cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    host.style.contain = host.style.contain || 'layout paint size'; // small perf win

    // Canvas (behind content)
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'display:block',
      'background:transparent',
      'pointer-events:none',
      'z-index:0'
    ].join(';');
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    // WebGL
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) { console.warn('WebGL not available for paint blobs on', host); return; }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const locA = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(locA);
    gl.vertexAttribPointer(locA, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uRes  = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uCols = gl.getUniformLocation(prog, 'u_cols');

    // Colors: read CSS vars from the host (so each element can override)
    const css = (el, v) => getComputedStyle(el).getPropertyValue(v).trim();
    const cols = [
      css(host, '--g1') || css(document.documentElement, '--g1') || '#8b5cf6',
      css(host, '--g2') || css(document.documentElement, '--g2') || '#06b6d4',
      css(host, '--g3') || css(document.documentElement, '--g3') || '#22c55e',
      css(host, '--g4') || css(document.documentElement, '--g4') || '#f59e0b',
      '#ec4899',
      '#3b82f6'
    ].map(hexToRGBA);

    const flat = new Float32Array(4 * 6);
    for (let i = 0; i < 6; i++) {
      flat[i*4+0] = cols[i][0];
      flat[i*4+1] = cols[i][1];
      flat[i*4+2] = cols[i][2];
      flat[i*4+3] = 1.0;
    }
    gl.uniform4fv(uCols, flat);

    // Resize to element (not just window)
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = Math.min(devicePixelRatio || 1, 2);

    function resize(w, h) {
      const W = Math.max(1, Math.floor(w * dpr));
      const H = Math.max(1, Math.floor(h * dpr));
      if (canvas.width === W && canvas.height === H) return;
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(uRes, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const box = entry.contentBoxSize?.[0] || entry.contentRect;
        const w = box.inlineSize || entry.contentRect.width;
        const h = box.blockSize  || entry.contentRect.height;
        resize(w, h);
      }
    });
    ro.observe(host);

    // Also react to DPR changes (zoom, moving between monitors)
    const mq = matchMedia(`(resolution: ${Math.round(dpr*96)}dpi)`);
    mq.addEventListener?.('change', () => { dpr = Math.min(devicePixelRatio || 1, 2); ro.observe(host); });

    // Animate
    const t0 = performance.now();
    let raf = 0;
    function tick(now) {
      const t = prefersReduced ? 0.0 : (now - t0) * 0.001;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!prefersReduced) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // Cleanup handle so you can remove the element and not leak
    host._paintBlobsDestroy = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }

  // Initialize on DOM ready (defer/script end is usually enough)
  function initAll() {
    document.querySelectorAll(SELECTOR).forEach(el => {
      if (el._paintBlobsInit) return;
      el._paintBlobsInit = true;
      createPaintBackground(el);
    });
  }

  // Auto-init existing nodes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }

  // Auto-init future nodes with the selector (e.g., when you add sections dynamically)
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach(n => {
        if (!(n instanceof Element)) return;
        if (n.matches && n.matches(SELECTOR)) createPaintBackground(n);
        n.querySelectorAll?.(SELECTOR).forEach(createPaintBackground);
      });
      m.removedNodes && m.removedNodes.forEach(n => {
        if (n instanceof Element && n._paintBlobsDestroy) n._paintBlobsDestroy();
        n.querySelectorAll?.(SELECTOR).forEach(el => el._paintBlobsDestroy && el._paintBlobsDestroy());
      });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
