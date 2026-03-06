import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { ROUND_OPTIONS, TIMEOUT_OPTIONS } from "@/constants/gameSettings";

interface RoundsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectRounds: (rounds: number) => void;
  onSelectTimeout: (timeout: number) => void;
  isLoggedIn: boolean;
  selectedTimeout: number;
  onStart?: () => void;
  selectedRounds?: number;
}

export const RoundsModal = ({ open, onClose, onSelectRounds, onSelectTimeout, isLoggedIn, selectedTimeout, onStart, selectedRounds = 10 }: RoundsModalProps) => {
  const roundOptions = isLoggedIn ? ROUND_OPTIONS.loggedIn : ROUND_OPTIONS.guest;
  const [localTimeout, setLocalTimeout] = useState(selectedTimeout);
  const [localRounds, setLocalRounds] = useState(selectedRounds);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden border-0 bg-transparent shadow-none max-h-[85vh]">
        <div className="glass-card-strong rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader className="mb-3 sm:mb-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <span className="text-2xl sm:text-3xl">⏱️</span>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Game Settings
              </DialogTitle>
            </div>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              {isLoggedIn ? "Premium options unlocked! 🎉" : "Configure your game"}
            </p>
          </DialogHeader>

          {/* Time Per Round Selection - FIRST */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Time Per Round</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
              {TIMEOUT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setLocalTimeout(option.value);
                    onSelectTimeout(option.value);
                  }}
                  className={`relative overflow-hidden rounded-lg p-2 sm:p-3 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    localTimeout === option.value
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 ring-2 ring-green-400'
                      : 'bg-gradient-to-br from-orange-500 to-red-600'
                  }`}
                >
                  <div className="text-white text-center">
                    <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{option.icon}</div>
                    <div className="font-bold text-xs sm:text-sm">{option.label}</div>
                    <div className="text-white/80 text-[10px] sm:text-xs">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rounds Selection - SECOND */}
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Number of Rounds</h3>
            <div className={`grid gap-2 sm:gap-3 ${isLoggedIn ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
              {roundOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setLocalRounds(option.value);
                    onSelectRounds(option.value);
                  }}
                  className={`group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    localRounds === option.value
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 ring-2 ring-green-400'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 text-white text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-bold mb-0.5">{option.label}</h3>
                    <p className="text-white/80 text-[10px] sm:text-xs">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {!isLoggedIn && ROUND_OPTIONS.loggedIn.length > ROUND_OPTIONS.guest.length && (
            <div className="text-center text-[10px] sm:text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6">
              💡 Login to unlock {ROUND_OPTIONS.loggedIn.slice(ROUND_OPTIONS.guest.length).map(o => o.value).join(', ')} round options!
            </div>
          )}
          
          {/* Start Button */}
          {onStart && (
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-border/50 text-muted-foreground hover:bg-muted/50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onStart();
                  onClose();
                }}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                🚀 Start Game
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
