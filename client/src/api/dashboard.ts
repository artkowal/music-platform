import { api } from './axios';
import type { DashboardData } from '@/types/Dashboard';

export const dashboardApi = {
  getData: async () => {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return response.data.data;
  }
};