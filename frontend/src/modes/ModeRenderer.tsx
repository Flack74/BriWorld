/**
 * ModeRenderer.tsx — Central dispatcher for game mode UI rendering.
 *
 * This component acts as a routing layer that maps the current game mode
 * (from GameState) to the corresponding mode-specific React component.
 * It also renders shared UI elements like the mode header badge,
 * round counter, and scores panel that appear across all modes.
 */

import { GameState } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* Import all individual mode components */
import { EmojiMode } from './EmojiMode';
import { SilhouetteMode } from './SilhouetteMode';
import { FlagMode } from './FlagMode';
import { LastStandingMode } from './LastStandingMode';
import { BorderLogicMode } from './BorderLogicMode';
// import { AudioMode } from './AudioMode'; // TODO: Will be added later

/**
 * Props accepted by the ModeRenderer component.
 * These are passed down from the Game page which holds the WebSocket state.
 */
interface ModeRendererProps {
  /** Current game state from the server (scores, question, mode, etc.) */
  gameState: GameState;
  /** The local player's username, used to highlight their score */
  username: string;
  /** Callback to submit an answer string to the server */
  onSubmitAnswer: (answer: string) => void;
  /** Optional callback for sabotage card feature (future use) */
  onUseSabotageCard?: (cardType: string, target: string) => void;
  /** Optional callback to request a hint from the server */
  onRequestHint?: () => void;
  /** The current room code, passed to modes that need it */
  roomCode?: string;
  /** The room type (SINGLE, PRIVATE, PUBLIC), affects UI decisions */
  roomType?: string;
}

/**
 * ModeRenderer — Renders the correct game mode UI based on gameState.game_mode.
 *
 * Responsibilities:
 * 1. Display a loading state if gameState or game_mode is missing
 * 2. Switch to the correct mode component via an exhaustive switch statement
 * 3. Render shared elements: mode badge, round counter, and scores panel
 */
export function ModeRenderer({
  gameState,
  username,
  onSubmitAnswer,
  roomCode = '',
  roomType = 'SINGLE'
}: ModeRendererProps) {
  const showInlineScores = roomType === 'SINGLE';

  /* Safety check: show a loading spinner if gameState hasn't arrived yet */
  if (!gameState) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  /**
   * renderModeContent — Maps game_mode to the corresponding component.
   *
   * Each mode component is self-contained with its own state, input handling,
   * and UI. This function simply dispatches to the right one.
   * The default case logs an error for unrecognized modes (safety net).
   */
  const renderModeContent = () => {
    /* If game_mode hasn't been set by the server yet, show waiting state */
    if (!gameState?.game_mode) {
      return (
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-muted-foreground">Waiting for game mode...</p>
        </div>
      );
    }

    /* Exhaustive switch over all supported game modes */
    switch (gameState.game_mode) {
      case 'EMOJI':
        return <EmojiMode gameState={gameState} username={username} onSubmitAnswer={onSubmitAnswer} />;

      case 'SILHOUETTE':
        return <SilhouetteMode gameState={gameState} username={username} onSubmitAnswer={onSubmitAnswer} />;

      case 'LAST_STANDING':
        return <LastStandingMode gameState={gameState} username={username} onSubmitAnswer={onSubmitAnswer} />;

      case 'BORDER_LOGIC':
        return <BorderLogicMode gameState={gameState} username={username} onSubmitAnswer={onSubmitAnswer} />;

      // case 'AUDIO': // TODO: Will be added later
      //   return <AudioMode gameState={gameState} username={username} onSubmitAnswer={onSubmitAnswer} />;

      case 'FLAG':
        /* FlagMode also receives roomCode and roomType for conditional UI */
        return <FlagMode gameState={gameState} username={username} onSubmitAnswer={onSubmitAnswer} roomCode={roomCode} roomType={roomType} />;

      case 'WORLD_MAP':
        /* WORLD_MAP rendering is handled directly in Game.tsx (map view) */
        return (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-muted-foreground">This mode uses the map view.</p>
          </div>
        );

      default:
        /* Catch-all for any unrecognized mode — fail explicitly with error UI */
        console.error(`Unhandled game mode: ${gameState.game_mode}`);
        return (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-500 font-bold">Unsupported game mode: {gameState.game_mode}</p>
            <p className="text-muted-foreground">Please check that this mode is implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Mode Content — renders the mode-specific component */}
      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-4xl">
        {/* Mode Header — shows which mode is active and current round */}
        <div className="mb-4">
          {/* Check if this mode should have horizontal layout AND if it's single player or few players */}
          {['CAPITAL_RUSH', 'SILHOUETTE', 'BORDER_LOGIC', 'EMOJI', 'LAST_STANDING'].includes(gameState.game_mode || '') &&
            (showInlineScores || Object.keys(gameState.scores || {}).length <= 2) ? (
            /* Horizontal layout for single player or 1-2 players */
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {/* Center: Mode badge and round counter */}
              <div className="text-center">
                <Badge variant="outline" className="text-sm md:text-base px-3 py-1.5">
                  {gameState.game_mode?.replace('_', ' ')} MODE
                </Badge>
                {gameState.current_round && gameState.total_rounds && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Round {gameState.current_round} / {gameState.total_rounds}
                  </p>
                )}
              </div>
              {/* Center: Scores panel */}
              {showInlineScores && gameState.scores && Object.keys(gameState.scores).length > 0 && (
                <Card className="glass-card p-2 sm:p-3 min-w-[140px]">
                  <h3 className="font-bold mb-1 text-xs sm:text-sm">Scores</h3>
                  <div className="space-y-0.5">
                    {Object.entries(gameState.scores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([player, score], idx) => (
                        <div key={player} className="flex justify-between items-center text-xs">
                          <span className={player === username ? 'font-bold text-primary' : ''}>
                            {idx === 0 && '👑 '}
                            {player}
                          </span>
                          <span className="font-mono ml-2">{score}</span>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* Vertical layout for other modes or multiplayer with many players */
            <div className="text-center">
              <Badge variant="outline" className="text-sm md:text-base px-3 py-1.5">
                {gameState.game_mode?.replace('_', ' ')} MODE
              </Badge>
              {gameState.current_round && gameState.total_rounds && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Round {gameState.current_round} / {gameState.total_rounds}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Render the selected Mode-Specific Content */}
        {renderModeContent()}

        {/* Shared Scores Panel — for modes NOT using horizontal layout OR multiplayer with many players */}
        {showInlineScores &&
          (!['CAPITAL_RUSH', 'SILHOUETTE', 'BORDER_LOGIC', 'EMOJI', 'LAST_STANDING'].includes(gameState.game_mode || '') ||
          (roomType !== 'SINGLE' && Object.keys(gameState.scores || {}).length > 2)) &&
          gameState.scores && Object.keys(gameState.scores).length > 0 && (
            <Card className="glass-card p-3 sm:p-4 mt-4">
              <h3 className="font-bold mb-2 text-sm">Scores</h3>
              <div className="space-y-1">
                {Object.entries(gameState.scores)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([player, score], idx) => (
                    <div key={player} className="flex justify-between items-center text-xs sm:text-sm">
                      <span className={player === username ? 'font-bold text-primary' : ''}>
                        {idx === 0 && '👑 '}
                        {player}
                      </span>
                      <span className="font-mono">{score}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
      </div>
    </div>
  );
}
