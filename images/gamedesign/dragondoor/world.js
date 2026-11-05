/* ═══════════════════════════════════════════════════════════
   DRAGON DOOR — the VR world, walkable in a browser.
   world.glb  : every model in the Unity scene (02_Pond), placed exactly as in Unity (exported by SceneDump.cs)
   world.json : materials, sun, sky, fog, the VR start spot, lantern spots
   Drag to look · WASD / arrows (Shift runs) or the joystick to walk · tap a spot to glide there.
   The pond: Rihanna's "Dawn Water" shader, re-written for the web (ripples, sky reflection, sun glint).
   Ambient life from the game's scripts: koi drift, lilies bob, lanterns flicker, the dragon hovers.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
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
const world = await (await fetch('world.json')).json();

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
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('world.glb?v=2', (e) => {
  if (e.total) { const p = Math.round((e.loaded / e.total) * 100); bar.style.width = p + '%'; }
});
loadText.textContent = 'lighting the lanterns…';
const root = gltf.scene;
scene.add(root);

/* ── sky, sun, fog: a dawn/dusk like the Unity scene ── */
const sunDir = new THREE.Vector3(...world.sun.toward).normalize();
sunDir.y = Math.max(sunDir.y, 0.05); sunDir.normalize();                 // keep the sun just above the horizon
const sky = new Sky(); sky.scale.setScalar(5000); scene.add(sky);
Object.assign(sky.material.uniforms.turbidity, { value: 6 });
sky.material.uniforms.rayleigh.value = 2.2;
sky.material.uniforms.mieCoefficient.value = 0.006;
sky.material.uniforms.mieDirectionalG.value = 0.86;
sky.material.uniforms.sunPosition.value.copy(sunDir);
const fogColor = new THREE.Color(0xd98a5c);
scene.fog = new THREE.Fog(fogColor, 90, 620);

const sunColor = lin(world.sun.color).lerp(new THREE.Color(1, 0.86, 0.66), 0.35);
const sun = new THREE.DirectionalLight(sunColor, 2.6);
sun.position.copy(sunDir).multiplyScalar(300);
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(lin(world.ambient.sky).lerp(new THREE.Color(1, 0.9, 0.8), 0.45), lin(world.ambient.ground), 1.45);
scene.add(hemi);

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
    });
    mat.name = m.name;
    return mat;
  });
  o.material = Array.isArray(o.material) ? mats : mats[0];
  const isWater = [].concat(o.material).some((m) => world.materials[m.name]?.water);
  if (isWater) { o.updateWorldMatrix(true, false); waterY = new THREE.Box3().setFromObject(o).max.y; o.visible = false; return; }
  const n = o.name || '';
  if (/^node_id39|goldfish/i.test(n)) koi.push(o);
  else if (/waterlily|^leaf/i.test(n)) { lilies.push(o); walk.push(o); }
  else if (/^(head|body|eyes|whisker)(pm)?$/i.test(n.replace(/[._ ]/g, '')) || /^Leg_?(BL|BR|FL|FR)/i.test(n)) dragonParts.push(o);
  else walk.push(o);
});
walk.forEach((o) => o.geometry.computeBoundsTree());

/* ── the pond: Dawn Water, for the web ── */
if (waterY === null) waterY = 122;
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
water.position.y = waterY;
water.renderOrder = 2;
scene.add(water);

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
function groundAt(x, z, fromY) {
  down.set(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0)); down.far = 400;
  const hit = down.intersectObjects(walk, false)[0];
  return Math.max(hit ? hit.point.y : -Infinity, waterY);
}
const sp = world.spawn;
const pos = new THREE.Vector3(...sp.position);
let ground = groundAt(pos.x, pos.z, pos.y + 2);
const EYE = THREE.MathUtils.clamp(pos.y - ground, 1.6, 8);            // the VR player is scaled up to suit the giant world
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
  const hits = ray.intersectObjects([...walk, water], false);
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
$('ddDemo').addEventListener('click', () => { vidEl.src = '../../3Dmodels/dragondoor.mp4'; vid.hidden = false; vidEl.play().catch(() => {}); });
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
  const speed = keys.has('shift') ? 22 : 9;
  if (move.lengthSq() > 0.0001) {
    glide.on = false;
    if (move.length() > 1) move.normalize();
    pos.addScaledVector(move, speed * dt);
  } else if (glide.on) {
    const d = new THREE.Vector3(glide.to.x - pos.x, 0, glide.to.z - pos.z); const L = d.length();
    if (L < 0.3) glide.on = false; else pos.addScaledVector(d.normalize(), Math.min(L, Math.max(4, L * 2.2) * dt));
  }
  if (move.lengthSq() > 0.0001 || glide.on || t < 1) ground = groundAt(pos.x, pos.z, eyeY + 6);
  eyeY += (ground + EYE - eyeY) * Math.min(1, dt * 8);  camera.position.set(pos.x, eyeY, pos.z);
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
canvas.addEventListener('pointerdown', () => window.focus());