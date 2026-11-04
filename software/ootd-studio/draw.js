// Hand-drawn flat-lays. Every piece is a set of points; each is drawn like a quick fashion sketch:
// a watercolour fill laid down slightly off the line, then a wobbly ink line drawn twice.
import { rng } from "./outfit.js";

const NS = "http://www.w3.org/2000/svg";
const INK = "#3A1F2B";

/* ── shapes, in a 200 x 200 box ── */
const SHAPES = {
  tee:        { body: [[68,12],[86,24],[114,24],[132,12],[176,32],[194,72],[162,84],[150,62],[152,192],[48,192],[50,62],[38,84],[6,72],[24,32]], lines: [[[86,24],[100,34],[114,24]]] },
  tank:       { body: [[62,6],[74,6],[84,42],[116,42],[126,6],[138,6],[152,62],[154,188],[46,188],[48,62]], lines: [] },
  longsleeve: { body: [[68,12],[86,24],[114,24],[132,12],[172,26],[196,176],[170,182],[150,72],[152,192],[48,192],[50,72],[30,182],[4,176],[28,26]], lines: [[[86,24],[100,32],[114,24]]] },
  sweater:    { body: [[66,14],[84,22],[116,22],[134,14],[174,28],[198,172],[168,182],[150,76],[154,190],[46,190],[50,76],[32,182],[2,172],[26,28]],
                lines: [[[84,22],[100,30],[116,22]], [[48,176],[152,176]], [[8,160],[30,166]], [[170,166],[194,160]]], ribs: true },
  sweatshirt: { body: [[66,14],[84,24],[116,24],[134,14],[176,30],[198,170],[170,180],[150,78],[154,192],[46,192],[50,78],[30,180],[2,170],[24,30]],
                lines: [[[84,24],[100,34],[116,24]], [[48,178],[152,178]]] },
  cardigan:   { body: [[66,14],[90,20],[100,60],[110,20],[134,14],[174,28],[198,172],[168,182],[150,76],[154,190],[46,190],[50,76],[32,182],[2,172],[26,28]],
                lines: [[[100,60],[100,190]], [[48,176],[152,176]]], buttons: [[106,80],[106,108],[106,136],[106,164]] },
  blouse:     { body: [[70,12],[86,20],[114,20],[130,12],[172,26],[196,170],[172,178],[152,74],[156,190],[44,190],[48,74],[28,178],[4,170],[28,26]],
                lines: [[[86,20],[94,38],[100,28],[106,38],[114,20]], [[100,38],[100,190]]], buttons: [[104,60],[104,90],[104,120]] },
  kurta:      { body: [[70,10],[86,18],[114,18],[130,10],[170,24],[192,140],[170,146],[152,70],[162,198],[38,198],[48,70],[30,146],[8,140],[30,24]],
                lines: [[[86,18],[100,44],[114,18]], [[100,44],[100,90]], [[40,186],[160,186]]] },
  jeans:      { body: [[52,6],[148,6],[152,38],[178,196],[112,196],[100,72],[88,196],[22,196],[48,38]], lines: [[[50,22],[150,22]], [[100,22],[100,64]], [[60,30],[72,46]]] },
  trousers:   { body: [[54,6],[146,6],[150,36],[176,196],[114,196],[100,70],[86,196],[24,196],[50,36]], lines: [[[52,22],[148,22]], [[76,30],[66,196]], [[124,30],[134,196]]] },
  joggers:    { body: [[54,6],[146,6],[154,40],[168,182],[160,196],[114,196],[108,182],[100,72],[92,182],[86,196],[40,196],[32,182],[46,40]], lines: [[[52,22],[148,22]], [[36,180],[86,182]], [[114,182],[164,180]]] },
  shorts:     { body: [[52,6],[148,6],[156,40],[168,112],[106,118],[100,64],[94,118],[32,112],[44,40]], lines: [[[50,22],[150,22]], [[100,22],[100,56]], [[36,104],[94,108]], [[106,108],[164,104]]] },
  miniskirt:  { body: [[60,8],[140,8],[172,116],[28,116]], lines: [[[60,24],[140,24]]] },
  midiskirt:  { body: [[62,8],[138,8],[180,182],[20,182]], lines: [[[62,24],[138,24]], [[84,30],[68,180]], [[116,30],[132,180]]] },
  pleated:    { body: [[58,8],[142,8],[176,126],[24,126]], lines: [[[58,24],[142,24]], [[78,26],[56,124]], [[100,26],[100,124]], [[122,26],[144,124]]] },
  dress:      { body: [[74,6],[86,28],[114,28],[126,6],[140,10],[142,72],[186,196],[14,196],[58,72],[60,10]], lines: [[[60,72],[140,72]]] },
  trench:     { body: [[70,6],[100,44],[130,6],[176,20],[198,168],[172,176],[154,70],[162,198],[38,198],[46,70],[28,176],[2,168],[24,20]],
                lines: [[[100,44],[100,198]], [[48,104],[152,104]], [[70,6],[84,64],[100,44]], [[130,6],[116,64],[100,44]]], buttons: [[88,80],[112,80],[88,130],[112,130]] },
  coat:       { body: [[72,6],[100,40],[128,6],[176,22],[196,176],[170,182],[154,72],[160,198],[40,198],[46,72],[30,182],[4,176],[24,22]],
                lines: [[[100,40],[100,198]], [[72,6],[86,56],[100,40]], [[128,6],[114,56],[100,40]]], buttons: [[108,90],[108,130],[108,170]] },
  puffer:     { body: [[66,8],[134,8],[180,26],[198,150],[172,158],[156,74],[160,166],[40,166],[44,74],[28,158],[2,150],[20,26]],
                lines: [[[100,10],[100,166]], [[44,60],[156,60]], [[44,94],[156,94]], [[42,128],[158,128]], [[10,96],[40,92]], [[160,92],[190,96]]] },
  blazer:     { body: [[70,6],[100,52],[130,6],[174,20],[196,166],[170,172],[152,70],[156,166],[44,166],[48,70],[30,172],[4,166],[26,20]],
                lines: [[[100,52],[100,166]], [[70,6],[82,74],[100,52]], [[130,6],[118,74],[100,52]], [[56,120],[82,120]]], buttons: [[106,104],[106,132]] },
  leather:    { body: [[70,8],[130,8],[176,22],[196,138],[172,144],[154,70],[156,132],[44,132],[46,70],[28,144],[4,138],[24,22]],
                lines: [[[96,10],[110,132]], [[70,8],[88,50],[96,30]], [[130,8],[116,50],[104,30]], [[46,118],[154,118]]] },
  denimjacket:{ body: [[70,8],[130,8],[176,22],[196,138],[172,144],[154,70],[156,132],[44,132],[46,70],[28,144],[4,138],[24,22]],
                lines: [[[100,10],[100,132]], [[52,52],[90,52]], [[110,52],[148,52]], [[46,116],[154,116]], [[70,8],[86,36],[100,24],[114,36],[130,8]]], buttons: [[106,70],[106,96]] },
  raincoat:   { body: [[72,6],[100,40],[128,6],[176,22],[196,176],[170,182],[154,72],[160,198],[40,198],[46,72],[30,182],[4,176],[24,22]], lines: [[[100,40],[100,198]]], buttons: [[108,90],[108,130],[108,170]] },
  // shoes, bags and accessories (single pieces; shoes are drawn as a pair)
  sneakers:   { body: [[8,62],[12,30],[40,26],[58,44],[96,52],[102,72],[8,74]], lines: [[[8,66],[102,66]], [[34,34],[48,46]], [[40,30],[54,42]]], pair: true },
  loafers:    { body: [[6,58],[14,40],[60,38],[96,50],[100,66],[8,68]], lines: [[[40,44],[62,46]]], pair: true },
  flats:      { body: [[6,56],[16,40],[70,38],[98,50],[98,62],[8,64]], lines: [], bowtie: [52,46], pair: true },
  maryjanes:  { body: [[6,58],[14,40],[64,38],[96,50],[100,66],[8,68]], lines: [[[30,40],[56,40]]], pair: true },
  sandals:    { body: [[6,66],[100,60],[100,70],[8,74]], lines: [[[20,64],[44,40],[72,62]], [[50,40],[80,62]]], pair: true },
  ankleboots: { body: [[24,6],[60,6],[62,62],[96,70],[100,96],[18,96],[22,58]], lines: [[[18,88],[100,88]]], pair: true },
  boots:      { body: [[24,0],[62,0],[64,74],[96,82],[100,104],[18,104],[22,62]], lines: [[[18,96],[100,96]]], pair: true },
  cowboy:     { body: [[22,0],[62,0],[60,70],[104,84],[110,100],[24,100],[16,70]], lines: [[[28,20],[42,44],[56,20]], [[30,50],[54,52]], [[24,92],[106,94]]], pair: true },
  rainboots:  { body: [[22,0],[62,0],[64,76],[94,82],[98,104],[16,104],[20,60]], lines: [[[20,10],[64,10]], [[16,96],[98,96]]], pair: true },
  tote:       { body: [[20,60],[180,60],[168,196],[32,196]], lines: [[[60,60],[64,14],[96,4],[132,12],[140,60]]] },
  shoulder:   { body: [[20,80],[180,80],[176,170],[24,170]], lines: [[[20,80],[60,10],[140,10],[180,80]], [[20,108],[180,108]]], buttons: [[100,122]] },
  backpack:   { body: [[40,40],[160,40],[176,80],[172,196],[28,196],[24,80]], lines: [[[80,40],[86,12],[114,12],[120,40]], [[46,110],[154,110]], [[56,110],[56,180],[144,180],[144,110]]] },
  sunglasses: { body: [[10,30],[78,30],[74,70],[18,70]], body2: [[122,30],[190,30],[182,70],[126,70]], lines: [[[78,38],[100,30],[122,38]]] },
  bow:        { body: [[100,50],[20,10],[10,80],[100,60]], body2: [[100,50],[180,10],[190,80],[100,60]], lines: [[[96,58],[70,130]], [[104,58],[132,130]]], knot: [100,55] },
  hoops:      { ring: true },
  scarf:      { body: [[20,20],[180,40],[176,80],[60,70],[70,196],[30,196],[24,70]], lines: [[[30,190],[30,200]], [[44,190],[44,202]], [[58,190],[58,202]]] },
  beanie:     { body: [[30,120],[34,60],[64,22],[136,22],[166,60],[170,120]], lines: [[[26,96],[174,96]]], pompom: [100,14] },
  umbrella:   { body: [[10,90],[40,30],[100,10],[160,30],[190,90],[160,80],[130,92],[100,80],[70,92],[40,80]], lines: [[[100,80],[100,186],[88,196],[78,186]]] },
  catears:    { body: [[20,120],[40,40],[80,96],[120,96],[160,40],[180,120],[150,110],[100,104],[50,110]], lines: [] },
  clip:       { body: [[20,60],[60,20],[140,20],[180,60],[160,90],[40,90]], lines: [[[60,50],[60,90]], [[100,40],[100,90]], [[140,50],[140,90]]] },
};

/* ── drawing helpers ── */
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
function wobble(points, closed, r, amt = 1.6) {
  const pts = [];
  const list = closed ? [...points, points[0]] : points;
  for (let i = 0; i < list.length - 1; i++) {
    const [x1, y1] = list[i], [x2, y2] = list[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1), steps = Math.max(1, Math.round(len / 16));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, j = s === 0 ? 0.4 : 1;
      pts.push([x1 + (x2 - x1) * t + (r() - 0.5) * amt * 2 * j, y1 + (y2 - y1) * t + (r() - 0.5) * amt * 2 * j]);
    }
  }
  if (!closed) pts.push([list[list.length - 1][0] + (r() - 0.5) * amt, list[list.length - 1][1] + (r() - 0.5) * amt]);
  return smooth(pts, closed);
}
function smooth(p, closed) {                     // Catmull-Rom through the points
  const n = p.length, get = (i) => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (closed ? "Z" : "");
}
const lum = (hex) => { const v = parseInt(hex.slice(1), 16); return (0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255; };
const shade = (hex, f) => { const v = parseInt(hex.slice(1), 16); const c = [v >> 16, (v >> 8) & 255, v & 255].map(x => Math.round(Math.min(255, Math.max(0, f < 0 ? x * (1 + f) : x + (255 - x) * f)))); return "#" + c.map(x => x.toString(16).padStart(2, "0")).join(""); };

let uid = 0;
function patternDef(defs, kind, base) {
  const id = `pt${++uid}`;
  const ink = lum(base) > 0.6 ? shade(base, -0.45) : shade(base, 0.6);
  const p = el("pattern", { id, patternUnits: "userSpaceOnUse", width: 18, height: 18 }, defs);
  const add = (t, a) => el(t, a, p);
  if (kind === "dots") { p.setAttribute("width", 20); p.setAttribute("height", 20); add("circle", { cx: 5, cy: 5, r: 2.6, fill: lum(base) > 0.6 ? "#2E2A3A" : "#FFFFFF" }); add("circle", { cx: 15, cy: 15, r: 2.6, fill: lum(base) > 0.6 ? "#2E2A3A" : "#FFFFFF" }); }
  if (kind === "stripes") { p.setAttribute("height", 16); add("rect", { x: 0, y: 0, width: 18, height: 6, fill: "#FFFFFF", opacity: 0.9 }); }
  if (kind === "plaid") { p.setAttribute("width", 28); p.setAttribute("height", 28); add("rect", { x: 0, y: 10, width: 28, height: 6, fill: ink, opacity: 0.35 }); add("rect", { x: 10, y: 0, width: 6, height: 28, fill: ink, opacity: 0.35 }); add("rect", { x: 0, y: 22, width: 28, height: 1.5, fill: "#F6D58E", opacity: 0.8 }); add("rect", { x: 22, y: 0, width: 1.5, height: 28, fill: "#F6D58E", opacity: 0.8 }); }
  if (kind === "floral") { p.setAttribute("width", 26); p.setAttribute("height", 26); for (const [cx, cy, c] of [[6, 7, "#FFFFFF"], [19, 19, "#F2B8C6"]]) { for (let k = 0; k < 5; k++) { const a = k * 1.256; add("circle", { cx: cx + Math.cos(a) * 2.6, cy: cy + Math.sin(a) * 2.6, r: 2, fill: c, opacity: 0.9 }); } add("circle", { cx, cy, r: 1.3, fill: "#E9A23B" }); } }
  if (kind === "sequin") { p.setAttribute("width", 10); p.setAttribute("height", 10); add("circle", { cx: 3, cy: 3, r: 2.4, fill: "#FFFFFF", opacity: 0.6 }); add("circle", { cx: 8, cy: 8, r: 2.4, fill: shade(base, -0.25), opacity: 0.6 }); }
  if (kind === "crochet") { p.setAttribute("width", 16); p.setAttribute("height", 16); add("path", { d: "M8 1 L15 8 L8 15 L1 8 Z", fill: "none", stroke: shade(base, -0.3), "stroke-width": 1.4 }); add("circle", { cx: 8, cy: 8, r: 1.6, fill: shade(base, -0.3) }); }
  if (kind === "embroidery") { p.setAttribute("width", 22); p.setAttribute("height", 22); add("circle", { cx: 11, cy: 11, r: 2.4, fill: "#F2C14E" }); add("path", { d: "M11 3 L11 7 M11 15 L11 19 M3 11 L7 11 M15 11 L19 11", stroke: "#F2C14E", "stroke-width": 1.2 }); }
  if (kind === "rainbow") { p.setAttribute("width", 200); p.setAttribute("height", 60); ["#E8545A", "#F29E4C", "#F6D58E", "#7CC08A", "#6FA8DC", "#9B7FD1"].forEach((c, i) => add("rect", { x: 0, y: 20 + i * 5, width: 200, height: 5, fill: c, opacity: 0.85 })); }
  return `url(#${id})`;
}

function piece(svg, defs, spec, color, pattern, x, y, s, rot, r) {
  const g = el("g", { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` }, svg);
  const copies = spec.pair ? [[0, 0], [16, 34]] : [[0, 0]];
  for (const [dx, dy] of copies) {
    const gg = el("g", { transform: `translate(${dx} ${dy})` }, g);
    const bodies = [spec.body, spec.body2].filter(Boolean);
    if (spec.ring) {                                  // hoops: two wobbly rings
      for (const cx of [60, 140]) {
        const pts = Array.from({ length: 14 }, (_, k) => [cx + Math.cos(k / 14 * 6.283) * 34, 100 + Math.sin(k / 14 * 6.283) * 40]);
        el("path", { d: wobble(pts, true, r, 1), fill: "none", stroke: color, "stroke-width": 9, "stroke-linecap": "round" }, gg);
        el("path", { d: wobble(pts, true, r, 1.4), fill: "none", stroke: INK, "stroke-width": 1.6, opacity: 0.8 }, gg);
      }
      continue;
    }
    for (const b of bodies) {
      const shifted = b.map(([px, py]) => [px + 4, py + 3]);
      // watercolour: a lighter wash, the colour, then the pattern, all a little off the line
      el("path", { d: wobble(shifted.map(([px, py]) => [px - 2, py + 2]), true, r, 2.4), fill: shade(color, 0.35), opacity: 0.55 }, gg);
      const fillPath = wobble(shifted, true, r, 1.8);
      el("path", { d: fillPath, fill: color, opacity: 0.92 }, gg);
      if (pattern) el("path", { d: fillPath, fill: patternDef(defs, pattern, color), opacity: pattern === "rainbow" ? 0.9 : 0.85 }, gg);
      // a soft shadow side, like a wet edge
      el("path", { d: fillPath, fill: "none", stroke: shade(color, -0.22), "stroke-width": 5, opacity: 0.18 }, gg);
      // ink, twice
      el("path", { d: wobble(b, true, r, 1.2), fill: "none", stroke: INK, "stroke-width": 2.1, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: 0.9 }, gg);
      el("path", { d: wobble(b, true, r, 1.8), fill: "none", stroke: INK, "stroke-width": 1, opacity: 0.45 }, gg);
    }
    for (const ln of spec.lines || []) el("path", { d: wobble(ln, false, r, 1.1), fill: "none", stroke: INK, "stroke-width": 1.5, "stroke-linecap": "round", opacity: 0.75 }, gg);
    if (spec.ribs) for (let k = 0; k < 9; k++) el("path", { d: wobble([[54 + k * 11, 178], [54 + k * 11, 188]], false, r, 0.6), stroke: INK, "stroke-width": 1, opacity: 0.5 }, gg);
    for (const [bx, by] of spec.buttons || []) el("circle", { cx: bx, cy: by, r: 3.6, fill: "#F4ECDD", stroke: INK, "stroke-width": 1.3 }, gg);
    if (spec.bowtie) el("path", { d: wobble([[spec.bowtie[0] - 8, spec.bowtie[1] - 5], [spec.bowtie[0] + 8, spec.bowtie[1] + 5], [spec.bowtie[0] + 8, spec.bowtie[1] - 5], [spec.bowtie[0] - 8, spec.bowtie[1] + 5]], true, r, 0.6), fill: shade(color, -0.3), stroke: INK, "stroke-width": 1.2 }, gg);
    if (spec.knot) el("circle", { cx: spec.knot[0], cy: spec.knot[1], r: 10, fill: shade(color, -0.15), stroke: INK, "stroke-width": 1.6 }, gg);
    if (spec.pompom) el("circle", { cx: spec.pompom[0], cy: spec.pompom[1], r: 16, fill: shade(color, 0.25), stroke: INK, "stroke-width": 1.6 }, gg);
  }
  return g;
}

/* where each slot sits on the flat-lay (600 x 640) */
const LAYOUT = {
  outer:  { x: 12,  y: 22,  s: 0.98, rot: -5 },
  top:    { x: 214, y: 18,  s: 0.96, rot: 3 },
  dress:  { x: 214, y: 18,  s: 1.18, rot: 2 },
  bottom: { x: 112, y: 232, s: 1.06, rot: -2 },
  bag:    { x: 372, y: 226, s: 0.84, rot: 7 },
  shoes:  { x: 352, y: 440, s: 1.22, rot: -8 },
  acc0:   { x: 432, y: 40,  s: 0.62, rot: -10 },
  acc1:   { x: 40,  y: 452, s: 0.72, rot: 9 },
};
// without a layer the top/dress moves to the left column and everything breathes
const SOLO = { top: { x: 96, y: 22, s: 1.08 }, dress: { x: 92, y: 14, s: 1.32 }, bottom: { x: 100, y: 254 } };

export function drawOutfit(svg, outfit, seed, { labels = true } = {}) {
  const r = rng("draw|" + seed);
  svg.innerHTML = "";
  svg.setAttribute("viewBox", "0 0 600 640");
  const defs = el("defs", {}, svg);
  const hasOuter = outfit.pieces.some(p => p.slot === "outer");
  let accIndex = 0;
  const order = ["outer", "bottom", "top", "dress", "bag", "shoes", "acc"];
  const sorted = [...outfit.pieces].sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
  const placed = [];
  for (const p of sorted) {
    const spec = SHAPES[p.type]; if (!spec) continue;
    let L = p.slot === "acc" ? LAYOUT["acc" + accIndex++] : LAYOUT[p.slot];
    if (!L) continue;
    L = { ...L };
    if (!hasOuter && SOLO[p.slot]) Object.assign(L, SOLO[p.slot]);
    if (p.slot === "dress" && !outfitHasBottomRoom(outfit)) L.s = Math.min(L.s, 1.3);
    const jitter = () => (r() - 0.5) * 10;
    piece(svg, defs, spec, p.color, p.pattern, L.x + jitter(), L.y + jitter(), L.s, L.rot + (r() - 0.5) * 6, r);
    placed.push({ p, L });
  }
  // doodles: a few sparkles + a heart, hand-inked
  const doodle = (d, x, y, s, fill) => { const g = el("g", { transform: `translate(${x} ${y}) scale(${s})` }, svg); el("path", { d, fill: fill || "none", stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round", "stroke-linecap": "round" }, g); };
  const SPARK = "M0 -12 C2 -3 3 -2 12 0 C3 2 2 3 0 12 C-2 3 -3 2 -12 0 C-3 -2 -2 -3 0 -12 Z";
  const HEART = "M0 6 C-10 -2 -8 -12 0 -6 C8 -12 10 -2 0 6 Z";
  doodle(SPARK, 560, 220, 1, "#F6D58E"); doodle(SPARK, 34, 300, 0.7, "#F6CFD3"); doodle(HEART, 380, 610, 1.3, "#F6CFD3"); doodle(SPARK, 330, 18, 0.6, "#FFFFFF");
  // handwritten notes on the two hero pieces
  if (labels) {
    const hero = placed.find(x => x.p.slot === "dress" || x.p.slot === "top");
    const shoe = placed.find(x => x.p.slot === "shoes");
    const note = (text, x, y, rot) => { const t = el("text", { x, y, transform: `rotate(${rot} ${x} ${y})`, class: "flat-note" }, svg); t.textContent = text; };
    if (hero) note(shortName(hero.p) + " ♡", Math.min(470, hero.L.x + hero.L.s * 150), hero.L.y + hero.L.s * 205 + 6, -4);
    if (shoe) note(shortName(shoe.p), shoe.L.x + 30, Math.min(632, shoe.L.y + 178), 3);
  }
}
const outfitHasBottomRoom = () => true;
const shortName = (p) => p.name.replace(/ \+ sheer tights/, "").split(" ").slice(-2).join(" ");
