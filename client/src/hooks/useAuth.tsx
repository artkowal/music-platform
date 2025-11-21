/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import type { User } from '@/types/User'; 
import type { LoginData, RegisterData } from '@/types/Auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const data = await authApi.checkUser();
        if (data.success) {
          setUser(data.user);
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

  const login = async (data: LoginData) => {
    const res = await authApi.login(data);
    if (res.success) {
      setUser(res.user);
    }
  };

  const register = async (data: RegisterData) => {
    const res = await authApi.register(data);
    if (res.success) {
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Błąd podczas wylogowywania na serwerze:", error);
    } finally {
      setUser(null);
    }
  };

  const value = { user, isLoading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};