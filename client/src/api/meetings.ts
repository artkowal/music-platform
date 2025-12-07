import { api } from './axios';
import type { Meeting } from '@/types/Meeting';

export interface ScheduleMeetingPayload {
  course_id: number;
  lesson_id?: number | null;
  title: string;
  description: string;
  scheduled_time: string; 
  duration_minutes: number;
  type: 'stationary' | 'online';
  repeat_weeks?: number;
}

interface ReportResponse {
  success: boolean;
  report: unknown;
  confirmations: {
    is_confirmed_by_student: number;
    is_confirmed_by_teacher: number;
  };
}

export interface UnconfirmedMeeting {
  meeting_id: number;
  title: string;
  scheduled_time: string;
  duration_minutes: number;
  teacher_name: string;
  teacher_lastname: string;
}

export const meetingsApi = {
  schedule: async (data: ScheduleMeetingPayload) => {
    return await api.post('/meetings/schedule', data);
  },
  getCalendar: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const response = await api.get<{ success: boolean; data: Meeting[] }>(`/meetings/calendar?${params.toString()}`);
    return response.data.data;
  },
  getAvailability: async (courseId: number, date: string) => {
    const response = await api.get<{ success: boolean; busySlots: { start: string, duration: number }[] }>(
        `/meetings/availability?course_id=${courseId}&date=${date}`
    );
    return response.data.busySlots;
  },
  
  startEarly: async (meetingId: number) => {
    return await api.patch(`/meetings/${meetingId}/start-early`);
  },
  finish: async (meetingId: number) => {
    return await api.patch(`/meetings/${meetingId}/finish`);
  },
  cancel: async (meetingId: number) => {
    return await api.patch(`/meetings/${meetingId}/cancel`);
  },
  confirm: async (meetingId: number) => {
    return await api.patch(`/meetings/${meetingId}/confirm`);
  },
  getUnconfirmed: async () => {
    const response = await api.get<{ meeting: UnconfirmedMeeting | null }>('/meetings/unconfirmed');
    return response.data;
  },
  dispute: async (meetingId: number) => {
    return await api.post(`/meetings/${meetingId}/dispute`);
  },
  getReport: async (meetingId: number) => {
    const response = await api.get<ReportResponse>(`/meetings/${meetingId}/report`);
    return response.data;
  },
  getZoomReport: async (meetingId: number) => {
    const response = await api.get<{ success: boolean, data: unknown }>(`/meetings/${meetingId}/zoom-report`);
    return response.data.data;
  },
  getByCourseId: async (courseId: number | string) => {
    const response = await api.get<{ success: boolean; data: Meeting[] }>(`/meetings/course/${courseId}`);
    return response.data.data;
  },
};