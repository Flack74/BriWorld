import { Trophy, Medal, Crown } from "lucide-react";

interface Player {
  id: string;
  name: string;
  score: number;
  color?: string;
  avatarUrl?: string;
}

interface LeaderboardProps {
  players: Player[];
  currentPlayerId?: string;
  showColors?: boolean;
}

export const Leaderboard = ({ players, currentPlayerId, showColors = true }: LeaderboardProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  return (
    <aside className="game-panel w-full lg:w-80 h-fit">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-sunset flex items-center justify-center shadow-md">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Leaderboard</h2>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No players yet</p>
            <p className="text-xs mt-1">Start playing to see scores!</p>
          </div>
        ) : (
          sortedPlayers.map((player, index) => (
            <div
              key={`${player.id}-${player.score}`}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                player.id === currentPlayerId
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-muted/30 hover:bg-muted/50"
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                {getRankIcon(index)}
              </div>

              {/* Player avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted border-2 border-border">
                {player.avatarUrl ? (
                  <img 
                    src={player.avatarUrl} 
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Player color indicator */}
              {showColors && player.color && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: player.color }}
                />
              )}

              {/* Player name */}
              <span className={`flex-1 font-medium truncate ${
                player.id === currentPlayerId ? "text-primary" : "text-foreground"
              }`}>
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="text-xs text-muted-foreground ml-1">(you)</span>
                )}
              </span>

              {/* Score */}
              <span className={`font-display font-bold text-lg ${
                index === 0 ? "text-yellow-600" : "text-foreground"
              }`}>
                {player.score}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
