import { renderHook } from '@testing-library/react';
import { usePlayers } from '../usePlayers';

describe('usePlayers', () => {
  it('should return empty array when no game state', () => {
    const { result } = renderHook(() => usePlayers({
      gameState: null,
      roomUpdate: null,
      username: 'testUser'
    }));

    expect(result.current.players).toEqual([]);
  });

  it('should transform game state scores to players array', () => {
    const gameState = {
      scores: { player1: 100, player2: 50 },
      player_colors: { player1: '#ff0000', player2: '#00ff00' }
    };

    const { result } = renderHook(() => usePlayers({
      gameState,
      roomUpdate: null,
      username: 'player1'
    }));

    expect(result.current.players).toHaveLength(2);
    expect(result.current.players[0].name).toBe('player1');
    expect(result.current.players[0].score).toBe(100);
    expect(result.current.players[0].isLeader).toBe(true);
    expect(result.current.players[0].isYou).toBe(true);
  });

  it('should sort players by score descending', () => {
    const gameState = {
      scores: { player1: 50, player2: 100, player3: 75 }
    };

    const { result } = renderHook(() => usePlayers({
      gameState,
      roomUpdate: null,
      username: 'player1'
    }));

    expect(result.current.players[0].score).toBe(100);
    expect(result.current.players[1].score).toBe(75);
    expect(result.current.players[2].score).toBe(50);
  });
});
