// js/gradient-hero.js  — WebGL metaball blobs (fast, bright, no black base)
(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.querySelector('.hero-3d');
  if (!host) return;

  // Build canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;background:transparent;pointer-events:none;';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  // WebGL init
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false
  });
  if (!gl) return;

  // Fullscreen triangle (1 draw call)
  const vsrc = `
  attribute vec2 a;
  void main(){ gl_Position = vec4(a, 0.0, 1.0); }
  `;

  // Fragment: metaball-style solid blobs with smooth edges, transparent outside
  const fsrc = `
  precision mediump float;

  uniform vec2  u_res;
  uniform float u_time;
  uniform vec4  u_cols[5];

  // Control “hardness” & edge softness
  const float THRESH = 0.55;
  const float EDGE   = 0.12; // smaller = crisper edge

  // Orbit params for up to 5 blobs (speeds, phases, amps, radii)
  vec2 orbit(float t, float sx, float sy, float speed, float phase) {
    return vec2(0.5 + sx * cos(t * speed + phase),
                0.5 + sy * sin(t * speed * 0.85 + phase * 0.9));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;        // [0..1]
    // Correct aspect so circles stay round
    uv.x *= u_res.x / u_res.y;

    float t = u_time;

    // Blob centers (screen-space [0..1] but with aspect corrected X)
    vec2 c0 = orbit(t, 0.26, 0.18, 0.22, 0.0);
    vec2 c1 = orbit(t, 0.22, 0.24, 0.29, 1.3);
    vec2 c2 = orbit(t, 0.18, 0.20, 0.36, 2.7);
    vec2 c3 = orbit(t, 0.16, 0.14, 0.17, 3.9);
    vec2 c4 = orbit(t, 0.20, 0.16, 0.26, 5.1);

    // Radii (in UV space)
    float r0 = 0.66;
    float r1 = 0.74;
    float r2 = 0.62;
    float r3 = 0.75;
    float r4 = 0.70;

    // Field contributions (Gaussian-ish)
    float w0 = exp(-dot(uv - c0, uv - c0) / (r0*r0));
    float w1 = exp(-dot(uv - c1, uv - c1) / (r1*r1));
    float w2 = exp(-dot(uv - c2, uv - c2) / (r2*r2));
    float w3 = exp(-dot(uv - c3, uv - c3) / (r3*r3));
    float w4 = exp(-dot(uv - c4, uv - c4) / (r4*r4));

    float sumW = w0 + w1 + w2 + w3 + w4;

    // Solid mask with crisp edge (smoothstep to avoid jaggies)
    float alpha = smoothstep(THRESH - EDGE, THRESH + EDGE, sumW);

    // Color mix by normalized weights (keeps colors bright when overlapping)
    vec3 col = vec3(0.0);
    if (sumW > 1e-5) {
      w0 /= sumW; w1 /= sumW; w2 /= sumW; w3 /= sumW; w4 /= sumW;
      col =
        u_cols[0].rgb * w0 +
        u_cols[1].rgb * w1 +
        u_cols[2].rgb * w2 +
        u_cols[3].rgb * w3 +
        u_cols[4].rgb * w4;
    }

    // Punch it a bit
    col = pow(col, vec3(0.9)); // slight gamma for vibrance

    // Premultiplied alpha output (canvas does final composite)
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

  const vs = compile(gl.VERTEX_SHADER, vsrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  // Fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  3, -1,  -1,  3
  ]), gl.STATIC_DRAW);
  const locA = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(locA);
  gl.vertexAttribPointer(locA, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uRes  = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uCols = gl.getUniformLocation(prog, 'u_cols');

  // Colors: pull from CSS vars (bright palette), with fallbacks
  const getVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  function hexToRgb(hex) {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0,2),16)/255;
    const g = parseInt(hex.slice(2,4),16)/255;
    const b = parseInt(hex.slice(4,6),16)/255;
    return [r,g,b,1];
  }

  const cols = [
    getVar('--g1', '#7c3aed'),
    getVar('--g2', '#06b6d4'),
    getVar('--g3', '#22c55e'),
    getVar('--g4', '#f59e0b'),
    '#ef4444'
  ].map(hexToRgb);

  function setColors() {
    const flat = new Float32Array(4 * 5);
    for (let i = 0; i < 5; i++) {
      flat[i*4+0] = cols[i][0];
      flat[i*4+1] = cols[i][1];
      flat[i*4+2] = cols[i][2];
      flat[i*4+3] = 1.0;
    }
    gl.uniform4fv(uCols, flat);
  }
  setColors();

  // Size / DPR
  let DPR = Math.min(window.devicePixelRatio || 1, 1.5); // cap for perf
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(host.clientWidth));
    const h = Math.max(1, Math.floor(host.clientHeight));
    canvas.width  = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); // transparent clear (no black base)
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  let start = performance.now();
  function tick(now) {
    const t = (now - start) * 0.001; // seconds
    gl.uniform1f(uTime, prefersReduced ? 0.0 : t);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
