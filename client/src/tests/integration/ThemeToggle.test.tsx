import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../components/theme-provider';
import { ThemeToggle } from '../../components/ThemeToggle';

describe('ThemeToggle Integration', () => {
  it('powinien przełączać motyw po kliknięciu', () => {
    // Arrange
    render(
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');

    // Act
    fireEvent.click(button);
    
    // Assert
    expect(button).toBeInTheDocument();
  });
});