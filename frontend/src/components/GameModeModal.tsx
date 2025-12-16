import { Clock, Globe, Zap, Trophy, Compass, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GameModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMode: (mode: "TIMED" | "FREE") => void;
}

export const GameModeModal = ({ open, onClose, onSelectMode }: GameModeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="glass-card-strong rounded-3xl p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">🗺️</span>
              <DialogTitle className="font-display text-3xl font-bold text-foreground">
                Choose Map Mode
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Timed Mode */}
            <button
              onClick={() => onSelectMode("TIMED")}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 gradient-ocean opacity-90 transition-opacity group-hover:opacity-100" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 text-white">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8" />
                </div>

                <h3 className="font-display text-2xl font-bold mb-2">Timed Mode</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  Race against time! Guess the highlighted country before time runs out.
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    <Zap className="w-3 h-3" /> Fast-paced
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    <Trophy className="w-3 h-3" /> Competitive
                  </span>
                </div>
              </div>
            </button>

            {/* Free Mode */}
            <button
              onClick={() => onSelectMode("FREE")}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-accent/20"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-90 transition-opacity group-hover:opacity-100" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 text-white">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8" />
                </div>

                <h3 className="font-display text-2xl font-bold mb-2">Free Mode</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  No timer! Freely guess countries and paint the map with your color.
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> Relaxed
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    <Compass className="w-3 h-3" /> Exploratory
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
