#!/usr/bin/env python3
"""
Generate country silhouettes from Natural Earth TopoJSON
Outputs Go code for silhouette_data.go
"""

import json
import urllib.request
from pathlib import Path

# Natural Earth TopoJSON URL
TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

# Country code mapping (Natural Earth ID -> ISO 3166-1 alpha-2)
COUNTRY_CODES = {
    "840": "US", "826": "GB", "250": "FR", "276": "DE", "392": "JP",
    "156": "CN", "356": "IN", "076": "BR", "124": "CA", "036": "AU",
    "484": "MX", "380": "IT", "724": "ES", "410": "KR", "643": "RU",
    "710": "ZA", "566": "NG", "818": "EG", "554": "NZ", "702": "SG",
    "643": "RU", "792": "TR", "392": "JP", "410": "KR", "158": "TW",
    "360": "ID", "458": "MY", "764": "TH", "704": "VN", "608": "PH",
    "116": "KH", "104": "MM", "887": "KP", "144": "HK", "446": "MO",
    "586": "PK", "050": "BD", "144": "LK", "524": "NP", "004": "AF",
    "364": "IR", "368": "IQ", "376": "IL", "400": "JO", "414": "KW",
    "422": "LB", "512": "OM", "634": "QA", "682": "SA", "784": "AE",
    "887": "YE", "504": "MA", "504": "MA", "504": "MA", "504": "MA",
}

def simplify_path(points, tolerance=0.5):
    """Simplify SVG path using Ramer-Douglas-Peucker algorithm"""
    if len(points) < 3:
        return points
    
    # Find point with max distance
    dmax = 0
    index = 0
    for i in range(1, len(points) - 1):
        d = point_line_distance(points[i], points[0], points[-1])
        if d > dmax:
            dmax = d
            index = i
    
    if dmax > tolerance:
        rec1 = simplify_path(points[:index+1], tolerance)
        rec2 = simplify_path(points[index:], tolerance)
        return rec1[:-1] + rec2
    else:
        return [points[0], points[-1]]

def point_line_distance(point, line_start, line_end):
    """Calculate perpendicular distance from point to line"""
    px, py = point
    x1, y1 = line_start
    x2, y2 = line_end
    
    num = abs((y2-y1)*px - (x2-x1)*py + x2*y1 - y2*x1)
    den = ((y2-y1)**2 + (x2-x1)**2)**0.5
    return num / den if den != 0 else 0

def generate_svg_path(geometry, arcs_list, transform):
    """Convert TopoJSON geometry to SVG path"""
    if not geometry or "arcs" not in geometry:
        return None
    
    arcs = geometry["arcs"]
    points = []
    
    # Handle both single and multi-part geometries
    arc_indices = [arcs] if not isinstance(arcs[0], list) else arcs
    
    for arc_group in arc_indices:
        indices = arc_group if isinstance(arc_group, list) else [arc_group]
        for arc_idx in indices:
            if isinstance(arc_idx, list):
                continue
            arc = arcs_list[~arc_idx] if arc_idx < 0 else arcs_list[arc_idx]
            x, y = 0, 0
            
            for dx, dy in arc:
                x += dx
                y += dy
                px = x * transform["scale"][0] + transform["translate"][0]
                py = y * transform["scale"][1] + transform["translate"][1]
                points.append((px, py))
    
    if not points:
        return None
    
    # Simplify path
    simplified = simplify_path(points, tolerance=1.0)
    
    # Generate SVG path
    path = f"M{simplified[0][0]:.1f},{simplified[0][1]:.1f}"
    for x, y in simplified[1:]:
        path += f"L{x:.1f},{y:.1f}"
    path += "Z"
    
    return path

def main():
    print("Fetching Natural Earth TopoJSON...")
    try:
        with urllib.request.urlopen(TOPO_URL) as response:
            topo = json.loads(response.read())
    except Exception as e:
        print(f"Error fetching: {e}")
        return
    
    transform = topo["transform"]
    countries = topo["objects"]["countries"]["geometries"]
    arcs_list = topo["arcs"]
    
    silhouettes = {}
    
    for idx, geom in enumerate(countries):
        country_id = str(geom.get("id", idx))
        country_code = COUNTRY_CODES.get(country_id)
        
        if country_code:
            path = generate_svg_path(geom, arcs_list, transform)
            if path:
                silhouettes[country_code] = path
                print(f"✓ {country_code}: {len(path)} chars")
    
    # Generate Go code
    go_code = "package game\n\nvar SilhouetteMap = map[string]string{\n"
    for code, path in sorted(silhouettes.items()):
        go_code += f'\t"{code}": "{path}",\n'
    go_code += "}\n"
    
    # Save to file
    output_path = Path(__file__).parent.parent / "internal" / "game" / "silhouette_data.go"
    with open(output_path, "w") as f:
        f.write(go_code)
    
    print(f"\n✓ Generated {len(silhouettes)} silhouettes")
    print(f"✓ Saved to {output_path}")

if __name__ == "__main__":
    main()
