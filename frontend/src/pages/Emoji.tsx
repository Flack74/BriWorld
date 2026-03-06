import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trophy, Zap, Lightbulb, SkipForward, HelpCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EmojiClue {
  id: string;
  country: string;
  emojis: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
}

const emojiClues: EmojiClue[] = [
  { id: '1', country: 'Japan', emojis: ['🗾', '🍣', '🗻', '🎌'], difficulty: 'easy', hint: 'Land of the Rising Sun' },
  { id: '2', country: 'Brazil', emojis: ['⚽', '🎭', '☕', '🌴'], difficulty: 'easy', hint: 'Famous for Carnival' },
  { id: '3', country: 'Australia', emojis: ['🦘', '🏖️', '🐨', '🌏'], difficulty: 'easy', hint: 'Down Under' },
  { id: '4', country: 'France', emojis: ['🗼', '🥐', '🍷', '🎨'], difficulty: 'easy', hint: 'City of Love' },
  { id: '5', country: 'Egypt', emojis: ['🏛️', '🐪', '☀️', '🏜️'], difficulty: 'medium', hint: 'Ancient pyramids' },
  { id: '6', country: 'India', emojis: ['🕌', '🐘', '🍛', '🎭'], difficulty: 'medium', hint: 'Bollywood' },
  { id: '7', country: 'Canada', emojis: ['🍁', '🏒', '🦫', '❄️'], difficulty: 'easy', hint: 'Maple syrup' },
  { id: '8', country: 'Italy', emojis: ['🍕', '🏛️', '⛵', '🎭'], difficulty: 'easy', hint: 'Roman Empire' },
  { id: '9', country: 'Mexico', emojis: ['🌮', '🌵', '💀', '🎸'], difficulty: 'easy', hint: 'Day of the Dead' },
  { id: '10', country: 'Russia', emojis: ['🪆', '❄️', '🏰', '🐻'], difficulty: 'medium', hint: 'Largest country' },
];

export default function Emoji() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClue, setCurrentClue] = useState<EmojiClue>(emojiClues[0]);
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [revealedEmojis, setRevealedEmojis] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalRounds] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const getRandomClue = useCallback(() => {
    const filtered = emojiClues.filter(c => c.difficulty === difficulty || difficulty === 'easy');
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [difficulty]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0 && !showResult) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleSubmit();
    }
  }, [isPlaying, timeLeft, showResult]);

  // Progressive emoji reveal
  useEffect(() => {
    if (isPlaying && !showResult && revealedEmojis < currentClue.emojis.length) {
      const revealTimer = setTimeout(() => {
        setRevealedEmojis(r => Math.min(r + 1, currentClue.emojis.length));
      }, 5000);
      return () => clearTimeout(revealTimer);
    }
  }, [isPlaying, showResult, revealedEmojis, currentClue.emojis.length]);

  const startGame = () => {
    setGameState('playing');
    setIsPlaying(true);
    setCurrentRound(1);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setHintsUsed(0);
    setShowHint(false);
    setRevealedEmojis(1);
    setGuess('');
    setCurrentClue(getRandomClue());
  };

  const handleSubmit = () => {
    const correct = guess.toLowerCase().trim() === currentClue.country.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    setIsPlaying(false);

    if (correct) {
      const timeBonus = Math.floor(timeLeft * 10);
      const streakBonus = streak * 50;
      const hintPenalty = hintsUsed * 100;
      const difficultyBonus = difficulty === 'hard' ? 200 : difficulty === 'medium' ? 100 : 0;
      const roundScore = Math.max(100 + timeBonus + streakBonus + difficultyBonus - hintPenalty, 50);
      setScore(s => s + roundScore);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentRound < totalRounds) {
        nextRound();
      } else {
        setGameState('result');
      }
    }, 2500);
  };

  const nextRound = () => {
    setCurrentRound(r => r + 1);
    setTimeLeft(30);
    setHintsUsed(0);
    setShowHint(false);
    setRevealedEmojis(1);
    setGuess('');
    setShowResult(false);
    setIsPlaying(true);
    setCurrentClue(getRandomClue());
  };

  const useHint = () => {
    setShowHint(true);
    setHintsUsed(h => h + 1);
  };

  const skipRound = () => {
    setGuess('');
    handleSubmit();
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-950/20 via-slate-900 to-orange-950/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        {/* Floating emojis */}
        <div className="absolute top-20 left-10 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>🌍</div>
        <div className="absolute top-40 right-20 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '1s' }}>🗺️</div>
        <div className="absolute bottom-32 left-1/4 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '1.5s' }}>🌎</div>
        <div className="absolute bottom-20 right-1/3 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '2s' }}>🌏</div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-muted-foreground"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pb-8 min-h-[calc(100vh-80px)]">
        {gameState === 'menu' && (
          <div className="text-center space-y-8 max-w-lg mx-auto">
            {/* Logo/Title */}
            <div className="space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/25 text-5xl md:text-6xl">
                🧩
              </div>
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Emoji Geography
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Can you guess the country from emoji clues? Each emoji represents something iconic!
              </p>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select Difficulty</p>
              <div className="flex justify-center gap-3">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <Button
                    key={diff}
                    variant={difficulty === diff ? 'default' : 'outline'}
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      "capitalize",
                      difficulty === diff && (
                        diff === 'easy' ? 'bg-green-600 hover:bg-green-500' :
                        diff === 'medium' ? 'bg-amber-600 hover:bg-amber-500' :
                        'bg-red-600 hover:bg-red-500'
                      )
                    )}
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </div>

            {/* Example */}
            <div className="glass-panel p-6">
              <p className="text-sm text-muted-foreground mb-3">Example</p>
              <div className="text-4xl md:text-5xl mb-4 flex justify-center gap-2">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🗼</span>
                <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🥐</span>
                <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🍷</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🎨</span>
              </div>
              <p className="text-lg font-medium text-foreground">= France 🇫🇷</p>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-4 p-4 glass-panel">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-amber-400">10</p>
                <p className="text-xs text-muted-foreground">Rounds</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-2xl md:text-3xl font-bold text-orange-400">30s</p>
                <p className="text-xs text-muted-foreground">Per Round</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">4</p>
                <p className="text-xs text-muted-foreground">Emoji Clues</p>
              </div>
            </div>

            {/* Start Button */}
            <Button 
              onClick={startGame}
              size="lg"
              className="w-full md:w-auto px-12 py-6 text-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-xl shadow-amber-500/25"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Game Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-3 md:p-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="font-bold text-lg">{score}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="font-bold text-lg">{streak}x</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  getDifficultyColor(currentClue.difficulty)
                )}>
                  {currentClue.difficulty}
                </span>
                <span className="text-sm text-muted-foreground">Round {currentRound}/{totalRounds}</span>
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className={cn(
                    "font-mono font-bold",
                    timeLeft <= 10 ? "text-red-400" : "text-amber-400"
                  )}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* Emoji Display */}
            <div className="glass-panel p-8 md:p-12 text-center">
              <div className="flex justify-center gap-3 md:gap-4 mb-6">
                {currentClue.emojis.map((emoji, i) => (
                  <span 
                    key={i}
                    className={cn(
                      "text-5xl md:text-7xl transition-all duration-500",
                      i < revealedEmojis 
                        ? "opacity-100 scale-100" 
                        : "opacity-20 scale-75 blur-sm"
                    )}
                    style={{ 
                      animationDelay: `${i * 150}ms`,
                      animation: i < revealedEmojis ? 'bounce 1s ease-in-out' : undefined
                    }}
                  >
                    {i < revealedEmojis ? emoji : '❓'}
                  </span>
                ))}
              </div>

              {/* Hint Display */}
              {showHint && (
                <div className="mb-4 text-amber-400 flex items-center justify-center gap-2 animate-fade-in">
                  <Lightbulb className="w-4 h-4" />
                  <span>{currentClue.hint}</span>
                </div>
              )}

              {/* Progress dots for revealed emojis */}
              <div className="flex justify-center gap-1 mb-6">
                {currentClue.emojis.map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i < revealedEmojis ? "bg-amber-400" : "bg-slate-600"
                    )}
                  />
                ))}
              </div>

              {/* Answer Input */}
              {!showResult ? (
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Type country name..."
                    className="flex-1 text-center text-lg py-6"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                  />
                  <Button 
                    onClick={handleSubmit}
                    size="lg"
                    className="bg-gradient-to-r from-amber-600 to-orange-600"
                  >
                    Submit
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  "text-2xl md:text-3xl font-bold animate-bounce",
                  isCorrect ? "text-green-400" : "text-red-400"
                )}>
                  {isCorrect ? "Correct! 🎉" : `It was ${currentClue.country}`}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!showResult && (
              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={useHint}
                  disabled={showHint}
                  className="gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Hint {showHint ? '(Used)' : ''}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={skipRound}
                  className="gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </Button>
              </div>
            )}

            {/* Progress */}
            <Progress value={(currentRound / totalRounds) * 100} className="h-2" />
          </div>
        )}

        {gameState === 'result' && (
          <div className="text-center space-y-8 max-w-lg mx-auto">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/25 text-5xl">
                🏆
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Game Complete!</h2>
              <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {score}
              </p>
              <p className="text-muted-foreground">Total Score</p>
            </div>

            <div className="glass-panel p-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-400">{streak}</p>
                <p className="text-sm text-muted-foreground">Best Streak</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-400">{hintsUsed}</p>
                <p className="text-sm text-muted-foreground">Hints Used</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button 
                onClick={startGame}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600"
              >
                Play Again
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/')}
              >
                Back to Menu
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
