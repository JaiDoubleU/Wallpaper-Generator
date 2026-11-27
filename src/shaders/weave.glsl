// T12 Fabric Weave: plain-weave linen. Character comes from uneven threads
// (slubs, tone streaks) more than from the over-under pattern itself.
uniform float uDensity;     // threads per short edge
uniform float uSlub;        // thread irregularity 0..1
uniform float uVariation;   // thread-to-thread tone variation 0..1
uniform float uRelief;      // weave depth 0..1
uniform float uMottle;      // large-scale cloudiness 0..1
uniform float uMottleScale; // size of the mottling

// Tone of one thread at position `along` (in thread widths): a fixed tone
// per thread, long slubs, and short flecks.
float threadTone(float index, float along, uint s) {
  float base = rnd(ivec2(int(index), 7) + OFS, s) - 0.5;
  float slub = gnoise(vec2(index * 0.913, along * 0.045), s + 11u);
  float fleck = gnoise(vec2(index * 1.7, along * 0.35), s + 23u);
  return base * 0.9 + slub * (0.6 + 0.9 * uSlub) + fleck * 0.25;
}

void main() {
  vec2 p = fieldCoord();
  vec2 g = p * uDensity;

  // Threads wander slightly, as woven linen does
  g.x += gnoise(p * vec2(1.5, 5.0) + 11.0, S(1u)) * 0.6 * uSlub;
  g.y += gnoise(p * vec2(5.0, 1.5) + 37.0, S(2u)) * 0.6 * uSlub;

  ivec2 id = cell(g);
  vec2 f = g - floor(g);
  float ix = floor(g.x), iy = floor(g.y);
  bool warpOnTop = ((id.x + id.y) & 1) == 0;

  float warpTone = threadTone(ix, g.y, S(3u));
  float weftTone = threadTone(iy, g.x, S(4u));

  // Thread thickness varies along its length (thick-thin slubs)
  float wW = 0.9 + 0.1 * uSlub * gnoise(vec2(ix * 1.3, g.y * 0.12), S(7u));
  float wF = 0.9 + 0.1 * uSlub * gnoise(vec2(g.x * 0.12, iy * 1.3), S(8u));
  float pw = 1.0 - pow(abs(f.x - 0.5) * 2.0 / wW, 2.0);
  float pf = 1.0 - pow(abs(f.y - 0.5) * 2.0 / wF, 2.0);
  float hWarp = sqrt(max(pw, 0.0)) * (0.88 + 0.12 * sin(3.14159 * f.y));
  float hWeft = sqrt(max(pf, 0.0)) * (0.88 + 0.12 * sin(3.14159 * f.x));

  float h, tone;
  if (warpOnTop) { h = hWarp; tone = warpTone; if (pw < 0.0) { h = hWeft * 0.8; tone = weftTone; } }
  else           { h = hWeft; tone = weftTone; if (pf < 0.0) { h = hWarp * 0.8; tone = warpTone; } }

  // Anti-moiré: fade structure as threads approach pixel size, keeping the
  // average tone so preview and export match.
  float tpp = length(fwidth(g));
  float vis = 1.0 - smoothstep(0.3, 0.6, tpp);

  float mottle = fbm(p / max(uMottleScale, 0.02), 5, 0.5, S(11u));
  float base = 0.5 + mottle * 0.45 * uMottle;
  float structure = (h - 0.75) * 0.35 * uRelief + tone * 0.11 * uVariation;
  float t = base + structure * vis;

  finish(t, base);
}
