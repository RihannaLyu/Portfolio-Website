// A 7-day forecast from Open-Meteo (free, no key; only the city's coordinates are sent).
// If it can't be reached, each day falls back to typical weather for the season.

export async function forecast(city, days = 7) {
  const key = `ootd-wx-${city.id}-${new Date().toDateString()}`;
  try { const hit = sessionStorage.getItem(key); if (hit) return JSON.parse(hit); } catch {}
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=${days}`;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(url, { signal: ctl.signal }); clearTimeout(t);
    if (!res.ok) throw new Error(res.status);
    const j = await res.json();
    const out = j.daily.time.map((_, i) => ({
      hi: j.daily.temperature_2m_max[i], lo: j.daily.temperature_2m_min[i],
      rain: j.daily.precipitation_probability_max[i] ?? 0, code: j.daily.weather_code[i] ?? 1, live: true,
    }));
    try { sessionStorage.setItem(key, JSON.stringify(out)); } catch {}
    return out;
  } catch {
    return Array.from({ length: days }, (_, i) => typical(city, addDays(new Date(), i)));
  }
}

export function typical(city, date) {
  const [mean, swing, gap, peak] = city.climate;
  const m = date.getMonth() + 1 + date.getDate() / 31;
  const hi = mean + swing * Math.cos((2 * Math.PI * (m - peak - 0.5)) / 12);
  return { hi, lo: hi - gap, rain: 20, code: 2, live: false };
}
export const addDays = (d, n) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + n); return x; };

export const toUnit = (c, unit) => Math.round(unit === "F" ? c * 9 / 5 + 32 : c);

export function sky(code, rain) {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || rain >= 60) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2) return "cloud";
  return "sun";
}
export const SKY_WORD = { sun: "Sunny", cloud: "Clouds", rain: "Rain", snow: "Snow", storm: "Storms", fog: "Fog" };

// little hand-drawn weather marks (inline SVG strings)
export function skyIcon(kind) {
  const ink = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  const sun = `<circle cx="20" cy="20" r="7.5" fill="#F6D58E" ${ink.replace('fill="none"', "")}/><path ${ink} d="M20 4v4M20 32v4M4 20h4M32 20h4M8.5 8.5l2.8 2.8M28.7 28.7l2.8 2.8M8.5 31.5l2.8-2.8M28.7 11.3l2.8-2.8"/>`;
  const cloud = `<path fill="#FFFBF7" ${ink.replace('fill="none"', "")} d="M11 29c-4 0-6.5-2.6-6.5-5.6 0-3.2 2.6-5.5 5.6-5.4 1-4.4 4.7-7 8.7-7 4.6 0 8 3.2 8.4 7.4 3.4-.2 6.3 2.3 6.3 5.4 0 3-2.4 5.2-5.6 5.2z"/>`;
  const drops = `<path ${ink} d="M13 33l-2 4M20 33l-2 4M27 33l-2 4"/>`;
  const flakes = `<path ${ink} d="M13 33v4M11 35h4M22 33v4M20 35h4M31 33v4M29 35h4"/>`;
  const bolt = `<path fill="#F6D58E" ${ink.replace('fill="none"', "")} d="M21 29l-4 6h4l-2 5 6-7h-4l2-4z"/>`;
  const fog = `<path ${ink} d="M6 31h28M9 36h22"/>`;
  const body = { sun, cloud, rain: cloud + drops, snow: cloud + flakes, storm: cloud + bolt, fog: cloud + fog }[kind] || cloud;
  return `<svg viewBox="0 0 40 42" aria-hidden="true">${kind === "cloud" ? `<g transform="translate(6 -4) scale(.7)">${sun}</g>` : ""}${body}</svg>`;
}
