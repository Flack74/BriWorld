import { Clock, Trophy, Target, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RoundsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectRounds: (rounds: number) => void;
}

const roundOptions = [
  { value: 5, label: "5 Rounds", icon: "⚡", description: "Quick game" },
  { value: 10, label: "10 Rounds", icon: "🎯", description: "Standard game" },
  { value: 15, label: "15 Rounds", icon: "🏆", description: "Extended game" },
  { value: 20, label: "20 Rounds", icon: "🔥", description: "Marathon game" },
];

export const RoundsModal = ({ open, onClose, onSelectRounds }: RoundsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="glass-card-strong rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">⏱️</span>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                Choose Rounds
              </DialogTitle>
            </div>
            <p className="text-center text-muted-foreground text-sm">
              How many countries do you want to guess?
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {roundOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelectRounds(option.value)}
                className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/20 bg-gradient-to-br from-blue-500 to-purple-600"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 text-white text-center">
                  {/* Icon */}
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {option.icon}
                  </div>

                  <h3 className="font-display text-xl font-bold mb-1">{option.label}</h3>
                  <p className="text-white/80 text-sm">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};