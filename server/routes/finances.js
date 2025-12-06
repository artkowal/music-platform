const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Finances
 *     description: Statystyki i rozliczenia finansowe
 */

/**
 * @swagger
 * /api/finances/monthly:
 *   get:
 *     summary: Pobiera miesięczne statystyki dla placówek nauczyciela
 *     tags: [Finances]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Numer miesiąca (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Rok (np. 2024)
 *     responses:
 *       200:
 *         description: Statystyki pogrupowane po placówkach
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
