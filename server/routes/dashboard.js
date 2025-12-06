const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dane do pulpitu głównego
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Pobiera statystyki i nadchodzące spotkania
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dane pulpitu
 *       500:
 *         description: Błąd serwera
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

    let upcomingMeetings = [];
    let lessonsToComplete = [];

    if (role === 'teacher') {
      const upcomingQuery = `
        SELECT 
          m.meeting_id, m.title, m.scheduled_time, m.duration_minutes, m.type,
          m.zoom_join_url, m.zoom_start_url,
          m.status,
          c.title AS course_title, c.course_id,
          w.name AS workplace_name,
          w.color_hex AS workplace_color
        FROM Meetings m
        JOIN Courses c ON m.course_id = c.course_id
        LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
        WHERE c.teacher_id = ?
          AND m.scheduled_time > NOW()
          AND m.status = 'planned'
        ORDER BY m.scheduled_time ASC
        LIMIT 5
      `;
      const [rows] = await dbPool.execute(upcomingQuery, [userId]);
      upcomingMeetings = rows;

      // Statystyki
      const [coursesRes] = await dbPool.execute(
        'SELECT COUNT(*) AS cnt FROM Courses WHERE teacher_id = ?',
        [userId]
      );
      stats.coursesCount = coursesRes[0].cnt;

      const [studentsRes] = await dbPool.execute(
        `
        SELECT COUNT(DISTINCT e.student_id) AS cnt 
        FROM Enrollments e
        JOIN Courses c ON e.course_id = c.course_id
        WHERE c.teacher_id = ?
        `,
        [userId]
      );
      stats.studentsCount = studentsRes[0].cnt;

    } else {
      const upcomingQuery = `
        SELECT 
          m.meeting_id, m.title, m.scheduled_time, m.duration_minutes, m.type, 
          m.zoom_join_url, m.zoom_start_url,
          m.status,
          c.title AS course_title, c.course_id,
          w.name AS workplace_name,
          w.color_hex AS workplace_color,
          u.first_name AS teacher_name,
          u.last_name AS teacher_lastname
        FROM Meetings m
        JOIN Courses c ON m.course_id = c.course_id
        JOIN Enrollments e ON c.course_id = e.course_id
        LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
        JOIN Users u ON c.teacher_id = u.user_id
        WHERE e.student_id = ?
          AND m.scheduled_time > NOW()
          AND m.status = 'planned'
        ORDER BY m.scheduled_time ASC
        LIMIT 5
      `;
      const [rowsUpcoming] = await dbPool.execute(upcomingQuery, [userId]);
      upcomingMeetings = rowsUpcoming;

      // Statystyki
      const [coursesRes] = await dbPool.execute(
        'SELECT COUNT(*) AS cnt FROM Enrollments WHERE student_id = ?',
        [userId]
      );
      stats.coursesCount = coursesRes[0].cnt;
    }

    if (role === 'student') {
      const toCompleteQuery = `
        SELECT 
          l.lesson_id, l.title, l.duration_minutes,
          c.title AS course_title, c.course_id
        FROM Lessons l
        JOIN Courses c ON l.course_id = c.course_id
        JOIN Enrollments e ON c.course_id = e.course_id
        LEFT JOIN Lesson_Progress lp 
          ON l.lesson_id = lp.lesson_id 
         AND lp.student_id = ?
        WHERE 
          e.student_id = ?
          AND l.is_visible = 1
          AND (lp.is_completed IS NULL OR lp.is_completed = 0)
        ORDER BY l.created_at DESC
        LIMIT 5
      `;
      const [rowsToComplete] = await dbPool.execute(toCompleteQuery, [
        userId,
        userId
      ]);

      lessonsToComplete = rowsToComplete;
      stats.toCompleteCount = lessonsToComplete.length;
    }

    stats.upcomingCount = upcomingMeetings.length;

    res.json({
      success: true,
      data: {
        stats,
        upcomingMeetings,
        lessonsToComplete
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd pobierania danych pulpitu.' });
  }
});

module.exports = router;
