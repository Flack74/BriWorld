import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomTypeSelector } from "./RoomTypeSelector";
import { ModeCarousel } from "./ModeCarousel";
import { RoomCodeInput } from "./RoomCodeInput";
import { RoundsModal } from "@/components/RoundsModal";
import { LobbyState, RoomType } from "../../types/lobby";
import { MODE_VISIBILITY, GAME_MODES } from "../../constants/gameModes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Gamepad2, Edit2, Users, Play, RefreshCw } from "lucide-react";
import { MetaStatsWidget } from "@/components/MetaStatsWidget";
import { getOrCreateGuestUsername } from "@/lib/guestUsername";
import { api } from "@/lib/api";

interface PublicRoom {
  id: string;
  host: string;
  players: number;
  maxPlayers: number;
  mode: string;
}

export const GameLobby: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  // Initialize username with unique guest name if not set
  const [username, setUsername] = useState(() => getOrCreateGuestUsername());

  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);

  const [state, setState] = useState<LobbyState>({
    roomType: "single",
    selectedMode: null,
    roomCode: "",
  });
  const [selectedRounds, setSelectedRounds] = useState<number>(10);
  const [selectedTimeout, setSelectedTimeout] = useState<number>(15);
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real public rooms from API
  const fetchPublicRooms = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getRooms();
      console.log('[LOBBY] Fetched rooms:', data);
      setPublicRooms(data.rooms || data || []);
    } catch (error) {
      console.error('[LOBBY] Failed to fetch public rooms:', error);
      setPublicRooms([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPublicRooms();
    // Refresh every 10 seconds
    const interval = setInterval(fetchPublicRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const visibleModes = MODE_VISIBILITY[state.roomType]
    .map((id) => GAME_MODES[id])
    .filter(Boolean); // Remove any undefined modes

  // Debug: Log visible modes
  useEffect(() => {
    console.log('[LOBBY] Room type:', state.roomType);
    console.log('[LOBBY] Visible mode count:', visibleModes.length);
    console.log('[LOBBY] Modes:', visibleModes.map(m => m?.title));
  }, [state.roomType, visibleModes.length]);

  const handleRoomTypeChange = (roomType: RoomType) => {
    setState({
      roomType,
      selectedMode: null,
      roomCode: "",
    });
    // Auto-refresh public rooms when switching to public tab
    if (roomType === 'public') {
      fetchPublicRooms();
    }
  };

  const handleModeSelect = (modeId: string) => {
    setState((prev) => ({ ...prev, selectedMode: modeId }));

    // Don't show rounds modal if joining existing private room
    if (state.roomType === 'private' && state.roomCode) {
      return;
    }

    // Show rounds modal for FLAG mode when creating new room
    const flagModes = ['FLAG', 'FLAG_QUIZ'];
    if (flagModes.includes(modeId)) {
      setShowRoundsModal(true);
    }
  };

  const handleRoomCodeChange = (code: string) => {
    setState((prev) => ({ ...prev, roomCode: code.toUpperCase() }));
  };

  const handleSaveUsername = () => {
    if (tempUsername.trim().length >= 3) {
      setUsername(tempUsername.trim());
      localStorage.setItem("username", tempUsername.trim());
      setEditingUsername(false);
    }
  };

  const getCtaLabel = (): string => {
    if (state.roomType === "private" && state.roomCode) return "Join Room";
    if (state.roomType === "single") return "Start Game";
    if (state.roomType === "private") return "Create Private Room";
    return "Create Public Room";
  };

  const handleStart = () => {
    if (!state.selectedMode && !(state.roomType === 'private' && state.roomCode)) return;

    // Clear any existing room data for single player mode to prevent conflicts
    if (state.roomType === 'single') {
      sessionStorage.removeItem('currentRoomCode');
      sessionStorage.removeItem('gameMode');
      sessionStorage.removeItem('roomType');
      sessionStorage.removeItem('rounds');
    }

    // Get the actual mode ID from GAME_MODES (not the key)
    const selectedModeObj = GAME_MODES[state.selectedMode];
    const actualModeId = selectedModeObj?.id || state.selectedMode;

    const config = {
      username,
      gameMode: actualModeId, // Use the actual mode.id, not the key
      rounds: selectedRounds,
      roomType: state.roomType.toUpperCase() as "SINGLE" | "PRIVATE" | "PUBLIC",
      roomCode: state.roomCode || undefined,
      timeout: selectedTimeout,
    };

    // Navigate to waiting room for multiplayer, directly to game for single player
    if (state.roomType === "single") {
      navigate("/game", { state: config });
    } else {
      // All multiplayer goes to waiting room
      navigate("/waiting", { state: config });
    }
  };

  return (
    <div className="w-full h-full px-2 sm:px-4 py-2">
      <div className="w-full max-w-6xl mx-auto">
        <div className={`w-full ${state.roomType === 'public' ? 'grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4' : 'flex justify-center'}`}>
          {/* Main Lobby Card */}
          <div className={state.roomType === 'public' ? 'lg:col-span-2' : 'w-full max-w-3xl'}>
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl">
              <CardHeader className="text-center space-y-1 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="relative">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 text-primary animate-pulse" />
                    <Gamepad2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 text-primary absolute -bottom-1 -right-1" />
                  </div>
                </div>
                <CardTitle className="text-base sm:text-lg md:text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Game Lobby
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                  Choose your game mode and start playing
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 md:p-6">
                {/* Username Section for Logged Out Users */}
                {!isLoggedIn && (
                  <div className="bg-muted/50 rounded-lg p-2 sm:p-3 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="w-full">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Playing as</p>
                        {editingUsername ? (
                          <div className="flex gap-1 sm:gap-2 mt-1">
                            <input
                              type="text"
                              value={tempUsername}
                              onChange={(e) => setTempUsername(e.target.value)}
                              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                              placeholder="Enter username"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveUsername} className="text-xs h-8 px-2 sm:px-3">
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUsername(false);
                                setTempUsername(username);
                              }}
                              className="text-xs h-8 px-2 sm:px-3"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1">
                            <p className="text-sm sm:text-base font-semibold text-foreground">{username}</p>
                            <button
                              onClick={() => setEditingUsername(true)}
                              className="text-muted-foreground hover:text-foreground transition"
                            >
                              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <RoomTypeSelector
                  selected={state.roomType}
                  onChange={handleRoomTypeChange}
                />

                {state.roomType === 'private' && (
                  <RoomCodeInput
                    value={state.roomCode}
                    onChange={handleRoomCodeChange}
                  />
                )}

                {/* Only show mode selector if not joining existing private room */}
                {!(state.roomType === 'private' && state.roomCode.length >= 6) && (
                  <ModeCarousel
                    modes={visibleModes}
                    selectedMode={state.selectedMode}
                    onSelect={handleModeSelect}
                  />
                )}

                <Button
                  className="w-full h-9 sm:h-10 md:h-11 text-sm sm:text-base font-semibold"
                  onClick={handleStart}
                  disabled={!state.selectedMode && !(state.roomType === 'private' && state.roomCode.length >= 6)}
                  size="lg"
                >
                  {getCtaLabel()}
                </Button>

                {!state.selectedMode && !(state.roomType === 'private' && state.roomCode) && (
                  <p className="text-center text-xs sm:text-sm text-muted-foreground">
                    Select a game mode to continue
                  </p>
                )}

                {state.selectedMode && ['FLAG', 'FLAG_QUIZ'].includes(state.selectedMode) && !(state.roomType === 'private' && state.roomCode) && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowRoundsModal(true)}
                      className="text-xs sm:text-sm text-primary hover:underline font-medium"
                    >
                      🎯 {selectedRounds} Rounds, ⏱️ {selectedTimeout}s per round - Change?
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Public Rooms Sidebar - Only show for public room type */}
          {state.roomType === 'public' && (
            <div className="lg:col-span-1">
              <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
                <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        Live Rooms
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Join active public games
                      </CardDescription>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={fetchPublicRooms}
                      disabled={isRefreshing}
                      title="Refresh rooms"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 max-h-60 sm:max-h-80 overflow-y-auto">
                  {publicRooms.length > 0 ? (
                    <div className="space-y-2">
                      {publicRooms.map((room) => (
                        <div
                          key={room.id}
                          className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-border/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-xs sm:text-sm truncate">{room.host}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 rounded">
                                {GAME_MODES[room.mode]?.title || room.mode}
                              </span>
                              {(room as any).status === 'in_progress' && (
                                <span className="text-[10px] sm:text-xs bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded">
                                  Live
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs text-muted-foreground">
                              {room.players}/{room.maxPlayers} players
                            </span>
                            <div className="flex gap-1">
                              {(room as any).status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 sm:h-7 px-1.5 text-xs"
                                  onClick={() => {
                                    navigate(`/spectate/${room.id}`);
                                  }}
                                  title="Watch game"
                                >
                                  👁️
                                </Button>
                              )}
                              {room.players < room.maxPlayers && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 sm:h-7 px-2 text-xs"
                                  onClick={() => {
                                    setState(prev => ({ ...prev, roomCode: room.id, selectedMode: room.mode }));
                                    setTimeout(() => handleStart(), 0);
                                  }}
                                >
                                  <Play className="w-3 h-3 mr-0.5" />
                                  Join
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6">
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No active rooms
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Create a public room!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Rounds Modal */}
        <RoundsModal
          open={showRoundsModal}
          onClose={() => setShowRoundsModal(false)}
          onSelectRounds={(rounds) => {
            console.log('[LOBBY] Selected rounds:', rounds);
            setSelectedRounds(rounds);
          }}
          onSelectTimeout={(timeout) => {
            console.log('[LOBBY] Selected timeout:', timeout);
            setSelectedTimeout(timeout);
          }}
          isLoggedIn={isLoggedIn}
          selectedTimeout={selectedTimeout}
          selectedRounds={selectedRounds}
          onStart={handleStart}
        />
      </div>
    </div>
  );
};
