// js/hero3d.js
// Requires an import map for "three" and "three/addons/" in index.html,
// OR switch the two imports below to esm.sh URLs (see note at bottom).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(() => {
  const container = document.querySelector('.hero-3d');
  const hero = document.querySelector('.hero');
  if (!container || !hero) return;

  /** Config (tweak as needed) */
  const MODEL_URL     = new URL('../assets/logo.glb', import.meta.url).href;
  const CAMERA_Z      = 6;
  const TARGET_SIZE   = 1.8;   // overall model size (lower => smaller)
  const INITIAL_SPEED = 0.005;
  const HOVER_SPEED   = 0.018;
  const LERP_FACTOR   = 0.08;  // easing toward target speed
  const MAX_DPR       = 1.75;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetSpeed = reduceMotion ? 0 : INITIAL_SPEED;
  let currentSpeed = targetSpeed;

  // Scene / camera / renderer (transparent)
  const scene = new THREE.Scene();
  scene.background = null; // no background

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  // Transparent clear; safe with no post-processing:
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // Simple lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2, 3, 4);
  scene.add(dir);

  // Model
  let model;

  function fitToFrame(object, targetSize = TARGET_SIZE) {
    const pre = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    pre.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    const scale = targetSize / maxDim;
    object.scale.setScalar(scale);

    // recenter to origin after scale
    const center = new THREE.Vector3();
    pre.getCenter(center);
    object.position.sub(center.multiplyScalar(scale));
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

  // Resize (CSS controls canvas size; we sync buffers)
  function onResize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  // Raycaster hover: speed up only when pointer is over the model
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2); // start outside (-1..1)
  let pointerInside = false;

  function updatePointer(e) {
    const rect = container.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    pointerInside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;
  }

  hero.addEventListener('pointermove', updatePointer);
  hero.addEventListener('pointerleave', () => { pointerInside = false; });

  // Touch “bump”
  hero.addEventListener('pointerdown', () => {
    if (reduceMotion) return;
    targetSpeed = HOVER_SPEED;
    setTimeout(() => { targetSpeed = INITIAL_SPEED; }, 1200);
  });

  // Loop
  function animate() {
    if (!reduceMotion && model && pointerInside) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(model, true).length > 0;
      targetSpeed = hit ? HOVER_SPEED : INITIAL_SPEED;
    } else {
      targetSpeed = reduceMotion ? 0 : INITIAL_SPEED;
    }

    currentSpeed += (targetSpeed - currentSpeed) * LERP_FACTOR;
    if (model && !reduceMotion) model.rotation.y += currentSpeed;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  loadModel().then(() => { onResize(); animate(); });
})();
