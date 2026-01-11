const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const { sendNotification } = require('../utils/notifications');
const dbPool = require('../config/db');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(originalName));
  }
});

const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   - name: Lessons
 *     description: Lesson management, materials, visibility and student progress tracking
 */

/**
 * @swagger
 * /api/lessons/course/{courseId}:
 *   get:
 *     summary: Get all lessons for a course with materials, Zoom meetings and progress
 *     description: >
 *       Returns a full list of lessons for the selected course.  
 *       The response includes Zoom meeting links, attached learning materials,
 *       confirmation status (teacher & student) and lesson progress for the current student.
 *       Students only see visible or cancelled lessons, while teachers see all.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of lessons with materials, confirmations and progress.
 *       401:
 *         description: User is not authenticated.
 *       500:
 *         description: Server error while loading lessons.
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    let query = `
      SELECT 
        l.*, 
        z.meeting_id as zoom_meeting_id, 
        z.join_url as zoom_join_url, 
        z.start_url as zoom_start_url
      FROM Lessons l
      LEFT JOIN Zoom_Meetings z ON l.lesson_id = z.lesson_id
      WHERE l.course_id = ?
    `;
    const params = [req.params.courseId];

    if (req.user.role === 'student') {
      query += ' AND (l.is_visible = 1 OR l.status = "cancelled")';
    }
    query += ' ORDER BY l.lesson_id ASC';

    const [lessons] = await dbPool.execute(query, params);

    let targetStudentId = req.user.role === 'student' ? req.user.user_id : null;

    if (req.user.role === 'teacher') {
      const [enrollments] = await dbPool.execute(
        'SELECT student_id FROM Enrollments WHERE course_id = ? LIMIT 1',
        [req.params.courseId]
      );
      if (enrollments.length > 0) targetStudentId = enrollments[0].student_id;
    }

    for (let lesson of lessons) {

      const [confirms] = await dbPool.execute(`
        SELECT u.role 
        FROM Lesson_Confirmations lc 
        JOIN Users u ON lc.user_id = u.user_id
        WHERE lc.lesson_id = ? AND lc.is_confirmed = 1
      `, [lesson.lesson_id]);

      lesson.is_confirmed_by_teacher = confirms.some(c => c.role === 'teacher');
      lesson.is_confirmed_by_student = confirms.some(c => c.role === 'student');

      const [materials] = await dbPool.execute(
        'SELECT * FROM Materials WHERE lesson_id = ?',
        [lesson.lesson_id]
      );
      lesson.materials = materials;

      lesson.progress = { time_spent_seconds: 0, is_completed: 0, completed_at: null };

      if (targetStudentId) {
        const [progress] = await dbPool.execute(
          'SELECT time_spent_seconds, is_completed, completed_at FROM Lesson_Progress WHERE lesson_id = ? AND student_id = ?',
          [lesson.lesson_id, targetStudentId]
        );
        if (progress.length > 0) lesson.progress = progress[0];
      }
    }

    res.json({ success: true, data: lessons });
  } catch (error) {
    console.error("Błąd pobierania lekcji:", error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create a new stationary lesson with materials
 *     description: >
 *       Creates a new stationary lesson in a course and optionally uploads learning materials.
 *       All students enrolled in the course are notified about the new lesson.
 *       Only teachers are allowed to perform this action.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *               - title
 *             properties:
 *               course_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration_minutes:
 *                 type: integer
 *                 example: 45
 *               is_visible:
 *                 type: boolean
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Lesson successfully created.
 *       403:
 *         description: Only teachers can create lessons.
 *       500:
 *         description: Server error while creating lesson.
 */
router.post('/', protect, upload.array('files'), async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const { course_id, title, description, duration_minutes, is_visible } = req.body;
  const files = req.files;

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const isVisibleVal = is_visible === 'false' ? 0 : 1;

    const [lessonResult] = await connection.execute(
      `
      INSERT INTO Lessons 
      (course_id, title, description, duration_minutes, is_visible, status, lesson_type)
      VALUES (?, ?, ?, ?, ?, ?, "stationary")
      `,
      [
        course_id,
        title,
        description,
        duration_minutes || 45,
        isVisibleVal,
        'planned'
      ]
    );

    const lessonId = lessonResult.insertId;

    if (files?.length > 0) {
      for (const file of files) {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const relativePath = `uploads/${file.filename}`;

        await connection.execute(
          'INSERT INTO Materials (lesson_id, title, file_path) VALUES (?, ?, ?)',
          [lessonId, originalName, relativePath]
        );
      }
    }

    await connection.commit();

    const [courseRows] = await dbPool.execute('SELECT title FROM Courses WHERE course_id = ?', [course_id]);
    const courseTitle = courseRows.length > 0 ? courseRows[0].title : 'Kurs';

    const [students] = await dbPool.execute('SELECT student_id FROM Enrollments WHERE course_id = ?', [course_id]);

    const io = req.app.get('io');
    
    for (const s of students) {
        await sendNotification(dbPool, io, s.student_id, {
            type: 'info',
            title: 'Nowa lekcja!',
            description: `Dodano nową lekcję "${title}" w kursie "${courseTitle}".`,
            link: `/dashboard/courses/${course_id}/lessons/${lessonId}`
        });
    }

    res.status(201).json({ success: true, message: 'Lekcja utworzona' });
  } catch (error) {
    await connection.rollback();
    console.error('Błąd tworzenia lekcji:', error);
    res.status(500).json({ message: 'Błąd podczas tworzenia lekcji' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update lesson details
 *     description: >
 *       Updates lesson metadata such as title, description, duration and visibility.
 *       Only teachers are allowed to update lessons.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration_minutes:
 *                 type: integer
 *               is_visible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lesson successfully updated.
 *       403:
 *         description: Only teachers can update lessons.
 *       500:
 *         description: Server error while updating lesson.
 */
router.put('/:id', protect, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const { title, description, duration_minutes, is_visible } = req.body;

  try {
    await dbPool.execute(
      `
      UPDATE Lessons SET 
        title = COALESCE(?, title), 
        description = COALESCE(?, description), 
        duration_minutes = COALESCE(?, duration_minutes),
        is_visible = COALESCE(?, is_visible)
      WHERE lesson_id = ?
      `,
      [title, description, duration_minutes, is_visible, req.params.id]
    );

    res.json({ success: true, message: 'Zaktualizowano lekcję' });
  } catch (error) {
    console.error('Błąd edycji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete a lesson
 *     description: Permanently removes a lesson from the system. Only teachers are allowed to delete lessons.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson successfully deleted.
 *       403:
 *         description: Only teachers can delete lessons.
 *       500:
 *         description: Server error while deleting lesson.
 */
router.delete('/:id', protect, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  try {
    await dbPool.execute(
      'DELETE FROM Lessons WHERE lesson_id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Lekcja usunięta' });
  } catch (error) {
    console.error('Błąd usuwania lekcji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/lessons/{id}/materials:
 *   post:
 *     summary: Upload materials to an existing lesson
 *     description: Adds one or more files to a lesson. Only teachers are allowed to upload materials.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Materials successfully uploaded.
 *       403:
 *         description: Only teachers can upload materials.
 *       500:
 *         description: Server error while uploading files.
 */
router.post('/:id/materials', protect, upload.array('files'), async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const files = req.files;
  const lessonId = req.params.id;

  try {
    if (files?.length > 0) {
      for (const file of files) {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const relativePath = `uploads/${file.filename}`;

        await dbPool.execute(
          'INSERT INTO Materials (lesson_id, title, file_path) VALUES (?, ?, ?)',
          [lessonId, originalName, relativePath]
        );
      }
    }

    res.json({ success: true, message: 'Materiały dodane' });
  } catch (error) {
    console.error('Błąd dodawania materiałów:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/lessons/{id}/materials/{materialId}:
 *   delete:
 *     summary: Delete a lesson material
 *     description: Removes a single uploaded file from a lesson and deletes it from the server.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material successfully deleted.
 *       404:
 *         description: Material not found.
 *       403:
 *         description: Only teachers can delete materials.
 *       500:
 *         description: Server error while deleting material.
 */
router.delete('/:id/materials/:materialId', protect, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const { materialId } = req.params;

  try {
    const [rows] = await dbPool.execute(
      'SELECT file_path FROM Materials WHERE material_id = ?',
      [materialId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nie znaleziono pliku' });
    }

    const filePath = path.join(__dirname, '..', rows[0].file_path);

    await dbPool.execute(
      'DELETE FROM Materials WHERE material_id = ?',
      [materialId]
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Materiał usunięty' });
  } catch (error) {
    console.error('Błąd usuwania materiału:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/lessons/{id}/progress:
 *   post:
 *     summary: Update student lesson progress
 *     description: >
 *       Saves or updates the student's progress for a lesson including time spent
 *       and completion status.  
 *       When a lesson is marked as completed, the teacher is notified.
 *     tags:
 *       - Lessons
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               time_spent:
 *                 type: integer
 *                 description: Time spent on the lesson in seconds.
 *               is_completed:
 *                 type: boolean
 *                 description: Whether the lesson has been completed.
 *     responses:
 *       200:
 *         description: Progress successfully saved.
 *       401:
 *         description: User is not authenticated.
 *       500:
 *         description: Server error while saving progress.
 */
router.post('/:id/progress', protect, async (req, res) => {
  const { time_spent, is_completed } = req.body;
  const lessonId = req.params.id;
  const studentId = req.user.user_id;

  try {
    await dbPool.execute(
      `
      INSERT INTO Lesson_Progress 
      (student_id, lesson_id, time_spent_seconds, is_completed, completed_at)
      VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN NOW() ELSE NULL END)
      ON DUPLICATE KEY UPDATE 
        time_spent_seconds = VALUES(time_spent_seconds),
        completed_at = CASE 
          WHEN VALUES(is_completed) = 1 AND completed_at IS NULL THEN NOW()
          WHEN VALUES(is_completed) = 0 THEN NULL
          ELSE completed_at
        END,
        is_completed = VALUES(is_completed)
      `,
      [studentId, lessonId, time_spent, is_completed, is_completed]
    );

    if (is_completed == 1) {
      const [lessonData] = await dbPool.execute(`
            SELECT l.title, c.teacher_id, c.course_id
            FROM Lessons l
            JOIN Courses c ON l.course_id = c.course_id
            WHERE l.lesson_id = ?`, 
        [lessonId]
      );
        
    if (lessonData.length > 0) {
        const { title, teacher_id, course_id } = lessonData[0];
        const io = req.app.get('io');
        
        await sendNotification(dbPool, io, teacher_id, {
            type: 'success',
            title: 'Lekcja ukończona',
            description: `Uczeń ${req.user.first_name} ${req.user.last_name} ukończył lekcję "${title}".`,
            link: `/dashboard/courses/${course_id}/lessons/${lessonId}`
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Błąd postępu:', error);
    res.status(500).json({ message: 'Błąd zapisu postępu' });
  }
});

module.exports = router;