import { render, fireEvent } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { GameOverModal } from '../GameOverModal';

describe('GameOverModal', () => {
  const mockProps = {
    show: true,
    gameStats: { correct: 8, incorrect: 2 },
    totalRounds: 10,
    onPlayAgain: jest.fn(),
    onBackToLobby: jest.fn()
  };

  it('should not render when show is false', () => {
    const { container } = render(<GameOverModal {...mockProps} show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render game stats correctly', () => {
    render(<GameOverModal {...mockProps} />);
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Score: 8 / 10')).toBeTruthy();
  });

  it('should call onPlayAgain when Play Again button clicked', () => {
    render(<GameOverModal {...mockProps} />);
    fireEvent.click(screen.getByText(/Play Again/i));
    expect(mockProps.onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it('should call onBackToLobby when Back to Lobby button clicked', () => {
    render(<GameOverModal {...mockProps} />);
    fireEvent.click(screen.getByText(/Back to Lobby/i));
    expect(mockProps.onBackToLobby).toHaveBeenCalledTimes(1);
  });
});
