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
import MuteButton from "@/components/MuteButton";
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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'chat' | 'none'>('none');

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
      const bgMusicEnabled = localStorage.getItem('bgMusicEnabled') !== 'false';
      const audioMuted = localStorage.getItem('audioMuted') === 'true';
      
      if (bgMusicEnabled && !audioMuted) {
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
      <div className="min-h-screen bg-background lg:p-4 p-0">
        <div className="max-w-[1600px] mx-auto h-screen flex flex-col">
          {/* Header - Streamlined */}
          <div className="flex items-center justify-between lg:p-4 p-2 bg-card/50 backdrop-blur border-b border-border/30">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="lg:h-10 lg:w-10 h-8 w-8" onClick={() => setShowLeaveDialog(true)}>
                <ChevronLeft className="lg:w-5 lg:h-5 w-4 h-4" />
              </Button>
              <div className="font-bold lg:text-lg text-base">{roomCode}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 px-3 py-1 rounded-full">
                <span className="lg:text-sm text-xs font-medium">{gameState?.current_round || 1}/{gameState?.total_rounds || config.rounds}</span>
              </div>
              <div className={`px-3 py-1 rounded-full font-bold lg:text-lg text-base ${
                gameState?.time_remaining !== undefined && gameState.time_remaining <= 5 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-orange-500 text-white"
              }`}>
                {gameState?.time_remaining || 0}s
              </div>
              <MuteButton />
            </div>
          </div>

          {/* Desktop 3-column layout */}
          <div className="hidden lg:flex flex-1 gap-4 p-4 min-h-0">
            <div className="w-80">
              <Leaderboard players={players} messageCount={chatMessages.length} />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 card-elevated flex flex-col items-center justify-center p-6">
                <div className="w-80 h-52 bg-muted/20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-6">
                  {gameState?.question?.flag_code ? (
                    <img 
                      src={`https://flagcdn.com/w320/${gameState.question.flag_code.toLowerCase()}.png`}
                      alt="Flag"
                      className="max-w-full max-h-full object-contain rounded-xl"
                      onLoad={() => setFlagLoaded(true)}
                    />
                  ) : (
                    <span className="text-6xl">🏳️</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-4">What country is this?</h2>
              </div>
              <CountryInput onSubmit={(guess) => {
                if (startTime) {
                  sendAnswer(guess, Date.now() - startTime);
                }
              }} />
            </div>
            <div className="w-80">
              <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
            </div>
          </div>

          {/* Mobile single-column layout */}
          <div className="lg:hidden flex-1 flex flex-col">
            {/* Game area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="w-64 h-40 bg-muted/20 rounded-xl border border-dashed border-border flex items-center justify-center mb-4">
                {gameState?.question?.flag_code ? (
                  <img 
                    src={`https://flagcdn.com/w320/${gameState.question.flag_code.toLowerCase()}.png`}
                    alt="Flag"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onLoad={() => setFlagLoaded(true)}
                  />
                ) : (
                  <span className="text-5xl">🏳️</span>
                )}
              </div>
              <h2 className="text-lg font-semibold mb-4">What country is this?</h2>
              <div className="w-full max-w-sm">
                <CountryInput onSubmit={(guess) => {
                  if (startTime) {
                    sendAnswer(guess, Date.now() - startTime);
                  }
                }} />
              </div>
            </div>
            
            {/* Bottom tabs */}
            <div className="h-12 flex border-t border-border/30">
              <button 
                className={`flex-1 flex items-center justify-center text-sm font-medium ${
                  activeTab === 'leaderboard' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                }`}
                onClick={() => setActiveTab(activeTab === 'leaderboard' ? 'none' : 'leaderboard')}
              >
                🏆 Leaderboard
              </button>
              <button 
                className={`flex-1 flex items-center justify-center text-sm font-medium ${
                  activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                }`}
                onClick={() => setActiveTab(activeTab === 'chat' ? 'none' : 'chat')}
              >
                💬 Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
              </button>
            </div>
          </div>
          
          {/* Mobile overlays */}
          {activeTab === 'leaderboard' && (
            <div className="fixed inset-0 bg-background z-50 flex flex-col lg:hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h2 className="text-lg font-bold">Leaderboard</h2>
                <Button variant="ghost" onClick={() => setActiveTab('none')}>Close</Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Leaderboard players={players} messageCount={chatMessages.length} />
              </div>
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="fixed inset-0 bg-background z-50 flex flex-col lg:hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h2 className="text-lg font-bold">Chat</h2>
                <Button variant="ghost" onClick={() => setActiveTab('none')}>Close</Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
              </div>
            </div>
          )}
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
                    <div className="text-sm opacity-80 mt-1">Missed</div>
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
    <div className="min-h-screen bg-background lg:p-4 p-0">
      <div className="max-w-[1600px] mx-auto h-screen flex flex-col">
        {/* Header - Streamlined */}
        <div className="flex items-center justify-between lg:p-4 p-2 bg-card/50 backdrop-blur border-b border-border/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:h-10 lg:w-10 h-8 w-8" onClick={() => setShowLeaveDialog(true)}>
              <ChevronLeft className="lg:w-5 lg:h-5 w-4 h-4" />
            </Button>
            <div className="font-bold lg:text-lg text-base">{roomCode}</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-2 rounded-full font-bold">
            {gameStats.correct}/197 Countries
          </div>
          <MuteButton />
        </div>

        {/* Desktop 3-column layout */}
        <div className="hidden lg:flex flex-1 gap-4 p-4 min-h-0">
          <div className="w-80">
            <Leaderboard players={players} messageCount={chatMessages.length} />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 card-elevated overflow-hidden">
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
          <div className="w-80">
            <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden flex-1 flex flex-col">
          {/* Map area - 60% of screen */}
          <div className="flex-[3] relative overflow-hidden">
            <WorldMap
              countriesFound={gameStats.correct}
              recentGuesses={[]}
              foundCountryCodes={guessedCountries}
              currentCountry={undefined}
              userColor={gameState?.player_colors?.[config.username] || selectedColor}
              paintedCountries={gameState?.painted_countries || {}}
              playerColors={gameState?.player_colors || {}}
            />
            {/* Floating input */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-card/90 backdrop-blur rounded-xl border border-border/50 shadow-xl">
                <CountryInput onSubmit={(guess) => {
                  const responseTime = startTime ? Date.now() - startTime : 0;
                  sendAnswer(guess, responseTime);
                  setStartTime(Date.now());
                }} />
              </div>
            </div>
          </div>
          
          {/* Bottom tabs - 40% of screen */}
          <div className="flex-[2] flex flex-col border-t border-border/30">
            <div className="h-12 flex">
              <button 
                className={`flex-1 flex items-center justify-center text-sm font-medium ${
                  activeTab === 'leaderboard' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                }`}
                onClick={() => setActiveTab(activeTab === 'leaderboard' ? 'chat' : 'leaderboard')}
              >
                🏆 Leaderboard
              </button>
              <button 
                className={`flex-1 flex items-center justify-center text-sm font-medium ${
                  activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                }`}
                onClick={() => setActiveTab(activeTab === 'chat' ? 'leaderboard' : 'chat')}
              >
                💬 Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'leaderboard' ? (
                <Leaderboard players={players} messageCount={chatMessages.length} />
              ) : (
                <GameChat messages={chatMessages} onSendMessage={sendChatMessage} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[85%] max-w-xs">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg shadow-lg border border-green-300">
            <div className="flex items-center gap-1 justify-center">
              <span className="text-sm">🎉</span>
              <div className="text-center">
                <div className="text-xs font-bold">Correct!</div>
                <div className="text-xs truncate">{lastAnswer?.country}</div>
              </div>
              <span className="text-sm">✅</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {showErrorBanner && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[85%] max-w-xs">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-2 py-1 rounded-lg shadow-lg border border-red-300">
            <div className="flex items-center gap-1 justify-center">
              <span className="text-sm">❌</span>
              <div className="text-center">
                <div className="text-xs font-bold">Wrong!</div>
                <div className="text-xs truncate">It was {lastAnswer?.country}</div>
              </div>
              <span className="text-sm">😢</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeout Banner */}
      {showTimeoutBanner && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[85%] max-w-xs">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-2 py-1 rounded-lg shadow-lg border border-orange-300">
            <div className="flex items-center gap-1 justify-center">
              <span className="text-sm">⏰</span>
              <div className="text-center">
                <div className="text-xs font-bold">Time's Up!</div>
                <div className="text-xs truncate">{timeoutCountry}</div>
              </div>
              <span className="text-sm">⌛</span>
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
                  <div className="text-sm opacity-80 mt-1">Missed</div>
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
