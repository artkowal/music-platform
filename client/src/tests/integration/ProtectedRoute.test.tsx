import { render, screen } from '@testing-library/react';
import  ProtectedRoute  from '../../components/layouts/ProtectedRoute';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '../../hooks/useAuth';

// Mockujemy useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Komponent ProtectedRoute (Bezpieczeństwo)', () => {
  it('blokuje dostęp i przekierowuje na /login niezalogowanego użytkownika', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ user: null, isLoading: false });

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Strona Logowania</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Tajny Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert: Użytkownik powinien zobaczyć "Strona Logowania", a NIE "Tajny Panel"
    expect(screen.getByText('Strona Logowania')).toBeInTheDocument();
    expect(screen.queryByText('Tajny Panel')).not.toBeInTheDocument();
  });

  it('udziela dostępu zalogowanemu użytkownikowi', () => {
    // Arrange:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ user: { id: 1, role: 'student' }, isLoading: false });

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Tajny Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText('Tajny Panel')).toBeInTheDocument();
  });
});