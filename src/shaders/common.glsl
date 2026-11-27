#version 300 es
// Shared engine code: seeded hashing, gradient noise, fBm, palette mapping
// in OKLab, and the finishing pass (calm zone, grain, vignette, dither).
precision highp float;
precision highp int;

uniform vec2 uRes;          // render target size in pixels
uniform uint uSeed;
uniform float uRotation;    // radians
uniform vec3 uPal[4];       // palette stops in OKLab, darkest first
uniform float uStops[4];
uniform float uSaturation;  // 0..1, 1 = palette's own colours
uniform float uWarmth;      // -1..1
uniform float uContrast;
uniform float uBrightness;
uniform float uGrain;
uniform float uVignette;
uniform float uCalm;        // calm-clock strength 0..1

out vec4 outColor;

// ---- Deterministic hashing (integer only, so results match across GPUs)
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
uint S(uint k) { return pcg(uSeed ^ (k * 2654435761u)); }
uint h2(ivec2 p, uint s) { return pcg(uint(p.x) ^ pcg(uint(p.y) ^ s)); }
float rnd(ivec2 p, uint s) { return float(h2(p, s)) * (1.0 / 4294967295.0); }

// ---- Gradient noise, roughly [-1, 1]
// Lattice index: floor in float, then offset in integers. Offsetting in float
// first loses precision and leaves visible seams along integer lines.
const ivec2 OFS = ivec2(1 << 20);
ivec2 cell(vec2 p) { return ivec2(floor(p)) + OFS; }
vec2 gradAt(ivec2 p, uint s) { float a = rnd(p, s) * 6.2831853; return vec2(cos(a), sin(a)); }
float gnoise(vec2 p, uint s) {
  ivec2 i = cell(p);
  vec2 f = p - floor(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(gradAt(i, s), f);
  float b = dot(gradAt(i + ivec2(1, 0), s), f - vec2(1, 0));
  float c = dot(gradAt(i + ivec2(0, 1), s), f - vec2(0, 1));
  float d = dot(gradAt(i + ivec2(1, 1), s), f - vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.414;
}
float fbm(vec2 p, int oct, float gain, uint s) {
  float a = 0.5, sum = 0.0, norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    sum += a * gnoise(p, s + uint(i) * 1013u);
    norm += a;
    p = p * 2.0 + vec2(17.3, -9.1);
    a *= gain;
  }
  return sum / norm;
}

// ---- Coordinates: centred, in units of the short edge, rotated.
// Resolution independent: preview and export share one composition.
vec2 fieldCoord() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float c = cos(uRotation), s = sin(uRotation);
  return mat2(c, -s, s, c) * p;
}
// 0..1 with y = 0 at the top of the image
vec2 screenUV() { return vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y); }

// ---- Colour
vec3 oklabToLinear(vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
   -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
   -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = uPal[0];
  for (int i = 1; i < 4; i++) {
    float a = uStops[i - 1], b = uStops[i];
    if (t >= a) c = mix(uPal[i - 1], uPal[i], clamp((t - a) / max(b - a, 1e-5), 0.0, 1.0));
  }
  return c;
}

// ---- Finishing pass. t = full texture value, tCalm = low-detail value
// used behind the lock-screen clock (Requirements §6).
void finish(float t, float tCalm) {
  vec2 uv = screenUV();
  float band = smoothstep(0.03, 0.10, uv.y) * (1.0 - smoothstep(0.28, 0.40, uv.y));
  t = mix(t, tCalm, uCalm * band);
  t = (t - 0.5) * uContrast + 0.5 + uBrightness;

  vec3 lab = palette(t);
  lab.yz *= uSaturation;
  lab.y += uWarmth * 0.006;
  lab.z += uWarmth * 0.022;

  vec2 d = (uv - 0.5) * vec2(1.6 * uRes.x / uRes.y, 2.0);
  lab.x *= 1.0 - uVignette * 0.45 * smoothstep(0.35, 1.25, length(d));

  ivec2 px = ivec2(gl_FragCoord.xy);
  float g = rnd(px, S(901u)) + rnd(px, S(902u)) - 1.0; // triangular ~ gaussian
  lab.x += g * uGrain * 0.35;

  vec3 rgb = linearToSrgb(oklabToLinear(lab));
  rgb += (rnd(px, S(903u)) - 0.5) / 255.0; // dither: prevents banding at 8-bit
  outColor = vec4(rgb, 1.0);
}
