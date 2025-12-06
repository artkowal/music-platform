import type { Meeting } from "./Meeting";

export interface DashboardData {
  stats: {
    coursesCount: number;
    studentsCount?: number;
    upcomingCount: number;
    toCompleteCount?: number;
  };
  upcomingMeetings: Meeting[];
  
  lessonsToComplete?: {
    lesson_id: number;
    title: string;
    duration_minutes: number;
    course_title: string;
    course_id: number;
  }[];
}