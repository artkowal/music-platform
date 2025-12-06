export interface Meeting {
  meeting_id: number;
  course_id: number;
  title: string;
  description?: string;
  
  scheduled_time: string;
  duration_minutes: number;
  type: 'stationary' | 'online';
  status: 'planned' | 'pending' | 'completed' | 'cancelled' | 'noshow';
  
  zoom_join_url?: string;
  zoom_start_url?: string;
  
  is_confirmed_by_teacher: boolean | number;
  is_confirmed_by_student: boolean | number;
  
  course_title?: string;
  workplace_id?: number;
  student_names?: string;
  teacher_name?: string;
  teacher_lastname?: string;
  workplace_name?: string;
  workplace_color?: string;
}