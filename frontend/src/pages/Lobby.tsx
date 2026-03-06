import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AudioManager from "@/lib/audioManager";
import { Button } from "@/components/ui/button";
import { ChevronLeft, LogOut, UserCircle, Settings, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GameConfig } from "@/types/game";
import { GameLobby } from "@/components/lobby";
import { getOrCreateGuestUsername } from "@/lib/guestUsername";

type GameMode = "FLAG" | "WORLD_MAP" | "CAPITAL_RUSH" | "LAST_STANDING" | "BORDER_LOGIC" | "SILHOUETTE" | "TEAM_BATTLE" | "EMOJI"; // "AUDIO" - TODO: Will be added later
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
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    const initAudio = () => {
      const bgMusicEnabled = localStorage.getItem('bgMusicEnabled') !== 'false';
      const audioMuted = localStorage.getItem('audioMuted') === 'true';
      if (bgMusicEnabled && !audioMuted) {
        const bgTrack = localStorage.getItem('bgMusicTrack') || '/Music/briworld-background-1.mp3';
        AudioManager.getInstance().setBackgroundMusic(bgTrack);
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    // Generate new guest username after logout
    getOrCreateGuestUsername();
    navigate("/");
  };

  return (
    <div className="h-screen bg-background flex flex-col p-2 sm:p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 sm:right-20 w-32 h-32 sm:w-64 sm:h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <div className="relative z-50 flex items-center justify-between w-full mb-2 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate("/leaderboard")}
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4" />
          </Button>
          {isLoggedIn && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => navigate("/profile")}
              >
                <UserCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Game Lobby Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <GameLobby />
      </div>
    </div>
  );
};

export default Lobby;
