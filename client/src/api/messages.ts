import { api } from './axios';
import type { Message, MessageNotification } from '@/types/Message';

export const messagesApi = {
  getByLessonId: async (lessonId: number | string) => {
    const response = await api.get<{ success: boolean; data: Message[] }>(`/messages/lesson/${lessonId}`);
    return response.data.data;
  },
  getUnreadCount: async (lessonId: number | string) => {
    const response = await api.get<{ success: boolean; count: number }>(`/messages/lesson/${lessonId}/unread`);
    return response.data.count;
  },
  markAsRead: async (lessonId: number | string) => {
    return await api.put(`/messages/lesson/${lessonId}/read`);
  },
  getNotifications: async () => {
    const response = await api.get<{ success: boolean; data: MessageNotification[] }>('/messages/notifications');
    return response.data.data;
  },
  create: async (lessonId: number, content: string) => {
    return await api.post('/messages', { lesson_id: lessonId, content });
  },
  update: async (messageId: number, content: string) => {
    return await api.put(`/messages/${messageId}`, { content });
  },
  delete: async (messageId: number) => {
    return await api.delete(`/messages/${messageId}`);
  }
};