import { Globe, Sparkles } from "lucide-react";
import MuteButton from "@/components/MuteButton";

const GameHeader = () => {
  return (
    <div className="card-elevated px-6 py-3.5 flex items-center gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
        <Globe className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="font-bold text-foreground text-base flex-1">
        Guess any country and paint the map!
      </span>
      <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
      <MuteButton />
    </div>
  );
};

export default GameHeader;
