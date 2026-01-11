import { render, screen } from '@testing-library/react';
import { LessonList } from '../../pages/dashboard/dashboardCoursePage/components/LessonList';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockLesson = any;

describe('Komponent LessonList', () => {
  it('poprawnie renderuje listę lekcji i ich statusy', () => {
    // Arrange
    const mockLessons: MockLesson[] = [
      { 
        lesson_id: 1, 
        title: 'Wstęp do pianina', 
        is_visible: 1, 
        progress: { is_completed: 0 }, // Nieukończone
        materials: [] 
      },
      { 
        lesson_id: 2, 
        title: 'Zaawansowane akordy', 
        is_visible: 1, 
        progress: { is_completed: 1 }, // Ukończone
        materials: [{}, {}] // 2 pliki
      }
    ];

    // Act
    render(
      <BrowserRouter>
         <LessonList 
            lessons={mockLessons} 
            courseId="100"       // String, nie number!
            accentColor="#EF4444" // Przykładowy kolor
            onRefresh={vi.fn()}   // Pusta funkcja
         />
      </BrowserRouter>
    );

    // Assert
    // 1. Sprawdzamy czy tytuły są na ekranie
    expect(screen.getByText('Wstęp do pianina')).toBeInTheDocument();
    expect(screen.getByText('Zaawansowane akordy')).toBeInTheDocument();
    
    // 2. Sprawdzamy czy lekcja 2 ma badge "Ukończono"
    expect(screen.getByText('Ukończono')).toBeInTheDocument();

    // 3. Sprawdzamy czy wyświetla liczbę plików (dla lekcji 2)
    expect(screen.getByText(/2 plików/i)).toBeInTheDocument();
  });

  it('wyświetla komunikat o braku materiałów, gdy lista jest pusta', () => {
    render(
      <BrowserRouter>
         <LessonList 
            lessons={[]} 
            courseId="100" 
            accentColor="#000000" 
            onRefresh={vi.fn()} 
         />
      </BrowserRouter>
    );
    expect(screen.getByText(/Ten kurs nie ma jeszcze żadnych materiałów/i)).toBeInTheDocument();
  });
});