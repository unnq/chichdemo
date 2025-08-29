// js/hero3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

(() => {
  const container = document.querySelector('.hero-3d');
  const hero = document.querySelector('.hero');
  if (!container || !hero) return;

  /** ===== Config ===== */
  const MODEL_URL     = new URL('../assets/logo.glb', import.meta.url).href;
  const CAMERA_Z      = 6;
  const TARGET_SIZE   = 1.8;
  const INITIAL_SPEED = 0.005;
  const HOVER_SPEED   = 0.018;
  const LERP_FACTOR   = 0.08;
  const MAX_DPR       = 1.75;

  // Bloom
  const BASE_BLOOM      = 0.35;
  const HOVER_BLOOM     = 0.65;
  const BLOOM_RADIUS    = 0.6;
  const BLOOM_THRESHOLD = 0.2;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetSpeed = reduceMotion ? 0 : INITIAL_SPEED;
  let currentSpeed = targetSpeed;

  // Scene / camera / renderer
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    premultipliedAlpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  renderer.setClearColor(0x000000, 0); // transparent
  renderer.setClearAlpha(0);
  // Optional color management (three r160+)
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // 🔑 Transparent RGBA render target for the composer (keeps alpha)
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: true,
    stencilBuffer: false
  });

  // Post-processing
  const composer = new EffectComposer(renderer, renderTarget);
  const renderPass = new RenderPass(scene, camera);
  renderPass.clear = true;
  renderPass.clearColor = new THREE.Color(0x000000);
  renderPass.clearAlpha = 0; // 🔑 clear with alpha 0
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), BASE_BLOOM, BLOOM_RADIUS, BLOOM_THRESHOLD);
  composer.addPass(bloomPass);

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2, 3, 4);
  scene.add(dir);

  // Model
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

    // Subtle emissive so bloom has something to catch
    model.traverse(o => {
      if (o.isMesh && o.material && 'emissive' in o.material) {
        o.material.emissive = new THREE.Color(0x8b008b);
        o.material.emissiveIntensity = 0.15;
      }
    });

    fitToFrame(model, TARGET_SIZE);
    scene.add(model);
  }

  // Resize (CSS owns canvas size; sync buffers)
  function onResize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h, false);
    renderTarget.setSize(w, h); // 🔑 keep RT in sync
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  // Raycaster hover (only speed up when over the model)
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
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

  // Touch bump
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

    const bloomTarget = (targetSpeed > INITIAL_SPEED + 1e-4) ? HOVER_BLOOM : BASE_BLOOM;
    bloomPass.strength += (bloomTarget - bloomPass.strength) * LERP_FACTOR;

    composer.render();
    requestAnimationFrame(animate);
  }

  loadModel().then(() => { onResize(); animate(); });
})();
