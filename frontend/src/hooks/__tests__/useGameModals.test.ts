import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useGameModals } from '../useGameModals';

describe('useGameModals', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useGameModals({
      ws: null,
      gameState: null,
      isActualReconnect: false,
      gameStats: { correct: 0, incorrect: 0 }
    }));

    expect(result.current.showGameOver).toBe(false);
    expect(result.current.showCongratsModal).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.wasReconnected).toBe(false);
  });

  it('should show congrats modal when 197 countries found', async () => {
    const { result, rerender } = renderHook(
      ({ gameStats }) => useGameModals({
        ws: null,
        gameState: null,
        isActualReconnect: false,
        gameStats
      }),
      { initialProps: { gameStats: { correct: 196, incorrect: 0 } } }
    );

    rerender({ gameStats: { correct: 197, incorrect: 0 } });

    await waitFor(() => {
      expect(result.current.showCongratsModal).toBe(true);
    }, { timeout: 4000 });
  });
});
