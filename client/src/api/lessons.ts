import { api } from './axios';

export const lessonsApi = {
  getByCourseId: async (courseId: number | string) => {
    const response = await api.get(`/lessons/course/${courseId}`);
    return response.data.data;
  },
  create: async (formData: FormData) => {
    return await api.postForm('/lessons', formData);
  },
  update: async (lessonId: number, data: { title?: string, description?: string, duration_minutes?: number, is_visible?: boolean }) => {
    return await api.put(`/lessons/${lessonId}`, data);
  },
  delete: async (lessonId: number) => {
    return await api.delete(`/lessons/${lessonId}`);
  },
  addMaterials: async (lessonId: number, formData: FormData) => {
    return await api.postForm(`/lessons/${lessonId}/materials`, formData);
  },
  deleteMaterial: async (lessonId: number, materialId: number) => {
    return await api.delete(`/lessons/${lessonId}/materials/${materialId}`);
  },
  updateProgress: async (lessonId: number, timeSpent: number, isCompleted: boolean) => {
    return await api.post(`/lessons/${lessonId}/progress`, { time_spent: timeSpent, is_completed: isCompleted });
  }
};