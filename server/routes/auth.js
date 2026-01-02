const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { comparePassword, hashPassword } = require('../utils/password');
const { sendTokenResponse, deleteJwtCookie } = require('../utils/jwt');
const { protect } = require('../middlewares/auth.middleware');
const { sendEmail } = require('../services/email')

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

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Wysyła email z linkiem do resetu hasła
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email został wysłany.
 *       404:
 *         description: Użytkownik nie istnieje.
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  const [users] = await dbPool.execute('SELECT user_id, first_name FROM Users WHERE email = ?', [email]);
  if (users.length === 0) {
    // Ze względów bezpieczeństwa nie mówimy, że user nie istnieje, ale tutaj dla devu:
    return res.status(404).json({ message: 'Użytkownik nie istnieje' });
  }
  
  const user = users[0];
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 3600000); // 1 godzina ważności

  // Zapisz token
  await dbPool.execute(
    'INSERT INTO User_Tokens (token_id, user_id, type, expires_at) VALUES (?, ?, ?, ?)',
    [token, user.user_id, 'reset_password', expiresAt]
  );

  // Wyślij email
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail(
    email,
    'Reset hasła - Platforma Muzyczna',
    `<p>Cześć ${user.first_name},</p>
     <p>Otrzymaliśmy prośbę o reset hasła.</p>
     <p>Kliknij w link poniżej, aby ustawić nowe hasło:</p>
     <a href="${resetLink}">Resetuj hasło</a>
     <p>Link wygasa za godzinę.</p>`
  );

  res.json({ success: true, message: 'Email z linkiem został wysłany.' });
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Ustawia nowe hasło użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token resetu hasła z emaila
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Hasło zostało zmienione.
 *       400:
 *         description: Token jest nieprawidłowy lub wygasł.
 */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  const [tokens] = await dbPool.execute(
    'SELECT * FROM User_Tokens WHERE token_id = ? AND type = "reset_password" AND expires_at > NOW()',
    [token]
  );

  if (tokens.length === 0) {
    return res.status(400).json({ message: 'Token jest nieprawidłowy lub wygasł.' });
  }

  const userId = tokens[0].user_id;
  const hashedPassword = await hashPassword(newPassword);

  // Aktualizuj hasło i usuń token
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE Users SET password_hash = ? WHERE user_id = ?', [hashedPassword, userId]);
    await connection.execute('DELETE FROM User_Tokens WHERE token_id = ?', [token]);
    await connection.commit();
    res.json({ success: true, message: 'Hasło zostało zmienione.' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

module.exports = router;
