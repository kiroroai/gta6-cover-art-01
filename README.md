[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/kiroroai/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/kiroroai/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Boulevard — GTA-style Cover Maker

Turn your own photo and a caption into GTA-style cover art: a multi-panel poster
with bold caption lettering and a Vice City sunset or neon colour grade, exported
as a PNG to share. It runs entirely offline in a desktop browser — photos are
read on your machine and never uploaded.

What it does:

- **Any photo** — load up to three of your own photos (or the two bundled samples),
  assign each panel a photo, and crop and position every panel with zoom and
  left–right / up–down sliders. One photo can fill every panel, or each panel can
  hold a different one.
- **The art** — four panel layouts (Trio, Duo, Hero, Grid), a comic-book cream
  frame, a skyline silhouette and film grain, and four colour grades (Sunset,
  Neon, Night, Gold). Panels with no photo draw a sunset scene of their own.
- **Fast and easy** — five steps from photo to PNG: pick photos, pick a layout,
  crop the panels, write the caption, export.
- **Three post sizes** — 1080 × 1080, 1080 × 1350 and 1920 × 1080, exported as a
  real PNG at full resolution.

Everything in the app is original: no Rockstar Games logo, wordmark, artwork,
character or font. The lettering is drawn from system fonts with a gradient fill
and a thick outline, so the app ships no font files at all.

## Run it

No build step, no network. Serve `app/` with any static file server and open
`index.html` in desktop Chrome:

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` directly from any static server. Pick photos, choose a
layout and grade, click a panel to crop it, type a caption, and hit **Export
PNG**.

## Screenshots

`screenshots/` holds four shots taken with headless Chrome: the exported
landscape cover first, then the editor with a photo loaded, then the exported
portrait and square covers.

---

Built by an AI agent for make.fun's “Make GTA 6 Cover Art” bounty, $250 in USDC.
