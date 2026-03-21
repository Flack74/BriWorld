import { useState } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SilhouetteModeProps {
  gameState: GameState;
  username: string;
  onSubmitAnswer: (answer: string) => void;
}

export function SilhouetteMode({ gameState, username, onSubmitAnswer }: SilhouetteModeProps) {
  const [answer, setAnswer] = useState('');

  const renderSilhouette = () => {
    const raw = gameState.question?.silhouette;
    if (!raw) {
      return null;
    }

    const matches = Array.from(
      raw.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g),
    );

    if (matches.length === 0) {
      return null;
    }

    const coords = matches.map((match) => ({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    }));

    const minX = Math.min(...coords.map((coord) => coord.x));
    const maxX = Math.max(...coords.map((coord) => coord.x));
    const minY = Math.min(...coords.map((coord) => coord.y));
    const maxY = Math.max(...coords.map((coord) => coord.y));
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const padding = 12;
    const scale = Math.min((200 - padding * 2) / width, (180 - padding * 2) / height);
    const offsetX = (200 - width * scale) / 2;
    const offsetY = (180 - height * scale) / 2;

    const converted = raw.replace(
      /(-?\d+\.?\d*),(-?\d+\.?\d*)/g,
      (_match, xStr: string, yStr: string) => {
        const x = (parseFloat(xStr) - minX) * scale + offsetX;
        const y = (maxY - parseFloat(yStr)) * scale + offsetY;

        return `${x.toFixed(2)},${y.toFixed(2)}`;
      },
    );

    return (
      <path
        d={converted}
        fill="currentColor"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    );
  };

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  if (!gameState.question) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-muted-foreground">Loading next question...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 px-2">
      {/* Silhouette Display */}
      <Card className="glass-card p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-3 sm:space-y-4 w-full">
          {gameState.question.silhouette ? (
            <div className="flex items-center justify-center w-full h-52 sm:h-64">
              <svg viewBox="0 0 200 180" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {renderSilhouette()}
              </svg>
            </div>
          ) : (
            <div className="space-y-2 py-8">
              <div className="text-5xl sm:text-6xl">🗾</div>
              <p className="text-xs text-yellow-500">⚠️ Silhouette unavailable</p>
            </div>
          )}
          <p className="text-muted-foreground text-sm sm:text-base">Guess the country by its silhouette</p>
          
          <div className="text-xs text-muted-foreground">
            ⏱️ {gameState.time_remaining}s remaining
          </div>
        </div>
      </Card>

      {/* Answer Input */}
      <Card className="glass-card p-4 sm:p-6 space-y-3">
        <Input
          key={gameState.current_round}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type the country name..."
          className="text-base sm:text-lg h-10 sm:h-12"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold"
          disabled={!answer.trim()}
        >
          Submit Answer
        </Button>
      </Card>
    </div>
  );
}
