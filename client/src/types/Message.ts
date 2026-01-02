export interface Message {
  message_id: number;
  lesson_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  is_read: boolean;
  is_deleted: boolean;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'student';
  email: string;
}

export interface MessageNotification {
  message_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
  lesson_id: number;
  lesson_title: string;
  first_name: string;
  last_name: string;
}