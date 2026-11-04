// Slow, flowing silk ribbons drawn on a full-page canvas.
// setColors() re-dyes the ribbons (used to show your season's palette after a reading).

const DEFAULT = ["#F6CFD3", "#F9D9B8", "#DCCBEB", "#CFE3D4", "#F6E3A1"];

const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

export function startSilk(canvas) {
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dark = { get matches() { return document.documentElement.dataset.theme === "dark"; } };
  let W = 0, H = 0, dpr = 1;
  let from = DEFAULT.map(hexToRgb), to = from, mixStart = 0;
  const ribbons = DEFAULT.map((_, i) => ({
    base: 0.12 + i * 0.19,
    amp: 0.05 + (i % 3) * 0.02,
    k: 0.0022 + i * 0.00035,
    speed: 0.00012 + (i % 2) * 0.00006,
    phase: i * 1.7,
    thick: 0.09 + (i % 2) * 0.05,
  }));

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function colorAt(i, now) {
    const t = Math.min(1, (now - mixStart) / 1800);
    const e = t * t * (3 - 2 * t);
    return from[i].map((c, j) => Math.round(c + (to[i][j] - c) * e));
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    const alpha = dark.matches ? 0.34 : 0.55;
    ctx.globalCompositeOperation = dark.matches ? "screen" : "source-over";
    const step = Math.max(16, W / 60);
    ribbons.forEach((r, i) => {
      const [cr, cg, cb] = colorAt(i, now);
      const t = now * r.speed;
      const top = [], bot = [];
      for (let x = -step; x <= W + step; x += step) {
        const y = H * r.base
          + H * r.amp * Math.sin(x * r.k + t * 6 + r.phase)
          + H * r.amp * 0.5 * Math.sin(x * r.k * 2.1 - t * 4 + r.phase * 2);
        const th = H * r.thick * (0.55 + 0.45 * Math.sin(x * r.k * 0.7 + t * 3 + i));
        top.push([x, y]); bot.push([x, y + th]);
      }
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.55})`);
      g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},${alpha * 0.65})`);
      ctx.beginPath();
      top.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let j = bot.length - 1; j >= 0; j--) ctx.lineTo(bot[j][0], bot[j][1]);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      // satin sheen along the top edge
      ctx.beginPath();
      top.forEach(([x, y], j) => (j ? ctx.lineTo(x, y + 3) : ctx.moveTo(x, y + 3)));
      ctx.strokeStyle = `rgba(255,255,255,${dark.matches ? 0.05 : 0.45})`;
      ctx.lineWidth = 2; ctx.stroke();
    });
    if (!still) requestAnimationFrame(frame);
  }

  resize();
  addEventListener("resize", resize);
  requestAnimationFrame(frame);

  return {
    redraw() { if (still) requestAnimationFrame(frame); },
    setColors(hexes) {
      const now = performance.now();
      from = ribbons.map((_, i) => colorAt(i, now));
      to = ribbons.map((_, i) => hexToRgb(hexes[i % hexes.length]));
      mixStart = now;
      if (still) requestAnimationFrame(frame);
    },
  };
}
