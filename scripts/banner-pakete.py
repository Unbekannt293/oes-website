"""Banner fuer die Pakete-Seite: drei echte Paket-Aufbauten aus Louis'
Produktfotos, jeder in seinem eigenen Lichtkegel auf dunkler Buehne.

Die Fotos sind nicht freigestellt (helle Studiowand). Jedes bekommt deshalb
einen weichen Spot-Verlauf, der die Wand zum Rand hin ins Dunkle zieht. Wo
sich zwei Spots ueberlappen, gewinnt der hellere (Maximum), so entstehen
drei Lichtinseln statt einer Collage mit Naehten.

    python3 scripts/banner-pakete.py ~/Downloads public/images/pakete
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

from buehne import grain, save, vignette

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
STAGE = 10
Y_CROP = (0.03, 0.93)       # Lampe oben bis Stativfuss unten

# Links -> rechts: klein, mittel, gross. Links steht der Titel.
SETS = [
    '3d1d5426-8cb4-47ab-8c18-f6422a351b6a',   # Fotobox + Drucker
    'fa166bff-6d5c-4e1c-b940-a5fd90f3d6bc',   # Fotobox, Soundbox, Drucker
    'db7158aa-4add-470f-a22e-b68661a4ae41',   # Fotobox, 2 Soundboxen, Drucker
]


def load(name, height):
    im = ImageOps.exif_transpose(Image.open(SRC / f'{name}.JPG')).convert('L')
    w, h = im.size
    im = im.crop((0, int(Y_CROP[0] * h), w, int(Y_CROP[1] * h)))
    im = ImageEnhance.Contrast(im).enhance(1.15)
    im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float32)
    # Spot: elliptischer Lichtkegel, oben etwas schmaler als unten.
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]].astype(np.float32)
    u = xs / a.shape[1] - 0.5
    v = ys / a.shape[0]
    spot = np.exp(-(u / (0.27 + 0.11 * v)) ** 2 - ((v - 0.5) / 0.62) ** 2)
    # Der Kegel allein faellt am Fotorand nicht ganz auf null, bei heller Wand
    # bleibt eine sichtbare Kante. Darum die Raender zusaetzlich auf null ziehen.
    def taper(d, width):
        t = np.clip(d / width, 0, 1)
        return t * t * (3 - 2 * t)
    edge = taper(0.5 - np.abs(u), 0.16) * taper(v, 0.06) * taper(1 - v, 0.1)
    return STAGE + (a - STAGE) * spot * edge


def render(W, H, centers, height, top=0, bottom_fade=None):
    canvas = np.full((H, W), STAGE, np.float32)
    for name, cx in zip(SETS, centers):
        if cx is None:
            continue
        a = load(name, height)
        x0 = round(cx * W - a.shape[1] / 2)
        xa, xb = max(0, x0), min(W, x0 + a.shape[1])
        ya, yb = top, min(H, top + a.shape[0])
        canvas[ya:yb, xa:xb] = np.maximum(canvas[ya:yb, xa:xb], a[:yb - ya, xa - x0:xb - x0])
    img = np.repeat(canvas[..., None], 3, axis=2)
    img = vignette(img, bottom=0.3)
    if bottom_fade is not None:
        ys = np.linspace(0, 1, H, dtype=np.float32)
        t = np.clip((ys - bottom_fade) / (1 - bottom_fade), 0, 1)
        img = img * (1 - 0.8 * t * t * (3 - 2 * t))[:, None, None]
    return grain(img)


W = 2400
H = round(W / 3.8)
print(save(render(W, H, centers=[0.56, 0.72, 0.88], height=H), OUT / 'banner.webp'))
# Handy: nur der groesste Aufbau, oben mittig, unten dunkel fuer den Text.
print(save(render(900, 900, centers=[None, None, 0.5], height=560, top=20, bottom_fade=0.55),
           OUT / 'banner-mobil.webp'))
