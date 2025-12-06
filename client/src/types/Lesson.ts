export interface Material {
  material_id: number;
  lesson_id: number;
  title: string;
  file_path: string;
}

export interface LessonProgress {
  time_spent_seconds: number;
  is_completed: number | boolean; 
  completed_at?: string | null;
}

export interface Lesson {
  lesson_id: number;
  course_id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  status: 'planned' | 'completed' | 'cancelled';
  cancelled_by?: 'teacher' | 'student';
  is_visible: boolean | number;
  materials?: Material[];
  progress?: LessonProgress;
  created_at?: string;

  lesson_type: 'stationary' | 'online';
  scheduled_time?: string;
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;

  is_started_early?: boolean | number;
  is_ended_early?: boolean | number;
  is_confirmed_by_teacher?: boolean | number;
  is_confirmed_by_student?: boolean | number;
  zoom_report_json?: string;
}