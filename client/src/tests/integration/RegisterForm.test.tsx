import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterForm } from '../../pages/RegisterPage/components/RegisterForm'; 
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mockowanie useAuth 
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: vi.fn(),
    isLoading: false,
    user: null,
  }),
}));

describe('RegisterForm Input Flow', () => {
  it('pozwala użytkownikowi wpisać dane do formularza', () => {
    // Arrange
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/jan/i);
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);

    // Act
    fireEvent.change(nameInput, { target: { value: 'TestUser' } });
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

    // Assert
    expect(nameInput).toHaveValue('TestUser');
    expect(emailInput).toHaveValue('test@test.com');
  });
});