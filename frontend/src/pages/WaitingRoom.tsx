import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Crown, Copy, Check, ChevronLeft } from "lucide-react";
import { GameConfig } from "@/types/game";
import { useWebSocket } from "@/hooks/useWebSocket";

const WaitingRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state as GameConfig | null;
  const [copied, setCopied] = useState(false);
  const [rounds, setRounds] = useState(config?.rounds || 10);

  // Try to restore session if config is missing (page refresh)
  if (!config) {
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    const savedUsername = localStorage.getItem('username');
    const savedGameMode = sessionStorage.getItem('gameMode');
    const savedRoomType = sessionStorage.getItem('roomType');
    
    if (savedRoomCode && savedUsername && savedGameMode && savedRoomType) {
      const restoredConfig: GameConfig = {
        username: savedUsername,
        gameMode: savedGameMode as 'FLAG' | 'WORLD_MAP',
        roomType: savedRoomType as 'SINGLE' | 'PRIVATE' | 'PUBLIC',
        roomCode: savedRoomCode,
        rounds: parseInt(sessionStorage.getItem('rounds') || '10')
      };
      navigate('/waiting', { state: restoredConfig, replace: true });
      return null;
    }
    
    navigate('/lobby');
    return null;
  }

  // Save session data
  sessionStorage.setItem('gameMode', config.gameMode);
  sessionStorage.setItem('roomType', config.roomType);
  sessionStorage.setItem('rounds', config.rounds?.toString() || '10');

  const [roomCode] = useState(() => {
    // Check localStorage for existing room code
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    const newCode = config.roomCode || savedRoomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    // Save to sessionStorage
    sessionStorage.setItem('currentRoomCode', newCode);
    return newCode;
  });

  const {
    ws,
    isConnected,
    roomUpdate,
    startGame,
    setMapMode,
    sendMessage
  } = useWebSocket({
    roomCode,
    username: config.username,
    gameMode: config.gameMode,
    roomType: config.roomType,
    rounds: config.rounds
  });

  const isOwner = roomUpdate?.owner === config.username;
  const players = roomUpdate?.players || [];

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'round_started' || message.type === 'game_started') {
          navigate('/game', { state: { ...config, roomCode } });
        }
      } catch (error) {
        // Ignore
      }
    };

    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [ws, navigate, config, roomCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    sendMessage({ type: 'set_rounds', payload: { rounds } });
    startGame();
  };

  // Auto-select FREE mode for World Map
  useEffect(() => {
    if (config.gameMode === 'WORLD_MAP' && !roomUpdate?.map_mode && isOwner) {
      setMapMode('FREE');
      sessionStorage.setItem('mapMode', 'FREE');
    }
  }, [config.gameMode, roomUpdate?.map_mode, isOwner]);

  const handleRoundsChange = (newRounds: number) => {
    setRounds(newRounds);
    sendMessage({ type: 'set_rounds', payload: { rounds: newRounds } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 sm:right-20 w-32 h-32 sm:w-64 sm:h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-6 lg:left-20 gap-1 sm:gap-2 text-xs sm:text-sm h-8 w-8 sm:h-auto sm:w-auto"
        onClick={() => navigate("/lobby")}
      >
        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Back</span>
      </Button>

      <div className="relative z-10 w-full max-w-2xl glass-card-strong rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-8 animate-scale-in mx-2 sm:mx-4">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">Waiting Room</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {config.gameMode === 'FLAG' ? '🚩 Flag Quiz' : '🗺️ World Map'} • {config.roomType} Room
          </p>
        </div>

        {/* Room Code */}
        {config.roomType !== 'SINGLE' && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl">
            <div className="text-xs sm:text-sm text-muted-foreground mb-2">Room Code</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-lg sm:text-xl lg:text-2xl font-bold">{roomCode}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-10 sm:w-10"
              >
                {copied ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
            </div>
          </div>
        )}



        {/* Rounds Selection (only for Flag Quiz) */}
        {config.gameMode === 'FLAG' && isOwner && (
          <div className="mb-6 space-y-3">
            <div className="text-sm font-semibold">Number of Rounds</div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20, ...(localStorage.getItem('token') ? [40, 60, 100] : [])].map((num) => (
                <button
                  key={num}
                  onClick={() => handleRoundsChange(num)}
                  className={`p-3 rounded-xl font-semibold transition-all ${
                    rounds === num
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="mb-6">
          <div className="text-sm font-semibold mb-3">
            Players ({players.length}/6)
          </div>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {player.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 font-medium">{player}</div>
                {player === roomUpdate?.owner && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
                {player === config.username && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center text-sm">
            Connecting to room...
          </div>
        )}

        {/* Start Game Button */}
        {isOwner ? (
          <>
            {(config.roomType === 'PUBLIC' || config.roomType === 'PRIVATE') && players.length < 2 && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center text-sm">
                Waiting for at least 2 players to start...
              </div>
            )}
            <Button
              variant="game"
              size="lg"
              className="w-full h-10 sm:h-12 text-sm sm:text-base"
              onClick={handleStartGame}
              disabled={
                !isConnected || 
                ((config.roomType === 'PUBLIC' || config.roomType === 'PRIVATE') && players.length < 2) ||
                (config.gameMode === 'WORLD_MAP' && !roomUpdate?.map_mode)
              }
            >
              Start Game
            </Button>
          </>
        ) : (
          <div className="text-center p-4 bg-muted/30 rounded-xl">
            <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Waiting for {roomUpdate?.owner} to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
