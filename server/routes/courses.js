const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Courses
 *     description: Zarządzanie kursami i uczniami
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Pobiera kursy (dla nauczyciela lub ucznia)
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista kursów z informacją o placówce i liczbie uczniów
 */
router.get('/', protect, async (req, res) => {
  let query = '';
  let params = [];

  if (req.user.role === 'teacher') {
    query = `
      SELECT c.*, w.name as workplace_name, w.color_hex,
      (SELECT COUNT(*) FROM Enrollments e WHERE e.course_id = c.course_id) as student_count,
      (SELECT COUNT(*) FROM Lessons l WHERE l.course_id = c.course_id) as lesson_count
      FROM Courses c
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `;
    params = [req.user.user_id];
  } else {
    query = `
      SELECT c.*, w.name as workplace_name, w.color_hex, u.first_name as teacher_name, u.last_name as teacher_lastname,
      (SELECT COUNT(*) FROM Lessons l WHERE l.course_id = c.course_id) as lesson_count
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
    console.error('Błąd pobierania kursów:', error);
    res.status(500).json({ message: 'Błąd serwera przy pobieraniu kursów.' });
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Nauczyciel tworzy nowy kurs (z opcją dodania uczniów)
 *     tags: [Courses]
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
 *         description: Kurs utworzony
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

    // Tworzenie kursu
    const [result] = await connection.execute(
      `INSERT INTO Courses (teacher_id, workplace_id, title, description, course_type, invite_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, workplace_id || null, title, description, course_type, inviteCode]
    );

    const courseId = result.insertId;

    // Dodawanie uczniów
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
        }
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Kurs utworzony.' });
  } catch (error) {
    await connection.rollback();
    console.error('Błąd tworzenia kursu:', error);
    res.status(500).json({ message: 'Błąd podczas tworzenia kursu.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Usuwa kurs
 *     tags: [Courses]
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
 *         description: Kurs usunięty
 */
router.delete('/:id', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień.' });

  const [result] = await dbPool.execute(
    'DELETE FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [req.params.id, req.user.user_id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Nie znaleziono kursu.' });
  }

  res.json({ success: true, message: 'Kurs usunięty.' });
});

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Edytuje kurs (np. zmiana tytułu, placówki)
 *     tags: [Courses]
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
 *         description: Zaktualizowano
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
 *     summary: Dodaje ucznia do kursu po emailu
 *     tags: [Courses]
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
 *         description: Uczeń dodany
 *       404:
 *         description: Uczeń o podanym emailu nie istnieje
 */
router.post('/:id/enroll', protect, async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień.' });

  const { email } = req.body;
  const courseId = req.params.id;

  const cleanEmail = email ? email.trim() : '';

  const [users] = await dbPool.execute(
    'SELECT user_id FROM Users WHERE email = ? AND role = "student"',
    [cleanEmail]
  );

  if (users.length === 0) {
    return res.status(404).json({ message: 'Nie znaleziono ucznia o podanym adresie email.' });
  }

  const studentId = users[0].user_id;

  const [courseCheck] = await dbPool.execute(
    'SELECT course_id FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [courseId, req.user.user_id]
  );

  if (courseCheck.length === 0) {
    return res.status(403).json({ message: 'To nie jest Twój kurs.' });
  }

  await dbPool.execute(
    'INSERT IGNORE INTO Enrollments (student_id, course_id) VALUES (?, ?)',
    [studentId, courseId]
  );

  res.json({ success: true, message: 'Uczeń dodany do kursu.' });
});

/**
 * @swagger
 * /api/courses/{id}/students/{studentId}:
 *   delete:
 *     summary: Usuwa ucznia z kursu
 *     tags: [Courses]
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
 *         description: Uczeń usunięty z kursu
 */
router.delete('/:id/students/:studentId', protect, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Brak uprawnień.' });

  const { id, studentId } = req.params;

  const [courseCheck] = await dbPool.execute(
    'SELECT course_id FROM Courses WHERE course_id = ? AND teacher_id = ?',
    [id, req.user.user_id]
  );

  if (courseCheck.length === 0) {
    return res.status(403).json({ message: 'To nie jest Twój kurs.' });
  }

  await dbPool.execute(
    'DELETE FROM Enrollments WHERE course_id = ? AND student_id = ?',
    [id, studentId]
  );

  res.json({ success: true, message: 'Uczeń usunięty z kursu.' });
});

/**
 * @swagger
 * /api/courses/{id}/details:
 *   get:
 *     summary: Pobiera szczegóły kursu i listę zapisanych uczniów (dla nauczyciela)
 *     tags: [Courses]
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
 *         description: Szczegóły kursu i lista uczniów
 */
router.get('/:id/details', protect, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.user_id;
  const userRole = req.user.role;

  let query = '';
  let params = [];

if (userRole === 'teacher') {
    query = `
      SELECT c.*, w.color_hex, w.name as workplace_name 
      FROM Courses c 
      LEFT JOIN Workplaces w ON c.workplace_id = w.workplace_id
      WHERE c.course_id = ? AND c.teacher_id = ?
    `;
    params = [courseId, userId];
  } else {
    query = `
      SELECT c.*, w.color_hex, w.name as workplace_name, u.first_name as teacher_name, u.last_name as teacher_lastname
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
      return res.status(404).json({ message: 'Kurs nie istnieje lub nie masz do niego dostępu.' });
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
    console.error("Błąd pobierania szczegółów kursu:", error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

module.exports = router;
