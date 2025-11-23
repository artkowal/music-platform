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
  is_visible: boolean | number;
  materials?: Material[];
  progress?: LessonProgress;
  created_at?: string;
}