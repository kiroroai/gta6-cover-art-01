// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone, at the export size the query names.
// Query params: size (square|portrait|landscape), layout, grade, caption, subtitle,
// photo (sample for panel 1), photo2 (sample for panel 2).
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, state, api) {
  const grade = query.get('grade') ?? 'sunset';
  const layout = query.get('layout') ?? 'trio';
  const size = query.get('size') ?? 'landscape';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Neon Nights • Est. 2026';
  const photo = query.get('photo') ?? 'boulevard';
  const photo2 = query.get('photo2') ?? 'pier';

  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.setState({ size, layout, grade, caption, subtitle });
  // Fill the panels: hero with the first sample, the rest with the second.
  const first = await api.loadImage(`samples/${photo}.jpg`);
  const second = await api.loadImage(`samples/${photo2}.jpg`);
  api.setPhoto(0, first);
  api.setPhoto(1, second);
  if (layout === 'quad') api.setPhoto(2, second);
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
