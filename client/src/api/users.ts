import { api } from './axios';

export const usersApi = {
  search: async (query: string) => {
    const response = await api.get<{ success: boolean; emails: string[] }>(`/user/search?query=${query}`);
    return response.data.emails;
  },
  updateProfile: async (data: { first_name: string; last_name: string }) => {
    return await api.put('/user/profile', data);
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return await api.put('/user/password', data);
  }
};