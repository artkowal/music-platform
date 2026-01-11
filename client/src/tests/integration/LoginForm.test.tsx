import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../pages/loginPage/components/LoginForm';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// komponent "myśli", że ma dostęp do kontekstu logowaniazw
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(), // Pusta funkcja mockująca logowanie
    isLoading: false,
    user: null,
  }),
}));

describe('LoginForm Integration', () => {
  it('powinien wyświetlić błędy walidacji przy pustym formularzu', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
    
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/niepoprawny adres email/i)).toBeInTheDocument();
    });
  });
});