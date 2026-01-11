const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: User dashboard data including statistics, upcoming meetings and pending lessons
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard data for the current user
 *     description: >
 *       Returns dashboard statistics and upcoming meetings for the authenticated user.
 *       The returned data depends on the user role:
 *       - Teachers receive course and student statistics and their upcoming meetings.
 *       - Students receive enrolled course count, upcoming meetings and lessons that are not yet completed.
 *     tags:
 *       - Dashboard
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         coursesCount:
 *                           type: integer
 *                           description: Number of courses taught by the teacher or enrolled by the student.
 *                         studentsCount:
 *                           type: integer
 *                           description: Number of unique students (teachers only).
 *                         upcomingCount:
 *                           type: integer
 *                           description: Number of upcoming planned meetings.
 *                         toCompleteCount:
 *                           type: integer
 *                           description: Number of lessons not yet completed by the student (students only).
 *                     upcomingMeetings:
 *                       type: array
 *                       description: List of upcoming planned meetings.
 *                       items:
 *                         type: object
 *                         properties:
 *                           meeting_id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           scheduled_time:
 *                             type: string
 *                             format: date-time
 *                           duration_minutes:
 *                             type: integer
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           zoom_join_url:
 *                             type: string
 *                           zoom_start_url:
 *                             type: string
 *                           course_id:
 *                             type: integer
 *                           course_title:
 *                             type: string
 *                           workplace_name:
 *                             type: string
 *                           workplace_color:
 *                             type: string
 *                           teacher_name:
 *                             type: string
 *                           teacher_lastname:
 *                             type: string
 *                     lessonsToComplete:
 *                       type: array
 *                       description: List of visible lessons not yet completed by the student.
 *                       items:
 *                         type: object
 *                         properties:
 *                           lesson_id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           duration_minutes:
 *                             type: integer
 *                           course_id:
 *                             type: integer
 *                           course_title:
 *                             type: string
 *       401:
 *         description: User is not authenticated.
 *       500:
 *         description: Failed to load dashboard data due to a server error.
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