import { cn } from '../../lib/utils';
import { describe, it, expect } from 'vitest';

describe('Funkcja cn (classnames)', () => {
  it('powinna łączyć klasy i usuwać kolizje Tailwind', () => {
    // Arrange
    const baseClass = 'p-4 bg-red-500';
    const overrideClass = 'bg-blue-500'; // Nadpisuje kolor

    // Act
    const result = cn(baseClass, overrideClass);

    // Assert
    expect(result).toContain('p-4');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500'); // Tailwind-merge powinno to usunąć
  });
});