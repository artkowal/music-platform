import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/badge';

describe('Komponent Badge', () => {
  it('renderuje poprawnie wariant default', () => {
    // Arrange
    const label = "Status";
    // Act
    render(<Badge variant="default">{label}</Badge>);
    // Assert
    expect(screen.getByText(label)).toHaveClass('bg-primary');
  });
});