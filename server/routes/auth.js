const express = require('express');
const mysql = require('mysql2/promise');
const { hashPassword, comparePassword } = require('../utils/password');
const { sendTokenResponse, deleteJwtCookie } = require('../utils/jwt');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Uwierzytelnianie użytkowników
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: ID użytkownika.
 *         email:
 *           type: string
 *           description: Email użytkownika.
 *         full_name:
 *           type: string
 *           description: Imię i nazwisko użytkownika.
 *         role:
 *           type: string
 *           enum: [teacher, student]
 *           description: Rola użytkownika.
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data utworzenia konta.
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Loguje użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "uczen@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Pomyślnie zalogowano. Zwraca token w ciasteczku HttpOnly.
 *       401:
 *         description: Nieprawidłowy email lub hasło.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Proszę podać email i hasło.' });
  }

  const [users] = await dbPool.execute('SELECT * FROM Users WHERE email = ?', [email]);
  if (users.length === 0) {
    return res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło.' });
  }

  const user = users[0];
  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło.' });
  }

  sendTokenResponse(user, 200, res);
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Wylogowuje użytkownika (unieważnia token)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Pomyślnie wylogowano (czyści ciasteczko i unieważnia token w DB).
 */
router.post('/logout', protect, async (req, res) => {
  await dbPool.execute('UPDATE Users SET current_token_id = NULL WHERE user_id = ?', [req.user.user_id]);
  deleteJwtCookie(res);
  res.status(200).json({ success: true, message: 'Pomyślnie wylogowano.' });
});

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Sprawdza, czy użytkownik jest zalogowany (chronione)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Użytkownik jest zalogowany, zwraca dane użytkownika.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Brak autoryzacji.
 */
router.get('/check', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
