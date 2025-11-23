const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(originalName));
  }
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   - name: Materiały i Lekcje
 *     description: Zarządzanie lekcjami, materiałami oraz postępem
 */

/**
 * @swagger
 * /api/lessons/course/{courseId}:
 *   get:
 *     summary: Pobiera listę lekcji w kursie (z uwzględnieniem widoczności dla ucznia)
 *     tags: [Materiały i Lekcje]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kursu
 *     responses:
 *       200:
 *         description: Lista lekcji wraz z materiałami i postępem
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    let query = 'SELECT * FROM Lessons WHERE course_id = ?';
    const params = [req.params.courseId];

    if (req.user.role === 'student') {
      query += ' AND is_visible = TRUE';
    }

    query += ' ORDER BY lesson_id ASC';

    const [lessons] = await dbPool.execute(query, params);

    let targetStudentId = null;
    if (req.user.role === 'student') {
      targetStudentId = req.user.user_id;
    } else if (req.user.role === 'teacher') {
      const [enrollments] = await dbPool.execute(
        'SELECT student_id FROM Enrollments WHERE course_id = ? LIMIT 1',
        [req.params.courseId]
      );
      if (enrollments.length > 0) targetStudentId = enrollments[0].student_id;
    }

    for (let lesson of lessons) {
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
        if (progress.length > 0) {
          lesson.progress = progress[0];
        }
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
 *     summary: Tworzy nową lekcję wraz z materiałami
 *     tags: [Materiały i Lekcje]
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
 *               is_visible:
 *                 type: string
 *                 description: "true/false"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Lekcja utworzona
 */
router.post('/', protect, upload.array('files'), async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });

  const { course_id, title, description, duration_minutes, is_visible } = req.body;
  const files = req.files;

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const isVisibleVal = is_visible === 'false' ? 0 : 1;

    const [lessonResult] = await connection.execute(
      'INSERT INTO Lessons (course_id, title, description, duration_minutes, is_visible, status) VALUES (?, ?, ?, ?, ?, ?)',
      [course_id, title, description, duration_minutes || 45, isVisibleVal, 'planned']
    );

    const lessonId = lessonResult.insertId;

    if (files && files.length > 0) {
      for (const file of files) {
        const relativePath = `uploads/${file.filename}`;
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        await connection.execute(
          'INSERT INTO Materials (lesson_id, title, file_path) VALUES (?, ?, ?)',
          [lessonId, originalName, relativePath]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Lekcja utworzona' });
  } catch (error) {
    await connection.rollback();
    console.error("Błąd tworzenia lekcji:", error);

    if (files) {
      files.forEach(f => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    res.status(500).json({ message: 'Błąd podczas tworzenia lekcji' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Aktualizuje dane lekcji (bez zarządzania plikami)
 *     tags: [Materiały i Lekcje]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lekcji
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
 *                 type: integer
 *     responses:
 *       200:
 *         description: Zaktualizowano dane lekcji
 */
router.put('/:id', protect, async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });

  const { title, description, duration_minutes, is_visible } = req.body;

  try {
    await dbPool.execute(
      `UPDATE Lessons SET 
        title = COALESCE(?, title), 
        description = COALESCE(?, description), 
        duration_minutes = COALESCE(?, duration_minutes),
        is_visible = COALESCE(?, is_visible)
      WHERE lesson_id = ?`,
      [title, description, duration_minutes, is_visible, req.params.id]
    );

    res.json({ success: true, message: "Zaktualizowano lekcję" });
  } catch (error) {
    console.error("Błąd edycji:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * @swagger
 * /api/lessons/{id}/materials:
 *   post:
 *     summary: Dodaje materiały do lekcji
 *     tags: [Materiały i Lekcje]
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
 *         description: Materiały dodane
 */
router.post('/:id/materials', protect, upload.array('files'), async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });

  const files = req.files;
  const lessonId = req.params.id;

  try {
    if (files && files.length > 0) {
      for (const file of files) {
        const relativePath = `uploads/${file.filename}`;
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        await dbPool.execute(
          'INSERT INTO Materials (lesson_id, title, file_path) VALUES (?, ?, ?)',
          [lessonId, originalName, relativePath]
        );
      }
    }

    res.json({ success: true, message: "Materiały dodane" });
  } catch (error) {
    console.error("Błąd dodawania materiałów:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * @swagger
 * /api/lessons/{id}/materials/{materialId}:
 *   delete:
 *     summary: Usuwa pojedynczy materiał z lekcji
 *     tags: [Materiały i Lekcje]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Materiał usunięty
 */
router.delete('/:id/materials/:materialId', protect, async (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Brak uprawnień' });

  const { materialId } = req.params;

  try {
    const [rows] = await dbPool.execute(
      'SELECT file_path FROM Materials WHERE material_id = ?',
      [materialId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Nie znaleziono pliku" });

    const filePath = path.join(__dirname, '..', rows[0].file_path);

    await dbPool.execute(
      'DELETE FROM Materials WHERE material_id = ?',
      [materialId]
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: "Materiał usunięty" });
  } catch (error) {
    console.error("Błąd usuwania materiału:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * @swagger
 * /api/lessons/{id}/progress:
 *   post:
 *     summary: Aktualizuje postęp ucznia w lekcji
 *     tags: [Materiały i Lekcje]
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
 *               time_spent:
 *                 type: integer
 *               is_completed:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Zaktualizowano postęp lekcji
 */
router.post('/:id/progress', protect, async (req, res) => {
  const { time_spent, is_completed } = req.body;
  const lessonId = req.params.id;
  const studentId = req.user.user_id;

  try {
    await dbPool.execute(`
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
    `, [studentId, lessonId, time_spent, is_completed, is_completed]);

    res.json({ success: true });
  } catch (error) {
    console.error("Błąd postępu:", error);
    res.status(500).json({ message: 'Błąd zapisu postępu' });
  }
});

module.exports = router;
