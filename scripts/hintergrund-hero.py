"""Produkt- und Paket-Hintergruende in zwei Stilen.

startseite  Genau der Hintergrund des Startseiten-Heros: derselbe Shader-Code
            (Lichterketten und Sterne aus app/lib/stage-lights/glsl.ts, dazu
            Lichtkegel, Hintergrundfarbe und Korn aus dem Hero-Shader). Chrome
            rendert ihn per WebGL in exakter Pixelgroesse.
banner      Die Buehne des Produktbanners (scripts/buehne.py): schwarzweiss,
            Lichtkegel, abgedunkelte Raender, feines Korn. Keine Lichter.

    python3 scripts/hintergrund-hero.py ~/Downloads/OES-Hintergruende

Je Stil und Format: Vorlage (doppelte Groesse, PNG) und Web-Version (WebP).
  Produkt 1:1   Web 1200 x 1200   Vorlage 2400 x 2400
  Paket   4:3   Web 1600 x 1200   Vorlage 3200 x 2400
"""
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
from PIL import Image

from buehne import grain, stage, vignette

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]).expanduser()
OUT.mkdir(parents=True, exist_ok=True)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# Wie im Hero (app/pages/index.vue, Desktop): Kastenmitte bei 50 % / 52 %.
SPOT_X, SPOT_Y = 0.5, 0.52
# Zeitpunkt der Animation, an dem mehrere Sterne gleichzeitig leuchten.
TIME = 14.2

glsl = (ROOT / 'app/lib/stage-lights/glsl.ts').read_text()
STAGE_LIGHTS = re.search(r'export const stageLights = /\* glsl \*/ `(.*?)`', glsl, re.S).group(1)

FRAG = """#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uTime;
uniform vec3 uBg, uGold;
""" + STAGE_LIGHTS + """
void main() {
  // Hintergrund-Teil von compositeFrag (app/lib/fotobox-hero/glsl.ts), ohne
  // Fotobox, Mauszeiger und Pinselspur. Werte unveraendert uebernommen.
  vec2 frag = gl_FragCoord.xy;
  float px = uRes.y;
  vec2 p = (frag - 0.5 * uRes) / px;
  float spotR = length((frag - uCenter) / px * vec2(0.8, 1.0));
  float spot = exp(-spotR * spotR * 2.2);
  vec3 bg = uBg + vec3(0.07, 0.062, 0.055) * spot;
  vec3 warm = vec3(1.0, 0.74, 0.4);
  float lights = festoon(p, 0.42, 0.08, 0.055, 0.010, 0.55, uTime, 1.0) * 0.55
               + festoon(p, 0.46, 0.13, 0.085, 0.022, 0.75, uTime, 2.0) * 0.6
               + festoon(p, 0.54, 0.2, 0.14, 0.048, 0.92, uTime, 3.0) * 0.45;
  float stars = sparkles(p, uTime);
  bg += warm * lights * 0.2 + uGold * stars * 0.55;
  bg += (hash(frag + fract(uTime)) - 0.5) * 0.022;
  fragColor = vec4(bg, 1.0);
}"""

PAGE = """<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style>
<canvas id="c"></canvas>
<script>
const W = __W__, H = __H__;
const c = document.getElementById('c');
c.width = W; c.height = H; c.style.width = W + 'px'; c.style.height = H + 'px';
const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
  if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) document.title = 'FEHLER ' + gl.getShaderInfoLog(o); return o; };
const pr = gl.createProgram();
gl.attachShader(pr, sh(gl.VERTEX_SHADER, `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`));
gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, __FRAG__));
gl.linkProgram(pr); gl.useProgram(pr);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const u = n => gl.getUniformLocation(pr, n);
gl.viewport(0, 0, W, H);
gl.uniform2f(u('uRes'), W, H);
gl.uniform2f(u('uCenter'), __SX__ * W, (1 - __SY__) * H);
gl.uniform1f(u('uTime'), __T__);
gl.uniform3f(u('uBg'), 11/255, 10/255, 9/255);        // #0B0A09
gl.uniform3f(u('uGold'), 195/255, 139/255, 55/255);   // #C38B37
gl.drawArrays(gl.TRIANGLES, 0, 3);
</script>"""


def render_hero(W, H):
    import json
    html = (PAGE.replace('__W__', str(W)).replace('__H__', str(H))
            .replace('__SX__', str(SPOT_X)).replace('__SY__', str(SPOT_Y))
            .replace('__T__', str(TIME)).replace('__FRAG__', json.dumps(FRAG)))
    with tempfile.TemporaryDirectory() as tmp:
        page, shot = Path(tmp) / 'hero.html', Path(tmp) / 'shot.png'
        page.write_text(html)
        proc = subprocess.Popen([
            CHROME, '--headless=new', f'--user-data-dir={tmp}/profil', '--hide-scrollbars',
            '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1',
            f'--window-size={W},{H}', '--virtual-time-budget=3000', f'--screenshot={shot}', page.as_uri(),
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(120):
            if shot.exists() and shot.stat().st_size > 0:
                break
            time.sleep(1)
        time.sleep(1)
        proc.kill()
        img = Image.open(shot).convert('RGB')
        img.load()
    if img.size != (W, H):
        raise SystemExit(f'Screenshot hat {img.size}, erwartet {(W, H)}')
    return img


def render_banner(W, H):
    # Wie im Produktbanner: grauer Lichtkegel (Stufe 78) hinter dem Motiv,
    # Rand dunkel, unten abgedunkelt, feines Korn. Der Kegel ist auf den
    # Produktbereich der Hilfslinien (18-82 % Breite, 24-84 % Hoehe) bemessen.
    img = stage(W, H, 0.5 * W, 0.52 * H, 0.42 * W, 0.62 * H, level=78)
    img = grain(vignette(img), sigma=3.0)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')


def export(style, fmt, W, H, render):
    master = render(W * 2, H * 2)
    master.save(OUT / f'{fmt}-{style}-vorlage-{W * 2}x{H * 2}.png', optimize=True)
    master.resize((W, H), Image.LANCZOS).save(OUT / f'{fmt}-{style}-web-{W}x{H}.webp', 'WEBP', quality=88, method=6)


for style, render in (('startseite', render_hero), ('banner', render_banner)):
    export(style, 'produkt', 1200, 1200, render)
    export(style, 'paket', 1600, 1200, render)

for f in sorted(OUT.glob('*-startseite-*')) + sorted(OUT.glob('*-banner-*')):
    print(f'{f.name:44s} {f.stat().st_size // 1024:6d} KB')
