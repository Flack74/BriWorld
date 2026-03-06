import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, ArrowLeftRight } from 'lucide-react';

interface TeamBattleWaitingRoomProps {
  roomCode: string;
  username: string;
  players: string[];
  owner: string;
  teamBattle?: {
    red_team: string[];
    blue_team: string[];
    red_score: number;
    blue_score: number;
  };
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSwitchTeam: (team: 'RED' | 'BLUE') => void;
}

export const TeamBattleWaitingRoom = ({
  roomCode,
  username,
  players,
  owner,
  teamBattle,
  onStartGame,
  onLeaveRoom,
  onSwitchTeam,
}: TeamBattleWaitingRoomProps) => {
  const navigate = useNavigate();
  const isOwner = username === owner;
  const canStart = players.length >= 2 && players.length <= 10;

  const redTeam = teamBattle?.red_team || [];
  const blueTeam = teamBattle?.blue_team || [];
  const myTeam = redTeam.includes(username) ? 'RED' : blueTeam.includes(username) ? 'BLUE' : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onLeaveRoom}
            className="h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Team Battle</h1>
            <p className="text-muted-foreground">Room: {roomCode}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Team Battle Info */}
        <div className="bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 border border-border/50 rounded-xl p-6 mb-6">
          <div className="text-center space-y-2">
            <div className="text-4xl">🤝</div>
            <h2 className="text-2xl font-bold">Red vs Blue</h2>
            <p className="text-muted-foreground">
              Players are automatically assigned to teams. Work together to vote on the correct answer!
            </p>
          </div>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Red Team */}
          <div className={`bg-gradient-to-br ${
            myTeam === 'RED' 
              ? 'from-red-600/40 to-red-800/40 border-red-500' 
              : 'from-red-900/20 to-red-950/20 border-red-700/30'
          } border-2 rounded-xl p-6 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">🔴</div>
                <h3 className="text-2xl font-bold text-red-300">RED TEAM</h3>
                {myTeam === 'RED' && (
                  <div className="text-sm text-red-400 mt-1">Your Team</div>
                )}
              </div>
              {myTeam !== 'RED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSwitchTeam('RED')}
                  className="border-red-500/50 hover:bg-red-500/20 hover:border-red-500"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1" />
                  Join
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {redTeam.length === 0 ? (
                <div className="text-center text-red-400/50 py-4">
                  Waiting for players...
                </div>
              ) : (
                redTeam.map((player) => (
                  <div
                    key={player}
                    className={`bg-red-900/30 border border-red-700/30 rounded-lg p-3 ${
                      player === username ? 'ring-2 ring-red-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                          {player.charAt(0).toUpperCase()}
                        </div>
                        <span className={`${player === username ? 'font-bold' : ''}`}>
                          {player}
                        </span>
                      </div>
                      {player === owner && (
                        <span className="text-xs bg-red-700/50 px-2 py-1 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blue Team */}
          <div className={`bg-gradient-to-br ${
            myTeam === 'BLUE' 
              ? 'from-blue-600/40 to-blue-800/40 border-blue-500' 
              : 'from-blue-900/20 to-blue-950/20 border-blue-700/30'
          } border-2 rounded-xl p-6 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="text-4xl mb-2">🔵</div>
                <h3 className="text-2xl font-bold text-blue-300">BLUE TEAM</h3>
                {myTeam === 'BLUE' && (
                  <div className="text-sm text-blue-400 mt-1">Your Team</div>
                )}
              </div>
              {myTeam !== 'BLUE' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSwitchTeam('BLUE')}
                  className="border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1" />
                  Join
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {blueTeam.length === 0 ? (
                <div className="text-center text-blue-400/50 py-4">
                  Waiting for players...
                </div>
              ) : (
                blueTeam.map((player) => (
                  <div
                    key={player}
                    className={`bg-blue-900/30 border border-blue-700/30 rounded-lg p-3 ${
                      player === username ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {player.charAt(0).toUpperCase()}
                        </div>
                        <span className={`${player === username ? 'font-bold' : ''}`}>
                          {player}
                        </span>
                      </div>
                      {player === owner && (
                        <span className="text-xs bg-blue-700/50 px-2 py-1 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-card/50 backdrop-blur border border-border/30 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{players.length}</div>
              <div className="text-xs text-muted-foreground">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{redTeam.length} vs {blueTeam.length}</div>
              <div className="text-xs text-muted-foreground">Team Balance</div>
            </div>
            <div>
              <div className="text-2xl font-bold">20s</div>
              <div className="text-xs text-muted-foreground">Per Round</div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        {isOwner ? (
          <Button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-700 hover:via-purple-700 hover:to-blue-700"
          >
            <Play className="w-5 h-5 mr-2" />
            {!canStart && players.length < 2 && 'Need at least 2 players'}
            {!canStart && players.length > 10 && 'Maximum 10 players'}
            {canStart && 'Start Team Battle'}
          </Button>
        ) : (
          <div className="text-center p-4 bg-muted/30 rounded-xl">
            <p className="text-muted-foreground">
              Waiting for {owner} to start the game...
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
          <p>💡 Tip: Click "Join" to switch teams before the game starts</p>
          <p>🎯 Each player votes, and the majority answer is submitted</p>
          <p>🏆 Both teams can score points in the same round</p>
        </div>
      </div>
    </div>
  );
};
