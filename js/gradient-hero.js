// js/gradient-hero.js — "Thick Paint" blobs (no dynamic uniform indexing)
(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.querySelector('.hero-3d');
  if (!host) return;

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;background:transparent;pointer-events:none;';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  // WebGL
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return;

  // Fullscreen triangle
  const vert = `
    attribute vec2 a;
    void main() { gl_Position = vec4(a, 0.0, 1.0); }
  `;

  // Fragment shader:
  // - 6 blobs
  // - flat color per blob (paint look)
  // - crisp edge via threshold + tiny AA band
  // - color chosen with winner-takes-all masks (no dynamic array indexing)
  const frag = `
    precision mediump float;

    uniform vec2  u_res;
    uniform float u_time;
    uniform vec4  u_cols[6];

    // Tunables
    const float SHARP  = 12.0;   // field sharpness (larger = tighter blobs)
    const float THRESH = 0.55;   // on/off threshold
    const float EDGE   = 0.010;  // tiny AA band (smaller = crisper)

    // Small hash helpers (deterministic per-blob)
    float hash(float n) { return fract(sin(n * 43758.5453123) * 12345.6789); }
    vec2  hash2(float n){ return vec2(hash(n * 1.7), hash(n * 3.1)); }

    // Keep circles round with aspect correction applied to x
    vec2 aspectify(vec2 p, float ar) { return vec2(p.x * ar, p.y); }

    // Superellipse warp (n ~ 1..1.4) for paint-like shapes
    vec2 superWarp(vec2 p, float n) { return sign(p) * pow(abs(p), vec2(n)); }

    // Orbiting centers
    vec2 orbit(float i, float t) {
      vec2 amp = mix(vec2(0.12, 0.10), vec2(0.28, 0.24), hash2(10.0 + i));
      float spd = mix(0.12, 0.35, hash(20.0 + i));
      float ph  = 6.28318 * hash(30.0 + i);
      return vec2(
        0.5 + amp.x * cos(t * spd + ph),
        0.5 + amp.y * sin(t * spd * 0.85 + ph * 0.9)
      );
    }

    // Field (no gradient drawing — just scalar for thresholding)
    float blobField(vec2 uv, vec2 c, vec2 sc, float t, float seed) {
      float breathe = 1.0 + 0.08 * sin(t * 0.8 + seed * 5.0);
      vec2  s = sc * breathe;
      vec2  d = (uv - c) / s;
      float q = dot(d, d);
      return exp(-q * SHARP);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;      // [0..1]
      float ar = u_res.x / u_res.y;
      uv = aspectify(uv, ar);

      float t = u_time;

      // Centers & scales for 6 blobs
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

      // Mild superellipse warp amount per blob
      float n0 = mix(1.05, 1.35, hash(50.0 + 0.0));
      float n1 = mix(1.05, 1.35, hash(50.0 + 1.0));
      float n2 = mix(1.05, 1.35, hash(50.0 + 2.0));
      float n3 = mix(1.05, 1.35, hash(50.0 + 3.0));
      float n4 = mix(1.05, 1.35, hash(50.0 + 4.0));
      float n5 = mix(1.05, 1.35, hash(50.0 + 5.0));

      // Fields
      float f0 = blobField(superWarp(uv - c0, n0) + c0, c0, s0, t, 0.0);
      float f1 = blobField(superWarp(uv - c1, n1) + c1, c1, s1, t, 1.0);
      float f2 = blobField(superWarp(uv - c2, n2) + c2, c2, s2, t, 2.0);
      float f3 = blobField(superWarp(uv - c3, n3) + c3, c3, s3, t, 3.0);
      float f4 = blobField(superWarp(uv - c4, n4) + c4, c4, s4, t, 4.0);
      float f5 = blobField(superWarp(uv - c5, n5) + c5, c5, s5, t, 5.0);

      // Best field (winner)
      float m01 = max(f0, f1);
      float m23 = max(f2, f3);
      float m45 = max(f4, f5);
      float fBest = max(max(m01, m23), m45);

      // Winner masks (no dynamic indexing)
      float win0 = step(f1, f0) * step(f2, f0) * step(f3, f0) * step(f4, f0) * step(f5, f0);
      float win1 = step(f0, f1) * step(f2, f1) * step(f3, f1) * step(f4, f1) * step(f5, f1);
      float win2 = step(f0, f2) * step(f1, f2) * step(f3, f2) * step(f4, f2) * step(f5, f2);
      float win3 = step(f0, f3) * step(f1, f3) * step(f2, f3) * step(f4, f3) * step(f5, f3);
      float win4 = step(f0, f4) * step(f1, f4) * step(f2, f4) * step(f3, f4) * step(f5, f4);
      float win5 = step(f0, f5) * step(f1, f5) * step(f2, f5) * step(f3, f5) * step(f4, f5);

      // Alpha via threshold on the best field (flat paint with tiny AA)
      float alpha = smoothstep(THRESH - EDGE, THRESH + EDGE, fBest);

      // Flat color from winner (premultiplied at the end)
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

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
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

  // Colors from CSS with two punchy extras
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function hexToRGBA(hex) {
    hex = (hex && hex[0] === '#') ? hex.slice(1) : (hex || '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0,2) || 'ff', 16) / 255;
    const g = parseInt(hex.slice(2,4) || 'ff', 16) / 255;
    const b = parseInt(hex.slice(4,6) || 'ff', 16) / 255;
    return [r, g, b, 1];
  }

  const cols = [
    css('--g1') || '#8b5cf6',
    css('--g2') || '#06b6d4',
    css('--g3') || '#22c55e',
    css('--g4') || '#f59e0b',
    '#ec4899', // pink
    '#3b82f6'  // blue
  ].map(hexToRGBA);

  const flat = new Float32Array(4 * 6);
  for (let i = 0; i < 6; i++) {
    flat[i*4+0] = cols[i][0];
    flat[i*4+1] = cols[i][1];
    flat[i*4+2] = cols[i][2];
    flat[i*4+3] = 1.0;
  }
  gl.uniform4fv(uCols, flat);

  // DPR + resize
  function resize() {
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, host.clientWidth | 0);
    const h = Math.max(1, host.clientHeight | 0);
    canvas.width  = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); // fully transparent
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  // Animate
  const t0 = performance.now();
  function tick(now) {
    const t = prefersReduced ? 0.0 : (now - t0) * 0.001;
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
