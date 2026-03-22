import { useState } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BorderLogicModeProps {
    gameState: GameState;
    username: string;
    onSubmitAnswer: (answer: string) => void;
}

export function BorderLogicMode({ gameState, username, onSubmitAnswer }: BorderLogicModeProps) {
    const [answer, setAnswer] = useState('');

    const handleSubmit = () => {
        if (!answer.trim()) return;
        onSubmitAnswer(answer);
        setAnswer('');
    };

    // Get neighbors from backend question data
    const neighbors = gameState.question?.neighbors || [];

    if (!gameState.question) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-pulse">🧠</div>
                <p className="text-muted-foreground">Loading border puzzle...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-2 py-4 space-y-3">
            {/* Neighbors Display */}
            <Card className="glass-card p-3 md:p-6">
                <h2 className="text-base md:text-xl font-semibold text-muted-foreground text-center mb-3 md:mb-4">
                    This country borders:
                </h2>
                <div className="flex flex-wrap justify-center gap-2 max-h-[40vh] md:max-h-[35vh] overflow-y-auto">
                    {neighbors.map((neighbor, idx) => (
                        <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs md:text-base px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                        >
                            🌍 {neighbor}
                        </Badge>
                    ))}
                </div>
            </Card>

            {/* Question */}
            <Card className="glass-card p-3 md:p-6">
                <div className="text-center space-y-2 md:space-y-4">
                    <div className="text-4xl md:text-6xl">❓</div>
                    <h2 className="text-lg md:text-2xl font-bold">Which country is this?</h2>
                    <div className="text-xs md:text-sm text-muted-foreground">
                        Time remaining: {gameState.time_remaining}s
                    </div>
                </div>
            </Card>

            {/* Answer Input */}
            <Card className="glass-card p-3 md:p-4">
                <div className="flex gap-2">
                    <Input
                        key={gameState.current_round}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Name the country..."
                        className="text-sm md:text-lg h-10 md:h-14 border-blue-500/30 focus:ring-blue-500"
                        autoFocus
                    />
                    <Button
                        onClick={handleSubmit}
                        className="h-10 md:h-14 px-4 md:px-8 text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        disabled={!answer.trim()}
                    >
                        <span className="md:hidden">🧠</span>
                        <span className="hidden md:inline">🧠 Submit</span>
                    </Button>
                </div>
            </Card>

            {/* Hint Card */}
            <Card className="glass-card p-2 md:p-4 text-center">
                <p className="text-xs md:text-sm text-muted-foreground">
                    💡 Think about geography - which country shares borders with all these nations?
                </p>
            </Card>

        </div>
    );
}
