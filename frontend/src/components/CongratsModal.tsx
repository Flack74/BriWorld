import { Button } from '@/components/ui/button';

interface CongratsModalProps {
  show: boolean;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const CongratsModal = ({ show, onPlayAgain, onBackToLobby }: CongratsModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white p-10 rounded-3xl shadow-2xl border-4 border-white/20 max-w-2xl w-full mx-4 animate-in zoom-in duration-700">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="text-4xl font-bold">Congratulations!</div>
          <div className="text-xl opacity-90">You found all 197 countries!</div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 my-6">
            <div className="text-6xl mb-4">🌍</div>
            <div className="text-3xl font-bold">Perfect Score!</div>
            <div className="text-lg opacity-80 mt-2">Geography Master</div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={onPlayAgain}
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl font-bold h-auto"
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
