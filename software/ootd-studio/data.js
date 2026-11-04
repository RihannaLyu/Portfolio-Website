// Cities, the calendar (holidays, festivals, campus life) and the trend board for OOTD Studio.

// climate: [mean daily high °C, seasonal swing °C, high-low gap °C, warmest month] — used only
// when the live forecast can't be reached, to give a "typical for this time of year" day.
export const CITIES = [
  { id: "austin",   name: "Austin",        lat: 30.27, lon: -97.74, tz: ["America/Chicago"], us: true, campus: "longhorns", climate: [26.5, 9, 11, 8] },
  { id: "nyc",      name: "New York",      lat: 40.71, lon: -74.01, tz: ["America/New_York", "America/Detroit"], us: true, climate: [17.5, 12, 8, 7] },
  { id: "la",       name: "Los Angeles",   lat: 34.05, lon: -118.24, tz: ["America/Los_Angeles"], us: true, climate: [23, 4, 9, 8] },
  { id: "chicago",  name: "Chicago",       lat: 41.88, lon: -87.63, tz: [], us: true, climate: [15, 14, 8, 7] },
  { id: "boston",   name: "Boston",        lat: 42.36, lon: -71.06, tz: [], us: true, climate: [15.5, 12.5, 8, 7] },
  { id: "miami",    name: "Miami",         lat: 25.76, lon: -80.19, tz: [], us: true, climate: [29, 3, 7, 8] },
  { id: "seattle",  name: "Seattle",       lat: 47.61, lon: -122.33, tz: [], us: true, climate: [16, 8.5, 7, 8] },
  { id: "sf",       name: "San Francisco", lat: 37.77, lon: -122.42, tz: [], us: true, climate: [19, 3, 8, 9] },
  { id: "toronto",  name: "Toronto",       lat: 43.65, lon: -79.38, tz: ["America/Toronto"], climate: [13, 14, 8, 7] },
  { id: "london",   name: "London",        lat: 51.51, lon: -0.13, tz: ["Europe/London", "Europe/Dublin"], climate: [15, 7, 7, 7] },
  { id: "paris",    name: "Paris",         lat: 48.86, lon: 2.35, tz: ["Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam"], climate: [16, 8.5, 8, 7] },
  { id: "tokyo",    name: "Tokyo",         lat: 35.68, lon: 139.69, tz: ["Asia/Tokyo"], climate: [20, 9, 7, 8] },
  { id: "seoul",    name: "Seoul",         lat: 37.57, lon: 126.98, tz: ["Asia/Seoul"], climate: [17.5, 13, 8, 8] },
  { id: "shanghai", name: "Shanghai",      lat: 31.23, lon: 121.47, tz: ["Asia/Shanghai", "Asia/Hong_Kong", "Asia/Taipei"], climate: [20.5, 11, 6, 7] },
  { id: "sydney",   name: "Sydney",        lat: -33.87, lon: 151.21, tz: ["Australia/Sydney", "Australia/Melbourne"], south: true, climate: [22, 4, 8, 1] },
];

export function guessCity() {
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
  return (CITIES.find(c => c.tz.includes(tz)) || CITIES[0]).id;
}

/* ── dates ── */
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const md = (d) => (d.getMonth() + 1) * 100 + d.getDate();          // e.g. Nov 4 -> 1104
const nthWeekday = (y, m, wd, n) => {                                // n-th weekday (0=Sun) of month m (1-12); n=-1 = last
  if (n > 0) { const d = new Date(y, m - 1, 1); const off = (wd - d.getDay() + 7) % 7; return new Date(y, m - 1, 1 + off + (n - 1) * 7); }
  const d = new Date(y, m, 0); const off = (d.getDay() - wd + 7) % 7; return new Date(y, m - 1, d.getDate() - off);
};
function easter(y) {                                                 // anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
// lunar / lunisolar festivals by year
const LUNAR = {
  lunarny:   { 2025: "2025-01-29", 2026: "2026-02-17", 2027: "2027-02-06", 2028: "2028-01-26", 2029: "2029-02-13", 2030: "2030-02-03" },
  midautumn: { 2025: "2025-10-06", 2026: "2026-09-25", 2027: "2027-09-15", 2028: "2028-10-03", 2029: "2029-09-22", 2030: "2030-09-12" },
  diwali:    { 2025: "2025-10-20", 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17", 2029: "2029-11-05", 2030: "2030-10-26" },
  holi:      { 2025: "2025-03-14", 2026: "2026-03-04", 2027: "2027-03-22", 2028: "2028-03-11", 2029: "2029-03-01", 2030: "2030-03-20" },
};

/* Every event carries a `look` key the outfit engine dresses for.
   kind: holiday | festival | campus | moment — shown as stickers. */
export function eventsFor(date, city) {
  const y = date.getFullYear(), k = md(date), key = ymd(date), dow = date.getDay();
  const out = [];
  const on = (d) => ymd(d) === key;
  const add = (name, kind, look, note) => out.push({ name, kind, look, note });

  // holidays
  if (k === 101) add("New Year's Day", "holiday", "newyear", "Fresh-start sparkle, brunch-friendly.");
  if (k === 1231) add("New Year's Eve", "holiday", "newyear", "Sequins, sparkle and a countdown.");
  if (k === 213) add("Galentine's Day", "holiday", "galentine", "Brunch with the girls: pink, bows, giggles.");
  if (k === 214) add("Valentine's Day", "holiday", "valentine", "Reds, pinks and a little bow.");
  if (k === 317) add("St. Patrick's Day", "holiday", "stpatrick", "Wear green or get pinched.");
  if (k === 401) add("April Fools'", "holiday", "playful", "A print that doesn't take itself seriously.");
  if (k === 422) add("Earth Day", "holiday", "earth", "Thrifted, earthy and green.");
  if (on(easter(y))) add("Easter", "holiday", "easter", "Pastels and a floral, egg hunt approved.");
  if (on(nthWeekday(y, 5, 0, 2)) ) add("Mother's Day", "holiday", "brunch", "Brunch with mom: soft florals.");
  if (k === 619 && city.us) add("Juneteenth", "holiday", "celebrate", "Celebrate in color.");
  if (k === 704 && city.us) add("Fourth of July", "holiday", "july4", "Red, white and denim blue.");
  if (k === 1031) add("Halloween", "holiday", "halloween", "Black, orange and cat ears.");
  if (k === 1225) add("Christmas", "holiday", "christmas", "Cozy red knit and a little plaid.");
  if (k === 1224) add("Christmas Eve", "holiday", "christmas", "Velvet-and-plaid cozy.");
  if (city.us && on(nthWeekday(y, 11, 4, 4))) add("Thanksgiving", "holiday", "thanksgiving", "Stretchy waist, warm autumn tones.");
  if (city.id === "toronto" && on(nthWeekday(y, 10, 1, 2))) add("Thanksgiving", "holiday", "thanksgiving", "Warm autumn tones.");
  for (const [look, table] of Object.entries(LUNAR)) {
    if (table[y] !== key) continue;
    if (look === "lunarny") add("Lunar New Year", "holiday", "lunarny", "Red and gold for luck.");
    if (look === "midautumn") add("Mid-Autumn Festival", "holiday", "midautumn", "Mooncakes, lanterns and silky gold.");
    if (look === "diwali") add("Diwali", "holiday", "diwali", "Festival of lights: jewel tones and gold.");
    if (look === "holi") add("Holi", "holiday", "holi", "All-white, ready for color.");
  }
  if ((date.getMonth() + 1) === 6) add("Pride Month", "moment", "pride", "A rainbow accent, all month.");

  // city festivals (approximate windows: they move a little each year)
  const win = (a, b) => k >= a && k <= b;
  const F = (name, look, note) => add(name, "festival", look, note);
  if (city.id === "austin" && win(308, 318)) F("SXSW season", "boho", "Badges, tacos and cowboy boots.");
  if (city.id === "austin" && win(1001, 1012) && (dow === 5 || dow === 6 || dow === 0)) F("ACL Fest weekend", "boho", "Zilker-ready: fringe and boots.");
  if (city.id === "la" && win(410, 421) && (dow === 5 || dow === 6 || dow === 0)) F("Coachella weekend", "boho", "Desert boho, sunnies on.");
  if (city.id === "chicago" && win(730, 803)) F("Lollapalooza", "boho", "Grant Park festival fit.");
  if (city.id === "sf" && win(807, 811)) F("Outside Lands", "boho", "Golden Gate Park layers.");
  if (city.id === "nyc" && (win(206, 214) || win(909, 917))) F("New York Fashion Week", "fashionweek", "Street-style season: be seen.");
  if (city.id === "london" && (win(219, 224) || win(917, 922))) F("London Fashion Week", "fashionweek", "Tailoring with a twist.");
  if (city.id === "paris" && (win(301, 310) || win(927, 1007))) F("Paris Fashion Week", "fashionweek", "Effortless and chic.");
  if ((city.id === "tokyo" || city.id === "seoul") && win(325, 410)) F("Cherry blossom season", "blossom", "Pink petals, picnic blanket.");
  if (city.id === "shanghai" && win(325, 405)) F("Spring blossom season", "blossom", "Pink petals along the river.");
  if (city.id === "sydney" && win(527, 615)) F("Vivid Sydney", "nightout", "Light shows by the harbour.");
  if (city.id === "sydney" && win(215, 302)) F("Mardi Gras season", "pride", "Glitter and rainbows.");
  if (city.id === "boston" && win(1016, 1020)) F("Head of the Charles", "preppy", "Riverside preppy layers.");
  if (city.id === "miami" && win(1201, 1208)) F("Art Basel week", "fashionweek", "Gallery-hopping chic.");
  if (city.id === "toronto" && win(904, 914)) F("TIFF", "fashionweek", "Red-carpet adjacent.");

  // campus life (college girl calendar)
  const C = (name, look, note) => add(name, "campus", look, note);
  const month = date.getMonth() + 1;
  if (!city.south) {
    if (win(817, 831)) C("Back to school", "backtoschool", "First-week fit: cute but walkable.");
    if (win(1207, 1218) || win(504, 515)) C("Finals season", "finals", "Library-ready comfort.");
    if (win(309, 320)) C("Spring break", "springbreak", "Out-of-office energy.");
    if (win(516, 524)) C("Graduation season", "graduation", "Caps, gowns and a white dress.");
    if (city.us && dow === 6 && month >= 9 && month <= 11) C("Game day", "gameday", city.campus === "longhorns" ? "Burnt orange, hook 'em." : "Team colors on.");
  }
  if (!out.some(e => e.kind !== "moment")) {
    if (dow === 5 || dow === 6) C(dow === 5 ? "Friday night" : "Saturday night", "nightout", "Something to dance in.");
    else if (dow === 0) C("Sunday brunch", "brunch", "Mimosa-level effort.");
    else C("Class day", "class", "Cute, comfy, backpack-friendly.");
  }
  return out;
}

export function seasonFor(date, city) {
  let m = date.getMonth();                         // 0-11
  if (city.south) m = (m + 6) % 12;
  return ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "fall", "fall", "fall", "winter"][m];
}

/* The trend board: aesthetics that rotate week by week (inspiration, not data). */
export const TRENDS = [
  { name: "Butter yellow", seasons: ["spring", "summer"], colors: ["#F3DE8A", "#FFF6D8"], note: "Soft yellow everything." },
  { name: "Ballet-core", seasons: ["spring", "fall", "winter"], colors: ["#F6CFD3", "#FBEFF0"], note: "Wrap tops, flats and a slick bun." },
  { name: "Coquette bows", seasons: ["spring", "summer", "fall", "winter"], colors: ["#F2B8C6", "#FFF8F4"], bow: true, note: "A bow on it. Any it." },
  { name: "Mocha mousse", seasons: ["fall", "winter"], colors: ["#8B6A55", "#D9C2AE"], note: "Coffee-colored and creamy." },
  { name: "Cherry red", seasons: ["fall", "winter", "spring"], colors: ["#B3263E", "#F4E6DC"], note: "One cherry-red hit." },
  { name: "Quiet luxury", seasons: ["fall", "winter", "spring"], colors: ["#C9B79C", "#EFE7DA"], note: "Camel, cream, no logos." },
  { name: "Y2K denim", seasons: ["spring", "summer", "fall"], colors: ["#7FA3C8", "#E9EEF5"], note: "Low-rise energy, baby tee." },
  { name: "Western revival", seasons: ["spring", "fall", "summer"], colors: ["#B07A4F", "#F1E3CF"], cowboy: true, note: "Boots with everything." },
  { name: "Polka dot", seasons: ["spring", "summer"], colors: ["#2E2A3A", "#FFFFFF"], dots: true, note: "Dots are back on." },
  { name: "Sage & cream", seasons: ["spring", "summer", "fall"], colors: ["#A9BFA0", "#F3EFE2"], note: "Calm, clean, green." },
  { name: "Preppy plaid", seasons: ["fall", "winter"], colors: ["#3D4F7A", "#C8A15A"], plaid: true, note: "Library chic: a little plaid." },
  { name: "Lavender haze", seasons: ["spring", "summer", "winter"], colors: ["#C7B6E6", "#F3EEFA"], note: "Dreamy lilac layers." },
  { name: "Tennis-core", seasons: ["summer", "spring"], colors: ["#FFFFFF", "#9CC5A1"], note: "Pleats and a crisp white." },
  { name: "Burgundy everything", seasons: ["fall", "winter"], colors: ["#6E2335", "#E8D3C7"], note: "Deep wine from head to toe." },
];
