// Neon Boulevard — the editor: photo slots, layout / grade / size pickers, per-panel crop
// and position, live preview, PNG export. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).
import { drawCover, layoutPanels, panelAt, SIZES, GRADES, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');
const panelPhoto = document.getElementById('panel-photo');
const zoomInput = document.getElementById('panel-zoom');
const xInput = document.getElementById('panel-x');
const yInput = document.getElementById('panel-y');

// One photo per slot; a panel points at a slot (or none).
const state = {
  size: 'landscape',
  layout: 'trio',
  grade: 'sunset',
  caption: 'Sunset Heist',
  subtitle: 'Neon Nights • Est. 2026',
  photos: [null, null, null],
  panels: [],
};
let selectedPanel = 0;

/** Default panel assignment for a layout: hero takes photo 1, the rest cycle. */
function defaultPanels(layout) {
  const count = LAYOUTS[layout].panels;
  const assignment = { trio: [0, 1, 0], duo: [0, 1], hero: [0], quad: [0, 1, 2, 0] }[layout];
  return Array.from({ length: count }, (_, i) => ({
    photo: assignment[i], zoom: 1, x: 0.5, y: 0.5,
  }));
}
state.panels = defaultPanels(state.layout);

function redraw() {
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${state.panels.length}`;
  panelPhoto.value = panel.photo == null ? 'none' : String(panel.photo);
  zoomInput.value = panel.zoom;
  xInput.value = panel.x;
  yInput.value = panel.y;
  document.getElementById('zoom-value').textContent = `${panel.zoom.toFixed(2)}x`;
  document.getElementById('x-value').textContent = `${Math.round(panel.x * 100)}%`;
  document.getElementById('y-value').textContent = `${Math.round(panel.y * 100)}%`;
  // Highlight the selected panel with a dashed outline on the preview (editor only:
  // exported covers and cover screenshots show no selection chrome).
  if (document.body.classList.contains('shot-cover')) return;
  const { w, h } = SIZES[state.size];
  const rects = layoutPanels(w, h, state.layout);
  const ctx = canvas.getContext('2d');
  const r = rects[selectedPanel];
  if (r) {
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
    ctx.restore();
  }
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setPhoto(slot, img) {
  state.photos[slot] = img;
  document.getElementById(`slot-${slot + 1}-state`).textContent = img ? 'Loaded' : 'Empty';
  redraw();
}

async function loadSample(slot, file) {
  try {
    setPhoto(slot, await loadImage(`samples/${file}`));
    status.textContent = `Sample photo ${slot + 1} loaded.`;
  } catch {
    status.textContent = 'Could not load that sample photo.';
  }
}

// Photo slots: file pickers + sample buttons.
for (let slot = 0; slot < 3; slot++) {
  document.getElementById(`photo-${slot + 1}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setPhoto(slot, await loadImage(URL.createObjectURL(file)));
      status.textContent = `Photo ${slot + 1} loaded from your machine.`;
    } catch {
      status.textContent = 'That file could not be read as an image.';
    }
  });
  document.getElementById(`sample-${slot + 1}`).addEventListener('click', () => {
    loadSample(slot, slot === 1 ? 'pier.jpg' : 'boulevard.jpg');
  });
}
document.getElementById('load-samples').addEventListener('click', async () => {
  await loadSample(0, 'boulevard.jpg');
  await loadSample(1, 'pier.jpg');
  status.textContent = 'Both sample photos loaded — pick a layout and export.';
});

// Layout / grade / size pickers.
function bindPicker(groupId, apply) {
  const group = document.getElementById(groupId);
  group.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-value]');
    if (!button) return;
    group.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    apply(button.dataset.value);
    redraw();
  });
}
bindPicker('layout-picker', (value) => {
  state.layout = value;
  state.panels = defaultPanels(value);
  selectedPanel = 0;
});
bindPicker('grade-picker', (value) => { state.grade = value; });
bindPicker('size-picker', (value) => { state.size = value; });

// Panel editor: which photo fills the selected panel, its zoom and position.
panelPhoto.addEventListener('change', () => {
  state.panels[selectedPanel].photo = panelPhoto.value === 'none' ? null : Number(panelPhoto.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
xInput.addEventListener('input', () => {
  state.panels[selectedPanel].x = Number(xInput.value);
  redraw();
});
yInput.addEventListener('input', () => {
  state.panels[selectedPanel].y = Number(yInput.value);
  redraw();
});

// One photo across every panel, in one click.
document.getElementById('fill-all').addEventListener('click', () => {
  const first = state.panels[0] ? state.panels[0].photo : 0;
  state.panels.forEach((p) => { p.photo = first; });
  status.textContent = 'Every panel now uses the same photo.';
  redraw();
});

// Click the preview to select a panel.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(state, px, py);
  if (hit >= 0) {
    selectedPanel = hit;
    status.textContent = `Panel ${hit + 1} selected — crop and position it below.`;
    redraw();
  }
});

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// Export: render at the full post size and download the PNG.
document.getElementById('export').addEventListener('click', () => {
  const { w, h } = SIZES[state.size];
  const offscreen = document.createElement('canvas');
  drawCover(offscreen, state);
  offscreen.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-boulevard-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-boulevard-cover-${w}x${h}.png`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, {
    loadImage,
    setPhoto,
    setState(patch) {
      Object.assign(state, patch);
      if (patch.layout) state.panels = defaultPanels(patch.layout);
      captionInput.value = state.caption;
      subtitleInput.value = state.subtitle;
    },
    redraw,
  });
} else {
  redraw();
}
