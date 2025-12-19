import { useState, useRef } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorldMapProps {
  paintedCountries?: Record<string, string>;
  playerColors?: Record<string, string>;
  userColor?: string;
  currentUsername?: string;
}

const WorldMap = ({ paintedCountries = {}, playerColors = {}, userColor = '#10b981', currentUsername = '' }: WorldMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPan = useRef({ x: 0, y: 0 });

  // Map country codes to painted status
  const countryCodeMap: Record<string, string> = {
    'US': 'usa', 'CA': 'canada', 'MX': 'mexico', 'BR': 'brazil', 'AR': 'argentina',
    'CL': 'chile', 'PE': 'peru', 'CO': 'colombia', 'VE': 'venezuela', 'GB': 'uk',
    'IE': 'ireland', 'FR': 'france', 'ES': 'spain', 'PT': 'portugal', 'DE': 'germany',
    'IT': 'italy', 'NO': 'norway', 'SE': 'sweden', 'FI': 'finland', 'PL': 'poland',
    'UA': 'ukraine', 'RU': 'russia', 'TR': 'turkey', 'IR': 'iran', 'SA': 'saudi',
    'IQ': 'iraq', 'IN': 'india', 'PK': 'pakistan', 'CN': 'china', 'MN': 'mongolia',
    'JP': 'japan', 'KR': 'korea', 'TH': 'thailand', 'VN': 'vietnam', 'ID': 'indonesia',
    'PH': 'philippines', 'EG': 'egypt', 'LY': 'libya', 'DZ': 'algeria', 'MA': 'morocco',
    'NG': 'nigeria', 'ET': 'ethiopia', 'KE': 'kenya', 'ZA': 'south-africa', 'CD': 'congo',
    'AU': 'australia', 'NZ': 'newzealand', 'PG': 'papua', 'GL': 'greenland'
  };

  // Determine color for each country
  const getCountryColor = (countryId: string): string => {
    // Find if this country is painted
    const countryCode = Object.keys(countryCodeMap).find(code => countryCodeMap[code] === countryId);
    if (countryCode && paintedCountries[countryCode]) {
      const painter = paintedCountries[countryCode];
      return painter === currentUsername ? 'correct' : 'opponent';
    }
    return 'neutral';
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // More detailed world map with dynamic colors
  const countries = [
    // North America
    { id: "usa", color: getCountryColor("usa"), d: "M45 78 L48 72 L55 70 L75 68 L95 70 L115 72 L125 78 L130 88 L128 100 L120 115 L105 120 L85 118 L65 115 L50 108 L45 95 Z" },
    { id: "canada", color: getCountryColor("canada"), d: "M40 30 L55 28 L80 25 L110 26 L140 30 L150 35 L155 50 L150 65 L130 72 L100 70 L70 68 L50 65 L42 55 L38 42 Z" },
    { id: "alaska", color: getCountryColor("alaska"), d: "M20 30 L35 28 L42 35 L40 48 L30 52 L18 48 L15 38 Z" },
    { id: "mexico", color: getCountryColor("mexico"), d: "M50 120 L70 118 L85 122 L95 135 L90 150 L75 155 L60 148 L50 138 L48 128 Z" },
    { id: "greenland", color: getCountryColor("greenland"), d: "M165 18 L185 15 L200 20 L205 35 L198 50 L180 55 L165 48 L160 32 Z" },
    
    // South America
    { id: "brazil", color: getCountryColor("brazil"), d: "M108 152 L125 148 L145 155 L155 175 L150 200 L140 220 L120 225 L100 215 L95 190 L100 168 Z" },
    { id: "argentina", color: getCountryColor("argentina"), d: "M100 228 L120 230 L125 250 L120 275 L110 290 L95 285 L90 260 L92 240 Z" },
    { id: "chile", color: getCountryColor("chile"), d: "M85 235 L92 238 L95 260 L92 285 L88 300 L82 295 L80 270 L82 250 Z" },
    { id: "peru", color: getCountryColor("peru"), d: "M80 165 L95 160 L105 170 L100 190 L88 195 L78 185 Z" },
    { id: "colombia", color: getCountryColor("colombia"), d: "M85 138 L100 135 L108 148 L102 162 L88 158 L82 148 Z" },
    { id: "venezuela", color: getCountryColor("venezuela"), d: "M100 130 L118 128 L125 140 L118 150 L105 148 L98 140 Z" },
    
    // Europe
    { id: "uk", color: "neutral", d: "M218 58 L225 55 L230 62 L228 72 L222 75 L216 70 L215 62 Z" },
    { id: "ireland", color: "neutral", d: "M208 60 L215 58 L218 66 L214 72 L208 70 Z" },
    { id: "france", color: "neutral", d: "M222 78 L238 75 L245 85 L242 98 L230 102 L220 95 L218 85 Z" },
    { id: "spain", color: "neutral", d: "M210 98 L228 95 L232 108 L225 118 L210 120 L205 110 Z" },
    { id: "portugal", color: "neutral", d: "M200 102 L208 100 L210 115 L205 120 L198 115 Z" },
    { id: "germany", color: "neutral", d: "M240 68 L258 65 L265 78 L260 90 L245 92 L238 82 Z" },
    { id: "italy", color: "neutral", d: "M248 95 L258 92 L268 105 L265 125 L255 130 L248 118 L245 105 Z" },
    { id: "norway", color: "neutral", d: "M250 28 L265 25 L272 35 L268 55 L258 60 L252 48 L248 38 Z" },
    { id: "sweden", color: "neutral", d: "M262 32 L275 30 L280 45 L278 65 L268 68 L262 55 L260 42 Z" },
    { id: "finland", color: "neutral", d: "M278 28 L292 25 L298 40 L295 58 L285 62 L278 50 L276 38 Z" },
    { id: "poland", color: "neutral", d: "M265 68 L285 65 L290 80 L285 90 L268 92 L262 82 Z" },
    { id: "ukraine", color: "neutral", d: "M288 72 L315 68 L325 82 L320 95 L300 98 L288 92 L285 82 Z" },
    
    // Russia
    { id: "russia", color: getCountryColor("russia"), d: "M295 25 L380 20 L420 22 L440 30 L445 50 L440 70 L420 80 L380 85 L340 82 L310 78 L295 65 L292 45 Z" },
    
    // Middle East & Central Asia
    { id: "turkey", color: "neutral", d: "M278 98 L310 95 L325 102 L322 115 L305 120 L280 118 L275 108 Z" },
    { id: "iran", color: "neutral", d: "M325 105 L350 100 L362 115 L358 135 L340 142 L322 138 L318 120 Z" },
    { id: "saudi", color: "neutral", d: "M305 125 L330 120 L345 140 L340 165 L315 172 L298 160 L295 140 Z" },
    { id: "iraq", color: "neutral", d: "M310 108 L325 105 L330 120 L325 135 L310 138 L302 125 Z" },
    
    // South Asia
    { id: "india", color: getCountryColor("india"), d: "M345 115 L365 110 L378 125 L382 155 L370 180 L350 185 L335 170 L340 140 Z" },
    { id: "pakistan", color: "neutral", d: "M338 100 L355 95 L365 108 L360 125 L345 130 L332 120 Z" },
    
    // East Asia
    { id: "china", color: getCountryColor("china"), d: "M365 70 L400 65 L425 72 L440 90 L435 115 L415 135 L385 140 L360 130 L355 105 L360 85 Z" },
    { id: "mongolia", color: "neutral", d: "M375 58 L410 55 L425 65 L420 78 L395 82 L375 78 L370 68 Z" },
    { id: "japan", color: getCountryColor("japan"), d: "M445 80 L455 75 L462 85 L460 105 L452 115 L445 108 L442 92 Z" },
    { id: "korea", color: "neutral", d: "M432 88 L442 85 L448 98 L445 112 L435 115 L430 102 Z" },
    
    // Southeast Asia
    { id: "thailand", color: getCountryColor("thailand"), d: "M390 145 L402 142 L408 160 L405 178 L395 182 L388 168 Z" },
    { id: "vietnam", color: getCountryColor("vietnam"), d: "M405 140 L415 138 L420 158 L415 180 L405 175 L402 155 Z" },
    { id: "indonesia", color: getCountryColor("indonesia"), d: "M395 188 L430 185 L450 192 L455 205 L440 212 L410 210 L392 202 Z" },
    { id: "philippines", color: "neutral", d: "M428 145 L438 142 L445 158 L442 175 L432 178 L425 162 Z" },
    
    // Africa
    { id: "egypt", color: getCountryColor("egypt"), d: "M275 118 L295 115 L302 130 L298 148 L280 152 L270 140 Z" },
    { id: "libya", color: getCountryColor("libya"), d: "M245 120 L272 118 L278 138 L272 158 L248 162 L240 145 Z" },
    { id: "algeria", color: getCountryColor("algeria"), d: "M215 118 L242 115 L248 138 L245 160 L220 165 L210 145 Z" },
    { id: "morocco", color: getCountryColor("morocco"), d: "M195 115 L215 112 L220 130 L215 145 L198 148 L192 132 Z" },
    { id: "nigeria", color: getCountryColor("nigeria"), d: "M240 165 L260 162 L268 180 L262 198 L242 202 L235 185 Z" },
    { id: "ethiopia", color: "neutral", d: "M295 165 L315 162 L322 180 L315 198 L295 202 L288 185 Z" },
    { id: "kenya", color: "neutral", d: "M302 200 L320 198 L325 218 L318 235 L300 238 L295 220 Z" },
    { id: "south-africa", color: getCountryColor("south-africa"), d: "M265 245 L290 242 L298 265 L290 288 L268 292 L260 272 Z" },
    { id: "congo", color: "neutral", d: "M262 195 L285 192 L292 215 L285 238 L262 242 L255 220 Z" },
    
    // Oceania
    { id: "australia", color: getCountryColor("australia"), d: "M400 220 L450 215 L475 228 L480 258 L465 280 L430 285 L400 275 L392 248 Z" },
    { id: "newzealand", color: getCountryColor("newzealand"), d: "M482 275 L495 272 L500 290 L495 305 L482 308 L478 292 Z" },
    { id: "papua", color: "neutral", d: "M455 195 L475 192 L482 205 L478 218 L460 222 L452 210 Z" },
  ];

  const getColor = (colorType: string) => {
    switch (colorType) {
      case "correct":
        return "fill-map-correct";
      case "opponent":
        return "fill-map-opponent";
      default:
        return "fill-map-land";
    }
  };

  return (
    <div className="card-elevated overflow-hidden relative h-full group">
      {/* Zoom controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="w-10 h-10 bg-card/95 hover:bg-card shadow-card backdrop-blur-sm border border-border/50"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="w-10 h-10 bg-card/95 hover:bg-card shadow-card backdrop-blur-sm border border-border/50"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="w-10 h-10 bg-card/95 hover:bg-card shadow-card backdrop-blur-sm border border-border/50"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-card border border-border/50">
        {Math.round(zoom * 100)}%
      </div>

      {/* Map container */}
      <div className="w-full h-full flex items-center justify-center bg-map-bg p-4 overflow-hidden">
        <svg
          viewBox="0 0 520 320"
          className="w-full h-full max-h-full cursor-grab active:cursor-grabbing"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--map-border))" strokeWidth="0.2" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="520" height="320" fill="url(#grid)" />

          {/* Countries */}
          {countries.map((country) => (
            <path
              key={country.id}
              d={country.d}
              className={`${getColor(country.color)} stroke-card stroke-[0.5] cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-[1]`}
              style={{
                filter: country.color !== "neutral" ? "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" : undefined
              }}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-card border border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-map-correct" />
          <span className="text-xs font-medium text-foreground">Your guesses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-map-opponent" />
          <span className="text-xs font-medium text-foreground">Opponent</span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
export { WorldMap };
