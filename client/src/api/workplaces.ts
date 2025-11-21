import { api } from './axios';
import type { Workplace } from '@/types/Workplace';

export const workplacesApi = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: Workplace[] }>('/workplaces');
    return response.data.data;
  },
  getOne: async (id: string | number) => {
    const response = await api.get<{ success: boolean; data: Workplace }>(`/workplaces/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<Workplace>) => {
    return await api.post('/workplaces', data);
  },
  update: async (id: number, data: Partial<Workplace>) => {
    return await api.put(`/workplaces/${id}`, data);
  },
  delete: async (id: number) => {
    return await api.delete(`/workplaces/${id}`);
  },
  reorder: async (items: { workplace_id: number; sort_order: number }[]) => {
    return await api.put('/workplaces/reorder/all', { items });
  }
};