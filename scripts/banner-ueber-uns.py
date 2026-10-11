"""Banner fuer die Ueber-uns-Seite aus Louis' freigestelltem Portraet.

Gleiche Buehne wie der Produktbanner (scripts/buehne.py): dunkler Raum,
Lichtkegel hinter dem Kopf, weicher Lichtschein um die Silhouette. Das
Portraet steht rechts, links bleibt Platz fuer den Titel.

Das Foto ist klein (678 px breit) und wird fast verdoppelt. Gegen den
weichen Eindruck: leichtes Nachschaerfen und feines Korn.

    python3 scripts/banner-ueber-uns.py portrait.webp public/images/ueber-uns [lichter]

Mit dem Zusatz "lichter" kommen Lichterkette und Funkelsterne dazu, passend
zum Produktbanner Variante c. Neben dem breiten Banner entsteht
banner-mobil.webp (quadratisch): auf dem Handy waere der breite Ausschnitt so
beschnitten, dass der Titel das Gesicht ueberdeckt.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

from buehne import (GOLD, bbox_crop, composite, festoon, grain, load_cutout, place,
                    save, sparkles, stage, vignette)

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
LIGHTS = len(sys.argv) > 3 and sys.argv[3] == 'lichter'

cut = bbox_crop(load_cutout(SRC, only_largest=True, erode=1))
gray = cut.convert('L').filter(ImageFilter.UnsharpMask(radius=2.0, percent=80, threshold=2))
gray = ImageEnhance.Contrast(gray).enhance(1.14)
cut = Image.merge('RGBA', (gray, gray, gray, cut.getchannel('A')))
FACE_X = 300 / cut.width        # Gesichtsmitte im Freisteller (Anteil der Breite)


def render(W, H, scale, face_at, top, spot_y, bottom_fade=None, lights=False):
    figure = cut.resize((round(cut.width * scale), round(cut.height * scale)), Image.LANCZOS)
    x = round(face_at * W - FACE_X * figure.width)
    L, A = place((H, W), figure, x, top)
    bg = stage(W, H, face_at * W, spot_y * H, W * 0.2, H * 0.85, level=82)
    s = W / 1440
    if lights:
        chains = [
            (H * 0.10, H * 0.07, 70 * s, 5 * s, 0.55),
            (H * 0.18, H * 0.11, 110 * s, 11 * s, 0.6),
            (H * 0.30, H * 0.16, 170 * s, 24 * s, 0.5),
        ]
        bg = bg + festoon(W, H, chains)[..., None] * GOLD * 0.62
    img = composite(bg, L, A, rim=0.22)
    if lights:
        stars = sparkles(W, H, [(0.07 * W, 0.22 * H, 11 * s), (0.31 * W, 0.12 * H, 8 * s),
                                (0.58 * W, 0.2 * H, 14 * s), (0.62 * W, 0.7 * H, 9 * s)])
        img = img + stars[..., None] * GOLD * 0.8
    img = vignette(img)
    if bottom_fade is not None:
        ys = np.linspace(0, 1, H, dtype=np.float32)
        t = np.clip((ys - bottom_fade) / (1 - bottom_fade), 0, 1)
        img = img * (1 - 0.75 * t * t * (3 - 2 * t))[:, None, None]
    return grain(img)


# Breit: Kopf gross, Schultern laufen unten aus dem Bild.
wide = render(2400, round(2400 / 3.8), scale=1.75, face_at=0.76, top=30, spot_y=0.4, lights=LIGHTS)
print(save(wide, OUT / 'banner.webp'))

# Quadratisch fuer schmale Bildschirme: Gesicht oben, unten ins Dunkle fuer den Titel.
square = render(900, 900, scale=1.6, face_at=0.5, top=52, spot_y=0.3, bottom_fade=0.38, lights=LIGHTS)
print(save(square, OUT / 'banner-mobil.webp'))
