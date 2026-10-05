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

/**
 * Malt einen Strich als Kapsel von pointA nach point, nicht als runden Punkt:
 * So entsteht ein gleichmaessig breites Band statt einer Perlenkette.
 * useMax = 1 fuer die Maske (kein Aufstauen bei langsamer Bewegung),
 * useMax = 0 fuer die Geschwindigkeit (die soll sich addieren).
 */
export const splatFrag = head + /* glsl */ `
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform vec2 pointA;
uniform float radius;
uniform float useMax;
void main() {
  vec2 pa = vUv - pointA;
  vec2 ba = point - pointA;
  pa.x *= aspectRatio;
  ba.x *= aspectRatio;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  vec2 d = pa - ba * h;
  vec3 splat = exp(-dot(d, d) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(mix(base + splat, max(base, splat), useMax), 1.0);
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
uniform vec4 uImgRect;       // Bild: x, y (unten links), Breite, Hoehe in Geraetepixeln
uniform vec2 uBoxCenter;     // Kastenmitte im Bild (uv, y von unten): Drehpunkt
uniform vec2 uTilt;          // Drehung in Radiant: x = um die Hochachse, y = Nicken
uniform float uDepth;        // Kastentiefe in Geraetepixeln
uniform vec4 uBoxRect;       // Kasten im Bild (uv, y von unten): x0, y0, x1, y1
uniform vec2 uPointer;       // geglaettete Mausposition, -1..1
uniform vec2 uFlashAt;       // Blitzquelle (Objektiv) im Bild (uv, y von unten)
uniform float uTime;
uniform float uFlash;        // Klick-Blitz, Huelle 0..1
uniform float uFlashWhite;   // kurzer weisser Lichtstoss am Anfang
uniform vec3 uBg, uGold;
uniform sampler2D tParty;    // optionale Szene unter dem Pinsel
uniform float uHasParty;
uniform float uPartyAspect;

${noise}

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

float isoline(float f, float widthPx) {
  float d = abs(fract(f + 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, fwidth(f) * widthPx, d);
}

bool inRect(vec2 uv) { return all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0))); }

// Spaltenweise aufgebaut (GLSL ist spaltenorientiert).
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

// Kamera bei z = -f schaut nach +z, der Bildschirm liegt bei z = 0. Fuer einen
// Bildschirmpunkt s (Pixel relativ zur Kastenmitte) schneiden wir den Sehstrahl
// mit der gedrehten Ebene, die um "back" nach hinten versetzt ist, und geben
// die Bildkoordinate des Treffers zurueck. back = 0 ist die Vorderseite.
vec2 planeUv(vec2 s, mat3 R, float back, float f) {
  vec3 n = R * vec3(0.0, 0.0, 1.0);
  vec3 d = vec3(s, f);
  float t = (back + f * n.z) / dot(d, n);
  vec3 P = vec3(0.0, 0.0, -f) + t * d - n * back;
  vec2 local = vec2(dot(P, R * vec3(1.0, 0.0, 0.0)), dot(P, R * vec3(0.0, 1.0, 0.0)));
  return uBoxCenter + local / uImgRect.zw;
}

// Umgekehrt: Punkt auf der Vorderseite -> Bildschirm (fuer die Blitzquelle).
vec2 projectUv(vec2 uv, mat3 R, float f) {
  vec3 P = R * vec3((uv - uBoxCenter) * uImgRect.zw, 0.0);
  return P.xy * f / (P.z + f);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 suv = frag / uRes;
  float px = uRes.y;
  float f = px * 1.7;                              // Brennweite: kleiner = staerkere Perspektive

  vec2 vel = texture(tVel, suv).xy;
  float dye = texture(tDye, suv).r;

  mat3 R = rotY(uTilt.x) * rotX(uTilt.y);
  vec2 center = uImgRect.xy + uBoxCenter * uImgRect.zw + uPointer * px * 0.006;
  vec2 s = frag - center;

  // ---- Hintergrund: dunkle Buehne mit Lichterketten wie im Festzelt ----
  // Drei Ketten in verschiedener Tiefe: fern klein, scharf, langsam in der
  // Parallaxe, nah gross, weich, schnell. Die Pinselspur schiebt sie mit.
  vec2 p = (frag - 0.5 * uRes) / px;
  vec2 flow = clamp(vel, -300.0, 300.0) * 0.00022;
  float spotR = length((frag - center) / px * vec2(0.8, 1.0));
  float spot = exp(-spotR * spotR * 2.2);
  vec3 bg = uBg + vec3(0.07, 0.062, 0.055) * spot;

  vec3 warm = vec3(1.0, 0.74, 0.4);
  float lights = festoon(p + uPointer * 0.006 - flow * 0.5, 0.42, 0.08, 0.055, 0.010, 0.55, uTime, 1.0) * 0.55
               + festoon(p + uPointer * 0.016 - flow, 0.46, 0.13, 0.085, 0.022, 0.75, uTime, 2.0) * 0.6
               + festoon(p + uPointer * 0.034 - flow * 1.6, 0.54, 0.2, 0.14, 0.048, 0.92, uTime, 3.0) * 0.45;
  float stars = sparkles(p + uPointer * 0.022 - flow, uTime);
  bg += warm * lights * 0.2 + uGold * stars * 0.55;

  // Gegenlicht: weicher Schein um die Silhouette trennt schwarzen Filz von schwarzer Buehne.
  // Eine tiefe Mipmap-Stufe ist eine extrem weiche Unschaerfe, die die GPU
  // ohnehin vorraetig hat. So wird der Schein ein Leuchten statt ein Rechteck.
  vec2 haloUv = (planeUv(s, R, uDepth, f) - uBoxCenter) / 1.22 + uBoxCenter;
  float halo = inRect(haloUv) ? textureLod(tMaps, haloUv, 4.5).b : 0.0;
  bg += vec3(0.15, 0.12, 0.08) * halo * 0.32;

  // ---- Fotobox: Vorderseite auf der gedrehten Ebene ----
  vec2 iuv = planeUv(s, R, 0.0, f);
  bool inside = inRect(iuv);
  vec4 maps = inside ? texture(tMaps, iuv) : vec4(0.0);
  // Erhabenes (Objektiv, Kanten) verschiebt sich mit der Drehung: Relieftiefe.
  vec2 puv = iuv + vec2(-uTilt.x, uTilt.y) * maps.r * 0.035;
  vec4 base = inside ? texture(tBase, puv) : vec4(0.0);

  // Seitenwand: was die hintere Ebene zeigt, die vordere aber nicht.
  vec2 buv = planeUv(s, R, uDepth, f);
  vec4 back = inRect(buv) ? texture(tBase, buv) : vec4(0.0);
  // Nur der Kasten ist ein Koerper mit Tiefe. Fuer duenne Teile wie Stoff und
  // Kabel wuerde die hintere Ebene eine verschobene Doppelung zeigen.
  bool inBox = all(greaterThanEqual(buv, uBoxRect.xy)) && all(lessThanEqual(buv, uBoxRect.zw));
  float side = inBox ? back.a * (1.0 - base.a) : 0.0;

  // Licht: Normale aus der Hoehenkarte, mit der Box mitgedreht.
  vec2 mt = 1.0 / vec2(textureSize(tMaps, 0));
  float hL = texture(tMaps, iuv - vec2(mt.x, 0.0)).r;
  float hR = texture(tMaps, iuv + vec2(mt.x, 0.0)).r;
  float hD = texture(tMaps, iuv - vec2(0.0, mt.y)).r;
  float hU = texture(tMaps, iuv + vec2(0.0, mt.y)).r;
  vec3 Nl = normalize(vec3((hL - hR) * 5.0, (hD - hU) * 5.0, -1.0));    // -z = zur Kamera
  vec3 Nw = R * Nl;
  vec3 N = vec3(Nw.xy, -Nw.z);                                           // zurueck: +z = zur Kamera
  vec3 L = normalize(vec3(uPointer * 0.9, 1.2));
  float diff = dot(N, L);
  float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 30.0);
  // Kantenlicht: Flanken, die zum Cursor zeigen, fangen Licht.
  float rim = pow(1.0 - clamp(N.z, 0.0, 1.0), 1.5) * clamp(dot(normalize(N.xy + 1e-5), normalize(uPointer + vec2(1e-5, 0.4))), 0.0, 1.0);
  vec3 lit = base.rgb * (0.78 + 0.3 * diff) + spec * 0.2 + rim * vec3(0.55, 0.5, 0.42) * 0.8;
  // Fast schwarze Teile (Anschluss, Kabel) leicht anheben, sonst verschwinden
  // sie vor der dunklen Buehne und es sieht aus wie eine Luecke.
  float litLum = dot(lit, vec3(0.2126, 0.7152, 0.0722));
  lit += vec3(0.07, 0.065, 0.06) * (1.0 - smoothstep(0.0, 0.22, litLum));

  float sideLight = 0.3 + 0.35 * clamp(dot(normalize(vec2(-uTilt.x, uTilt.y) + 1e-5), normalize(uPointer + 1e-5)), 0.0, 1.0);
  vec3 sideCol = back.rgb * sideLight;

  vec3 normal = bg;
  normal = mix(normal, sideCol, side);
  normal = mix(normal, lit, base.a);

  // ---- Outline: schwebt auf eigener Ebene VOR der Box ----
  vec2 pivot = uBoxCenter;
  vec2 ouv1 = (planeUv(s, R, -uDepth * 1.2, f) - pivot) / 1.035 + pivot;
  float s1 = inRect(ouv1) ? texture(tMaps, ouv1).b : 0.0;
  float o1 = isoline(s1 - 0.5, 1.2) * step(0.02, s1) * step(s1, 0.98);
  float outline = o1 * 0.3 * (1.0 - base.a * 0.9);
  normal = mix(normal, uGold * 0.55, outline);

  // ---- Blitz aus dem Objektiv ----
  vec2 srcPx = center + projectUv(uFlashAt, R, f);
  vec2 dp = frag - srcPx;
  float r = length(dp) / px;
  float ang = atan(dp.y, dp.x);
  float rays = pow(abs(cos(ang * 3.0 + uTime * 0.12)), 90.0) * 0.75
             + pow(abs(cos(ang * 7.0 - uTime * 0.07)), 220.0) * 0.5;
  rays *= exp(-r * 3.0);
  float streak = exp(-pow(dp.y / (px * 0.004), 2.0)) * exp(-abs(dp.x) / (px * 0.55));
  float core = exp(-r * r * 260.0);                                     // gleissender Punkt im Objektiv
  float glowR = exp(-r * r * 10.0) * 0.7 + exp(-r * 2.0) * 0.3;
  float energy = 0.85 + 0.4 * clamp(dye, 0.0, 1.0) + uFlash * 0.9;
  float light = maps.g * 0.9 + (core * 1.5 + glowR + rays + streak * 0.85) * energy;

  // Sanft anheben statt ueberbelichten: die weisse Front soll Zeichnung
  // behalten, der Bildschirm lesbar bleiben.
  vec3 boxLit = clamp(lit * 1.12 + 0.04, 0.0, 1.0) + spec * 0.25;
  vec3 bgLit = mix(bg, vec3(0.86, 0.84, 0.8), 0.42);
  if (uHasParty > 0.5) {
    // Party-Foto bildschirmfuellend (cover), leicht entgegen der Box verschoben:
    // es liegt hinter ihr, also bewegt es sich weniger.
    float screenAspect = uRes.x / uRes.y;
    vec2 cuv = suv - 0.5;
    if (screenAspect > uPartyAspect) cuv.y *= uPartyAspect / screenAspect;
    else cuv.x *= screenAspect / uPartyAspect;
    cuv = cuv * 0.96 + 0.5 - uPointer * 0.012;
    vec3 party = texture(tParty, cuv).rgb;
    // Vom Blitz angestrahlt: vorne heller, zum Rand hin abfallend.
    bgLit = party * (0.75 + 0.55 * exp(-spotR * spotR * 1.4));
  }
  vec3 flashCol = mix(bgLit, mix(sideCol * 1.8, boxLit, base.a), max(base.a, side));
  flashCol = mix(flashCol, uGold, outline * 1.4);
  float lightOnBox = light * (1.0 - base.a * 0.75);
  flashCol = 1.0 - (1.0 - flashCol) * (1.0 - clamp(lightOnBox, 0.0, 1.0) * vec3(1.0, 0.97, 0.9));

  // ---- Maske: klare Pinselkante, ohne Rauschen und ohne Saum ----
  float k = dye;
  float aa = fwidth(k) * 1.5;
  float m = smoothstep(0.33 - aa, 0.33 + aa, k);
  m = max(m, uFlash);

  vec3 col = mix(normal, flashCol, m);
  col = mix(col, vec3(1.0), uFlashWhite);

  // Korn nur im Hintergrund: verhindert Banding im Dunkeln, laesst das Foto scharf.
  col += (hash(frag + fract(uTime)) - 0.5) * 0.022 * (1.0 - base.a);
  fragColor = vec4(col, 1.0);
}`
