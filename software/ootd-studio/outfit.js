// The outfit engine: day + city + weather -> one complete look, with the reasons behind it.
// Seeded by date + city (+ a shuffle count), so "today's outfit" stays the same all day.
import { eventsFor, seasonFor, TRENDS } from "./data.js";

export function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

/* colour names, so the pieces read like a shopping list */
const N = {
  cream: ["#F4ECDD", "cream"], white: ["#FFFFFF", "white"], black: ["#2A2629", "black"], denim: ["#7D9CC4", "light-wash"],
  dark: ["#3E5778", "dark-wash"], camel: ["#C49A6C", "camel"], grey: ["#B7B2B4", "heather grey"], brown: ["#6B4A38", "chocolate"],
  navy: ["#2F3B5C", "navy"], gold: ["#D4A64A", "gold"], silver: ["#C9CDD3", "silver"], tan: ["#D8B48C", "tan"],
};
const C = (hex, name) => ({ hex, name });
const n = (k) => C(N[k][0], N[k][1]);

/* occasion recipes: palette (statement first), piece options per slot, title + caption */
const LOOKS = {
  valentine:   { pal: [C("#C93A4A", "cherry red"), C("#F2B8C6", "ballet pink")], top: ["blouse", "sweater"], bottom: ["miniskirt"], shoes: ["maryjanes"], bag: ["shoulder"], acc: ["bow", "hoops"], title: "Lover girl", cap: "Red lips, pink bow, big heart." },
  galentine:   { pal: [C("#F2B8C6", "strawberry milk"), C("#FFF5F2", "vanilla")], dress: ["dress"], shoes: ["maryjanes", "flats"], bag: ["shoulder"], acc: ["bow"], title: "Galentine's brunch", cap: "Pink on pink, waffles for the table." },
  stpatrick:   { pal: [C("#4F8A5B", "clover green"), n("cream")], top: ["tee", "sweater"], bottom: ["jeans"], shoes: ["sneakers"], bag: ["tote"], acc: ["clip"], title: "Lucky in green", cap: "No pinches today." },
  playful:     { pal: [C("#F6D58E", "lemon"), C("#C2416B", "berry")], top: ["tee"], bottom: ["miniskirt"], pattern: "dots", shoes: ["sneakers"], bag: ["shoulder"], acc: ["clip"], title: "Joke's on you", cap: "A print that grins back." },
  earth:       { pal: [C("#7E9A6B", "moss"), n("tan")], top: ["cardigan"], bottom: ["jeans"], shoes: ["sneakers"], bag: ["tote"], acc: ["clip"], title: "Thrift & thrive", cap: "Pre-loved and proud." },
  easter:      { pal: [C("#CDB8E8", "lilac"), C("#FFF1B8", "buttercup")], dress: ["dress"], pattern: "floral", shoes: ["flats"], bag: ["shoulder"], acc: ["bow"], title: "Spring pastels", cap: "Egg-hunt approved." },
  brunch:      { pal: [C("#F6CFD3", "blush"), n("cream")], dress: ["dress"], pattern: "floral", shoes: ["flats"], bag: ["shoulder"], acc: ["sunglasses"], title: "Brunch date", cap: "Mimosa-level effort." },
  celebrate:   { pal: [C("#E2873B", "marigold"), C("#2F7D6B", "jade")], dress: ["dress"], shoes: ["sandals"], bag: ["shoulder"], acc: ["hoops"], title: "Celebrate in color", cap: "Joy, worn out loud." },
  july4:       { pal: [C("#C2303F", "flag red"), n("white")], top: ["tee"], pattern: "stripes", bottom: ["shorts"], shoes: ["sneakers"], bag: ["tote"], acc: ["sunglasses"], title: "Stars & stripes", cap: "Fireworks at nine." },
  halloween:   { pal: [n("black"), C("#E07A2F", "pumpkin")], top: ["sweater", "tee"], bottom: ["miniskirt"], shoes: ["ankleboots"], bag: ["shoulder"], acc: ["catears"], title: "Spooky cute", cap: "Cat ears count as a costume." },
  thanksgiving:{ pal: [C("#B5562D", "rust"), C("#D9A441", "mustard")], top: ["sweater"], bottom: ["trousers"], shoes: ["loafers"], bag: ["shoulder"], acc: ["hoops"], title: "Grateful & cozy", cap: "Stretchy waist, second helping." },
  christmas:   { pal: [C("#B3263E", "holiday red"), C("#2F5E4A", "pine")], top: ["sweater"], bottom: ["pleated"], pattern: "plaid", shoes: ["maryjanes"], bag: ["shoulder"], acc: ["bow"], title: "Cozy holiday", cap: "Cocoa in hand." },
  newyear:     { pal: [C("#C9CDD3", "silver sequin"), n("black")], dress: ["dress"], pattern: "sequin", shoes: ["maryjanes"], bag: ["shoulder"], acc: ["hoops"], title: "Countdown sparkle", cap: "Ten, nine, eight…" },
  lunarny:     { pal: [C("#C8102E", "lucky red"), n("gold")], top: ["blouse"], bottom: ["midiskirt"], shoes: ["flats"], bag: ["shoulder"], acc: ["hoops"], title: "Lucky red", cap: "Red envelopes, red outfit." },
  midautumn:   { pal: [C("#E8C46B", "moon gold"), C("#F4ECDD", "silk cream")], top: ["blouse"], bottom: ["midiskirt"], shoes: ["flats"], bag: ["shoulder"], acc: ["hoops"], title: "Moonlight silk", cap: "Lanterns and mooncakes." },
  diwali:      { pal: [C("#B5246E", "fuchsia"), C("#E9A23B", "marigold")], top: ["kurta"], bottom: ["trousers"], pattern: "embroidery", shoes: ["sandals", "flats"], bag: ["shoulder"], acc: ["hoops"], title: "Festival of lights", cap: "Jewel tones that glow like diyas." },
  holi:        { pal: [n("white"), C("#F2B8C6", "gulal pink")], top: ["kurta"], bottom: ["trousers"], shoes: ["sneakers"], bag: ["tote"], acc: ["sunglasses"], title: "Ready for color", cap: "Wear white. Leave a rainbow." },
  pride:       { pal: [n("white"), C("#8E7CC3", "violet")], top: ["tee"], pattern: "rainbow", bottom: ["jeans"], shoes: ["sneakers"], bag: ["tote"], acc: ["sunglasses"], title: "Love wins", cap: "A little rainbow, a lot of pride." },
  gameday:     { pal: [C("#BF5700", "burnt orange"), n("white")], top: ["tee"], bottom: ["shorts", "miniskirt"], shoes: ["cowboy"], bag: ["shoulder"], acc: ["bow"], title: "Game day", cap: "Hook 'em, then tailgate." },
  boho:        { pal: [C("#F1E3CF", "ivory crochet"), C("#B07A4F", "saddle")], top: ["tank"], pattern: "crochet", bottom: ["shorts"], shoes: ["cowboy"], bag: ["shoulder"], acc: ["sunglasses"], title: "Festival girl", cap: "Fringe, boots, golden hour." },
  fashionweek: { pal: [n("black"), n("cream")], top: ["tee"], bottom: ["trousers", "miniskirt"], outer: ["blazer"], shoes: ["loafers"], bag: ["shoulder"], acc: ["sunglasses"], title: "Front row", cap: "Street-style season: be seen." },
  blossom:     { pal: [C("#F4C2CF", "sakura pink"), n("white")], top: ["cardigan"], bottom: ["midiskirt"], shoes: ["flats"], bag: ["tote"], acc: ["bow"], title: "Under the blossoms", cap: "Picnic blanket, petals in your hair." },
  nightout:    { pal: [n("black"), C("#C2416B", "berry")], dress: ["dress"], shoes: ["maryjanes", "ankleboots"], bag: ["shoulder"], acc: ["hoops"], title: "Night out", cap: "Something to dance in." },
  preppy:      { pal: [n("navy"), n("cream")], top: ["cardigan"], bottom: ["pleated"], pattern: "plaid", shoes: ["loafers"], bag: ["shoulder"], acc: ["bow"], title: "Preppy weekend", cap: "Riverside, cable knit." },
  backtoschool:{ pal: [C("#9CC5A1", "matcha"), n("denim")], top: ["tee"], bottom: ["jeans"], shoes: ["sneakers"], bag: ["backpack"], acc: ["clip"], title: "First day fit", cap: "Cute, but you'll walk 12k steps." },
  finals:      { pal: [n("grey"), C("#F6CFD3", "blush")], top: ["sweatshirt"], bottom: ["joggers"], shoes: ["sneakers"], bag: ["tote"], acc: ["clip"], title: "Library girl", cap: "Comfy enough for a 3-hour study block." },
  springbreak: { pal: [C("#F7B9A0", "coral"), n("white")], dress: ["dress"], shoes: ["sandals"], bag: ["tote"], acc: ["sunglasses"], title: "Out of office", cap: "Auto-reply: on vacation." },
  graduation:  { pal: [n("white"), n("gold")], dress: ["dress"], shoes: ["maryjanes"], bag: ["shoulder"], acc: ["hoops"], title: "Grad girl", cap: "Cap, gown, white dress, tears." },
  class:       { pal: null, top: ["tee", "blouse", "sweater", "longsleeve"], bottom: ["jeans", "miniskirt", "midiskirt", "trousers"], shoes: ["sneakers", "flats", "loafers"], bag: ["backpack", "tote"], acc: ["clip", "bow", "hoops"], title: "Campus cute", cap: "Cute, comfy, backpack-friendly." },
};

const NOUN = {
  tee: "baby tee", tank: "tank", blouse: "blouse", sweater: "knit sweater", cardigan: "cardigan", longsleeve: "long-sleeve top",
  kurta: "kurta", sweatshirt: "crewneck sweatshirt",
  jeans: "wide-leg jeans", trousers: "trousers", shorts: "denim shorts", miniskirt: "mini skirt", midiskirt: "midi skirt",
  pleated: "pleated skirt", joggers: "joggers", dress: "mini dress",
  trench: "trench coat", coat: "wool coat", puffer: "puffer jacket", blazer: "blazer", leather: "leather jacket", denimjacket: "denim jacket", raincoat: "raincoat",
  sneakers: "sneakers", loafers: "loafers", boots: "knee boots", ankleboots: "ankle boots", cowboy: "cowboy boots", flats: "ballet flats",
  maryjanes: "Mary Janes", sandals: "strappy sandals", rainboots: "rain boots",
  tote: "canvas tote", shoulder: "shoulder bag", backpack: "mini backpack",
  sunglasses: "sunnies", bow: "hair bow", hoops: "gold hoops", scarf: "chunky scarf", beanie: "knit beanie", umbrella: "umbrella", catears: "cat-ear headband", clip: "claw clip",
};
const PATTERN_WORD = { dots: "polka-dot", stripes: "striped", plaid: "plaid", floral: "floral", sequin: "sequin", crochet: "crochet", embroidery: "embroidered", rainbow: "rainbow-stripe" };

/* weather bands from the day's high, in °C */
export function band(hi, rain, code) {
  const snow = code >= 71 && code <= 86 && !(code >= 80 && code <= 82);
  const wet = rain >= 50 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const t = hi >= 28 ? "hot" : hi >= 21 ? "warm" : hi >= 15 ? "mild" : hi >= 8 ? "cool" : "cold";
  return { t, wet, snow };
}

export function buildOutfit({ date, city, weather, shuffle = 0 }) {
  const r = rng(`${date.toDateString()}|${city.id}|${shuffle}`);
  const events = eventsFor(date, city);
  const season = seasonFor(date, city);
  const main = events.find(e => e.kind !== "moment") || events[0];
  const look = LOOKS[main.look] || LOOKS.class;
  const pride = events.find(e => e.look === "pride");

  // the week's trend, from the ones that suit the season
  const weekNo = Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 6048e5);
  const pool = TRENDS.filter(t => t.seasons.includes(season));
  const trend = pool[(weekNo + (shuffle ? Math.floor(r() * pool.length) : 0)) % pool.length];

  const w = band(weather.hi, weather.rain, weather.code);

  // palette: the occasion's colours, or the trend's, plus a season neutral
  const seasonNeutral = { winter: [n("cream"), n("navy")], spring: [n("white"), n("cream")], summer: [n("white"), n("denim")], fall: [n("camel"), n("cream")] }[season];
  const trendPal = [C(trend.colors[0], trend.name.toLowerCase().replace(/ & .*| everything|-core| revival| haze/, "")), C(trend.colors[1], "soft " + (season === "fall" || season === "winter" ? "ivory" : "white"))];
  let pal = look.pal ? [...look.pal] : trendPal;
  if (main.look === "gameday" && city.campus !== "longhorns") pal = [n("navy"), n("white")];
  const accent = pal[0], second = pal[1] || seasonNeutral[0];
  const neutral = pick(r, seasonNeutral);

  let pattern = look.pattern || null;
  if (!look.pal && trend.dots) pattern = "dots";
  if (!look.pal && trend.plaid) pattern = "plaid";
  if (pride && !pattern) pattern = "rainbow";

  const pieces = [];
  const piece = (slot, type, col, pat) => pieces.push({ slot, type, color: col.hex, colorName: col.name, pattern: pat || null });

  // 1. the base: a dress, or a top + bottom
  let useDress = !!look.dress;
  if (look === LOOKS.class && (w.t === "hot" || w.t === "warm") && r() < 0.3) useDress = true;
  if (useDress && (w.t === "cold") && main.kind === "campus") useDress = false;

  if (useDress) {
    piece("dress", "dress", accent, pattern);
  } else {
    let top = pick(r, look.top || ["tee"]);
    if ((w.t === "cool" || w.t === "cold") && (top === "tee" || top === "tank")) top = main.look === "gameday" ? "longsleeve" : "sweater";
    if (w.t === "hot" && (top === "sweater" || top === "sweatshirt" || top === "cardigan")) top = top === "cardigan" ? "tank" : "tee";
    let bottom = pick(r, look.bottom || ["jeans"]);
    if ((w.t === "cool" || w.t === "cold" || w.snow) && bottom === "shorts") bottom = "jeans";
    if (w.t === "hot" && (bottom === "jeans" || bottom === "trousers") && main.look !== "diwali" && main.look !== "holi") bottom = pick(r, ["shorts", "miniskirt"]);
    const topPattern = pattern && pattern !== "plaid" ? pattern : null;
    const bottomPattern = pattern === "plaid" ? "plaid" : null;
    piece("top", top, accent, topPattern);
    const denimish = bottom === "jeans" || bottom === "shorts";
    const bCol = main.look === "halloween" || main.look === "nightout" ? n("black")
      : main.look === "holi" ? n("white")
      : main.look === "diwali" ? second
      : denimish ? (season === "fall" || season === "winter" ? n("dark") : n("denim"))
      : bottom === "pleated" && pattern === "plaid" ? second
      : (look.pal ? second : neutral);
    piece("bottom", bottom, bCol, bottomPattern);
  }

  // 2. the layer the weather asks for
  let outer = look.outer ? pick(r, look.outer) : null;
  if (w.wet && w.t !== "hot") outer = w.t === "cold" ? "coat" : "trench";
  else if (w.snow || w.t === "cold") outer = pick(r, ["coat", "puffer"]);
  else if (w.t === "cool") outer = outer || pick(r, ["trench", "leather", "blazer"]);
  else if (w.t === "mild") outer = outer || pick(r, ["denimjacket", "cardigan-layer", "leather", "blazer"]);
  else if (!look.outer) outer = null;
  if (outer === "cardigan-layer") outer = pieces.some(p => p.type === "cardigan") ? "denimjacket" : "cardigan";
  if (outer) {
    const oCol = outer === "denimjacket" ? n("denim") : outer === "leather" ? n("black")
      : outer === "trench" ? n("tan") : outer === "puffer" ? pick(r, [n("cream"), n("black"), second])
      : outer === "coat" ? pick(r, [n("camel"), n("grey"), n("black")]) : outer === "cardigan" ? second : pick(r, [n("black"), n("camel"), n("cream")]);
    piece("outer", outer, oCol);
  }

  // 3. shoes, bag, accessories
  let shoes = pick(r, look.shoes || ["sneakers"]);
  if (w.snow || (w.t === "cold" && shoes !== "cowboy")) shoes = "boots";
  else if (w.wet) shoes = "rainboots";
  else if (w.t === "hot" && (shoes === "loafers" || shoes === "maryjanes") && main.kind === "campus") shoes = "sandals";
  if (!look.pal && trend.cowboy && !w.wet && !w.snow) shoes = "cowboy";
  const sCol = shoes === "cowboy" ? n("tan") : shoes === "rainboots" ? pick(r, [C("#E9C46A", "sunny yellow"), n("black"), C("#9CC5A1", "sage")])
    : shoes === "sneakers" ? n("white") : shoes === "sandals" ? n("tan") : shoes === "boots" || shoes === "ankleboots" ? pick(r, [n("black"), n("brown")])
    : pick(r, [n("black"), n("brown"), second]);
  piece("shoes", shoes, sCol);

  const bag = pick(r, look.bag || ["tote"]);
  piece("bag", bag, bag === "tote" ? n("cream") : pick(r, [n("brown"), n("black"), second, n("camel")]));

  const accs = [];
  let a1 = pick(r, look.acc || ["clip"]);
  if (!look.pal && trend.bow) a1 = "bow";
  accs.push(a1);
  if (w.wet) accs.push("umbrella");
  else if (w.snow || w.t === "cold") accs.push(r() < 0.5 ? "scarf" : "beanie");
  else if ((w.t === "hot" || w.t === "warm") && weather.rain < 30 && !accs.includes("sunglasses")) accs.push("sunglasses");
  for (const a of [...new Set(accs)].slice(0, 2)) {
    const aCol = a === "hoops" ? n("gold") : a === "bow" ? accent : a === "umbrella" ? pick(r, [C("#F6CFD3", "blush"), C("#F6D58E", "butter")]) : a === "sunglasses" ? n("black")
      : a === "catears" ? n("black") : a === "scarf" || a === "beanie" ? pick(r, [second, n("cream"), C("#B3263E", "cherry")]) : C("#B07A4F", "tortoise");
    piece("acc", a, aCol);
  }

  // names, read like a list
  pieces.forEach(p => {
    const pat = p.pattern ? PATTERN_WORD[p.pattern] + " " : "";
    let noun = NOUN[p.type] || p.type;
    if (p.type === "dress") noun = w.t === "hot" || w.t === "warm" ? (main.look === "nightout" ? "slip dress" : "sundress") : "mini dress";
    if (p.type === "pleated" && p.pattern === "plaid") noun = "pleated skirt";
    p.name = `${p.type === "hoops" ? "" : p.colorName + " "}${pat}${noun}`.replace(/\s+/g, " ").trim();
    if ((p.type === "miniskirt" || p.type === "pleated" || p.type === "dress") && (w.t === "cool" || w.t === "cold")) p.name += " + sheer tights";
  });

  // why it works
  const why = [];
  why.push(weatherLine(weather, w));
  if (main) why.push(main.note);
  if (pride && pride !== main) why.push(pride.note);
  if (!look.pal) why.push(`Trend pick: ${trend.name}. ${trend.note}`);
  else why.push(`Season: ${season}. Trend to try: ${trend.name.toLowerCase()}.`);

  const tip = pick(r, TIPS[w.wet ? "wet" : w.t]);
  return { title: look.title, caption: look.cap, events, season, trend, weatherBand: w, pieces, palette: [accent, second, neutral], why, tip };
}

function weatherLine(wx, w) {
  if (w.snow) return "Snow in the forecast: boots and a warm coat.";
  if (w.wet) return `${Math.round(wx.rain)}% chance of rain: a coat that shrugs it off, and boots for puddles.`;
  return {
    hot: "It's a scorcher: breathable and bare-armed.",
    warm: "Warm and easy: no jacket needed.",
    mild: "Mild with a breeze: bring a light layer.",
    cool: "Crisp out: a real jacket today.",
    cold: "Bundle up: layers, scarf, boots.",
  }[w.t];
}

const TIPS = {
  hot: ["Linen and cotton breathe; save the polyester for fall.", "SPF on your part line too.", "A claw clip is the hot-day hair hero."],
  warm: ["Tuck the front of your top for shape.", "One statement piece, everything else quiet.", "Roll your sleeves twice, not once."],
  mild: ["Tie your layer around your waist when the sun comes out.", "Match your bag to your shoes for an easy polish.", "Push your jacket sleeves up for a relaxed fit."],
  cool: ["Leave your jacket open so the outfit still shows.", "Tonal layers in one color family look expensive.", "Tights under a skirt keep it wearable to class."],
  cold: ["Heat-tech under the knit, nobody has to know.", "Scarf first, then the coat: it sits better.", "A pop of color in your beanie saves a dark outfit."],
  wet: ["Cuff your jeans above the boot.", "A nylon tote survives a downpour.", "Bring a spare pair of socks in your bag."],
};
