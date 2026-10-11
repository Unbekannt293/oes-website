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
OUT_W = 2400         # reicht fuer 1440 CSS-Pixel, der Ausschnitt ist ohnehin nur ~1300 px breit
# Enger Ausschnitt um die Linse. Waagerecht von Soundbox-Gitter zu
# Soundbox-Gitter (HALF_W kleiner als die Kante der Boxen, damit rechts und
# links kein dunkler Rand bleibt), senkrecht mit der Linse in der Mitte.
# Linse im Quellbild bei ca. x = 0.49, y = 0.60 (Anteile).
# Im Seitenkopf steht links der Titel (endet bei ~47 % der Breite) und rechts
# die Unterzeile (ab ~58 %). Die Linse gehoert in die Luecke dazwischen.
LENS_X, LENS_AT = 0.4905, 0.5417   # Linse im Quellbild / im Ausschnitt (Anteil der Breite)
HALF_W = 0.285
CY = 0.585
# Die helle Frontplatte liegt hinter dem Text. Hochlichter abdunkeln, Schwaerzen
# (Soundbox-Gitter) bleiben, sonst ist weisser Text darauf kaum lesbar.
HIGHLIGHT_GAMMA, HIGHLIGHT_GAIN = 1.3, 0.72
src = Image.open(SRC).convert('RGBA')
W, H = src.size

# Schwarzweiss mit etwas mehr Kontrast, Alphakanal bleibt erhalten.
gray = ImageEnhance.Contrast(src.convert('L')).enhance(1.12)
rgba = Image.merge('RGBA', (gray, gray, gray, src.getchannel('A')))

cw = 2 * HALF_W * W
ch = cw / RATIO
left = LENS_X * W - LENS_AT * cw
box = (round(left), round(CY * H - ch / 2), round(left + cw), round(CY * H + ch / 2))
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
lut = [round(255 * HIGHLIGHT_GAIN * (v / 255) ** HIGHLIGHT_GAMMA) for v in range(256)]
result = result.point(lut)
OUT.parent.mkdir(parents=True, exist_ok=True)
result.save(OUT, 'WEBP', quality=82, method=6)
print(result.size, f'Ausschnitt {box}', f'{OUT.stat().st_size // 1024} KB')
