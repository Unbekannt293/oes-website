"""Schwarzweiss-Banner fuer die Ueber-uns-Seite aus Louis' Portraet.

Gleiches Prinzip wie der Produktbanner: Nahaufnahme, Schwarzweiss, dunkle
Buehne. Das Portraet (Hochformat) steht auf der rechten Seite, links laeuft
es ins Dunkle aus und gibt dem Titel Platz. Der Hintergrund des Fotos ist
ohnehin dunkles Laub, der Uebergang faellt nicht auf.

Das Foto ist klein (678 px breit) und wird knapp doppelt vergroessert.
Gegen den weichen Eindruck: leichtes Nachschaerfen und feines Korn, das
Unschaerfe optisch kaschiert und zum Filmlook passt.

    python3 scripts/banner-ueber-uns.py portrait.jpg public/images/ueber-uns/banner.webp

Neben dem breiten Banner entsteht banner-mobil.webp (quadratisch): auf dem
Handy waere der breite Ausschnitt so stark beschnitten, dass der Titel das
Gesicht ueberdeckt. Im Quadrat liegt das Gesicht oben, das Hemd unter dem Titel.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SRC, OUT = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
RATIO = 3.8                 # Breite : Hoehe, wie der Seitenkopf auf dem Desktop
OUT_W = 2400
OUT_H = round(OUT_W / RATIO)

# Sichtbarer senkrechter Bereich im Quellfoto (Pixel): von knapp ueber den
# Haaren bis unter das Kinn auf den Hemdkragen. Daraus folgt der Massstab.
Y0, Y1 = 148, 470
# Anteil der Bannerbreite, den das Foto belegt. Der Rest links ist Buehne.
PHOTO_SHARE = 0.56
FADE = 0.42                 # Anteil der Fotobreite, ueber den es links ausblendet
STAGE = 12                  # Helligkeit der Buehne (0..255)
GRAIN = 3.2

img = ImageOps.exif_transpose(Image.open(SRC)).convert('L')
W, H = img.size

crop = img.crop((0, Y0, W, Y1))
photo_w = round(OUT_W * PHOTO_SHARE)
scale = photo_w / W
photo_h = round(crop.height * scale)
if photo_h < OUT_H:
    # Zu wenig Hoehe fuer die Bannerhoehe: etwas mehr Foto oben und unten nehmen.
    extra = (OUT_H / scale - crop.height) / 2
    crop = img.crop((0, max(0, round(Y0 - extra)), W, min(H, round(Y1 + extra))))
    photo_h = round(crop.height * scale)
photo = crop.resize((photo_w, photo_h), Image.LANCZOS)
photo = photo.filter(ImageFilter.UnsharpMask(radius=2.2, percent=90, threshold=2))
photo = ImageEnhance.Contrast(photo).enhance(1.14)

a = np.asarray(photo, dtype=np.float32)
# Auf Bannerhoehe mittig zuschneiden.
top = max(0, (a.shape[0] - OUT_H) // 2)
a = a[top: top + OUT_H]
if a.shape[0] < OUT_H:
    a = np.pad(a, ((0, OUT_H - a.shape[0]), (0, 0)), mode='edge')

# Weiche Ausblendung der linken Kante des Fotos zur Buehne.
n = round(photo_w * FADE)
ramp = np.ones(photo_w, np.float32)
t = np.linspace(0, 1, n)
ramp[:n] = t * t * (3 - 2 * t)                       # smoothstep
canvas = np.full((OUT_H, OUT_W), STAGE, np.float32)
x0 = OUT_W - photo_w
canvas[:, x0:] = STAGE + (a - STAGE) * ramp[None, :]

# Leichte Randabdunklung oben und unten, Korn zuletzt.
ys = np.linspace(-1, 1, OUT_H, dtype=np.float32)[:, None]
canvas *= 1 - 0.28 * np.clip(np.abs(ys) - 0.45, 0, 1) ** 1.2 / 0.55 ** 1.2
rng = np.random.default_rng(7)
canvas += rng.normal(0, GRAIN, canvas.shape).astype(np.float32)

out = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), 'L')
OUT.parent.mkdir(parents=True, exist_ok=True)
out.save(OUT, 'WEBP', quality=80, method=6)
print(out.size, f'Foto {photo_w}x{photo_h} (Faktor {scale:.2f})', f'{OUT.stat().st_size // 1024} KB')

# ---- Quadratischer Ausschnitt fuer schmale Bildschirme ----
SQ_TOP = 62                     # Pixel ueber den Haaren, damit der Kopf nicht oben anstoesst
sq = img.crop((0, SQ_TOP, W, SQ_TOP + W))
sq = sq.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
sq = ImageEnhance.Contrast(sq).enhance(1.14)
b = np.asarray(sq, dtype=np.float32)
# Untere Haelfte weich ins Dunkle ziehen: dort steht der Titel.
yy = np.linspace(0, 1, b.shape[0], dtype=np.float32)[:, None]
fade = np.clip((yy - 0.52) / 0.40, 0, 1)
b = b * (1 - 0.72 * fade * fade * (3 - 2 * fade))
b += rng.normal(0, GRAIN, b.shape).astype(np.float32)
mobile = OUT.with_name('banner-mobil.webp')
Image.fromarray(np.clip(b, 0, 255).astype(np.uint8), 'L').save(mobile, 'WEBP', quality=80, method=6)
print(mobile.name, sq.size, f'{mobile.stat().st_size // 1024} KB')
