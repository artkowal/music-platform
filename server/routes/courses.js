const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const { sendNotification } = require('../utils/notifications');
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Courses
 *     description: Course management, enrollments and access control for teachers and students
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get courses for current user
 *     description: Returns all courses where the user is either the teacher or an enrolled student.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of courses available to the user.
 */
router.get('/', protect, async (req, res) => {
  let query = '';
  let params = [];

  if (req.user.role === 'teacher') {
    query = `
      SELECT c.*, w.name AS workplace_name, w.color_hex,
      (SELECT COUNT(*) FROM Enrollments e WHERE e.course_id = c.course_id) AS student_count,
      (SELECT COUNT(*) FROM Lessons l WHERE l.course_id = c.course_id) AS lesson_count
      FROM Courses c
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `;
    params = [req.user.user_id];
  } else {
    query = `
      SELECT c.*, w.name AS workplace_name, w.color_hex, u.first_name AS teacher_name, u.last_name AS teacher_lastname,
      (SELECT COUNT(*) FROM Lessons l WHERE l.course_id = c.course_id) AS lesson_count
      FROM Enrollments e
      JOIN Courses c ON e.course_id = c.course_id
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      JOIN Users u ON c.teacher_id = u.user_id
      WHERE e.student_id = ?
      ORDER BY c.created_at DESC
    `;
    params = [req.user.user_id];
  }

  try {
    const [rows] = await dbPool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera przy pobieraniu kursów.' });
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     description: Allows a teacher to create a new course and optionally enroll students by email.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - course_type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               workplace_id:
 *                 type: integer
 *                 nullable: true
 *               course_type:
 *                 type: string
 *                 enum: [individual, group]
 *               student_emails:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Course successfully created.
 *       403:
 *         description: Only teachers can create courses.
 */
router.post('/', protect, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień.' });
  }

  const { title, description, workplace_id, course_type, student_emails } = req.body;

  if (!title || !course_type) {
    return res.status(400).json({ message: 'Tytuł i typ kursu są wymagane.' });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const [result] = await connection.execute(
      `INSERT INTO Courses (teacher_id, workplace_id, title, description, course_type, invite_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, workplace_id || null, title, description, course_type, inviteCode]
    );

    const courseId = result.insertId;

    if (student_emails && Array.isArray(student_emails) && student_emails.length > 0) {
      const cleanEmails = student_emails
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (cleanEmails.length > 0) {
        const placeholders = cleanEmails.map(() => '?').join(',');
        const [students] = await connection.execute(
          `SELECT user_id, email FROM Users WHERE role = 'student' AND email IN (${placeholders})`,
          cleanEmails
        );

        for (const student of students) {
          await connection.execute(
            'INSERT IGNORE INTO Enrollments (student_id, course_id) VALUES (?, ?)',
            [student.user_id, courseId]
          );

          const io = req.app.get('io');

          await sendNotification(dbPool, io, student.user_id, {
            type: 'info',
            title: 'Zostałeś dodany do kursu!',
            description: `Nauczyciel dodał Cię do nowego kursu: "${title}"`,
            link: `/dashboard/courses/${courseId}`
          });
        }
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Kurs utworzony.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Błąd podczas tworzenia kursu.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     description: Deletes a course owned by the teacher and notifies enrolled students.
 *     tags:
 *       - Courses
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
 *         description: Course deleted successfully.
 *       403:
 *         description: Only the course owner can delete it.
 *       404:
 *         description: Course not found.
 */
router.delete('/:id', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień.' });

  const courseId = req.params.id;

  const [courseRows] = await dbPool.execute(
    'SELECT title FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [courseId, req.user.user_id]
  );

  if (courseRows.length === 0) {
    return res.status(404).json({ message: 'Nie znaleziono kursu.' });
  }

  const courseTitle = courseRows[0].title;
  const [students] = await dbPool.execute('SELECT student_id FROM Enrollments WHERE course_id = ?', [courseId]);

  await dbPool.execute(
    'DELETE FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [courseId, req.user.user_id]
  );

  const io = req.app.get('io');
  for (const s of students) {
      await sendNotification(dbPool, io, s.student_id, {
          type: 'warning',
          title: 'Kurs został usunięty',
          description: `Nauczyciel usunął kurs "${courseTitle}".`,
          link: '#'
      });
  }

  res.json({ success: true, message: 'Kurs usunięty.' });
});

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course details
 *     description: Updates course title, type, description or workplace. Only the teacher can edit the course.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               workplace_id:
 *                 type: integer
 *                 nullable: true
 *               description:
 *                 type: string
 *               course_type:
 *                 type: string
 *                 enum: [individual, group]
 *     responses:
 *       200:
 *         description: Course updated successfully.
 */
router.put('/:id', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień.' });

  const { title, workplace_id, description, course_type } = req.body;

  await dbPool.execute(
    `UPDATE Courses
     SET title = COALESCE(?, title),
         workplace_id = ?,
         description = COALESCE(?, description),
         course_type = COALESCE(?, course_type)
     WHERE course_id = ? AND teacher_id = ?`,
    [
      title,
      workplace_id === null ? null : workplace_id,
      description,
      course_type,
      req.params.id,
      req.user.user_id,
    ]
  );

  res.json({ success: true, message: 'Kurs zaktualizowany.' });
});

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Enroll a student by email
 *     description: Adds a student to a course by their email address. Only the course teacher can do this.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student successfully enrolled.
 *       404:
 *         description: Student not found.
 *       403:
 *         description: Not your course.
 */
router.post('/:id/enroll', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień.' });

  const { email } = req.body;
  const courseId = req.params.id;
  const cleanEmail = email ? email.trim() : '';

  const [users] = await dbPool.execute(
    'SELECT user_id FROM Users WHERE email = ? AND role = "student"',
    [cleanEmail]
  );

  if (users.length === 0) return res.status(404).json({ message: 'Nie znaleziono ucznia.' });

  const studentId = users[0].user_id;

  const [courseCheck] = await dbPool.execute(
    'SELECT course_id, title FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [courseId, req.user.user_id]
  );

  if (courseCheck.length === 0) return res.status(403).json({ message: 'To nie jest Twój kurs.' });

  const courseTitle = courseCheck[0].title;

  await dbPool.execute(
    'INSERT IGNORE INTO Enrollments (student_id, course_id) VALUES (?, ?)',
    [studentId, courseId]
  );

  const io = req.app.get('io');
  await sendNotification(dbPool, io, studentId, {
        type: 'info',
        title: 'Zostałeś dodany do kursu!',
        description: `Nauczyciel dodał Cię do kursu: "${courseTitle}"`,
        link: `/dashboard/courses/${courseId}`
    });

  res.json({ success: true, message: 'Uczeń dodany.' });
});

/**
 * @swagger
 * /api/courses/{id}/students/{studentId}:
 *   delete:
 *     summary: Remove a student from a course
 *     description: Removes a student from the course and sends them a notification.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student removed from course.
 */
router.delete('/:id/students/:studentId', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień.' });

  const { id, studentId } = req.params;

  const [courseCheck] = await dbPool.execute(
    'SELECT title FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [id, req.user.user_id]
  );

  if (courseCheck.length === 0) return res.status(403).json({ message: 'To nie jest Twój kurs.' });

  const courseTitle = courseCheck[0].title;

  await dbPool.execute(
    'DELETE FROM Enrollments WHERE course_id = ? AND student_id = ?',
    [id, studentId]
  );

  const io = req.app.get('io');
  await sendNotification(dbPool, io, studentId, {
      type: 'warning',
      title: 'Zostałeś usunięty z kursu',
      description: `Nauczyciel usunął Cię z kursu "${courseTitle}".`,
      link: '#' 
  });

  res.json({ success: true, message: 'Uczeń usunięty.' });
});

/**
 * @swagger
 * /api/courses/{id}/details:
 *   get:
 *     summary: Get course details
 *     description: Returns course details. Teachers also receive a list of enrolled students.
 *     tags:
 *       - Courses
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
 *         description: Course data and optional student list.
 *       404:
 *         description: Course not found or access denied.
 */
router.get('/:id/details', protect, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.user_id;
  const userRole = req.user.role;

  let query = '';
  let params = [];

  if (userRole === 'teacher') {
    query = `
      SELECT c.*, w.color_hex, w.name AS workplace_name
      FROM Courses c
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      WHERE c.course_id = ? AND c.teacher_id = ?
    `;
    params = [courseId, userId];
  } else {
    query = `
      SELECT c.*, w.color_hex, w.name AS workplace_name, u.first_name AS teacher_name, u.last_name AS teacher_lastname
      FROM Courses c
      JOIN Enrollments e ON c.course_id = e.course_id
      JOIN Users u ON c.teacher_id = u.user_id
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      WHERE c.course_id = ? AND e.student_id = ?
    `;
    params = [courseId, userId];
  }

  try {
    const [courseRows] = await dbPool.execute(query, params);

    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Kurs nie istnieje lub brak dostępu.' });
    }

    let studentRows = [];
    if (userRole === 'teacher') {
      [studentRows] = await dbPool.execute(
        `SELECT u.user_id, u.email, u.first_name, u.last_name
         FROM Enrollments e
         JOIN Users u ON e.student_id = u.user_id
         WHERE e.course_id = ?`,
        [courseId]
      );
    }

    res.json({
      success: true,
      course: courseRows[0],
      students: studentRows
    });

  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/courses/join:
 *   post:
 *     summary: Join a course using invite code
 *     description: Allows a student to join a course using a valid invite code.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully joined the course.
 *       400:
 *         description: Already enrolled.
 *       404:
 *         description: Invalid invite code.
 */
router.post('/join', protect, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Tylko uczniowie mogą dołączać.' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Kod wymagany.' });

  const [courses] = await dbPool.execute(
    'SELECT course_id, teacher_id, title FROM Courses WHERE invite_code = ?',
    [code.toUpperCase()]
  );

  if (courses.length === 0) return res.status(404).json({ message: 'Nieprawidłowy kod.' });

  const { course_id, teacher_id, title } = courses[0];

  try {
    await dbPool.execute(
      'INSERT INTO Enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.user_id, course_id]
    );

    const io = req.app.get('io');
    await sendNotification(dbPool, io, teacher_id, {
        type: 'info',
        title: 'Nowy uczeń!',
        description: `${req.user.first_name} ${req.user.last_name} dołączył do kursu "${title}"`,
        link: `/dashboard/courses/${course_id}`
    });

    res.json({ success: true, message: 'Dołączono.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Już jesteś na tym kursie.' });
    }
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/courses/{id}/leave:
 *   delete:
 *     summary: Leave a course
 *     description: Allows a student to leave a course and notifies the teacher.
 *     tags:
 *       - Courses
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
 *         description: Course left successfully.
 *       403:
 *         description: Only students can leave courses.
 */
router.delete('/:id/leave', protect, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Brak uprawnień.' });

  const courseId = req.params.id;

  const [courses] = await dbPool.execute(
    'SELECT teacher_id, title FROM Courses WHERE course_id = ?',
    [courseId]
  );

  await dbPool.execute(
    'DELETE FROM Enrollments WHERE course_id = ? AND student_id = ?',
    [courseId, req.user.user_id]
  );

  if (courses.length > 0) {
    const { teacher_id, title } = courses[0];
    const io = req.app.get('io');
    
    await sendNotification(dbPool, io, teacher_id, {
        type: 'warning',
        title: 'Uczeń opuścił kurs',
        description: `${req.user.first_name} ${req.user.last_name} opuścił kurs "${title}".`,
        link: `/dashboard/courses/${courseId}`
    });
  }

  res.json({ success: true, message: 'Opuszczono kurs.' });
});

/**
 * @swagger
 * /api/courses/scheduler-list:
 *   get:
 *     summary: Get scheduler data
 *     description: Returns a list of people and courses for building the lesson scheduler.
 *     tags:
 *       - Courses
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Scheduler data (students or teachers with their courses).
 */
router.get('/scheduler-list', protect, async (req, res) => {
  const userId = req.user.user_id;
  const role = req.user.role;
  let query = '';
  let params = [userId];

  try {
    if (role === 'teacher') {
      query = `
        SELECT 
          u.user_id as person_id,
          u.first_name,
          u.last_name,
          u.email,
          c.course_id,
          c.title as course_title,
          c.course_type
        FROM Courses c
        JOIN Enrollments e ON c.course_id = e.course_id
        JOIN Users u ON e.student_id = u.user_id
        WHERE c.teacher_id = ?
        ORDER BY u.last_name ASC, c.title ASC
      `;
    } else {
      query = `
        SELECT 
          u.user_id as person_id,
          u.first_name,
          u.last_name,
          u.email,
          c.course_id,
          c.title as course_title,
          c.course_type
        FROM Enrollments e
        JOIN Courses c ON e.course_id = c.course_id
        JOIN Users u ON c.teacher_id = u.user_id
        WHERE e.student_id = ?
        ORDER BY u.last_name ASC, c.title ASC
      `;
    }

    const [rows] = await dbPool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Błąd pobierania listy do harmonogramu:", error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

module.exports = router;