/* ═══════════════════════════════════════════════════════════
   3D MODELS — a gallery that fills itself from two folders:
     images/3Dmodels/models/individual/    single pieces (characters, props, sculpts)
     images/3Dmodels/models/environment/   whole scenes (rooms, islands)
   Put an .fbx in one of them (on GitHub, "Add file → Upload files") and it shows up in that
   section. A leading number sets the order: "01-dragon.fbx" → "Dragon", first.
   Optional, same folder, same name:  <name>-process.mp4  a vertical making-of video (beside the close-up)
   Optional models.json in a folder sets order + titles:
     [{ "file": "dragon.fbx", "title": "Dragon", "process": "dragon-process.mp4" }, …]
   Each card: drag to turn the model. Tap: the model fills the page, beside its process video.
   three.js loads only when the page first opens.
   ═══════════════════════════════════════════════════════════ */
const ROOT = 'images/3Dmodels/models/';
const SECTIONS = [
  { folder: ROOT + 'individual/',  el: document.getElementById('m3Individual') },
  { folder: ROOT + 'environment/', el: document.getElementById('m3Environment') },
];
const page   = document.getElementById('modelsPage');
const empty  = document.getElementById('m3Empty');
const view   = document.getElementById('m3View');
const stage  = document.getElementById('m3Stage');
const phone  = document.getElementById('m3Phone');
const proc   = document.getElementById('m3Process');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let THREE, FBXLoader, GLTFLoader, DRACOLoader, OrbitControls, cloneObj, started = false;
const cache = new Map();                 // url -> Promise<{ object, clips }>

async function libs() {
  if (THREE) return;
  THREE = await import('three');
  ({ FBXLoader } = await import('three/addons/loaders/FBXLoader.js'));
  ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  ({ DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js'));
  ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
  ({ clone: cloneObj } = await import('three/addons/utils/SkeletonUtils.js'));
}

/* ── which models are there? ── */
// "01-holy-crab" → "Holy Crab": a leading number only sets the order
const pretty = (s) => s.replace(/^\d+[\s._-]*/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
const absIn = (folder) => (f) => (/^(https?:)?\//.test(f) ? f : folder + f);
function fromFiles(files, folder) {
  const abs = absIn(folder);
  const lower = files.map(f => f.toLowerCase());
  const pick = (base, sfx) => { for (const s of sfx) { const i = lower.indexOf((base + s).toLowerCase()); if (i >= 0) return files[i]; } return null; };
  return files.filter(f => /\.(fbx|glb)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(f => {
    const base = f.replace(/\.(fbx|glb)$/i, '');
    const p = pick(base, ['-process.mp4', '-process.webm', '-process.mov', '_process.mp4', ' process.mp4']);
    return { title: pretty(base), file: abs(f), process: p ? abs(p) : null };
  });
}
async function findModels(folder) {
  const abs = absIn(folder);
  try {                                    // 1. an optional list, for order + titles
    const r = await fetch(folder + 'models.json', { cache: 'no-cache' });
    if (r.ok) {
      const j = await r.json();
      const list = (Array.isArray(j) ? j : j.models || []).filter(m => m && m.file);
      if (list.length) return list.map(m => ({ title: m.title || pretty(m.file.split('/').pop().replace(/\.(fbx|glb)$/i, '')), file: abs(m.file), process: m.process ? abs(m.process) : null }));
    }
  } catch {}
  let files = [];
  if (location.hostname.endsWith('github.io')) {   // 2. on the live site: the folder, as GitHub lists it
    const owner = location.hostname.split('.')[0];
    const repo = location.pathname.split('/').filter(Boolean)[0] || `${owner}.github.io`;
    const key = 'm3-files-' + repo + '-' + folder;
    try { const hit = sessionStorage.getItem(key); if (hit) files = JSON.parse(hit); } catch {}
    if (!files.length) {
      try {
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${folder.replace(/\/$/, '')}`);
        if (r.ok) { files = (await r.json()).map(f => f.name); try { sessionStorage.setItem(key, JSON.stringify(files)); } catch {} }
      } catch {}
    }
  } else {                                 // 3. while testing locally: the server's folder listing
    try { const r = await fetch(folder); if (r.ok) files = [...(await r.text()).matchAll(/href="([^"?#]+)"/g)].map(m => decodeURIComponent(m[1])); } catch {}
  }
  return fromFiles(files, folder);
}

/* ── loading + framing a model ── */
// Sculpting apps (Nomad etc.) bake colour into textures whose empty space is transparent, and the
// exported material then says "transparent" — the model turns see-through and pale. Make it solid,
// and soften the plastic shine so it reads like painted clay.
function tidy(o) {
  o.traverse(n => {
    if (!n.isMesh) return;
    [].concat(n.material).forEach(m => {
      if (!m) return;
      if (m.opacity >= 0.99) { m.transparent = false; m.opacity = 1; m.alphaTest = 0; m.depthWrite = true; }
      if (m.specular) { m.specular.setScalar(0.12); m.shininess = Math.min(m.shininess || 30, 30); }
      if (m.emissiveMap && m.emissive && m.emissive.getHex() === 0) m.emissiveMap = null;   // black glow maps do nothing
      m.needsUpdate = true;
    });
  });
  return o;
}
function loadModel(url) {
  if (!cache.has(url)) cache.set(url, new Promise((res, rej) => {
    if (/\.glb(\?|$)/i.test(url)) {                                       // .glb (Draco-compressed scenes, e.g. whole rooms)
      const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
      new GLTFLoader().setDRACOLoader(draco).load(url, (g) => res({ object: g.scene, clips: g.animations || [] }), undefined, rej);
    } else new FBXLoader().load(url, (o) => res({ object: tidy(o), clips: o.animations || [] }), undefined, rej);
  }));
  return cache.get(url).then(({ object, clips }) => ({ object: cloneObj(object), clips }));
}
function frame(object, camera, controls, pad = 1.25, elev = 0.17, sway = 0.32) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);                                     // centre it on the origin
  // Zoom in until the model (at every angle of its idle sway) just fits the card: its corners are
  // projected for real, so models nearly touch the edges whatever their shape or viewing angle.
  const h = size.clone().multiplyScalar(0.5), dir = new THREE.Vector3(0, elev, Math.sqrt(1 - elev * elev));
  // points on the model's actual surface (a sample of its vertices), so round shapes fill the card too
  const corners = [];
  object.updateMatrixWorld(true);
  const parentInv = object.parent ? new THREE.Matrix4().copy(object.parent.matrixWorld).invert() : new THREE.Matrix4();
  const meshes = []; object.traverse(o => { if (o.isMesh && o.geometry?.attributes?.position) meshes.push(o); });
  const per = Math.max(20, Math.floor(1500 / Math.max(1, meshes.length)));
  for (const o of meshes) {
    const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / per));
    const m = new THREE.Matrix4().multiplyMatrices(parentInv, o.matrixWorld);
    for (let i = 0; i < pos.count; i += step) corners.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m));
  }
  if (corners.length < 8) for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push(new THREE.Vector3(sx * h.x, sy * h.y, sz * h.z));
  const turns = [-1, -0.5, 0, 0.5, 1].map(a => new THREE.Matrix4().makeRotationY(a * sway));
  const p = new THREE.Vector3();
  const r = h.length() || 1;
  const fits = (d) => {
    camera.position.copy(dir).multiplyScalar(d); camera.lookAt(0, 0, 0);
    camera.near = d / 100; camera.far = d * 100; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    for (const m of turns) for (const c of corners) {
      p.copy(c).applyMatrix4(m).project(camera);
      if (p.z > 1 || Math.max(Math.abs(p.x), Math.abs(p.y)) * pad > 1) return false;
    }
    return true;
  };
  let lo = r * 0.3, hi = r * 40;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
  const dist = hi; fits(dist);
  controls.target.set(0, 0, 0); controls.minDistance = dist * 0.25; controls.maxDistance = dist * 3; controls.update();
}
function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0xb9b0d8, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf6cfd3, 0.7); rim.position.set(-4, 2, -3); scene.add(rim);
}

/* one 3D view inside an element: its own renderer, made while visible and released when not */
class View {
  constructor(el, model, { zoom = false } = {}) {
    this.el = el; this.model = model; this.zoom = zoom; this.pad = zoom ? 1.08 : 1.03;          // cards: the model almost touches the edges
    this.elev = model.env ? 0.6 : 0.17;                       // whole scenes (open-top rooms, islands): looked at from above
    this.swayAmp = model.env ? 0.1 : 0.32;                    // scenes sway less, so they can fill their wide cards
    this.scene = new THREE.Scene(); lights(this.scene);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    this.clock = new THREE.Clock(); this.ready = false; this.active = false;
    this.loading = loadModel(model.file).then(({ object, clips }) => {
      // the model sits in a pivot at its own centre, so the idle sway turns it in place
      this.object = object; this.pivot = new THREE.Group(); this.pivot.add(object); this.scene.add(this.pivot);
      if (clips.length) { this.mixer = new THREE.AnimationMixer(object); this.mixer.clipAction(clips[0]).play(); }
      if (this.controls) frame(object, this.camera, this.controls, this.pad, this.elev, this.swayAmp);
      this.ready = true; this.el.classList.add('is-loaded');
    }).catch(() => this.el.classList.add('is-broken'));
  }
  start() {
    if (this.renderer) return;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: this.zoom,
                                   autoRotate: false, rotateSpeed: 0.9 });
    if (!this.zoom) this.renderer.domElement.style.touchAction = 'pan-y';   // phones: sideways turns the model, up/down scrolls the page
    // idle: a gentle sway that keeps the face toward the screen; the first drag hands it to the visitor
    this.sway = !reduced; this.t0 = performance.now();
    this.controls.addEventListener('start', () => { this.sway = false; });
    this.resize();
    if (this.object) frame(this.object, this.camera, this.controls, this.pad, this.elev, this.swayAmp);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.el);
    this.active = true; loop();
  }
  stop() {
    if (!this.renderer) return;
    this.active = false; this.ro.disconnect(); this.controls.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
    this.renderer = null; this.controls = null;
  }
  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h || !this.renderer) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  tick() {
    if (!this.renderer) return;
    const dt = this.clock.getDelta();
    if (this.mixer && !reduced) this.mixer.update(dt);
    if (this.pivot) {
      const want = this.sway ? Math.sin((performance.now() - this.t0) / 1000 * (this.zoom ? 0.5 : 0.7)) * this.swayAmp : this.pivot.rotation.y;
      this.pivot.rotation.y += (want - this.pivot.rotation.y) * 0.08;
    }
    this.controls.update(); this.renderer.render(this.scene, this.camera);
  }
}
const views = new Set();
let raf = 0;
function loop() { if (raf) return; const go = () => { let any = false; views.forEach(v => { if (v.active) { v.tick(); any = true; } }); raf = any ? requestAnimationFrame(go) : 0; }; raf = requestAnimationFrame(go); }

/* ── the gallery ── */
let cards = [];
async function build() {
  const lists = await Promise.all(SECTIONS.map(s => findModels(s.folder)));
  const total = lists.reduce((n, l) => n + l.length, 0);
  empty.hidden = total > 0;
  if (!total) return;
  await libs();
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target._view; if (!v) return; if (e.isIntersecting) v.start(); else v.stop(); }), { root: page, rootMargin: '200px' });
  SECTIONS.forEach((s, k) => { if (s.el) { s.el.hidden = !lists[k].length; s.el.querySelector('.m3-grid').innerHTML = ''; } });
  let i = 0;
  SECTIONS.forEach((s, k) => { if (s.el) lists[k].forEach(m => { m.env = /environment/.test(s.folder); addCard(m, i++, s.el.querySelector('.m3-grid'), io); }); });
}
function addCard(m, i, grid, io) {
  {
    const card = document.createElement('figure');
    card.className = 'm3-card'; card.style.setProperty('--i', i); card.tabIndex = 0;
    card.setAttribute('role', 'button'); card.setAttribute('aria-label', `${m.title}: drag to turn, tap to open`);
    card.innerHTML = `<div class="m3-canvas"><span class="m3-spin" aria-hidden="true"></span></div><figcaption>${m.title}</figcaption>`;
    const box = card.querySelector('.m3-canvas');
    const v = new View(box, m); box._view = v; views.add(v); io.observe(box);
    // a tap (not a drag) opens the close-up
    let sx = 0, sy = 0, st = 0;
    box.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = performance.now(); }, true);
    box.addEventListener('pointerup', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6 && performance.now() - st < 400) open(m); }, true);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(m); } });
    grid.appendChild(card); cards.push(card);
  }
}

/* ── the close-up: the model fills the page, the making-of plays in a vertical screen ── */
let big = null;
function open(m) {
  document.getElementById('m3Title').textContent = m.title;
  view.hidden = false; requestAnimationFrame(() => view.classList.add('open'));
  page.classList.add('m3-viewing');
  stage.innerHTML = '<span class="m3-spin" aria-hidden="true"></span>'; stage.classList.remove('is-loaded', 'is-broken');
  big = new View(stage, m, { zoom: true }); views.add(big); big.start();
  view.classList.toggle('has-process', !!m.process);
  if (m.process) { proc.src = m.process; proc.play().catch(() => {}); } else { proc.removeAttribute('src'); }
  setTimeout(() => document.getElementById('m3Close').focus({ preventScroll: true }), 60);
}
function close() {
  if (view.hidden) return false;
  view.classList.remove('open'); page.classList.remove('m3-viewing');
  proc.pause();
  if (big) { big.stop(); views.delete(big); big = null; }
  setTimeout(() => { view.hidden = true; proc.removeAttribute('src'); proc.load(); }, 350);
  return true;
}
document.getElementById('m3Close').addEventListener('click', close);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !view.hidden) { e.stopImmediatePropagation(); close(); } }, true);
document.getElementById('modelsClose').addEventListener('click', close);

// start the first time the page opens
new MutationObserver(() => {
  if (page.classList.contains('open') && !started) { started = true; build().catch(err => { console.error(err); empty.hidden = false; }); }
  if (!page.classList.contains('open')) close();
}).observe(page, { attributes: true, attributeFilter: ['class'] });
