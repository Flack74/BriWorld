import { useEffect, useRef } from 'react';

interface UseGameAutoStartProps {
  isConnected: boolean;
  gameState: any;
  roomUpdate: any;
  gameMode: string;
  roomType: string;
  username: string;
  startGame: () => void;
  setWSMapMode: (mode: string) => void;
}

export const useGameAutoStart = ({
  isConnected,
  gameState,
  roomUpdate,
  gameMode,
  roomType,
  username,
  startGame,
  setWSMapMode,
}: UseGameAutoStartProps) => {
  const autoStartedRef = useRef(false);
  const mapGameStartedRef = useRef(false);

  // Auto-start for single-player timed modes
  useEffect(() => {
    const status = gameState?.status || roomUpdate?.status;
    const autoStartModes = ['FLAG', 'CAPITAL_RUSH', 'SILHOUETTE', 'EMOJI', 'TEAM_BATTLE', 'LAST_STANDING', 'BORDER_LOGIC'];
    
    if (
      isConnected &&
      autoStartModes.includes(gameMode) &&
      roomType === 'SINGLE' &&
      !autoStartedRef.current &&
      (status === 'waiting' || !status) // Also trigger if status not set yet
    ) {
      console.log('[AUTO-START] Triggering game start for', gameMode);
      autoStartedRef.current = true;
      // Small delay to ensure connection is stable
      setTimeout(() => {
        startGame();
      }, 500);
    }
  }, [isConnected, gameMode, roomType, gameState, roomUpdate, startGame]);

  // Auto-start for World Map mode
  useEffect(() => {
    if (gameMode !== 'WORLD_MAP' || !roomUpdate || mapGameStartedRef.current) return;

    const hasColor = roomUpdate.player_colors?.[username];
    const isOwner = roomType === 'SINGLE' || roomUpdate.owner === username;

    if (hasColor && isOwner && roomUpdate.status === 'waiting') {
      mapGameStartedRef.current = true;
      setWSMapMode('FREE');
      setTimeout(() => startGame(), 500);
    }
  }, [roomUpdate, gameMode, roomType, username, startGame, setWSMapMode]);
};
