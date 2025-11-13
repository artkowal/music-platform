const express = require('express');
const mysql = require('mysql2/promise');
const { comparePassword } = require('../utils/password');
const { sendTokenResponse, deleteJwtCookie } = require('../utils/jwt');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

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
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [teacher, student]
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Loguje użytkownika
 *     description: Sprawdza dane logowania i generuje token sesji.
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
 *                 example: "nauczyciel@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Pomyślnie zalogowano. Token zwrócony w ciasteczku HttpOnly.
 *       400:
 *         description: Brak wymaganych danych.
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
 *     summary: Wylogowuje użytkownika (unieważnia BIEŻĄCY token)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Pomyślnie wylogowano (usuwa token sesji z DB i czyści ciasteczko).
 */
router.post('/logout', protect, async (req, res) => {
  await dbPool.execute('DELETE FROM User_Tokens WHERE token_id = ?', [req.tokenId]);
  deleteJwtCookie(res);
  res.status(200).json({ success: true, message: 'Pomyślnie wylogowano.' });
});

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Sprawdza aktualną sesję użytkownika
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Zwraca dane zalogowanego użytkownika.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/check', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
