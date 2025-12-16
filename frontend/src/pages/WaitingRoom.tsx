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

  if (!config) {
    navigate('/lobby');
    return null;
  }

  const [roomCode] = useState(() => 
    config.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()
  );

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
          console.log('Game started, navigating...');
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
    console.log('Starting game...', { gameMode: config.gameMode, rounds });
    sendMessage({ type: 'set_rounds', payload: { rounds } });
    startGame();
  };

  const handleMapModeSelect = (mode: 'TIMED' | 'FREE') => {
    setMapMode(mode);
  };

  const handleRoundsChange = (newRounds: number) => {
    setRounds(newRounds);
    sendMessage({ type: 'set_rounds', payload: { rounds: newRounds } });
  };

  return (
    <div className="min-h-screen gradient-earth flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="absolute top-6 left-6 gap-2"
        onClick={() => navigate("/lobby")}
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="relative z-10 w-full max-w-2xl glass-card-strong rounded-3xl p-8 animate-scale-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl font-bold">Waiting Room</h1>
          </div>
          <p className="text-muted-foreground">
            {config.gameMode === 'FLAG' ? '🚩 Flag Quiz' : '🗺️ World Map'} • {config.roomType} Room
          </p>
        </div>

        {/* Room Code */}
        {config.roomType !== 'SINGLE' && (
          <div className="mb-6 p-4 bg-muted/30 rounded-xl">
            <div className="text-sm text-muted-foreground mb-2">Room Code</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-2xl font-bold">{roomCode}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="rounded-xl"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Map Mode Selection (only for World Map) */}
        {config.gameMode === 'WORLD_MAP' && !roomUpdate?.map_mode && (
          <div className="mb-6 space-y-3">
            <div className="text-sm font-semibold">Select Map Mode</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleMapModeSelect('TIMED')}
                className="selection-card flex flex-col items-center gap-3 p-5"
              >
                <div className="text-4xl">⏱️</div>
                <div className="text-center">
                  <div className="font-semibold">Timed Mode</div>
                  <div className="text-xs text-muted-foreground">15s per round</div>
                </div>
              </button>
              <button
                onClick={() => handleMapModeSelect('FREE')}
                className="selection-card flex flex-col items-center gap-3 p-5"
              >
                <div className="text-4xl">🆓</div>
                <div className="text-center">
                  <div className="font-semibold">Free Mode</div>
                  <div className="text-xs text-muted-foreground">No time limit</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Rounds Selection (only for Timed modes) */}
        {((config.gameMode === 'FLAG') || (config.gameMode === 'WORLD_MAP' && roomUpdate?.map_mode === 'TIMED')) && isOwner && (
          <div className="mb-6 space-y-3">
            <div className="text-sm font-semibold">Number of Rounds</div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((num) => (
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
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                  {player[0].toUpperCase()}
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
              className="w-full"
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
