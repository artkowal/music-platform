import { api } from './axios';
import type { Course } from '@/types/Course';
import type { Student } from '@/types/Student';
import type { CreateCoursePayload, UpdateCoursePayload } from '@/types/Course';

export const coursesApi = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: Course[] }>('/courses');
    return response.data.data;
  },
  getDetails: async (id: string | number) => {
    const response = await api.get<{ success: boolean; course: Course; students: Student[] }>(`/courses/${id}/details`);
    return response.data;
  },
  create: async (data: CreateCoursePayload) => {
    return await api.post('/courses', data);
  },
  update: async (id: string | number, data: UpdateCoursePayload) => {
    return await api.put(`/courses/${id}`, data);
  },
  delete: async (id: number) => {
    return await api.delete(`/courses/${id}`);
  },
  enrollStudent: async (courseId: string | number, email: string) => {
    return await api.post(`/courses/${courseId}/enroll`, { email });
  },
  removeStudent: async (courseId: string | number, studentId: number) => {
    return await api.delete(`/courses/${courseId}/students/${studentId}`);
  }
};