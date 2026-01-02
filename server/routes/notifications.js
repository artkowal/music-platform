const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: User notifications management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the logged-in user
 *     description: Returns up to 50 latest notifications in descending order.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User notifications list
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 12
 *                   title: "New student!"
 *                   description: "Jan Kowalski joined the course"
 *                   link: "/dashboard/courses/5"
 *                   type: "info"
 *                   timestamp: "2025-01-15T10:22:00.000Z"
 *                   read: false
 *       500:
 *         description: Server error
 */
router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await dbPool.execute(
      'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.user_id]
    );

    const notifications = rows.map(n => ({
      id: n.notification_id,
      title: n.title,
      description: n.description,
      link: n.link,
      type: n.type,
      timestamp: n.created_at,
      read: Boolean(n.is_read),
    }));

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Błąd pobierania powiadomień:", error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *         example: 15
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       500:
 *         description: Server error
 */
router.put('/:id/read', protect, async (req, res) => {
  try {
    await dbPool.execute(
      'UPDATE Notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Błąd oznaczania powiadomienia:", error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications of the user as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       500:
 *         description: Server error
 */
router.put('/read-all', protect, async (req, res) => {
  try {
    await dbPool.execute(
      'UPDATE Notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.user_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Błąd oznaczania wszystkich powiadomień:", error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

module.exports = router;