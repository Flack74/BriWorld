import { useState } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmojiModeProps {
  gameState: GameState;
  username: string;
  onSubmitAnswer: (answer: string) => void;
}

export function EmojiMode({ gameState, username, onSubmitAnswer }: EmojiModeProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  if (!gameState.question?.emoji) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-muted-foreground">Loading next emoji puzzle...</p>
      </div>
    );
  }

  // Split emoji string into individual emojis for better display
  const emojis = Array.from(gameState.question.emoji);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Emoji Display */}
      <Card className="glass-card p-6 sm:p-12 flex flex-col items-center justify-center space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">
            🌍 Decode this emoji sequence to find the country
          </h2>
          <div className="flex justify-center items-center gap-3 sm:gap-4 mb-4">
            {emojis.map((emoji, index) => (
              <div 
                key={index}
                className="text-6xl sm:text-8xl"
              >
                {emoji}
              </div>
            ))}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full inline-block">
            ⏰ Time remaining: {gameState.time_remaining}s
          </div>
        </div>
      </Card>

      {/* Answer Input */}
      <Card className="glass-card p-4 sm:p-6 space-y-4">
        <div className="space-y-3">
          <Input
            key={gameState.current_round}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type the country name..."
            className="text-base sm:text-lg h-12 sm:h-14 text-center font-medium"
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            disabled={!answer.trim()}
          >
            Submit Answer 🚀
          </Button>
        </div>
      </Card>

      {/* Hint */}
      <Card className="glass-card p-4 sm:p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-muted-foreground">
          <span className="text-lg">💡</span>
          <span>Think about what each emoji represents and how they relate to the country's culture, landmarks, or characteristics</span>
        </div>
      </Card>
    </div>
  );
}
