// Single-model version
// Requires an import map in index.html that maps "three" and "three/addons/".
// (If you don't want an import map, see note at the bottom.)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(() => {
  const container = document.querySelector('.hero-3d');
  const hero = document.querySelector('.hero');
  if (!container || !hero) {
    console.warn('[hero3d] Missing .hero-3d or .hero.');
    return;
  }

  /** ===== Config (tweak as needed) ===== */
  const MODEL_URL     = new URL('../assets/logo.glb', import.meta.url).href;
  const CAMERA_Z      = 6;
  const TARGET_SIZE   = 1.8;   // overall model size (lower = smaller)
  const INITIAL_SPEED = 0.005;
  const HOVER_SPEED   = 0.018;
  const LERP_FACTOR   = 0.08;
  const MAX_DPR       = 1.75;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetSpeed    = reduceMotion ? 0 : INITIAL_SPEED;
  let currentSpeed   = targetSpeed;

  // Scene setup
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
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

  function fitToFrame(object, targetSize = TARGET_SIZE) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;
    object.scale.setScalar(scale);

    const center = new THREE.Vector3();
    box.getCenter(center);
    object.position.sub(center.multiplyScalar(scale)); // recenter to origin
  }

  async function loadModel() {
    try {
      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      model = gltf.scene || gltf.scenes?.[0];
    } catch (e) {
      console.warn('[hero3d] failed to load model, using placeholder', e);
      model = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({
          color: 0x8b008b, metalness: 0.1, roughness: 0.4, transparent: true, opacity: 0.75
        })
      );
    }
    fitToFrame(model, TARGET_SIZE);
    scene.add(model);
  }

  function onResize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); // CSS controls canvas size
  }

  function animate() {
    currentSpeed += (targetSpeed - currentSpeed) * LERP_FACTOR;
    if (model && !reduceMotion) model.rotation.y += currentSpeed;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Hover/touch speed-up on the hero region
  hero.addEventListener('mouseenter', () => { if (!reduceMotion) targetSpeed = HOVER_SPEED; });
  hero.addEventListener('mouseleave', () => { if (!reduceMotion) targetSpeed = INITIAL_SPEED; });
  hero.addEventListener('pointerdown',   () => {
    if (reduceMotion) return;
    targetSpeed = HOVER_SPEED;
    setTimeout(() => { targetSpeed = INITIAL_SPEED; }, 1200);
  });

  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  loadModel().then(() => { onResize(); animate(); });
})();
