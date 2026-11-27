// T3 Marble: a softly clouded ground with long, meandering veins. Veins are
// the zero-crossings of warped noise, stretched along the flow direction.
uniform float uScale;        // feature size (short-edge units)
uniform float uWarp;         // flow / turbulence 0..1
uniform float uVeinCount;    // vein frequency
uniform float uVeinSharp;    // 0 soft .. 1 crisp
uniform float uVeinStrength; // 0..1
uniform float uFlowAngle;    // radians
uniform float uCloud;        // ground cloudiness 0..1
uniform float uGroundTone;   // 0 dark .. 1 light
uniform float uVeinTone;     // 0 dark .. 1 light

// Distance to the zero-crossing of n, in short-edge units, so veins keep a
// true line width at any resolution (preview and export match).
float veinLine(float n, float width) {
  float px = 1.0 / min(uRes.x, uRes.y);
  float slope = max(length(vec2(dFdx(n), dFdy(n))), 1e-6);
  float d = abs(n) / slope * px;
  float core = 1.0 - smoothstep(width * 0.4, width + 1.5 * px, d);
  float halo = exp(-d / (width * 5.0)) * 0.28; // soft bleed into the stone
  return clamp(core + halo, 0.0, 1.0);
}

void main() {
  vec2 p = fieldCoord() / max(uScale, 0.05);
  float c = cos(uFlowAngle), s = sin(uFlowAngle);
  vec2 pf = mat2(c, s, -s, c) * p;     // flow-aligned coordinates

  // Ground: low-contrast clouds
  vec2 q = vec2(fbm(p * 0.8, 4, 0.5, S(1u)), fbm(p * 0.8 + vec2(5.2, 1.3), 4, 0.5, S(2u)));
  float cloud = fbm(p * 0.9 + 1.5 * q, 5, 0.5, S(3u));

  // Main veins: parallel lines across the flow direction, pushed around by
  // turbulence. Long and continuous, never closed loops.
  float turb = fbm(p * 0.9 + q * (0.8 + 1.6 * uWarp), 6, 0.55, S(4u));
  // Small high-frequency displacement makes the lines jagged, like fractures
  float jag = fbm(p * 6.0, 3, 0.5, S(12u)) * 0.06;
  float x1 = pf.y * uVeinCount * 1.2 + turb * (0.6 + 1.7 * uWarp) + jag;
  float n1 = sin(3.14159 * x1);
  // Width in short-edge units, swelling and thinning along each vein
  float width = mix(0.010, 0.0015, uVeinSharp) * (0.45 + 1.1 * (0.5 + 0.5 * gnoise(p * 1.4 + 3.1, S(9u))));
  float v1 = veinLine(n1, width);

  // Fine secondary veins on a crossing angle, fainter and more broken
  float x2 = dot(pf, vec2(0.6, 0.8)) * uVeinCount * 2.6 + turb * (1.0 + 2.2 * uWarp) + jag * 2.0 + 0.37;
  float n2 = sin(3.14159 * x2);
  float v2 = veinLine(n2, width * 0.5) * 0.4 * smoothstep(0.1, 0.5, fbm(p * 0.8 + 21.0, 3, 0.5, S(5u)) + 0.2);

  // Veins thin out and disappear in places, as in real slabs
  float presence = smoothstep(-0.05, 0.3, fbm(p * 0.3 + 9.0, 3, 0.5, S(6u)) + 0.05);
  float veins = max(v1 * mix(0.2, 1.0, presence), v2 * presence);

  float ground = uGroundTone + cloud * 0.2 * uCloud;
  float t = mix(ground, uVeinTone, veins * uVeinStrength);

  finish(t, ground);
}
