import { Button } from '@/components/ui/button';

interface GameOverModalProps {
  show: boolean;
  gameStats: { correct: number; incorrect: number };
  totalRounds: number;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const GameOverModal = ({
  show,
  gameStats,
  totalRounds,
  onPlayAgain,
  onBackToLobby,
}: GameOverModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white p-10 rounded-3xl shadow-2xl border-4 border-white/20 max-w-2xl w-full mx-4 animate-in zoom-in duration-700">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-bounce">🎮</div>
          <div className="text-4xl font-bold">Game Over!</div>
          <div className="text-xl opacity-90">Final Results</div>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 animate-in slide-in-from-left duration-500">
              <div className="text-5xl mb-2">✅</div>
              <div className="text-3xl font-bold">{gameStats.correct}</div>
              <div className="text-sm opacity-80 mt-1">Correct</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 animate-in slide-in-from-right duration-500">
              <div className="text-5xl mb-2">❌</div>
              <div className="text-3xl font-bold">{gameStats.incorrect}</div>
              <div className="text-sm opacity-80 mt-1">Missed</div>
            </div>
          </div>

          <div className="text-2xl font-bold animate-pulse mb-4">
            Score: {gameStats.correct} / {totalRounds}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={onPlayAgain}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl font-bold h-auto"
              size="lg"
            >
              Play Again 🔄
            </Button>
            <Button
              onClick={onBackToLobby}
              className="bg-white/20 text-white hover:bg-white/30 text-lg px-8 py-6 rounded-xl font-bold h-auto"
              size="lg"
            >
              Back to Lobby 🏠
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
