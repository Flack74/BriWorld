#!/usr/bin/env python3
"""
Generate country silhouettes from world-atlas TopoJSON.

Outputs:
- backend/static/silhouettes.json for runtime loading
- backend/internal/game/silhouette_data.go as a compiled fallback
"""

from __future__ import annotations

import json
import math
import re
import urllib.request
from pathlib import Path

TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
ROOT = Path(__file__).resolve().parents[1]
WORLD_JSON = ROOT / "static" / "world.json"
OUTPUT_JSON = ROOT / "static" / "silhouettes.json"
OUTPUT_GO = ROOT / "internal" / "game" / "silhouette_data.go"


def normalize_name(name: str) -> str:
    value = name.strip().lower()
    value = value.replace("&", "and")
    value = re.sub(r"[\.\']", "", value)
    value = re.sub(r"\s+", " ", value)
    return value


NAME_ALIASES = {
    "united states": "united states of america",
    "usa": "united states of america",
    "czechia": "czech republic",
    "bosnia and herz": "bosnia and herzegovina",
    "dominican rep": "dominican republic",
    "central african rep": "central african republic",
    "dem rep congo": "democratic republic of the congo",
    "eq guinea": "equatorial guinea",
    "solomon is": "solomon islands",
    "timor-leste": "timor leste",
    "w sahara": "western sahara",
}


def build_name_index() -> dict[str, str]:
    countries = json.loads(WORLD_JSON.read_text())
    name_index: dict[str, str] = {}
    for code, name in countries.items():
        normalized = normalize_name(name)
        name_index[normalized] = code

    for alias, canonical in NAME_ALIASES.items():
        canonical_code = name_index.get(normalize_name(canonical))
        if canonical_code:
            name_index[normalize_name(alias)] = canonical_code

    return name_index


def decode_arc(arcs_list, arc_idx, transform):
    reverse = arc_idx < 0
    arc = arcs_list[~arc_idx] if reverse else arcs_list[arc_idx]

    x = 0
    y = 0
    points = []
    for dx, dy in arc:
        x += dx
        y += dy
        px = x * transform["scale"][0] + transform["translate"][0]
        py = y * transform["scale"][1] + transform["translate"][1]
        points.append((px, py))

    if reverse:
        points.reverse()

    return points


def project_local_equirectangular(points, center_lat):
    cos_lat = math.cos(math.radians(center_lat))
    scale_x = cos_lat if abs(cos_lat) > 1e-6 else 1.0

    projected = []
    for lon, lat in points:
        projected.append((lon * scale_x, lat))
    return projected


def decode_ring(ring_arc_indices, arcs_list, transform):
    ring_points = []
    for arc_idx in ring_arc_indices:
        arc_points = decode_arc(arcs_list, arc_idx, transform)
        if ring_points and arc_points:
            ring_points.extend(arc_points[1:])
        else:
            ring_points.extend(arc_points)
    return ring_points


def geometry_to_rings(geometry, arcs_list, transform):
    rings = []
    geom_type = geometry.get("type")
    arcs = geometry.get("arcs", [])

    if geom_type == "Polygon":
        if arcs:
            rings.append(decode_ring(arcs[0], arcs_list, transform))
    elif geom_type == "MultiPolygon":
        for polygon in arcs:
            if polygon:
                rings.append(decode_ring(polygon[0], arcs_list, transform))

    return [ring for ring in rings if len(ring) >= 3]


def polygon_area(points):
    if len(points) < 3:
        return 0.0

    area = 0.0
    for i, (x1, y1) in enumerate(points):
        x2, y2 = points[(i + 1) % len(points)]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2.0


def project_and_filter_rings(rings):
    if not rings:
        return []

    all_lats = [lat for ring in rings for _, lat in ring]
    center_lat = sum(all_lats) / len(all_lats)
    projected = [project_local_equirectangular(ring, center_lat) for ring in rings]

    areas = [polygon_area(ring) for ring in projected]
    max_area = max(areas, default=0.0)
    if max_area <= 0:
        return projected

    min_keep_area = max_area * 0.002
    kept = [ring for ring, area in zip(projected, areas) if area >= min_keep_area]
    return kept or [projected[areas.index(max_area)]]


def rings_to_svg_path(rings):
    parts = []
    for ring in rings:
        open_ring = ring[:-1] if ring and ring[0] == ring[-1] else ring
        if len(open_ring) < 3:
            continue

        part = f"M{open_ring[0][0]:.2f},{open_ring[0][1]:.2f}"
        for x, y in open_ring[1:]:
            part += f"L{x:.2f},{y:.2f}"
        part += "Z"
        parts.append(part)

    return "".join(parts) if parts else None


def write_go_fallback(silhouettes: dict[str, str]):
    lines = ["package game", "", "var SilhouetteMap = map[string]string{"]
    for code, path in sorted(silhouettes.items()):
        lines.append(f'\t"{code}": "{path}",')
    lines.append("}")
    OUTPUT_GO.write_text("\n".join(lines) + "\n")


def main():
    print("Fetching world atlas geometry...")
    with urllib.request.urlopen(TOPO_URL) as response:
        topo = json.loads(response.read())

    name_index = build_name_index()
    transform = topo["transform"]
    arcs_list = topo["arcs"]
    countries = topo["objects"]["countries"]["geometries"]

    silhouettes: dict[str, str] = {}
    unmatched: list[str] = []

    for geom in countries:
        name = geom.get("properties", {}).get("name", "")
        code = name_index.get(normalize_name(name))
        if not code:
            unmatched.append(name)
            continue

        rings = geometry_to_rings(geom, arcs_list, transform)
        projected_rings = project_and_filter_rings(rings)
        path = rings_to_svg_path(projected_rings)
        if path:
            silhouettes[code] = path

    OUTPUT_JSON.write_text(json.dumps(dict(sorted(silhouettes.items())), separators=(",", ":")))
    write_go_fallback(silhouettes)

    print(f"Generated {len(silhouettes)} silhouettes")
    print(f"Wrote {OUTPUT_JSON}")
    print(f"Wrote {OUTPUT_GO}")

    if unmatched:
        sample = ", ".join(sorted(set(unmatched))[:20])
        print(f"Unmatched names ({len(set(unmatched))}): {sample}")


if __name__ == "__main__":
    main()
