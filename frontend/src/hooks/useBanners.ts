import { useState, useEffect } from 'react';

interface UseBannersProps {
  ws: WebSocket | null;
  username: string;
}

export const useBanners = ({ ws, username }: UseBannersProps) => {
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showTimeoutBanner, setShowTimeoutBanner] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; country: string } | null>(null);
  const [timeoutCountry, setTimeoutCountry] = useState<string>('');
  const [hasAnsweredCorrectlyThisRound, setHasAnsweredCorrectlyThisRound] = useState(false);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        // Reset round state when new round starts
        if (message.type === 'round_started') {
          setHasAnsweredCorrectlyThisRound(false);
        }

        // Only show success banner for correct answers
        if (message.type === 'answer_submitted') {
          const answerData = message.payload;
          
          if (answerData.is_correct && answerData.player === username) {
            setHasAnsweredCorrectlyThisRound(true);
            setLastAnswer({
              correct: true,
              country: answerData.country_name,
            });
            setShowSuccessBanner(true);
            setTimeout(() => setShowSuccessBanner(false), 2000);
          }
        }

        // Show timeout banner only when timer expires AND player hasn't answered correctly
        if (message.type === 'round_ended') {
          if (!hasAnsweredCorrectlyThisRound) {
            setTimeoutCountry(message.payload.correct_answer);
            setShowTimeoutBanner(true);
            setTimeout(() => setShowTimeoutBanner(false), 2000);
          }
          setLastAnswer(null);
        }
      } catch (error) {
        // Ignore
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, username, hasAnsweredCorrectlyThisRound]);

  return {
    showSuccessBanner,
    showTimeoutBanner,
    lastAnswer,
    timeoutCountry,
  };
};
