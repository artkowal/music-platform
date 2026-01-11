const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { comparePassword, hashPassword } = require('../utils/password');
const { sendTokenResponse, deleteJwtCookie } = require('../utils/jwt');
const { protect } = require('../middlewares/auth.middleware');
const { sendEmail } = require('../services/email');

const router = express.Router();
// const dbPool = mysql.createPool(process.env.DATABASE_URL);
const dbPool = require('../config/db');


/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication, sessions and password recovery
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
 *     summary: Log in user
 *     description: Verifies credentials and creates a new session token stored in an HttpOnly cookie.
 *     tags:
 *       - Auth
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
 *                 example: teacher@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: User successfully logged in. Session token is set in HttpOnly cookie.
 *       400:
 *         description: Email or password not provided.
 *       401:
 *         description: Invalid email or password.
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
 *     summary: Log out user
 *     description: Invalidates the current session token and removes the authentication cookie.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User successfully logged out.
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
 *     summary: Get current authenticated user
 *     description: Returns the currently logged-in user based on the session cookie.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user data.
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
 *     summary: Request password reset
 *     description: Generates a password reset token and sends it to the user via email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@example.com
 *     responses:
 *       200:
 *         description: Password reset email has been sent.
 *       404:
 *         description: User not found.
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const [users] = await dbPool.execute('SELECT user_id, first_name FROM Users WHERE email = ?', [email]);
  if (users.length === 0) {
    return res.status(404).json({ message: 'Użytkownik nie istnieje' });
  }

  const user = users[0];
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 3600000);

  await dbPool.execute(
    'INSERT INTO User_Tokens (token_id, user_id, type, expires_at) VALUES (?, ?, ?, ?)',
    [token, user.user_id, 'reset_password', expiresAt]
  );

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail(
    email,
    'Password Reset',
    `<p>Hello ${user.first_name},</p>
     <p>You requested a password reset.</p>
     <p>Click the link below to set a new password:</p>
     <a href="${resetLink}">Reset password</a>
     <p>This link expires in 1 hour.</p>`
  );

  res.json({ success: true, message: 'Email z linkiem został wysłany.' });
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Sets a new password using a valid password reset token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received via email.
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password successfully changed.
 *       400:
 *         description: Token is invalid or expired.
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