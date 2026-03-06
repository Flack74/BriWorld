/**
 * TeamBattleMode.tsx — Team-based competitive game mode component.
 *
 * Players are split into Red and Blue teams. Each team competes to
 * answer questions correctly. Team scores are aggregated and displayed
 * side by side. Players can only submit once per round.
 *
 * Features:
 * - Red vs Blue team score cards with team membership
 * - Per-round submission lock (resets automatically each round)
 * - Team-colored submit button matching the player's team
 * - Question card with flag display
 */

import { useState, useEffect } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/** Props for the TeamBattleMode component */
interface TeamBattleModeProps {
  /** Current game state from the server */
  gameState: GameState;
  /** The local player's username */
  username: string;
  /** Callback to submit an answer to the server */
  onSubmitAnswer: (answer: string) => void;
}

export function TeamBattleMode({ gameState, username, onSubmitAnswer }: TeamBattleModeProps) {
  /** Current answer text typed by the player */
  const [answer, setAnswer] = useState('');
  /** Whether the player has submitted an answer this round */
  const [hasSubmitted, setHasSubmitted] = useState(false);

  /**
   * Effect: Reset the submission lock when a new round begins.
   *
   * Without this, hasSubmitted would stay true from the previous round
   * and the player couldn't submit in subsequent rounds.
   */
  useEffect(() => {
    setHasSubmitted(false);
  }, [gameState.current_round]);

  /**
   * Submit the current answer and lock the input for this round.
   * Does nothing if the input is empty/whitespace.
   */
  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setHasSubmitted(true);
    setAnswer('');
  };

  /** Destructure team battle state for easier access */
  const teamBattle = gameState.team_battle;
  /** Check which team the local player belongs to */
  const isRedTeam = teamBattle?.red_team?.includes(username);
  const isBlueTeam = teamBattle?.blue_team?.includes(username);

  /* Loading state: show spinner while waiting for question data */
  if (!gameState.question) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-5xl sm:text-6xl mb-4">⏳</div>
        <p className="text-muted-foreground text-sm sm:text-base">Loading next question...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-6 px-2">
      {/* Team Score Cards — Red vs Blue, side by side */}
      {teamBattle && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Red Team Score Card — highlighted if player is on red team */}
          <Card className={`glass-card p-3 sm:p-4 text-center border-2 ${isRedTeam ? 'border-red-500' : 'border-transparent'}`}>
            <div className="text-2xl sm:text-3xl font-bold text-red-500 mb-1 sm:mb-2">🔴</div>
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground">Red Team</div>
            <div className="text-2xl sm:text-3xl font-bold text-red-500">{teamBattle.red_score}</div>
            {/* Team member names */}
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
              {teamBattle.red_team?.join(', ')}
            </div>
          </Card>
          {/* Blue Team Score Card — highlighted if player is on blue team */}
          <Card className={`glass-card p-3 sm:p-4 text-center border-2 ${isBlueTeam ? 'border-blue-500' : 'border-transparent'}`}>
            <div className="text-2xl sm:text-3xl font-bold text-blue-500 mb-1 sm:mb-2">🔵</div>
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground">Blue Team</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-500">{teamBattle.blue_score}</div>
            {/* Team member names */}
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
              {teamBattle.blue_team?.join(', ')}
            </div>
          </Card>
        </div>
      )}

      {/* Question Card — flag image and country name to identify */}
      <Card className="glass-card p-4 sm:p-8 text-center space-y-3 sm:space-y-4">
        <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Team Question
        </div>
        {/* Flag image if available */}
        {gameState.question.flag_code && (
          <img
            src={`https://flagcdn.com/w320/${gameState.question.flag_code.toLowerCase()}.png`}
            alt="Flag"
            className="w-full max-w-xs sm:max-w-md mx-auto rounded-lg shadow-lg"
          />
        )}
        {/* Country name to guess */}
        <div className="text-3xl sm:text-5xl font-bold text-primary">
          {gameState.question.country_name}
        </div>
        {/* Time remaining */}
        <div className="text-xs sm:text-sm text-muted-foreground">
          Time remaining: {gameState.time_remaining}s
        </div>
      </Card>

      {/* Answer Input — colored based on player's team */}
      <Card className="glass-card p-3 sm:p-6 space-y-2 sm:space-y-3">
        <Input
          /* Key on round number to auto-clear between rounds */
          key={gameState.current_round}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type your team's answer..."
          className="text-sm sm:text-lg h-10 sm:h-12"
          autoFocus
          /* Disable after submitting this round */
          disabled={hasSubmitted}
        />
        <Button
          onClick={handleSubmit}
          /* Color the button based on the player's team */
          className={`w-full h-10 sm:h-12 text-sm sm:text-lg font-bold ${isRedTeam ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          disabled={hasSubmitted || !answer.trim()}
        >
          {/* Show waiting state after submission */}
          {hasSubmitted ? '⏳ Waiting for team...' : '🎯 Submit for Team'}
        </Button>
      </Card>

      {/* Team Members Roster — shows who is on each team */}
      {teamBattle && (
        <Card className="glass-card p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="text-xs sm:text-sm font-semibold">Team Members</div>
          <div className="grid grid-cols-2 gap-2">
            {/* Red Team member list */}
            <div className="space-y-1">
              <div className="text-[10px] sm:text-xs font-semibold text-red-500">🔴 Red Team</div>
              {teamBattle.red_team?.map((member) => (
                <div key={member} className={`text-[10px] sm:text-xs p-1.5 sm:p-2 bg-red-500/10 rounded ${member === username ? 'font-bold ring-1 ring-red-500/30' : ''}`}>
                  {member}
                </div>
              ))}
            </div>
            {/* Blue Team member list */}
            <div className="space-y-1">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-500">🔵 Blue Team</div>
              {teamBattle.blue_team?.map((member) => (
                <div key={member} className={`text-[10px] sm:text-xs p-1.5 sm:p-2 bg-blue-500/10 rounded ${member === username ? 'font-bold ring-1 ring-blue-500/30' : ''}`}>
                  {member}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
