// sRGB hex <-> OKLab, and palette preparation for the shaders.

export type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function hexToOklab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16);
  const r = toLinear(((n >> 16) & 255) / 255);
  const g = toLinear(((n >> 8) & 255) / 255);
  const b = toLinear((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const lerp = (a: Lab, b: Lab, t: number): Lab => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * Sorts colours dark → light (t = 0 darkest, t = 1 lightest) and resamples to
 * exactly four evenly spaced OKLab stops, which is what the shaders expect.
 */
export function preparePalette(hexes: string[]): { pal: Float32Array; stops: Float32Array } {
  const labs = hexes.map(hexToOklab).sort((a, b) => a[0] - b[0]);
  const out: Lab[] = [];
  for (let i = 0; i < 4; i++) {
    const x = (i / 3) * (labs.length - 1);
    const j = Math.min(Math.floor(x), labs.length - 2);
    out.push(labs.length === 1 ? labs[0] : lerp(labs[j], labs[j + 1], x - j));
  }
  return { pal: new Float32Array(out.flat()), stops: new Float32Array([0, 1 / 3, 2 / 3, 1]) };
}

/** Linen background for the app itself (Look Guide A6): base ± a few % lightness. */
export function backgroundPalette(baseHex: string, spread: number): { pal: Float32Array; stops: Float32Array } {
  const [L, a, b] = hexToOklab(baseHex);
  const stops: Lab[] = [-1, -0.33, 0.33, 1].map((k) => [L + k * spread, a, b]);
  return { pal: new Float32Array(stops.flat()), stops: new Float32Array([0, 1 / 3, 2 / 3, 1]) };
}
