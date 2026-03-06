import { useState, useEffect, useRef } from 'react';
import { GameConfig } from '@/types/game';
import AudioManager from '@/lib/audioManager';

interface UseGameStateProps {
  config: GameConfig;
  gameState: any;
  roomUpdate: any;
  ws: WebSocket | null;
}

export const useGameState = ({ config, gameState, roomUpdate, ws }: UseGameStateProps) => {
  const [startTime, setStartTime] = useState<number>();
  const [gameStats, setGameStats] = useState({ correct: 0, incorrect: 0 });
  const [guessedCountries, setGuessedCountries] = useState<string[]>([]);
  const [hasGuessedThisRound, setHasGuessedThisRound] = useState(false);
  const [roundHadCorrectAnswer, setRoundHadCorrectAnswer] = useState(false);
  const [countdownPlayed, setCountdownPlayed] = useState(false);

  // Reset round state when new round starts
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'round_started') {
          setStartTime(Date.now());
          setCountdownPlayed(false);
          setHasGuessedThisRound(false);
          setRoundHadCorrectAnswer(false);

          if (config.roomType !== 'SINGLE') {
            setGameStats({ correct: 0, incorrect: 0 });
            setGuessedCountries([]);
          }
        }

        if (message.type === 'answer_submitted') {
          const answerData = message.payload;

          if (answerData.is_correct) {
            setGameStats(prev => ({ ...prev, correct: prev.correct + 1 }));
            setRoundHadCorrectAnswer(true);

            if (answerData.player === config.username) {
              AudioManager.getInstance().playCorrectAnswer();
              AudioManager.getInstance().stopCountdown();
              setHasGuessedThisRound(true);
            }

            const countryCode = answerData.country_code || gameState?.question?.flag_code;
            if (countryCode) {
              setGuessedCountries(prev => [...prev, countryCode]);
            }
          } else if (!answerData.error?.includes('already')) {
            setGameStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
          }
        }

        // Handle country painted in map mode
        if (message.type === 'country_painted') {
          const paintData = message.payload;
          
          // Only increment for current user's paintings
          if (paintData.player === config.username) {
            setGameStats(prev => ({ ...prev, correct: prev.correct + 1 }));
            AudioManager.getInstance().playCorrectAnswer();
            
            const countryCode = paintData.country_code;
            if (countryCode && !guessedCountries.includes(countryCode)) {
              setGuessedCountries(prev => [...prev, countryCode]);
            }
          }
        }

        if (message.type === 'round_ended' && !roundHadCorrectAnswer) {
          setGameStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }

        if (message.type === 'restart_game') {
          setGameStats({ correct: 0, incorrect: 0 });
          setGuessedCountries([]);
        }
      } catch (error) {
        // Ignore
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, config, gameState, roundHadCorrectAnswer]);

  // Countdown sound effect
  useEffect(() => {
    if (!gameState) return;

    const timedModes = ['FLAG', 'CAPITAL_RUSH', 'SILHOUETTE', 'EMOJI', 'TEAM_BATTLE', 'LAST_STANDING', 'BORDER_LOGIC'];
    
    if (
      timedModes.includes(config.gameMode) &&
      gameState.time_remaining === 4 &&
      !countdownPlayed &&
      !hasGuessedThisRound
    ) {
      AudioManager.getInstance().playCountdown();
      setCountdownPlayed(true);
    }
  }, [gameState, config.gameMode, countdownPlayed, hasGuessedThisRound]);

  return {
    startTime,
    gameStats,
    guessedCountries,
    hasGuessedThisRound,
    setStartTime,
  };
};
