"""Seitenbanner mit Lichterketten (Produkte, Pakete, Ueber uns).

Lukas mag am Kontakt-Banner die Bildqualitaet und dass es die ganze Breite
fuellt. Fotos in Bannerbreite haben wir nur vom Konzert; Louis' Produktfotos
sind quadratisch und waeren gestreckt unscharf. Deshalb wird der Hintergrund
hier gerechnet, in voller Retina-Breite und damit immer scharf:
  - fast schwarz, warmes Licht von links und rechts oben (wie der schmale
    Kopfstreifen von Warenkorb und Kasse),
  - goldene Lichterketten quer ueber den oberen Rand (Bokeh wie hinter
    Louis' Produktfotos) und ein paar Funkelsterne aus dem Logo.
Optional steht rechts ein freigestelltes Motiv (Louis). Es wird hoechstens
1:1 uebernommen, nie hochgerechnet: lieber kleiner und scharf.

    python3 scripts/banner-lichter.py <ausgabeordner> [--seed N] [--motiv bild.png]

Ergebnis: banner.webp (3000 x 820) und banner-mobil.webp (1080 x 1080).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

from buehne import GOLD, bbox_crop, composite, festoon, grain, load_cutout, place, save, sparkles, vignette

ap = argparse.ArgumentParser()
ap.add_argument('out', type=Path)
ap.add_argument('--seed', type=int, default=3)
ap.add_argument('--motiv', type=Path)
args = ap.parse_args()

WARM = np.array([255, 196, 128], np.float32)   # Farbe der Lichtkegel


def backdrop(W, H, seed, text_side=True):
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.full((H, W, 3), 9.0, np.float32) + np.array([2, 1, 0], np.float32)
    # Zwei Lichtkegel von den oberen Ecken.
    for cx in (0.0, W):
        g = np.exp(-(((xs - cx) / (W * 0.42)) ** 2 + (ys / (H * 1.25)) ** 2))
        img += g[..., None] * WARM * 0.11
    s = W / 1440
    chains = [
        (H * 0.06, H * 0.10, 64 * s, 6 * s, 0.75),
        (H * 0.15, H * 0.16, 96 * s, 12 * s, 0.55),
        (H * 0.30, H * 0.20, 150 * s, 26 * s, 0.32),
    ]
    lights = festoon(W, H, chains, seed=seed)
    if text_side:
        # Links, wo der Titel steht, die Ketten nach unten hin leiser.
        fade = 1 - 0.55 * np.clip((ys / H - 0.25) / 0.5, 0, 1) * np.clip(1 - xs / (W * 0.55), 0, 1)
        lights *= fade
    img += lights[..., None] * GOLD * 0.85
    rng = np.random.default_rng(seed + 11)
    spots = [(rng.uniform(0.05, 0.95) * W, rng.uniform(0.1, 0.8) * H, rng.uniform(6, 13) * s) for _ in range(5)]
    img += sparkles(W, H, spots)[..., None] * GOLD * 0.7
    return img


def motiv_laden(path):
    cut = bbox_crop(load_cutout(path, only_largest=True, erode=1))
    gray = cut.convert('L').filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    gray = ImageEnhance.Contrast(gray).enhance(1.1)
    return Image.merge('RGBA', (gray, gray, gray, cut.getchannel('A')))


def render(W, H, seed, motiv=None, face_at=0.78, top_frac=0.12, text_side=True, mobile=False, max_scale=1.0):
    img = backdrop(W, H, seed, text_side)
    if motiv is not None:
        # Hoechstens 1:1, damit nichts hochgerechnet wird.
        scale = min(max_scale, (H * (1 - top_frac)) / motiv.height * 1.35)
        fig = motiv.resize((round(motiv.width * scale), round(motiv.height * scale)), Image.LANCZOS) if scale < 1 else motiv
        head = np.asarray(fig.getchannel('A'))[: fig.height // 8] > 8
        fx = np.where(head)[1].mean()
        x = round(face_at * W - fx)
        y = round(H * top_frac)
        L, A = place((H, W), fig, x, y)
        # Unteres Ende des Fotos (Huefte) weich ausblenden statt harter Kante.
        unten = y + fig.height
        if unten <= H:
            ys = np.arange(H, dtype=np.float32)[:, None]
            A = A * np.clip((unten - ys) / (fig.height * 0.22), 0, 1)
        img = composite(img, L, A, rim=0.18)
    img = vignette(img, bottom=0.45 if mobile else 0.3)
    if mobile:
        ys = np.linspace(0, 1, H, dtype=np.float32)
        t = np.clip((ys - 0.42) / 0.58, 0, 1)
        img = img * (1 - 0.85 * t * t * (3 - 2 * t))[:, None, None]
    return grain(img, sigma=2.4)


motiv = motiv_laden(args.motiv) if args.motiv else None
print(save(render(3000, 820, args.seed, motiv), args.out / 'banner.webp', quality=82))
# Handy: Motiv kleiner, damit unten Platz fuer Brotkrumen und Titel bleibt.
print(save(render(1080, 1080, args.seed, motiv, face_at=0.5, top_frac=0.08, text_side=False, mobile=True, max_scale=0.62),
           args.out / 'banner-mobil.webp', quality=82))
