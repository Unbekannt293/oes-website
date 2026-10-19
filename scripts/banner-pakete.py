"""Banner fuer die Pakete-Seite: Louis' freigestellter groesster Aufbau
(Fotobox, zwei Soundboxen, Drucker) in Schwarzweiss, wie Produkte und Ueber uns
ohne Lichtkegel, nur mit dem Licht aus den oberen Ecken (per CSS).

Auf dem Handy reicht das Motiv bis zum unteren Rand (Lukas, 18.10.2026),
unten nur etwas abgedunkelt, damit Titel und Unterzeile lesbar bleiben.

    python3 scripts/banner-pakete.py scripts/quellen/paket-freigestellt.webp public/images/pakete
"""
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

from buehne import bbox_crop, freisteller_banner, load_cutout, save

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])

cut = bbox_crop(load_cutout(SRC, erode=1))
gray = ImageEnhance.Contrast(cut.convert('L')).enhance(1.1)
cut = Image.merge('RGBA', (gray, gray, gray, cut.getchannel('A')))

W = 2400
H = round(W / 3.8)
# Volle Hoehe, der Aufbau steht auf der Unterkante.
s = (H - 18) / cut.height
print(save(freisteller_banner(cut, W, H, scale=s, cx=0.8, top=18, vignette_bottom=0.12),
           OUT / 'banner.webp'))
s = (900 - 40) / cut.height
print(save(freisteller_banner(cut, 900, 900, scale=s, cx=0.5, top=900 - round(cut.height * s), vignette_bottom=0.1,
                              bottom_fade=0.5, fade_depth=0.45), OUT / 'banner-mobil.webp'))
