-- Ustawienie strefy czasowej
SET TIME_ZONE = '+00:00';

-- 1. Tabela Użytkowników
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  `role` ENUM('teacher', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela Placówek (dla Nauczyciela)
CREATE TABLE IF NOT EXISTS Workplaces (
  workplace_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#FFFFFF',
  payment_type ENUM('per_lesson', 'monthly', 'none') NOT NULL DEFAULT 'none',
  payment_amount DECIMAL(10, 2) NULL,
  sort_order INT DEFAULT 0,
  
  FOREIGN KEY (teacher_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. Tabela Kursów
CREATE TABLE IF NOT EXISTS Courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  workplace_id INT NULL, 
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_type ENUM('individual', 'group') NOT NULL,
  invite_code VARCHAR(10) UNIQUE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (teacher_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (workplace_id) REFERENCES Workplaces(workplace_id) ON DELETE SET NULL
);

-- 4. Tabela Zapisów
CREATE TABLE IF NOT EXISTS Enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  
  UNIQUE KEY (student_id, course_id),
  
  FOREIGN KEY (student_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);

-- 5. Tabela Lekcji (Materiały / Tematy)
CREATE TABLE IF NOT EXISTS Lessons (
  lesson_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 45,
  is_visible BOOLEAN DEFAULT TRUE,
  status ENUM('planned', 'pending', 'completed', 'cancelled') DEFAULT 'planned',
  lesson_type ENUM('stationary', 'online') DEFAULT 'stationary',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);

-- 6. Tabela Spotkań (Kalendarz)
CREATE TABLE IF NOT EXISTS Meetings (
  meeting_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,

  scheduled_time DATETIME NOT NULL,
  duration_minutes INT DEFAULT 45,
  
  type ENUM('stationary', 'online') NOT NULL DEFAULT 'stationary',
  zoom_meeting_id VARCHAR(50) NULL,
  zoom_join_url VARCHAR(1024) NULL,
  zoom_start_url VARCHAR(2048) NULL,
  zoom_report_json TEXT NULL,
  
  status ENUM('planned', 'pending', 'completed', 'cancelled', 'noshow', 'disputed') DEFAULT 'planned',
  cancelled_by ENUM('teacher', 'student') NULL,
  
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  is_confirmed_by_teacher BOOLEAN DEFAULT FALSE,
  is_confirmed_by_student BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);

-- 7. Tabela Materiałów Dydaktycznych
CREATE TABLE IF NOT EXISTS Materials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL, 
  
  FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE
);

-- 8. Tabela Komentarzy
CREATE TABLE IF NOT EXISTS Comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  user_id INT NOT NULL, 
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 9. Tabela Postępów Ucznia w Materiale
CREATE TABLE IF NOT EXISTS Lesson_Progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  completed_at DATETIME NULL,
  
  UNIQUE KEY (student_id, lesson_id),

  FOREIGN KEY (student_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE
);

-- 10. Tabela Tokenów (Sesje)
CREATE TABLE IF NOT EXISTS User_Tokens (
  token_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 11. Tabela Powiadomień (Systemowa)
CREATE TABLE IF NOT EXISTS Notifications (
  notification_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link VARCHAR(255) NULL,
  type ENUM('info', 'success', 'warning', 'error', 'message') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 12. Dostępność Nauczyciela 
CREATE TABLE IF NOT EXISTS TeacherAvailability (
  availability_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 13. Potwierdzenia Lekcji 
CREATE TABLE IF NOT EXISTS Lesson_Confirmations (
  confirmation_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  user_id INT NOT NULL,
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY (lesson_id, user_id),
  FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 14. Zoom dla Lekcji
CREATE TABLE IF NOT EXISTS Zoom_Meetings (
  zoom_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  meeting_id VARCHAR(50) NOT NULL,
  join_url VARCHAR(1024) NOT NULL,
  start_url VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE
);

-- 15. Widok statystyk
CREATE OR REPLACE VIEW V_Teacher_Monthly_Stats AS
SELECT
  c.teacher_id,
  w.workplace_id,
  w.name AS workplace_name,
  YEAR(m.scheduled_time) AS stat_year,
  MONTH(m.scheduled_time) AS stat_month,
  COUNT(m.meeting_id) AS lesson_count
FROM Meetings m
JOIN Courses c ON m.course_id = c.course_id
LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
WHERE 
  m.`status` = 'completed'
GROUP BY
  c.teacher_id,
  w.workplace_id,
  w.name,
  stat_year,
  stat_month;