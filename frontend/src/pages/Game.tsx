import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { WorldMap } from "@/components/WorldMap";
import { ChatBox } from "@/components/ChatBox";
import { GameModeModal } from "@/components/GameModeModal";
import { ColorPickerModal } from "@/components/ColorPickerModal";
import { RoundsModal } from "@/components/RoundsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { GameConfig } from "@/types/game";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state as GameConfig | null;

  if (!config) {
    navigate('/lobby');
    return null;
  }

  const [showModeModal, setShowModeModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#10b981');
  const [mapMode, setMapMode] = useState<'TIMED' | 'FREE'>();
  const [guessInput, setGuessInput] = useState('');
  const [startTime, setStartTime] = useState<number>();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [showTimeoutBanner, setShowTimeoutBanner] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{correct: boolean, country: string} | null>(null);
  const [timeoutCountry, setTimeoutCountry] = useState<string>('');
  const [flagLoaded, setFlagLoaded] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({correct: 0, incorrect: 0});
  const [guessedCountries, setGuessedCountries] = useState<string[]>([]);

  const [roomCode] = useState(() => config.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase());
  
  const {
    ws,
    isConnected,
    gameState,
    roomUpdate,
    messages,
    sendAnswer,
    sendChatMessage,
    startGame,
    selectColor,
    setMapMode: setWSMapMode
  } = useWebSocket({
    roomCode,
    username: config.username,
    gameMode: config.gameMode,
    roomType: config.roomType,
    rounds: config.rounds
  });

  // Convert scores to players array
  const players = gameState?.scores ? Object.entries(gameState.scores).map(([name, score], index) => ({
    id: index.toString(),
    name,
    score,
    color: gameState?.player_colors?.[name] || selectedColor
  })) : roomUpdate?.players ? roomUpdate.players.map((name, index) => ({
    id: index.toString(),
    name,
    score: gameState?.scores?.[name] || 0,
    color: roomUpdate.player_colors?.[name] || selectedColor
  })) : [];

  // Handle game state updates
  useEffect(() => {
    if (gameState?.question) {
      setFlagLoaded(false);
    }
  }, [gameState?.question]);

  // Handle answer feedback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'game_restarted') {
          navigate('/waiting', { state: { ...config, roomCode } });
          return;
        }
        if (message.type === 'round_started') {
          setShowGameOver(false);
          if (config.roomType !== 'SINGLE') {
            setGameStats({correct: 0, incorrect: 0});
            setGuessedCountries([]);
          }
        }
        if (message.type === 'answer_submitted') {
          const answerData = message.payload;
          setLastAnswer({
            correct: answerData.is_correct,
            country: answerData.country_name
          });
          if (answerData.is_correct) {
            setGameStats(prev => ({...prev, correct: prev.correct + 1}));
            // Add country code to guessed list for map painting
            const countryCode = answerData.country_code || gameState?.question?.flag_code;
            if (countryCode) {
              setGuessedCountries(prev => [...prev, countryCode]);
            }
            setShowSuccessBanner(true);
            setTimeout(() => setShowSuccessBanner(false), 3000);
          } else {
            // Count as incorrect
            setGameStats(prev => ({...prev, incorrect: prev.incorrect + 1}));
            setShowErrorBanner(true);
            setTimeout(() => setShowErrorBanner(false), 3000);
          }
        } else if (message.type === 'round_started') {
          setStartTime(Date.now());
        } else if (message.type === 'round_ended') {
          const isLastRound = message.payload.is_last_round;
          
          // Track incorrect if no correct answer was given
          if (!lastAnswer || !lastAnswer.correct) {
            setGameStats(prev => ({...prev, incorrect: prev.incorrect + 1}));
            setTimeoutCountry(message.payload.correct_answer);
            setShowTimeoutBanner(true);
            
            // Keep timeout banner longer for last round
            const timeoutDuration = isLastRound ? 4000 : 4000;
            setTimeout(() => setShowTimeoutBanner(false), timeoutDuration);
          }
          setLastAnswer(null);
        } else if (message.type === 'game_completed') {
          setTimeout(() => setShowGameOver(true), 100);
        } else if (message.type === 'restart_game') {
          setShowGameOver(false);
          setGameStats({correct: 0, incorrect: 0});
          setGuessedCountries([]);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [ws, lastAnswer]);

  // Set start time when flag loads
  useEffect(() => {
    if (flagLoaded && gameState?.question) {
      setStartTime(Date.now());
    }
  }, [flagLoaded, gameState?.question]);



  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    selectColor(color);
    setShowColorModal(false);
    
    // Only owner selects mode for multiplayer rooms
    const isOwner = config.roomType === 'SINGLE' || 
                   roomUpdate?.owner === config.username || 
                   gameState?.owner === config.username;
    
    if (isOwner) {
      setShowModeModal(true);
    }
    // Non-owners wait for owner's mode selection
  };

  // Auto-start for FLAG mode or show color picker for WORLD_MAP
  useEffect(() => {
    if (isConnected && !gameState) {
      if (config.gameMode === 'FLAG') {
        startGame();
      } else if (config.gameMode === 'WORLD_MAP') {
        setShowColorModal(true);
      }
    }
  }, [isConnected, config.gameMode, gameState]);

  // Debug: Log gameState changes
  useEffect(() => {
    if (gameState) {
      console.log('Game.tsx - gameState updated:', {
        current_country: gameState.current_country,
        map_mode: gameState.map_play_mode,
        mapMode: mapMode
      });
    }
  }, [gameState, mapMode]);

  // Get map mode from room update for multiplayer
  useEffect(() => {
    if (roomUpdate?.map_mode && !mapMode) {
      setMapMode(roomUpdate.map_mode as 'TIMED' | 'FREE');
      // Non-owners start game when owner selects mode
      const isOwner = config.roomType === 'SINGLE' || 
                     roomUpdate?.owner === config.username || 
                     gameState?.owner === config.username;
      
      if (!isOwner) {
        setTimeout(() => startGame(), 500);
      }
    }
  }, [roomUpdate?.map_mode, mapMode, config.roomType, config.username, roomUpdate?.owner, gameState?.owner]);

  const handleModeSelect = (mode: 'TIMED' | 'FREE') => {
    setMapMode(mode);
    setWSMapMode(mode);
    setShowModeModal(false);
    
    if (mode === 'TIMED' && config.roomType === 'SINGLE') {
      setShowRoundsModal(true);
    } else {
      setTimeout(() => startGame(), 500);
    }
  };

  const handleRoundsSelect = (rounds: number) => {
    // Send rounds to server
    if (ws) {
      ws.send(JSON.stringify({
        type: 'set_rounds',
        payload: { rounds }
      }));
    }
    setShowRoundsModal(false);
    setTimeout(() => startGame(), 500);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guessInput.trim() && startTime) {
      const responseTime = Date.now() - startTime;
      sendAnswer(guessInput.trim(), responseTime);
      setGuessInput('');
    }
  };

  // Flag Quiz View
  if (config.gameMode === 'FLAG') {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden relative">
        {/* Countdown Timer - Fixed Top Right */}
        {gameState?.time_remaining !== undefined && (
          <div className={`fixed top-2 right-2 z-50 flex items-center gap-1 px-3 py-2 rounded-full font-display text-lg font-bold transition-all duration-300 whitespace-nowrap ${
            gameState.time_remaining <= 5 
              ? "bg-destructive text-destructive-foreground animate-pulse" 
              : gameState.time_remaining <= 10 
                ? "bg-game-timer text-white" 
                : "gradient-ocean text-white glow-primary"
          }`}>
            <span>⏱️</span>
            <span>{gameState.time_remaining}</span>
          </div>
        )}

        <div className="p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => navigate("/lobby")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <GameHeader
              roomId={roomCode}
              mode="flag"
              playerType={config.roomType}
              round={{ current: gameState?.current_round || 1, total: gameState?.total_rounds || config.rounds }}
              timeLeft={undefined}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 overflow-auto">
          {/* Main Game Area */}
          <div className="flex-1 game-panel flex flex-col items-center justify-center gap-4 lg:gap-8">
            {/* Flag Display Area */}
            <div className="w-48 h-32 sm:w-64 sm:h-40 bg-muted/30 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
              {showTimeoutBanner ? (
                <span className="text-6xl">🏳️</span>
              ) : gameState?.question?.flag_code ? (
                <img 
                  src={`https://flagcdn.com/w320/${gameState.question.flag_code.toLowerCase()}.png`}
                  alt={`Flag of ${gameState.question.country_name}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Flag failed to load:', gameState.question?.flag_code);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => setFlagLoaded(true)}
                />
              ) : (
                <span className="text-6xl">🏳️</span>
              )}
            </div>

            {/* Success Banner */}
            {showSuccessBanner && (
              <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-green-300">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-xl">🎉</span>
                    <div className="text-center">
                      <div className="text-base font-bold">Correct!</div>
                      <div className="text-sm truncate">{lastAnswer?.country}</div>
                    </div>
                    <span className="text-xl">✅</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {showErrorBanner && (
              <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
                <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-red-300">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-xl">❌</span>
                    <div className="text-center">
                      <div className="text-base font-bold">Wrong!</div>
                      <div className="text-sm truncate">It was {lastAnswer?.country}</div>
                    </div>
                    <span className="text-xl">😢</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeout Banner */}
            {showTimeoutBanner && (
              <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-orange-300">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-xl">⏰</span>
                    <div className="text-center">
                      <div className="text-base font-bold">Time's Up!</div>
                      <div className="text-sm truncate">{timeoutCountry}</div>
                    </div>
                    <span className="text-xl">⌛</span>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Feedback */}
            {gameState?.question && (
              <div className="text-center">
                <div className="text-lg font-semibold text-muted-foreground mb-2">
                  What country is this?
                </div>
              </div>
            )}

            {/* Guess Input */}
            <form onSubmit={handleGuessSubmit} className="w-full max-w-md flex gap-2 sm:gap-3 px-2 sm:px-0">
              <Input
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type country name..."
                className="h-12 sm:h-14 rounded-xl bg-card/50 border-border text-base sm:text-lg"
              />
              <Button type="submit" variant="game" size="lg">
                Submit
              </Button>
            </form>
          </div>

          {/* Leaderboard */}
          <div className="w-full lg:w-auto">
            <Leaderboard
              players={players}
              currentPlayerId={config.username}
            />
          </div>
        </div>

        {/* Chat */}
        {!showGameOver && (
          <div className="p-2 sm:p-4">
            <ChatBox messages={messages} onSendMessage={sendChatMessage} />
          </div>
        )}

        {/* Game Over Banner */}
        {showGameOver && (
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
                    <div className="text-sm opacity-80 mt-1">Incorrect</div>
                  </div>
                </div>

                <div className="text-2xl font-bold animate-pulse mb-4">
                  Score: {gameStats.correct} / {config.rounds}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button 
                  onClick={() => {
                    if (ws) {
                      ws.send(JSON.stringify({ type: 'restart_game' }));
                    }
                  }}
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl font-bold h-auto"
                  size="lg"
                >
                  Play Again 🔄
                </Button>
                  <Button 
                    onClick={() => navigate('/lobby')} 
                    className="bg-white/20 text-white hover:bg-white/30 text-lg px-8 py-6 rounded-xl font-bold h-auto"
                    size="lg"
                  >
                    Back to Lobby 🏠
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Picker Modal */}
        <ColorPickerModal
          open={showColorModal}
          onClose={() => setShowColorModal(false)}
          onSelectColor={handleColorSelect}
          selectedColor={selectedColor}
          takenColors={roomUpdate?.players?.map(p => p.color).filter(Boolean) || []}
        />
      </div>
    );
  }

  // World Map View
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Countdown Timer - Fixed Top Right */}
      {mapMode === 'TIMED' && gameState?.time_remaining !== undefined && (
        <div className={`fixed top-2 right-2 z-50 flex items-center gap-1 px-3 py-2 rounded-full font-display text-lg font-bold transition-all duration-300 whitespace-nowrap ${
          gameState.time_remaining <= 5 
            ? "bg-destructive text-destructive-foreground animate-pulse" 
            : gameState.time_remaining <= 10 
              ? "bg-game-timer text-white" 
              : "gradient-ocean text-white glow-primary"
        }`}>
          <span>⏱️</span>
          <span>{gameState.time_remaining}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-2 sm:p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => navigate("/lobby")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <GameHeader
            roomId={roomCode}
            mode="map"
            playerType={config.roomType}
            round={mapMode === 'TIMED' ? { current: gameState?.current_round || 1, total: gameState?.total_rounds || config.rounds } : undefined}
            timeLeft={undefined}
            isFreeMode={mapMode === 'FREE'}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 pt-0 overflow-auto">
        <WorldMap
          countriesFound={mapMode === 'TIMED' ? undefined : gameStats.correct}
          recentGuesses={[]}
          foundCountryCodes={guessedCountries}
          currentCountry={mapMode === 'TIMED' ? gameState?.current_country : undefined}
          userColor={gameState?.player_colors?.[config.username] || selectedColor}
          paintedCountries={gameState?.painted_countries || {}}
          playerColors={gameState?.player_colors || {}}
          onSubmitGuess={(guess) => {
            const responseTime = startTime ? Date.now() - startTime : 0;
            sendAnswer(guess, responseTime);
            setStartTime(Date.now());
          }}
        />
        <div className="w-full lg:w-auto">
          <Leaderboard
            players={players}
            currentPlayerId={config.username}
          />
        </div>
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-green-300">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xl">🎉</span>
              <div className="text-center">
                <div className="text-base font-bold">Correct!</div>
                <div className="text-sm truncate">{lastAnswer?.country}</div>
              </div>
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {showErrorBanner && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-red-300">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xl">❌</span>
              <div className="text-center">
                <div className="text-base font-bold">Wrong!</div>
                <div className="text-sm truncate">It was {lastAnswer?.country}</div>
              </div>
              <span className="text-xl">😢</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeout Banner */}
      {showTimeoutBanner && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-orange-300">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xl">⏰</span>
              <div className="text-center">
                <div className="text-base font-bold">Time's Up!</div>
                <div className="text-sm truncate">{timeoutCountry}</div>
              </div>
              <span className="text-xl">⌛</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {!showGameOver && (
        <div className="p-2 sm:p-4 pt-0">
          <ChatBox messages={messages} onSendMessage={sendChatMessage} />
        </div>
      )}

      {/* Game Over Banner */}
      {showGameOver && (
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
                  <div className="text-sm opacity-80 mt-1">Incorrect</div>
                </div>
              </div>

              <div className="text-2xl font-bold animate-pulse mb-4">
                Score: {gameStats.correct} / {gameState?.total_rounds || config.rounds}
              </div>

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => {
                    if (ws) {
                      ws.send(JSON.stringify({ type: 'restart_game' }));
                    }
                  }}
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl font-bold h-auto"
                  size="lg"
                >
                  Play Again 🔄
                </Button>
                <Button 
                  onClick={() => navigate('/lobby')} 
                  className="bg-white/20 text-white hover:bg-white/30 text-lg px-8 py-6 rounded-xl font-bold h-auto"
                  size="lg"
                >
                  Back to Lobby 🏠
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ColorPickerModal
        open={showColorModal}
        onClose={() => setShowColorModal(false)}
        onSelectColor={handleColorSelect}
        selectedColor={selectedColor}
        takenColors={roomUpdate?.players?.map(p => p.color).filter(Boolean) || []}
      />
      <GameModeModal
        open={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={handleModeSelect}
      />
      <RoundsModal
        open={showRoundsModal}
        onClose={() => setShowRoundsModal(false)}
        onSelectRounds={handleRoundsSelect}
      />
    </div>
  );
};

export default Game;
