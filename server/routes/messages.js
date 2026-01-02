const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Wiadomości
 *     description: Czat lekcyjny - wymiana wiadomości między nauczycielem a uczniem
 */

/**
 * @swagger
 * /api/messages/lesson/{lessonId}:
 *   get:
 *     summary: Pobiera historię czatu dla danej lekcji
 *     tags:
 *       - Wiadomości
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
 *         description: Lista wiadomości
 *       500:
 *         description: Błąd serwera
 */
router.get('/lesson/:lessonId', protect, async (req, res) => {
  const { lessonId } = req.params;

  try {
    const [rows] = await dbPool.execute(`
      SELECT 
        m.message_id, 
        m.content, 
        m.created_at, 
        m.updated_at, 
        m.is_deleted,
        m.user_id,
        u.first_name, 
        u.last_name, 
        u.role, 
        u.email
      FROM Lesson_Messages m
      JOIN Users u ON m.user_id = u.user_id
      WHERE m.lesson_id = ?
      ORDER BY m.created_at ASC
    `, [lessonId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd pobierania wiadomości.' });
  }
});

/**
 * @swagger
 * /api/messages/lesson/{lessonId}/unread:
 *   get:
 *     summary: Pobiera liczbę nieprzeczytanych wiadomości w lekcji
 *     tags:
 *       - Wiadomości
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
 *         description: Liczba nieprzeczytanych wiadomości
 *       500:
 *         description: Błąd serwera
 */
router.get('/lesson/:lessonId/unread', protect, async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.user_id;

  try {
    const [rows] = await dbPool.execute(`
      SELECT COUNT(*) AS count
      FROM Lesson_Messages
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
 * /api/messages/lesson/{lessonId}/read:
 *   put:
 *     summary: Oznacza wiadomości innych użytkowników jako przeczytane
 *     tags:
 *       - Wiadomości
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
      UPDATE Lesson_Messages
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
 * /api/messages:
 *   post:
 *     summary: Wysyła nową wiadomość do lekcji
 *     tags:
 *       - Wiadomości
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
 *                 description: Treść wiadomości
 *     responses:
 *       201:
 *         description: Wiadomość wysłana
 *       400:
 *         description: Błędne dane
 *       500:
 *         description: Błąd serwera
 */
router.post('/', protect, async (req, res) => {
  const { lesson_id, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Treść wiadomości nie może być pusta.' });
  }

  try {
    await dbPool.execute(
      'INSERT INTO Lesson_Messages (lesson_id, user_id, content, is_read) VALUES (?, ?, ?, FALSE)',
      [lesson_id, req.user.user_id, content]
    );
    res.status(201).json({ success: true, message: 'Wysłano wiadomość.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   put:
 *     summary: Edytuje wiadomość (tylko autor)
 *     tags:
 *       - Wiadomości
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID wiadomości
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nowa treść
 *     responses:
 *       200:
 *         description: Zaktualizowano
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Nie znaleziono
 *       500:
 *         description: Błąd serwera
 */
router.put('/:messageId', protect, async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  try {
    const [check] = await dbPool.execute(
      'SELECT user_id FROM Lesson_Messages WHERE message_id = ?',
      [messageId]
    );

    if (check.length === 0) return res.status(404).json({ message: 'Nie znaleziono.' });
    if (check[0].user_id !== req.user.user_id) return res.status(403).json({ message: 'Brak uprawnień.' });

    await dbPool.execute(
      'UPDATE Lesson_Messages SET content = ? WHERE message_id = ?',
      [content, messageId]
    );

    res.json({ success: true, message: 'Zaktualizowano.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Usuwa wiadomość (soft delete)
 *     tags:
 *       - Wiadomości
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID wiadomości
 *     responses:
 *       200:
 *         description: Usunięto
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Nie znaleziono
 *       500:
 *         description: Błąd serwera
 */
router.delete('/:messageId', protect, async (req, res) => {
  const { messageId } = req.params;

  try {
    const [check] = await dbPool.execute(
      'SELECT user_id FROM Lesson_Messages WHERE message_id = ?',
      [messageId]
    );

    if (check.length === 0) return res.status(404).json({ message: 'Nie znaleziono.' });
    if (check[0].user_id !== req.user.user_id) return res.status(403).json({ message: 'Brak uprawnień.' });

    await dbPool.execute(
      'UPDATE Lesson_Messages SET is_deleted = TRUE WHERE message_id = ?',
      [messageId]
    );

    res.json({ success: true, message: 'Usunięto.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/messages/notifications:
 *   get:
 *     summary: Pobiera listę nieprzeczytanych wiadomości dla użytkownika (do dzwoneczka)
 *     tags:
 *       - Wiadomości
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
        m.message_id,
        m.content,
        m.created_at,
        m.is_read,
        m.lesson_id,
        l.title AS lesson_title,
        l.course_id,
        u.first_name,
        u.last_name,
        u.role
      FROM Lesson_Messages m
      JOIN Lessons l ON m.lesson_id = l.lesson_id
      JOIN Courses cr ON l.course_id = cr.course_id
      JOIN Users u ON m.user_id = u.user_id
      WHERE m.user_id != ?
        AND m.is_read = FALSE
        AND m.is_deleted = FALSE
        AND (
          cr.teacher_id = ?
          OR EXISTS (
            SELECT 1
            FROM Enrollments e
            WHERE e.course_id = cr.course_id
              AND e.student_id = ?
          )
        )
      ORDER BY m.created_at DESC
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
