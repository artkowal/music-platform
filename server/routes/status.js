const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Status
 *     description: Sprawdzanie stanu i połączenia API
 */

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Sprawdza, czy serwer działa
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Serwer działa poprawnie.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "API serwera MusicDesk działa poprawnie!"
 */
router.get('/', (req, res) => {
  res.send('API serwera MusicDesk działa poprawnie!');
});

/**
 * @swagger
 * /api/status/db-test:
 *   get:
 *     summary: Testuje połączenie z bazą danych
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Połączenie z bazą danych powiodło się.
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
 *         description: Błąd połączenia z bazą danych.
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
