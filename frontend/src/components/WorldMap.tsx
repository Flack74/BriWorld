import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import * as d3 from 'd3';
import { feature } from 'topojson-client';

type WorldAtlasFeature = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> & {
  id?: string | number;
};

type WorldAtlasCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

interface RecentGuess {
  country: string;
  correct: boolean;
}

interface WorldMapProps {
  countriesFound?: number;
  recentGuesses?: RecentGuess[];
  foundCountryCodes?: string[];
  currentCountry?: string;
  userColor?: string;
  paintedCountries?: Record<string, string>;
  playerColors?: Record<string, string>;
  onSubmitGuess?: (guess: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}

export const WorldMap = ({
  countriesFound,
  recentGuesses = [],
  foundCountryCodes = [],
  currentCountry,
  userColor,
  paintedCountries = {},
  playerColors = {},
  onSubmitGuess,
  onZoomIn,
  onZoomOut,
  onReset,
}: WorldMapProps) => {
  const [showGuesses, setShowGuesses] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    // Load world topology
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => {
        return res.json();
      })
      .then((topology: { objects: { countries: unknown } }) => {
        const countries = feature(topology as never, topology.objects.countries as never) as WorldAtlasCollection;
        
        const width = 960;
        const height = 700;
        
        const projection = d3.geoMercator()
          .scale(150)
          .center([0, 20])
          .translate([width / 2, height / 2]);
        
        const path = d3.geoPath().projection(projection);
        
        const svgElement = d3.select(svg);
        svgElement.selectAll('*').remove();
        
        svgElement
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', `0 0 ${width} ${height}`)
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .style('width', '100%')
          .style('height', '100%');
        
        svgElement.selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('id', (d) => String((d as WorldAtlasFeature).id ?? ''))
          .attr('fill', '#ececec')
          .attr('stroke', '#333')
          .attr('stroke-width', 0.5);
        
        setMapLoaded(true);
      })
      .catch(err => {
      });
  }, []);

  // Update painted countries effect
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !mapLoaded) {
      return;
    }

    // console.log('[WorldMap] Updating painted countries:', Object.keys(paintedCountries).length, 'countries');
    // console.log('[WorldMap] Player colors:', playerColors);

    const countryMap: Record<string, string> = {
      'AF': '004', 'AL': '008', 'DZ': '012', 'AD': '020', 'AO': '024', 'AG': '028', 'AR': '032', 'AM': '051',
      'AU': '036', 'AT': '040', 'AZ': '031', 'BS': '044', 'BH': '048', 'BD': '050', 'BB': '052', 'BY': '112',
      'BE': '056', 'BZ': '084', 'BJ': '204', 'BT': '064', 'BO': '068', 'BA': '070', 'BW': '072', 'BR': '076',
      'BN': '096', 'BG': '100', 'BF': '854', 'BI': '108', 'KH': '116', 'CM': '120', 'CA': '124', 'CV': '132',
      'CF': '140', 'TD': '148', 'CL': '152', 'CN': '156', 'CO': '170', 'KM': '174', 'CG': '178', 'CD': '180',
      'CR': '188', 'CI': '384', 'HR': '191', 'CU': '192', 'CY': '196', 'CZ': '203', 'DK': '208', 'DJ': '262',
      'DM': '212', 'DO': '214', 'EC': '218', 'EG': '818', 'SV': '222', 'GQ': '226', 'ER': '232', 'EE': '233',
      'ET': '231', 'FJ': '242', 'FI': '246', 'FR': '250', 'GA': '266', 'GM': '270', 'GE': '268', 'DE': '276',
      'GH': '288', 'GR': '300', 'GD': '308', 'GL': '304', 'GT': '320', 'GN': '324', 'GW': '624', 'GY': '328', 'HT': '332',
      'HN': '340', 'HU': '348', 'IS': '352', 'IN': '356', 'ID': '360', 'IR': '364', 'IQ': '368', 'IE': '372',
      'IL': '376', 'IT': '380', 'JM': '388', 'JP': '392', 'JO': '400', 'KZ': '398', 'KE': '404', 'KI': '296',
      'KP': '408', 'KR': '410', 'KW': '414', 'KG': '417', 'LA': '418', 'LV': '428', 'LB': '422', 'LS': '426',
      'LR': '430', 'LY': '434', 'LI': '438', 'LT': '440', 'LU': '442', 'MG': '450', 'MW': '454', 'MY': '458',
      'MV': '462', 'ML': '466', 'MT': '470', 'MH': '584', 'MR': '478', 'MU': '480', 'MX': '484', 'FM': '583',
      'MD': '498', 'MC': '492', 'MN': '496', 'ME': '499', 'MA': '504', 'MZ': '508', 'MM': '104', 'NA': '516',
      'NR': '520', 'NP': '524', 'NL': '528', 'NZ': '554', 'NI': '558', 'NE': '562', 'NG': '566', 'MK': '807',
      'NO': '578', 'OM': '512', 'PK': '586', 'PW': '585', 'PS': '275', 'PA': '591', 'PG': '598', 'PY': '600',
      'PE': '604', 'PH': '608', 'PL': '616', 'PT': '620', 'QA': '634', 'RO': '642', 'RU': '643', 'RW': '646',
      'KN': '659', 'LC': '662', 'VC': '670', 'WS': '882', 'SM': '674', 'ST': '678', 'SA': '682', 'SN': '686',
      'RS': '688', 'SC': '690', 'SL': '694', 'SG': '702', 'SK': '703', 'SI': '705', 'SB': '090', 'SO': '706',
      'ZA': '710', 'SS': '728', 'ES': '724', 'LK': '144', 'SD': '729', 'SR': '740', 'SZ': '748', 'SE': '752',
      'CH': '756', 'SY': '760', 'TJ': '762', 'TZ': '834', 'TH': '764', 'TL': '626', 'TG': '768', 'TO': '776',
      'TT': '780', 'TN': '788', 'TR': '792', 'TM': '795', 'TW': '158', 'TV': '798', 'UG': '800', 'UA': '804', 'AE': '784',
      'GB': '826', 'US': '840', 'UY': '858', 'UZ': '860', 'VU': '548', 'VA': '336', 'VE': '862', 'VN': '704',
      'YE': '887', 'ZM': '894', 'ZW': '716'
    };

    const paths = d3.select(svg).selectAll('path');
    if (paths.empty()) {
      return;
    }
    // Reset all countries
    paths.attr('fill', '#ececec').attr('opacity', 1);
    
    // Paint all painted countries
    Object.entries(paintedCountries).forEach(([code, playerName]) => {
      const numericId = countryMap[code];
      const playerColor = playerColors[playerName];
      if (numericId && playerColor) {
        const matchedPaths = d3.select(svg).selectAll('path')
          .filter((d) => String((d as WorldAtlasFeature).id ?? '') === numericId);
        
        if (!matchedPaths.empty()) {
          matchedPaths
            .attr('fill', playerColor)
            .attr('opacity', 0.8);
        } else {
          // console.log('[WorldMap] No SVG path found for numeric ID:', numericId, 'code:', code);
        }
      } else {
        // if (!numericId) console.log('[WorldMap] No mapping for country code:', code);
        // if (!playerColor) console.log('[WorldMap] No color for player:', playerName);
      }
    });
    
    // Paint user's found countries
    foundCountryCodes.forEach(code => {
      if (!paintedCountries[code]) {
        const numericId = countryMap[code];
        if (numericId) {
          d3.select(svg).selectAll('path')
            .filter((d) => String((d as WorldAtlasFeature).id ?? '') === numericId)
            .attr('fill', userColor)
            .attr('opacity', 0.8);
        }
      }
    });
    
    // Highlight current country with bright yellow
    if (currentCountry) {
      const numericId = countryMap[currentCountry];
      if (numericId) {
        d3.select(svg).selectAll('path')
          .filter((d) => String((d as WorldAtlasFeature).id ?? '') === numericId)
          .attr('fill', '#fbbf24')
          .attr('opacity', 1)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2);
      }
    }
  }, [foundCountryCodes, currentCountry, userColor, paintedCountries, playerColors, mapLoaded]);

  // No pan/zoom handlers - static map only

  return (
    <div className="h-full w-full flex flex-col">

      {/* Countries Found Counter - moved to top bar */}

      {/* Map Container */}
      <div className="relative flex-1 bg-game-ocean/10 rounded-2xl overflow-hidden border border-border/50">
        {/* Recent Guesses Dropdown */}
        {recentGuesses.length > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowGuesses(!showGuesses)}
              className="glass-card-strong px-4 py-2 rounded-xl text-sm font-medium hover:bg-card/100 transition-all"
            >
              Recent Guesses: {recentGuesses.length}
            </button>
            
            {showGuesses && (
              <div className="absolute top-full left-0 mt-2 glass-card-strong rounded-xl p-3 min-w-[180px] animate-fade-in">
                <div className="space-y-1.5">
                  {recentGuesses.slice(0, 5).map((guess, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg ${
                        guess.correct ? "bg-game-success/10 text-game-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span>{i + 1}.</span>
                      <span className="font-medium">{guess.country}</span>
                      {guess.correct ? "✓" : "✗"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
            className="glass-card-strong p-2 rounded-xl hover:bg-card/100 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            className="glass-card-strong p-2 rounded-xl hover:bg-card/100 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>

        {/* World Map SVG - Interactive with zoom/pan on SVG only, container fixed */}
        <div 
          ref={containerRef}
          className="absolute inset-0 overflow-hidden flex items-center justify-center bg-game-ocean/5"
        >
          <svg
            ref={svgRef}
            className="cursor-grab active:cursor-grabbing touch-none"
            style={{ 
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
              userSelect: 'none',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: (isDragging || isTouching) ? 'none' : 'transform 0.1s ease-out',
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setIsTouching(true);
              setTouchStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
            }}
            onTouchMove={(e) => {
              if (isTouching && e.touches[0]) {
                const touch = e.touches[0];
                setPan({ x: touch.clientX - touchStart.x, y: touch.clientY - touchStart.y });
              }
            }}
            onTouchEnd={() => {
              setIsTouching(false);
            }}
          />
        </div>
      </div>

      {/* Input Area - Removed, will be added in Game.tsx */}
    </div>
  );
};
