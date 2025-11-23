export interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean | number;
  is_read?: boolean | number;
  user_id: number;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
  email?: string;
}

export interface CommentNotification extends Comment {
  lesson_id: number;
  lesson_title: string;
  course_id: number;
}