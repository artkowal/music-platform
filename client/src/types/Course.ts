export interface Course {
  course_id: number;
  title: string;
  description: string;
  course_type: 'individual' | 'group';
  workplace_name?: string;
  workplace_id?: number;
  color_hex?: string;
  student_count: number;
  lesson_count?: number;
  teacher_name?: string;
  teacher_lastname?: string;
}

export type CourseData = {
  title: string;
  description: string;
  course_type: string;
  workplace_id: string;
};

// Typ dla danych tworzenia kursu
export interface CreateCoursePayload {
  title: string;
  description: string;
  course_type: string;
  workplace_id: number | null;
  student_emails?: string[];
}

// Typ dla danych edycji kursu
export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  course_type?: string;
  workplace_id?: number | null;
}