import { api } from './axios';
import type { Comment, CommentNotification } from '@/types/Comment';

export const commentsApi = {
  getByLessonId: async (lessonId: number | string) => {
    const response = await api.get<{ success: boolean; data: Comment[] }>(`/comments/lesson/${lessonId}`);
    return response.data.data;
  },
  getUnreadCount: async (lessonId: number | string) => {
    const response = await api.get<{ success: boolean; count: number }>(`/comments/lesson/${lessonId}/unread`);
    return response.data.count;
  },
  markAsRead: async (lessonId: number | string) => {
    return await api.put(`/comments/lesson/${lessonId}/read`);
  },
  getNotifications: async () => {
    const response = await api.get<{ success: boolean; data: CommentNotification[] }>('/comments/notifications');
    return response.data.data;
  },
  create: async (lessonId: number, content: string) => {
    return await api.post('/comments', { lesson_id: lessonId, content });
  },
  update: async (commentId: number, content: string) => {
    return await api.put(`/comments/${commentId}`, { content });
  },
  delete: async (commentId: number) => {
    return await api.delete(`/comments/${commentId}`);
  }
};