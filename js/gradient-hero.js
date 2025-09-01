// js/gradient-hero.js — "Thick Paint" blobs (solid, crisp, GPU, no black base)
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
    void main(){ gl_Position = vec4(a, 0.0, 1.0); }
  `;

  // Fragment: hard-thresholded fields => flat-color blobs (no gradient), crisp edges
  const frag = `
    precision mediump float;

    uniform vec2  u_res;
    uniform float u_time;
    uniform vec4  u_cols[6];

    // Number of blobs
    const int N = 6;

    // Hardness / thresholding
    const float SHARP  = 10.0;      // field sharpness; higher = tighter blobs
    const float THRESH = 0.55;      // field threshold for "solid paint"
    const float EDGE   = 0.012;     // edge softening band (small for crisp look)

    // Tiny hash helpers to seed per-blob params
    float hash(float n) { return fract(sin(n*43758.5453123)*12345.6789); }
    vec2  hash2(float n){ return vec2(hash(n*1.7), hash(n*3.1)); }

    // Orbiting center in normalized space (corrected for aspect)
    vec2 orbit(float i, float t) {
      vec2 amp = mix(vec2(0.12, 0.10), vec2(0.28, 0.24), hash2(10.0+i));
      float spd = mix(0.12, 0.35, hash(20.0+i));
      float ph  = 6.28318 * hash(30.0+i);
      return vec2(
        0.5 + amp.x * cos(t*spd + ph),
        0.5 + amp.y * sin(t*spd*0.85 + ph*0.9)
      );
    }

    // Elliptical field (no gradient fill — used only to decide inside/outside & dominance)
    float blobField(vec2 uv, vec2 center, vec2 scale, float t, float seed) {
      // gentle radius breathing + anisotropy
      float breathe = 1.0 + 0.08 * sin(t*0.8 + seed*5.0);
      vec2  s = scale * breathe;
      vec2  d = (uv - center) / s;
      // sharper-than-Gaussian falloff
      float q = dot(d, d);
      return exp(-q * SHARP);
    }

    // Slight superellipse warp for more organic "paint" shapes
    vec2 superWarp(vec2 p, float n) {
      return sign(p) * pow(abs(p), vec2(n));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;     // [0..1]
      // keep circles round
      float ar = u_res.x / u_res.y;
      uv.x *= ar;

      float t = u_time;

      // Compute fields & keep top-2 for crisp boundaries
      float fBest = 0.0;
      float fSecond = 0.0;
      int   iBest = -1;

      // Precompute centers & scales
      for (int i=0; i<N; i++) {
        float fi = float(i);
        vec2  c  = orbit(fi, t);
        c.x *= ar;                 // match aspect transform

        // per-blob anisotropy & scale
        vec2 sc  = mix(vec2(0.30, 0.26), vec2(0.46, 0.40), hash2(40.0+fi));
        // mild superellipse warp
        vec2 wuv = superWarp(uv - c, mix(1.05, 1.35, hash(50.0+fi)));
        float f  = blobField(wuv + c, c, sc, t, fi);

        // track top2 fields
        if (f > fBest) { fSecond = fBest; fBest = f; iBest = i; }
        else if (f > fSecond) { fSecond = f; }
      }

      // Hard mask (flat paint), but use a tiny smooth band for anti-aliasing
      float alpha = smoothstep(THRESH - EDGE, THRESH + EDGE, fBest);

      // Color = selected blob's flat color
      vec3 col = (iBest >= 0) ? u_cols[iBest].rgb : vec3(0.0);

      // Razor-thin edge accent where two fields compete => defined "paint edge"
      float edgeMix = smoothstep(0.0, EDGE*1.5, abs(fBest - fSecond));
      edgeMix = 1.0 - edgeMix; // high near boundaries
      col = mix(col * 0.85, col, 1.0 - 0.6*edgeMix);

      // Transparent outside blobs; premultiplied alpha inside
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPLETE_STATUS ?? gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  // fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const locA = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(locA);
  gl.vertexAttribPointer(locA, 2, gl.FLOAT, false, 0, 0);

  // uniforms
  const uRes  = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uCols = gl.getUniformLocation(prog, 'u_cols');

  // pull colors from CSS (add two high-pop extras)
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function hexToRGBA(hex) {
    hex = (hex && hex[0]==='#') ? hex.slice(1) : (hex || '');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.slice(0,2)||'ff',16)/255;
    const g = parseInt(hex.slice(2,4)||'ff',16)/255;
    const b = parseInt(hex.slice(4,6)||'ff',16)/255;
    return [r,g,b,1];
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
  for (let i=0;i<6;i++){
    flat[i*4+0]=cols[i][0];
    flat[i*4+1]=cols[i][1];
    flat[i*4+2]=cols[i][2];
    flat[i*4+3]=1.0;
  }
  gl.uniform4fv(uCols, flat);

  // DPR + resize
  function resize() {
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, host.clientWidth|0);
    const h = Math.max(1, host.clientHeight|0);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.clearColor(0,0,0,0); // fully transparent
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  addEventListener('resize', resize, { passive:true });
  resize();

  // animate
  let t0 = performance.now();
  function tick(now){
    const t = prefersReduced ? 0 : (now - t0) * 0.001;
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
