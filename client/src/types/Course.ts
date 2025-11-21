export interface Course {
  course_id: number;
  title: string;
  description: string;
  course_type: 'individual' | 'group';
  workplace_name?: string; // Opcjonalne, bo kurs może być prywatny
  workplace_id?: number;
  color_hex?: string;
  student_count: number;
  lesson_count?: number;
  teacher_name?: string;
  teacher_lastname?: string;
}