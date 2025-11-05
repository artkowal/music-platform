-- Ustawienie strefy czasowej
SET TIME_ZONE = '+00:00';

-- 1. Tabela Użytkowników
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  `role` ENUM('teacher', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela Placówek (dla Nauczyciela)
CREATE TABLE IF NOT EXISTS Workplaces (
  workplace_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#FFFFFF',
  
  FOREIGN KEY (teacher_id) 
    REFERENCES Users(user_id)
    ON DELETE CASCADE
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

  FOREIGN KEY (teacher_id) 
    REFERENCES Users(user_id)
    ON DELETE CASCADE,
  
  FOREIGN KEY (workplace_id) 
    REFERENCES Workplaces(workplace_id)
    ON DELETE SET NULL
);

-- 4. Tabela Zapisów (łączenie Uczniów z Kursami)
CREATE TABLE IF NOT EXISTS Enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  
  UNIQUE KEY (student_id, course_id),
  
  FOREIGN KEY (student_id) 
    REFERENCES Users(user_id)
    ON DELETE CASCADE,
  FOREIGN KEY (course_id) 
    REFERENCES Courses(course_id)
    ON DELETE CASCADE
);

-- 5. Tabela Lekcji
CREATE TABLE IF NOT EXISTS Lessons (
  lesson_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_time DATETIME NULL,
  duration_minutes INT DEFAULT 45,
  `status` ENUM('planned', 'completed', 'cancelled') DEFAULT 'planned',
  
  FOREIGN KEY (course_id) 
    REFERENCES Courses(course_id)
    ON DELETE CASCADE
);

-- 6. Tabela Materiałów Dydaktycznych
CREATE TABLE IF NOT EXISTS Materials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL, 
  
  FOREIGN KEY (lesson_id)
    REFERENCES Lessons(lesson_id)
    ON DELETE CASCADE
);

-- 7. Tabela Komentarzy (pod lekcjami)
CREATE TABLE IF NOT EXISTS Comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  user_id INT NOT NULL, 
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (lesson_id)
    REFERENCES Lessons(lesson_id)
    ON DELETE CASCADE,
  FOREIGN KEY (user_id)
    REFERENCES Users(user_id)
    ON DELETE CASCADE
);

-- 8. Tabela Postępów Ucznia w Lekcji
CREATE TABLE IF NOT EXISTS Lesson_Progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  
  UNIQUE KEY (student_id, lesson_id),

  FOREIGN KEY (student_id)
    REFERENCES Users(user_id)
    ON DELETE CASCADE,
  FOREIGN KEY (lesson_id)
    REFERENCES Lessons(lesson_id)
    ON DELETE CASCADE
);

-- 9. Widok (VIEW) do statystyk Nauczyciela
CREATE OR REPLACE VIEW V_Teacher_Monthly_Stats AS
SELECT
  c.teacher_id,
  w.workplace_id,
  w.name AS workplace_name,
  YEAR(l.scheduled_time) AS stat_year,
  MONTH(l.scheduled_time) AS stat_month,
  COUNT(l.lesson_id) AS lesson_count
FROM Lessons l
JOIN Courses c ON l.course_id = c.course_id
JOIN Workplaces w ON c.workplace_id = w.workplace_id
WHERE 
  l.`status` = 'completed'
  AND l.scheduled_time IS NOT NULL
GROUP BY
  c.teacher_id,
  w.workplace_id,
  w.name,
  stat_year,
  stat_month;