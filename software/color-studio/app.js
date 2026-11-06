import { SEASONS, FAMILIES, metalsFor } from "./seasons.js";
import { loadLandmarker, detectFace, analyzeCanvas, oppositeOf } from "./analyzer.js";
import { startSilk } from "./silk.js";

const $ = (s) => document.querySelector(s);
const state = { quiz: {}, stream: null, photo: null, mirror: false, result: null, landmarks: null, liveTimer: null };
const silk = startSilk($("#silk"));

/* ---------- Light / dark toggle ---------- */
const themeBtn = $("#themeToggle");
function syncThemeLabel() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("rcs-theme", next); } catch {}
  syncThemeLabel();
  silk.redraw();
});
syncThemeLabel();

// Fetch the face model early so the reading feels instant.
(window.requestIdleCallback || setTimeout)(() => loadLandmarker());

/* ---------- Hero flower: one petal per season ---------- */
(function drawBloom() {
  const svg = $("#bloom"), ns = "http://www.w3.org/2000/svg";
  SEASONS.forEach((s, i) => {
    const g = document.createElementNS(ns, "g");
    g.setAttribute("transform", `rotate(${(i / SEASONS.length) * 360})`);
    const p = document.createElementNS(ns, "path");
    p.setAttribute("class", "petal");
    p.setAttribute("d", "M0,-44 C34,-82 40,-150 0,-186 C-40,-150 -34,-82 0,-44 Z");
    p.setAttribute("fill", s.colors[1][0]);
    const t = document.createElementNS(ns, "title"); t.textContent = s.name; p.appendChild(t);
    g.appendChild(p); svg.appendChild(g);
  });
})();

/* ---------- Quick question ---------- */
document.querySelectorAll(".chips").forEach((group) => {
  group.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    group.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", String(on));
    state.quiz[group.dataset.quiz] = on ? b.dataset.v : undefined;
    if (state.result) {
      state.result = analyzeCanvas(state.photo, state.landmarks, state.quiz);
      renderResults(state.result, { silent: true });
      toast("Updated with your answer");
    }
  });
});

/* ---------- Helpers ---------- */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function showStage(name) { ["Idle", "Live", "Scan"].forEach((n) => ($(`#stage${n}`).hidden = n !== name)); }
function toast(msg, ms = 3200) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), ms);
}
function tint(hex, amt) { // mix toward white
  const n = parseInt(hex.slice(1), 16), m = (c) => Math.round(c + (255 - c) * amt);
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((c) => m(c).toString(16).padStart(2, "0")).join("");
}
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(Math.min(255, Math.max(0, c + (pct / 100) * (pct > 0 ? 255 - c : c))));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

/* ---------- Camera ---------- */
$("#btnCamera").addEventListener("click", startCamera);
$("#btnCancel").addEventListener("click", () => { stopCamera(); showStage("Idle"); });
$("#btnShutter").addEventListener("click", capture);

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { toast("This browser can't open the camera. Try uploading a photo."); return; }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
  } catch (err) {
    toast(err.name === "NotAllowedError" ? "Camera access was declined. You can upload a selfie instead." : "Couldn't open the camera. Try uploading a selfie.");
    return;
  }
  const v = $("#video");
  v.srcObject = state.stream;
  await v.play().catch(() => {});
  showStage("Live");
  liveGuide();
}
function stopCamera() {
  clearInterval(state.liveTimer);
  state.stream?.getTracks().forEach((t) => t.stop());
  state.stream = null;
}

// Live framing feedback: face found, centered, enough light.
const tiny = document.createElement("canvas"); tiny.width = 48; tiny.height = 36;
async function liveGuide() {
  const lm = await loadLandmarker();
  const v = $("#video"), hint = $("#liveHint"), guide = $(".guide");
  state.liveTimer = setInterval(() => {
    if (!state.stream || v.readyState < 2) return;
    const tctx = tiny.getContext("2d", { willReadFrequently: true });
    tctx.drawImage(v, 0, 0, 48, 36);
    const d = tctx.getImageData(12, 6, 24, 24).data;
    let y = 0; for (let i = 0; i < d.length; i += 4) y += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    y /= d.length / 4;
    let msg = "Center your face in the oval", ok = false;
    if (lm) {
      const face = detectFace(lm, v);
      if (face) {
        const xs = face.map((p) => p.x), w = Math.max(...xs) - Math.min(...xs), cx = (Math.max(...xs) + Math.min(...xs)) / 2;
        if (w < 0.22) msg = "Come a little closer";
        else if (w > 0.7) msg = "Back up a little";
        else if (Math.abs(cx - 0.5) <= 0.15) { ok = true; msg = "Perfect. Hold still and tap"; }
      }
    } else ok = true;
    if (y < 70) { msg = "A little more light, please"; ok = false; }
    else if (y > 225) { msg = "Too bright. Step out of direct sun"; ok = false; }
    hint.textContent = msg;
    guide.classList.toggle("found", ok);
  }, 220);
}

function capture() {
  const v = $("#video"); if (!v.videoWidth) return;
  const c = document.createElement("canvas"), scale = Math.min(1, 1280 / v.videoWidth);
  c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
  c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  stopCamera();
  state.mirror = true;
  runAnalysis(c);
}

/* ---------- Upload ---------- */
$("#fileInput").addEventListener("change", async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  e.target.value = "";
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    state.mirror = false;
    runAnalysis(c);
  } catch {
    toast("That file couldn't be opened. Try a JPG or PNG.");
  }
});

/* ---------- Reading ---------- */
const STEPS = ["Finding your features", "Balancing the light", "Reading your undertone", "Measuring depth and contrast", "Picking your season"];

async function runAnalysis(canvas) {
  state.photo = canvas;
  showStage("Scan");
  $("#studio").scrollIntoView({ behavior: "smooth", block: "center" });
  const sc = $("#scanCanvas");
  sc.width = canvas.width; sc.height = canvas.height;
  const sctx = sc.getContext("2d");
  drawPhoto(sctx, canvas, 0, 0, sc.width, sc.height);

  let si = 0;
  const say = () => { $("#scanSteps").innerHTML = `<span>${STEPS[Math.min(si++, STEPS.length - 1)]}…</span>`; };
  say();
  const ticker = setInterval(say, 600);
  const started = performance.now();

  const model = await Promise.race([loadLandmarker(), wait(8000).then(() => null)]);
  const landmarks = detectFace(model, canvas);
  state.landmarks = landmarks;
  const result = analyzeCanvas(canvas, landmarks, state.quiz);

  const ring = { skin: "#F6CFD3", hair: "#F6D58E", eyes: "#BFD8F2", lips: "#F07BA0" };
  for (const [kind, [x, y, r]] of result.pts.regions) {
    await wait(70);
    sctx.beginPath(); sctx.arc(state.mirror ? sc.width - x : x, y, Math.max(r, 4), 0, Math.PI * 2);
    sctx.strokeStyle = ring[kind]; sctx.lineWidth = Math.max(2.5, sc.width / 320); sctx.stroke();
  }
  await wait(Math.max(0, 2800 - (performance.now() - started)));
  clearInterval(ticker);

  state.result = result;
  renderResults(result);
  showStage("Idle");
  if (!landmarks) toast("Couldn't pinpoint your features, so we read the middle of the photo. A front-facing selfie works best.", 6000);
}

function drawPhoto(ctx, img, x, y, w, h) {
  ctx.save();
  if (state.mirror) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); }
  else ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

/* ---------- Try-on drape ---------- */
function faceCrop() {
  const f = state.result.face, img = state.photo;
  const size = Math.min(Math.max(f.w, f.h) * 1.75, img.width, img.height);
  const sx = Math.max(0, Math.min(img.width - size, f.cx - size / 2));
  const sy = Math.max(0, Math.min(img.height - size, f.cy - size / 2 + f.h * 0.12));
  return { sx, sy, size };
}

function drawDrape(canvas, color) {
  const ctx = canvas.getContext("2d"), S = canvas.width;
  const { sx, sy, size } = faceCrop();
  const bg = ctx.createRadialGradient(S * 0.35, S * 0.3, S * 0.05, S / 2, S / 2, S * 0.75);
  bg.addColorStop(0, shade(color, 16)); bg.addColorStop(1, shade(color, -12));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  const cx = S / 2, cy = S * 0.44, r = S * 0.36;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (state.mirror) { ctx.translate(cx + r, cy - r); ctx.scale(-1, 1); ctx.drawImage(state.photo, sx, sy, size, size, 0, 0, 2 * r, 2 * r); }
  else ctx.drawImage(state.photo, sx, sy, size, size, cx - r, cy - r, 2 * r, 2 * r);
  ctx.restore();
  const cape = ctx.createLinearGradient(0, S * 0.66, 0, S);
  cape.addColorStop(0, shade(color, 8)); cape.addColorStop(1, shade(color, -14));
  ctx.fillStyle = cape;
  ctx.beginPath();
  ctx.moveTo(0, S * 0.78);
  ctx.bezierCurveTo(S * 0.22, S * 0.7, S * 0.36, S * 0.66, S * 0.5, S * 0.75);
  ctx.bezierCurveTo(S * 0.64, S * 0.66, S * 0.78, S * 0.7, S, S * 0.78);
  ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = S * 0.006;
  ctx.beginPath(); ctx.moveTo(S * 0.5, S * 0.75); ctx.quadraticCurveTo(S * 0.47, S * 0.88, S * 0.5, S); ctx.stroke();
}

function tryOn(hex, name) {
  drawDrape($("#drape"), hex);
  $("#drapeCaption").innerHTML = `<b>${name}</b> &nbsp;${hex}`;
}

/* ---------- Results ---------- */
function traitWords(v) {
  const pick = (x, lo, hi, mid) => (Math.abs(x) < 0.25 ? mid : x < 0 ? lo : hi);
  return [
    pick(v[0], "Cool undertone", "Warm undertone", "Neutral undertone"),
    pick(v[1], "Light", "Deep", "Medium depth"),
    pick(v[2], "Soft & muted", "Bright & clear", "Balanced chroma"),
  ];
}

function renderResults(r, { silent } = {}) {
  const s = r.ranking[0].season;
  $("#results").hidden = false;
  $("#resFamily").textContent = `${s.family} · ${FAMILIES[s.family].temp}`;
  $("#resName").textContent = s.name;
  $("#resTraits").innerHTML = traitWords(r.vec).map((w) => `<span>${w}</span>`).join("");
  $("#resDesc").textContent = s.desc;

  const pal = $("#resPalette"); pal.innerHTML = "";
  s.colors.forEach(([hex, name], i) => {
    const b = document.createElement("button");
    b.className = "chip"; b.style.animationDelay = `${i * 40}ms`;
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.setAttribute("aria-label", `Try on ${name}`);
    b.innerHTML = `<i style="background:${hex}"></i><b>${name}</b><small>${hex}</small>`;
    b.addEventListener("click", () => {
      pal.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      tryOn(hex, name);
    });
    pal.appendChild(b);
  });
  tryOn(s.colors[0][0], s.colors[0][1]);

  const opp = oppositeOf(r.vec);
  $("#resMetals").innerHTML = metalsFor(r.vec).map(([n, c]) => `<div class="metal"><i style="background:${c}"></i>${n}</div>`).join("");
  $("#resAvoid").innerHTML = opp.colors.slice(0, 6).map(([c, n]) => `<i style="background:${c}" title="${n}"></i>`).join("");
  $("#resNote").textContent = r.usedLandmarks
    ? "Lighting and cameras shift color a little. For the truest read, retake in daylight by a window."
    : "We couldn't find your features, so this is an estimate. Try a front-facing selfie in daylight.";

  // Re-dye the background silk in your season's colors.
  silk.setColors([0, 2, 4, 6, 8].map((i) => tint(s.colors[i][0], 0.35)));

  highlightYou(s);
  if (!silent) setTimeout(() => $("#results").scrollIntoView({ behavior: "smooth", block: "start" }), 120);
}

$("#btnRetake").addEventListener("click", () => {
  showStage("Idle");
  $("#studio").scrollIntoView({ behavior: "smooth", block: "center" });
});

/* ---------- Save palette card ---------- */
$("#btnSave").addEventListener("click", async () => {
  await document.fonts.ready;
  const s = state.result.ranking[0].season;
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#FBF3EC"; x.fillRect(0, 0, W, H);
  x.textAlign = "center";
  x.fillStyle = "#C2416B"; x.font = "italic 500 72px 'Cormorant Garamond'"; x.fillText("Rihanna's", W / 2, 120);
  x.fillStyle = "#3A1F2B"; x.font = "600 34px 'Cormorant Garamond'"; x.fillText("Color Studio", W / 2, 170);
  x.fillStyle = "#C2416B"; x.font = "italic 600 110px 'Cormorant Garamond'"; x.fillText(s.name, W / 2, 300);
  const d = document.createElement("canvas"); d.width = d.height = 440; drawDrape(d, s.colors[0][0]);
  x.save(); x.beginPath(); x.arc(W / 2, 560, 210, 0, Math.PI * 2); x.clip(); x.drawImage(d, W / 2 - 210, 350, 420, 420); x.restore();
  x.strokeStyle = "#3A1F2B"; x.lineWidth = 4; x.beginPath(); x.arc(W / 2, 560, 210, 0, Math.PI * 2); x.stroke();
  const cols = 6, cw = 136, ch = 190, gap = 22, startX = (W - (cols * cw + (cols - 1) * gap)) / 2;
  s.colors.forEach(([hex, name], i) => {
    const px = startX + (i % cols) * (cw + gap), py = 840 + Math.floor(i / cols) * (ch + 24);
    x.fillStyle = "#FFFBF7"; x.fillRect(px, py, cw, ch);
    x.fillStyle = hex; x.fillRect(px, py, cw, 120);
    x.strokeStyle = "#3A1F2B"; x.lineWidth = 3; x.strokeRect(px, py, cw, ch);
    x.beginPath(); x.moveTo(px, py + 120); x.lineTo(px + cw, py + 120); x.stroke();
    x.textAlign = "left"; x.fillStyle = "#3A1F2B"; x.font = "600 18px 'DM Sans'"; x.fillText(name, px + 10, py + 148, cw - 16);
    x.fillStyle = "#7D5E68"; x.font = "15px 'DM Sans'"; x.fillText(hex, px + 10, py + 172);
    x.textAlign = "center";
  });
  c.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${s.id}-palette.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Palette saved");
  }, "image/png");
});

/* ---------- All seasons ---------- */
const tabs = $("#familyTabs");
let youId = null;
Object.keys(FAMILIES).forEach((f, i) => {
  const b = document.createElement("button");
  b.setAttribute("role", "tab"); b.textContent = f; b.setAttribute("aria-selected", i === 0 ? "true" : "false");
  b.addEventListener("click", () => selectFamily(f));
  tabs.appendChild(b);
});
function selectFamily(f) {
  tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.textContent === f)));
  $("#seasonCards").innerHTML = SEASONS.filter((s) => s.family === f).map((s, i) => `
    <article class="season-card ${s.id === youId ? "is-you" : ""}" style="animation-delay:${i * 70}ms">
      ${s.id === youId ? '<span class="you">You!</span>' : ""}
      <h3>${s.name}</h3>
      <p class="words">${s.words.join(", ")}</p>
      <div class="strips">${s.colors.map(([c, n]) => `<i style="background:${c}" title="${n}"></i>`).join("")}</div>
    </article>`).join("");
}
function highlightYou(s) { youId = s.id; selectFamily(s.family); }
selectFamily("Spring");
