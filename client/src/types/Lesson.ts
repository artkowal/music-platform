export interface LessonMaterial {
  material_id: number;
  lesson_id: number;
  title: string;
  file_path: string;
}

export interface LessonProgress {
  is_completed: boolean;
  time_spent_seconds: number;
  completed_at?: string | null; 
}

export interface Lesson {
  lesson_id: number;
  course_id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  is_visible: boolean | number;
  status: 'planned' | 'pending' | 'completed' | 'cancelled';
  lesson_type: 'stationary' | 'online';
  created_at: string;

  materials?: LessonMaterial[];
  progress?: LessonProgress;
}