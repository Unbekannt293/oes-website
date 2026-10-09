"""Schwarzweiss-Banner fuer die Produktseite aus den Produktfotos.

Die Ganzkoerper-Aufnahmen (alle vor derselben Studiowand) werden
nebeneinander gesetzt und an den Kanten weich ineinander geblendet, so
entsteht eine Reihe wie auf einer Buehne. Vorher wird jede Aufnahme auf
dieselbe Wandhelligkeit gebracht, sonst sieht man die Naehte.

    python3 scripts/banner-produkte.py ~/Downloads public/images/produkte/banner.webp
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
H = 1100                      # Zielhoehe in Pixeln
FEATHER = 0.16                # Ueberblendung je Kante, Anteil der Streifenbreite
WALL = 0.80                   # Zielhelligkeit der Wand (0..1)
SPOT_FLOOR = 0.18             # Helligkeit ausserhalb der Lichtkegel
# Oben nur Wand, unten nur Boden: weg damit, sonst wird der Banner zu hoch
# fuer den breiten Seitenkopf und object-fit schneidet die Produkte an.
Y_CROP = (0.03, 0.95)

# Links steht im Seitenkopf der Titel auf dunklem Verlauf, das Motiv
# gehoert also eher nach rechts. Reihenfolge links -> rechts.
STRIPS = [
    # Datei,                                       Ausschnitt x0..x1 (Anteil)
    ('e147478f-ab13-4a8e-8651-0ca6465cbacc', (0.12, 0.88)),   # Soundbox auf Stativ
    ('22b0e890-63c2-4449-8720-b76c89351fe8', (0.00, 1.00)),   # Fotobox + 2 Soundboxen
    ('3d1d5426-8cb4-47ab-8c18-f6422a351b6a', (0.10, 1.00)),   # Fotobox + Drucker
    ('db7158aa-4add-470f-a22e-b68661a4ae41', (0.00, 1.00)),   # Fotobox, 2 Soundboxen, Drucker
    ('fa166bff-6d5c-4e1c-b940-a5fd90f3d6bc', (0.00, 1.00)),   # Fotobox, Soundbox, Drucker auf Tisch
    ('6ff77c5a-323e-4dda-b9d0-c5bb3f7fd0c4', (0.12, 0.88)),   # Soundbox schraeg
]


def load(name, crop):
    im = ImageOps.exif_transpose(Image.open(SRC / f'{name}.JPG')).convert('L')
    w, h = im.size
    im = im.crop((int(crop[0] * w), int(Y_CROP[0] * h), int(crop[1] * w), int(Y_CROP[1] * h)))
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float32) / 255
    # Wandhelligkeit: Median des oberen Fuenftels, dort ist nur Wand.
    wall = np.median(a[: H // 5])
    a = np.clip(a * (WALL / wall), 0, 1)
    # Buehnenspot je Streifen: ein Lichtkegel von oben auf die Mitte, die
    # Wand faellt zu den Seiten und nach oben ins Dunkle ab. Aus der hellen
    # Studiowand wird so eine Buehne wie auf dem Kontakt-Foto.
    ys, xs = np.mgrid[0:H, 0:a.shape[1]].astype(np.float32)
    u = xs / a.shape[1] - 0.5
    v = ys / H
    width = 0.30 + 0.28 * v                       # Kegel wird nach unten breiter
    cone = np.exp(-(u / width) ** 2)
    top = 0.55 + 0.45 * np.clip(v * 1.6, 0, 1)    # oben dunkler
    return a * (SPOT_FLOOR + (1 - SPOT_FLOOR) * cone * top)


strips = [load(n, c) for n, c in STRIPS]
ov = [round(min(a.shape[1], b.shape[1]) * FEATHER) for a, b in zip(strips, strips[1:])]
W = sum(s.shape[1] for s in strips) - sum(ov)

acc = np.zeros((H, W), np.float32)
wsum = np.zeros((H, W), np.float32)
x = 0
for i, s in enumerate(strips):
    w = s.shape[1]
    ramp = np.ones(w, np.float32)
    if i > 0:
        n = ov[i - 1]; ramp[:n] = np.linspace(0, 1, n) ** 1.5
    if i < len(strips) - 1:
        n = ov[i]; ramp[-n:] = np.minimum(ramp[-n:], np.linspace(1, 0, n) ** 1.5)
    acc[:, x:x + w] += s * ramp
    wsum[:, x:x + w] += ramp
    x += w - (ov[i] if i < len(ov) else 0)

img = acc / np.maximum(wsum, 1e-4)
out = Image.fromarray((img * 255).astype(np.uint8), 'L')
OUT.parent.mkdir(parents=True, exist_ok=True)
out.save(OUT, 'WEBP', quality=80, method=6)
print(out.size, f'{OUT.stat().st_size // 1024} KB')
