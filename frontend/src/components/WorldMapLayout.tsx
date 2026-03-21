import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { WorldMap } from '@/components/WorldMap';
import Leaderboard from '@/components/Leaderboard';
import GameChat from '@/components/GameChat';
import CountryInput from '@/components/CountryInput';
import MuteButton from '@/components/MuteButton';
import { useState, useEffect } from 'react';
import { MobileMultiplayerPanels } from '@/components/MobileMultiplayerPanels';
import { GameChatMessage, LeaderboardPlayer } from '@/types/game';

interface WorldMapLayoutProps {
  roomCode: string;
  roomType: string;
  gameStats: { correct: number; incorrect: number };
  guessedCountries: string[];
  userColor: string;
  paintedCountries: Record<string, string>;
  playerColors: Record<string, string>;
  players: LeaderboardPlayer[];
  chatMessages: GameChatMessage[];
  lastPaintEvent?: { player: string; country: string } | null;
  onLeave: () => void;
  onSubmitAnswer: (guess: string) => void;
  onSendMessage: (message: string) => void;
}

export const WorldMapLayout = ({
  roomCode,
  roomType,
  gameStats,
  guessedCountries,
  userColor,
  paintedCountries,
  playerColors,
  players,
  chatMessages,
  lastPaintEvent,
  onLeave,
  onSubmitAnswer,
  onSendMessage,
}: WorldMapLayoutProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const [bannerData, setBannerData] = useState<{ player: string; country: string } | null>(null);

  useEffect(() => {
    if (lastPaintEvent && roomType !== 'SINGLE') {
      setBannerData(lastPaintEvent);
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastPaintEvent, roomType]);

  return (
    <div className="min-h-screen bg-background lg:p-4 p-0 overflow-hidden">
      {/* Paint Banner */}
      {showBanner && bannerData && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg font-semibold">
            🎨 {bannerData.player} painted {bannerData.country}!
          </div>
        </div>
      )}
      <div className="max-w-[1600px] mx-auto h-screen flex flex-col overflow-hidden">
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
          <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-2 rounded-full font-bold">
            {gameStats.correct}/197 Countries
          </div>
          <MuteButton />
        </div>

        {/* Desktop 3-column layout */}
        <div className="hidden lg:flex flex-1 gap-4 p-4 min-h-0 overflow-hidden">
          <div className="w-80 overflow-hidden">
            <Leaderboard players={players} messageCount={chatMessages.length} showPlayerColors={true} />
          </div>
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 card-elevated overflow-hidden">
              <WorldMap
                countriesFound={gameStats.correct}
                recentGuesses={[]}
                foundCountryCodes={guessedCountries}
                currentCountry={undefined}
                userColor={userColor}
                paintedCountries={paintedCountries}
                playerColors={playerColors}
              />
            </div>
            <CountryInput onSubmit={onSubmitAnswer} />
          </div>
          <div className="w-80 overflow-hidden">
            {roomType !== 'SINGLE' && <GameChat messages={chatMessages} onSendMessage={onSendMessage} players={players.map((player) => player.name)} />}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden h-screen flex flex-col overflow-hidden">
          {roomType !== 'SINGLE' && (
            <div className="absolute top-14 right-2 z-10 bg-gradient-to-r from-blue-500 to-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              {gameStats.correct}/197
            </div>
          )}

          <div className="flex-1 min-h-0">
            <WorldMap
              countriesFound={gameStats.correct}
              recentGuesses={[]}
              foundCountryCodes={guessedCountries}
              currentCountry={undefined}
              userColor={userColor}
              paintedCountries={paintedCountries}
              playerColors={playerColors}
            />
          </div>

          <div className="flex-shrink-0 p-2 bg-background border-t border-border/30">
            <CountryInput onSubmit={onSubmitAnswer} />
          </div>

          {roomType !== 'SINGLE' && (
            <MobileMultiplayerPanels
              players={players}
              chatMessages={chatMessages}
              onSendMessage={onSendMessage}
              showPlayerColors={true}
              bottomOffsetClass="bottom-24"
            />
          )}
        </div>
      </div>
    </div>
  );
};
