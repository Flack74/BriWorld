import { useState } from "react";
import { MessageCircle, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Leaderboard from "@/components/Leaderboard";
import GameChat from "@/components/GameChat";
import { GameChatMessage, LeaderboardPlayer } from "@/types/game";

interface MobileMultiplayerPanelsProps {
  players: LeaderboardPlayer[];
  chatMessages: GameChatMessage[];
  onSendMessage: (message: string) => void;
  showPlayerColors?: boolean;
  bottomOffsetClass?: string;
}

export const MobileMultiplayerPanels = ({
  players,
  chatMessages,
  onSendMessage,
  showPlayerColors = false,
  bottomOffsetClass = "bottom-20",
}: MobileMultiplayerPanelsProps) => {
  const [activePanel, setActivePanel] = useState<"leaderboard" | "chat" | null>(null);

  const togglePanel = (panel: "leaderboard" | "chat") => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  return (
    <>
      <div className="lg:hidden flex-shrink-0 px-2 pb-2 bg-background border-t border-border/30">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activePanel === "leaderboard" ? "default" : "outline"}
            className="w-full"
            onClick={() => togglePanel("leaderboard")}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
          <Button
            variant={activePanel === "chat" ? "default" : "outline"}
            className="w-full"
            onClick={() => togglePanel("chat")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {activePanel && (
        <div className={`lg:hidden fixed inset-x-2 ${bottomOffsetClass} top-20 z-40`}>
          <Card className="h-full p-3 shadow-2xl border-border/70 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                {activePanel === "leaderboard" ? "Leaderboard" : "Game Chat"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-[calc(100%-3rem)] overflow-hidden">
              {activePanel === "leaderboard" ? (
                <Leaderboard
                  players={players}
                  messageCount={chatMessages.length}
                  showPlayerColors={showPlayerColors}
                />
              ) : (
                <GameChat
                  messages={chatMessages}
                  onSendMessage={onSendMessage}
                  players={players.map((player) => player.name)}
                />
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
