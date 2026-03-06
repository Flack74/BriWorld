import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import GameChat from '@/components/GameChat';
import MuteButton from '@/components/MuteButton';
import { ModeRenderer } from '@/modes/ModeRenderer';

interface QuizModeLayoutProps {
  roomCode: string;
  roomType: string;
  gameState: any;
  username: string;
  players: any[];
  chatMessages: any[];
  onLeave: () => void;
  onSubmitAnswer: (answer: string) => void;
  onSendMessage: (message: string) => void;
}

export const QuizModeLayout = ({
  roomCode,
  roomType,
  gameState,
  username,
  players,
  chatMessages,
  onLeave,
  onSubmitAnswer,
  onSendMessage,
}: QuizModeLayoutProps) => {
  return (
    <div className="h-screen bg-background lg:p-4 p-0 overflow-hidden">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between lg:p-4 p-2 bg-card/50 backdrop-blur border-b border-border/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:h-10 lg:w-10 h-8 w-8" onClick={onLeave}>
              <ChevronLeft className="lg:w-5 lg:h-5 w-4 h-4" />
            </Button>
            {roomType !== 'SINGLE' && (
              <div className="font-bold lg:text-lg text-base">{roomCode}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="lg:text-sm text-xs font-medium">
                {gameState?.current_round || 1}/{gameState?.total_rounds || 10}
              </span>
            </div>
            {gameState?.game_mode !== 'WORLD_MAP' && gameState?.time_remaining !== undefined && gameState.time_remaining > 0 && (
              <div
                className={`px-3 py-1 rounded-full font-bold lg:text-lg text-base ${
                  gameState.time_remaining <= 5
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-orange-500 text-white'
                }`}
              >
                {gameState.time_remaining}s
              </div>
            )}
            <MuteButton />
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:flex flex-1 gap-4 p-4 min-h-0 overflow-hidden">
          {roomType !== 'SINGLE' && (
            <div className="w-80 flex-shrink-0 overflow-hidden">
              <Leaderboard players={players} messageCount={chatMessages.length} />
            </div>
          )}

          <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto">
            <ModeRenderer
              gameState={gameState}
              username={username}
              roomCode={roomCode}
              roomType={roomType}
              onSubmitAnswer={onSubmitAnswer}
            />
          </div>

          {roomType !== 'SINGLE' && (
            <div className="w-80 flex-shrink-0 overflow-hidden">
              <GameChat messages={chatMessages} onSendMessage={onSendMessage} />
            </div>
          )}
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden flex flex-col h-full overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-2 overflow-y-auto min-h-0">
            <ModeRenderer
              gameState={gameState}
              username={username}
              roomCode={roomCode}
              roomType={roomType}
              onSubmitAnswer={onSubmitAnswer}
            />
          </div>

          {roomType !== 'SINGLE' && (
            <>
              <div className="flex-shrink-0 px-3 pb-2">
                <div className="bg-card/50 backdrop-blur rounded-lg border border-border/30 p-2 max-h-[20vh] flex flex-col">
                  <h3 className="text-xs font-bold mb-2 flex items-center gap-1 flex-shrink-0">
                    <span>🏆</span> Leaderboard
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                    {players.map((player, idx) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/30"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="flex-shrink-0">
                            {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                          </span>
                          <span className={`truncate ${player.isYou ? 'font-bold' : ''}`}>
                            {player.name}
                          </span>
                        </div>
                        <span className="font-bold flex-shrink-0 ml-2">{player.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-3 pb-3 h-28">
                <div className="bg-card/50 backdrop-blur rounded-lg border border-border/30 p-2 h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mb-1">
                    {chatMessages.slice(-5).map((msg) => (
                      <div key={msg.id} className="text-xs p-1.5 rounded bg-muted/20 break-words">
                        <span className="font-semibold">{msg.sender}:</span>
                        <span className="ml-1">{msg.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      Open Chat
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
