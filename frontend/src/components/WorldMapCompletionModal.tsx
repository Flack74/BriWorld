import { Button } from "@/components/ui/button";
import { LeaderboardPlayer } from "@/types/game";

interface WorldMapCompletionModalProps {
  show: boolean;
  players: LeaderboardPlayer[];
  username: string;
  roomType: "SINGLE" | "PRIVATE" | "PUBLIC";
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

const floatingEmojis = [
  { emoji: "🌍", className: "left-8 top-8 animate-bounce" },
  { emoji: "✨", className: "right-10 top-12 animate-pulse" },
  { emoji: "🏆", className: "left-12 bottom-16 animate-bounce" },
  { emoji: "🎉", className: "right-12 bottom-20 animate-pulse" },
  { emoji: "🗺️", className: "left-1/2 top-6 -translate-x-1/2 animate-bounce" },
];

function getOrdinal(rank: number) {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${rank}th`;
  }

  switch (rank % 10) {
  case 1:
    return `${rank}st`;
  case 2:
    return `${rank}nd`;
  case 3:
    return `${rank}rd`;
  default:
    return `${rank}th`;
  }
}

export function WorldMapCompletionModal({
  show,
  players,
  username,
  roomType,
  onPlayAgain,
  onBackToLobby,
}: WorldMapCompletionModalProps) {
  if (!show) {
    return null;
  }

  const rank = Math.max(
    1,
    players.findIndex((player) => player.name === username) + 1,
  );
  const isSingle = roomType === "SINGLE";
  const isWinner = isSingle || rank === 1;
  const podium = players.slice(0, 5);

  const title = isWinner ? "You Conquered The World" : `You Finished ${getOrdinal(rank)}`;
  const subtitle = isWinner
    ? "Every last country is yours. The map is complete."
    : `Good job. Better luck next time, you're ${getOrdinal(rank)}.`;
  const accentClasses = isWinner
    ? "from-orange-500 via-amber-400 to-yellow-300"
    : "from-cyan-500 via-blue-500 to-indigo-500";
  const badgeText = isWinner ? "World Claimed" : `${getOrdinal(rank)} Place`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top,#1f3f64_0%,#102033_42%,#08111b_100%)] text-white shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClasses}`} />
        {floatingEmojis.map(({ emoji, className }) => (
          <span
            key={`${emoji}-${className}`}
            className={`pointer-events-none absolute text-2xl opacity-80 sm:text-3xl ${className}`}
          >
            {emoji}
          </span>
        ))}

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/85">
              {badgeText}
            </div>

            <div className="space-y-3">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95]">
                {title}
              </div>
              <p className="max-w-2xl text-sm text-white/75 sm:text-base lg:text-lg">
                {subtitle}
              </p>
            </div>

            <div className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${accentClasses} p-[1px] shadow-[0_24px_80px_rgba(0,0,0,0.35)]`}>
              <div className="rounded-[1.7rem] bg-slate-950/80 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                      Final Map Status
                    </p>
                    <p className="mt-2 text-2xl font-black sm:text-3xl">
                      197 / 197 Countries
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                      Your Rank
                    </p>
                    <p className="mt-1 text-3xl font-black">
                      {isWinner ? "1st" : getOrdinal(rank)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full w-full rounded-full bg-gradient-to-r ${accentClasses}`} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onPlayAgain}
                className="h-auto rounded-2xl bg-white px-6 py-4 text-base font-bold text-slate-900 hover:bg-white/90"
                size="lg"
              >
                Play Again
              </Button>
              <Button
                onClick={onBackToLobby}
                variant="outline"
                className="h-auto rounded-2xl border-white/20 bg-white/10 px-6 py-4 text-base font-bold text-white hover:bg-white/15"
                size="lg"
              >
                Back To Lobby
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                  Final Ranking
                </p>
                <h3 className="mt-2 text-2xl font-black">World Map Standings</h3>
              </div>
              <span className="text-3xl">🏁</span>
            </div>

            <div className="space-y-3">
              {podium.map((player, index) => {
                const place = index + 1;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                      player.isYou
                        ? "border-white/25 bg-white/15 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
                        : "border-white/10 bg-black/10"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black ${
                      place === 1
                        ? "bg-amber-300 text-slate-900"
                        : place === 2
                          ? "bg-slate-300 text-slate-900"
                          : place === 3
                            ? "bg-orange-400 text-slate-900"
                            : "bg-white/10 text-white"
                    }`}>
                      {place}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold sm:text-base">
                        {player.name}
                        {player.isYou ? " • You" : ""}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                        {getOrdinal(place)} place
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black sm:text-2xl">{player.score}</p>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">
                        Countries
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
