"""Einheitlicher Hintergrund fuer Produkt- und Paketfotos: dunkle Buehne mit
warmem Spot, goldenen Lichterketten und Logo-Sternen wie im Startseiten-Hero.

Die freigestellten Produkte werden in einem Bildprogramm auf den Hintergrund
gesetzt. Alle Fotos haben so denselben Rahmen, dieselbe Bodenlinie und denselben
Massstab, und die Galerie wirkt beim Durchklicken ruhig.

    python3 scripts/hintergrund-produkte.py ~/Downloads/OES-Hintergruende

Erzeugt je Format: Vorlage (doppelte Groesse, PNG, verlustfrei zum Bearbeiten),
Web-Version (WebP) und eine Vorlage mit Hilfslinien fuer die Platzierung.
  Produkt 1:1   Web 1200 x 1200   Vorlage 2400 x 2400
  Paket   4:3   Web 1600 x 1200   Vorlage 3200 x 2400
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

from buehne import GOLD, festoon, grain, sparkles

OUT = Path(sys.argv[1]).expanduser()
OUT.mkdir(parents=True, exist_ok=True)

BASE = np.array([11, 10, 9], np.float32)       # #0B0A09, wie der Hero
WARM = np.array([74, 64, 52], np.float32)      # Farbe des Lichtkegels
FLOOR_Y = 0.84                                 # Bodenlinie: hier stehen die Produkte


def backdrop(W, H, seed=3):
    s = W / 1440
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = xs / W - 0.5, ys / H

    # Lichtkegel hinter dem Produkt, damit auch schwarze Soundboxen sich abheben.
    spot = np.exp(-((u / 0.34) ** 2) - ((v - 0.52) / 0.48) ** 2)
    # Lichtfleck auf dem Boden, wo das Produkt steht.
    floor = np.exp(-((u / 0.30) ** 2) - ((v - FLOOR_Y - 0.02) / 0.045) ** 2)
    # Boden einen Hauch heller als die Wand, weicher Uebergang an der Linie.
    ground = np.clip((v - FLOOR_Y + 0.015) / 0.03, 0, 1) * 0.10
    img = BASE + WARM * (spot * 0.85 + floor * 0.55 + ground)[..., None]

    # Lichterketten oben, in drei Tiefen wie im Hero. Nur im oberen Drittel,
    # damit das Produkt davor frei steht.
    chains = [
        (H * 0.05, H * 0.05, 70 * s, 5 * s, 0.55),
        (H * 0.10, H * 0.08, 110 * s, 11 * s, 0.6),
        (H * 0.17, H * 0.12, 170 * s, 24 * s, 0.45),
    ]
    lights = festoon(W, H, chains, seed=seed)
    img = img + lights[..., None] * GOLD * 0.85

    # Wenige Sterne an den Raendern, nicht hinter dem Produkt.
    stars = sparkles(W, H, [
        (0.09 * W, 0.34 * H, 16 * s), (0.88 * W, 0.28 * H, 21 * s),
        (0.13 * W, 0.66 * H, 11 * s), (0.91 * W, 0.6 * H, 13 * s),
    ])
    img = img + stars[..., None] * GOLD * 0.95

    # Rand leicht abdunkeln, haelt den Blick in der Mitte.
    vig = 1 - 0.35 * np.clip(np.hypot(u * 1.2, (v - 0.5) * 1.1) - 0.35, 0, 1) / 0.45
    img = img * np.clip(vig, 0.6, 1)[..., None]
    return grain(img, sigma=2.2)


def guides(img):
    """Hilfslinien: Bodenlinie, Bereich fuer das Produkt, Mittelachse."""
    H, W = img.shape[:2]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')
    d = ImageDraw.Draw(im)
    lw = max(2, W // 600)
    gold = (216, 160, 72)
    d.line([(0, FLOOR_Y * H), (W, FLOOR_Y * H)], fill=gold, width=lw)                 # Bodenlinie
    d.line([(W / 2, 0.30 * H), (W / 2, FLOOR_Y * H)], fill=(120, 110, 95), width=lw)  # Mitte
    # Produktbereich: oberhalb der Bodenlinie, unterhalb der Lichterketten.
    d.rectangle([(0.18 * W, 0.24 * H), (0.82 * W, FLOOR_Y * H)], outline=gold, width=lw)
    return im


def export(name, W, H):
    big = backdrop(W * 2, H * 2)
    master = Image.fromarray(np.clip(big, 0, 255).astype(np.uint8), 'RGB')
    master.save(OUT / f'{name}-vorlage-{W * 2}x{H * 2}.png', optimize=True)
    web = master.resize((W, H), Image.LANCZOS)
    web.save(OUT / f'{name}-web-{W}x{H}.webp', 'WEBP', quality=86, method=6)
    guides(big).save(OUT / f'{name}-hilfslinien-{W * 2}x{H * 2}.png', optimize=True)
    for f in sorted(OUT.glob(f'{name}-*')):
        print(f'{f.name:40s} {f.stat().st_size // 1024:6d} KB')


export('produkt', 1200, 1200)
export('paket', 1600, 1200)
