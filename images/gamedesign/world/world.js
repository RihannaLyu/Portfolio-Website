/* ═══════════════════════════════════════════════════════════
   WALKABLE WORLDS — Rihanna's Unity scenes, walkable in a browser (shared by every world).
   Each world folder (dragondoor/, masterbedroom/) has an index.html that loads this, plus:
     world.glb  : every model in the Unity scene, placed exactly as in Unity (exported by SceneDump.cs)
     world.json : materials, sun, sky, the start spot, and how to walk there:
                  kind "outdoor" | "indoor", eye (eye height), step (how high a step you climb, × eye),
                  speed, exposure
   Drag to look · WASD / arrows (Shift runs) or the joystick to walk · tap a spot to glide there.
   Walls and tall furniture stop you; low steps you climb.
   Dragon Door extras (only when the scene has them): the "Dawn Water" pond, flickering lanterns,
   drifting koi, bobbing lilies, the hovering dragon.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const $ = (id) => document.getElementById(id);
const touch = matchMedia('(pointer: coarse)').matches;
if (touch) document.body.classList.add('touch');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── renderer, scene, camera ── */
const canvas = $('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, touch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 6000);
camera.rotation.order = 'YXZ';
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const lin = (c) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);

/* ── load ── */
const bar = $('ddBar'), loadText = $('ddLoadText');
const world = await (await fetch('world.json?v=' + (document.body.dataset.v || '1'))).json();
const INDOOR = world.kind === 'indoor';
if (world.exposure) renderer.toneMappingExposure = world.exposure;

const texLoader = new THREE.TextureLoader();
const texCache = new Map();
function tex(path, srgb, tiling) {
  if (!path) return null;
  const key = path + (tiling ? tiling.join(',') : '');
  if (!texCache.has(key)) {
    const t = texLoader.load(path);
    t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (tiling) t.repeat.set(tiling[0], tiling[1]);
    texCache.set(key, t);
  }
  return texCache.get(key);
}

const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('world.glb?v=' + (document.body.dataset.v || '1'), (e) => {
  const total = e.total || world.bytes;
  if (total) { const p = Math.min(100, Math.round((e.loaded / total) * 100)); bar.style.width = p + '%'; }
});
loadText.textContent = world.lightingText || 'lighting the lanterns…';
const root = gltf.scene;
scene.add(root);

/* ── sky, sun, fog: a dawn/dusk like the Unity scene ── */
const sunDir = new THREE.Vector3(...world.sun.toward).normalize();
sunDir.y = Math.max(sunDir.y, 0.05); sunDir.normalize();                 // keep the sun just above the horizon
const sky = new Sky(); sky.scale.setScalar(5000);
if (INDOOR) {                                                              // indoors: a soft daylight gradient behind the windows
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#9fbbd8'); gr.addColorStop(0.55, '#e9eef2'); gr.addColorStop(1, '#f3e7da');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const bg = new THREE.CanvasTexture(c); bg.colorSpace = THREE.SRGBColorSpace; bg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bg;
} else scene.add(sky);
Object.assign(sky.material.uniforms.turbidity, { value: 6 });
sky.material.uniforms.rayleigh.value = 2.2;
sky.material.uniforms.mieCoefficient.value = 0.006;
sky.material.uniforms.mieDirectionalG.value = 0.86;
sky.material.uniforms.sunPosition.value.copy(sunDir);
if (!INDOOR) scene.fog = new THREE.Fog(new THREE.Color(0xd98a5c), 90, 620);

const sunColor = lin(world.sun.color).lerp(new THREE.Color(1, 0.86, 0.66), 0.35);
const sun = new THREE.DirectionalLight(sunColor, INDOOR ? 1.4 : 2.6);
sun.position.copy(sunDir).multiplyScalar(300);
scene.add(sun, sun.target);
const hemi = INDOOR
  ? new THREE.HemisphereLight(0xfff3e6, 0x6b5a50, 0.9)
  : new THREE.HemisphereLight(lin(world.ambient.sky).lerp(new THREE.Color(1, 0.9, 0.8), 0.45), lin(world.ambient.ground), 1.45);
scene.add(hemi);
if (INDOOR) {
  // a soft studio room for reflections and fill (Unity had baked lighting + reflection probes here)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  (world.lights || []).forEach((l) => {                                  // the room's lamps
    const p = new THREE.PointLight(lin(l.color), l.intensity ?? 1.2, l.distance ?? 0, 1.2);
    p.position.set(...l.position); scene.add(p);
  });
}

/* ── materials from world.json ── */
let waterY = null;
const walk = [], koi = [], lilies = [], dragonParts = [];
root.traverse((o) => {
  if (!o.isMesh) return;
  const mats = [].concat(o.material).map((m) => {
    const cfg = world.materials[m.name];
    if (!cfg) return m;
    if (cfg.water) return m;                                               // replaced below
    const mat = new THREE.MeshStandardMaterial({
      color: lin(cfg.color), map: tex(cfg.map, true, cfg.tiling), metalness: Math.min(cfg.metalness, 0.3),
      roughness: Math.max(0.35, cfg.roughness), emissive: lin(cfg.emissive), emissiveMap: tex(cfg.emissiveMap, true),
      transparent: cfg.transparent && cfg.opacity < 0.99, opacity: cfg.opacity, alphaTest: cfg.cutout ? 0.5 : 0,
      side: cfg.transparent || cfg.cutout ? THREE.DoubleSide : THREE.FrontSide,
      envMapIntensity: world.envIntensity ?? 0.8,
    });
    mat.name = m.name;
    return mat;
  });
  o.material = Array.isArray(o.material) ? mats : mats[0];
  const isWater = [].concat(o.material).some((m) => world.materials[m.name]?.water);
  if (isWater) { o.updateWorldMatrix(true, false); waterY = new THREE.Box3().setFromObject(o).max.y; o.visible = false; return; }
  const n = o.name || '';
  if (/^node_id39|goldfish/i.test(n)) koi.push(o);
  else if (/waterlily|^leaf/i.test(n)) { lilies.push(o); if (/^leaf/i.test(n)) walk.push(o); }   // only the stepping-stone leaves are floors; pads would bob you up and down
  else if (/^(head|body|eyes|whisker)(pm)?$/i.test(n.replace(/[._ ]/g, '')) || /^Leg_?(BL|BR|FL|FR)/i.test(n)) dragonParts.push(o);
  else if (!/tree|lantern|bamboo/i.test(n)) walk.push(o);                 // trees and lanterns: not floors
});
walk.forEach((o) => o.geometry.computeBoundsTree());

/* ── the pond: Dawn Water, for the web (only in a scene that has water) ── */
const HAS_WATER = waterY !== null;
if (!HAS_WATER) waterY = -Infinity;
const waterMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, fog: true,
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uSun: { value: sunDir }, uSunColor: { value: new THREE.Color(1, 0.72, 0.38) },
    uDeep: { value: new THREE.Color(0.05, 0.20, 0.26) }, uShallow: { value: new THREE.Color(0.16, 0.42, 0.44) },
    uHorizon: { value: new THREE.Color(0.98, 0.70, 0.55) }, uSkyTop: { value: new THREE.Color(0.45, 0.58, 0.78) },
  }]),
  vertexShader: /* glsl */`
    varying vec3 vWorld;
    #include <fog_pars_vertex>
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz;
      vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime; uniform vec3 uSun, uSunColor, uDeep, uShallow, uHorizon, uSkyTop;
    varying vec3 vWorld;
    #include <fog_pars_fragment>
    vec2 wave(vec2 p, vec2 d, float k, float s) { float ph = dot(p, d) * k + uTime * s; return d * cos(ph) * k; }
    void main() {
      vec2 p = vWorld.xz;
      float dist = length(cameraPosition - vWorld);
      float near = 1.0 - smoothstep(40.0, 260.0, dist);                // small ripples fade with distance (no shimmer)
      vec2 g = wave(p, normalize(vec2(1.0, 0.3)), 1.0 / 3.5, 0.6) * 0.45
             + wave(p, normalize(vec2(-0.4, 1.0)), 1.0 / 2.4, 0.5) * 0.35
             + (wave(p, normalize(vec2(0.7, -0.8)), 1.0 / 0.9, 1.2) * 0.16
             +  wave(p, normalize(vec2(-0.9, -0.2)), 1.0 / 0.6, 1.5) * 0.12) * near;
      vec3 N = normalize(vec3(-g.x * 0.6, 1.0, -g.y * 0.6));
      vec3 V = normalize(cameraPosition - vWorld);
      float fres = pow(1.0 - max(dot(N, V), 0.0), 3.5);
      vec3 R = reflect(-V, N);
      vec3 skyCol = mix(uHorizon, uSkyTop, smoothstep(0.0, 0.35, R.y));
      vec3 base = mix(uShallow, uDeep, clamp(dist / 160.0, 0.0, 1.0));
      vec3 col = mix(base, skyCol, clamp(fres * 0.95 + 0.06, 0.0, 1.0));
      float glint = pow(max(dot(R, normalize(uSun)), 0.0), 350.0);
      col += uSunColor * glint * 3.0;
      gl_FragColor = vec4(col, mix(0.62, 0.97, fres));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 1, 1).rotateX(-Math.PI / 2), waterMat);
water.position.y = HAS_WATER ? waterY : 0;
water.renderOrder = 2;
if (HAS_WATER) scene.add(water);

/* ── lanterns: soft flame + halo sprites that flicker (the game's LanternPath look) ── */
function glowTex(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(0.25, outer); g.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const coreTex = glowTex('rgba(255,245,220,1)', 'rgba(255,190,110,0.85)');
const haloTex = glowTex('rgba(255,170,90,0.7)', 'rgba(255,120,50,0.25)');
const flames = [];
root.traverse((o) => {
  if (!/^lantern\d+$/i.test(o.name)) return;
  const box = new THREE.Box3().setFromObject(o);
  const p = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y + (box.max.y - box.min.y) * 0.6, (box.min.z + box.max.z) / 2);
  const s = Math.max(0.8, (box.max.y - box.min.y) * 0.3);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: coreTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.8 }));
  core.position.copy(p); halo.position.copy(p); core.scale.setScalar(s); halo.scale.setScalar(s * 5.5);
  core.renderOrder = halo.renderOrder = 3;                                  // glow drawn over the stone, like a lit window
  scene.add(core, halo);
  flames.push({ core, halo, s, seed: Math.random() * 100 });
});

/* ── the dragon: its parts move together, hovering ── */
const dragon = new THREE.Group();
if (dragonParts.length) {
  const box = new THREE.Box3(); dragonParts.forEach((o) => box.expandByObject(o));
  box.getCenter(dragon.position); scene.add(dragon);
  dragonParts.forEach((o) => dragon.attach(o));
}
const dragonHome = dragon.position.clone();

/* ── ambient motion bookkeeping ── */
const bases = new Map();
[...koi, ...lilies].forEach((o, i) => bases.set(o, { p: o.position.clone(), r: o.rotation.clone(), seed: i * 1.37 + Math.random() * 10 }));

/* ── walking ── */
const down = new THREE.Raycaster(); down.firstHitOnly = true;
const ray = new THREE.Raycaster(); ray.firstHitOnly = true;
// The floor under your feet. The ray starts at knee height (not above your head), so roofs, branches,
// hanging roots and lantern tops never count as "ground" — that is what made the camera jump.
// A steep hit (a wall, a trunk) is ignored and the last floor is kept.
const DOWN = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3(), nrm = new THREE.Vector3();
function groundAt(x, z, fromY, loose = false) {
  down.set(from.set(x, fromY, z), DOWN); down.far = 400;
  const hit = down.intersectObjects(walk, false)[0];
  if (!loose && hit && hit.face && Math.abs(nrm.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).y) < 0.55) return null;
  return Math.max(hit ? hit.point.y : -Infinity, waterY);
}
const sp = world.spawn;
const pos = new THREE.Vector3(...sp.position);
// the start spot's floor: searched from a little above it (Dragon Door's VR rig sits just under the pavilion deck)
scene.updateMatrixWorld(true);                                             // objects must be in place before the first floor check
let ground = groundAt(pos.x, pos.z, pos.y + (world.spawnSearch ?? 2), true) ?? waterY;
if (!isFinite(ground)) ground = pos.y - (world.eye || 1.7);
const EYE = world.eye || THREE.MathUtils.clamp(pos.y - ground, 1.6, 8);  // Dragon Door: the VR player is scaled up for the giant world
const STEP = world.step ?? 0.45;                                           // how high a step you climb, as a share of eye height
const SPEED = world.speed ?? 9;
const RADIUS = EYE * 0.14;                                                 // how close you get to a wall

// The floor under you, checked at your feet and four points around them; the highest wins, so the gaps
// between deck planks (or between rugs and tiles) don't drop you for a frame — that was the shake.
const FOOT = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
function floorUnder() {
  let best = -Infinity;
  const fy = eyeY - EYE * (1 - STEP), r = EYE * 0.12;
  for (const [a, b] of FOOT) { const g = groundAt(pos.x + a * r, pos.z + b * r, fy); if (g !== null && isFinite(g)) best = Math.max(best, g); }
  return isFinite(best) ? best : null;
}

// Walls and tall furniture stop you; you slide along them instead of passing through.
const side = new THREE.Raycaster(); side.firstHitOnly = true;
const stepV = new THREE.Vector3(), dirV = new THREE.Vector3(), wallN = new THREE.Vector3();
function wallAhead(dir, L) {
  for (const h of [0.5, 0.85]) {                                           // waist and chest height
    side.set(from.set(pos.x, eyeY - EYE * (1 - h), pos.z), dir); side.far = L + RADIUS;
    const hit = side.intersectObjects(walk, false)[0];
    if (hit && hit.face) {
      wallN.copy(hit.face.normal).transformDirection(hit.object.matrixWorld); wallN.y = 0;
      if (wallN.lengthSq() > 0.01) return wallN.normalize();
    }
  }
  return null;
}
function tryMove(dx, dz) {
  stepV.set(dx, 0, dz);
  for (let k = 0; k < 3; k++) {
    const L = stepV.length(); if (L < 1e-5) return;
    const n = wallAhead(dirV.copy(stepV).divideScalar(L), L);
    if (!n) { pos.x += stepV.x; pos.z += stepV.z; return; }
    if (n.dot(stepV) > 0) n.negate();
    stepV.addScaledVector(n, -stepV.dot(n));                               // keep only the part along the wall
  }
}
let yaw = Math.atan2(-sp.forward[0], -sp.forward[2]), pitch = -0.04;
let eyeY = ground + EYE;
const glide = { on: false, to: new THREE.Vector3() };

const keys = new Set();
addEventListener('keydown', (e) => { keys.add(e.key.toLowerCase()); if (e.key.startsWith('Arrow')) e.preventDefault(); hideHint(); });
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

// drag to look; a quick tap glides to the spot
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; try { canvas.setPointerCapture(e.pointerId); } catch {} });
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const k = touch ? 0.0045 : 0.0032;
  yaw -= (e.clientX - drag.x) * k; pitch -= (e.clientY - drag.y) * k;
  pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.2);
  drag.x = e.clientX; drag.y = e.clientY;
});
canvas.addEventListener('pointerup', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const tap = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 7 && performance.now() - drag.t < 350;
  drag = null;
  if (!tap) { hideHint(); return; }
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera); ray.far = 500;
  const hits = ray.intersectObjects(HAS_WATER ? [...walk, water] : walk, false);
  const h = hits[0];
  if (h) { glide.to.set(h.point.x, 0, h.point.z); glide.on = true; hideHint(); }
});
canvas.addEventListener('pointercancel', () => { drag = null; });

// touch joystick
const stick = { x: 0, y: 0, id: null };
const stickEl = $('ddStick'), knob = $('ddKnob');
function stickMove(e) {
  const r = stickEl.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), max = r.width / 2 - 8;
  if (m > max) { dx *= max / m; dy *= max / m; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`; stick.x = dx / max; stick.y = dy / max;
}
stickEl.addEventListener('pointerdown', (e) => { stick.id = e.pointerId; try { stickEl.setPointerCapture(e.pointerId); } catch {} stickMove(e); hideHint(); });
stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) stickMove(e); });
const stickEnd = () => { stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; };
stickEl.addEventListener('pointerup', stickEnd); stickEl.addEventListener('pointercancel', stickEnd);

/* ── hint + demo video ── */
const hint = $('ddHint');
hint.textContent = touch ? 'drag to look · joystick to walk · tap a spot to go there' : 'drag to look · WASD to walk · click a spot to go there';
let hintTimer = setTimeout(hideHint, 9000);
function hideHint() { clearTimeout(hintTimer); hint.classList.add('gone'); }
const vid = $('ddVideo'), vidEl = $('ddVideoEl');
// Inside the site, the site's own demo player plays it (phones can't play video inside the turned game window);
// opened on its own, it plays here.
const DEMO = document.body.dataset.demo, ISLAND = document.body.dataset.island;
const embedded = window.parent !== window;
$('ddDemo').hidden = !DEMO;
$('ddDemo').addEventListener('click', () => {
  if (embedded) { window.parent.postMessage({ type: 'play-demo', island: ISLAND }, location.origin); return; }
  vidEl.src = DEMO; vid.hidden = false; vidEl.play().catch(() => {});
});
function closeVid() { vidEl.pause(); vid.hidden = true; vidEl.removeAttribute('src'); vidEl.load(); }
$('ddVideoClose').addEventListener('click', closeVid);
vid.addEventListener('click', (e) => { if (e.target === vid) closeVid(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !vid.hidden) closeVid(); });

/* ── frame loop ── */
const clock = new THREE.Clock();
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), move = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

  // walk
  fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); right.set(-fwd.z, 0, fwd.x);
  move.set(0, 0, 0);
  if (keys.has('w') || keys.has('arrowup')) move.add(fwd);
  if (keys.has('s') || keys.has('arrowdown')) move.sub(fwd);
  if (keys.has('d') || keys.has('arrowright')) move.add(right);
  if (keys.has('a') || keys.has('arrowleft')) move.sub(right);
  if (stick.id !== null) move.addScaledVector(fwd, -stick.y).addScaledVector(right, stick.x);
  const speed = keys.has('shift') ? SPEED * 2.4 : SPEED;
  if (move.lengthSq() > 0.0001) {
    glide.on = false;
    if (move.length() > 1) move.normalize();
    tryMove(move.x * speed * dt, move.z * speed * dt);
  } else if (glide.on) {
    const d = new THREE.Vector3(glide.to.x - pos.x, 0, glide.to.z - pos.z); const L = d.length();
    if (L < RADIUS * 1.5) glide.on = false;
    else { const px = pos.x, pz = pos.z; d.normalize().multiplyScalar(Math.min(L, Math.max(SPEED * 0.45, L * 2.2) * dt));
      tryMove(d.x, d.z); if (Math.hypot(pos.x - px, pos.z - pz) < 1e-4) glide.on = false; }   // stopped by a wall
  }
  if (move.lengthSq() > 0.0001 || glide.on) { const g = floorUnder(); if (g !== null) ground = g; }
  eyeY += (ground + EYE - eyeY) * Math.min(1, dt * 5);                     // ease onto steps, no jolts
  camera.position.set(pos.x, eyeY, pos.z);
  camera.rotation.set(pitch, yaw, 0);
  water.position.x = pos.x; water.position.z = pos.z;                       // endless water (WaterFollow)
  waterMat.uniforms.uTime.value = t;

  if (!reduced) {
    // koi: drift, turn a little, sway (KoiPond)
    koi.forEach((o) => { const b = bases.get(o), s = b.seed;
      o.position.set(b.p.x + Math.sin(t * 0.21 + s) * 0.35, b.p.y + Math.sin(t * 0.5 + s) * 0.05, b.p.z + Math.cos(t * 0.17 + s * 1.3) * 0.35);
      o.rotation.set(b.r.x, b.r.y + Math.sin(t * 0.25 + s) * 0.14 + Math.sin(t * 2.2 + s) * 0.05, b.r.z); });
    // lilies: float and rock (LilyPondMotion)
    lilies.forEach((o) => { const b = bases.get(o), s = b.seed;
      o.position.y = b.p.y + Math.sin(t * 0.75 + s) * 0.04;
      o.rotation.set(b.r.x + Math.sin(t * 0.6 + s) * 0.015, b.r.y, b.r.z + Math.cos(t * 0.5 + s) * 0.015); });
    // lanterns flicker (GlowPulse)
    flames.forEach((f) => { const k = 0.85 + Math.sin(t * 9 + f.seed) * 0.06 + Math.sin(t * 23 + f.seed * 2) * 0.04;
      f.core.scale.setScalar(f.s * k); f.halo.material.opacity = 0.6 + (k - 0.85) * 2.5; });
    // the dragon hovers and sways (DragonSwim's idle)
    dragon.position.set(dragonHome.x, dragonHome.y + Math.sin(t * 0.8) * 1.6, dragonHome.z);
    dragon.rotation.set(Math.sin(t * 0.6) * 0.04, Math.sin(t * 0.3) * 0.12, Math.sin(t * 0.7) * 0.05);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
$('ddLoad').classList.add('done');
window.focus();                                                             // WASD works right away inside the site's game window
if (new URLSearchParams(location.search).has('debug')) {                   // ?debug: for checking the walk
  window.__dd = { camera, root, pos, look: (y, p) => { yaw = y; pitch = p; }, eye: () => eyeY, ground: () => ground, EYE, keys,
                  fly: (y) => { eyeY = y; ground = y - EYE; }, groundAt,
                  pick: (x, y) => { ray.setFromCamera(new THREE.Vector2(x, y), camera); ray.far = 1000; const h = ray.intersectObjects(walk, false)[0]; if (!h) return null; const m = [].concat(h.object.material)[h.face.materialIndex ?? 0]; return { mat: m.name, point: h.point.toArray().map(v => +v.toFixed(1)), dist: +h.distance.toFixed(1) }; } };
}
canvas.addEventListener('pointerdown', () => window.focus());