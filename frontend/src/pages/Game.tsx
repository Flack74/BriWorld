import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WorldMap } from "@/components/WorldMap";
import RoomHeader from "@/components/RoomHeader";
import GameHeader from "@/components/GameHeader";
import LiveClock from "@/components/LiveClock";
import Leaderboard from "@/components/Leaderboard";
import GameChat from "@/components/GameChat";
import CountryInput from "@/components/CountryInput";
import { ColorPickerModal } from "@/components/ColorPickerModal";
import { CollisionDialog } from "@/components/CollisionDialog";
import { ReconnectionDialog } from "@/components/ReconnectionDialog";
import { LeaveRoomDialog } from "@/components/LeaveRoomDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import AudioManager from "@/lib/audioManager";
import { GameConfig } from "@/types/game";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state as GameConfig | null;

  // Try to restore session if config is missing (page refresh)
  if (!config) {
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    const savedUsername = localStorage.getItem('username');
    const savedGameMode = sessionStorage.getItem('gameMode');
    const savedRoomType = sessionStorage.getItem('roomType');
    
    if (savedRoomCode && savedUsername && savedGameMode && savedRoomType) {
      // Restore config from session
      const restoredConfig: GameConfig = {
        username: savedUsername,
        gameMode: savedGameMode as 'FLAG' | 'WORLD_MAP',
        roomType: savedRoomType as 'SINGLE' | 'PRIVATE' | 'PUBLIC',
        roomCode: savedRoomCode,
        rounds: parseInt(sessionStorage.getItem('rounds') || '10')
      };
      // Redirect to game with restored config
      navigate('/game', { state: restoredConfig, replace: true });
      return null;
    }
    
    sessionStorage.removeItem('currentRoomCode');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('roomType');
    sessionStorage.removeItem('rounds');
    sessionStorage.removeItem('mapMode');
    navigate('/lobby');
    return null;
  }

  // Save session data
  sessionStorage.setItem('gameMode', config.gameMode);
  sessionStorage.setItem('roomType', config.roomType);
  sessionStorage.setItem('rounds', config.rounds?.toString() || '10');

  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#10b981');
  const [mapMode] = useState<'FREE'>('FREE'); // Always FREE mode
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
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [wasReconnected, setWasReconnected] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [playerAvatars, setPlayerAvatars] = useState<Record<string, string>>({});
  const [isActualReconnect] = useState(() => {
    // Check if this is a page refresh (room code existed before component mount)
    return !config.roomCode && !!sessionStorage.getItem('currentRoomCode');
  });
  const [countdownPlayed, setCountdownPlayed] = useState(false);
  const [hasGuessedThisRound, setHasGuessedThisRound] = useState(false);

  const [roomCode] = useState(() => {
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    const newCode = config.roomCode || savedRoomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    sessionStorage.setItem('currentRoomCode', newCode);
    return newCode;
  });
  
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
    rounds: config.rounds,
    timeout: config.timeout
  });

  // Initialize background music on user interaction
  useEffect(() => {
    const initAudio = () => {
      const muted = localStorage.getItem('audioMuted') === 'true';
      if (!muted) {
        const bgTrack = localStorage.getItem('bgMusicTrack') || '/Music/briworld-background-1.mp3';
        AudioManager.getInstance().setBackgroundMusic(bgTrack);
      }
      // Remove listener after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    
    // Wait for user interaction to start audio
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      // Don't stop music on unmount - let it continue playing
    };
  }, []);

  // Update player avatars when roomUpdate changes
  useEffect(() => {
    if (roomUpdate?.player_avatars) {
      setPlayerAvatars(prev => ({ ...prev, ...roomUpdate.player_avatars }));
    }
  }, [roomUpdate?.player_avatars]);

  // Convert scores to players array for room-view-explorer Leaderboard
  const players = gameState?.scores ? Object.entries(gameState.scores).map(([name, score]) => ({
    id: name,
    name,
    score,
    isYou: name === config.username,
    isLeader: false,
    color: (name === config.username ? 'correct' : 'opponent') as 'correct' | 'opponent',
    avatar: name.charAt(0).toUpperCase(),
    avatarUrl: playerAvatars[name]
  })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, isLeader: i === 0 })) : roomUpdate?.players ? roomUpdate.players.map((name) => ({
    id: name,
    name,
    score: gameState?.scores?.[name] || 0,
    isYou: name === config.username,
    isLeader: false,
    color: (name === config.username ? 'correct' : 'opponent') as 'correct' | 'opponent',
    avatar: name.charAt(0).toUpperCase(),
    avatarUrl: playerAvatars[name]
  })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, isLeader: i === 0 })) : [];

  const [notifiedMessages, setNotifiedMessages] = useState<Set<string>>(new Set());

  // Track notified messages to prevent duplicate notifications
  
  // Check for new @mentions and play notification
  useEffect(() => {
    messages.forEach(msg => {
      if (!notifiedMessages.has(msg.id) && 
          msg.content.includes(`@${config.username}`) && 
          msg.sender !== config.username) {
        AudioManager.getInstance().playNotification();
        setNotifiedMessages(prev => new Set(prev).add(msg.id));
      }
    });
  }, [messages, config.username, notifiedMessages]);

  // Convert messages for GameChat with player colors and avatars
  const chatMessages = messages.map(msg => ({
    id: msg.id,
    sender: msg.sender,
    text: msg.content,
    color: (msg.sender === config.username ? 'correct' : 'opponent') as 'correct' | 'opponent',
    timestamp: msg.timestamp,
    playerColor: gameState?.player_colors?.[msg.sender] || roomUpdate?.player_colors?.[msg.sender],
    avatarUrl: playerAvatars[msg.sender],
    reactions: msg.reactions
  }));

  // Detect reconnection (only if actual page refresh AND game was in progress)
  useEffect(() => {
    if (gameState && !wasReconnected && isActualReconnect && gameState.status === 'in_progress') {
      setIsReconnecting(true);
      setTimeout(() => {
        setIsReconnecting(false);
        setWasReconnected(true);
      }, 500);
    }
  }, [gameState, wasReconnected, isActualReconnect]);

  // Handle game state updates
  useEffect(() => {
    if (gameState?.question) {
      setFlagLoaded(false);
    }
  }, [gameState?.question]);

  // Handle room closed or expired
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'room_closed' || message.type === 'room_expired') {
          if (ws) ws.close();
          sessionStorage.removeItem('currentRoomCode');
          sessionStorage.removeItem('gameMode');
          sessionStorage.removeItem('roomType');
          sessionStorage.removeItem('rounds');
          sessionStorage.removeItem('mapMode');
          navigate('/lobby');
        }
      } catch (error) {
        // Ignore
      }
    };
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [ws, navigate]);

  // Handle answer feedback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'game_restarted') {
          if (config.roomType !== 'SINGLE') {
            navigate('/waiting', { state: { ...config, roomCode } });
          }
          return;
        }
        if (message.type === 'color_rejected') {
          setShowColorModal(true);
          return;
        }
        if (message.type === 'round_started') {
          setShowGameOver(false);
          setCountdownPlayed(false);
          setHasGuessedThisRound(false);
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
          if (answerData.is_correct && answerData.player === config.username) {
            AudioManager.getInstance().playCorrectAnswer();
            AudioManager.getInstance().stopCountdown();
            setHasGuessedThisRound(true);
          }
          if (answerData.is_correct) {
            setGameStats(prev => ({...prev, correct: prev.correct + 1}));
            // Add country code to guessed list for map painting
            const countryCode = answerData.country_code || gameState?.question?.flag_code;
            if (countryCode) {
              setGuessedCountries(prev => [...prev, countryCode]);
            }
            setShowSuccessBanner(true);
            setTimeout(() => setShowSuccessBanner(false), 3000);
            
            // Check if all countries found (197 total)
            if (gameStats.correct + 1 >= 197) {
              setTimeout(() => setShowCongratsModal(true), 3500);
            }
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
          AudioManager.getInstance().playGameComplete();
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

  // Play countdown sound at 4 seconds in FLAG mode
  useEffect(() => {
    if (config.gameMode === 'FLAG' && 
        gameState?.time_remaining === 4 && 
        !countdownPlayed && 
        !hasGuessedThisRound) {
      AudioManager.getInstance().playCountdown();
      setCountdownPlayed(true);
    }
  }, [gameState?.time_remaining, config.gameMode, countdownPlayed, hasGuessedThisRound]);



  const handleColorSelect = (color: string) => {
    selectColor(color);
    sessionStorage.setItem(`color_${roomCode}_${config.username}`, color);
    setShowColorModal(false);
  };



  // Auto-start for SINGLE FLAG mode only
  useEffect(() => {
    if (isConnected && !gameState && config.gameMode === 'FLAG' && config.roomType === 'SINGLE') {
      startGame();
    }
  }, [isConnected, config.gameMode, config.roomType, gameState]);

  // Show color picker for WORLD_MAP when connected (only once)
  useEffect(() => {
    if (isConnected && config.gameMode === 'WORLD_MAP' && !showColorModal) {
      const hasServerColor = roomUpdate?.player_colors?.[config.username];
      if (!hasServerColor) {
        setShowColorModal(true);
      }
    }
  }, [isConnected, config.gameMode, roomUpdate?.player_colors, config.username]);



  // Update selected color from server confirmation
  useEffect(() => {
    if (roomUpdate?.player_colors?.[config.username]) {
      setSelectedColor(roomUpdate.player_colors[config.username]);
    }
  }, [roomUpdate?.player_colors, config.username]);



  // Auto-start game when player has color (FREE mode only)
  useEffect(() => {
    if (config.gameMode !== 'WORLD_MAP' || !roomUpdate || gameState) return;
    
    const hasColor = roomUpdate.player_colors?.[config.username];
    const isOwner = config.roomType === 'SINGLE' || roomUpdate.owner === config.username;
    
    if (hasColor && isOwner && roomUpdate.status === 'waiting') {
      setWSMapMode('FREE');
      setTimeout(() => startGame(), 500);
    }
  }, [roomUpdate?.player_colors, roomUpdate?.owner, roomUpdate?.status, gameState?.status, config.gameMode, config.roomType, config.username]);



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
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] flex flex-col gap-4">
          {/* Top row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setShowLeaveDialog(true)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <RoomHeader roomNumber={roomCode} isSingleRoom={config.roomType === 'SINGLE'} />
            </div>
            <GameHeader />
            <div className="flex items-center gap-3">
              <div className="card-elevated px-4 py-2">
                <div className="text-xs text-muted-foreground">Round</div>
                <div className="text-lg font-bold text-center">{gameState?.current_round || 1} / {gameState?.total_rounds || config.rounds}</div>
              </div>
              <div className={`card-elevated px-5 py-3 flex items-center gap-2.5 ${
                gameState?.time_remaining !== undefined && gameState.time_remaining <= 5 
                  ? "bg-destructive text-destructive-foreground animate-pulse" 
                  : gameState?.time_remaining !== undefined && gameState.time_remaining <= 10 
                    ? "bg-game-timer text-white" 
                    : ""
              }`}>
                <span>⏱️</span>
                <span className="text-lg font-semibold tabular-nums">{gameState?.time_remaining || 0}</span>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 min-h-0">
            {/* Leaderboard */}
            <div className="hidden lg:block">
              <Leaderboard players={players} messageCount={chatMessages.length} />
            </div>

            {/* Flag Quiz Area */}
            <div className="flex flex-col gap-4 min-h-0">
              <div className="flex-1 card-elevated flex flex-col items-center justify-center gap-6">
                {/* Flag Display */}
                <div className="w-64 h-40 bg-muted/30 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                  {showTimeoutBanner ? (
                    <span className="text-6xl">🏳️</span>
                  ) : gameState?.question?.flag_code ? (
                    <img 
                      src={`https://flagcdn.com/w320/${gameState.question.flag_code.toLowerCase()}.png`}
                      alt={`Flag of ${gameState.question.country_name}`}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
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

                {/* Question */}
                {gameState?.question && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-muted-foreground">
                      What country is this?
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input */}
              <CountryInput onSubmit={(guess) => {
                if (startTime) {
                  const responseTime = Date.now() - startTime;
                  sendAnswer(guess, responseTime);
                }
              }} />
            </div>

            {/* Chat */}
            <div className="hidden lg:block">
              <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
            </div>
          </div>

          {/* Mobile: show leaderboard and chat below */}
          <div className="lg:hidden grid grid-cols-2 gap-4 h-72">
            <Leaderboard players={players} messageCount={chatMessages.length} />
            <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
          </div>
        </div>



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
          takenColors={Object.values(gameState?.player_colors || roomUpdate?.player_colors || {})}
        />
        
        {/* Modals */}
        <CollisionDialog />
        <ReconnectionDialog 
          isReconnecting={isReconnecting} 
          onReconnected={() => setWasReconnected(true)} 
        />

        <LeaveRoomDialog
          open={showLeaveDialog}
          onConfirm={() => {
            if (ws) {
              ws.send(JSON.stringify({ type: 'close_room' }));
              ws.close();
            }
            sessionStorage.removeItem('currentRoomCode');
            sessionStorage.removeItem('gameMode');
            sessionStorage.removeItem('roomType');
            sessionStorage.removeItem('rounds');
            sessionStorage.removeItem('mapMode');
            navigate("/lobby");
          }}
          onCancel={() => setShowLeaveDialog(false)}
        />
      </div>
    );
  }

  // World Map View
  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setShowLeaveDialog(true)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <RoomHeader roomNumber={roomCode} isSingleRoom={config.roomType === 'SINGLE'} />
          <GameHeader />
          <div className="ml-auto gradient-ocean text-white px-4 py-2 rounded-xl glow-primary">
            <div className="text-xs font-medium opacity-80">Countries Found</div>
            <div className="font-display text-2xl font-bold text-center">{gameStats.correct} / 197</div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 min-h-0">
          {/* Leaderboard */}
          <div className="hidden lg:block">
            <Leaderboard players={players} messageCount={chatMessages.length} />
          </div>

          {/* Map and input */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0 card-elevated overflow-hidden p-4">
              <WorldMap
                countriesFound={gameStats.correct}
                recentGuesses={[]}
                foundCountryCodes={guessedCountries}
                currentCountry={undefined}
                userColor={gameState?.player_colors?.[config.username] || selectedColor}
                paintedCountries={gameState?.painted_countries || {}}
                playerColors={gameState?.player_colors || {}}
              />
            </div>
            <CountryInput onSubmit={(guess) => {
              const responseTime = startTime ? Date.now() - startTime : 0;
              sendAnswer(guess, responseTime);
              setStartTime(Date.now());
            }} />
          </div>

          {/* Chat */}
          <div className="hidden lg:block">
            <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
          </div>
        </div>

        {/* Mobile: show leaderboard and chat below */}
        <div className="lg:hidden grid grid-cols-2 gap-4 h-72">
          <Leaderboard players={players} messageCount={chatMessages.length} />
          <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
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

      {/* Congrats Modal */}
      {showCongratsModal && (
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
                  onClick={() => {
                    setShowCongratsModal(false);
                    if (ws) {
                      ws.send(JSON.stringify({ type: 'restart_game' }));
                    }
                  }}
                  className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl font-bold h-auto"
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
        takenColors={Object.values(roomUpdate?.player_colors || {})}
      />
      <CollisionDialog />
      <ReconnectionDialog 
        isReconnecting={isReconnecting} 
        onReconnected={() => setWasReconnected(true)} 
      />
      <LeaveRoomDialog
        open={showLeaveDialog}
        onConfirm={() => {
          if (ws) {
            ws.send(JSON.stringify({ type: 'close_room' }));
            ws.close();
          }
          sessionStorage.removeItem('currentRoomCode');
          sessionStorage.removeItem('gameMode');
          sessionStorage.removeItem('roomType');
          sessionStorage.removeItem('rounds');
          sessionStorage.removeItem('mapMode');
          navigate("/lobby");
        }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  );
};

export default Game;
