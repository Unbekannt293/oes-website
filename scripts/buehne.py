"""Gemeinsame Bausteine der Seitenkopf-Banner: dunkle Buehne mit Lichtkegel,
Randlicht um freigestellte Motive, Lichterkette (Bokeh) und Funkelsterne.

Alle Funktionen arbeiten mit float32-Arrays (Hoehe, Breite, 3), Werte 0..255.
Die Lichterkette und die Sterne sind dieselben Formen wie im Startseiten-Hero
(app/lib/stage-lights/glsl.ts), hier nur statisch in ein Bild gerechnet.
"""
import cv2
import numpy as np
from PIL import Image

GOLD = np.array([255, 186, 96], np.float32)


def load_cutout(path, only_largest=False, erode=1):
    """RGBA-Freisteller laden. only_largest wirft Streuflecken weg (bei
    zusammenhaengenden Motiven wie einem Portraet), erode nimmt den hellen
    Rand weg, den das Freistellen oft hinterlaesst."""
    a = np.asarray(Image.open(path).convert('RGBA')).copy()
    al = a[..., 3]
    if only_largest:
        n, lab, stats, _ = cv2.connectedComponentsWithStats((al > 40).astype(np.uint8), connectivity=8)
        if n > 2:
            keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
            al = np.where(lab == keep, al, 0).astype(np.uint8)
    if erode:
        al = cv2.erode(al, np.ones((3, 3), np.uint8), iterations=erode)
    a[..., 3] = al
    return Image.fromarray(a, 'RGBA')


def bbox_crop(im, thresh=8):
    ys, xs = np.where(np.asarray(im)[..., 3] > thresh)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def stage(w, h, cx, cy, rx, ry, level=64, base=10):
    """Dunkle Buehne mit weichem Lichtkegel um (cx, cy)."""
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    g = np.exp(-(((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2))
    return np.repeat((base + level * g)[..., None], 3, axis=2)


def festoon(w, h, chains, seed=3):
    """Lichterketten als Bokeh. chains: (oben, durchhang, abstand, radius, staerke),
    Pixelwerte. Gibt eine Ebene 0..1 zurueck."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    for top, sag, spacing, radius, strength in chains:
        layer = np.zeros((h, w), np.float32)
        period = w * rng.uniform(0.2, 0.3)
        phase = rng.uniform(0, 1)
        x = -spacing
        while x < w + spacing:
            u = 2 * (((x / period) + phase) % 1.0) - 1
            y = top + sag * (1 - u * u)
            v = strength * rng.uniform(0.7, 1.0)
            cv2.circle(layer, (int(x), int(y)), int(radius), float(v), -1, cv2.LINE_AA)
            x += spacing
        out += cv2.GaussianBlur(layer, (0, 0), radius * 0.38)
    return np.clip(out, 0, 1)


def sparkles(w, h, spots, tone=GOLD):
    """Vierzackige Sterne wie im Logo (konkave Raute). spots: (x, y, groesse)."""
    out = np.zeros((h, w), np.float32)
    for x, y, s in spots:
        x0, x1, y0, y1 = max(0, int(x - s * 2)), min(w, int(x + s * 2)), max(0, int(y - s * 2)), min(h, int(y + s * 2))
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        d = np.sqrt(np.abs(xx - x) / s) + np.sqrt(np.abs(yy - y) / s)
        star = 1 - np.clip((d - 0.82) / 0.3, 0, 1)
        glow = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (s * s * 1.5)) * 0.3
        out[y0:y1, x0:x1] = np.maximum(out[y0:y1, x0:x1], star + glow)
    return np.clip(out, 0, 1)


def place(canvas_hw, im, x, y):
    """Freisteller bei (x, y) auf eine Leinwand legen. Gibt (L, A) in Leinwandgroesse
    zurueck, L 0..255, A 0..1. Teile ausserhalb werden abgeschnitten."""
    H, W = canvas_hw
    arr = np.asarray(im.convert('RGBA'), dtype=np.float32)
    lum = arr[..., :3].mean(axis=2)
    L = np.zeros((H, W), np.float32)
    A = np.zeros((H, W), np.float32)
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + im.width), min(H, y + im.height)
    if x1 > x0 and y1 > y0:
        L[y0:y1, x0:x1] = lum[y0 - y:y1 - y, x0 - x:x1 - x]
        A[y0:y1, x0:x1] = arr[y0 - y:y1 - y, x0 - x:x1 - x, 3] / 255
    return L, A


def composite(bg, L, A, rim=0.2, rim_radius=14, soft=0.7):
    """Freisteller (L, A) auf die Buehne bg legen. Um die Silhouette liegt ein
    weicher Lichtschein, sonst verschwinden schwarze Motive auf dunklem Grund."""
    A = cv2.GaussianBlur(A, (0, 0), soft)
    halo = cv2.GaussianBlur(A, (0, 0), rim_radius)
    bg = bg + (255 * rim * halo * (1 - A))[..., None]
    return bg * (1 - A[..., None]) + L[..., None] * A[..., None]


def grain(img, sigma=3.0, seed=7):
    rng = np.random.default_rng(seed)
    return img + rng.normal(0, sigma, img.shape[:2]).astype(np.float32)[..., None]


def vignette(img, top=0.0, bottom=0.28):
    """Oben und unten abdunkeln, damit das Bild in die Seite uebergeht."""
    h = img.shape[0]
    ys = np.linspace(-1, 1, h, dtype=np.float32)
    k = 1 - bottom * np.clip((ys - 0.35) / 0.65, 0, 1) ** 1.3 - top * np.clip((-ys - 0.35) / 0.65, 0, 1) ** 1.3
    return img * k[:, None, None]


def duotone(gray, stops=((8, 7, 6), (150, 106, 50), (246, 224, 186))):
    """Graustufen (0..255, (h,w) oder (h,w,3)) auf einen Farbverlauf abbilden."""
    g = gray if gray.ndim == 2 else gray.mean(axis=2)
    t = np.clip(g / 255, 0, 1)
    xs = [0, 0.45, 1]
    return np.stack([np.interp(t, xs, [s[c] for s in stops]) for c in range(3)], axis=2).astype(np.float32)


def save(img, path, quality=80):
    from pathlib import Path
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    arr = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(arr, 'RGB').save(path, 'WEBP', quality=quality, method=6)
    return f'{path.name} {arr.shape[1]}x{arr.shape[0]} {path.stat().st_size // 1024} KB'
