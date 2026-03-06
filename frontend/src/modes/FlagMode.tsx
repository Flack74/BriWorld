import { useState } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FlagModeProps {
  gameState: GameState;
  username: string;
  onSubmitAnswer: (answer: string) => void;
  roomCode: string;
  roomType: string;
}

export function FlagMode({ gameState, username, onSubmitAnswer }: FlagModeProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  // Check if player already answered correctly this round
  const hasAnsweredCorrectly = gameState.answered?.[username] || false;

  if (!gameState.question) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-muted-foreground">Loading next flag...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 px-2">
      <div className="w-full h-52 sm:h-60">
        <div className="relative bg-card/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 overflow-hidden h-full flex flex-col">
          {/* Flag Image */}
          {gameState.question.flag_code && (
            <div className="flex-1 p-3 sm:p-4 flex items-center justify-center min-h-0">
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={`https://flagcdn.com/w640/${gameState.question.flag_code.toLowerCase()}.png`}
                  alt="Flag"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-2 border-white/10"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-flag.png';
                  }}
                />
              </div>
            </div>
          )}

          {/* Prompt */}
          <div className="px-4 sm:px-6 pb-3 flex-shrink-0">
            <h2 className="text-center text-base sm:text-lg font-bold text-foreground">
              Identify this flag!
            </h2>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-2">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !hasAnsweredCorrectly && handleSubmit()}
          placeholder="Type country name..."
          className="flex-1 rounded-full px-4 text-base shadow-inner border-2 focus:border-blue-500 transition-colors h-12"
          autoFocus
          disabled={hasAnsweredCorrectly}
        />
        <Button
          onClick={handleSubmit}
          disabled={hasAnsweredCorrectly || !answer.trim()}
          className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold shadow-lg text-base h-12 sm:min-w-[120px]"
        >
          {hasAnsweredCorrectly ? '✓ Correct' : '🚀 Submit Answer'}
        </Button>
      </div>
    </div>
  );
}
