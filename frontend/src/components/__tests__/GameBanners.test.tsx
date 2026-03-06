import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { SuccessBanner, ErrorBanner, TimeoutBanner, AlreadyGuessedBanner } from '../GameBanners';

describe('GameBanners', () => {
  describe('SuccessBanner', () => {
    it('should not render when show is false', () => {
      const { container } = render(<SuccessBanner show={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with country name', () => {
      render(<SuccessBanner show={true} country="Brazil" />);
      expect(screen.getByText('Correct!')).toBeTruthy();
      expect(screen.getByText('Brazil')).toBeTruthy();
    });
  });

  describe('ErrorBanner', () => {
    it('should render correct message', () => {
      render(<ErrorBanner show={true} country="France" />);
      expect(screen.getByText('Wrong!')).toBeTruthy();
      expect(screen.getByText('It was France')).toBeTruthy();
    });
  });

  describe('TimeoutBanner', () => {
    it('should render timeout message', () => {
      render(<TimeoutBanner show={true} country="Japan" />);
      expect(screen.getByText("Time's Up!")).toBeTruthy();
      expect(screen.getByText('Japan')).toBeTruthy();
    });
  });

  describe('AlreadyGuessedBanner', () => {
    it('should render already guessed message', () => {
      render(<AlreadyGuessedBanner show={true} country="Canada" />);
      expect(screen.getByText('Already Guessed!')).toBeTruthy();
      expect(screen.getByText('Canada')).toBeTruthy();
    });
  });
});
