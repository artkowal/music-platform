const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Messages
 *     description: Lesson chat – message exchange between teacher and student
 */

/**
 * @swagger
 * /api/messages/lesson/{lessonId}:
 *   get:
 *     summary: Get chat history for a lesson
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: List of messages
 *       500:
 *         description: Server error
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
 *     summary: Get number of unread messages in a lesson
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Count of unread messages
 *       500:
 *         description: Server error
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
 *     summary: Mark other users' messages as read
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       500:
 *         description: Server error
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
 *     summary: Send a new message to a lesson
 *     tags: [Messages]
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
 *                 description: Lesson ID
 *               content:
 *                 type: string
 *                 description: Message text
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
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
 *     summary: Edit a message (author only)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: New message text
 *     responses:
 *       200:
 *         description: Updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
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
 *     summary: Soft delete a message (author only)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
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
 *     summary: Get unread messages for the user (for notification bell)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of unread messages
 *       500:
 *         description: Server error
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