import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gamepad2, User, Lock, Globe, Flag, Map, Users, ChevronLeft } from "lucide-react";
import { GameConfig } from "@/types/game";

type GameMode = "FLAG" | "WORLD_MAP";
type RoomType = "SINGLE" | "PRIVATE" | "PUBLIC";

interface PublicRoom {
  id: string;
  host: string;
  players: number;
  maxPlayers: number;
  mode: GameMode;
}

const Lobby = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("WORLD_MAP");
  const [rounds, setRounds] = useState("10");
  const [roomType, setRoomType] = useState<RoomType>("SINGLE");
  const [roomCode, setRoomCode] = useState("");
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  useEffect(() => {
    if (roomType === 'PUBLIC') {
      fetchPublicRooms();
    }
  }, [roomType, gameMode]);

  const fetchPublicRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch(`/api/rooms?type=PUBLIC&mode=${gameMode}`);
      const data = await response.json();
      setPublicRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch public rooms:', error);
      setPublicRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleStartGame = () => {
    if (!username.trim()) return;
    
    const config: GameConfig = {
      username: username.trim(),
      gameMode,
      rounds: parseInt(rounds),
      roomType,
      roomCode: roomType === 'PRIVATE' ? roomCode : undefined
    };
    
    // Single player goes directly to game, others to waiting room
    if (roomType === 'SINGLE') {
      navigate("/game", { state: config });
    } else {
      navigate("/waiting", { state: config });
    }
  };

  const handleJoinPublicRoom = (code: string) => {
    if (!username.trim()) return;
    
    const config: GameConfig = {
      username: username.trim(),
      gameMode,
      rounds: parseInt(rounds),
      roomType: 'PUBLIC',
      roomCode: code
    };
    
    navigate("/waiting", { state: config });
  };

  return (
    <div className="min-h-screen gradient-earth flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-6 left-6 gap-2"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg glass-card-strong rounded-3xl p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">Game Lobby</h1>
        </div>
        <p className="text-center text-muted-foreground mb-8">
          Choose your game mode and room type
        </p>

        <div className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="font-semibold">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 rounded-xl bg-card/50 border-border focus:border-primary"
            />
          </div>

          {/* Game Mode */}
          <div className="space-y-2">
            <Label className="font-semibold">Game Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGameMode("FLAG")}
                className={`selection-card flex flex-col items-center gap-3 p-5 ${
                  gameMode === "FLAG" ? "selection-card-active" : ""
                }`}
              >
                <div className="text-4xl">🚩</div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">Flag Quiz</div>
                  <div className="text-xs text-muted-foreground">Guess country from flag</div>
                </div>
              </button>
              <button
                onClick={() => setGameMode("WORLD_MAP")}
                className={`selection-card flex flex-col items-center gap-3 p-5 ${
                  gameMode === "WORLD_MAP" ? "selection-card-active" : ""
                }`}
              >
                <div className="text-4xl">🗺️</div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">World Map</div>
                  <div className="text-xs text-muted-foreground">Click on the map</div>
                </div>
              </button>
            </div>
          </div>

          {/* Number of Rounds - Only for FLAG mode */}
          {gameMode === "FLAG" && (
            <div className="space-y-2 animate-fade-in">
              <Label className="font-semibold">Number of Rounds</Label>
              <Select value={rounds} onValueChange={setRounds}>
                <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Rounds</SelectItem>
                  <SelectItem value="10">10 Rounds</SelectItem>
                  <SelectItem value="15">15 Rounds</SelectItem>
                  <SelectItem value="20">20 Rounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Room Type */}
          <div className="space-y-2">
            <Label className="font-semibold">Room Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setRoomType("SINGLE")}
                className={`selection-card flex flex-col items-center gap-2 p-4 ${
                  roomType === "SINGLE" ? "selection-card-active" : ""
                }`}
              >
                <User className="w-6 h-6 text-game-ocean" />
                <span className="text-sm font-medium">Single Player</span>
              </button>
              <button
                onClick={() => setRoomType("PRIVATE")}
                className={`selection-card flex flex-col items-center gap-2 p-4 ${
                  roomType === "PRIVATE" ? "selection-card-active" : ""
                }`}
              >
                <Lock className="w-6 h-6 text-accent" />
                <span className="text-sm font-medium">Private Room</span>
              </button>
              <button
                onClick={() => setRoomType("PUBLIC")}
                className={`selection-card flex flex-col items-center gap-2 p-4 ${
                  roomType === "PUBLIC" ? "selection-card-active" : ""
                }`}
              >
                <Globe className="w-6 h-6 text-game-ocean" />
                <span className="text-sm font-medium">Public Room</span>
              </button>
            </div>
          </div>

          {/* Room Code (for private rooms) */}
          {roomType === "PRIVATE" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="roomCode" className="font-semibold">Room Code</Label>
              <Input
                id="roomCode"
                placeholder="Enter room code to join"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="h-12 rounded-xl bg-card/50 border-border focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">Leave empty to create new room</p>
            </div>
          )}

          {/* Public Rooms List */}
          {roomType === "PUBLIC" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Available Public Rooms</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchPublicRooms}
                  disabled={isLoadingRooms}
                >
                  {isLoadingRooms ? "Loading..." : "Refresh"}
                </Button>
              </div>
              {publicRooms.length === 0 ? (
                <div className="text-center py-6 bg-muted/30 rounded-xl">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No public rooms available</p>
                  <p className="text-xs text-muted-foreground mt-1">Create one and others will join!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {publicRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleJoinPublicRoom(room.id)}
                      disabled={!username.trim()}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{room.mode === "FLAG" ? "🚩" : "🗺️"}</span>
                        <span className="font-medium">Room {room.id}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {room.players}/{room.maxPlayers}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Start Game Button */}
          <Button
            variant="game"
            size="lg"
            className="w-full mt-4"
            onClick={handleStartGame}
            disabled={!username.trim()}
          >
            {roomType === 'PUBLIC' ? 'Create Public Room' : roomType === 'PRIVATE' && roomCode ? 'Join Private Room' : roomType === 'PRIVATE' ? 'Create Private Room' : 'Start Game'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
