import { api } from './axios';
import type { LoginData, RegisterData } from '@/types/Auth';
import type { User } from '@/types/User';

export const authApi = {
  login: async (data: LoginData) => {
    const response = await api.post<{ success: boolean; user: User }>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterData) => {
    const response = await api.post<{ success: boolean; user: User }>('/user/register', data);
    return response.data;
  },
  logout: async () => {
    return await api.post('/auth/logout');
  },
  checkUser: async () => {
    const response = await api.get<{ success: boolean; user: User }>('/auth/check');
    return response.data;
  }
};