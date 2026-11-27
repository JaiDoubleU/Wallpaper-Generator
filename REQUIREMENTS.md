# Textured Mobile Wallpaper Generator — Requirements

| Field | Value |
|---|---|
| Document | Wallpaper Generator Requirements |
| Version | v1.0 |
| Status | **Draft** (pending answers to [Open Questions](#12-open-questions)) |
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

---

## 2. Users and Use Cases

| Persona | Need | Key use case |
|---|---|---|
| Casual user | A fresh, attractive wallpaper in seconds | Tap **Randomize** until something looks right, then export |
| Aesthetic tinkerer | Fine control to match their phone case, outfit or theme | Tweak palette, grain and lighting; save as a preset |
| Creator / artist | Original textures to sell or share as packs | Batch-export a series from one recipe with varied seeds |

---

## 3. Functional Requirements

Priority: **M** = must (MVP), **S** = should, **C** = could.

### 3.1 Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Generate an image from a texture type, parameter set, palette and seed. | M |
| FR-2 | Identical recipe + seed + resolution produces a pixel-identical image on the same platform. | M |
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
| FR-16 | Export at the device's native resolution by default (see §7). | M |
| FR-17 | Formats: PNG (lossless) and JPEG (quality 85–100). HEIC/WebP optional. | M |
| FR-18 | Save to the photo library / gallery; system share sheet. | M |
| FR-19 | On Android, set the wallpaper directly (home, lock or both). iOS does not allow this; guide the user through Photos instead. | S |
| FR-20 | Export a matched pair: a lock-screen version and a home-screen version (for example, dimmed or blurred). | S |
| FR-21 | Batch export N seeds of one recipe as a ZIP (creator use case). | C |
| FR-22 | Export at custom dimensions or presets for tablets, desktops and watches. | C |

---

## 4. Texture Catalog

Each texture type is a generator with its own parameters (§5.3) on top of the shared controls. The MVP ships the first six.

| # | Texture | Technique | Look | MVP |
|---|---|---|---|---|
| T1 | **Grain / Film** | Per-pixel noise, Gaussian or uniform | Analog, matte, risograph | ✅ |
| T2 | **Gradient Mesh** | Multi-point smooth color interpolation + grain | Soft modern "aura" gradients | ✅ |
| T3 | **Fluid / Marble** | Domain-warped fractal noise (fBm) | Marble, ink, smoke, oil | ✅ |
| T4 | **Paper / Canvas** | Layered fine noise + fiber streaks + emboss | Watercolor paper, linen, kraft | ✅ |
| T5 | **Terrazzo / Speckle** | Poisson-disk scatter of irregular polygons | Stone chips, confetti | ✅ |
| T6 | **Topographic** | Iso-contour lines of a noise field | Map contours, wood rings | ✅ |
| T7 | Cellular / Voronoi | Worley noise | Cracked earth, cells, leather, scales | |
| T8 | Waves / Ripples | Summed sine fields, interference | Water, sand dunes, fabric moiré | |
| T9 | Brushed Metal | Directional motion-blurred noise + specular | Aluminium, steel | |
| T10 | Halftone | Dot or line screen over a field | Print, pop-art | |
| T11 | Geometric Tiles | Truchet / hex / triangle grids with jitter | Tiles, mosaic | |
| T12 | Fabric Weave | Interleaved thread pattern + noise | Denim, tweed, linen | |
| T13 | Stucco / Plaster | Ridged noise + normal-mapped lighting | Wall plaster, concrete | |
| T14 | Bokeh / Light | Blurred additive circles | Dreamy, nightlife | |

---

## 5. Customization Specification

These are the controls that shape look and feel. Ranges are normalized where possible so that recipes stay resolution-independent. "Size" values are **fractions of the shorter image edge** unless stated otherwise.

### 5.1 Color and Palette

| Parameter | Type | Range / Options | Default | Notes |
|---|---|---|---|---|
| `palette.mode` | enum | `monochrome`, `analogous`, `complementary`, `split-complementary`, `triadic`, `custom`, `image-extract` | `analogous` | Harmony rule used to derive colors from a base hue |
| `palette.baseColor` | color | any (hex / HSL / OKLCH) | `#6B5B95` | Seed color for harmony modes |
| `palette.colors` | color[] | 1–6 stops | derived | Editable in `custom` mode |
| `palette.stopPositions` | float[] | 0–1 | evenly spaced | Gradient-map positions |
| `palette.colorSpace` | enum | `oklch`, `srgb`, `lab` | `oklch` | OKLCH interpolation avoids muddy midpoints |
| `palette.temperature` | float | −1 (cool) … +1 (warm) | 0 | Global white-balance shift |
| `palette.saturation` | float | 0–2 | 1 | Global multiplier |
| `palette.lightnessRange` | [float, float] | 0–1 | [0.15, 0.85] | Clamps the darkest and lightest output |
| `palette.extractFromImage` | image | user photo | — | Pulls 3–6 dominant colors (k-means); the photo is not stored |
| `palette.matchSystemTheme` | bool | — | false | Android 12+ Material You / iOS accent harmony |

**Built-in palette families:** Earthy, Pastel, Jewel, Neon, Monochrome Ink, Desert, Ocean, Forest, Sunset, Paper & Ink, Midnight, Seasonal (4).

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
| `light.color` | color | — | `#FFFFFF` | Tints the highlights |
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
| `appearance.darkShift` | float | 0.6 | How far the lightness drops for the dark variant |
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

Default to the **detected device's native pixel resolution**. The presets below are reference values; **verify them against current manufacturer specs before release**, because new models ship every year.

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
| Color profile | sRGB embedded by default; Display P3 optional on supported devices |
| Bit depth | 8-bit per channel (dithered); 16-bit PNG optional |
| PNG | Lossless, compressed; typically 3–12 MB at QHD+ for grainy textures |
| JPEG | Quality 92 default; 4:4:4 chroma (no subsampling) to keep fine grain crisp |
| Metadata | Recipe JSON (FR-15); strip location and device identifiers |
| File naming | `wallpaper_{texture}_{seed}_{width}x{height}.{ext}` |

---

## 8. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | Preview (at reduced resolution) updates in ≤ 100 ms after a parameter change on a mid-range phone (about 3 years old). |
| NFR-2 | Performance | Full-resolution render ≤ 2 s for MVP textures on a mid-range phone; show progress if longer. |
| NFR-3 | Performance | Rendering runs on the GPU (shaders) where available, with a CPU fallback. |
| NFR-4 | Memory | Peak memory during a QHD+ export stays under 300 MB. |
| NFR-5 | Offline | All generation works fully offline. |
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
  "name": "Dusk Marble",
  "seed": 2837461,
  "texture": {
    "type": "fluid-marble",
    "params": { "warpIterations": 2, "veinSharpness": 0.7, "flowAngle": 30 }
  },
  "global": {
    "scale": 0.3, "rotation": 0, "contrast": 1.1, "brightness": 0,
    "detail": 6, "roughness": 0.5, "lacunarity": 2.0,
    "warpStrength": 1.2, "warpScale": 0.4, "anisotropy": 0, "tileable": false
  },
  "palette": {
    "mode": "custom",
    "colorSpace": "oklch",
    "colors": ["#1B1A33", "#4B3F72", "#C97B84", "#F2D0A9"],
    "stopPositions": [0, 0.35, 0.7, 1],
    "temperature": 0.1, "saturation": 1.0
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

## 10. Technical Approach (recommended, not binding)

| Decision | Recommendation | Alternative | Tradeoff |
|---|---|---|---|
| Platform | **Flutter** (one codebase for iOS and Android, GPU fragment shaders) | Native Swift (Metal) + Kotlin | Native gives top performance and system integration, at double the build cost |
| | | PWA / web (WebGL) | Fastest to ship and share; but no direct "set wallpaper" and weaker photo-library integration |
| Rendering | GPU fragment shaders for noise fields, CPU only for scatter textures (T5) | All on CPU | Simpler, but too slow for live preview at high detail |
| Noise | Simplex / OpenSimplex2 + Worley, implemented in-house with fixed constants | Third-party noise library | In-house guarantees determinism across versions (NFR-6) |
| PRNG | PCG32 or xoshiro128** seeded from `seed` | Platform `Random` | Platform RNGs are not guaranteed stable across OS versions |

---

## 11. MVP Scope (90-day horizon)

**In:** T1–T6 textures, §5.1 palette (without image extraction), §5.2 global controls, §5.3 MVP params, §5.5 grain/vignette/dither, calm clock zone, phone-mockup preview, 12 presets, save/load presets, PNG/JPEG export at native resolution, Android set-wallpaper.

**Out (v1.1+):** layering, lighting/relief, light/dark pairs, palette from photo, share codes, batch export, T7–T14, animated wallpapers.

**Success criteria:**
- A new user exports a wallpaper in under 60 seconds.
- Preview meets NFR-1 on the reference mid-range device.
- 100 % of built-in presets pass the readability check (§6).

---

## 12. Open Questions

These change scope or architecture and need decisions before v1.0 is final.

1. **Platform:** native iOS + Android app, Flutter, or web/PWA first?
2. **Business model:** free, one-time purchase, freemium (premium textures/packs), or a tool for producing *your own* wallpaper packs to sell? This decides whether batch export and licensing (§3.4 FR-21) are MVP.
3. **Output ownership and licensing:** who owns generated images, and may users sell them? Recommendation: users own their exports; built-in presets are licensed for personal use only.
4. **Brand / aesthetic direction:** a broad toolkit, or a curated signature look? A curated look is easier to market and differentiate.
5. **Reference device** for the performance targets (NFR-1, NFR-2).

---

## Change Log

| Version | Date | Change |
|---|---|---|
| v1.0 | 2026-11-27 | Initial draft: requirements, texture catalog, customization spec, output specs, data model |
