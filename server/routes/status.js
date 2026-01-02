const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Status
 *     description: Check API health and database connection
 */

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Check if the server is running
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Server is running properly
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "MusicDesk API server is running properly!"
 */
router.get('/', (req, res) => {
  res.send('API serwera MusicDesk działa poprawnie!');
});

/**
 * @swagger
 * /api/status/db-test:
 *   get:
 *     summary: Test database connection
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Successfully connected to the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database connection successful!"
 *                 solution:
 *                   type: number
 *                   example: 2
 *       500:
 *         description: Failed to connect to the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database connection failed!"
 *                 error:
 *                   type: string
 *                   example: "Connection timeout"
 */
router.get('/db-test', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    connection.release();

    res.json({
      message: 'Database connection successful!',
      solution: rows[0].solution,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed!',
      error: error.message,
    });
  }
});

module.exports = router;