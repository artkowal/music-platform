import { api } from './axios';
import type { NotificationItem } from '@/context/NotificationContext';

export const notificationsApi = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: NotificationItem[] }>('/notifications');
    return response.data.data;
  },
  markAsRead: async (id: string) => {
    return await api.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    return await api.put('/notifications/read-all');
  }
};