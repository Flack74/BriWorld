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
  bannerUrl?: string;
  playerColor?: string; // Map mode color
}

interface LeaderboardProps {
  players: Player[];
  messageCount: number;
  showPlayerColors?: boolean; // Show color dots in map mode
}

const Leaderboard = ({ players, messageCount, showPlayerColors = false }: LeaderboardProps) => {
  const renderAvatar = (player: Player) => {
    if (player.avatarUrl) {
      return (
        <img
          src={player.avatarUrl}
          alt={player.name}
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white/80 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
        />
      );
    }

    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-white/80 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
        style={{ backgroundColor: player.playerColor || "#64748b" }}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="card-elevated h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-2 sm:p-3 lg:p-5 flex items-center gap-1 sm:gap-2 lg:gap-3 border-b border-border/50">
        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl gradient-warning flex items-center justify-center shadow-glow-warning lg:animate-none animate-float">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-warning-foreground" />
        </div>
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground">Leaderboard</h2>
      </div>

      {/* Player list */}
      <div className="flex-1 p-1 sm:p-2 lg:p-4 space-y-1 sm:space-y-2 lg:space-y-3 overflow-y-auto">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`relative flex items-center gap-2 rounded-lg p-1.5 transition-all duration-300 animate-fade-in sm:gap-3 sm:p-2 lg:p-3 ${
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

            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10">
              <div
                className="flex items-center gap-2 px-2 py-2 sm:px-3"
                style={{
                  backgroundImage: player.bannerUrl
                    ? `linear-gradient(rgba(8,12,18,0.45), rgba(8,12,18,0.68)), url(${player.bannerUrl})`
                    : "linear-gradient(135deg, rgba(43,122,155,0.35), rgba(124,58,237,0.30), rgba(234,106,71,0.28))",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="relative shrink-0">
                  {renderAvatar(player)}
                  {showPlayerColors && player.playerColor && (
                    <div
                      className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card sm:h-4 sm:w-4"
                      style={{ backgroundColor: player.playerColor }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold text-white drop-shadow sm:text-xs lg:text-sm">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {player.isYou && (
                      <span className="text-[9px] font-medium text-cyan-200 sm:text-xs">You</span>
                    )}
                    <span className="flex items-center gap-1 text-[9px] text-white/75 sm:text-[11px]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          player.color === "correct" ? "bg-success" : "bg-warning"
                        }`}
                      />
                      active
                    </span>
                  </div>
                </div>
              </div>
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
