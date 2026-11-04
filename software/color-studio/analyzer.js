// Selfie color analysis: face landmarks -> skin / hair / eye / lip samples -> CIELAB -> season.
// Everything runs in the browser; the photo never leaves the device.
import { SEASONS } from "./seasons.js";

const MP_VERSION = "0.10.14";
const MP_BUNDLE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MP_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// ---------- Face landmarker (lazy) ----------
let landmarkerPromise = null;
let lastTs = 0;

export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import(MP_BUNDLE);
      const fileset = await FilesetResolver.forVisionTasks(MP_WASM);
      const make = (delegate) => FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MP_MODEL, delegate },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      try { return await make("GPU"); } catch { return await make("CPU"); }
    })().catch((err) => {
      console.warn("Face landmarker unavailable, using guided-oval fallback.", err);
      return null;
    });
  }
  return landmarkerPromise;
}

export function detectFace(landmarker, source) {
  if (!landmarker) return null;
  lastTs = Math.max(performance.now(), lastTs + 1);
  try {
    const res = landmarker.detectForVideo(source, lastTs);
    return res?.faceLandmarks?.[0] || null;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

// ---------- Color math ----------
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const toSrgb = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, v)) * 255); };
const LIN = new Float32Array(256).map((_, i) => toLin(i));

export function linToLab([r, g, b]) {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  const L = 116 * fy - 16, a = 500 * (fx - fy), bb = 200 * (fy - fz);
  const C = Math.hypot(a, bb);
  let h = Math.atan2(bb, a) * 180 / Math.PI; if (h < 0) h += 360;
  return { L, a, b: bb, C, h };
}
export const linToHex = (rgb) => "#" + rgb.map((c) => toSrgb(c).toString(16).padStart(2, "0")).join("").toUpperCase();

const clamp = (v, lo = -1.25, hi = 1.25) => Math.min(hi, Math.max(lo, v));

// ---------- Sampling ----------
function patch(img, cx, cy, r, { ring = 0 } = {}) {
  const { width: W, height: H, data } = img;
  const px = [];
  const step = Math.max(1, Math.floor(r / 9));
  for (let y = Math.floor(cy - r); y <= cy + r; y += step) {
    for (let x = Math.floor(cx - r); x <= cx + r; x += step) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d > r || d < ring * r) continue;
      const i = (y * W + x) * 4;
      px.push([LIN[data[i]], LIN[data[i + 1]], LIN[data[i + 2]]]);
    }
  }
  return px;
}

// Trimmed mean in linear light: drops shadows and specular highlights.
function robust(px, lo = 0.18, hi = 0.18) {
  if (!px.length) return null;
  const withY = px.map((p) => [p, 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]]).sort((a, b) => a[1] - b[1]);
  const s = Math.floor(withY.length * lo), e = Math.max(s + 1, Math.ceil(withY.length * (1 - hi)));
  const keep = withY.slice(s, e);
  const m = [0, 0, 0];
  keep.forEach(([p]) => { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; });
  return m.map((v) => v / keep.length);
}

const P = (lm, i, W, H) => [lm[i].x * W, lm[i].y * H];
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function sampleRegions(img, lm) {
  const W = img.width, H = img.height;
  const pts = { regions: [] }; // for drawing the scan overlay
  let face, skinPts, hairPts, eyePts, scleraPts, lipPt, lipR, irisR;

  if (lm) {
    const top = P(lm, 10, W, H), chin = P(lm, 152, W, H);
    const lft = P(lm, 234, W, H), rgt = P(lm, 454, W, H);
    const faceH = dist(top, chin), faceW = dist(lft, rgt);
    const up = [(top[0] - chin[0]) / faceH, (top[1] - chin[1]) / faceH];
    face = { cx: (lft[0] + rgt[0]) / 2, cy: (top[1] + chin[1]) / 2, w: faceW, h: faceH };
    const sr = faceW * 0.045;
    skinPts = [50, 280, 151, 101, 330, 199].map((i) => [...P(lm, i, W, H), sr]);
    const hairR = faceW * 0.05;
    hairPts = [
      [top[0] + up[0] * faceH * 0.13, top[1] + up[1] * faceH * 0.13, hairR],
      [P(lm, 127, W, H)[0] - faceW * 0.07, P(lm, 127, W, H)[1] - faceH * 0.08, hairR * 0.8],
      [P(lm, 356, W, H)[0] + faceW * 0.07, P(lm, 356, W, H)[1] - faceH * 0.08, hairR * 0.8],
    ];
    const irises = lm.length > 473 ? [468, 473] : null;
    if (irises) {
      const c1 = P(lm, 468, W, H), c2 = P(lm, 473, W, H);
      irisR = Math.max(2, (dist(c1, P(lm, 469, W, H)) + dist(c2, P(lm, 474, W, H))) / 2);
      eyePts = [[...c1, irisR * 0.85], [...c2, irisR * 0.85]];
      scleraPts = [33, 133, 263, 362].map((i) => {
        const corner = P(lm, i, W, H);
        const iris = dist(corner, c1) < dist(corner, c2) ? c1 : c2;
        return [...mid(iris, corner, 0.55), irisR * 0.35];
      });
    } else {
      eyePts = [[...P(lm, 159, W, H), faceW * 0.02], [...P(lm, 386, W, H), faceW * 0.02]];
      scleraPts = [];
    }
    lipPt = mid(P(lm, 14, W, H), P(lm, 17, W, H), 0.45);
    lipR = dist(P(lm, 14, W, H), P(lm, 17, W, H)) * 0.28;
  } else {
    // Guided-oval fallback: assume a centered, front-facing face.
    const s = Math.min(W, H);
    face = { cx: W / 2, cy: H * 0.47, w: s * 0.42, h: s * 0.58 };
    const { cx, cy, w, h } = face, r = w * 0.05;
    skinPts = [[cx - w * 0.25, cy + h * 0.08, r], [cx + w * 0.25, cy + h * 0.08, r], [cx, cy - h * 0.3, r]];
    hairPts = [[cx, cy - h * 0.62, r * 1.2], [cx - w * 0.55, cy - h * 0.35, r], [cx + w * 0.55, cy - h * 0.35, r]];
    eyePts = [[cx - w * 0.2, cy - h * 0.1, r * 0.5], [cx + w * 0.2, cy - h * 0.1, r * 0.5]];
    scleraPts = [];
    lipPt = [cx, cy + h * 0.33]; lipR = r * 0.7;
  }

  const collect = (list, opts) => list.flatMap(([x, y, r]) => patch(img, x, y, r, opts));
  const raw = {
    skin: robust(collect(skinPts), 0.2, 0.2),
    hair: robust(collect(hairPts), 0.1, 0.25),
    eyes: robust(collect(eyePts, { ring: lm ? 0.38 : 0 }), 0.15, 0.3),
    lips: robust(patch(img, lipPt[0], lipPt[1], lipR), 0.2, 0.2),
    sclera: scleraPts.length ? robust(collect(scleraPts), 0.3, 0.1) : null,
  };
  pts.regions = [
    ...skinPts.map((p) => ["skin", p]), ...hairPts.map((p) => ["hair", p]),
    ...eyePts.map((p) => ["eyes", p]), ["lips", [...lipPt, lipR]],
  ];
  return { raw, face, pts };
}

// White balance from the whites of the eyes (when they look plausibly white).
function whiteBalance(sclera) {
  if (!sclera) return [1, 1, 1];
  const lab = linToLab(sclera);
  if (lab.L < 45 || lab.C > 28) return [1, 1, 1];
  const g = sclera[1] || 1e-4;
  const strength = 0.6; // partial: sclera is never perfectly neutral
  return sclera.map((c) => Math.min(1.25, Math.max(0.8, Math.pow(g / Math.max(c, 1e-4), strength))));
}

// ---------- Scoring ----------
export function scoreFeatures(lab, quiz = {}) {
  const { skin, hair, eyes, lips } = lab;
  // Warmth: skin hue angle is the anchor (higher h = more yellow = warmer).
  const skinW = clamp((skin.h - 55) / 8);
  const hairW = hair.L > 22 ? clamp((hair.C - 11) / 8) : 0;
  const eyeW = clamp((eyes.b - 5) / 8);
  const lipW = clamp((lips.h - 28) / 9);
  let warmth = 0.62 * skinW + 0.14 * hairW + 0.12 * eyeW + 0.12 * lipW;
  if (quiz.veins === "blue") warmth -= 0.35;
  if (quiz.veins === "green") warmth += 0.35;
  if (quiz.metal === "silver") warmth -= 0.3;
  if (quiz.metal === "gold") warmth += 0.3;

  // Depth: overall value of the face's palette.
  const value = 0.55 * skin.L + 0.3 * hair.L + 0.15 * eyes.L;
  const depth = clamp((47 - value) / 17);

  // Contrast: lightness gap between skin and hair (primary) and eyes (secondary).
  const gap = 0.7 * Math.abs(skin.L - hair.L) + 0.3 * Math.abs(skin.L - eyes.L);
  const contrast = clamp((gap - 26) / 14);

  // Clarity: saturation of skin and eyes, lifted by contrast.
  const clarity = clamp(0.45 * ((skin.C - 20) / 7) + 0.25 * ((eyes.C - 10) / 8) + 0.3 * contrast);

  return [clamp(warmth), depth, clarity, contrast];
}

const WEIGHTS = [1.4, 1.0, 1.0, 0.6];
export function rankSeasons(vec) {
  const d = SEASONS.map((s) => {
    const sq = s.vec.reduce((acc, v, i) => acc + WEIGHTS[i] * (v - vec[i]) ** 2, 0);
    return { season: s, d2: sq };
  });
  const tau = 0.35;
  const exps = d.map((x) => Math.exp(-x.d2 / tau));
  const sum = exps.reduce((a, b) => a + b, 0);
  return d.map((x, i) => ({ ...x, p: exps[i] / sum })).sort((a, b) => a.d2 - b.d2);
}

export function oppositeOf(vec) {
  const inv = vec.map((v) => -v);
  return rankSeasons(inv)[0].season;
}

// ---------- Main entry ----------
export function analyzeCanvas(canvas, landmarks, quiz) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { raw, face, pts } = sampleRegions(img, landmarks);
  const gains = whiteBalance(raw.sclera);
  const fix = (v) => (v ? v.map((c, i) => c * gains[i]) : [0.2, 0.15, 0.12]);
  const lin = { skin: fix(raw.skin), hair: fix(raw.hair), eyes: fix(raw.eyes), lips: fix(raw.lips) };
  const lab = Object.fromEntries(Object.entries(lin).map(([k, v]) => [k, linToLab(v)]));
  const hex = Object.fromEntries(Object.entries(lin).map(([k, v]) => [k, linToHex(v)]));
  const vec = scoreFeatures(lab, quiz);
  const ranking = rankSeasons(vec);
  const scleraLab = raw.sclera ? linToLab(raw.sclera) : null;
  return { vec, ranking, lab, hex, face, pts, scleraLab, gains, usedLandmarks: !!landmarks, balanced: gains.some((g) => g !== 1) };
}
