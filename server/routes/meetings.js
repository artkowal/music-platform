const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');
const { createMeeting, getMeetingReport } = require('../services/zoom');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

const formatToMySQLDateTime = (dateObj) =>
  dateObj.toISOString().slice(0, 19).replace('T', ' ');

// Automatyczne zamykanie zakończonych lekcji stacjonarnych
const autoCompleteStationaryLessons = async (connection) => {
  await connection.execute(`
    UPDATE Meetings 
    SET status = 'completed' 
    WHERE type = 'stationary' 
      AND status = 'planned' 
      AND DATE_ADD(scheduled_time, INTERVAL duration_minutes MINUTE) < NOW()
  `);
};

/**
 * @swagger
 * /api/meetings/calendar:
 *   get:
 *     summary: Pobiera spotkania użytkownika w podanym zakresie dat
 *     description: |
 *       Zwraca spotkania nauczyciela lub ucznia w obrębie podanego zakresu dat.
 *       Odwołane spotkania również są zwracane (dane historyczne).
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *     responses:
 *       200:
 *         description: Lista spotkań
 */
router.get('/calendar', protect, async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user.user_id;
  const role = req.user.role;

  const startDate =
    start ||
    formatToMySQLDateTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const endDate =
    end ||
    formatToMySQLDateTime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  try {
    await autoCompleteStationaryLessons(dbPool);
  } catch (e) {
    console.error('Auto-complete error:', e.message);
  }

  let query = '';
  let params = [userId, startDate, endDate];

  if (role === 'teacher') {
    query = `
      SELECT m.*, c.title AS course_title, w.name AS workplace_name, w.color_hex AS workplace_color
      FROM Meetings m
      JOIN Courses c ON m.course_id = c.course_id
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      WHERE c.teacher_id = ?
      AND m.scheduled_time BETWEEN ? AND ?
    `;
  } else {
    query = `
      SELECT m.*, c.title AS course_title, w.name AS workplace_name, w.color_hex AS workplace_color,
             u.first_name AS teacher_name, u.last_name AS teacher_lastname
      FROM Meetings m
      JOIN Courses c ON m.course_id = c.course_id
      JOIN Enrollments e ON c.course_id = e.course_id
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      JOIN Users u ON c.teacher_id = u.user_id
      WHERE e.student_id = ?
      AND m.scheduled_time BETWEEN ? AND ?
    `;
  }

  try {
    const [rows] = await dbPool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania danych kalendarza.' });
  }
});

/**
 * @swagger
 * /api/meetings/schedule:
 *   post:
 *     summary: Tworzy jedno lub wiele zaplanowanych spotkań
 *     description: |
 *       Tworzy spotkania cykliczne lub pojedyncze, z obsługą Zoom.
 *       Automatycznie wykrywa konflikty czasowe.
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Zaplanowano spotkania
 */
router.post('/schedule', protect, async (req, res) => {
  const {
    course_id,
    title,
    description,
    scheduled_time,
    duration_minutes,
    type,
    repeat_weeks,
  } = req.body;

  let teacherId = null;

  if (req.user.role === 'teacher') {
    const [check] = await dbPool.execute(
      `SELECT teacher_id FROM Courses WHERE course_id = ? AND teacher_id = ?`,
      [course_id, req.user.user_id]
    );
    if (check.length === 0)
      return res.status(403).json({ message: 'Brak dostępu do kursu.' });
    teacherId = req.user.user_id;
  } else {
    const [check] = await dbPool.execute(
      `
      SELECT c.teacher_id 
      FROM Enrollments e JOIN Courses c ON e.course_id = c.course_id
      WHERE e.course_id = ? AND e.student_id = ?
    `,
      [course_id, req.user.user_id]
    );
    if (check.length === 0)
      return res.status(403).json({ message: 'Nie zapisano na kurs.' });
    teacherId = check[0].teacher_id;
  }

  const weeks =
    repeat_weeks && parseInt(repeat_weeks) > 0 ? parseInt(repeat_weeks) : 1;
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    let baseDate = new Date(scheduled_time);

    for (let i = 0; i < weeks; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + i * 7);

      const startTime = formatToMySQLDateTime(currentDate);
      const endTime = formatToMySQLDateTime(
        new Date(currentDate.getTime() + duration_minutes * 60000)
      );

      const [conflicts] = await connection.execute(
        `
        SELECT m.meeting_id FROM Meetings m 
        JOIN Courses c ON m.course_id = c.course_id
        WHERE c.teacher_id = ?
          AND m.status != 'cancelled'
          AND (
            (m.scheduled_time < ? AND DATE_ADD(m.scheduled_time, INTERVAL m.duration_minutes MINUTE) > ?)
            OR (m.scheduled_time >= ? AND m.scheduled_time < ?)
          )
      `,
        [teacherId, endTime, startTime, startTime, endTime]
      );

      if (conflicts.length > 0)
        throw new Error(`Konflikt terminów w dniu ${startTime}!`);

      let zoomData = { id: null, join_url: null, start_url: null };

      if (type === 'online') {
        try {
          const meeting = await createMeeting(
            `${title} ${weeks > 1 ? `(${i + 1})` : ''}`,
            currentDate.toISOString(),
            duration_minutes
          );
          if (meeting) {
            zoomData = {
              id: meeting.id,
              join_url: meeting.join_url,
              start_url: meeting.start_url,
            };
          }
        } catch (err) {
          console.error('Zoom API Error:', err.message);
        }
      }

      await connection.execute(
        `
        INSERT INTO Meetings (
          course_id, title, description, scheduled_time, duration_minutes, type,
          status, zoom_meeting_id, zoom_join_url, zoom_start_url,
          is_confirmed_by_teacher, is_confirmed_by_student
        ) 
        VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, 0, 0)
      `,
        [
          course_id,
          title,
          description,
          startTime,
          duration_minutes,
          type,
          zoomData.id,
          zoomData.join_url,
          zoomData.start_url,
        ]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Zaplanowano spotkania.' });
  } catch (error) {
    await connection.rollback();
    res.status(409).json({ message: error.message });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/meetings/course/{courseId}:
 *   get:
 *     summary: Pobiera listę spotkań kursu
 */
router.get('/course/:courseId', protect, async (req, res) => {
  const { courseId } = req.params;

  try {
    await autoCompleteStationaryLessons(dbPool);
    const [rows] = await dbPool.execute(
      `SELECT * FROM Meetings WHERE course_id = ? ORDER BY scheduled_time ASC`,
      [courseId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Błąd pobierania spotkań.' });
  }
});

/**
 * @swagger
 * /api/meetings/{id}/start-early:
 *   patch:
 *     summary: Oznacza wcześniejsze rozpoczęcie lekcji (nauczyciel)
 */
router.patch('/:id/start-early', protect, async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });
  await dbPool.execute(
    'UPDATE Meetings SET started_at = NOW() WHERE meeting_id = ?',
    [req.params.id]
  );
  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/finish:
 *   patch:
 *     summary: Zamyka lekcję online i ustawia status pending
 */
router.patch('/:id/finish', protect, async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });

  const { id } = req.params;

  await dbPool.execute(
    `
    UPDATE Meetings 
    SET ended_at = NOW(), is_confirmed_by_teacher = 1,
        status = CASE WHEN status='planned' THEN 'pending' ELSE status END
    WHERE meeting_id = ?
  `,
    [id]
  );

  await checkCompletion(id, dbPool);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/confirm:
 *   patch:
 *     summary: Potwierdza uczestnictwo w lekcji
 */
router.patch('/:id/confirm', protect, async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role === 'teacher') {
    await dbPool.execute(
      'UPDATE Meetings SET is_confirmed_by_teacher = 1 WHERE meeting_id = ?',
      [id]
    );
  } else {
    await dbPool.execute(
      'UPDATE Meetings SET is_confirmed_by_student = 1 WHERE meeting_id = ?',
      [id]
    );
  }

  await checkCompletion(id, dbPool);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/cancel:
 *   patch:
 *     summary: Anuluje spotkanie
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  const role = req.user.role;

  await dbPool.execute(
    `
    UPDATE Meetings 
    SET status = "cancelled", cancelled_by = ?
    WHERE meeting_id = ?
  `,
    [role, req.params.id]
  );

  res.json({ success: true });
});

// Helper do zamykania zajęć
async function checkCompletion(meetingId, pool) {
  const [row] = await pool.execute(
    `SELECT is_confirmed_by_teacher, is_confirmed_by_student, type FROM Meetings WHERE meeting_id = ?`,
    [meetingId]
  );

  if (row.length === 0) return;
  const m = row[0];

  if (m.type === 'online') {
    if (m.is_confirmed_by_teacher && m.is_confirmed_by_student) {
      await pool.execute(
        `UPDATE Meetings SET status='completed' WHERE meeting_id = ?`,
        [meetingId]
      );
    }
  }
}

/**
 * @swagger
 * /api/meetings/{id}/report:
 *   get:
 *     summary: Pobiera raport Zoom lub lokalny raport spotkania
 */
router.get('/:id/report', protect, async (req, res) => {
  const { id } = req.params;
  const [rows] = await dbPool.execute(
    `SELECT zoom_meeting_id, zoom_report_json, is_confirmed_by_teacher, is_confirmed_by_student 
     FROM Meetings WHERE meeting_id = ?`,
    [id]
  );

  if (rows.length === 0) return res.status(404).json({ message: 'Brak' });

  const meeting = rows[0];
  let report = meeting.zoom_report_json
    ? JSON.parse(meeting.zoom_report_json)
    : await getMeetingReport(meeting.zoom_meeting_id);

  if (report) {
    await dbPool.execute(
      'UPDATE Meetings SET zoom_report_json = ? WHERE meeting_id = ?',
      [JSON.stringify(report), id]
    );
  }

  res.json({
    success: true,
    report,
    confirmations: {
      is_confirmed_by_teacher: meeting.is_confirmed_by_teacher,
      is_confirmed_by_student: meeting.is_confirmed_by_student,
    },
  });
});

/**
 * @swagger
 * /api/meetings/{id}/zoom-report:
 *   get:
 *     summary: Wymusza pobranie najnowszego raportu Zoom
 */
router.get('/:id/zoom-report', protect, async (req, res) => {
  const { id } = req.params;
  const [rows] = await dbPool.execute(
    `SELECT zoom_meeting_id FROM Meetings WHERE meeting_id = ?`,
    [id]
  );

  if (rows.length === 0 || !rows[0].zoom_meeting_id)
    return res.status(404).json({ message: 'Brak ID' });

  const report = await getMeetingReport(rows[0].zoom_meeting_id);

  if (report) {
    await dbPool.execute(
      `UPDATE Meetings SET zoom_report_json = ? WHERE meeting_id = ?`,
      [JSON.stringify(report), id]
    );
    return res.json({ success: true, data: report });
  }

  res.json({ success: false, message: 'Niedostępny' });
});

/**
 * @swagger
 * /api/meetings/availability:
 *   get:
 *     summary: Pobiera zajęte sloty nauczyciela dla danego dnia
 */
router.get('/availability', protect, async (req, res) => {
  const { course_id, date } = req.query;

  if (!course_id || !date)
    return res.status(400).json({ message: 'Brak parametrów.' });

  try {
    const [course] = await dbPool.execute(
      `SELECT teacher_id FROM Courses WHERE course_id = ?`,
      [course_id]
    );
    if (course.length === 0) return res.json({ busySlots: [] });

    const teacherId = course[0].teacher_id;

    const [meetings] = await dbPool.execute(
      `
      SELECT m.scheduled_time, m.duration_minutes
      FROM Meetings m
      JOIN Courses c ON m.course_id = c.course_id
      WHERE c.teacher_id = ?
        AND m.status != 'cancelled'
        AND m.scheduled_time BETWEEN ? AND ?
    `,
      [`${teacherId}`, `${date} 00:00:00`, `${date} 23:59:59`]
    );

    const busySlots = meetings.map((m) => ({
      start: m.scheduled_time,
      duration: m.duration_minutes,
    }));

    res.json({ success: true, busySlots });
  } catch (error) {
    res.status(500).json({ message: 'Błąd' });
  }
});

module.exports = router;