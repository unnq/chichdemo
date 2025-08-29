// js/hero3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(() => {
  const container = document.querySelector('.hero-3d');
  const hero = document.querySelector('.hero');
  if (!container || !hero) {
    console.warn('[hero3d] Missing .hero-3d or .hero. Add <div class="hero-3d"> inside your .hero.');
    return;
  }

  /** ===== Config ===== */
  const MODEL_URL    = null;   // e.g. '/assets/logo.glb' when you have one
  const CAMERA_Z     = 6;
  const INITIAL_SPEED= 0.005;
  const HOVER_SPEED  = 0.018;
  const LERP_FACTOR  = 0.08;   // easing toward target speed
  const MAX_DPR      = 1.75;   // cap for perf

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetSpeed    = reduceMotion ? 0 : INITIAL_SPEED;
  let currentSpeed   = targetSpeed;

  const scene   = new THREE.Scene();
  const camera  = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  container.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2, 3, 4);
  scene.add(dir);

  let model;

  function fitToFrame(object, targetSize = 2.8) {
    // compute pre-scale bounds
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    const scale = targetSize / maxDim;
    object.scale.setScalar(scale);

    // recenter after scale
    const center = new THREE.Vector3();
    box.getCenter(center);
    object.position.sub(center.multiplyScalar(scale));
  }

  async function loadModel() {
    if (!MODEL_URL) {
      // placeholder: magenta icosahedron
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8b008b,
        metalness: 0.1,
        roughness: 0.4,
        transparent: true,
        opacity: 0.75
      });
      model = new THREE.Mesh(geo, mat);
      fitToFrame(model);
      scene.add(model);
      return;
    }
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(MODEL_URL);
    model = gltf.scene || gltf.scenes[0];
    fitToFrame(model);
    scene.add(model);
  }

  function onResize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;

    // Keep CSS size in lockstep with the container
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // Update the drawing buffer size (no need to also update CSS here)
    renderer.setSize(w, h, false);
  }

  function animate() {
    currentSpeed += (targetSpeed - currentSpeed) * LERP_FACTOR;
    if (model && !reduceMotion) model.rotation.y += currentSpeed;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Hover/touch acceleration
  hero.addEventListener('mouseenter', () => { if (!reduceMotion) targetSpeed = HOVER_SPEED; });
  hero.addEventListener('mouseleave', () => { if (!reduceMotion) targetSpeed = INITIAL_SPEED; });
  hero.addEventListener('pointerdown',   () => {
    if (reduceMotion) return;
    targetSpeed = HOVER_SPEED;
    setTimeout(() => { targetSpeed = INITIAL_SPEED; }, 1200);
  });

  // Resize handling
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  loadModel().then(() => { onResize(); animate(); });
})();
