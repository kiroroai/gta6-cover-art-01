// Neon Boulevard's cover engine: paints a multi-panel GTA-style poster onto a canvas.
// Everything is drawn with the 2D canvas API from a plain state object; photos arrive as
// loaded <img> elements from main.js, nothing is fetched here. Rendering is deterministic:
// the grain, the skyline and every decoration use a seeded generator, so the same state
// always paints the same pixels.

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
};

export const GRADES = {
  sunset: {
    name: 'Sunset', sky: ['#ff9e45', '#ff5e78', '#7b2d8b'],
    tint: 'rgba(255, 94, 120, 0.26)', caption: ['#ffffff', '#ffe9a8', '#ff9e45'],
    accent: '#ff5e78', band: '#1c0b2e',
  },
  neon: {
    name: 'Neon', sky: ['#00e5ff', '#7b2dff', '#ff2e88'],
    tint: 'rgba(0, 229, 255, 0.22)', caption: ['#ffffff', '#a5f3fc', '#ff2e88'],
    accent: '#00e5ff', band: '#0b1035',
  },
  night: {
    name: 'Night', sky: ['#2b2a6b', '#6b2d8b', '#ff7ab8'],
    tint: 'rgba(123, 45, 139, 0.30)', caption: ['#ffffff', '#ffc7e3', '#b388ff'],
    accent: '#ff7ab8', band: '#12082b',
  },
  gold: {
    name: 'Gold', sky: ['#fbbf24', '#f97316', '#7c2d12'],
    tint: 'rgba(251, 146, 60, 0.26)', caption: ['#ffffff', '#fde68a', '#f97316'],
    accent: '#fbbf24', band: '#1f1005',
  },
};

export const LAYOUTS = {
  trio: { name: 'Trio', panels: 3 },
  duo: { name: 'Duo', panels: 2 },
  hero: { name: 'Hero', panels: 1 },
  quad: { name: 'Grid', panels: 4 },
};

/** A tiny seeded generator (mulberry32) so grain and skylines are the same every render. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panel rectangles for a layout, in canvas pixels: cream gutters, comic-book frame. */
export function layoutPanels(w, h, layout) {
  const m = Math.round(w * 0.022);
  const g = Math.max(8, Math.round(w * 0.012));
  const innerW = w - 2 * m;
  const innerH = h - 2 * m;
  if (layout === 'hero') return [{ x: m, y: m, w: innerW, h: innerH }];
  if (layout === 'duo') {
    const pw = (innerW - g) / 2;
    return [
      { x: m, y: m, w: pw, h: innerH },
      { x: m + pw + g, y: m, w: pw, h: innerH },
    ];
  }
  if (layout === 'quad') {
    const pw = (innerW - g) / 2;
    const ph = (innerH - g) / 2;
    return [
      { x: m, y: m, w: pw, h: ph },
      { x: m + pw + g, y: m, w: pw, h: ph },
      { x: m, y: m + ph + g, w: pw, h: ph },
      { x: m + pw + g, y: m + ph + g, w: pw, h: ph },
    ];
  }
  // trio: one tall hero panel on the left, two stacked panels on the right.
  const heroW = innerW * 0.62;
  const rightW = innerW - heroW - g;
  const halfH = (innerH - g) / 2;
  return [
    { x: m, y: m, w: heroW, h: innerH },
    { x: m + heroW + g, y: m, w: rightW, h: halfH },
    { x: m + heroW + g, y: m + halfH + g, w: rightW, h: halfH },
  ];
}

/** Which panel (index, or -1) holds canvas point (px, py) for this state. */
export function panelAt(state, px, py) {
  const { w, h } = SIZES[state.size];
  const panels = layoutPanels(w, h, state.layout);
  for (let i = 0; i < panels.length; i++) {
    const r = panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** A dark skyline silhouette along the bottom of a rectangle. */
function drawSkyline(ctx, x, y, w, h, color, seed) {
  const rand = seededRandom(seed);
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.03 + rand() * 0.06);
    const bh = h * (0.3 + rand() * 0.7);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (rand() < 0.3) ctx.fillRect(bx + bw * 0.3, y + h - bh - h * 0.12, bw * 0.14, h * 0.12);
    bx += bw + w * 0.012;
  }
}

/** A simple palm silhouette: a curved trunk and five drooping fronds. */
function drawPalm(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  ctx.stroke();
  const topX = x + s * 0.3;
  const topY = y - s * 0.95;
  for (let i = 0; i < 5; i++) {
    const angle = Math.PI * (0.08 + i * 0.21);
    const len = s * (0.55 + (i % 2) * 0.12);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * len * 0.6,
      topY - Math.sin(angle) * len * 0.5 - s * 0.08,
      topX + Math.cos(angle) * len,
      topY - Math.sin(angle) * len * 0.28 + s * 0.22,
    );
    ctx.stroke();
  }
}

/** Paints one panel: the photo (cover-fit, zoomed and positioned) or a sunset scene when empty. */
function drawPanel(ctx, rect, photo, panel, grade, seed) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (photo) {
    const iw = photo.naturalWidth;
    const ih = photo.naturalHeight;
    const zoom = panel.zoom || 1;
    const base = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * base;
    const dh = ih * base;
    const ox = panel.x ?? 0.5;
    const oy = panel.y ?? 0.5;
    const dx = x + (w - dw) / 2 - (ox - 0.5) * (dw - w);
    const dy = y + (h - dh) / 2 - (oy - 0.5) * (dh - h);
    ctx.drawImage(photo, dx, dy, dw, dh);
    // Grade tint + depth: warm wash, light from the top, shade at the foot.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(x, y, w, h);
    const top = ctx.createLinearGradient(0, y, 0, y + h * 0.4);
    top.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    top.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, h * 0.4);
    const foot = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
    foot.addColorStop(0, 'rgba(10, 4, 24, 0)');
    foot.addColorStop(1, 'rgba(10, 4, 24, 0.45)');
    ctx.fillStyle = foot;
    ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
  } else {
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.55, grade.sky[1]);
    sky.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    const sunR = Math.min(w, h) * 0.2;
    const sun = ctx.createRadialGradient(
      x + w * 0.68, y + h * 0.34, sunR * 0.1,
      x + w * 0.68, y + h * 0.34, sunR,
    );
    sun.addColorStop(0, '#fff7d6');
    sun.addColorStop(0.6, '#ffd166');
    sun.addColorStop(1, 'rgba(255, 158, 69, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(x + w * 0.68, y + h * 0.34, sunR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    drawSkyline(ctx, x, y + h * 0.62, w, h * 0.38, 'rgba(20, 8, 32, 0.85)', seed + 7);
    drawPalm(ctx, x + w * 0.16, y + h * 0.98, Math.min(w, h) * 0.42, 'rgba(20, 8, 32, 0.9)');
    drawPalm(ctx, x + w * 0.88, y + h * 0.99, Math.min(w, h) * 0.3, 'rgba(20, 8, 32, 0.9)');
  }
  // Vignette: darkened corners keep the panel feeling like poster art.
  const vg = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Cream comic frame + thin dark inner line.
  ctx.strokeStyle = '#f5ead6';
  ctx.lineWidth = Math.max(6, Math.round(w * 0.012));
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(20, 8, 32, 0.85)';
  ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
}

/** The bold caption: condensed heavy capitals, gradient fill, thick dark outline. */
function drawCaption(ctx, w, h, text, grade) {
  const clean = text.trim().toUpperCase();
  if (!clean) return;
  const bandH = h * 0.21;
  const bandY = h - bandH;
  const cx = w / 2;
  const baseline = bandY + bandH * 0.5;
  let size = bandH * 0.48;
  const family = `'Arial Black', 'Archivo Black', 'Anton', system-ui, sans-serif`;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = (s) => { ctx.font = `900 ${s}px ${family}`; };
  setFont(size);
  // Measure with the same horizontal squeeze the draw uses.
  while (ctx.measureText(clean).width * 0.82 > w * 0.9 && size > 16) {
    size -= 2;
    setFont(size);
  }
  const grad = ctx.createLinearGradient(0, baseline - size * 0.55, 0, baseline + size * 0.55);
  grad.addColorStop(0, grade.caption[0]);
  grad.addColorStop(0.55, grade.caption[1]);
  grad.addColorStop(1, grade.caption[2]);
  const textW = ctx.measureText(clean).width * 0.82;
  ctx.translate(cx, baseline);
  ctx.scale(0.82, 1);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = size * 0.1;
  ctx.strokeText(clean, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(clean, 0, 0);
  ctx.restore();
  // Two small stars flanking the caption (textW was measured before the restore).
  const starY = baseline;
  const starR = Math.max(8, size * 0.09);
  for (const sx of [cx - textW / 2 - starR * 2.2, cx + textW / 2 + starR * 2.2]) {
    drawStar(ctx, sx, starY, starR, grade.accent);
  }
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The subtitle pill under the caption. */
function drawSubtitle(ctx, w, h, text, grade) {
  const clean = text.trim().toUpperCase();
  if (!clean) return;
  const bandH = h * 0.21;
  const pillY = h - bandH * 0.16;
  const size = Math.max(14, Math.round(h * 0.016));
  ctx.save();
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  try { ctx.letterSpacing = `${Math.max(3, size * 0.28)}px`; } catch { /* older canvas: no tracking */ }
  const tw = ctx.measureText(clean).width;
  const padX = size * 1.1;
  const pillW = tw + padX * 2;
  const pillH = size * 2.1;
  ctx.fillStyle = grade.accent;
  rr(ctx, (w - pillW) / 2, pillY - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#160a24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clean, w / 2, pillY + size * 0.06);
  ctx.restore();
}

/** Light film grain over the whole cover, from a fixed seed. */
function drawGrain(ctx, w, h) {
  const rand = seededRandom(20261119);
  const count = Math.round((w * h) / 1100);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const gx = rand() * w;
    const gy = rand() * h;
    ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(gx, gy, 1.6, 1.6);
  }
  ctx.restore();
}

/**
 * Draws the whole cover for `state` onto `canvas`, resizing the canvas to the chosen
 * export size first. State: { size, layout, grade, caption, subtitle,
 * photos: [img|null x3], panels: [{ photo, zoom, x, y }] }.
 */
export function drawCover(canvas, state) {
  const { w, h } = SIZES[state.size];
  const grade = GRADES[state.grade];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Backdrop: the grade's sky, so the gutters glow instead of sitting on white.
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.5, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(w, h, state.layout);
  panels.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, x: 0.5, y: 0.5 };
    const photo = panel.photo == null ? null : state.photos[panel.photo] || null;
    drawPanel(ctx, rect, photo, panel, grade, 1000 + i * 131);
  });
  // Caption band: dark gradient over the foot, skyline along its top edge.
  const bandH = h * 0.21;
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY - h * 0.04, 0, h);
  band.addColorStop(0, 'rgba(18, 8, 34, 0)');
  band.addColorStop(0.25, 'rgba(18, 8, 34, 0.82)');
  band.addColorStop(1, grade.band);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - h * 0.04, w, bandH + h * 0.04);
  drawSkyline(ctx, 0, bandY - h * 0.005, w, h * 0.038, 'rgba(12, 5, 22, 0.6)', 4242);
  drawCaption(ctx, w, h, state.caption, grade);
  drawSubtitle(ctx, w, h, state.subtitle, grade);
  drawGrain(ctx, w, h);
}
