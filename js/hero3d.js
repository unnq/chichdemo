// js/hero3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(() => {
  const container = document.querySelector('.hero-3d');
  const hero = document.querySelector('.hero');
  if (!container || !hero) return;

  /** ===== Config (tweak these) ===== */
  const MODEL_URLS = [
  new URL('../assets/logo.glb', import.meta.url).href,
  new URL('../assets/s_letter.glb', import.meta.url).href,
    ];
  const CAMERA_Z     = 6;
  const TARGET_SIZE  = 1.4;   // smaller than before; both models are fit to this size
  const GAP_UNITS    = 0.8;   // space between the two models (world units)
  const INITIAL_SPEED= 0.005;
  const HOVER_SPEED  = 0.018;
  const LERP_FACTOR  = 0.08;
  const MAX_DPR      = 1.75;

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

  /** Utilities */
  function fitToFrame(object, targetSize = TARGET_SIZE) {
    const pre = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    pre.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;
    object.scale.setScalar(scale);

    const center = new THREE.Vector3();
    pre.getCenter(center);
    object.position.sub(center.multiplyScalar(scale)); // recenter to origin
  }

  function widthOf(object3D) {
    const box = new THREE.Box3().setFromObject(object3D);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size.x || TARGET_SIZE;
  }

  const loader = new GLTFLoader();
  async function loadOne(url) {
    if (!url) return null;
    try {
      const gltf = await loader.loadAsync(url);
      return gltf.scene || gltf.scenes?.[0] || null;
    } catch (e) {
      console.warn('[hero3d] failed to load', url, e);
      return null;
    }
  }

  async function loadModelsOrFallback() {
    const models = (await Promise.all(MODEL_URLS.map(loadOne))).filter(Boolean);
    if (models.length >= 2) return models;

    // Fallback placeholders if any failed
    const make = (color) => new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.4, transparent: true, opacity: 0.75 })
    );
    return [make(0x8b008b), make(0xffffff)];
  }

  let pairGroup; // parent for both models

  async function init() {
    const models = await loadModelsOrFallback();
    // Fit and add
    models.forEach(m => fitToFrame(m, TARGET_SIZE));

    // Compute widths to place them nicely with a fixed gap
    const w1 = widthOf(models[0]);
    const w2 = widthOf(models[1]);
    const total = w1 + w2 + GAP_UNITS;

    const leftX  = -total / 2 + w1 / 2;
    const rightX =  total / 2 - w2 / 2;

    models[0].position.x = leftX;
    models[1].position.x = rightX;

    pairGroup = new THREE.Group();
    pairGroup.add(models[0], models[1]);
    scene.add(pairGroup);
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
    if (pairGroup && !reduceMotion) {
      // Spin both
      pairGroup.children.forEach(obj => { obj.rotation.y += currentSpeed; });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Hover/touch accel on the hero region
  hero.addEventListener('mouseenter', () => { if (!reduceMotion) targetSpeed = HOVER_SPEED; });
  hero.addEventListener('mouseleave', () => { if (!reduceMotion) targetSpeed = INITIAL_SPEED; });
  hero.addEventListener('pointerdown',   () => {
    if (reduceMotion) return;
    targetSpeed = HOVER_SPEED;
    setTimeout(() => { targetSpeed = INITIAL_SPEED; }, 1200);
  });

  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  init().then(() => { onResize(); animate(); });
})();
