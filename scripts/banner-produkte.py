"""Schwarzweiss-Banner fuer die Produktseite.

Quelle ist Louis' freigestellte Frontalaufnahme (Banner.png: Fotobox
zwischen zwei Soundboxen, transparenter Hintergrund). Der Banner ist eine
Nahaufnahme daraus: die Reihe fuellt die volle Breite, symmetrisch um die
Fotobox, die Linse sitzt im Bild. Statt Weiss steht sie auf einer dunklen
Buehne, damit der helle Text im Seitenkopf lesbar bleibt.

    python3 scripts/banner-produkte.py ~/Downloads/Banner.png public/images/produkte/banner.webp
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
RATIO = 3.8          # Breite : Hoehe, wie der Seitenkopf auf dem Desktop
OUT_W = 2880         # 1440 CSS-Pixel bei doppelter Pixeldichte
# Ausschnitt in Anteilen des Quellbilds. Waagerecht symmetrisch um die
# Fotobox (Mitte bei x = 0.4905), von Soundbox-Kante zu Soundbox-Kante.
CX, HALF_W = 0.4905, 0.4465
CY = 0.4686          # senkrecht: Soundboks-Logo oben bis gut unter die Linse

src = Image.open(SRC).convert('RGBA')
W, H = src.size

# Schwarzweiss mit etwas mehr Kontrast, Alphakanal bleibt erhalten.
gray = ImageEnhance.Contrast(src.convert('L')).enhance(1.12)
rgba = Image.merge('RGBA', (gray, gray, gray, src.getchannel('A')))

cw = 2 * HALF_W * W
ch = cw / RATIO
box = (round(CX * W - cw / 2), round(CY * H - ch / 2), round(CX * W + cw / 2), round(CY * H + ch / 2))
crop = rgba.crop(box)
out_h = round(OUT_W / RATIO)
crop = crop.resize((OUT_W, out_h), Image.LANCZOS)

# Dunkle Buehne: weicher Lichtschein hinter der Fotobox, zu den Raendern
# fast schwarz. Sichtbar nur in den Luecken zwischen den Geraeten.
ys, xs = np.mgrid[0:out_h, 0:OUT_W].astype(np.float32)
r = np.hypot((xs / OUT_W - 0.5) * RATIO * 0.55, ys / out_h - 0.35)
bg = (14 + 46 * np.exp(-r ** 2 * 2.2)).astype(np.uint8)
stage = Image.fromarray(bg, 'L').convert('RGBA')
stage.alpha_composite(crop)

result = stage.convert('L')
OUT.parent.mkdir(parents=True, exist_ok=True)
result.save(OUT, 'WEBP', quality=82, method=6)
print(result.size, f'Ausschnitt {box}', f'{OUT.stat().st_size // 1024} KB')
