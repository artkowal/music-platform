/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/utils';
import type { User } from '@/types/User'; 

type LoginData = {
  email: string;
  password: string;
}

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
}

// Definicja tego, co przechowuje nasz kontekst
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

// Stworzenie kontekstu
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stworzenie Providera
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await api.get('/auth/check');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Błąd sprawdzania statusu:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserStatus();
  }, []);

  // Funkcja logowania
  const login = async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    if (response.data.success) {
      setUser(response.data.user);
    }
  };

  // Funkcja rejestracji
  const register = async (data: RegisterData) => {
    const response = await api.post('/user/register', data); // Używamy poprawnej ścieżki
    if (response.data.success) {
      setUser(response.data.user);
    }
  };

  // Funkcja wylogowania
  const logout = async () => {
    try {
      // Próbujemy wylogować się po stronie serwera
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorujemy błędy (np. 401), ponieważ celem jest 
      // i tak wylogowanie użytkownika po stronie klienta.
      console.error("Błąd podczas wylogowywania na serwerze:", error);
    } finally {
      // Ten blok wykona się ZAWSZE, niezależnie od tego,
      // czy 'await' powyżej się udało, czy rzuciło błędem.
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Własny hook, którego będziemy używać na stronach
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};