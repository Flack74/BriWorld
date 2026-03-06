import { useState, useEffect, useRef } from 'react';

interface UseColorManagementProps {
  isConnected: boolean;
  gameMode: string;
  roomUpdate: any;
  username: string;
  roomCode: string;
  selectColor: (color: string) => void;
}

export const useColorManagement = ({
  isConnected,
  gameMode,
  roomUpdate,
  username,
  roomCode,
  selectColor,
}: UseColorManagementProps) => {
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#10b981');
  const colorSelectedRef = useRef(false);

  // Show color picker for WORLD_MAP when connected (only once)
  useEffect(() => {
    if (isConnected && gameMode === 'WORLD_MAP' && !showColorModal && !colorSelectedRef.current) {
      const hasServerColor = roomUpdate?.player_colors?.[username];
      if (!hasServerColor) {
        setShowColorModal(true);
      } else {
        colorSelectedRef.current = true;
      }
    }
  }, [isConnected, gameMode, roomUpdate, username]);

  // Update selected color from server confirmation
  useEffect(() => {
    if (roomUpdate?.player_colors?.[username]) {
      setSelectedColor(roomUpdate.player_colors[username]);
    }
  }, [roomUpdate, username]);

  const handleColorSelect = (color: string) => {
    colorSelectedRef.current = true;
    selectColor(color);
    sessionStorage.setItem(`color_${roomCode}_${username}`, color);
    setShowColorModal(false);
  };

  return {
    showColorModal,
    setShowColorModal,
    selectedColor,
    handleColorSelect,
  };
};
