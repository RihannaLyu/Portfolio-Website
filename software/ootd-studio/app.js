import { CITIES, guessCity } from "./data.js";
import { buildOutfit } from "./outfit.js";
import { drawOutfit } from "./draw.js";
import { forecast, addDays, toUnit, sky, skyIcon, SKY_WORD } from "./weather.js";
import { startSilk } from "../color-studio/silk.js";

const $ = (s) => document.querySelector(s);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/* theme (same toggle as Color Studio) */
const themeBtn = $("#themeToggle");
const syncTheme = () => {
  const dark = document.documentElement.dataset.theme === "dark";
  themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
};
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  store.set("ootd-theme", next);
  syncTheme(); silk.redraw();
});
syncTheme();
const silk = startSilk($("#silk"));

/* state */
const state = {
  city: CITIES.find(c => c.id === store.get("ootd-city")) || CITIES.find(c => c.id === guessCity()),
  unit: store.get("ootd-unit") || null,
  day: 0,
  shuffles: {},
  wx: [],
  outfits: [],
};
const unit = () => state.unit || (state.city.us ? "F" : "C");
const DAY = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const SHORT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const MONTHDAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/* city menu */
const cityBtn = $("#cityBtn"), cityMenu = $("#cityMenu");
CITIES.forEach(c => {
  const b = document.createElement("button");
  b.type = "button"; b.role = "option"; b.dataset.id = c.id; b.textContent = c.name;
  b.addEventListener("click", () => { setCity(c.id); closeMenu(); cityBtn.focus(); });
  cityMenu.appendChild(b);
});
const closeMenu = () => { cityMenu.hidden = true; cityBtn.setAttribute("aria-expanded", "false"); };
cityBtn.addEventListener("click", () => {
  const open = cityMenu.hidden;
  cityMenu.hidden = !open; cityBtn.setAttribute("aria-expanded", String(open));
  if (open) (cityMenu.querySelector('[aria-selected="true"]') || cityMenu.firstChild).focus();
});
document.addEventListener("click", (e) => { if (!cityMenu.hidden && !e.target.closest(".city-wrap")) closeMenu(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !cityMenu.hidden) { closeMenu(); cityBtn.focus(); } });

function setCity(id) {
  state.city = CITIES.find(c => c.id === id);
  store.set("ootd-city", id);
  state.day = 0; state.shuffles = {};
  load();
}

/* units */
document.querySelectorAll(".units button").forEach(b => b.addEventListener("click", () => {
  state.unit = b.dataset.unit; store.set("ootd-unit", state.unit); renderAll(false);
}));

/* load the forecast, then dress every day of the week */
async function load() {
  $("#cityName").textContent = state.city.name;
  cityMenu.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.id === state.city.id)));
  state.wx = await forecast(state.city, 7);
  renderAll(true);
}

function outfitFor(i) {
  const date = addDays(new Date(), i);
  return { date, outfit: buildOutfit({ date, city: state.city, weather: state.wx[i], shuffle: state.shuffles[i] || 0 }) };
}

function renderAll(animate) {
  document.querySelectorAll(".units button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.unit === unit())));
  state.outfits = state.wx.map((_, i) => outfitFor(i));
  renderWeek();
  renderLook(animate);
}

function temp(c) { return `${toUnit(c, unit())}°`; }

function renderLook(animate) {
  const { date, outfit } = state.outfits[state.day];
  const wx = state.wx[state.day];
  const kind = sky(wx.code, wx.rain);
  const isToday = state.day === 0;

  $("#heroDay").firstChild.nodeValue = isToday ? "today" : DAY.format(date);
  $("#dayName").textContent = isToday ? `Today · ${MONTHDAY.format(date)}` : `${DAY.format(date)} · ${MONTHDAY.format(date)}`;
  $("#wx").innerHTML = `${skyIcon(kind)} ${temp(wx.hi)} <small>/ ${temp(wx.lo)} · ${SKY_WORD[kind]}${wx.rain >= 20 ? ` · ${Math.round(wx.rain)}% rain` : ""}</small>`;
  $("#lookTitle").textContent = outfit.title;
  $("#lookCap").textContent = outfit.caption;

  const tags = $("#tags"); tags.innerHTML = "";
  const tag = (text, kind) => { const s = document.createElement("span"); s.textContent = text; s.dataset.kind = kind; tags.appendChild(s); };
  outfit.events.forEach(e => tag(e.name, e.kind));
  tag(`Trend: ${outfit.trend.name}`, "trend");
  tag(cap(outfit.season), "season");

  const list = $("#pieces"); list.innerHTML = "";
  const SLOT = { top: "top", bottom: "bottom", dress: "dress", outer: "layer", shoes: "shoes", bag: "bag", acc: "extra" };
  outfit.pieces.forEach((p, i) => {
    const li = document.createElement("li"); li.style.setProperty("--i", i);
    li.innerHTML = `<i style="background:${p.color}"></i><b></b><small>${SLOT[p.slot]}</small>`;
    li.querySelector("b").textContent = cap(p.name);
    list.appendChild(li);
  });
  const why = $("#why"); why.innerHTML = "";
  outfit.why.forEach(t => { const li = document.createElement("li"); li.textContent = t; why.appendChild(li); });
  $("#tip").textContent = outfit.tip;
  $("#source").textContent = wx.live
    ? `Weather: live forecast for ${state.city.name} (Open-Meteo).`
    : `Weather: typical ${outfit.season} day in ${state.city.name} (the live forecast couldn't load).`;

  const svg = $("#flat");
  drawOutfit(svg, outfit, `${date.toDateString()}|${state.city.id}|${state.shuffles[state.day] || 0}`);
  svg.setAttribute("aria-label", `Hand-drawn flat-lay: ${outfit.pieces.map(p => p.name).join(", ")}`);
  if (animate) { svg.classList.remove("is-new"); void svg.offsetWidth; svg.classList.add("is-new"); }
  $("#flatDate").textContent = `${outfit.title.toLowerCase()} · ${MONTHDAY.format(date).toLowerCase()}`;

  silk.setColors([outfit.palette[0].hex, outfit.palette[1].hex, "#F4E6DC", outfit.palette[2].hex, "#F6CFD3"].map(h => mix(h, "#FBF3EC", 0.35)));
}

function renderWeek() {
  const days = $("#days"); days.innerHTML = "";
  state.outfits.forEach(({ date, outfit }, i) => {
    const wx = state.wx[i];
    const b = document.createElement("button");
    b.type = "button"; b.className = "day"; b.setAttribute("aria-pressed", String(i === state.day));
    const ev = outfit.events.find(e => e.kind === "holiday" || e.kind === "festival") || outfit.events.find(e => e.look === "gameday");
    b.innerHTML = `<span class="dname">${i === 0 ? "Today" : SHORT.format(date)}</span><span class="ddate">${MONTHDAY.format(date)}</span>
      <svg class="mini" aria-hidden="true"></svg>
      <span class="dwx">${skyIcon(sky(wx.code, wx.rain))} ${temp(wx.hi)}</span>
      <span class="devent"></span>`;
    b.querySelector(".devent").textContent = ev ? ev.name : outfit.title;
    b.setAttribute("aria-label", `${i === 0 ? "Today" : DAY.format(date)}: ${outfit.title}`);
    drawOutfit(b.querySelector("svg"), outfit, `${date.toDateString()}|${state.city.id}|${state.shuffles[i] || 0}`, { labels: false });
    b.addEventListener("click", () => {
      state.day = i;
      days.querySelectorAll(".day").forEach((d, k) => d.setAttribute("aria-pressed", String(k === i)));
      renderLook(true);
      if (matchMedia("(max-width: 900px)").matches) $("#look").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    days.appendChild(b);
  });
}

/* shuffle + copy */
$("#btnShuffle").addEventListener("click", () => {
  state.shuffles[state.day] = (state.shuffles[state.day] || 0) + 1;
  state.outfits[state.day] = outfitFor(state.day);
  renderLook(true);
  const mini = document.querySelectorAll(".day svg.mini")[state.day];
  const { date, outfit } = state.outfits[state.day];
  if (mini) drawOutfit(mini, outfit, `${date.toDateString()}|${state.city.id}|${state.shuffles[state.day]}`, { labels: false });
});
$("#btnCopy").addEventListener("click", async () => {
  const { date, outfit } = state.outfits[state.day];
  const text = `${outfit.title} (${MONTHDAY.format(date)}, ${state.city.name})\n` + outfit.pieces.map(p => `• ${cap(p.name)}`).join("\n") + "\nfrom Rihanna's OOTD Studio";
  try { await navigator.clipboard.writeText(text); toast("Copied! Paste it in your notes app."); }
  catch { toast("Couldn't copy here, sorry."); }
});

let toastTimer;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2400); }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return "#" + c.map(x => x.toString(16).padStart(2, "0")).join("");
}

load();
