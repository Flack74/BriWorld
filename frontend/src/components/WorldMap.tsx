import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import * as d3 from 'd3';
import { feature } from 'topojson-client';

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
  userColor = '#10b981',
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
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      console.log('WorldMap: SVG ref not ready');
      return;
    }

    console.log('WorldMap: Loading topology data...');
    // Load world topology
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => {
        console.log('WorldMap: Topology fetch successful');
        return res.json();
      })
      .then(topology => {
        console.log('WorldMap: Topology parsed, rendering map...');
        const countries = feature(topology, topology.objects.countries);
        
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
          .attr('id', (d: any) => d.id)
          .attr('fill', '#ececec')
          .attr('stroke', '#333')
          .attr('stroke-width', 0.5);
        
        console.log('WorldMap: Map rendered successfully with', countries.features.length, 'countries');
      })
      .catch(err => {
        console.error('WorldMap: Error loading topology:', err);
      });
  }, []);

  // Country centroids for auto-zoom
  const countryCentroids: Record<string, [number, number]> = {
    'AF': [66, 33], 'AL': [20, 41], 'DZ': [3, 28], 'AO': [17, -12], 'AR': [-64, -34],
    'AM': [45, 40], 'AU': [133, -27], 'AT': [14, 47], 'AZ': [47, 40], 'BD': [90, 24],
    'BE': [4, 50], 'BJ': [2, 9], 'BF': [-2, 12], 'BG': [25, 43], 'BA': [18, 44],
    'BY': [28, 53], 'BO': [-65, -17], 'BR': [-55, -10], 'BT': [90, 27], 'BW': [24, -22],
    'CA': [-95, 60], 'CF': [21, 7], 'CL': [-71, -30], 'CN': [105, 35], 'CI': [-5, 8],
    'CM': [12, 6], 'CD': [23, -2], 'CG': [15, -1], 'CO': [-72, 4], 'CR': [-84, 10],
    'CU': [-80, 22], 'CZ': [15, 49], 'DE': [10, 51], 'DJ': [43, 11], 'DK': [10, 56],
    'DO': [-70, 19], 'EC': [-78, -2], 'EG': [30, 27], 'ER': [39, 15], 'ES': [-4, 40],
    'EE': [26, 59], 'ET': [38, 8], 'FI': [26, 64], 'FJ': [178, -18], 'FR': [2, 46],
    'GA': [11, -1], 'GB': [-2, 54], 'GE': [43, 42], 'GH': [-2, 8], 'GN': [-10, 11],
    'GM': [-15, 13], 'GW': [-15, 12], 'GQ': [10, 2], 'GR': [22, 39], 'GL': [-40, 72],
    'GT': [-90, 15], 'GY': [-59, 5], 'HN': [-87, 15], 'HR': [16, 45], 'HT': [-72, 19],
    'HU': [20, 47], 'ID': [120, -2], 'IN': [77, 20], 'IE': [-8, 53], 'IR': [53, 32],
    'IQ': [44, 33], 'IS': [-18, 65], 'IL': [35, 31], 'IT': [12, 43], 'JM': [-77, 18],
    'JO': [36, 31], 'JP': [138, 36], 'KZ': [68, 48], 'KE': [38, 1], 'KG': [75, 41],
    'KH': [105, 13], 'KR': [128, 37], 'KW': [48, 29], 'LA': [102, 18], 'LB': [36, 34],
    'LR': [-9, 6], 'LY': [17, 25], 'LK': [81, 7], 'LS': [28, -29], 'LT': [24, 56],
    'LU': [6, 49], 'LV': [25, 57], 'MA': [-7, 32], 'MD': [28, 47], 'MG': [47, -19],
    'MX': [-102, 23], 'MK': [22, 41], 'ML': [-4, 17], 'MM': [96, 22], 'ME': [19, 42],
    'MN': [103, 46], 'MZ': [35, -18], 'MR': [-10, 20], 'MW': [34, -13], 'MY': [102, 4],
    'NA': [17, -22], 'NE': [8, 16], 'NG': [8, 10], 'NI': [-85, 13], 'NL': [5, 52],
    'NO': [10, 60], 'NP': [84, 28], 'NZ': [174, -41], 'OM': [56, 21], 'PK': [69, 30],
    'PA': [-80, 9], 'PE': [-76, -10], 'PH': [122, 12], 'PG': [147, -6], 'PL': [19, 52],
    'KP': [127, 40], 'PT': [-8, 39], 'PY': [-58, -23], 'QA': [51, 25], 'RO': [25, 46],
    'RU': [100, 60], 'RW': [30, -2], 'SA': [45, 24], 'SD': [30, 15], 'SN': [-14, 14],
    'SG': [104, 1], 'SB': [160, -8], 'SL': [-11, 8], 'SV': [-89, 13], 'SO': [46, 6],
    'RS': [21, 44], 'SS': [30, 7], 'ST': [7, 1], 'SR': [-56, 4], 'SK': [19, 48],
    'SI': [15, 46], 'SE': [15, 62], 'SZ': [31, -26], 'SY': [38, 35], 'TD': [19, 15],
    'TG': [1, 8], 'TH': [101, 15], 'TJ': [71, 39], 'TM': [60, 40], 'TL': [126, -9],
    'TN': [9, 34], 'TR': [35, 39], 'TT': [-61, 11], 'TW': [121, 24], 'TZ': [35, -6], 'UG': [32, 1],
    'UA': [32, 49], 'UY': [-56, -33], 'US': [-95, 38], 'UZ': [64, 41], 'VE': [-66, 8],
    'VN': [106, 16], 'VU': [167, -16], 'YE': [48, 15], 'ZA': [25, -29], 'ZM': [28, -15],
    'ZW': [30, -19], 'AE': [54, 24], 'BH': [50, 26], 'BN': [115, 4], 'CV': [-24, 16],
    'KM': [44, -12], 'CY': [33, 35], 'DM': [-61, 15], 'GD': [-61, 12], 'KI': [-168, 1],
    'LC': [-61, 14], 'LI': [9, 47], 'MV': [73, 3], 'MT': [14, 36], 'MH': [171, 7],
    'FM': [158, 6], 'MC': [7, 43], 'NR': [166, -1], 'PW': [134, 7], 'KN': [-62, 17],
    'SM': [12, 43], 'SC': [55, -4], 'TO': [-175, -21], 'TV': [179, -8], 'VC': [-61, 13],
    'WS': [-172, -13], 'AD': [1, 42], 'AG': [-61, 17], 'BB': [-59, 13], 'VA': [12, 41]
  };

  // Update painted countries effect
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      console.log('WorldMap: SVG ref not ready for painting');
      return;
    }

    const countryMap: any = {
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
      console.log('WorldMap: No paths found yet, map not loaded');
      return;
    }
    
    console.log('WorldMap: Updating painted countries...');
    // Reset all countries
    paths.attr('fill', '#ececec').attr('opacity', 1);
    
    // Paint all painted countries
    Object.entries(paintedCountries).forEach(([code, playerName]) => {
      const numericId = countryMap[code];
      const playerColor = playerColors[playerName] || '#10b981';
      if (numericId) {
        d3.select(svg).selectAll('path')
          .filter((d: any) => d.id === numericId)
          .attr('fill', playerColor)
          .attr('opacity', 0.8);
      }
    });
    
    // Paint user's found countries
    foundCountryCodes.forEach(code => {
      if (!paintedCountries[code]) {
        const numericId = countryMap[code];
        if (numericId) {
          d3.select(svg).selectAll('path')
            .filter((d: any) => d.id === numericId)
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
          .filter((d: any) => d.id === numericId)
          .attr('fill', '#fbbf24')
          .attr('opacity', 1)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2);
      }
    }
  }, [foundCountryCodes, currentCountry, userColor, paintedCountries, playerColors]);

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

        {/* World Map SVG - Interactive with zoom/pan */}
        <div 
          ref={containerRef}
          className="absolute inset-0 overflow-hidden flex items-center justify-center bg-game-ocean/5 cursor-grab active:cursor-grabbing"
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
        >
          <svg
            ref={svgRef}
            style={{ 
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
              userSelect: 'none',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          />
        </div>
      </div>

      {/* Input Area - Removed, will be added in Game.tsx */}
    </div>
  );
};
