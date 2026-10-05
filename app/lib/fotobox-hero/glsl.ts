// Shader fuer den Fotobox-Hero. Alle als GLSL ES 3.00 (WebGL2),
// three.js setzt "#version 300 es" bei RawShaderMaterial selbst davor.

/** Vollbild-Quad mit Nachbar-Koordinaten fuer die Fluid-Passes. */
export const passVert = /* glsl */ `
precision highp float;
in vec3 position;
in vec2 uv;
uniform vec2 texelSize;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = uv;
  vL = uv - vec2(texelSize.x, 0.0);
  vR = uv + vec2(texelSize.x, 0.0);
  vT = uv + vec2(0.0, texelSize.y);
  vB = uv - vec2(0.0, texelSize.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const head = /* glsl */ `
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
`

// ---------- Fluid-Simulation (Stable Fluids nach Jos Stam) ----------
// Jeder Pass ist ein Rechenschritt der Navier-Stokes-Gleichung auf der GPU.

/** Fuegt an einer Stelle Geschwindigkeit bzw. "Farbe" (unsere Maske) hinzu. */
export const splatFrag = head + /* glsl */ `
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`

/** Transportiert eine Groesse entlang des Geschwindigkeitsfelds und laesst sie abklingen. */
export const advectFrag = head + /* glsl */ `
uniform sampler2D uVelocity, uSource;
uniform vec2 velTexel;
uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * velTexel;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`

export const divergenceFrag = head + /* glsl */ `
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  // Am Rand spiegeln, damit nichts aus dem Bild herausfliesst.
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`

export const curlFrag = head + /* glsl */ `
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`

/** Verstaerkt vorhandene Wirbel. Ohne das wirkt die Spur zaeh statt fluessig. */
export const vorticityFrag = head + /* glsl */ `
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`

export const clearFrag = head + /* glsl */ `
uniform sampler2D uTexture;
uniform float value;
void main() { fragColor = value * texture(uTexture, vUv); }`

/** Ein Jacobi-Schritt. Mehrfach wiederholt ergibt das den Druck. */
export const pressureFrag = head + /* glsl */ `
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`

/** Zieht den Druckgradienten ab: das Feld wird quellenfrei, also fluessigkeitsartig. */
export const gradientFrag = head + /* glsl */ `
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(vel, 0.0, 1.0);
}`

// ---------- Simplex-Rauschen ----------
// 3D Simplex Noise, Ashima Arts / Stefan Gustavson, MIT-Lizenz
// (github.com/ashima/webgl-noise).
const noise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}`

// ---------- Endbild ----------

export const compositeVert = /* glsl */ `
precision highp float;
in vec3 position;
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`

export const compositeFrag = /* glsl */ `
precision highp float;
precision highp sampler2D;
out vec4 fragColor;

uniform sampler2D tBase;     // Fotobox, freigestellt (RGBA)
uniform sampler2D tMaps;     // R Hoehe, G Panel-Gluehen, B weiche Silhouette
uniform sampler2D tDye;      // Fluid-Maske
uniform sampler2D tVel;      // Fluid-Geschwindigkeit
uniform vec2 uRes;           // Zeichenflaeche in Geraetepixeln
uniform vec4 uImgRect;       // Lage der Fotobox: x, y (unten links), Breite, Hoehe
uniform vec2 uPointer;       // geglaettete Mausposition, -1..1
uniform vec2 uFlashAt;       // Blitzquelle (Mitte des Lichtpanels) relativ im Bild, y von unten
uniform float uTime;
uniform float uFlash;        // Klick-Blitz, Huelle 0..1
uniform float uFlashWhite;   // kurzer weisser Lichtstoss am Anfang des Blitzes
uniform vec3 uPaper, uLine, uGold;

${noise}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Isolinie mit konstanter Pixelbreite, egal wie steil das Feld ist.
float isoline(float f, float widthPx) {
  float d = abs(fract(f + 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, fwidth(f) * widthPx, d);
}

bool inRect(vec2 uv) { return all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0))); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 suv = frag / uRes;
  float px = uRes.y;                          // Bezugsgroesse fuer Abstaende

  vec2 vel = texture(tVel, suv).xy;
  float dye = texture(tDye, suv).r;

  // ---- Hintergrund: Papier mit Hoehenlinien, die die Fluessigkeit mitzieht ----
  vec2 p = (frag - 0.5 * uRes) / px;
  p += uPointer * 0.008;                      // hinterste Ebene, bewegt sich am wenigsten
  // Begrenzt: ein Geschwindigkeitsausreisser darf das Rauschen nicht ins
  // Unendliche schieben, sonst wird bg zu NaN und reisst per mix() alles mit.
  p -= clamp(vel, -300.0, 300.0) * 0.00035;
  float n = snoise(vec3(p * 1.2, uTime * 0.03)) * 0.65
          + snoise(vec3(p * 2.6 + 7.3, uTime * 0.045)) * 0.22;
  float contour = isoline(n * 7.0, 1.1);
  vec3 bg = mix(uPaper, uLine, contour * 0.5);

  // ---- Fotobox: Parallaxe und Licht, das dem Cursor folgt ----
  vec2 shift = uPointer * px * 0.012;
  vec2 iuv = (frag - uImgRect.xy - shift) / uImgRect.zw;
  bool inside = inRect(iuv);
  vec4 maps = inside ? texture(tMaps, iuv) : vec4(0.0);
  // Erhabene Teile (Objektiv, Kanten) verschieben sich staerker: unechte Tiefe.
  vec2 puv = iuv - uPointer * maps.r * vec2(0.010, 0.006);
  vec4 base = inside ? texture(tBase, puv) : vec4(0.0);

  vec2 mt = 1.0 / vec2(textureSize(tMaps, 0));
  float hL = texture(tMaps, iuv - vec2(mt.x, 0.0)).r;
  float hR = texture(tMaps, iuv + vec2(mt.x, 0.0)).r;
  float hD = texture(tMaps, iuv - vec2(0.0, mt.y)).r;
  float hU = texture(tMaps, iuv + vec2(0.0, mt.y)).r;
  vec3 N = normalize(vec3((hL - hR) * 4.0, (hD - hU) * 4.0, 1.0));
  vec3 L = normalize(vec3(uPointer * 0.9, 1.3));
  float diff = dot(N, L);
  float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  vec3 lit = base.rgb * (0.84 + 0.18 * diff) + spec * 0.14;

  vec3 normal = mix(bg, lit, base.a);

  // ---- Outline: vergroesserte Silhouette auf eigener, vorderster Ebene ----
  vec2 oShift = uPointer * px * 0.026;
  vec2 ouv = (frag - uImgRect.xy - oShift) / uImgRect.zw;
  vec2 pivot = vec2(0.5, 0.62);
  float s1 = texture(tMaps, (ouv - pivot) / 1.07 + pivot).b;
  float s2 = texture(tMaps, (ouv - pivot) / 1.16 + pivot).b;
  float o1 = inRect((ouv - pivot) / 1.07 + pivot) ? isoline(s1 - 0.5, 1.2) * step(0.02, s1) * step(s1, 0.98) : 0.0;
  // Zweite Linie gestrichelt, wie eine Masszeichnung.
  float dash = step(0.5, fract((frag.x + frag.y) / (px * 0.012)));
  float o2 = inRect((ouv - pivot) / 1.16 + pivot) ? isoline(s2 - 0.5, 1.0) * step(0.02, s2) * step(s2, 0.98) * dash : 0.0;
  float outline = max(o1 * 0.55, o2 * 0.35) * (1.0 - base.a * 0.85);
  normal = mix(normal, uLine * 0.75, outline);

  // ---- Blitz: dieselbe Szene im Moment der Ausloesung ----
  vec2 srcPx = uImgRect.xy + shift + uFlashAt * uImgRect.zw;
  vec2 dp = frag - srcPx;
  float r = length(dp) / px;
  float ang = atan(dp.y, dp.x);
  float rays = pow(abs(cos(ang * 3.0 + uTime * 0.12)), 90.0) * 0.7
             + pow(abs(cos(ang * 7.0 - uTime * 0.07)), 220.0) * 0.45;
  rays *= exp(-r * 3.2);
  float streak = exp(-pow(dp.y / (px * 0.004), 2.0)) * exp(-abs(dp.x) / (px * 0.5));
  float halo = exp(-r * r * 16.0) * 0.55 + exp(-r * 2.6) * 0.16;
  // Frische Spur leuchtet staerker als verblassende, der Klick am staerksten.
  float energy = 0.5 + 0.5 * clamp(dye, 0.0, 1.0) + uFlash * 0.8;
  float light = maps.g * 1.7 + (halo + rays + streak * 0.8) * energy;

  // Hartes Licht statt Weisswaschen: Filz, Bildschirm, Drucker bleiben erkennbar.
  vec3 boxLit = clamp(lit * 1.55 + 0.06, 0.0, 1.0) + spec * 0.35;
  vec3 bgLit = mix(bg, vec3(1.0), 0.35);
  vec3 flashCol = mix(bgLit, boxLit, base.a);
  flashCol = mix(flashCol, uGold, outline * 1.4);           // Outline leuchtet gold
  flashCol = 1.0 - (1.0 - flashCol) * (1.0 - clamp(light, 0.0, 1.0) * vec3(1.0, 0.98, 0.93));

  // ---- Maske: fluessige Kante statt glattem Kreis ----
  float wobble = snoise(vec3(frag / px * 5.0, uTime * 0.5)) * 0.1;
  float k = dye + wobble * smoothstep(0.0, 0.12, dye);
  // Enge Kante: die Spur liest sich als Pinselstrich, nicht als Nebel.
  float m = smoothstep(0.16, 0.27, k);
  m = max(m, uFlash);
  float edge = smoothstep(0.1, 0.16, k) - smoothstep(0.16, 0.24, k);

  vec3 col = mix(normal, flashCol, m);
  // Warmer Lichtsaum an der Kante, per Screen-Blend: hellt auf, faerbt nicht braun.
  col = 1.0 - (1.0 - col) * (1.0 - edge * (1.0 - uFlash) * vec3(0.55, 0.42, 0.16));
  col = mix(col, vec3(1.0), uFlashWhite);

  col += (hash(frag + fract(uTime)) - 0.5) * 0.018;        // Filmkorn gegen Banding
  fragColor = vec4(col, 1.0);
}`
