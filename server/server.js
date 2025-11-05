const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = require('./swaggerConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Konfiguracja Swaggera ---
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * tags:
 *   - name: Status
 *     description: Sprawdzanie stanu i połączenia API
 */

/**
 * @swagger
 * /:
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
 *               example: "Hello from the Music Platform Backend!"
 */
app.get('/', (req, res) => {
  res.send('Hello from the Music Platform Backend!');
});

/**
 * @swagger
 * /api/db-test:
 *   get:
 *     summary: Testuje połączenie z bazą danych
 *     description: Wysyła proste zapytanie (SELECT 1+1) do bazy danych.
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
app.get('/api/db-test', async (req, res) => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    res.json({
      message: 'Database connection successful!',
      solution: rows[0].solution,
    });
    await connection.end();
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed!',
      error: error.message,
    });
  }
});

// --- Uruchomienie Serwera ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
