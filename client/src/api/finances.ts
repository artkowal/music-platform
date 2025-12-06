import { api } from './axios';

export interface WorkplaceStats {
  workplace_id: number;
  name: string;
  color_hex: string;
  payment_type: 'per_lesson' | 'monthly' | 'none';
  payment_amount: number | null;
  completed_count: number;
  online_count: number;
  stationary_count: number;
  pending_count: number;
  cancelled_count: number;
}

export const financesApi = {
  getMonthlyStats: async (month: number, year: number) => {
    const response = await api.get<{ success: boolean; data: WorkplaceStats[] }>(
      `/finances/monthly?month=${month}&year=${year}`
    );
    return response.data.data;
  }
};