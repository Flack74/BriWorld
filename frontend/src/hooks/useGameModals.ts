import { useState, useEffect } from 'react';
import AudioManager from '@/lib/audioManager';
import { GameState } from '@/types/game';

interface UseGameModalsProps {
  ws: WebSocket | null;
  gameState: GameState | null;
  isActualReconnect: boolean;
  gameStats: { correct: number; incorrect: number };
}

export const useGameModals = ({ ws, gameState, isActualReconnect, gameStats }: UseGameModalsProps) => {
  const [showGameOver, setShowGameOver] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [wasReconnected, setWasReconnected] = useState(false);

  // Handle reconnection
  useEffect(() => {
    if (!gameState) return;
    
    if (!wasReconnected && isActualReconnect && gameState.status === 'in_progress') {
      setIsReconnecting(true);
      setTimeout(() => {
        setIsReconnecting(false);
        setWasReconnected(true);
      }, 500);
    }
  }, [gameState, wasReconnected, isActualReconnect]);

  // Handle game completion
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'game_completed') {
          AudioManager.getInstance().playGameComplete();
          setTimeout(() => setShowGameOver(true), 100);
        }
      } catch (error) {
        // Ignore
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  // Check for all countries found (197)
  useEffect(() => {
    if (gameStats.correct >= 197) {
      setTimeout(() => setShowCongratsModal(true), 3500);
    }
  }, [gameStats.correct]);

  return {
    showGameOver,
    setShowGameOver,
    showCongratsModal,
    setShowCongratsModal,
    isReconnecting,
    wasReconnected,
    setWasReconnected,
  };
};
