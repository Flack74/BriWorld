import { Globe, Users, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GameHeaderProps {
  roomId: string;
  mode: "flag" | "map";
  playerType: "single" | "private" | "public";
  round?: { current: number; total: number };
  timeLeft?: number;
  isFreeMode?: boolean;
}

export const GameHeader = ({
  roomId,
  mode,
  playerType,
  round,
  timeLeft,
  isFreeMode = false,
}: GameHeaderProps) => {
  return (
    <header className="game-header flex items-center gap-1 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* Room Info Badge */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1 text-xs">
          <span className="font-semibold truncate max-w-[60px]">{roomId}</span>
          <div className="w-px h-3 bg-border" />
          <span>{mode === "flag" ? "🚩" : "🗺️"}</span>
        </div>

        {round && !isFreeMode && (
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
            {round.current}/{round.total}
          </Badge>
        )}
      </div>

      {/* Timer - Top Right */}
      {timeLeft !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-display text-base font-bold transition-all duration-300 whitespace-nowrap ml-auto ${
          timeLeft <= 5 
            ? "bg-destructive text-destructive-foreground animate-pulse" 
            : timeLeft <= 10 
              ? "bg-game-timer text-white" 
              : "gradient-ocean text-white glow-primary"
        }`}>
          <Clock className="w-5 h-5" />
          <span>{timeLeft}</span>
        </div>
      )}
    </header>
  );
};
