export interface DashboardData {
  stats: {
    coursesCount: number;
    studentsCount?: number;
    upcomingCount: number;
    toCompleteCount?: number;
  };
  upcomingLessons: {
    lesson_id: number;
    title: string;
    scheduled_time: string;
    duration_minutes: number;
    lesson_type: 'stationary' | 'online';
    course_title: string;
    course_id: number;
    workplace_name?: string;
    teacher_name?: string;
    teacher_lastname?: string;
    zoom_join_url?: string;
    zoom_start_url?: string;
  }[];
  lessonsToComplete?: {
    lesson_id: number;
    title: string;
    duration_minutes: number;
    course_title: string;
    course_id: number;
  }[];
}