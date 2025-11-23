const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Komentarze
 *     description: Operacje związane z komentarzami, odczytem, edycją i powiadomieniami
 */

/**
 * @swagger
 * /api/comments/lesson/{lessonId}:
 *   get:
 *     summary: Pobiera wszystkie komentarze dla lekcji
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lekcji
 *     responses:
 *       200:
 *         description: Lista komentarzy
 *       500:
 *         description: Błąd serwera
 */
router.get('/lesson/:lessonId', protect, async (req, res) => {
  const { lessonId } = req.params;

  try {
    const [rows] = await dbPool.execute(`
      SELECT 
        c.comment_id, 
        c.content, 
        c.created_at, 
        c.updated_at, 
        c.is_deleted,
        c.user_id,
        u.first_name, 
        u.last_name, 
        u.role, 
        u.email
      FROM Comments c
      JOIN Users u ON c.user_id = u.user_id
      WHERE c.lesson_id = ?
      ORDER BY c.created_at ASC
    `, [lessonId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd pobierania komentarzy.' });
  }
});

/**
 * @swagger
 * /api/comments/lesson/{lessonId}/unread:
 *   get:
 *     summary: Pobiera liczbę nieprzeczytanych komentarzy w lekcji
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lekcji
 *     responses:
 *       200:
 *         description: Liczba nieprzeczytanych komentarzy
 *       500:
 *         description: Błąd serwera
 */
router.get('/lesson/:lessonId/unread', protect, async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.user_id;

  try {
    const [rows] = await dbPool.execute(`
      SELECT COUNT(*) as count 
      FROM Comments 
      WHERE lesson_id = ? 
        AND user_id != ? 
        AND is_read = FALSE
        AND is_deleted = FALSE
    `, [lessonId, userId]);

    res.json({ success: true, count: rows[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd liczenia powiadomień.' });
  }
});

/**
 * @swagger
 * /api/comments/lesson/{lessonId}/read:
 *   put:
 *     summary: Oznacza wszystkie komentarze innych użytkowników jako przeczytane
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lekcji
 *     responses:
 *       200:
 *         description: Oznaczono jako przeczytane
 *       500:
 *         description: Błąd serwera
 */
router.put('/lesson/:lessonId/read', protect, async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.user_id;

  try {
    await dbPool.execute(`
      UPDATE Comments 
      SET is_read = TRUE 
      WHERE lesson_id = ? 
        AND user_id != ? 
        AND is_read = FALSE
    `, [lessonId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd aktualizacji statusu.' });
  }
});

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Dodaje nowy komentarz do lekcji
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lesson_id
 *               - content
 *             properties:
 *               lesson_id:
 *                 type: integer
 *                 description: ID lekcji
 *               content:
 *                 type: string
 *                 description: Treść komentarza
 *     responses:
 *       201:
 *         description: Komentarz dodany
 *       400:
 *         description: Błędne dane
 *       500:
 *         description: Błąd serwera
 */
router.post('/', protect, async (req, res) => {
  const { lesson_id, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Treść komentarza nie może być pusta.' });
  }

  try {
    await dbPool.execute(
      'INSERT INTO Comments (lesson_id, user_id, content, is_read) VALUES (?, ?, ?, FALSE)',
      [lesson_id, req.user.user_id, content]
    );
    res.status(201).json({ success: true, message: 'Dodano komentarz.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Edytuje komentarz użytkownika
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID komentarza
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nowa treść komentarza
 *     responses:
 *       200:
 *         description: Komentarz zaktualizowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Nie znaleziono komentarza
 *       500:
 *         description: Błąd serwera
 */
router.put('/:commentId', protect, async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const [check] = await dbPool.execute('SELECT user_id FROM Comments WHERE comment_id = ?', [commentId]);
    if (check.length === 0) return res.status(404).json({ message: 'Nie znaleziono.' });
    if (check[0].user_id !== req.user.user_id) return res.status(403).json({ message: 'Brak uprawnień.' });

    await dbPool.execute('UPDATE Comments SET content = ? WHERE comment_id = ?', [content, commentId]);
    res.json({ success: true, message: 'Zaktualizowano.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Usuwa komentarz użytkownika (oznacza jako usunięty)
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID komentarza
 *     responses:
 *       200:
 *         description: Komentarz usunięty
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Nie znaleziono komentarza
 *       500:
 *         description: Błąd serwera
 */
router.delete('/:commentId', protect, async (req, res) => {
  const { commentId } = req.params;

  try {
    const [check] = await dbPool.execute('SELECT user_id FROM Comments WHERE comment_id = ?', [commentId]);
    if (check.length === 0) return res.status(404).json({ message: 'Nie znaleziono.' });
    if (check[0].user_id !== req.user.user_id) return res.status(403).json({ message: 'Brak uprawnień.' });

    await dbPool.execute('UPDATE Comments SET is_deleted = TRUE WHERE comment_id = ?', [commentId]);
    res.json({ success: true, message: 'Usunięto.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/comments/notifications:
 *   get:
 *     summary: Pobiera listę nieprzeczytanych powiadomień komentarzy użytkownika
 *     tags: [Komentarze]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista powiadomień
 *       500:
 *         description: Błąd serwera
 */
router.get('/notifications', protect, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const query = `
      SELECT 
        c.comment_id, 
        c.content, 
        c.created_at, 
        c.is_read, 
        c.lesson_id,
        l.title as lesson_title,
        l.course_id,
        u.first_name, 
        u.last_name, 
        u.role
      FROM Comments c
      JOIN Lessons l ON c.lesson_id = l.lesson_id
      JOIN Courses cr ON l.course_id = cr.course_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE c.user_id != ? 
      AND c.is_read = FALSE
      AND c.is_deleted = FALSE
      AND (
        cr.teacher_id = ?
        OR EXISTS (
          SELECT 1 FROM Enrollments e 
          WHERE e.course_id = cr.course_id AND e.student_id = ?
        )
      )
      ORDER BY c.created_at DESC
      LIMIT 10
    `;

    const [rows] = await dbPool.execute(query, [userId, userId, userId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd pobierania powiadomień.' });
  }
});

module.exports = router;