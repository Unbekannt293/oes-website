"""Bild und Effekt-Masken fuer den Startseiten-Hero (FotoboxHero.vue).

Eingabe: freigestelltes Foto der Fotobox von vorn (RGBA, transparenter
Hintergrund). Ausgabe:
  public/images/hero/fotobox.webp       das Foto, Raender beschnitten,
                                        Stoff unten weich ausgeblendet
  public/images/hero/fotobox-maps.png   halbe Aufloesung, drei Kanaele:
     R  Hoehe fuer den 3D-Kippeffekt: alles 140, LED 204, Objektiv als
        Kuppel bis 240 (Werte wie beim ersten Hero-Bild)
     G  Leuchten der LED
     B  weiche Silhouette fuer Schatten und Schein
Am Ende stehen die Messwerte (LED, Kasten), die in FotoboxHero.vue und die
Groessen fuer index.vue (--fb-h) gehoeren.

Das Foto wird nie hochgerechnet (das erste Hero-Bild war 1,65-fach
vergroessert und dadurch weich).

    python3 scripts/hero-fotobox.py scripts/quellen/hero-fotobox.webp
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
# Relativ zum Projekt, egal aus welchem Ordner das Skript startet.
OUT = Path(__file__).resolve().parent.parent / 'public/images/hero'

# Bisherige Darstellung auf der Seite: Kasten so hoch wie vorher.
KASTEN_ANTEIL = {'desktop': 0.5159 * 1.1, 'handy': 0.5159 * 0.64}

im = Image.open(SRC).convert('RGBA')
rgba = np.asarray(im).astype(np.float32)
a = rgba[..., 3] / 255

# Auf das Motiv zuschneiden, seitlich und oben etwas Luft (Schein, Kippen).
ys, xs = np.where(a > 0.5)
rand = round(0.06 * (xs.max() - xs.min()))
x_a, x_b = max(0, xs.min() - rand), min(im.width, xs.max() + rand + 1)
y_a, y_b = max(0, ys.min() - rand), ys.max() + 1
rgba = rgba[y_a:y_b, x_a:x_b].copy()
a = rgba[..., 3] / 255
H, W = a.shape

# Unten (Stoff) weich ausblenden, damit keine harte Kante sichtbar ist.
t = np.clip((np.arange(H) - H * 0.86) / (H * 0.14), 0, 1)
a = a * (1 - t * t * (3 - 2 * t))[:, None]
rgba[..., 3] = a * 255

lum = rgba[..., :3].mean(axis=2)
deckend = a > 0.5

# Kasten: die Zeilen, in denen das Motiv am breitesten ist.
breite = deckend.sum(axis=1)
zeilen = np.where(breite >= 0.85 * breite.max())[0]
y0, y1 = zeilen.min(), zeilen.max()
links = [np.where(deckend[y])[0].min() for y in zeilen]
rechts = [np.where(deckend[y])[0].max() for y in zeilen]
x0, x1 = int(np.median(links)), int(np.median(rechts))

# LED: helle Flaeche oberhalb des Kastens.
oben = np.zeros_like(deckend)
oben[:y0] = True
led = oben & deckend & (lum > 170)
n, lab, stats, cent = cv2.connectedComponentsWithStats(led.astype(np.uint8))
k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
lx, ly, lw, lh = stats[k, :4]
led_maske = np.zeros_like(deckend)
led_maske[ly:ly + lh, lx:lx + lw] = True
led_mitte = (lx + lw / 2, ly + lh / 2)

# Objektiv: dunkler Kreis im unteren Teil des Kastens, mittig.
unten = np.zeros_like(deckend)
unten[int(y0 + 0.55 * (y1 - y0)):y1, int(x0 + 0.3 * (x1 - x0)):int(x1 - 0.3 * (x1 - x0))] = True
obj = unten & deckend & (lum < 70)
n, lab, stats, cent = cv2.connectedComponentsWithStats(obj.astype(np.uint8))
k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
ox, oy = cent[k]
orad = (stats[k, cv2.CC_STAT_AREA] / np.pi) ** 0.5

# Masken in halber Aufloesung.
h2, w2 = H // 2, W // 2
klein = lambda m: cv2.resize(m.astype(np.float32), (w2, h2), interpolation=cv2.INTER_AREA)
a2, led2 = klein(a), klein(led_maske)
yy, xx = np.mgrid[0:h2, 0:w2].astype(np.float32)

hoehe = cv2.GaussianBlur(a2, (0, 0), 2.0) * 140
hoehe = np.where(led2 > 0.5, 204, hoehe)
d = np.hypot(xx - ox / 2, yy - oy / 2) / (orad / 2)
kuppel = np.sqrt(np.clip(1 - d * d, 0, 1))
hoehe = np.maximum(hoehe, (140 + 100 * kuppel) * (d < 1))

leuchten = np.maximum(cv2.GaussianBlur(led2, (0, 0), 5), 0.55 * cv2.GaussianBlur(led2, (0, 0), 35) / max(cv2.GaussianBlur(led2, (0, 0), 35).max(), 1e-6))
leuchten = leuchten / leuchten.max() * 254

silhouette = np.clip(cv2.GaussianBlur(a2, (0, 0), 4.5) * 1.15, 0, 1) * 255

maps = np.stack([hoehe, leuchten, silhouette], axis=2)
OUT.mkdir(parents=True, exist_ok=True)
Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(OUT / 'fotobox.webp', 'WEBP', quality=88, method=6)
Image.fromarray(np.clip(maps, 0, 255).astype(np.uint8), 'RGB').save(OUT / 'fotobox-maps.png', optimize=True)

r = lambda v: round(float(v), 4)
bh = (y1 - y0) / H
print(f'Bild {W}x{H}, Masken {w2}x{h2}')
print(f'FLASH_AT   = [{r(led_mitte[0] / W)}, {r(led_mitte[1] / H)}]')
print(f'BOX_CENTER = [{r((x0 + x1) / 2 / W)}, {r((y0 + y1) / 2 / H)}]')
print(f'BOX_HEIGHT = {r(bh)}')
print(f'BOX_RECT   = [{r(x0 / W)}, {r(y0 / H)}, {r(x1 / W)}, {r(y1 / H)}]')
print(f'--fb-h Desktop {r(KASTEN_ANTEIL["desktop"] / bh)}, Handy {r(KASTEN_ANTEIL["handy"] / bh)}')
