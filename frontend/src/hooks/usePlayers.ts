import { useState, useEffect, useMemo } from 'react';

interface UsePlayersProps {
  gameState: any;
  roomUpdate: any;
  username: string;
}

export const usePlayers = ({ gameState, roomUpdate, username }: UsePlayersProps) => {
  const [playerAvatars, setPlayerAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roomUpdate?.player_avatars) {
      setPlayerAvatars(prev => ({ ...prev, ...roomUpdate.player_avatars }));
    }
  }, [roomUpdate]);

  const players = useMemo(() => {
    if (gameState?.scores) {
      return Object.entries(gameState.scores)
        .map(([name, score]) => ({
          id: name,
          name,
          score: score as number,
          isYou: name === username,
          isLeader: false,
          color: (name === username ? 'correct' : 'opponent') as 'correct' | 'opponent',
          avatar: name.charAt(0).toUpperCase(),
          avatarUrl: playerAvatars[name],
          playerColor: gameState?.player_colors?.[name] || roomUpdate?.player_colors?.[name],
        }))
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, isLeader: i === 0 }));
    }

    if (roomUpdate?.players) {
      return roomUpdate.players
        .map((name: string) => ({
          id: name,
          name,
          score: gameState?.scores?.[name] || 0,
          isYou: name === username,
          isLeader: false,
          color: (name === username ? 'correct' : 'opponent') as 'correct' | 'opponent',
          avatar: name.charAt(0).toUpperCase(),
          avatarUrl: playerAvatars[name],
          playerColor: gameState?.player_colors?.[name] || roomUpdate?.player_colors?.[name],
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .map((p: any, i: number) => ({ ...p, isLeader: i === 0 }));
    }

    return [];
  }, [gameState, roomUpdate, username, playerAvatars]);

  return { players, playerAvatars };
};
