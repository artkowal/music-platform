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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Początek zakresu dat
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Koniec zakresu dat
 *     responses:
 *       200:
 *         description: Lista spotkań użytkownika
 *       500:
 *         description: Błąd podczas pobierania danych
 */
router.get('/calendar', protect, async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user.user_id;
  const role = req.user.role;

  const startDate = start || formatToMySQLDateTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const endDate = end || formatToMySQLDateTime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  try {
    await autoCompleteStationaryLessons(dbPool);

    let meetingQuery = '';
    let params = [userId, startDate, endDate];
    let combinedData = [];

    // 1. Pobieranie LEKCJI (Wspólne dla obu ról, różni się tylko warunek WHERE)
    if (role === 'teacher') {
      meetingQuery = `
        SELECT m.meeting_id, m.course_id, m.title, m.description, m.scheduled_time, m.duration_minutes, 
               m.type, m.status, m.started_at, m.is_confirmed_by_teacher, m.is_confirmed_by_student,
               c.title AS course_title, c.workplace_id, w.name AS workplace_name, w.color_hex AS workplace_color,
               'lesson' as event_type
        FROM Meetings m
        JOIN Courses c ON m.course_id = c.course_id
        LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
        WHERE c.teacher_id = ?
        AND m.scheduled_time BETWEEN ? AND ?
      `;
    } else {
      meetingQuery = `
        SELECT m.meeting_id, m.course_id, m.title, m.description, m.scheduled_time, m.duration_minutes, 
               m.type, m.status, m.started_at, m.is_confirmed_by_teacher, m.is_confirmed_by_student,
               c.title AS course_title, c.workplace_id, w.name AS workplace_name, w.color_hex AS workplace_color,
               u.first_name AS teacher_name, u.last_name AS teacher_lastname,
               'lesson' as event_type
        FROM Meetings m
        JOIN Courses c ON m.course_id = c.course_id
        JOIN Enrollments e ON c.course_id = e.course_id
        LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
        JOIN Users u ON c.teacher_id = u.user_id
        WHERE e.student_id = ?
        AND m.scheduled_time BETWEEN ? AND ?
      `;
    }

    const [meetings] = await dbPool.execute(meetingQuery, params);
    combinedData = [...meetings];

    // 2. Pobieranie DNI WOLNYCH (Tylko dla nauczyciela - uczeń nie musi widzieć wolnego nauczyciela w SWOIM kalendarzu, widzi to przy umawianiu)
    if (role === 'teacher') {
        const timeOffQuery = `
            SELECT availability_id as meeting_id, 
                   note as title, 
                   start_time as scheduled_time, 
                   TIMESTAMPDIFF(MINUTE, start_time, end_time) as duration_minutes, 
                   'stationary' as type, 
                   'completed' as status, 
                   '#ef4444' as workplace_color, 
                   'time_off' as event_type
            FROM TeacherAvailability 
            WHERE teacher_id = ? AND start_time BETWEEN ? AND ?
        `;
        const [timeOffs] = await dbPool.execute(timeOffQuery, [userId, startDate, endDate]);
        combinedData = [...combinedData, ...timeOffs];
    }
    
    res.json({ success: true, data: combinedData });

  } catch (error) {
    console.error("Błąd kalendarza:", error);
    res.status(500).json({ message: 'Błąd pobierania danych kalendarza.' });
  }
});

/**
 * @swagger
 * /api/meetings/schedule:
 *   post:
 *     summary: Tworzy jedno lub wiele zaplanowanych spotkań
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *               - title
 *               - scheduled_time
 *               - duration_minutes
 *               - type
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
 *               type:
 *                 type: string
 *                 enum: [online, stationary]
 *               repeat_weeks:
 *                 type: integer
 *                 description: Ile tygodni powtarzać spotkanie
 *     responses:
 *       201:
 *         description: Utworzono spotkania
 *       403:
 *         description: Brak dostępu
 *       409:
 *         description: Konflikt terminów
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

    const io = req.app.get('io');
    if (io) {
        if (req.user.role === 'teacher') {
            // Nauczyciel zaplanował -> wyślij do uczniów
            const [students] = await dbPool.execute('SELECT student_id FROM Enrollments WHERE course_id = ?', [course_id]);
            students.forEach(s => {
                io.to(`user_${s.student_id}`).emit('notification', {
                    type: 'info',
                    title: 'Nowe spotkanie',
                    description: `Nauczyciel zaplanował spotkanie: "${title}"`,
                    link: `/dashboard/calendar`
                });
            });
        } else {
            // Uczeń zaplanował -> wyślij do nauczyciela
            io.to(`user_${teacherId}`).emit('notification', {
                type: 'info',
                title: 'Nowe spotkanie',
                description: `Uczeń zaplanował spotkanie: "${title}"`,
                link: `/dashboard/calendar`
            });
        }
    }

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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista spotkań kursu
 *       500:
 *         description: Błąd serwera
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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Zaktualizowano dane spotkania
 *       403:
 *         description: Brak uprawnień
 */
router.patch('/:id/start-early', protect, async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });
  
  const meetingId = req.params.id; 

  await dbPool.execute(
    'UPDATE Meetings SET started_at = NOW() WHERE meeting_id = ?',
    [meetingId]
  );

  const [meetingRows] = await dbPool.execute(
      'SELECT course_id, title FROM Meetings WHERE meeting_id = ?', 
      [meetingId] 
  );

  if (meetingRows.length > 0) {
      const { course_id, title } = meetingRows[0];
      const [students] = await dbPool.execute('SELECT student_id FROM Enrollments WHERE course_id = ?', [course_id]);
      
      const io = req.app.get('io');
      if (io && students.length > 0) {
          students.forEach(s => {
            io.to(`user_${s.student_id}`).emit('notification', {
                type: 'success',
                title: 'Lekcja rozpoczęta!',
                description: `Nauczyciel rozpoczął lekcję: "${title}". Dołącz teraz!`,
                link: `/dashboard/courses/${course_id}`
            });
          });
      }
  }

  res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/{id}/finish:
 *   patch:
 *     summary: Zamyka lekcję i ustawia status pending
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Spotkanie zakończone
 *       403:
 *         description: Brak uprawnień
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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Zapisano potwierdzenie
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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Spotkanie anulowane
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.user_id;
  const meetingId = req.params.id;

  await dbPool.execute(
    `
    UPDATE Meetings 
    SET status = "cancelled", cancelled_by = ?
    WHERE meeting_id = ?
  `,
    [role, meetingId]
  );

  // --- POWIADOMIENIE O ODWOŁANIU ---
  const io = req.app.get('io');
  if (io) {
      // Pobierz dane spotkania
      const [meeting] = await dbPool.execute(
          `SELECT m.title, c.teacher_id, m.course_id 
           FROM Meetings m 
           JOIN Courses c ON m.course_id = c.course_id 
           WHERE m.meeting_id = ?`, 
           [meetingId]
      );

      if (meeting.length > 0) {
          const { title, teacher_id, course_id } = meeting[0];

          if (role === 'teacher') {
              // Nauczyciel odwołał -> powiadom wszystkich uczniów
              const [students] = await dbPool.execute('SELECT student_id FROM Enrollments WHERE course_id = ?', [course_id]);
              students.forEach(s => {
                  io.to(`user_${s.student_id}`).emit('notification', {
                      type: 'warning',
                      title: 'Zajęcia odwołane',
                      description: `Nauczyciel odwołał spotkanie: "${title}"`
                  });
              });
          } else {
              // Uczeń odwołał -> powiadom nauczyciela
              io.to(`user_${teacher_id}`).emit('notification', {
                  type: 'warning',
                  title: 'Zajęcia odwołane',
                  description: `Uczeń ${req.user.first_name} ${req.user.last_name} odwołał spotkanie: "${title}"`
              });
          }
      }
  }

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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Raport spotkania
 *       404:
 *         description: Nie znaleziono raportu
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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Zwraca najnowszy raport
 *       404:
 *         description: Brak raportu lub ID
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
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: course_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista zajętych terminów
 *       400:
 *         description: Brak parametrów
 */
router.get('/availability', protect, async (req, res) => {
  const { course_id, date } = req.query;

  if (!date) return res.status(400).json({ message: 'Brak daty.' });

  const userId = req.user.user_id;
  const role = req.user.role;
  
  const startDay = `${date} 00:00:00`;
  const endDay = `${date} 23:59:59`;

  try {
    let teacherId = null;
    let studentIds = [];

    // Logika określania kogo sprawdzamy
    if (role === 'teacher') {
        teacherId = userId;
      
        if (course_id) {
            const [enrollments] = await dbPool.execute(
                'SELECT student_id FROM Enrollments WHERE course_id = ?', 
                [course_id]
            );
            studentIds = enrollments.map(e => e.student_id);
        }
    } else {
        studentIds = [userId];
        
        // Musi wybrać kurs, żebyśmy wiedzieli o jakiego nauczyciela chodzi
        if (course_id) {
            const [courses] = await dbPool.execute(
                'SELECT teacher_id FROM Courses WHERE course_id = ?',
                [course_id]
            );
            if (courses.length > 0) teacherId = courses[0].teacher_id;
        }
    }

    let busySlots = [];

    // ZAJĘTE PRZEZ NAUCZYCIELA (Lekcje + Wolne)
    if (teacherId) {
        const [teacherMeetings] = await dbPool.execute(
          `SELECT m.scheduled_time, m.duration_minutes 
           FROM Meetings m 
           JOIN Courses c ON m.course_id = c.course_id
           WHERE c.teacher_id = ? 
           AND m.status != 'cancelled' 
           AND m.scheduled_time BETWEEN ? AND ?`,
          [teacherId, startDay, endDay]
        );

        teacherMeetings.forEach(m => busySlots.push({
            start: m.scheduled_time,
            duration: m.duration_minutes
        }));

        const [timeOffs] = await dbPool.execute(
            `SELECT start_time, end_time FROM TeacherAvailability
             WHERE teacher_id = ? 
             AND (
                (start_time <= ? AND end_time >= ?) OR 
                (start_time BETWEEN ? AND ?) OR 
                (end_time BETWEEN ? AND ?)
             )`,
            [teacherId, endDay, startDay, startDay, endDay, startDay, endDay]
        );

        timeOffs.forEach(off => {
            const start = new Date(off.start_time);
            const end = new Date(off.end_time);
            const duration = (end - start) / 60000;
            busySlots.push({
                start: off.start_time,
                duration: duration > 0 ? duration : 1440
            });
        });
    }

    // ZAJĘTE PRZEZ UCZNIÓW (Konflikty w innych kursach)
    if (studentIds.length > 0) {
        const placeholders = studentIds.map(() => '?').join(',');
        
        const [studentMeetings] = await dbPool.execute(
            `SELECT m.scheduled_time, m.duration_minutes
             FROM Meetings m
             JOIN Enrollments e ON m.course_id = e.course_id
             WHERE e.student_id IN (${placeholders})
             AND m.status != 'cancelled'
             AND m.scheduled_time BETWEEN ? AND ?`,
            [...studentIds, startDay, endDay]
        );

        studentMeetings.forEach(m => busySlots.push({
            start: m.scheduled_time,
            duration: m.duration_minutes
        }));
    }

    res.json({ success: true, busySlots });
  } catch (error) {
    console.error("Availability Error:", error);
    res.status(500).json({ message: 'Błąd' });
  }
});

/**
 * @swagger
 * /api/meetings/unconfirmed:
 *   get:
 *     summary: Zwraca najbliższe niepotwierdzone spotkanie ucznia
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Zwraca najbliższe spotkanie w statusie pending, oczekujące na potwierdzenie ucznia
 *       500:
 *         description: Błąd serwera
 */
router.get('/unconfirmed', protect, async (req, res) => {
  if (req.user.role === 'teacher') return res.json({ meeting: null });

  const studentId = req.user.user_id;

  try {
    const [rows] = await dbPool.execute(`
      SELECT m.meeting_id, m.title, m.scheduled_time, m.duration_minutes, 
             u.first_name as teacher_name, u.last_name as teacher_lastname
      FROM Meetings m
      JOIN Courses c ON m.course_id = c.course_id
      JOIN Users u ON c.teacher_id = u.user_id
      JOIN Enrollments e ON c.course_id = e.course_id
      WHERE e.student_id = ?
        AND m.status = 'pending' 
        AND m.is_confirmed_by_teacher = 1 
        AND m.is_confirmed_by_student = 0
      ORDER BY m.scheduled_time ASC
      LIMIT 1
    `, [studentId]);

    if (rows.length > 0) {
      return res.json({ meeting: rows[0] });
    }

    res.json({ meeting: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd sprawdzania powiadomień' });
  }
});

/**
 * @swagger
 * /api/meetings/{id}/dispute:
 *   post:
 *     summary: Zgłasza spór dotyczący lekcji przez ucznia (lekcja rzekomo się nie odbyła)
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID spotkania
 *     responses:
 *       200:
 *         description: Zgłoszono spór
 *       403:
 *         description: Brak uprawnień
 *       500:
 *         description: Błąd serwera
 */
router.post('/:id/dispute', protect, async (req, res) => {
    const meetingId = req.params.id;
    const studentId = req.user.user_id;
    
    await dbPool.execute(
        `UPDATE Meetings SET status = 'disputed', is_confirmed_by_student = 0 WHERE meeting_id = ?`,
        [meetingId]
    );

    const io = req.app.get('io');
    if (io) {
         const [rows] = await dbPool.execute(
            'SELECT c.teacher_id, m.title FROM Meetings m JOIN Courses c ON m.course_id = c.course_id WHERE m.meeting_id = ?', 
            [meetingId]
         );
         if(rows.length > 0) {
             io.to(`user_${rows[0].teacher_id}`).emit('notification', {
                 type: 'error',
                 title: 'Problem z lekcją',
                 description: `Uczeń zgłosił, że lekcja "${rows[0].title}" się nie odbyła.`
             });
         }
    }

    res.json({ success: true });
});

/**
 * @swagger
 * /api/meetings/time-off:
 *   post:
 *     summary: Dodaje nową niedostępność nauczyciela
 *     description: |
 *       Tworzy wpis o niedostępności nauczyciela (dzień wolny lub zakres godzin).
 *       Dostępne tylko dla użytkowników z rolą **teacher**.
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_time
 *               - end_time
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Początek okresu niedostępności
 *                 example: "2025-01-10T09:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Koniec okresu niedostępności (musi być po start_time)
 *                 example: "2025-01-10T16:00:00Z"
 *               note:
 *                 type: string
 *                 description: Opcjonalna notatka dotycząca powodu niedostępności
 *                 example: "Szkolenie"
 *     responses:
 *       200:
 *         description: Pomyślnie dodano niedostępność nauczyciela
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       400:
 *         description: Walidacja nie powiodła się — start_time jest później niż end_time
 *         content:
 *           application/json:
 *             example:
 *               message: "Data końcowa musi być po dacie początkowej"
 *       403:
 *         description: Brak uprawnień — endpoint tylko dla nauczycieli
 *         content:
 *           application/json:
 *             example:
 *               message: "Brak uprawnień"
 *       500:
 *         description: Nieoczekiwany błąd serwera
 *         content:
 *           application/json:
 *             example:
 *               message: "Błąd zapisu"
 */
router.post('/time-off', protect, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień' });

    const { start_time, end_time, note } = req.body;
    const teacherId = req.user.user_id;

    // Prosta walidacja
    if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ message: 'Data końcowa musi być po dacie początkowej' });
    }

    const startFormatted = formatToMySQLDateTime(new Date(start_time));
    const endFormatted = formatToMySQLDateTime(new Date(end_time));

    try {
        await dbPool.execute(
            `INSERT INTO TeacherAvailability (teacher_id, start_time, end_time, note) VALUES (?, ?, ?, ?)`,
            [teacherId, startFormatted, endFormatted, note || 'Niedostępny']
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Błąd zapisu TimeOff:", error);
        res.status(500).json({ message: 'Błąd zapisu' });
    }
});

/**
 * @swagger
 * /api/meetings/time-off/{id}:
 *   delete:
 *     summary: Usuwa wpis niedostępności nauczyciela
 *     description: |
 *       Usuwa istniejący wpis `TeacherAvailability`.  
 *       Endpoint dostępny wyłącznie dla użytkowników z rolą **teacher**.
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID wpisu niedostępności nauczyciela
 *         example: 42
 *     responses:
 *       200:
 *         description: Wpis niedostępności został pomyślnie usunięty
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Usunięto dzień wolny."
 *       403:
 *         description: Brak uprawnień — endpoint tylko dla nauczycieli
 *         content:
 *           application/json:
 *             example:
 *               message: "Brak uprawnień"
 *       404:
 *         description: Nie znaleziono wpisu lub nauczyciel nie jest jego właścicielem
 *         content:
 *           application/json:
 *             example:
 *               message: "Nie znaleziono wpisu lub brak uprawnień."
 */
router.delete('/time-off/:id', protect, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień' });
    
    const { id } = req.params;
    
    const [result] = await dbPool.execute(
        'DELETE FROM TeacherAvailability WHERE availability_id = ? AND teacher_id = ?', 
        [id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Nie znaleziono wpisu lub brak uprawnień.' });
    }

    res.json({ success: true, message: 'Usunięto dzień wolny.' });
});

/**
 * @swagger
 * /api/meetings/time-off/{id}:
 *   put:
 *     summary: Aktualizuje wpis o niedostępności nauczyciela
 *     description: |
 *       Endpoint pozwala nauczycielowi edytować istniejący wpis o niedostępności.
 *       Wpis można edytować tylko jeśli należy do zalogowanego nauczyciela.
 *     tags: [Meetings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID wpisu niedostępności (availability_id)
 *         schema:
 *           type: integer
 *           example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_time
 *               - end_time
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Początek okresu niedostępności
 *                 example: "2025-01-12T14:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Koniec okresu niedostępności (musi być po start_time)
 *                 example: "2025-01-12T18:00:00Z"
 *               note:
 *                 type: string
 *                 description: Opcjonalna notatka dotycząca niedostępności
 *                 example: "Wyjazd prywatny"
 *     responses:
 *       200:
 *         description: Pomyślnie zaktualizowano wpis niedostępności
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Zaktualizowano dzień wolny."
 *       400:
 *         description: Niepoprawne dane wejściowe (np. koniec przed początkiem)
 *         content:
 *           application/json:
 *             example:
 *               message: "Data końcowa musi być po dacie początkowej"
 *       403:
 *         description: Brak uprawnień — tylko nauczyciel może edytować niedostępności
 *         content:
 *           application/json:
 *             example:
 *               message: "Brak uprawnień"
 *       404:
 *         description: Wpis nie istnieje lub nauczyciel nie jest jego właścicielem
 *         content:
 *           application/json:
 *             example:
 *               message: "Nie znaleziono wpisu lub brak uprawnień."
 *       500:
 *         description: Błąd serwera
 */

router.put('/time-off/:id', protect, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień' });
    
    const { id } = req.params;
    const { start_time, end_time, note } = req.body;

    if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ message: 'Data końcowa musi być po dacie początkowej' });
    }

    const startFormatted = formatToMySQLDateTime(new Date(start_time));
    const endFormatted = formatToMySQLDateTime(new Date(end_time));

    const [result] = await dbPool.execute(
        `UPDATE TeacherAvailability 
         SET start_time = ?, end_time = ?, note = ? 
         WHERE availability_id = ? AND teacher_id = ?`,
        [startFormatted, endFormatted, note || 'Niedostępny', id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Nie znaleziono wpisu lub brak uprawnień.' });
    }

    res.json({ success: true, message: 'Zaktualizowano dzień wolny.' });
});

module.exports = router;