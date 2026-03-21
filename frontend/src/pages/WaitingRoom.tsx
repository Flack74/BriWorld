import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Crown, Copy, Check, ChevronLeft } from "lucide-react";
import { LeaveRoomDialog } from "@/components/LeaveRoomDialog";
import { GameConfig } from "@/types/game";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getOrCreateGuestUsername } from "@/lib/guestUsername";
import { api } from "@/lib/api";

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
  const config = useMemo(
    () => (location.state as GameConfig | null) || getStoredConfig(),
    [location.state],
  );

  const [copied, setCopied] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

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
      api.createRoom({
        game_mode: config.gameMode,
        room_type: config.roomType,
      })
        .then((data: { room_code: string }) => {
          const newCode = data.room_code;
          if (!newCode) {
            throw new Error("Missing room code in create-room response");
          }

          sessionStorage.setItem("currentRoomCode", newCode);
          setRoomCode(newCode);
        })
        .catch((err) => {
          console.error("Failed to create room:", err);
          navigate("/lobby");
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
      timeout: config.timeout,
    };
  }, [
    config?.gameMode,
    config?.roomType,
    config?.rounds,
    config?.timeout,
    config?.username,
    roomCode,
  ]);

  // MUST be called unconditionally (React Hooks rule)
  const {
    ws,
    isConnected,
    gameState,
    roomUpdate,
    startGame,
    setMapMode,
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

  const handleLeaveRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "leave_room" }));
      setTimeout(() => ws.close(), 100);
    }
    sessionStorage.removeItem("currentRoomCode");
    sessionStorage.removeItem("gameMode");
    sessionStorage.removeItem("roomType");
    sessionStorage.removeItem("rounds");
    sessionStorage.removeItem("timeout");
    sessionStorage.removeItem("mapMode");
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
  const playerBanners = roomUpdate.player_banners || {};
  const playerAvatars = roomUpdate.player_avatars || {};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4"
        onClick={() => setShowLeaveDialog(true)}
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
              className="mb-3 overflow-hidden rounded-xl border border-white/10"
            >
              <div
                className="flex items-center gap-3 p-3"
                style={{
                  backgroundImage: playerBanners[player]
                    ? `linear-gradient(rgba(8,12,18,0.45), rgba(8,12,18,0.72)), url(${playerBanners[player]})`
                    : "linear-gradient(135deg, rgba(43,122,155,0.24), rgba(124,58,237,0.18), rgba(234,106,71,0.16))",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {playerAvatars[player] ? (
                  <img
                    src={playerAvatars[player]}
                    alt={player}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white/70"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white ring-2 ring-white/70">
                    {player.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white drop-shadow">
                    {player}
                  </div>
                  <div className="text-xs text-white/70">
                    {player === displayOwner ? "Room owner" : "Ready in lobby"}
                  </div>
                </div>
                {player === displayOwner && (
                  <Crown className="h-4 w-4 text-yellow-300" />
                )}
              </div>
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

      <LeaveRoomDialog
        open={showLeaveDialog}
        onConfirm={handleLeaveRoom}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  );
};

export default WaitingRoom;
