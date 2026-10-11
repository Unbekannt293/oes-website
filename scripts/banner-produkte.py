"""Banner fuer die Produktseite aus Louis' freigestellter Frontalaufnahme
(Banner.png: Fotobox zwischen zwei Soundboxen, transparenter Hintergrund).

Das Motiv steht rechts auf dunkler Buehne mit Lichtkegel und Randlicht, links
bleibt Platz fuer Titel und Unterzeile. Gleiche Buehne wie das Ueber-uns-Banner
(scripts/buehne.py). Neben dem breiten Banner entsteht banner-mobil.webp
(quadratisch): auf dem Handy liegt das Motiv oben, die untere Haelfte bleibt
dunkel fuer den Text.

    python3 scripts/banner-produkte.py ~/Downloads/Banner.png public/images/produkte [gold|lichter]

Ohne Zusatz: Schwarzweiss, ruhig. "gold" taucht das Bild in Schwarz und Gold,
"lichter" legt goldene Lichterketten und Funkelsterne wie im Startseiten-Hero
dahinter.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

from buehne import (GOLD, bbox_crop, composite, duotone, festoon, grain, load_cutout,
                    place, save, sparkles, stage, vignette)

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
MODE = sys.argv[3] if len(sys.argv) > 3 else 'ruhig'

cut = bbox_crop(load_cutout(SRC, erode=0))
gray = ImageEnhance.Contrast(cut.convert('L')).enhance(1.1)
cut = Image.merge('RGBA', (gray, gray, gray, cut.getchannel('A')))


def render(W, H, scale, cx, top, spot, bottom_fade=None):
    """Motiv mit dem Massstab scale (Quellbild 2268 px breit) bei Mittelpunkt cx
    (Anteil der Breite) und Abstand top (Pixel) auf die Buehne setzen."""
    s = W / 1440
    figure = cut.resize((round(cut.width * scale), round(cut.height * scale)), Image.LANCZOS)
    L, A = place((H, W), figure, round(cx * W - figure.width / 2), top)
    bg = stage(W, H, cx * W, H * spot[0], W * spot[1], H * spot[2], level=78)

    if MODE == 'lichter':
        # Lichterkette hinter dem Motiv, Sterne davor. Lichter in Gold, Motiv bleibt
        # schwarzweiss, so wie auf der Startseite die Box vor den goldenen Lichtern steht.
        chains = [
            (H * 0.10, H * 0.07, 70 * s, 5 * s, 0.55),
            (H * 0.18, H * 0.11, 110 * s, 11 * s, 0.6),
            (H * 0.30, H * 0.16, 170 * s, 24 * s, 0.5),
        ]
        bg = bg + festoon(W, H, chains)[..., None] * GOLD * 0.62

    img = composite(bg, L, A, rim=0.2 if MODE == 'lichter' else 0.24)

    if MODE == 'lichter':
        stars = sparkles(W, H, [(0.07 * W, 0.22 * H, 11 * s), (0.31 * W, 0.12 * H, 8 * s),
                                (0.58 * W, 0.2 * H, 14 * s), (0.93 * W, 0.34 * H, 9 * s)])
        img = img + stars[..., None] * GOLD * 0.8
    elif MODE == 'gold':
        img = duotone(img)

    img = vignette(img)
    if bottom_fade is not None:
        ys = np.linspace(0, 1, H, dtype=np.float32)
        t = np.clip((ys - bottom_fade) / (1 - bottom_fade), 0, 1)
        img = img * (1 - 0.8 * t * t * (3 - 2 * t))[:, None, None]
    return grain(img)


W = 2400
H = round(W / 3.8)
print(save(render(W, H, scale=0.62, cx=0.77, top=26, spot=(0.42, 0.27, 0.75)), OUT / 'banner.webp'))
print(save(render(900, 900, scale=0.5, cx=0.5, top=36, spot=(0.26, 0.5, 0.4), bottom_fade=0.5),
           OUT / 'banner-mobil.webp'))
