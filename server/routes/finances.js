const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Finances
 *     description: Financial statistics and settlement data for teachers
 */

/**
 * @swagger
 * /api/finances/monthly:
 *   get:
 *     summary: Get monthly financial statistics grouped by workplaces
 *     description: >
 *       Returns financial and meeting statistics for all workplaces owned by the authenticated teacher
 *       for a given month and year.  
 *       The response includes counts of completed, online, stationary, pending and cancelled meetings,
 *       together with the workplace payment configuration.
 *     tags:
 *       - Finances
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         required: false
 *         description: Month number (1–12). Defaults to the current month.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: false
 *         description: Year (e.g. 2024). Defaults to the current year.
 *     responses:
 *       200:
 *         description: Monthly financial statistics grouped by workplaces.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       workplace_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       color_hex:
 *                         type: string
 *                       payment_type:
 *                         type: string
 *                         description: Payment calculation type for the workplace (e.g. per lesson, per student).
 *                       payment_amount:
 *                         type: number
 *                       completed_count:
 *                         type: integer
 *                         description: Number of completed meetings in the selected month.
 *                       online_count:
 *                         type: integer
 *                         description: Number of completed online meetings.
 *                       stationary_count:
 *                         type: integer
 *                         description: Number of completed stationary (in-person) meetings.
 *                       pending_count:
 *                         type: integer
 *                         description: Number of meetings with status "pending".
 *                       cancelled_count:
 *                         type: integer
 *                         description: Number of cancelled meetings.
 *       403:
 *         description: Access denied. Only teachers can view financial statistics.
 *       401:
 *         description: User is not authenticated.
 *       500:
 *         description: Server error while retrieving financial data.
 */
router.get('/monthly', protect, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Brak uprawnień. Widok tylko dla nauczycieli.' });
  }

  const { month, year } = req.query;
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();

  try {
    const query = `
      SELECT 
        w.workplace_id,
        w.name,
        w.color_hex,
        w.payment_type,
        w.payment_amount,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN m.status = 'completed' AND m.type = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN m.status = 'completed' AND m.type = 'stationary' THEN 1 END) as stationary_count,
        COUNT(CASE WHEN m.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END) as cancelled_count
      FROM Workplaces w
      LEFT JOIN Courses c ON w.workplace_id = c.workplace_id
      LEFT JOIN Meetings m ON c.course_id = m.course_id 
        AND MONTH(m.scheduled_time) = ? 
        AND YEAR(m.scheduled_time) = ?
      WHERE w.teacher_id = ?
      GROUP BY 
        w.workplace_id, w.name, w.color_hex, 
        w.payment_type, w.payment_amount
      ORDER BY w.sort_order ASC, w.name ASC
    `;

    const [rows] = await dbPool.execute(query, [targetMonth, targetYear, req.user.user_id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Błąd pobierania finansów:", error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania statystyk.' });
  }
});

module.exports = router;