import { Trophy, Crown, Medal } from "lucide-react";

interface Player {
  id: string;
  name: string;
  score: number;
  isYou?: boolean;
  isLeader?: boolean;
  color: "correct" | "opponent";
  avatar?: string;
  avatarUrl?: string;
  playerColor?: string; // Map mode color
}

interface LeaderboardProps {
  players: Player[];
  messageCount: number;
  showPlayerColors?: boolean; // Show color dots in map mode
}

const Leaderboard = ({ players, messageCount, showPlayerColors = false }: LeaderboardProps) => {
  return (
    <div className="card-elevated h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-2 sm:p-3 lg:p-5 flex items-center gap-1 sm:gap-2 lg:gap-3 border-b border-border/50">
        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl gradient-warning flex items-center justify-center shadow-glow-warning animate-float">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-warning-foreground" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground">Leaderboard</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground hidden lg:block">Live rankings</p>
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 p-1 sm:p-2 lg:p-4 space-y-1 sm:space-y-2 lg:space-y-3 overflow-y-auto">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`relative flex items-center gap-1 sm:gap-2 lg:gap-3 p-1 sm:p-2 lg:p-4 rounded-lg sm:rounded-xl transition-all duration-300 animate-fade-in ${
              player.isYou
                ? "bg-secondary/80 border border-primary/40 sm:border-2 shadow-glow-primary"
                : "bg-muted/40 hover:bg-muted/70"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Rank badge */}
            <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold ${
              index === 0 
                ? "gradient-warning text-warning-foreground" 
                : "bg-muted text-muted-foreground"
            }`}>
              {index === 0 ? <Crown className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" /> : index + 1}
            </div>

            {/* Avatar */}
            {player.avatarUrl ? (
              <div className="relative">
                <img
                  src={player.avatarUrl}
                  alt={player.name}
                  className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full object-cover ring-1 sm:ring-2 ring-offset-1 ring-offset-card ${
                    player.color === "correct" ? "ring-success" : "ring-warning"
                  }`}
                />
                {showPlayerColors && player.playerColor && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-card"
                    style={{ backgroundColor: player.playerColor }}
                  />
                )}
              </div>
            ) : showPlayerColors && player.playerColor ? (
              <div className="relative">
                <div
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full ring-1 sm:ring-2 ring-offset-1 ring-offset-card ring-border flex items-center justify-center text-xs sm:text-sm lg:text-lg font-semibold text-white"
                  style={{ backgroundColor: player.playerColor }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm lg:text-lg font-semibold ring-1 sm:ring-2 ring-offset-1 ring-offset-card ${
                  player.color === "correct" 
                    ? "bg-success/20 ring-success" 
                    : "bg-warning/20 ring-warning"
                }`}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Status dot */}
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${
                  player.color === "correct" ? "bg-success" : "bg-warning"
                }`}
              />
              <div
                className={`absolute inset-0 w-3 h-3 rounded-full animate-ping ${
                  player.color === "correct" ? "bg-success" : "bg-warning"
                }`}
              />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground text-[10px] sm:text-xs lg:text-sm truncate block">
                {player.name}
              </span>
              {player.isYou && (
                <span className="text-[9px] sm:text-xs text-primary font-medium">You</span>
              )}
            </div>

            {/* Score */}
            <div className={`text-right`}>
              <span
                className={`font-extrabold text-sm sm:text-lg lg:text-xl ${
                  player.color === "correct" ? "text-success" : "text-warning"
                }`}
              >
                {player.score}
              </span>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide hidden lg:block">pts</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-1 sm:p-2 lg:p-4 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-sm">
          <span className="text-muted-foreground">Activity</span>
          <span className="font-semibold text-foreground">{messageCount} msg</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
