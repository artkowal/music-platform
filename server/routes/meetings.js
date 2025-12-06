const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');
const { createMeeting, getMeetingReport } = require('../services/zoom');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

const formatToMySQLDateTime = (dateObj) => {
  return dateObj.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * @swagger
 * /api/meetings/schedule:
 *   post:
 *     summary: Tworzy zaplanowaną lekcję (z opcjonalnym spotkaniem Zoom) i sprawdza konflikty czasowe.
 *     tags:
 *       - Lekcje
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Dane lekcji do utworzenia
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduled_time:
 *                 type: string
 *                 format: date-time
 *               duration_minutes:
 *                 type: integer
 *               lesson_type:
 *                 type: string
 *                 enum: [online, onsite]
 *               repeat_weeks:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Zajęcia zostały pomyślnie zaplanowane.
 *       403:
 *         description: Brak dostępu do kursu.
 *       409:
 *         description: Konflikt terminów.
 */
router.post('/schedule', protect, async (req, res) => {
  const { 
    course_id, title, description, scheduled_time,
    duration_minutes, lesson_type, repeat_weeks 
  } = req.body;

  let teacherId = null;

  if (req.user.role === 'teacher') {
      const [check] = await dbPool.execute(
        'SELECT teacher_id FROM Courses WHERE course_id = ? AND teacher_id = ?',
        [course_id, req.user.user_id]
      );
      if (check.length === 0) return res.status(403).json({ message: 'Brak dostępu do kursu.' });
      teacherId = req.user.user_id;
  } else {
      const [check] = await dbPool.execute(`
        SELECT c.teacher_id FROM Enrollments e
        JOIN Courses c ON e.course_id = c.course_id
        WHERE e.course_id = ? AND e.student_id = ?
      `, [course_id, req.user.user_id]);
      if (check.length === 0) return res.status(403).json({ message: 'Nie jesteś zapisany na ten kurs.' });
      teacherId = check[0].teacher_id;
  }

  const weeks = repeat_weeks && parseInt(repeat_weeks) > 0 ? parseInt(repeat_weeks) : 1;
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();
    let baseDate = new Date(scheduled_time);

    for (let i = 0; i < weeks; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + i * 7);
        
        const startTime = formatToMySQLDateTime(currentDate);
        const endTimeDate = new Date(currentDate.getTime() + duration_minutes * 60000);
        const endTime = formatToMySQLDateTime(endTimeDate);

        const [conflicts] = await connection.execute(`
          SELECT l.lesson_id FROM Lessons l
          JOIN Courses c ON l.course_id = c.course_id
          WHERE c.teacher_id = ? AND l.status != 'cancelled'
          AND (
            (l.scheduled_time < ? AND DATE_ADD(l.scheduled_time, INTERVAL l.duration_minutes MINUTE) > ?)
            OR (l.scheduled_time >= ? AND l.scheduled_time < ?)
          )
        `, [teacherId, endTime, startTime, startTime, endTime]);

        if (conflicts.length > 0) throw new Error(`Konflikt terminów w dniu ${startTime}!`);

        const [resL] = await connection.execute(`
          INSERT INTO Lessons (course_id, title, description, scheduled_time, duration_minutes, lesson_type, status, is_visible) 
          VALUES (?, ?, ?, ?, ?, ?, 'planned', 1)
        `, [course_id, title, description, startTime, duration_minutes, lesson_type]);

        const lessonId = resL.insertId;

        if (lesson_type === 'online') {
            try {
                const meeting = await createMeeting(
                  `${title} ${weeks > 1 ? `(${i+1})` : ''}`,
                  currentDate.toISOString(),
                  duration_minutes
                );

                await connection.execute(`
                  INSERT INTO Zoom_Meetings (lesson_id, meeting_id, join_url, start_url)
                  VALUES (?, ?, ?, ?)
                `, [lessonId, meeting.id, meeting.join_url, meeting.start_url]);

            } catch (err) {
                console.error("Zoom error:", err);
            }
        }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Zaplanowano.' });

  } catch (error) {
    await connection.rollback();
    res.status(409).json({ message: error.message });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/meetings/{id}/start-early:
 *   patch:
 *     summary: Oznacza rozpoczęcie lekcji przed planowanym czasem.
 *     tags:
 *       - Lekcje
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/start-early', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień' });
  await dbPool.execute('UPDATE Lessons SET is_started_early = 1 WHERE lesson_id = ?', [req.params.id]);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/finish:
 *   patch:
 *     summary: Zakończenie lekcji przed czasem + automatyczne potwierdzenie przez nauczyciela.
 *     tags:
 *       - Lekcje
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/finish', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień' });
  const { id } = req.params;

  await dbPool.execute('UPDATE Lessons SET is_ended_early = 1 WHERE lesson_id = ?', [id]);
  await dbPool.execute(`
    INSERT IGNORE INTO Lesson_Confirmations (lesson_id, user_id, is_confirmed)
    VALUES (?, ?, 1)
  `, [id, req.user.user_id]);

  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/cancel:
 *   patch:
 *     summary: Anuluje lekcję.
 *     tags:
 *       - Lekcje
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  const role = req.user.role;
  await dbPool.execute(`
    UPDATE Lessons SET status = "cancelled", cancelled_by = ?
    WHERE lesson_id = ?
  `, [role, req.params.id]);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/confirm:
 *   patch:
 *     summary: Potwierdzenie odbycia lekcji przez użytkownika (ucznia lub nauczyciela).
 *     tags:
 *       - Lekcje
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/confirm', protect, async (req, res) => {
    const { id } = req.params;

    await dbPool.execute(`
      INSERT IGNORE INTO Lesson_Confirmations (lesson_id, user_id, is_confirmed)
      VALUES (?, ?, 1)
    `, [id, req.user.user_id]);

    const [confirms] = await dbPool.execute(`
      SELECT u.role FROM Lesson_Confirmations lc
      JOIN Users u ON lc.user_id = u.user_id
      WHERE lc.lesson_id = ? AND lc.is_confirmed = 1
    `, [id]);

    const hasTeacher = confirms.some(c => c.role === 'teacher');
    const hasStudent = confirms.some(c => c.role === 'student');

    if (hasTeacher && hasStudent) {
        await dbPool.execute(`
          UPDATE Lessons SET status = "completed" WHERE lesson_id = ?
        `, [id]);
    }

    res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/report:
 *   get:
 *     summary: Pobiera raport spotkania oraz status potwierdzeń lekcji.
 *     tags:
 *       - Raporty
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/report', protect, async (req, res) => {
    const { id } = req.params;

    const [zoomRows] = await dbPool.execute(`
      SELECT meeting_id, report_json
      FROM Zoom_Meetings WHERE lesson_id = ?
    `, [id]);

    let report = null;

    if (zoomRows.length > 0) {
        if (zoomRows[0].report_json) {
            report = JSON.parse(zoomRows[0].report_json);
        } else if (zoomRows[0].meeting_id) {
            report = await getMeetingReport(zoomRows[0].meeting_id);
            if (report) {
                await dbPool.execute(`
                  UPDATE Zoom_Meetings SET report_json = ?
                  WHERE lesson_id = ?
                `, [JSON.stringify(report), id]);
            }
        }
    }

    const [confirms] = await dbPool.execute(`
      SELECT u.role FROM Lesson_Confirmations lc
      JOIN Users u ON lc.user_id = u.user_id
      WHERE lc.lesson_id = ? AND lc.is_confirmed = 1
    `, [id]);

    res.json({
        success: true,
        report,
        confirmations: {
            is_confirmed_by_teacher: confirms.some(c => c.role === 'teacher') ? 1 : 0,
            is_confirmed_by_student: confirms.some(c => c.role === 'student') ? 1 : 0
        }
    });
});

/**
 * @swagger
 * /api/meetings/{id}/zoom-report:
 *   get:
 *     summary: Pobiera aktualny raport Zoom z API Zoom i zapisuje go w bazie.
 *     tags:
 *       - Raporty
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/zoom-report', protect, async (req, res) => {
    const { id } = req.params;
    const [rows] = await dbPool.execute(`
      SELECT meeting_id FROM Zoom_Meetings WHERE lesson_id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ message: "Brak danych Zoom" });

    const report = await getMeetingReport(rows[0].meeting_id);

    if (report) {
        await dbPool.execute(`
          UPDATE Zoom_Meetings SET report_json = ?
          WHERE lesson_id = ?
        `, [JSON.stringify(report), id]);
        return res.json({ success: true, data: report });
    }

    res.json({ success: false, message: "Raport niedostępny" });
});

/**
 * @swagger
 * /api/meetings/availability:
 *   get:
 *     summary: Pobiera zajęte godziny nauczyciela dla danego dnia.
 *     tags:
 *       - Dostępność
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: course_id
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *       - name: date
 *         in: query
 *         required: true
 *         description: Data w formacie YYYY-MM-DD
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista zajętych przedziałów czasowych.
 */
router.get('/availability', protect, async (req, res) => {
  const { course_id, date } = req.query;

  if (!course_id || !date) return res.status(400).json({ message: 'Brak parametrów.' });

  try {
    const [course] = await dbPool.execute(`
      SELECT teacher_id FROM Courses WHERE course_id = ?
    `, [course_id]);
    if (course.length === 0) return res.json({ busySlots: [] });

    const teacherId = course[0].teacher_id;

    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const [lessons] = await dbPool.execute(`
      SELECT l.scheduled_time, l.duration_minutes
      FROM Lessons l
      JOIN Courses c ON l.course_id = c.course_id
      WHERE c.teacher_id = ?
        AND l.status != 'cancelled'
        AND l.scheduled_time BETWEEN ? AND ?
    `, [teacherId, startOfDay, endOfDay]);

    const busySlots = lessons.map(l => ({
        start: l.scheduled_time,
        duration: l.duration_minutes
    }));

    res.json({ success: true, busySlots });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd sprawdzania dostępności.' });
  }
});

module.exports = router;