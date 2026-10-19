"""Banner fuer die Produktseite aus Louis' freigestellter Frontalaufnahme
(Banner.png: Fotobox zwischen zwei Soundboxen, transparenter Hintergrund).

Schwarzweiss rechts auf dunklem Grund, links Platz fuer den Titel. Kein
Lichtkegel und kein Schein um das Motiv mehr (Lukas, 18.10.2026): das einzige
Licht ist das warme aus den oberen Ecken, das PageHero per CSS darueberlegt.
Neben dem breiten Banner entsteht banner-mobil.webp (quadratisch, Motiv oben).

    python3 scripts/banner-produkte.py ~/Downloads/Banner.png public/images/produkte
"""
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

from buehne import bbox_crop, freisteller_banner, load_cutout, save

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])

cut = bbox_crop(load_cutout(SRC, erode=0))
gray = ImageEnhance.Contrast(cut.convert('L')).enhance(1.1)
cut = Image.merge('RGBA', (gray, gray, gray, cut.getchannel('A')))

W = 2400
H = round(W / 3.8)
print(save(freisteller_banner(cut, W, H, scale=0.62, cx=0.77, top=26), OUT / 'banner.webp'))
print(save(freisteller_banner(cut, 900, 900, scale=0.5, cx=0.5, top=36, bottom_fade=0.5), OUT / 'banner-mobil.webp'))
