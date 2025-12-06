import type { Material } from "./Material";

export interface Lesson {
  lesson_id: number;
  course_id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  is_visible: boolean | number;
  created_at: string;
  
  materials?: Material[];
  progress?: {
      is_completed: boolean;
      time_spent_seconds: number;
  };
}