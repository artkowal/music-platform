const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 * - name: Dashboard
 * description: Dane do pulpitu głównego
 */

/**
 * @swagger
 * /api/dashboard:
 * get:
 * summary: Pobiera statystyki i nadchodzące lekcje dla zalogowanego użytkownika
 * tags: [Dashboard]
 * security:
 * - cookieAuth: []
 */
router.get('/', protect, async (req, res) => {
  const userId = req.user.user_id;
  const role = req.user.role;

  try {
    const stats = {
      coursesCount: 0,
      studentsCount: 0,
      upcomingCount: 0,
      toCompleteCount: 0 
    };

    let upcomingLessons = [];
    let lessonsToComplete = [];

    if (role === 'teacher') {
      // Nadchodzące lekcje (z linkami Zoom)
      const upcomingQuery = `
        SELECT 
            l.lesson_id, l.title, l.scheduled_time, l.duration_minutes, l.lesson_type, 
            z.join_url as zoom_join_url, z.start_url as zoom_start_url,
            c.title as course_title, c.course_id,
            w.name as workplace_name
        FROM Lessons l
        JOIN Courses c ON l.course_id = c.course_id
        LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
        LEFT JOIN Zoom_Meetings z ON l.lesson_id = z.lesson_id
        WHERE c.teacher_id = ? 
          AND l.scheduled_time > NOW()
          AND l.status = 'planned'
        ORDER BY l.scheduled_time ASC
        LIMIT 5
      `;
      const [rows] = await dbPool.execute(upcomingQuery, [userId]);
      upcomingLessons = rows;

      // Statystyki (Liczba kursów)
      const [coursesRes] = await dbPool.execute('SELECT COUNT(*) as cnt FROM Courses WHERE teacher_id = ?', [userId]);
      stats.coursesCount = coursesRes[0].cnt;

      // Liczba unikalnych uczniów
      const [studentsRes] = await dbPool.execute(`
        SELECT COUNT(DISTINCT e.student_id) as cnt 
        FROM Enrollments e
        JOIN Courses c ON e.course_id = c.course_id
        WHERE c.teacher_id = ?
      `, [userId]);
      stats.studentsCount = studentsRes[0].cnt;
    } 
    else {
      // Nadchodzące lekcje (z linkami Zoom i nazwiskiem nauczyciela)
      const upcomingQuery = `
        SELECT 
            l.lesson_id, l.title, l.scheduled_time, l.duration_minutes, l.lesson_type, 
            z.join_url as zoom_join_url, z.start_url as zoom_start_url,
            c.title as course_title, c.course_id,
            w.name as workplace_name,
            u.first_name as teacher_name, u.last_name as teacher_lastname
        FROM Lessons l
        JOIN Courses c ON l.course_id = c.course_id
        JOIN Enrollments e ON c.course_id = e.course_id
        LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
        JOIN Users u ON c.teacher_id = u.user_id
        LEFT JOIN Zoom_Meetings z ON l.lesson_id = z.lesson_id
        WHERE e.student_id = ? 
          AND l.scheduled_time > NOW()
          AND l.status = 'planned'
          AND l.is_visible = 1
        ORDER BY l.scheduled_time ASC
        LIMIT 5
      `;
      const [rowsUpcoming] = await dbPool.execute(upcomingQuery, [userId]);
      upcomingLessons = rowsUpcoming;

      // Lekcje do wykonania (Nieukończone)
      const toCompleteQuery = `
        SELECT l.lesson_id, l.title, l.duration_minutes, c.title as course_title, c.course_id
        FROM Lessons l
        JOIN Courses c ON l.course_id = c.course_id
        JOIN Enrollments e ON c.course_id = e.course_id
        LEFT JOIN Lesson_Progress lp ON l.lesson_id = lp.lesson_id AND lp.student_id = ?
        WHERE e.student_id = ?
          AND l.is_visible = 1
          AND l.status != 'cancelled'
          AND (lp.is_completed IS NULL OR lp.is_completed = 0)
        ORDER BY l.created_at DESC
        LIMIT 5
      `;
      const [rowsToComplete] = await dbPool.execute(toCompleteQuery, [userId, userId]);
      lessonsToComplete = rowsToComplete;
      stats.toCompleteCount = lessonsToComplete.length;

      // Statystyki (Liczba kursów)
      const [coursesRes] = await dbPool.execute('SELECT COUNT(*) as cnt FROM Enrollments WHERE student_id = ?', [userId]);
      stats.coursesCount = coursesRes[0].cnt;
    }

    stats.upcomingCount = upcomingLessons.length;

    res.json({
      success: true,
      data: {
        stats,
        upcomingLessons,
        lessonsToComplete
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd pobierania danych pulpitu.' });
  }
});

module.exports = router;