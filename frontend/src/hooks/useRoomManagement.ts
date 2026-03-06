import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameConfig } from '@/types/game';

interface UseRoomManagementProps {
  config: GameConfig;
  ws: WebSocket | null;
}

export const useRoomManagement = ({ config, ws }: UseRoomManagementProps) => {
  const navigate = useNavigate();

  const [roomCode] = useState(() => {
    const savedRoomCode = sessionStorage.getItem('currentRoomCode');
    const newCode = config.roomCode || savedRoomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    sessionStorage.setItem('currentRoomCode', newCode);
    return newCode;
  });

  const [isActualReconnect] = useState(() => {
    return !config.roomCode && !!sessionStorage.getItem('currentRoomCode');
  });

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'room_closed' || message.type === 'room_expired') {
          if (ws) ws.close();
          sessionStorage.removeItem('currentRoomCode');
          sessionStorage.removeItem('gameMode');
          sessionStorage.removeItem('roomType');
          sessionStorage.removeItem('rounds');
          sessionStorage.removeItem('mapMode');
          navigate('/lobby');
        }
      } catch (error) {
        // Ignore
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, navigate]);

  const leaveRoom = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'close_room' }));
      ws.close();
    }
    sessionStorage.removeItem('currentRoomCode');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('roomType');
    sessionStorage.removeItem('rounds');
    sessionStorage.removeItem('mapMode');
    navigate('/lobby');
  };

  return { roomCode, isActualReconnect, leaveRoom };
};
