import { useState, useEffect, useMemo } from 'react';
import { GameState, LeaderboardPlayer, RoomUpdate } from '@/types/game';

interface UsePlayersProps {
  gameState: GameState | null;
  roomUpdate: RoomUpdate | null;
  username: string;
}

export const usePlayers = ({ gameState, roomUpdate, username }: UsePlayersProps) => {
  const [playerAvatars, setPlayerAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    const snapshotAvatars = gameState?.player_avatars;
    const roomAvatars = roomUpdate?.player_avatars;

    if (snapshotAvatars || roomAvatars) {
      setPlayerAvatars(prev => ({
        ...prev,
        ...(snapshotAvatars || {}),
        ...(roomAvatars || {}),
      }));
    }
  }, [gameState?.player_avatars, roomUpdate?.player_avatars]);

  const players = useMemo<LeaderboardPlayer[]>(() => {
    const mode = gameState?.game_mode || roomUpdate?.game_mode;
    const paintedCountries = gameState?.painted_countries || {};

    let scores = gameState?.scores || roomUpdate?.scores;

    if (mode === 'WORLD_MAP') {
      const countryCounts = Object.values(paintedCountries).reduce<Record<string, number>>(
        (acc, owner) => {
          acc[owner] = (acc[owner] || 0) + 1;
          return acc;
        },
        {},
      );
      const playerNames = new Set<string>([
        ...Object.keys(scores || {}),
        ...(roomUpdate?.players || []),
      ]);

      if (Object.keys(countryCounts).length > 0) {
        scores = Object.fromEntries(
          Array.from(playerNames).map((name) => [name, countryCounts[name] || 0]),
        );
      } else if (scores) {
        scores = Object.fromEntries(
          Object.entries(scores).map(([name, score]) => [name, Math.round((score as number) / 10)]),
        );
      }
    }

    if (scores) {
      return Object.entries(scores)
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
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, isLeader: i === 0 }));
    }

    return [];
  }, [gameState, roomUpdate, username, playerAvatars]);

  return { players, playerAvatars };
};
