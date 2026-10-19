"""Banner fuer die Ueber-uns-Seite aus Louis' freigestelltem Portraet.

Quelle: Louis-freigestellt.png (Oberkoerper, 631 x 902 px). Der Kopf ist darin
nur gut 190 px breit. Damit Louis scharf bleibt, wird das Foto hoechstens 1:1
uebernommen, nie hochgerechnet (Lukas, 18.10.2026: "Louis besser aufloesen").
Wie beim Produktbanner ohne Lichtkegel und Schein, nur Schwarzweiss auf dunklem
Grund; das Licht aus den oberen Ecken kommt per CSS.

    python3 scripts/banner-ueber-uns.py ~/Downloads/Louis-freigestellt.png public/images/ueber-uns
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

from buehne import bbox_crop, freisteller_banner, load_cutout, save

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])

cut = bbox_crop(load_cutout(SRC, only_largest=True, erode=1))
gray = cut.convert('L').filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
gray = ImageEnhance.Contrast(gray).enhance(1.12)
cut = Image.merge('RGBA', (gray, gray, gray, cut.getchannel('A')))
# Gesichtsmitte im Freisteller (Anteil der Breite), gemessen am obersten
# Achtel: dort ist nur der Kopf.
_head = np.asarray(cut.getchannel('A'))[: cut.height // 8] > 8
FACE_X = np.where(_head)[1].mean() / cut.width

# Breit: Kopf bis Brust, 1:1, der Rest laeuft unten aus dem Bild.
W = 2400
H = round(W / 3.8)
print(save(freisteller_banner(cut, W, H, scale=1.0, cx=0.76, top=40, anchor=FACE_X), OUT / 'banner.webp'))
# Quadratisch fuer schmale Bildschirme: Gesicht oben, unten dunkel fuer den
# Titel. Bild 900 px breit, Louis 1:1, also ebenfalls nicht hochgerechnet.
print(save(freisteller_banner(cut, 900, 900, scale=1.0, cx=0.5, top=50, anchor=FACE_X,
                              bottom_fade=0.36, fade_depth=0.93), OUT / 'banner-mobil.webp'))
