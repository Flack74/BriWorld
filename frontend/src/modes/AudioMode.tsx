import { useState, useRef } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AudioModeProps {
    gameState: GameState;
    username: string;
    onSubmitAnswer: (answer: string) => void;
}

export function AudioMode({ gameState, username, onSubmitAnswer }: AudioModeProps) {
    const [answer, setAnswer] = useState('');
    const [submittedRound, setSubmittedRound] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleSubmit = () => {
        if (!answer.trim()) return;
        onSubmitAnswer(answer);
        setSubmittedRound(gameState.current_round);
        setAnswer('');
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const hasSubmitted = submittedRound === gameState.current_round;
    const audioData = gameState.audio;
    const anthemUrl = audioData?.anthem_url || '/Music/anthem-sample.mp3';

    if (!gameState.question) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-bounce">🎵</div>
                <p className="text-muted-foreground animate-pulse">Loading audio challenge...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 relative">
            {/* Background Animations */}
            <div className="absolute top-10 -left-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -top-10 -right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            {/* Mode Header */}
            <Card className="glass-card p-4 border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-rose-500/10 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl animate-bounce">🎵</span>
                        <div>
                            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">Audio Challenge</span>
                            <div className="text-xs text-muted-foreground font-medium">Guess the Anthem</div>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-pink-500/50 text-pink-600 bg-pink-500/10 px-3 py-1">
                        Round {gameState.current_round}
                    </Badge>
                </div>
            </Card>

            {/* Audio Player */}
            <Card className="glass-card-strong p-8 text-center space-y-8 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent pointer-events-none"></div>

                <div className="text-sm font-medium text-pink-600/80 uppercase tracking-widest">
                    Now Playing
                </div>

                {/* Visual Audio Indicator */}
                <div className="flex justify-center items-end gap-1.5 h-32 w-full max-w-sm mx-auto">
                    {[...Array(24)].map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-3 rounded-t-full transition-all duration-100 ease-in-out bg-gradient-to-t from-pink-600 to-purple-500 ${isPlaying ? 'opacity-100 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'opacity-40 h-2'}`}
                            style={{
                                height: isPlaying
                                    ? `${Math.max(10, Math.random() * 100)}%`
                                    : '10%',
                                animationDelay: `${idx * 50}ms`
                            }}
                        />
                    ))}
                </div>

                {/* Play Button */}
                <div className="relative inline-block">
                    {isPlaying && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-pink-500 opacity-20 scale-150"></div>
                    )}
                    <Button
                        onClick={togglePlay}
                        size="lg"
                        className={`w-28 h-28 rounded-full text-5xl transition-all shadow-2xl ${isPlaying
                            ? 'bg-gradient-to-br from-pink-600 to-purple-700 hover:scale-95 shadow-pink-500/50'
                            : 'bg-gradient-to-br from-pink-500 to-rose-500 hover:scale-105 hover:shadow-pink-500/40'
                            }`}
                    >
                        {isPlaying ? '⏸️' : '▶️'}
                    </Button>
                </div>

                <audio
                    ref={audioRef}
                    src={anthemUrl}
                    onEnded={() => setIsPlaying(false)}
                    autoPlay
                />

                <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground bg-white/50 dark:bg-black/20 py-1.5 px-4 rounded-full w-fit mx-auto backdrop-blur-md">
                    <span className="animate-spin-slow">⏳</span>
                    Time remaining: <span className="text-pink-600 font-bold">{gameState.time_remaining}s</span>
                </div>
            </Card>

            {/* Answer Input */}
            <Card className="glass-card p-6 space-y-4 relative z-10">
                <Input
                    key={gameState.current_round}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Which country's anthem is this?"
                    className="text-lg h-16 border-pink-500/30 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 pl-4 transition-all shadow-inner"
                    autoFocus
                    disabled={hasSubmitted}
                />
                <Button
                    onClick={handleSubmit}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.01]"
                    disabled={hasSubmitted || !answer.trim()}
                >
                    {hasSubmitted ? '⏳ Analyzing...' : '🎵 identifying Anthem'}
                </Button>
            </Card>

            {/* Hint */}
            <Card className="glass-card p-4 text-center text-sm font-medium text-muted-foreground border-purple-500/20 relative z-10">
                <span className="mr-2">💡</span> Listen closely to the instruments and tempo for cultural clues!
            </Card>

            {/* Scores */}
            {gameState.scores && (
                <Card className="glass-card p-4 relative z-10">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2 tracking-widest">
                        <span>🏆</span> Leaderboard
                    </div>
                    <div className="space-y-2">
                        {Object.entries(gameState.scores)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([player, score], idx) => (
                                <div key={player} className={`flex justify-between items-center text-sm p-2 rounded-lg transition-colors ${player === username ? 'bg-pink-500/10 border border-pink-500/20' : 'hover:bg-muted/50'}`}>
                                    <span className={`${player === username ? 'font-bold text-pink-600' : ''} flex items-center gap-2`}>
                                        <span className="text-base">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                                        {player}
                                    </span>
                                    <span className="font-mono font-bold text-lg">{score}</span>
                                </div>
                            ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
