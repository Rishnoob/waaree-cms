"""Turn DataMeet's india-composite.geojson (official Survey of India boundary, CC-0) into a dotted map.

Usage: make_india_dots.py india-composite.geojson out.ts
Output: a TypeScript module with a viewBox, dot coordinates, a simplified outline path, and the
projection constants so lat/lon pins can be placed on the same canvas.
"""
import json
import math
import sys

STEP = 0.36  # degrees between dots
WIDTH = 1000  # viewBox width
LAT0 = 22.0  # reference latitude for the equirectangular x-scale

src, out = sys.argv[1], sys.argv[2]
geo = json.load(open(src, encoding="utf-8"))
polys = geo["features"][0]["geometry"]["coordinates"]  # MultiPolygon: [polygon][ring][point]

# Bounding box over every ring
lons = [p[0] for poly in polys for ring in poly for p in ring]
lats = [p[1] for poly in polys for ring in poly for p in ring]
min_lon, max_lon, min_lat, max_lat = min(lons), max(lons), min(lats), max(lats)
kx = math.cos(math.radians(LAT0))
scale = WIDTH / ((max_lon - min_lon) * kx)
height = (max_lat - min_lat) * scale


def project(lon, lat):
    return ((lon - min_lon) * kx * scale, (max_lat - lat) * scale)


def decimate(ring, n):
    return ring[::n] + [ring[0]] if len(ring) > n * 4 else ring


# Simplified rings (outer rings only) with their bounding boxes, for fast point-in-polygon tests
rings = []
for poly in polys:
    outer = poly[0]
    r = decimate(outer, 12)
    xs, ys = [p[0] for p in r], [p[1] for p in r]
    rings.append((r, min(xs), max(xs), min(ys), max(ys), len(outer)))


def inside(lon, lat):
    for r, x0, x1, y0, y1, _ in rings:
        if not (x0 <= lon <= x1 and y0 <= lat <= y1):
            continue
        c = False
        j = len(r) - 1
        for i in range(len(r)):
            xi, yi = r[i]
            xj, yj = r[j]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi:
                c = not c
            j = i
        if c:
            return True
    return False


dots = []
lat = max_lat
row = 0
while lat >= min_lat:
    offset = (STEP / 2) if row % 2 else 0  # hex-ish staggering looks finer
    lon = min_lon + offset
    while lon <= max_lon:
        if inside(lon, lat):
            x, y = project(lon, lat)
            dots.append((round(x, 1), round(y, 1)))
        lon += STEP
    lat -= STEP
    row += 1

# Faint outline: the largest rings (mainland + big islands), heavily simplified
big = sorted(rings, key=lambda t: t[5], reverse=True)[:6]
paths = []
for r, *_ in big:
    pts = [project(lon, lat) for lon, lat in decimate(r, 10)]
    paths.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")

ts = f"""/**
 * Dotted map of India, generated from DataMeet's `india-composite.geojson`
 * (https://github.com/datameet/maps/tree/master/Country, CC-0), which follows the official
 * boundary of India as per the Survey of India. Regenerate with waaree-web/scripts/make-india-map.py.
 * Do not hand-edit.
 */
export const INDIA_VIEWBOX = {{ width: {WIDTH}, height: {round(height, 1)} }};

/** Equirectangular projection used for the dots, so pins line up: lon/lat → viewBox x/y. */
export const INDIA_PROJECTION = {{ minLon: {min_lon:.4f}, maxLat: {max_lat:.4f}, kx: {kx:.6f}, scale: {scale:.6f} }};

export function projectIndia(lon: number, lat: number): {{ x: number; y: number }} {{
  const p = INDIA_PROJECTION;
  return {{ x: (lon - p.minLon) * p.kx * p.scale, y: (p.maxLat - lat) * p.scale }};
}}

/** {len(dots)} dots as a flat [x0, y0, x1, y1, ...] array (compact). */
export const INDIA_DOTS: readonly number[] = [{",".join(f"{x},{y}" for x, y in dots)}];

/** Simplified outline (mainland + largest islands) for a faint stroke. */
export const INDIA_OUTLINE = {json.dumps(" ".join(paths))};
"""
open(out, "w", encoding="utf-8").write(ts)
print(f"dots={len(dots)} viewBox={WIDTH}x{height:.0f} bytes={len(ts)}")
