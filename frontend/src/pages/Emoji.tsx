import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Zap,
  Lightbulb,
  SkipForward,
  HelpCircle,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { GameConfig } from "@/types/game";

export default function Emoji() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state as GameConfig | null;

  const [guess, setGuess] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [startTime, setStartTime] = useState<number>();

  const {
    gameState: wsGameState,
    startGame,
    sendAnswer,
  } = useWebSocket({
    roomCode: config.roomCode || "",
    username: config.username,
    gameMode: "EMOJI",
    roomType: config.roomType,
    rounds: config.rounds,
    timeout: config.timeout,
  });

  useEffect(() => {
    if (wsGameState?.question && wsGameState.status === "in_progress") {
      setStartTime(Date.now());
      setGuess("");
    }
  }, [wsGameState?.question, wsGameState?.current_round, wsGameState?.status]);

  const handleStart = () => {
    startGame();
  };

  const handleSubmit = () => {
    if (!guess.trim() || !startTime) return;
    sendAnswer(guess, Date.now() - startTime);
    setGuess("");
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "text-green-400 bg-green-400/20";
      case "medium":
        return "text-amber-400 bg-amber-400/20";
      case "hard":
        return "text-red-400 bg-red-400/20";
      default:
        return "";
    }
  };

  if (!config) {
    navigate("/lobby");
    return null;
  }

  const emojis = wsGameState?.question?.emoji
    ? Array.from(wsGameState.question.emoji)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-950/20 via-slate-900 to-orange-950/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-20 left-10 text-4xl opacity-20 animate-bounce"
          style={{ animationDelay: "0.5s" }}
        >
          🌍
        </div>
        <div
          className="absolute top-40 right-20 text-3xl opacity-20 animate-bounce"
          style={{ animationDelay: "1s" }}
        >
          🗺️
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-4xl opacity-20 animate-bounce"
          style={{ animationDelay: "1.5s" }}
        >
          🌎
        </div>
        <div
          className="absolute bottom-20 right-1/3 text-3xl opacity-20 animate-bounce"
          style={{ animationDelay: "2s" }}
        >
          🌏
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
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
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pb-8 min-h-[calc(100vh-80px)]">
        {(!wsGameState || wsGameState.status === "waiting") && (
          <div className="text-center space-y-8 max-w-lg mx-auto">
            <div className="space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/25 text-5xl md:text-6xl">
                🧩
              </div>
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Emoji Geography
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Can you guess the country from emoji clues? Each emoji
                represents something iconic!
              </p>
            </div>

            <div className="glass-panel p-6">
              <p className="text-sm text-muted-foreground mb-3">Example</p>
              <div className="text-2xl mb-4 flex justify-center gap-2">
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0ms" }}
                >
                  🗼
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "100ms" }}
                >
                  🥐
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "200ms" }}
                >
                  🍷
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "300ms" }}
                >
                  🎨
                </span>
              </div>
              <p className="text-lg font-medium text-foreground mb-4">
                = France 🇫🇷
              </p>
              <div className="text-xs text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
                <p>🍜 Food</p>
                <p>🎭 Culture / Tradition</p>
                <p>🗼 Famous Landmark / Monument</p>
                <p>🐅 Nature / National Animal</p>
                <p>🏝️ Tourist Attraction / Landscape</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 glass-panel">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-amber-400">
                  {config.rounds}
                </p>
                <p className="text-xs text-muted-foreground">Rounds</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-2xl md:text-3xl font-bold text-orange-400">
                  30s
                </p>
                <p className="text-xs text-muted-foreground">Per Round</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">
                  4
                </p>
                <p className="text-xs text-muted-foreground">Emoji Clues</p>
              </div>
            </div>

            <Button
              onClick={handleStart}
              size="lg"
              className="w-full md:w-auto px-12 py-6 text-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-xl shadow-amber-500/25"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          </div>
        )}

        {wsGameState?.status === "in_progress" && wsGameState?.question && (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-3 md:p-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="font-bold text-lg">
                      {wsGameState.scores[config.username] || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Round {wsGameState.current_round}/{wsGameState.total_rounds}
                </span>
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span
                    className={cn(
                      "font-mono font-bold",
                      wsGameState.time_remaining <= 10
                        ? "text-red-400"
                        : "text-amber-400",
                    )}
                  >
                    {wsGameState.time_remaining}s
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-4 sm:p-6 md:p-12 text-center overflow-hidden">
              <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-1.5 md:gap-2 mb-5 sm:mb-6 max-w-full mx-auto">
                {emojis.map((emoji, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center justify-center min-w-[1.75rem] sm:min-w-[2.1rem] md:min-w-[2.6rem] text-[1.25rem] leading-none sm:text-[1.6rem] md:text-[2.1rem] transition-all duration-500 opacity-100 scale-100"
                    style={{
                      animationDelay: `${i * 150}ms`,
                      animation: "bounce 1s ease-in-out",
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  key={wsGameState.current_round}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Type country name..."
                  className="flex-1 text-center text-base sm:text-lg py-5 sm:py-6"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoFocus
                />
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-orange-600"
                  disabled={!guess.trim()}
                >
                  Submit
                </Button>
              </div>
            </div>

            <Progress
              value={
                (wsGameState.current_round / wsGameState.total_rounds) * 100
              }
              className="h-2"
            />
          </div>
        )}

        {wsGameState?.status === "completed" && (
          <div className="text-center space-y-8 max-w-lg mx-auto">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/25 text-5xl">
                🏆
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Game Complete!</h2>
              <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {wsGameState.scores[config.username] || 0}
              </p>
              <p className="text-muted-foreground">Total Score</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleStart}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600"
              >
                Play Again
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/lobby")}
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
