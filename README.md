# Wallpaper Generator

A web app for making textured phone wallpapers in a quiet, editorial style.

- **What it does:** [`REQUIREMENTS.md`](REQUIREMENTS.md)
- **How it looks:** [`LOOK_GUIDE.md`](LOOK_GUIDE.md)

## Status: Prototype 0.1

The weeks 1–2 milestone from Requirements §11:

- Two textures rendered on the GPU with WebGL2: **Linen** (T12 Fabric Weave) and **Marble** (T3)
- Live sliders for every texture, colour, finish and layout control (on-brand ranges from Look Guide B3)
- The 5 palette families, each with a light and a dark version (Look Guide B2)
- The 5 signature presets that use these textures (Look Guide B4)
- Lock-screen and home-screen overlays, with the clock colour set from the wallpaper and a warning when the clock area is busy
- Undo and redo, and a new seed that doesn't count as an edit
- Preset licensing labels (FR-26 to FR-28)
- Export at native resolution as PNG (with the recipe embedded) or JPEG
- An interface built to Look Guide Part A, in light and dark, with a linen background made by the engine itself

Not built yet: PWA install and offline, saved user presets, the other three textures, layering and lighting.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + single-file build to dist/index.html
npm run artifact   # build + dist/artifact.html for claude.ai hosting
```

The build is one self-contained HTML file: fonts, shaders, CSS and JS are all inlined.

## Layout

| Path | What it is |
|---|---|
| `src/shaders/common.glsl` | Hashing, noise, OKLab palette mapping, finishing pass |
| `src/shaders/weave.glsl`, `marble.glsl` | The two textures |
| `src/recipe.ts` | Recipe model, parameters, palette families, presets, export sizes |
| `src/renderer.ts` | WebGL2 renderer |
| `src/main.ts` | Interface, state, undo and redo, export |
| `src/png.ts` | Embeds the recipe in exported PNGs |

Fonts: Newsreader and Instrument Sans (SIL Open Font License), self-hosted through Fontsource.
