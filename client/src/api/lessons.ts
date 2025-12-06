import { api } from './axios';
import type { Lesson } from '@/types/Lesson';

export interface ScheduleLessonPayload {
  course_id: number;
  title: string;
  description: string;
  scheduled_time: string; 
  duration_minutes: number;
  lesson_type: 'stationary' | 'online';
  repeat_weeks?: number;
}

interface ReportResponse {
  success: boolean;
  data: unknown;
  confirmations: {
    is_confirmed_by_student: number;
    is_confirmed_by_teacher: number;
  };
}

export const lessonsApi = {
  // CRUD (LESSONS)
  getByCourseId: async (courseId: number | string) => {
    const response = await api.get<{ success: boolean; data: Lesson[] }>(`/lessons/course/${courseId}`);
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
  },
  schedule: async (data: ScheduleLessonPayload) => {
    return await api.post('/meetings/schedule', data);
  },
  startLessonEarly: async (lessonId: number) => {
    return await api.patch(`/meetings/${lessonId}/start-early`);
  },
  finishLesson: async (lessonId: number) => {
    return await api.patch(`/meetings/${lessonId}/finish`);
  },
  getAvailability: async (courseId: number, date: string) => {
    const response = await api.get<{ success: boolean; busySlots: { start: string, duration: number }[] }>(
        `/meetings/availability?course_id=${courseId}&date=${date}`
    );
    return response.data.busySlots;
  },
  endLessonEarly: async (lessonId: number) => {
    return await api.patch(`/meetings/${lessonId}/finish`);
  },
  cancelLesson: async (lessonId: number) => {
    return await api.patch(`/meetings/${lessonId}/cancel`);
  },
  confirmLesson: async (lessonId: number) => {
    return await api.patch(`/meetings/${lessonId}/confirm`);
  },
  confirmAttendance: async (lessonId: number) => {
    return await api.patch(`/meetings/${lessonId}/confirm`);
  },
  
  getReport: async (lessonId: number) => {
    const response = await api.get<ReportResponse>(`/meetings/${lessonId}/report`);
    return response.data;
  },
  getZoomReport: async (lessonId: number) => {
    const response = await api.get<{ success: boolean, data: unknown }>(`/meetings/${lessonId}/zoom-report`);
    return response.data.data;
  }
};