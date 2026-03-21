import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Crown, Copy, Check, ChevronLeft } from "lucide-react";
import { GameConfig, RoomUpdate } from "@/types/game";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getOrCreateGuestUsername } from "@/lib/guestUsername";

const getStoredConfig = (): GameConfig | null => {
  const gameMode = sessionStorage.getItem("gameMode");
  const roomType = sessionStorage.getItem("roomType");
  const roomCode = sessionStorage.getItem("currentRoomCode") || undefined;
  const rounds = Number(sessionStorage.getItem("rounds") || 10);
  const timeout = Number(sessionStorage.getItem("timeout") || 15);
  const username =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    getOrCreateGuestUsername();

  if (!gameMode || !roomType || !username) {
    return null;
  }

  return {
    username,
    gameMode: gameMode as GameConfig["gameMode"],
    roomType: roomType as GameConfig["roomType"],
    roomCode,
    rounds,
    timeout,
  };
};

const WaitingRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = (location.state as GameConfig | null) || getStoredConfig();

  const [copied, setCopied] = useState(false);
  const [rounds, setRounds] = useState(10);
  const [roomCode, setRoomCode] = useState<string>("");
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize rounds safely
  useEffect(() => {
    if (config?.rounds) {
      setRounds(config.rounds);
    }
  }, [config]);

  // Redirect if config missing (NEVER early return before hooks)
  useEffect(() => {
    if (!config) {
      sessionStorage.removeItem("currentRoomCode");
      sessionStorage.removeItem("gameMode");
      sessionStorage.removeItem("roomType");
      sessionStorage.removeItem("rounds");
      navigate("/lobby");
    }
  }, [config, navigate]);

  // Persist session config (for refresh recovery)
  useEffect(() => {
    if (!config) return;

    sessionStorage.setItem("username", config.username);
    sessionStorage.setItem("gameMode", config.gameMode);
    sessionStorage.setItem("roomType", config.roomType);
    sessionStorage.setItem("rounds", String(config.rounds ?? 10));
    sessionStorage.setItem("timeout", String(config.timeout ?? 15));
  }, [config]);

  // Generate / restore room code (STABLE + MULTIPLAYER SAFE)
  useEffect(() => {
    if (!config) return;

    // Joining existing room
    if (config.roomCode) {
      setRoomCode(config.roomCode);
      sessionStorage.setItem("currentRoomCode", config.roomCode);
      return;
    }

    // Private room → get code from backend
    if (config.roomType === "PRIVATE") {
      const saved = sessionStorage.getItem("currentRoomCode");
      if (saved) {
        setRoomCode(saved);
        return;
      }

      // Request room code from backend
      fetch('/api/v2/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_mode: config.gameMode,
          room_type: config.roomType
        })
      })
        .then(res => res.json())
        .then(data => {
          const newCode = data.room_code;
          sessionStorage.setItem("currentRoomCode", newCode);
          setRoomCode(newCode);
        })
        .catch(err => {
          console.error('Failed to create room:', err);
          navigate('/lobby');
        });
      return;
    }

    // Public room → deterministic shared ID (CRITICAL for sync)
    const publicRoomId = `PUBLIC_${config.gameMode}`;
    setRoomCode(publicRoomId);
  }, [config, navigate]);

  // Stable websocket config (prevents reconnect loops)
  const wsConfig = useMemo(() => {
    if (!config || !roomCode) return null;

    return {
      roomCode,
      username: config.username,
      gameMode: config.gameMode,
      roomType: config.roomType,
      rounds: config.rounds,
    };
  }, [config, roomCode]);

  // MUST be called unconditionally (React Hooks rule)
  const {
    isConnected,
    gameState,
    roomUpdate,
    startGame,
    setMapMode,
    sendMessage,
    switchTeam,
  } = useWebSocket(wsConfig);

  // Navigate when game starts
  useEffect(() => {
    if (!config || !roomCode) return;

    if (gameState?.status === "in_progress") {
      navigate("/game", { state: { ...config, roomCode } });
    }
  }, [gameState?.status, config, roomCode, navigate]);

  // Auto initialize world map mode (owner only)
  useEffect(() => {
    if (
      config?.gameMode === "WORLD_MAP" &&
      roomUpdate &&
      !roomUpdate.map_mode &&
      roomUpdate.owner === config.username &&
      !mapInitialized
    ) {
      setMapMode("FREE");
      sessionStorage.setItem("mapMode", "FREE");
      setMapInitialized(true);
    }
  }, [config, roomUpdate, mapInitialized, setMapMode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleRoundsChange = (newRounds: number) => {
    setRounds(newRounds);
    // Rounds are sent via WebSocket config on connection
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem("currentRoomCode");
    sessionStorage.removeItem("gameMode");
    sessionStorage.removeItem("roomType");
    sessionStorage.removeItem("rounds");
    navigate("/lobby");
  };

  // ---- SAFE UI GUARDS (after all hooks) ----
  if (!config) return null;

  if (!roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Preparing room...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Connecting to room...</p>
      </div>
    );
  }

  if (!roomUpdate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Syncing room state...</p>
      </div>
    );
  }

  const displayPlayers = roomUpdate.players;
  const displayOwner = roomUpdate.owner;
  const displayIsOwner = displayOwner === config.username;
  const actualGameMode = roomUpdate.game_mode || config.gameMode;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4"
        onClick={() => navigate("/lobby")}
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="w-full max-w-2xl p-8 rounded-2xl bg-muted/30">
        <div className="text-center mb-6">
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Waiting Room</h1>
          <p className="text-muted-foreground">
            {actualGameMode} • {config.roomType} Room
          </p>
        </div>

        {config.roomType === "PRIVATE" && (
          <div className="mb-6 p-4 bg-muted/20 rounded-xl flex justify-between items-center">
            <span className="font-mono text-xl">{roomCode}</span>
            <Button size="icon" onClick={handleCopyCode}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
        )}

        <div className="mb-6">
          <h2 className="font-semibold mb-3">
            Players ({displayPlayers.length}/6)
          </h2>
          {displayPlayers.map((player: string) => (
            <div
              key={player}
              className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg mb-2"
            >
              <div className="flex-1">{player}</div>
              {player === displayOwner && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          ))}
        </div>

        {displayIsOwner ? (
          <Button className="w-full" onClick={handleStartGame}>
            Start Game
          </Button>
        ) : (
          <div className="text-center text-muted-foreground">
            Waiting for {displayOwner} to start the game...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
