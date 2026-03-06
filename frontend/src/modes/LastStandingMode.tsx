/**
 * LastStandingMode.tsx — "Last Keep Standing" game mode component.
 *
 * In this elimination-style mode, players must answer correctly or be
 * eliminated. The last player remaining wins. For single-player rooms,
 * an incorrect answer ends the game immediately.
 *
 * Features:
 * - Progress bar showing remaining active players
 * - Eliminated player visual indicators (skulls, gray styling)
 * - Auto-redirect to lobby on elimination in single-player mode
 * - Player status grid with live/eliminated states
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/** Props for the LastStandingMode component */
interface LastStandingModeProps {
    /** Current game state from the server */
    gameState: GameState;
    /** The local player's username */
    username: string;
    /** Callback to submit an answer to the server */
    onSubmitAnswer: (answer: string) => void;
}

export function LastStandingMode({ gameState, username, onSubmitAnswer }: LastStandingModeProps) {
    /** Current answer text typed by the player */
    const [answer, setAnswer] = useState('');
    /** Tracks which round the player has submitted an answer for (prevents double-submit) */
    const [submittedRound, setSubmittedRound] = useState<number | null>(null);
    /** Controls visibility of the elimination results banner */
    const [showResults, setShowResults] = useState(false);
    /** React Router navigation hook for redirecting to lobby */
    const navigate = useNavigate();

    /**
     * Submit the current answer to the server.
     * Records the round number to prevent re-submission in the same round.
     */
    const handleSubmit = () => {
        if (!answer.trim()) return;
        onSubmitAnswer(answer);
        setSubmittedRound(gameState.current_round);
        setAnswer('');
    };

    /** Whether the player has already submitted an answer this round */
    const hasSubmitted = submittedRound === gameState.current_round;
    /** Whether the local player has been eliminated */
    const isEliminated = gameState.eliminated_players?.[username] || false;
    /** Number of players still alive in the game */
    const activePlayers = gameState.active_players || Object.keys(gameState.scores || {}).length;
    /** Total number of players that started the game */
    const totalPlayers = Object.keys(gameState.scores || {}).length;
    /** Whether this is a single-player room */
    const isSingleRoom = gameState.room_type === 'SINGLE';

    /**
     * Effect: Handle elimination in single-player mode.
     *
     * When the player is eliminated in a SINGLE room, show the results
     * banner briefly then redirect to the lobby. This is done in useEffect
     * instead of the render body to avoid React state-update-during-render warnings.
     */
    useEffect(() => {
        if (isEliminated && isSingleRoom && !showResults) {
            /* Show the elimination banner */
            setShowResults(true);
            /* Auto-redirect to lobby after 3 seconds */
            const timer = setTimeout(() => {
                navigate('/lobby');
            }, 3000);
            /* Clean up the timer if component unmounts early */
            return () => clearTimeout(timer);
        }
    }, [isEliminated, isSingleRoom, showResults, navigate]);

    /* Loading state: show pulse animation while waiting for question data */
    if (!gameState.question) {
        return (
            <div className="text-center py-8 sm:py-12">
                <div className="text-5xl sm:text-6xl mb-4 animate-pulse">💀</div>
                <p className="text-muted-foreground text-sm sm:text-base">Preparing elimination round...</p>
            </div>
        );
    }

    /* Elimination results banner for single-player mode */
    if (showResults && isSingleRoom) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2">
                <Card className="glass-card p-8 sm:p-12 text-center space-y-3 sm:space-y-4 bg-red-500/10 border-red-500/30">
                    <div className="text-6xl sm:text-8xl">💀</div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-red-500">ELIMINATED!</h2>
                    <p className="text-base sm:text-lg text-muted-foreground">
                        You got it wrong and have been eliminated.
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Returning to lobby in 3 seconds...
                    </p>
                </Card>
            </div>
        );
    }

    /* Eliminated state for multiplayer: player watches remaining players */
    if (isEliminated) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2">
                {/* Eliminated banner */}
                <Card className="glass-card p-8 sm:p-12 text-center space-y-3 sm:space-y-4 bg-gray-500/10">
                    <div className="text-6xl sm:text-8xl">💀</div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-500">ELIMINATED</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        You've been knocked out! Watch the remaining players battle it out.
                    </p>
                </Card>

                {/* Remaining Players scoreboard */}
                <Card className="glass-card p-3 sm:p-4">
                    <div className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                        🎮 Players Remaining: {activePlayers}/{totalPlayers}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                        {/* List all players with eliminated status indicators */}
                        {Object.entries(gameState.scores || {}).map(([player, score]) => (
                            <div key={player} className="flex justify-between items-center text-xs sm:text-sm">
                                <span className={`flex items-center gap-1.5 sm:gap-2 ${gameState.eliminated_players?.[player] ? 'text-gray-500 line-through' : ''}`}>
                                    {/* Skull for eliminated, sparkle for active */}
                                    {gameState.eliminated_players?.[player] ? '💀' : '✨'}
                                    {player}
                                </span>
                                <span className="font-mono">{score}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    /* Active gameplay state: player can answer the current question */
    return (
        <div className="w-full max-w-3xl mx-auto space-y-3 px-2 py-4">
            {/* Status Bar — shows active player count and survival progress (only for multiplayer) */}
            {!isSingleRoom && (
                <Card className="glass-card p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                            <span className="text-lg sm:text-xl">💀</span> Last Standing
                        </span>
                        <Badge variant="secondary" className="text-xs sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
                            {activePlayers} players remaining
                        </Badge>
                    </div>
                    {/* Progress bar: percentage of players still alive */}
                    <Progress value={(activePlayers / totalPlayers) * 100} className="h-1.5 sm:h-2" />
                </Card>
            )}

            {/* Flag Display — the question flag image and warning prompt */}
            <Card className="glass-card overflow-hidden">
                <div className="w-full h-64 sm:h-80">
                    <div className="relative h-full flex flex-col">
                        {/* Flag Image */}
                        {gameState.question.flag_code && (
                            <div className="flex-1 p-4 sm:p-6 flex items-center justify-center min-h-0">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={`https://flagcdn.com/w640/${gameState.question.flag_code.toLowerCase()}.png`}
                                        alt="Flag"
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-2 border-white/10"
                                    />
                                </div>
                            </div>
                        )}
                        {/* Prompt */}
                        <div className="px-4 sm:px-6 pb-4 flex-shrink-0 text-center">
                            <h2 className="text-lg sm:text-xl font-bold">
                                Answer correctly or be eliminated!
                            </h2>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Time remaining: {gameState.time_remaining}s
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Answer Input — text field and submit button */}
            <Card className="glass-card p-3 sm:p-6 space-y-2 sm:space-y-4">
                <Input
                    /* Key on round number to auto-clear input between rounds */
                    key={gameState.current_round}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Your answer determines your survival..."
                    className="text-sm sm:text-lg h-10 sm:h-14 border-purple-500/30 focus:ring-purple-500"
                    autoFocus
                    /* Disable input after submitting to prevent double-submit */
                    disabled={hasSubmitted}
                />
                <Button
                    onClick={handleSubmit}
                    className="w-full h-10 sm:h-14 text-sm sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={hasSubmitted || !answer.trim()}
                >
                    {/* Show waiting state after submission */}
                    {hasSubmitted ? '⏳ Waiting for others...' : '🎯 Lock In Answer'}
                </Button>
            </Card>

            {/* Players Status Grid — visual grid of all player states */}
            <Card className="glass-card p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Player Status</div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {/* Each player shown with alive/eliminated indicator */}
                    {Object.entries(gameState.scores || {}).map(([player]) => (
                        <div
                            key={player}
                            className={`p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${gameState.eliminated_players?.[player]
                                ? 'bg-gray-500/20 text-gray-500'
                                : 'bg-green-500/20 text-green-500'
                                }`}
                        >
                            {gameState.eliminated_players?.[player] ? '💀' : '✅'}
                            {/* Bold styling for the local player's name */}
                            <span className={player === username ? 'font-bold' : ''}>
                                {player}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
