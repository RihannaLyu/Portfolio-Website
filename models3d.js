/* ═══════════════════════════════════════════════════════════
   3D MODELS — a gallery that fills itself from a folder.
   Put an .fbx in images/3Dmodels/models/ (on GitHub, "Add file → Upload files") and it shows
   up here. Optional, same folder, same name:
     <name>-process.mp4   a vertical video of making it (plays beside the close-up)
   Optional images/3Dmodels/models/models.json sets order + titles:
     [{ "file": "dragon.fbx", "title": "Dragon", "process": "dragon-process.mp4" }, …]
   Each card: drag to turn the model. Tap: the model fills the page, beside its process video.
   three.js loads only when the page first opens.
   ═══════════════════════════════════════════════════════════ */
const FOLDER = 'images/3Dmodels/models/';
const page   = document.getElementById('modelsPage');
const grid   = document.getElementById('m3Grid');
const empty  = document.getElementById('m3Empty');
const view   = document.getElementById('m3View');
const stage  = document.getElementById('m3Stage');
const phone  = document.getElementById('m3Phone');
const proc   = document.getElementById('m3Process');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let THREE, FBXLoader, OrbitControls, cloneObj, started = false;
const cache = new Map();                 // url -> Promise<{ object, clips }>

async function libs() {
  if (THREE) return;
  THREE = await import('three');
  ({ FBXLoader } = await import('three/addons/loaders/FBXLoader.js'));
  ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
  ({ clone: cloneObj } = await import('three/addons/utils/SkeletonUtils.js'));
}

/* ── which models are there? ── */
// "01-holy-crab" → "Holy Crab": a leading number only sets the order
const pretty = (s) => s.replace(/^\d+[\s._-]*/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
const abs = (f) => (/^(https?:)?\//.test(f) ? f : FOLDER + f);
function fromFiles(files) {
  const lower = files.map(f => f.toLowerCase());
  const pick = (base, sfx) => { for (const s of sfx) { const i = lower.indexOf((base + s).toLowerCase()); if (i >= 0) return files[i]; } return null; };
  return files.filter(f => /\.fbx$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(f => {
    const base = f.replace(/\.fbx$/i, '');
    const p = pick(base, ['-process.mp4', '-process.webm', '-process.mov', '_process.mp4', ' process.mp4']);
    return { title: pretty(base), file: abs(f), process: p ? abs(p) : null };
  });
}
async function findModels() {
  try {                                    // 1. an optional list, for order + titles
    const r = await fetch(FOLDER + 'models.json', { cache: 'no-cache' });
    if (r.ok) {
      const j = await r.json();
      const list = (Array.isArray(j) ? j : j.models || []).filter(m => m && m.file);
      if (list.length) return list.map(m => ({ title: m.title || pretty(m.file.split('/').pop().replace(/\.fbx$/i, '')), file: abs(m.file), process: m.process ? abs(m.process) : null }));
    }
  } catch {}
  let files = [];
  if (location.hostname.endsWith('github.io')) {   // 2. on the live site: the folder, as GitHub lists it
    const owner = location.hostname.split('.')[0];
    const repo = location.pathname.split('/').filter(Boolean)[0] || `${owner}.github.io`;
    const key = 'm3-files-' + repo;
    try { const hit = sessionStorage.getItem(key); if (hit) files = JSON.parse(hit); } catch {}
    if (!files.length) {
      try {
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${FOLDER.replace(/\/$/, '')}`);
        if (r.ok) { files = (await r.json()).map(f => f.name); try { sessionStorage.setItem(key, JSON.stringify(files)); } catch {} }
      } catch {}
    }
  } else {                                 // 3. while testing locally: the server's folder listing
    try { const r = await fetch(FOLDER); if (r.ok) files = [...(await r.text()).matchAll(/href="([^"?#]+)"/g)].map(m => decodeURIComponent(m[1])); } catch {}
  }
  return fromFiles(files);
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
  if (!cache.has(url)) cache.set(url, new Promise((res, rej) => new FBXLoader().load(url, (o) => res({ object: tidy(o), clips: o.animations || [] }), undefined, rej)));
  return cache.get(url).then(({ object, clips }) => ({ object: cloneObj(object), clips }));
}
function frame(object, camera, controls, pad = 1.25) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);                                     // centre it on the origin
  const r = Math.max(size.x, size.y, size.z) * 0.5 || 1;
  const vfov = camera.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * (camera.aspect || 1));
  const dist = (r / Math.sin(Math.min(vfov, hfov) / 2)) * pad;     // fit the narrower side (phones are tall)
  camera.near = dist / 100; camera.far = dist * 100; camera.updateProjectionMatrix();
  camera.position.set(dist * 0.55, dist * 0.32, dist * 0.78);
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
    this.el = el; this.model = model; this.zoom = zoom; this.pad = zoom ? 0.8 : 1.05;
    this.scene = new THREE.Scene(); lights(this.scene);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    this.clock = new THREE.Clock(); this.ready = false; this.active = false;
    this.loading = loadModel(model.file).then(({ object, clips }) => {
      this.object = object; this.scene.add(object);
      if (clips.length) { this.mixer = new THREE.AnimationMixer(object); this.mixer.clipAction(clips[0]).play(); }
      if (this.controls) frame(object, this.camera, this.controls, this.pad);
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
                                   autoRotate: !reduced, autoRotateSpeed: this.zoom ? 0.8 : 1.4, rotateSpeed: 0.9 });
    if (!this.zoom) this.renderer.domElement.style.touchAction = 'pan-y';   // phones: sideways turns the model, up/down scrolls the page
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; });
    this.resize();
    if (this.object) frame(this.object, this.camera, this.controls, this.pad);
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
    this.controls.update(); this.renderer.render(this.scene, this.camera);
  }
}
const views = new Set();
let raf = 0;
function loop() { if (raf) return; const go = () => { let any = false; views.forEach(v => { if (v.active) { v.tick(); any = true; } }); raf = any ? requestAnimationFrame(go) : 0; }; raf = requestAnimationFrame(go); }

/* ── the gallery ── */
let cards = [];
async function build() {
  const models = await findModels();
  grid.innerHTML = '';
  empty.hidden = models.length > 0;
  if (!models.length) return;
  await libs();
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target._view; if (!v) return; if (e.isIntersecting) v.start(); else v.stop(); }), { root: page, rootMargin: '200px' });
  models.forEach((m, i) => {
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
  });
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
