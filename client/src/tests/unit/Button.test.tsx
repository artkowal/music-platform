import { render, screen } from '@testing-library/react';
import { Button } from '../../components/ui/button';
import { describe, it, expect } from 'vitest';

describe('Komponent Button', () => {
  it('powinien wyrenderować przycisk z przekazanym tekstem', () => {
    // Arrange
    const buttonText = 'Kliknij mnie';

    // Act
    render(<Button>{buttonText}</Button>);

    // Assert
    const buttonElement = screen.getByRole('button', { name: buttonText });
    expect(buttonElement).toBeInTheDocument();
  });
});