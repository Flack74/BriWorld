import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should not render when show is false', () => {
    const { container } = render(<LoadingSpinner show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with default message', () => {
    render(<LoadingSpinner show={true} />);
    expect(screen.getByText('Loading next round...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner show={true} message="Custom loading..." />);
    expect(screen.getByText('Custom loading...')).toBeTruthy();
  });
});
