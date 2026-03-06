import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Trophy, Zap, Eye, SkipForward, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { GameConfig } from '@/types/game';

const options = ['France', 'Germany', 'Italy', 'Spain', 'Japan', 'Brazil', 'Australia', 'Canada', 'USA', 'Canada', 'Mexico', 'Russia'];

export default function Silhouette() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state as GameConfig | null;
  
  if (!config) {
    navigate('/lobby');
    return null;
  }

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [gameStats, setGameStats] = useState({correct: 0, incorrect: 0});
  const [startTime, setStartTime] = useState<number>();

  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { ws, gameState: wsGameState, startGame, sendAnswer } = useWebSocket({
    roomCode,
    username: config.username,
    gameMode: 'SILHOUETTE',
    roomType: config.roomType,
    rounds: config.rounds,
    timeout: config.timeout
  });

  const shuffleOptions = useCallback((correct: string) => {
    const others = options.filter(o => o !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...others, correct].sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    if (wsGameState?.question && gameState === 'playing') {
      setCurrentOptions(shuffleOptions(wsGameState.question.country_name));
      setStartTime(Date.now());
    }
  }, [wsGameState?.question, gameState, shuffleOptions]);

  const handleStart = () => {
    setGameState('playing');
    setGameStats({correct: 0, incorrect: 0});
    startGame();
  };

  const handleAnswer = (answer: string | null) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer && startTime) {
      sendAnswer(answer, Date.now() - startTime);
    }

    setTimeout(() => {
      if (wsGameState?.current_round === wsGameState?.total_rounds) {
        setGameState('result');
      } else {
        setSelectedAnswer(null);
        setShowResult(false);
        setHintLevel(0);
      }
    }, 2000);
  };

  const useHint = () => {
    if (hintLevel < 3) {
      setHintLevel(h => h + 1);
    }
  };

  const skipRound = () => {
    handleAnswer(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
            <div className="space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/25">
                <Eye className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Silhouette Mode
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Can you recognize countries by their shape alone? Test your geographic intuition!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 glass-panel">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-violet-400">{config.rounds}</p>
                <p className="text-xs text-muted-foreground">Rounds</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-2xl md:text-3xl font-bold text-cyan-400">30s</p>
                <p className="text-xs text-muted-foreground">Per Round</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-amber-400">3</p>
                <p className="text-xs text-muted-foreground">Hints</p>
              </div>
            </div>

            <Button 
              onClick={handleStart}
              size="lg"
              className="w-full md:w-auto px-12 py-6 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-xl shadow-violet-500/25"
            >
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'playing' && wsGameState?.question && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-3 md:p-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="font-bold text-lg">{gameStats.correct * 100}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Round {wsGameState?.current_round}/{wsGameState?.total_rounds}</span>
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className={cn(
                    "font-mono font-bold",
                    wsGameState?.time_remaining <= 10 ? "text-red-400" : "text-cyan-400"
                  )}>
                    {wsGameState?.time_remaining}s
                  </span>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/3] md:aspect-video glass-panel overflow-hidden flex items-center justify-center">
              <svg 
                viewBox="0 0 200 180" 
                className={cn(
                  "w-48 h-48 md:w-64 md:h-64 transition-all duration-500",
                  hintLevel === 0 && "drop-shadow-lg",
                  hintLevel >= 1 && "drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]",
                  hintLevel >= 2 && "drop-shadow-[0_0_20px_rgba(139,92,246,0.7)]",
                )}
              >
                <path 
                  d={wsGameState.question.silhouette || "M100,100 L150,100 L150,150 L100,150 Z"} 
                  fill={hintLevel >= 2 ? "#8b5cf6" : "#374151"}
                  stroke={hintLevel >= 1 ? "#a78bfa" : "#4b5563"}
                  strokeWidth={hintLevel >= 1 ? 3 : 2}
                  className="transition-all duration-500"
                />
              </svg>
              
              {hintLevel > 0 && (
                <div className="absolute top-4 right-4 flex gap-1">
                  {[1, 2, 3].map(level => (
                    <div 
                      key={level}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        hintLevel >= level ? "bg-violet-400" : "bg-slate-600"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={useHint}
                disabled={hintLevel >= 3}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Hint ({3 - hintLevel})
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

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {currentOptions.map((option, i) => (
                <Button
                  key={i}
                  onClick={() => !showResult && handleAnswer(option)}
                  disabled={showResult}
                  variant="outline"
                  className={cn(
                    "py-6 md:py-8 text-base md:text-lg font-medium transition-all",
                    showResult && option === wsGameState.question.country_name && "border-green-500 bg-green-500/20 text-green-400",
                    showResult && selectedAnswer === option && option !== wsGameState.question.country_name && "border-red-500 bg-red-500/20 text-red-400",
                    !showResult && "hover:border-violet-500/50 hover:bg-violet-500/10"
                  )}
                >
                  {option}
                </Button>
              ))}
            </div>

            <Progress value={(wsGameState?.current_round / wsGameState?.total_rounds) * 100} className="h-2" />
          </div>
        )}

        {gameState === 'result' && (
          <div className="text-center space-y-8 max-w-lg mx-auto">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/25">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Game Complete!</h2>
              <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                {gameStats.correct * 100}
              </p>
              <p className="text-muted-foreground">Total Score</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleStart}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                Play Again
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/lobby')}
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
