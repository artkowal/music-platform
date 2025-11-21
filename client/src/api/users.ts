import { api } from './axios';

export const usersApi = {
  search: async (query: string) => {
    const response = await api.get<{ success: boolean; emails: string[] }>(`/user/search?query=${query}`);
    return response.data.emails;
  }
};