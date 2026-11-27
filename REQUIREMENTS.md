# Textured Mobile Wallpaper Generator — Requirements

| Field | Value |
|---|---|
| Document | Wallpaper Generator Requirements |
| Version | v1.2 |
| Status | **Working draft**: core product decisions made (§1.3); visual direction set in [`LOOK_GUIDE.md`](LOOK_GUIDE.md); remaining open questions in §12 |
| Last updated | 2026-11-27 |
| Purpose | Single source of truth for what the generator must do and which look-and-feel controls it exposes |

---

## 1. Overview

The app generates **textured wallpaper images sized for mobile phones**. A user picks a texture style, adjusts parameters (color, scale, grain, lighting and so on), previews the result live, and exports a full-resolution image ready to set as a lock screen or home screen wallpaper.

Every wallpaper is defined by a **recipe**: texture type, parameters, palette and a random **seed**. The same recipe always produces the same image, so a wallpaper can be saved, shared, re-rendered at a different resolution, or remixed.

### 1.1 Goals

- G1: Produce high-quality, non-repeating textured images at native phone resolution.
- G2: Make customization fast and intuitive, with a live preview that updates in under 100 ms.
- G3: Make every result reproducible from a small, shareable recipe (JSON + seed).
- G4: Keep the output usable as a wallpaper: icons and the clock stay readable.

### 1.2 Non-goals (v1)

- Animated or live wallpapers (candidate for v2).
- Photo editing or filters applied to user photos.
- Generative-AI image models. v1 is **procedural** (math-based noise and patterns): deterministic, offline, and with no licensing ambiguity about the output.
- Social feed, accounts or a marketplace.
- Native app-store apps (v1 is web/PWA; native wrappers can come later).

### 1.3 Product Decisions (v1.1)

| # | Decision | Implication |
|---|---|---|
| D1 | **Platform: web / PWA first** | Runs in mobile Safari and Chrome, installable to the home screen, works offline. No direct "set as wallpaper" (browsers can't do this); users save the image, then set it in Photos or Gallery. |
| D2 | **Business model: a tool for people to make their own wallpapers** | The core value is the creation experience and output quality. Creator-scale features (batch export) stay optional. How it earns money is still open (§12). |
| D3 | **Licensing: users own their exports; built-in presets are for personal use only** | Needs clear terms, and a way to tell when an export is "preset-derived" (§3.5). |
| D4 | **Aesthetic: one curated signature look, "Modern Editorial"** (defined in [`LOOK_GUIDE.md`](LOOK_GUIDE.md)) | Fewer, better textures. Palettes, presets and Randomize are kept within the signature look (§4.1). The app interface follows Look Guide Part A; wallpaper output follows Part B. |
| D5 | **Reference device: iPhone 16** (1179 × 2556, Safari) | All performance targets are measured on it (§8). |

---

## 2. Users and Use Cases

| Persona | Priority | Need | Key use case |
|---|---|---|---|
| Aesthetic tinkerer | **Primary** | A wallpaper that is unmistakably theirs, within a beautiful curated look | Start from a preset, adjust palette and grain, save their own preset |
| Casual user | **Primary** | A fresh, attractive wallpaper in seconds | Tap **Randomize** (kept on-brand) until something looks right, then save |
| Creator / artist | Secondary | Original textures they own outright | Export a series from one edited recipe with varied seeds |

---

## 3. Functional Requirements

Priority: **M** = must (MVP), **S** = should, **C** = could.

### 3.1 Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Generate an image from a texture type, parameter set, palette and seed. | M |
| FR-2 | Identical recipe + seed + resolution produces a pixel-identical image on the same device and browser, and a visually identical one across devices. GPUs differ slightly in floating-point precision, so pixel-identical results across all hardware can't be guaranteed on the web. | M |
| FR-3 | Output resolution is independent of the recipe: the same recipe renders at any target size without changing its composition (resolution-independent parameters). | M |
| FR-4 | **Randomize** generates a new seed; **Randomize all** also randomizes parameters within tasteful bounds. | M |
| FR-5 | Lock individual parameters so Randomize leaves them unchanged. | S |
| FR-6 | Layer up to 3 textures with blend modes (see §5.9). | S |
| FR-7 | Generate variations: 4–9 thumbnails from the same recipe with different seeds. | S |

### 3.2 Preview and Editing

| ID | Requirement | Priority |
|---|---|---|
| FR-8 | Live preview inside a phone-frame mockup, with toggleable lock-screen and home-screen overlays (clock, widgets, icon grid, dock). | M |
| FR-9 | Undo/redo for parameter changes (at least 50 steps). | M |
| FR-10 | Compare original and edited side by side, or by press-and-hold. | C |
| FR-11 | Show a readability warning when the clock or icon areas have low contrast (see §6). | S |

### 3.3 Presets and Recipes

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | Ship 12 or more curated built-in presets. | M |
| FR-13 | Save, rename, duplicate and delete user presets locally. | M |
| FR-14 | Export and import a recipe as JSON or as a short share code / deep link. | S |
| FR-15 | Embed the recipe in the exported image's metadata (PNG `tEXt` chunk / EXIF UserComment) so the image can be re-opened for editing. | C |

### 3.4 Export

| ID | Requirement | Priority |
|---|---|---|
| FR-16 | Export at the device's native resolution by default: detected as `screen.width/height × devicePixelRatio`, with a device picker to confirm or override (see §7). | M |
| FR-17 | Formats: PNG (lossless) and JPEG (quality 85–100). WebP optional. HEIC is not available from browser canvas. | M |
| FR-18 | **Save via the system share sheet** (Web Share API with files → "Save Image" puts it in Photos on iOS). Fall back to a file download where sharing isn't supported. | M |
| FR-19 | ~~Set the wallpaper directly~~ Not possible from the web (D1). Replaced by a short **"How to set your wallpaper"** guide for iOS and Android, shown after the first save. | M |
| FR-20 | Export a matched pair: a lock-screen version and a home-screen version (for example, dimmed or blurred). | S |
| FR-21 | Batch export N seeds of one recipe as a ZIP (creator use case). | C |
| FR-22 | Export at custom dimensions or presets for tablets, desktops and watches. | C |

### 3.5 Web App and Licensing

| ID | Requirement | Priority |
|---|---|---|
| FR-23 | Installable PWA: web manifest, icons, splash screen, and opens full-screen from the home screen. | M |
| FR-24 | Works fully offline after the first visit (a service worker caches the app shell and shaders). | M |
| FR-25 | User presets are stored on-device (IndexedDB). Show a notice that clearing browser data deletes them, and offer **Export all presets** (JSON) as a backup. | M |
| FR-26 | Each recipe records its **origin**: `user` or `preset:<id>` with a `modified` flag. This origin goes into the export metadata (FR-15). | M |
| FR-27 | Exports from an **unmodified built-in preset** are marked *Personal use only*. Any edit makes the export **user-owned** (D3). The rule is shown at export time. | M |
| FR-28 | Terms page in plain language: users own what they make; built-in presets and the app's look are licensed for personal use; no claim on user exports. | M |

> **Recommended threshold for "modified" (FR-27):** any change to palette colors, texture type, or a texture or global parameter beyond seed-only randomizing. A new seed on its own does **not** count as an edit, otherwise one tap would bypass the preset license. See §12, question 3.

---

## 4. Texture Catalog

Each texture type is a generator with its own parameters (§5.3) on top of the shared controls. **MVP textures (v1.2, from Look Guide B1): T12 Fabric Weave, T4 Paper, T5 Terrazzo, T3 Marble and T6 Topographic.** Grain (T1) becomes a finish applied to every texture, and Gradient Mesh (T2) is cut.

### 4.1 Curated Look Guardrails (D4)

- **Signature definition:** [`LOOK_GUIDE.md`](LOOK_GUIDE.md), "Modern Editorial": quiet sophistication, natural materials. Its quality bar (B5) is the test every texture and preset must pass.
- **Bounded Randomize:** Randomize picks only from the curated palettes and from "on-brand" parameter ranges that are narrower than the full ranges in §5. The full ranges stay available in Advanced mode.
- **Presets as the front door:** the app opens on a gallery of signature presets, not a blank editor.
- **Quality bar:** a texture ships only if three random seeds out of three look good enough to post. If not, it's cut or narrowed.

| # | Texture | Technique | Look | MVP |
|---|---|---|---|---|
| T1 | **Grain / Film** | Per-pixel noise, Gaussian or uniform | Analog, matte, risograph | ↪ finish (`fx.grain`) |
| T2 | **Gradient Mesh** | Multi-point smooth color interpolation + grain | Soft modern "aura" gradients | ❌ cut (Look Guide B1) |
| T3 | **Fluid / Marble** | Domain-warped fractal noise (fBm) | Marble, ink, smoke, oil | ✅ |
| T4 | **Paper / Canvas** | Layered fine noise + fiber streaks + emboss | Watercolor paper, linen, kraft | ✅ |
| T5 | **Terrazzo / Speckle** | Poisson-disk scatter of irregular polygons | Stone chips, confetti | ✅ |
| T6 | **Topographic** | Iso-contour lines of a noise field | Map contours, wood rings | ✅ |
| T7 | Cellular / Voronoi | Worley noise | Cracked earth, cells, leather, scales | |
| T8 | Waves / Ripples | Summed sine fields, interference | Water, sand dunes, fabric moiré | |
| T9 | Brushed Metal | Directional motion-blurred noise + specular | Aluminium, steel | |
| T10 | Halftone | Dot or line screen over a field | Print, pop-art | |
| T11 | Geometric Tiles | Truchet / hex / triangle grids with jitter | Tiles, mosaic | |
| T12 | **Fabric Weave** | Interleaved thread pattern + noise | Linen, denim, tweed | ✅ promoted (signature material) |
| T13 | Stucco / Plaster | Ridged noise + normal-mapped lighting | Wall plaster, concrete | |
| T14 | Bokeh / Light | Blurred additive circles | Dreamy, nightlife | |

---

## 5. Customization Specification

These are the controls that shape look and feel. Ranges are normalized where possible so that recipes stay resolution-independent. "Size" values are **fractions of the shorter image edge** unless stated otherwise.

### 5.1 Color and Palette

| Parameter | Type | Range / Options | Default | Notes |
|---|---|---|---|---|
| `palette.mode` | enum | `monochrome`, `analogous`, `complementary`, `split-complementary`, `triadic`, `custom`, `image-extract` | `analogous` | Harmony rule used to derive colors from a base hue |
| `palette.baseColor` | color | any (hex / HSL / OKLCH) | `#857C6D` (taupe) | Seed color for harmony modes |
| `palette.colors` | color[] | 1–6 stops | derived | Editable in `custom` mode |
| `palette.stopPositions` | float[] | 0–1 | evenly spaced | Gradient-map positions |
| `palette.colorSpace` | enum | `oklch`, `srgb`, `lab` | `oklch` | OKLCH interpolation avoids muddy midpoints |
| `palette.temperature` | float | −1 (cool) … +1 (warm) | 0 | Global white-balance shift |
| `palette.saturation` | float | 0–2 | 1 | Global multiplier |
| `palette.lightnessRange` | [float, float] | 0–1 | [0.15, 0.85] | Clamps the darkest and lightest output |
| `palette.extractFromImage` | image | user photo | — | Pulls 3–6 dominant colors (k-means); the photo is not stored |
| ~~`palette.matchSystemTheme`~~ | — | — | — | Dropped: browsers can't read the system accent color (D1) |

**Built-in palette families (v1.2):** Natural Linen, Warm Stone, Charcoal, Indigo Dye and Ink on Paper. Each has its own light and dark version; hex values are in Look Guide B2. ~~Earthy, Pastel, Jewel, Neon, Desert, Ocean, Forest, Sunset, Seasonal~~ are dropped as off-brand.

### 5.2 Global Texture Controls (all types)

| Parameter | Type | Range | Default | Effect |
|---|---|---|---|---|
| `seed` | uint32 | 0 – 4,294,967,295 | random | Determines all randomness |
| `scale` | float | 0.01–2.0 | 0.25 | Feature size relative to the short edge |
| `rotation` | degrees | 0–360 | 0 | Rotates the texture field |
| `contrast` | float | 0–2 | 1 | Value spread before palette mapping |
| `brightness` | float | −1…+1 | 0 | Value offset |
| `detail` (octaves) | int | 1–8 | 5 | Fractal layers of noise; more is finer and slower |
| `roughness` (gain) | float | 0.2–0.8 | 0.5 | Amplitude falloff per octave |
| `lacunarity` | float | 1.5–3.0 | 2.0 | Frequency growth per octave |
| `warpStrength` | float | 0–2 | 0 | Domain warp; adds a fluid, swirly feel |
| `warpScale` | float | 0.05–2 | 0.5 | Size of the warp distortion |
| `anisotropy` | float | 0–1 | 0 | Stretches the field directionally (brushed, wood) |
| `anisotropyAngle` | degrees | 0–180 | 90 | Direction of the stretch |
| `tileable` | bool | — | false | Seamless edges, for packs or desktop tiling |

### 5.3 Texture-Specific Parameters (MVP types)

| Texture | Parameters |
|---|---|
| T1 Grain | `grainSize` (0.5–4 px at export), `grainType` (gaussian / uniform / blue-noise), `monochromeGrain` (bool), `grainAmount` (0–1) |
| T2 Gradient Mesh | `pointCount` (2–8), `pointPositions` (draggable), `blendSoftness` (0–1), `bands` (0 = smooth, 2–12 = posterized steps) |
| T3 Fluid / Marble | `warpIterations` (1–3), `veinSharpness` (0–1), `veinColor`, `flowAngle` |
| T4 Paper / Canvas | `fiberDensity` (0–1), `fiberLength` (0–1), `tooth` (0–1, surface bumpiness), `deckleEdge` (bool) |
| T5 Terrazzo | `chipDensity` (0.05–0.8), `chipSizeMin` / `chipSizeMax`, `chipShape` (round / shard / mixed), `chipColors` (palette subset), `baseColor` |
| T6 Topographic | `lineCount` (5–80), `lineWeight` (0.5–6 px), `lineColor`, `fillBetween` (bool), `lineSmoothing` |

### 5.4 Lighting and Surface (gives a texture its physical feel)

| Parameter | Type | Range | Default | Effect |
|---|---|---|---|---|
| `relief.enabled` | bool | — | false | Treats the texture as a height map |
| `relief.depth` | float | 0–1 | 0.3 | Emboss strength |
| `light.angle` | degrees | 0–360 | 135 | Light direction (135° = top-left) |
| `light.elevation` | degrees | 5–90 | 45 | Low elevation shows more texture |
| `light.color` | color | — | `#F2EEE3` (ivory) | Tints the highlights |
| `surface.finish` | enum | `matte`, `satin`, `glossy`, `metallic` | `matte` | Specular response |
| `ambientOcclusion` | float | 0–1 | 0 | Darkens crevices |

### 5.5 Finishing Effects (post-process)

| Parameter | Type | Range | Default |
|---|---|---|---|
| `fx.grain` | float | 0–1 | 0.08 (a little grain reduces gradient banding) |
| `fx.vignette.amount` | float | 0–1 | 0 |
| `fx.vignette.softness` | float | 0–1 | 0.6 |
| `fx.blur` | float | 0–50 px at export | 0 |
| `fx.chromaticAberration` | float | 0–1 | 0 |
| `fx.posterize` | int | 0 (off), 2–16 levels | 0 |
| `fx.dither` | enum | `none`, `ordered`, `blue-noise` | `blue-noise` |
| `fx.duotone` | bool + 2 colors | — | off |
| `fx.invert` | bool | — | false |

> **Curated look (Look Guide B3):** chromatic aberration, posterize, invert and kaleidoscope symmetry are part of the engine but **hidden from the interface in v1**. Simple mode and Randomize use the narrower on-brand ranges in B3.

### 5.6 Composition and Layout

| Parameter | Type | Options / Range | Default | Notes |
|---|---|---|---|---|
| `focalPoint` | [x, y] | 0–1 each | [0.5, 0.6] | Where detail or brightness concentrates |
| `densityFalloff` | float | 0–1 | 0 | Busier at the focal point, calmer elsewhere |
| `calmZones` | enum[] | `clock`, `dock`, `iconGrid`, `none` | [`clock`] | Reduces contrast/detail behind UI areas (§6) |
| `calmZoneStrength` | float | 0–1 | 0.5 | |
| `gradientOverlay` | enum | `none`, `top-fade`, `bottom-fade`, `radial` | `none` | Darkens or lightens for legibility |
| `symmetry` | enum | `none`, `mirror-x`, `mirror-y`, `kaleido-4`, `kaleido-6` | `none` | |
| `border` | float + color | 0–0.1 | 0 | Optional inset frame |

### 5.7 Light / Dark Mode

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `appearance.pair` | bool | false | Generates linked light and dark variants from one recipe |
| `appearance.darkPalette` | color[] | from the family's dark version | **Preferred (v1.2).** The dark variant uses its own chosen palette, not an inversion (Look Guide B2) |
| `appearance.darkShift` | float | 0.6 | Fallback only, for custom palettes that have no dark version |
| `appearance.oledBlack` | bool | false | Clamps the darkest values to true black (#000) for OLED battery savings |

iOS supports light/dark wallpaper pairs and Android can switch wallpapers by theme, so a paired export is a real differentiator.

### 5.8 Parallax / Depth (S)

| Parameter | Range | Notes |
|---|---|---|
| `overscan` | 0–20 % | Renders extra margin so system parallax/zoom does not crop or upscale the image |
| `depthLayers` | 1–3 | Future: separate foreground/background for depth effects |

### 5.9 Layering (FR-6)

Each layer = texture type + its parameters + `opacity` (0–1) + `blendMode` (`normal`, `multiply`, `screen`, `overlay`, `soft-light`, `color-dodge`, `difference`) + optional `mask` (another texture or a gradient).

### 5.10 UX Grouping of Controls

To avoid overwhelming casual users, the controls are tiered:

1. **Simple mode (default):** Style (texture), Palette, Scale, Grain, Randomize.
2. **Advanced mode:** everything in §5.2–5.6, grouped as *Color · Shape · Surface · Effects · Layout*.
3. **Expert:** layers, raw seed entry, JSON recipe editor.

---

## 6. Wallpaper Readability Rules

The generator should help the output work as a wallpaper, not just as art.

- **UI zones (portrait, as fractions of height, approximate):**
  - Status bar: 0–5 %
  - Lock-screen clock and widgets: 8–30 %
  - Home indicator / navigation bar: 94–100 %
  - Dock: roughly 85–94 %
- **Contrast check (FR-11):** sample the luminance variance in the clock zone. Above a threshold, warn and offer one-tap *Calm Clock Area*.
- **Avoid moiré:** high-frequency patterns (fine lines, halftone) must be rendered at native resolution and never downscaled with nearest-neighbor sampling.
- **Avoid banding:** gradients are generated at 16-bit/float precision internally and dithered when quantized to 8-bit.

---

## 7. Output Specifications

### 7.1 Resolution Presets

Default to the **detected device's native pixel resolution** (FR-16). **The reference and test target is the iPhone 16 at 1179 × 2556** (D5). The presets below are reference values; **verify them against current manufacturer specs before release**, because new models ship every year.

| Device class | Example resolution (px) | Aspect |
|---|---|---|
| iPhone SE (2nd/3rd gen) | 750 × 1334 | 16:9 |
| iPhone 15 / 16 | 1179 × 2556 | ~19.5:9 |
| iPhone 15 Plus / 16 Plus | 1290 × 2796 | ~19.5:9 |
| iPhone 16 Pro | 1206 × 2622 | ~19.5:9 |
| iPhone 16 Pro Max | 1320 × 2868 | ~19.5:9 |
| Pixel 9 | 1080 × 2424 | 20:9 |
| Pixel 9 Pro | 1280 × 2856 | 20:9 |
| Galaxy S24 | 1080 × 2340 | 19.5:9 |
| Galaxy S24 Ultra | 1440 × 3120 | 19.5:9 |
| Generic FHD+ Android | 1080 × 2400 | 20:9 |
| Generic QHD+ Android | 1440 × 3200 | 20:9 |
| Foldable (inner) | custom | ~1:1 |
| Universal "fits most" | 1440 × 3200 | 20:9, center-safe crop |

- Plus `overscan` (§5.8) when enabled.
- **Universal export:** render at 1440 × 3200 and keep key detail inside the center 1080 × 2340 area so it crops well on most phones.

### 7.2 File Output

| Property | Requirement |
|---|---|
| Color profile | sRGB by default; Display P3 optional where the browser's canvas supports it (`colorSpace: "display-p3"`, Safari) |
| Bit depth | 8-bit per channel (dithered); 16-bit PNG optional |
| PNG | Lossless, compressed; typically 3–12 MB at QHD+ for grainy textures |
| JPEG | Quality 92 default; 4:4:4 chroma (no subsampling) to keep fine grain crisp |
| Metadata | Recipe JSON (FR-15); strip location and device identifiers |
| File naming | `wallpaper_{texture}_{seed}_{width}x{height}.{ext}` |

---

## 8. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | Preview (at reduced resolution) updates in ≤ 100 ms after a parameter change on the **iPhone 16 in Safari** (D5). |
| NFR-2 | Performance | Full-resolution render (1179 × 2556) ≤ 2 s for MVP textures on the iPhone 16 in Safari; show progress if longer. |
| NFR-3 | Performance | Rendering uses **WebGL2** fragment shaders, with a slower Canvas 2D fallback. |
| NFR-4 | Memory | Peak memory during export stays under 300 MB, and the canvas stays within iOS Safari's canvas size limits. Very large custom exports (FR-22) render in tiles. |
| NFR-5 | Offline | All generation works fully offline once installed or cached (FR-24). |
| NFR-11 | Compatibility | Supports the latest two major versions of iOS Safari and Android Chrome. Desktop browsers are supported for editing but not optimized. |
| NFR-12 | Load | The first load on 4G is interactive in ≤ 3 s. The app shell is under 500 KB gzipped. |
| NFR-6 | Determinism | Seeded PRNG and noise implementation are versioned (`engineVersion` in the recipe) so old recipes still render identically after updates. |
| NFR-7 | Privacy | No account required. Photos used for palette extraction are processed on-device and never stored or uploaded. No analytics without opt-in. |
| NFR-8 | Accessibility | Every control has a screen-reader label; supports Dynamic Type / font scaling; sliders also accept numeric entry; respects Reduce Motion. |
| NFR-9 | Storage | A recipe is under 4 KB; presets are stored locally as JSON. |
| NFR-10 | Battery | No background rendering; preview pauses when the app is backgrounded. |

---

## 9. Recipe Data Model

```json
{
  "engineVersion": "1.0.0",
  "name": "Quiet Marble",
  "origin": { "source": "preset", "presetId": "quiet-marble", "modified": true },
  "seed": 2837461,
  "texture": {
    "type": "fluid-marble",
    "params": { "warpIterations": 2, "veinSharpness": 0.6, "flowAngle": 30 }
  },
  "global": {
    "scale": 0.3, "rotation": 0, "contrast": 0.9, "brightness": 0,
    "detail": 6, "roughness": 0.5, "lacunarity": 2.0,
    "warpStrength": 0.6, "warpScale": 0.4, "anisotropy": 0, "tileable": false
  },
  "palette": {
    "mode": "custom",
    "family": "natural-linen",
    "colorSpace": "oklch",
    "colors": ["#F2EEE3", "#E8E4DA", "#D6D0C2", "#857C6D"],
    "stopPositions": [0, 0.4, 0.75, 1],
    "temperature": 0.05, "saturation": 0.6
  },
  "lighting": { "relief": { "enabled": true, "depth": 0.25 }, "angle": 135, "elevation": 40, "finish": "satin" },
  "fx": { "grain": 0.1, "vignette": { "amount": 0.2, "softness": 0.6 }, "dither": "blue-noise" },
  "layout": { "focalPoint": [0.5, 0.65], "calmZones": ["clock"], "calmZoneStrength": 0.5 },
  "appearance": { "pair": true, "darkShift": 0.6, "oledBlack": false },
  "layers": []
}
```

Resolution and file format are **not** part of the recipe. They are export settings.

---

## 10. Technical Approach

Platform decided: **web / PWA** (D1). Everything else below is a recommendation, not binding.

| Area | Recommendation | Alternative | Tradeoff |
|---|---|---|---|
| Language / build | **TypeScript + Vite** | Plain JS | Types keep the recipe schema and parameters consistent as they grow |
| UI | **Svelte** or **Preact** (small bundle, NFR-12) | React | React is fine but heavier; the UI here is mostly sliders and a canvas |
| Rendering | **WebGL2 fragment shaders** for noise fields; Canvas 2D or a worker for scatter textures (T5) | WebGPU | WebGPU is faster and more modern, but support on the iPhone 16 needs a recent iOS. Revisit for v2. |
| Noise | Simplex / OpenSimplex2 + Worley, written in-house in GLSL using **integer-hash** randomness | Third-party library | In-house code with integer hashing gives the best determinism across GPUs (FR-2, NFR-6) |
| PRNG (CPU side) | PCG32 or xoshiro128** seeded from `seed` | `Math.random()` | `Math.random()` can't be seeded |
| Export | `canvas.toBlob()` → insert a PNG `tEXt` chunk with the recipe → Web Share API | Server-side rendering | Client-side keeps it free to run, private and offline |
| Storage | IndexedDB for presets (FR-25) | localStorage | localStorage is small and synchronous |
| Hosting | Static host (Netlify, Vercel, Cloudflare Pages); no backend in v1 | — | Near-zero running cost |
| Path to app stores | Wrap later with Capacitor if native features (set wallpaper on Android) justify it | — | Keeps that option open without building it now |

---

## 11. MVP Scope (90-day horizon)

**In:** app interface built to Look Guide Part A; **5 textures (T12, T4, T5, T3, T6)** with grain as a finish; 5 palette families; §5.2 global controls; §5.3 params for the chosen textures; §5.5 grain/vignette/dither; calm clock zone; phone-mockup preview; 12 signature presets; save/load presets plus JSON backup; PNG/JPEG export at native resolution through the share sheet; "how to set your wallpaper" guide; installable offline PWA; preset licensing marks and terms page (FR-26 to FR-28).

**Out (later):** layering, lighting/relief, light/dark pairs, palette from photo, share codes, batch export, T7–T14, animated wallpapers, native app wrapper.

**Suggested phasing:**

| Weeks | Milestone |
|---|---|
| 1–2 | Look Guide approved ✅ (v1.0 drafted); WebGL prototype of Fabric Weave + Marble with live sliders, in the Look Guide interface, on the iPhone 16 |
| 3–6 | Remaining MVP textures, palette system, recipe model, presets, export |
| 7–9 | PWA install and offline, licensing flow, readability check, 12 signature presets |
| 10–12 | Polish, test with 5–10 real users, launch |

**Success criteria:**
- A new user saves a wallpaper to Photos in under 60 seconds.
- Preview meets NFR-1 on the iPhone 16.
- 100 % of built-in presets pass the readability check (§6) and the Look Guide test (§4.1).

---

## 12. Open Questions

**Resolved in v1.1** → see §1.3 (platform, business model, licensing, aesthetic, reference device).

**Still open:**

1. ~~What is the signature look?~~ **Resolved in v1.2:** Modern Editorial ([`LOOK_GUIDE.md`](LOOK_GUIDE.md)). Part B of the Look Guide (textures, palettes, presets) still needs owner approval.
2. **How does the tool earn money (or does it)?** Options: free (a portfolio and brand piece that drives traffic to your art), a one-time unlock of premium textures, or pay-what-you-want. Recommendation: **free core plus a paid "signature collection" unlock**, decided before week 7 so licensing and the paywall can be built together.
3. **Confirm the "modified" threshold** for preset licensing (§3.5): does a seed-only change keep an export personal-use-only? Recommendation: yes.
4. **Is "users own their exports" on top of a preset someone else designed acceptable to you as the presets' creator?** The modified rule protects the presets themselves, but heavily edited versions of your signature look become user-owned. Confirm you're comfortable with that.

---

## Change Log

| Version | Date | Change |
|---|---|---|
| v1.0 | 2026-11-27 | Initial draft: requirements, texture catalog, customization spec, output specs, data model |
| v1.1 | 2026-11-27 | Recorded product decisions D1–D5. Web/PWA: replaced direct set-wallpaper with share sheet and a how-to guide, dropped system-theme matching, relaxed cross-device determinism, added PWA requirements (FR-23–25), rewrote the tech approach. Licensing: added recipe origin tracking and preset-license rules (FR-26–28). Curated look: added the Look Guide and guardrails (§4.1) and cut palettes to 4–6 families. iPhone 16 is the performance reference. Re-prioritized personas, phased the MVP, new open questions. |
| v1.2 | 2026-11-27 | Visual direction set: linked the new `LOOK_GUIDE.md` ("Modern Editorial"). MVP textures fixed at T12, T4, T5, T3, T6 (Fabric Weave promoted, Gradient Mesh cut, Grain becomes a finish). Palette families narrowed to the 5 in Look Guide B2. Defaults made on-brand. Off-brand effects hidden. Dark variants use their own chosen palettes instead of `darkShift`. Example recipe updated. Open question 1 resolved. |
