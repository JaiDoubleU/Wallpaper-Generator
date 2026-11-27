# Look Guide — Modern Editorial

| Field | Value |
|---|---|
| Document | Look Guide |
| Version | v1.0 |
| Status | **Working draft**: Part A follows the owner's brief directly; Part B is derived from it and **needs owner approval** |
| Last updated | 2026-11-27 |
| Purpose | The test every screen, texture, palette and preset must pass. Referenced by `REQUIREMENTS.md` (D4, §4.1). |
| Source | Owner's brief "Curated Visual Direction — Modern Editorial", kept word for word in the [Appendix](#appendix--source-brief-verbatim) |

---

## 0. Guiding Principle

**Quiet sophistication: crafted, not manufactured.**

| Be | Without being |
|---|---|
| Premium | Pretentious |
| Minimal | Sterile |
| Organic | Rustic |
| Distinctive | Hard to use |
| Sophisticated | Complex |

**Scope.** This guide covers two things that share one look:

- **Part A — the app interface:** what people see while they make a wallpaper.
- **Part B — the wallpaper output:** the textures, palettes and presets the app produces.

The brief describes Part A directly. Part B applies the same principles to the images themselves.

---

# Part A — App Interface

## A1. Color Tokens

### Core palette (from the brief)

| Token | Hex | Role |
|---|---|---|
| `linen` | `#E8E4DA` | Light background, light-mode canvas |
| `stone` | `#B8B1A2` | Borders, dividers, inactive tracks (decoration only, see contrast) |
| `taupe` | `#857C6D` | Large secondary text, icons, metadata |
| `charcoal` | `#242423` | Primary text (light mode), surfaces (dark mode) |
| `indigo` | `#4658A6` | Accent: interactive states, focus, single focal points |

### Added tokens (proposed, needed for accessibility and dark mode)

| Token | Hex | Why it's needed |
|---|---|---|
| `ivory` | `#F2EEE3` | Dark-mode text: soft ivory, not stark white, as the brief asks |
| `taupe-deep` | `#6B6357` | Small secondary text on linen. Plain taupe is only 3.2:1 |
| `charcoal-deep` | `#1A1A19` | Dark-mode background, one tone below the charcoal surfaces |
| `indigo-light` | `#8C9BE0` | Dark-mode accent. Brand indigo is only 2.4:1 on charcoal |
| `stone-dim` | `#9A9384` | Dark-mode secondary text |

### Light and dark themes

Each mode is chosen on its own, not inverted from the other.

| Role | Light | Dark |
|---|---|---|
| Background (textured) | `linen` | `charcoal-deep` |
| Raised surface (sheets, menus) | `#EFEBE2` (a lighter step of linen) | `charcoal` |
| Primary text | `charcoal` | `ivory` |
| Secondary text | `taupe-deep` | `stone-dim` |
| Large or tertiary text, icons | `taupe` | `stone` |
| Border / divider | `stone` at 60 % | `#3A3936` |
| Accent | `indigo` | `indigo-light` |
| Text on accent | `linen` | `charcoal-deep` |

### Contrast check (WCAG 2.2)

AA requires 4.5:1 for body text, and 3:1 for large text and UI component edges.

| Pair | Ratio | Verdict |
|---|---|---|
| charcoal on linen | 12.2 | ✅ AAA |
| taupe-deep on linen | 4.7 | ✅ AA body |
| taupe on linen | 3.2 | ⚠️ Large text and icons only |
| stone on linen | 1.7 | ❌ Decoration only. Not enough for the edge of an input or button on its own. |
| indigo on linen (and linen on indigo) | 5.2 | ✅ AA body |
| ivory on charcoal-deep | 15.0 | ✅ AAA |
| stone on charcoal | 7.3 | ✅ AAA |
| stone-dim on charcoal | 5.1 | ✅ AA body |
| indigo on charcoal | 2.4 | ❌ Use indigo-light in dark mode |
| indigo-light on charcoal | 5.8 | ✅ AA body |

**Rule:** measure text contrast against the *darkest* pixel of the linen texture in light mode, and the *lightest* in dark mode, never against the flat hex value.

### Accent discipline

- Indigo marks **interactivity and focus only**: the active slider thumb, focus rings, the primary action, the selected preset.
- At most **one indigo focal point per view**.
- Never use indigo for decoration, section headers or large fills.

## A2. Typography

| Role | Recommended | Alternatives | Why |
|---|---|---|---|
| Display / headings (serif) | **Newsreader** (variable, with optical sizes) | Cormorant Garamond (more high-fashion, fragile at small sizes); Fraunces (warmer, quirkier) | Designed for editorial use; elegant when oversized and still sturdy at subheading size |
| Interface (sans) | **Instrument Sans** | Inter (very legible but widely used in SaaS products, which is the look to avoid) | Contemporary and slightly characterful; doesn't read as a generic dashboard |

- All of these are **SIL Open Font License** fonts. Self-host them as WOFF2 files so the app works offline (FR-24) and makes no third-party requests. Subset them to Latin to keep the bundle small (NFR-12).
- Hierarchy comes from **size, weight, letter spacing and line height**, not color.

### Type scale

| Token | Font | Size (mobile → desktop) | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| `display` | Serif | 44 → 88 px (`clamp`) | 300–400 | 1.0 | −0.02 em |
| `h1` | Serif | 32 → 56 px | 400 | 1.1 | −0.015 em |
| `h2` | Serif | 24 → 32 px | 400 | 1.2 | −0.01 em |
| `body` | Sans | 16 px | 400 | 1.5 | 0 |
| `label` | Sans | 14 px | 500 | 1.3 | +0.01 em |
| `caption` / `overline` | Sans | 12 px, uppercase for overline | 500 | 1.3 | +0.08 em |
| `numeric` (slider values) | Sans, tabular figures | 14 px | 400 | 1 | 0 |

Respect the user's text-size setting (NFR-8): sizes are in `rem`, and the layout must survive 200 % zoom.

## A3. Space, Grid and Layout

- **Base unit:** 4 px. **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Margins:** 24 px on mobile (generous, never below 16), 48 px on tablet, and 64 px or more on desktop.
- **Grid:** 4 columns on mobile, 8 on tablet, 12 on desktop, with 16–24 px gutters. Intentional asymmetry is fine: for example, a heading over columns 1–3 and content offset to columns 2–4.
- **Structure comes from space and alignment**, not boxes. Use a thin divider only where whitespace isn't enough.
- **Mobile editor layout:** the wallpaper preview is the hero and takes about 65 % of the height. Controls sit in a bottom sheet on a tonal surface, grouped by section heading (*Color · Shape · Surface · Effects · Layout*), with no card around each group.
- **Preset gallery:** presented like a gallery wall. Each thumbnail is in a phone shape with a serif title and a small sans caption underneath (texture · palette). No card containers, no shadows.

## A4. Shape, Borders and Elevation

| Property | Value |
|---|---|
| Corner radius | 2 px (inputs, small controls), 6 px (buttons, sheets), 12 px (wallpaper thumbnails and the phone preview) |
| Borders | 1 px hairline in the border token. Stone at 60 % in light mode, `#3A3936` in dark |
| Shadows | **None** on content. One soft shadow is allowed only on the floating bottom sheet: `0 -1px 0` hairline + `0 -8px 24px rgba(36,36,35,0.06)` |
| Gradients | None in the interface. Texture provides the depth. |
| Buttons | Rectangular with a 6 px radius, at least 44 px tall (touch target). **Primary:** indigo fill with linen text. **Secondary:** hairline outline. **Tertiary:** text with an underline on hover or focus. No pill shapes. |
| Sliders | 1 px stone track, charcoal filled portion, 20 px thumb (indigo while dragging), value shown in tabular figures |
| Focus | 2 px indigo ring, offset 2 px. Always visible on keyboard focus. |

Interactive elements must still be recognizable without color: underlines, outlines or a clear shape.

## A5. Iconography

- Line icons on a 24 px grid with **1.5 px stroke**, round caps and joins.
- Recommended set: **Lucide** (ISC license) set to `stroke-width: 1.5`. Alternative: Phosphor *Light*.
- Icons sit beside text labels. Icon-only buttons need an accessible label and a tooltip.

## A6. Background Linen Texture

The app's own background is a wallpaper made by its own engine. The product shows what it can do before the user touches anything.

| Property | Light | Dark |
|---|---|---|
| Generator | Fabric Weave (T12), fine scale | Same |
| Base | `linen` | `charcoal-deep` |
| Luminance variation | ±3–4 % | ±2–3 % |
| Rendering | Generated once at device resolution and cached as an image. Never regenerated while scrolling. | Same |
| Reduced transparency / high contrast | Falls back to the flat color | Same |

## A7. Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `instant` | 100 ms | `ease-out` | Hover, press, toggle |
| `quick` | 200 ms | `cubic-bezier(0.2, 0, 0, 1)` | Slider feedback, tabs, small reveals |
| `settle` | 360 ms | `cubic-bezier(0.2, 0, 0, 1)` | Bottom sheet, page changes, preset → editor |
| `reveal` | 600 ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Cross-fade to a newly generated wallpaper |

- Motion explains state changes: a new wallpaper fades in over the old one, it never pops.
- No bouncing, parallax scrolling or looping animation in the interface.
- With **Reduce Motion** on: fades only, at most 150 ms.

## A8. Interface Do / Don't

| Do | Don't |
|---|---|
| Oversized serif heading with a small sans label underneath | Gradient hero banners |
| Whitespace and alignment as structure | A card around every group |
| Thin dividers when needed | Heavy shadows, floating cards |
| One indigo focal point | Several accent colors, colored section backgrounds |
| Tonal surfaces | Glassmorphism, neon, glow |
| Text-led navigation | Dashboard-style stat tiles, badge clutter |

---

# Part B — Wallpaper Output (derived, needs approval)

The same principles applied to the images: **natural materials, restrained palette, texture and contrast instead of decoration.**

## B1. Texture Selection for MVP

| Texture | Verdict | Reason |
|---|---|---|
| **T12 Fabric Weave (linen)** | ✅ **Promoted into MVP** | Linen is the signature material named in the brief |
| **T4 Paper / Canvas** | ✅ MVP | Natural material, editorial feel |
| **T5 Terrazzo / Stone** | ✅ MVP, restrained | "Stone" in the brief. Small chips in tonal colors only, no confetti |
| **T3 Marble** | ✅ MVP, restrained | Stone. Low warp, soft veins, no psychedelic swirls |
| **T6 Topographic** | ✅ MVP | Architectural line work, ink on paper |
| T1 Grain | ↪ **Becomes a finish**, not a standalone texture | Grain belongs on every texture (`fx.grain`), but on its own it's too thin to be a signature style |
| T2 Gradient Mesh | ❌ **Cut from MVP** | Conflicts with "avoid excessive gradients" and is the most generic look in wallpaper apps. Could return later as a restrained *Tonal Wash*. |
| T13 Stucco / Plaster | Next candidate (v1.x) | Gallery-wall material that fits very well |

**Result: 5 MVP textures** (T12, T4, T5, T3, T6) plus grain as a finish.

## B2. Wallpaper Palette Families

There are 5 families, all built from the core palette. Each family has **separately chosen light and dark versions** (not inversions), matching the brief's rule for light and dark modes.

| Family | Light version | Dark version | Character |
|---|---|---|---|
| **Natural Linen** | `#F2EEE3` `#E8E4DA` `#D6D0C2` `#B8B1A2` | `#2B2A27` `#242423` `#3A3832` `#857C6D` | The signature: warm, quiet, tactile |
| **Warm Stone** | `#CFC8B9` `#B8B1A2` `#9A9384` `#857C6D` | `#1E1D1B` `#3A3936` `#5A5751` `#857C6D` | Mineral, grounded |
| **Charcoal** | `#5A5751` `#3A3936` `#242423` `#B8B1A2` | `#121211` `#1A1A19` `#242423` `#3A3936` | Deep, gallery-at-night, OLED-friendly |
| **Indigo Dye** | `#E8E4DA` `#6F7FC0` `#4658A6` `#2E3A73` | `#151A33` `#2E3A73` `#4658A6` `#8C9BE0` | Indigo-dyed cloth, like shibori. The only family where indigo is the main color. |
| **Ink on Paper** | `#E8E4DA` + `#242423` | `#1A1A19` + `#D6D0C2` | Two-tone, for topographic lines and line work |

**Indigo rule:** outside the Indigo Dye family, indigo covers **no more than 10 %** of a wallpaper's area. It stays an accent there too.

## B3. On-brand Parameter Limits (Randomize and Simple mode)

| Parameter | Full range (§5) | On-brand range |
|---|---|---|
| `palette.saturation` | 0–2 | 0–0.8 |
| `contrast` | 0–2 | 0.6–1.2 |
| `warpStrength` | 0–2 | 0–0.8 |
| `fx.grain` | 0–1 | 0.04–0.15 |
| `fx.vignette.amount` | 0–1 | 0–0.25 |
| `relief.depth` (v1.x) | 0–1 | 0.1–0.4 |
| `surface.finish` | 4 options | `matte`, `satin` |

**Left out of the curated look** (removed from the interface in v1; could come back as an "Experimental" toggle later): chromatic aberration, posterize, invert, kaleidoscope symmetry, neon or custom off-palette colors in Simple mode.

## B4. Signature Presets (12)

| # | Name | Texture | Family | Notes |
|---|---|---|---|---|
| 1 | Morning Linen | Weave | Natural Linen (light) | The app's default |
| 2 | Evening Linen | Weave | Natural Linen (dark) | Its dark counterpart |
| 3 | Indigo Cloth | Weave | Indigo Dye | Coarser weave, visible threads |
| 4 | Cold Press | Paper | Natural Linen | Watercolor-paper tooth |
| 5 | Kraft & Ink | Paper | Warm Stone | Fibrous |
| 6 | Gallery Floor | Terrazzo | Warm Stone | Small tonal chips |
| 7 | Night Terrazzo | Terrazzo | Charcoal | Stone-colored chips on deep charcoal |
| 8 | Quiet Marble | Marble | Natural Linen | Soft taupe veins |
| 9 | Nero Marble | Marble | Charcoal | Ivory veins, OLED-friendly |
| 10 | Contour | Topographic | Ink on Paper (light) | Fine charcoal lines on linen |
| 11 | Contour Night | Topographic | Ink on Paper (dark) | Hairline lines on charcoal |
| 12 | Indigo Survey | Topographic | Indigo Dye | Lines over a deep indigo field |

Every preset ships as a **light and dark pair** where that makes sense, each version chosen separately.

## B5. Quality Bar for Every Texture and Preset

A texture or preset ships only if it passes all of these:

- [ ] Three random seeds out of three look good enough to post.
- [ ] It reads as a **material** (cloth, paper, stone, ink), not as a "digital effect."
- [ ] Clock and icons stay readable: passes the §6 readability check in `REQUIREMENTS.md`.
- [ ] No visible banding on the iPhone 16 at full brightness.
- [ ] Looks right next to the app interface, as if from the same publication.
- [ ] Light and dark versions each look deliberately designed.

---

## Open Points for the Owner

1. **Approve Part B?** The biggest calls are cutting Gradient Mesh, making Grain a finish, and promoting Fabric Weave.
2. **Fonts:** Newsreader + Instrument Sans, or one of the alternatives? A quick type specimen would settle it.
3. **Added color tokens** (`ivory`, `taupe-deep`, `charcoal-deep`, `indigo-light`, `stone-dim`): these are needed for accessibility. Adjust the exact values if you like, but keep the contrast ratios.

---

## Change Log

| Version | Date | Change |
|---|---|---|
| v1.0 | 2026-11-27 | First version from the owner's Modern Editorial brief. Part A: interface tokens, type, layout, motion. Part B: textures, palettes, presets, quality bar (derived, needs approval). |

---

## Appendix — Source Brief (verbatim)

> **Curated Visual Direction — Modern Editorial**
>
> Create a sophisticated, tactile web application that combines the warmth of natural materials with the precision of contemporary digital design. The experience should feel intentionally curated, understated and timeless, rather than like a conventional software interface.
>
> **Visual Aesthetic**
>
> * Incorporate subtle linen-textured backgrounds that introduce depth and warmth without distracting from the content.
> * Use a restrained, organic colour palette inspired by natural fabrics, stone, charcoal and warm neutrals.
> * Embrace generous whitespace to create breathing room and establish a clear visual hierarchy.
> * Use refined editorial layouts with deliberate alignment, balanced proportions and thoughtful composition.
> * Minimize ornamentation, ensuring every visual element serves a purpose.
> * Create visual interest through typography, texture, scale and contrast rather than decorative elements.
>
> **Colour Palette**
>
> * Natural Linen: #E8E4DA
> * Warm Stone: #B8B1A2
> * Muted Taupe: #857C6D
> * Charcoal: #242423
> * Indigo Accent: #4658A6
>
> Use accent colours sparingly to communicate interactivity, emphasize important information and establish focal points.
>
> **Typography**
>
> Combine an expressive, elegant serif typeface for headings with a clean, contemporary sans-serif for functional interface elements.
>
> Oversized editorial headings should establish character, while smaller interface typography remains highly legible and accessible. Use intentional variations in font size, weight, letter spacing and line height to establish hierarchy without relying heavily on colour.
>
> **Light and Dark Modes**
>
> Light Mode
>
> * Natural linen-textured backgrounds.
> * Warm, neutral surface colours.
> * Rich charcoal typography.
> * Subtle, understated borders.
> * Restrained indigo accents.
>
> Dark Mode
>
> * Deep charcoal or black linen-textured backgrounds.
> * Soft ivory typography rather than stark white.
> * Subtle tonal differences between surfaces.
> * Muted borders and carefully controlled contrast.
> * Consistent accent colours adapted for accessibility.
>
> Both modes should feel independently curated rather than simply being colour inversions of one another.
>
> **Interface Components**
>
> * Use understated borders, subtly rounded corners and tonal surfaces.
> * Minimize shadows and avoid unnecessary visual elevation.
> * Avoid excessive gradients, oversized pill-shaped buttons and unnecessary card containers.
> * Allow content, typography and spacing to establish structure rather than enclosing everything in boxes.
> * Use thin dividers where separation is necessary.
> * Maintain consistent spacing, alignment and component proportions.
> * Incorporate simple, refined iconography with consistent stroke weights.
> * Ensure interactive elements are recognizable without introducing unnecessary visual noise.
>
> **Layout and Composition**
>
> Draw inspiration from premium editorial publications, contemporary art galleries, architectural portfolios and high-end lifestyle brands.
>
> Use a flexible grid system, intentional asymmetry where appropriate, and generous margins. Establish clear focal points and avoid overcrowding the interface.
>
> The layout should feel composed rather than assembled from generic UI components, while remaining responsive, intuitive and functional across screen sizes.
>
> **Motion and Interaction**
>
> Interactions should feel fluid, deliberate and responsive.
>
> Incorporate gentle transitions, subtle hover states and restrained micro-animations that reinforce the tactile quality of the experience without compromising usability.
>
> Avoid excessive animation or movement that competes with the content. Motion should communicate state changes, provide feedback and guide attention naturally.
>
> **Accessibility and Usability**
>
> Maintain appropriate colour contrast, readable typography, clear interaction states and intuitive navigation. Ensure that background textures remain subtle enough not to interfere with readability.
>
> The curated aesthetic should enhance the user experience, never come at the expense of functionality or accessibility.
>
> **Overall Impression**
>
> The application should feel like a beautifully designed editorial publication translated into an intuitive digital experience.
>
> Premium without being pretentious.
> Minimal without feeling sterile.
> Organic without feeling rustic.
> Distinctive without sacrificing functionality.
> Sophisticated without introducing complexity.
>
> Avoid the generic SaaS aesthetic, excessive use of cards, conventional dashboard styling and visually noisy interface patterns.
>
> The guiding design principle is quiet sophistication — an interface that feels crafted rather than manufactured.
