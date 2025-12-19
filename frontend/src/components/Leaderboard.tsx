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
}

interface LeaderboardProps {
  players: Player[];
  messageCount: number;
}

const Leaderboard = ({ players, messageCount }: LeaderboardProps) => {
  return (
    <div className="card-elevated h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center gap-3 border-b border-border/50">
        <div className="w-11 h-11 rounded-xl gradient-warning flex items-center justify-center shadow-glow-warning animate-float">
          <Trophy className="w-5 h-5 text-warning-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Leaderboard</h2>
          <p className="text-xs text-muted-foreground">Live rankings</p>
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`relative flex items-center gap-3 p-4 rounded-xl transition-all duration-300 animate-fade-in ${
              player.isYou
                ? "bg-secondary/80 border-2 border-primary/40 shadow-glow-primary"
                : "bg-muted/40 hover:bg-muted/70"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Rank badge */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              index === 0 
                ? "gradient-warning text-warning-foreground" 
                : "bg-muted text-muted-foreground"
            }`}>
              {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
            </div>

            {/* Avatar */}
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className={`w-10 h-10 rounded-full object-cover ring-2 ring-offset-2 ring-offset-card ${
                  player.color === "correct" ? "ring-success" : "ring-warning"
                }`}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold ring-2 ring-offset-2 ring-offset-card ${
                  player.color === "correct" 
                    ? "bg-success/20 ring-success" 
                    : "bg-warning/20 ring-warning"
                }`}
              >
                {player.avatar || player.name.charAt(0).toUpperCase()}
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
              <span className="font-semibold text-foreground text-sm truncate block">
                {player.name}
              </span>
              {player.isYou && (
                <span className="text-xs text-primary font-medium">You</span>
              )}
            </div>

            {/* Score */}
            <div className={`text-right`}>
              <span
                className={`font-extrabold text-xl ${
                  player.color === "correct" ? "text-success" : "text-warning"
                }`}
              >
                {player.score}
              </span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">pts</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Activity</span>
          <span className="font-semibold text-foreground">{messageCount} messages</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
