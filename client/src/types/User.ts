export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'student';
  created_at: string;
}