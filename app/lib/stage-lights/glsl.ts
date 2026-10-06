// Buehnenlicht aus dem Startseiten-Hero: Lichterketten und Logo-Sterne.
// Eigenes Modul, damit es ohne die Fotobox-Shader wiederverwendbar ist.

export const stageLights = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

// Eine Lichterkette wie im Festzelt, unscharf im Hintergrund: Gluehbirnen
// entlang einer durchhaengenden Linie. Unschaerfe = Bokeh-Scheibe mit etwas
// hellerem Rand, so wie ein Objektiv Lichtpunkte abbildet.
float festoon(vec2 p, float topY, float sag, float spacing, float radius, float soft, float t, float seed) {
  // Zwischen Zeltstangen haengt die Kette in mehreren Boegen durch.
  float period = 0.62 + 0.18 * fract(seed * 0.618);
  float phase = seed * 0.37;
  float k0 = floor(p.x / spacing);
  float acc = 0.0;
  for (int i = -1; i <= 1; i++) {
    float k = k0 + float(i);
    float bx = (k + 0.5) * spacing;
    float u = 2.0 * fract(bx / period + phase) - 1.0;
    float by = topY - sag * (1.0 - u * u) + sin(t * 0.5 + seed * 3.0 + k * 0.8) * 0.003;
    float d = length(p - vec2(bx, by));
    float disc = 1.0 - smoothstep(radius * (1.0 - soft), radius, d);
    float ring = smoothstep(radius * 0.45, radius * 0.95, d) * disc * 0.35;
    float flicker = 0.82 + 0.18 * sin(t * (1.3 + fract(k * 0.37 + seed)) + k * 2.1);
    acc += (disc * 0.65 + ring) * flicker;
  }
  return acc;
}

// Funkelnde Sterne in der Form des Sterns aus dem OES-Logo: eine konkave
// Raute (Astroide). Wenige, die einzeln aufleuchten und wieder vergehen.
float sparkles(vec2 p, float t) {
  vec2 g = p * 7.0;
  vec2 id = floor(g);
  float acc = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cid = id + vec2(float(x), float(y));
      if (hash(cid + 11.0) > 0.16) continue;
      vec2 q = g - (cid + 0.2 + 0.6 * hash2(cid + 4.0));
      float life = max(sin(t * (0.35 + 0.4 * hash(cid)) + hash(cid + 2.0) * 6.283), 0.0);
      float size = 0.03 + 0.07 * life;
      float d = pow(abs(q.x) / size, 0.5) + pow(abs(q.y) / size, 0.5);
      // Feste Kantenweiche statt fwidth(): Ableitungen sind nach einem
      // pixelweise verschiedenen continue nicht definiert.
      float star = 1.0 - smoothstep(0.82, 1.12, d);
      float glow = exp(-dot(q, q) / (size * size * 1.5)) * 0.25;
      acc += (star + glow) * life;
    }
  }
  return acc;
}
`
