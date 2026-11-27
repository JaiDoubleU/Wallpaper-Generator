// Recipe model (Requirements §9), textures, palette families (Look Guide B2)
// and signature presets (Look Guide B4).

export const ENGINE_VERSION = '0.1.0';

export type TextureType = 'weave' | 'marble';
export type Variant = 'light' | 'dark';

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  uniform: string;
  /** Converts the stored value to the uniform value (e.g. degrees → radians). */
  toUniform?: (v: number) => number;
  format?: (v: number) => string;
}

const deg = (v: number) => (v * Math.PI) / 180;
const pct = (v: number) => `${Math.round(v * 100)}`;
const fixed1 = (v: number) => v.toFixed(1);
const fixed2 = (v: number) => v.toFixed(2);
const degLabel = (v: number) => `${Math.round(v)}°`;

export interface TextureDef {
  label: string;
  material: string;
  params: ParamDef[];
}

export const TEXTURES: Record<TextureType, TextureDef> = {
  weave: {
    label: 'Linen',
    material: 'Fabric weave',
    params: [
      { key: 'density', label: 'Thread count', min: 40, max: 360, step: 1, uniform: 'uDensity', format: (v) => `${Math.round(v)}` },
      { key: 'slub', label: 'Irregularity', min: 0, max: 1, step: 0.01, uniform: 'uSlub', format: pct },
      { key: 'variation', label: 'Thread variation', min: 0, max: 1, step: 0.01, uniform: 'uVariation', format: pct },
      { key: 'relief', label: 'Weave depth', min: 0, max: 1, step: 0.01, uniform: 'uRelief', format: pct },
      { key: 'mottle', label: 'Mottling', min: 0, max: 1, step: 0.01, uniform: 'uMottle', format: pct },
      { key: 'mottleScale', label: 'Mottle size', min: 0.05, max: 1, step: 0.01, uniform: 'uMottleScale', format: fixed2 },
    ],
  },
  marble: {
    label: 'Marble',
    material: 'Stone',
    params: [
      { key: 'scale', label: 'Scale', min: 0.15, max: 1.5, step: 0.01, uniform: 'uScale', format: fixed2 },
      { key: 'warp', label: 'Flow', min: 0, max: 1, step: 0.01, uniform: 'uWarp', format: pct },
      { key: 'veinCount', label: 'Vein count', min: 0.4, max: 4, step: 0.05, uniform: 'uVeinCount', format: fixed1 },
      { key: 'veinSharp', label: 'Vein sharpness', min: 0, max: 1, step: 0.01, uniform: 'uVeinSharp', format: pct },
      { key: 'veinStrength', label: 'Vein strength', min: 0, max: 1, step: 0.01, uniform: 'uVeinStrength', format: pct },
      { key: 'flowAngle', label: 'Direction', min: 0, max: 180, step: 1, uniform: 'uFlowAngle', toUniform: deg, format: degLabel },
      { key: 'cloud', label: 'Clouding', min: 0, max: 1, step: 0.01, uniform: 'uCloud', format: pct },
      { key: 'groundTone', label: 'Ground tone', min: 0, max: 1, step: 0.01, uniform: 'uGroundTone', format: pct },
      { key: 'veinTone', label: 'Vein tone', min: 0, max: 1, step: 0.01, uniform: 'uVeinTone', format: pct },
    ],
  },
};

/** Shared controls. Ranges follow the on-brand limits in Look Guide B3. */
export const GLOBAL_PARAMS: (ParamDef & { group: 'colour' | 'finish' | 'layout' })[] = [
  { group: 'colour', key: 'saturation', label: 'Saturation', min: 0, max: 1, step: 0.01, uniform: 'uSaturation', format: pct },
  { group: 'colour', key: 'warmth', label: 'Warmth', min: -1, max: 1, step: 0.01, uniform: 'uWarmth', format: (v) => (v > 0 ? `+${pct(v)}` : pct(v)) },
  { group: 'finish', key: 'contrast', label: 'Contrast', min: 0.6, max: 1.2, step: 0.01, uniform: 'uContrast', format: fixed2 },
  { group: 'finish', key: 'brightness', label: 'Brightness', min: -0.3, max: 0.3, step: 0.01, uniform: 'uBrightness', format: (v) => (v > 0 ? `+${pct(v)}` : pct(v)) },
  { group: 'finish', key: 'grain', label: 'Grain', min: 0, max: 0.15, step: 0.005, uniform: 'uGrain', format: (v) => `${Math.round(v * 1000) / 10}` },
  { group: 'finish', key: 'vignette', label: 'Vignette', min: 0, max: 0.25, step: 0.01, uniform: 'uVignette', format: pct },
  { group: 'finish', key: 'rotation', label: 'Rotation', min: 0, max: 180, step: 1, uniform: 'uRotation', toUniform: deg, format: degLabel },
  { group: 'layout', key: 'calm', label: 'Calm behind clock', min: 0, max: 1, step: 0.01, uniform: 'uCalm', format: pct },
];

export interface Family {
  id: string;
  name: string;
  character: string;
  light: string[];
  dark: string[];
}

export const FAMILIES: Family[] = [
  { id: 'natural-linen', name: 'Natural Linen', character: 'Warm, quiet, tactile', light: ['#F2EEE3', '#E8E4DA', '#D6D0C2', '#B8B1A2'], dark: ['#2B2A27', '#242423', '#3A3832', '#857C6D'] },
  { id: 'warm-stone', name: 'Warm Stone', character: 'Mineral, grounded', light: ['#CFC8B9', '#B8B1A2', '#9A9384', '#857C6D'], dark: ['#1E1D1B', '#3A3936', '#5A5751', '#857C6D'] },
  { id: 'charcoal', name: 'Charcoal', character: 'Gallery at night', light: ['#5A5751', '#3A3936', '#242423', '#B8B1A2'], dark: ['#121211', '#1A1A19', '#242423', '#3A3936'] },
  { id: 'indigo-dye', name: 'Indigo Dye', character: 'Indigo-dyed cloth', light: ['#E8E4DA', '#6F7FC0', '#4658A6', '#2E3A73'], dark: ['#151A33', '#2E3A73', '#4658A6', '#8C9BE0'] },
  { id: 'ink-paper', name: 'Ink on Paper', character: 'Two-tone line work', light: ['#E8E4DA', '#242423'], dark: ['#1A1A19', '#D6D0C2'] },
];

export interface Recipe {
  engineVersion: string;
  name: string;
  origin: { source: 'preset' | 'user'; presetId?: string; modified: boolean };
  seed: number;
  texture: { type: TextureType; params: Record<string, number> };
  palette: { family: string; variant: Variant };
  global: Record<string, number>;
}

const GLOBAL_DEFAULTS: Record<string, number> = {
  saturation: 1, warmth: 0, contrast: 1, brightness: 0, grain: 0.07, vignette: 0.08, rotation: 0, calm: 0.5,
};

export const TEXTURE_DEFAULTS: Record<TextureType, Record<string, number>> = {
  weave: { density: 200, slub: 0.5, variation: 0.55, relief: 0.55, mottle: 0.35, mottleScale: 0.4 },
  marble: { scale: 0.6, warp: 0.45, veinCount: 1.0, veinSharp: 0.55, veinStrength: 0.6, flowAngle: 35, cloud: 0.5, groundTone: 0.78, veinTone: 0.1 },
};

function preset(
  id: string, name: string, type: TextureType, family: string, variant: Variant, seed: number,
  params: Record<string, number>, global: Record<string, number> = {},
): Recipe {
  return {
    engineVersion: ENGINE_VERSION,
    name,
    origin: { source: 'preset', presetId: id, modified: false },
    seed,
    texture: { type, params: { ...TEXTURE_DEFAULTS[type], ...params } },
    palette: { family, variant },
    global: { ...GLOBAL_DEFAULTS, ...global },
  };
}

// The Look Guide B4 presets that use this build's two textures.
export const PRESETS: Recipe[] = [
  preset('morning-linen', 'Morning Linen', 'weave', 'natural-linen', 'light', 4127, {}),
  preset('evening-linen', 'Evening Linen', 'weave', 'natural-linen', 'dark', 4127, { relief: 0.7, variation: 0.6 }, { contrast: 1.15, vignette: 0.15 }),
  preset('indigo-cloth', 'Indigo Cloth', 'weave', 'indigo-dye', 'light', 90211, { density: 150, slub: 0.7, variation: 0.85, relief: 0.6, mottle: 0.5 }, { brightness: -0.2, saturation: 0.85, grain: 0.09 }),
  preset('quiet-marble', 'Quiet Marble', 'marble', 'natural-linen', 'light', 2837461, { veinStrength: 0.65, cloud: 0.7 }, { contrast: 0.95 }),
  preset('nero-marble', 'Nero Marble', 'marble', 'charcoal', 'light', 770311, { groundTone: 0.18, veinTone: 0.98, veinStrength: 0.75, veinSharp: 0.6, flowAngle: 120, warp: 0.35, veinCount: 0.85 }, { vignette: 0.18 }),
];

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function familyById(id: string): Family {
  return FAMILIES.find((f) => f.id === id) ?? FAMILIES[0];
}

export function randomSeed(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % 10_000_000;
}

/** Export targets (Requirements §7.1). Verify against current device specs before release. */
export const DEVICES: { id: string; label: string; w: number; h: number }[] = [
  { id: 'iphone-16', label: 'iPhone 16 / 15', w: 1179, h: 2556 },
  { id: 'iphone-16-plus', label: 'iPhone 16 Plus / 15 Plus', w: 1290, h: 2796 },
  { id: 'iphone-16-pro', label: 'iPhone 16 Pro', w: 1206, h: 2622 },
  { id: 'iphone-16-pro-max', label: 'iPhone 16 Pro Max', w: 1320, h: 2868 },
  { id: 'iphone-se', label: 'iPhone SE', w: 750, h: 1334 },
  { id: 'pixel-9', label: 'Pixel 9', w: 1080, h: 2424 },
  { id: 'pixel-9-pro', label: 'Pixel 9 Pro', w: 1280, h: 2856 },
  { id: 'galaxy-s24', label: 'Galaxy S24', w: 1080, h: 2340 },
  { id: 'galaxy-s24-ultra', label: 'Galaxy S24 Ultra', w: 1440, h: 3120 },
  { id: 'universal', label: 'Universal (fits most)', w: 1440, h: 3200 },
];
