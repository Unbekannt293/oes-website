"""Stilisierte Karte von Tonndorf aus OSM-Daten (ODbL) als SVG.

Erzeugt public/images/kontakt/tonndorf-karte.svg fuer die Kontaktseite.

    curl -A "oes-website-build" --data-urlencode data@scripts/karte-tonndorf.overpass \
         https://overpass-api.de/api/interpreter -o osm.json
    python3 scripts/karte-tonndorf.py osm.json public/images/kontakt/tonndorf-karte.svg

Die Daten stehen unter ODbL: auf der Seite muss
"Kartendaten (c) OpenStreetMap-Mitwirkende" sichtbar bleiben.
"""
import json, math, sys

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 1200, 800
LAT0, LAT1 = 53.5650, 53.6093
LON0, LON1 = 10.0631, 10.1750


def merc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


MY0, MY1 = merc(LAT0), merc(LAT1)


def proj(lat, lon):
    x = (lon - LON0) / (LON1 - LON0) * W
    y = (MY1 - merc(lat)) / (MY1 - MY0) * H
    return x, y


def dp(pts, eps):
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    # Geschlossener Ring: Anfang == Ende, die Bezugslinie haette Laenge 0.
    # Am entferntesten Punkt teilen und beide Haelften einzeln vereinfachen.
    if math.dist(pts[0], pts[-1]) < 1e-6:
        far = max(range(len(pts)), key=lambda i: math.dist(pts[0], pts[i]))
        if far == 0:
            return pts[:1]
        return dp(pts[: far + 1], eps)[:-1] + dp(pts[far:], eps)
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x1 * y0 - y1 * x0) / n
        if d > best:
            best, idx = d, i
    if best > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def inside(pts, m=60):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return max(xs) > -m and min(xs) < W + m and max(ys) > -m and min(ys) < H + m


def path(pts, close=False):
    s = 'M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    return s + ('Z' if close else '')


layers = {k: [] for k in ['green', 'water', 'stream', 'minor', 'major', 'motor', 'rail']}
district_ways = []

data = json.load(open(SRC))
for e in data['elements']:
    t = e.get('tags', {})
    if e['type'] == 'relation':
        for m in e.get('members', []):
            if m.get('role') == 'outer' and 'geometry' in m:
                district_ways.append([proj(g['lat'], g['lon']) for g in m['geometry']])
        continue
    pts = [proj(g['lat'], g['lon']) for g in e.get('geometry', [])]
    if len(pts) < 2 or not inside(pts):
        continue
    hw = t.get('highway')
    if hw in ('motorway', 'motorway_link', 'trunk', 'trunk_link'):
        layers['motor'].append(path(dp(pts, 0.7)))
    elif hw in ('primary', 'primary_link', 'secondary'):
        layers['major'].append(path(dp(pts, 0.7)))
    elif hw:
        layers['minor'].append(path(dp(pts, 0.9)))
    elif t.get('railway') == 'rail':
        layers['rail'].append(path(dp(pts, 0.7)))
    elif t.get('waterway'):
        layers['stream'].append(path(dp(pts, 0.9)))
    elif t.get('natural') == 'water':
        layers['water'].append(path(dp(pts, 0.6), True))
    else:
        layers['green'].append(path(dp(pts, 0.9), True))


def rings(ways):
    """Aussenwege der Relation zu geschlossenen Ringen zusammensetzen."""
    ways = [list(w) for w in ways]
    out = []
    key = lambda p: (round(p[0], 2), round(p[1], 2))
    while ways:
        ring = ways.pop(0)
        changed = True
        while changed and key(ring[0]) != key(ring[-1]):
            changed = False
            for i, w in enumerate(ways):
                if key(w[0]) == key(ring[-1]):
                    ring += w[1:]
                elif key(w[-1]) == key(ring[-1]):
                    ring += w[::-1][1:]
                elif key(w[-1]) == key(ring[0]):
                    ring = w[:-1] + ring
                elif key(w[0]) == key(ring[0]):
                    ring = w[::-1][:-1] + ring
                else:
                    continue
                ways.pop(i)
                changed = True
                break
        out.append(ring)
    return out


district = ' '.join(path(dp(r, 0.5), True) for r in rings(district_ways))

labels = [
    ('Wandsbek', 53.5760, 10.0755),
    ('Jenfeld', 53.5745, 10.1350),
    ('Rahlstedt', 53.6000, 10.1590),
    ('Farmsen-Berne', 53.6080, 10.1120),
]

# Farben fest im SVG: als <img> eingebunden erbt es kein CSS der Seite.
# Werte aus tokens.css: Ink, Gold, Paper.
css = """
.bg{fill:#12110F}
.green{fill:#1B1F18}
.water{fill:#19232E}
.stream{fill:none;stroke:#1F2A36;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.minor{fill:none;stroke:#2A2722;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}
.major{fill:none;stroke:#423B30;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.motor{fill:none;stroke:#5E4D33;stroke-width:4.2;stroke-linecap:round;stroke-linejoin:round}
.rail{fill:none;stroke:#3A3630;stroke-width:1.6;stroke-dasharray:7 5}
.district{fill:#C38B37;fill-opacity:.14;stroke:#C38B37;stroke-width:2.2;stroke-dasharray:2 6;stroke-linecap:round;stroke-linejoin:round}
.lbl{font:600 23px/1 Inter,-apple-system,'Segoe UI',sans-serif;letter-spacing:.18em;fill:#8C8578;text-anchor:middle;text-transform:uppercase}
.gold{fill:#D8A048;font-size:27px;letter-spacing:.24em}
.halo{stroke:#12110F;stroke-width:7;stroke-linejoin:round;paint-order:stroke}
"""

parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
         f'<style>{" ".join(css.split())}</style>',
         f'<rect class="bg" width="{W}" height="{H}"/>']
for k in ['green', 'water', 'stream', 'minor', 'rail', 'major', 'motor']:
    if layers[k]:
        parts.append(f'<path class="{k}" d="{" ".join(layers[k])}"/>')
parts.append(f'<path class="district" fill-rule="evenodd" d="{district}"/>')
for name, lat, lon in labels:
    x, y = proj(lat, lon)
    parts.append(f'<text class="lbl halo" x="{x:.0f}" y="{y:.0f}">{name.upper()}</text>')
x, y = proj(53.5872, 10.1200)
parts.append(f'<text class="lbl gold halo" x="{x:.0f}" y="{y:.0f}">TONNDORF</text>')
parts.append('</svg>')
open(OUT, 'w').write('\n'.join(parts))
print({k: len(v) for k, v in layers.items()}, 'district rings', len(rings(district_ways)))
