// server/routes/user.js
const express = require('express');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');
const { sendTokenResponse } = require('../utils/jwt');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Operacje związane z rejestracją i logowaniem użytkowników
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Rejestruje nowego użytkownika
 *     description: Tworzy nowe konto użytkownika. Alias dla `/api/auth/register`, zachowany dla spójności struktury API.
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
 *               - fullName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: "nauczyciel@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               fullName:
 *                 type: string
 *                 example: "Adam Nowak"
 *               role:
 *                 type: string
 *                 enum: [teacher, student]
 *                 example: "teacher"
 *     responses:
 *       201:
 *         description: Użytkownik pomyślnie zarejestrowany. Zwraca token w ciasteczku HttpOnly.
 *       400:
 *         description: Błędne dane wejściowe lub użytkownik już istnieje.
 */
router.post('/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({
      success: false,
      message: 'Proszę podać wszystkie wymagane dane.',
    });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const [result] = await dbPool.execute(
      'INSERT INTO Users (email, password_hash, full_name, `role`) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, fullName, role]
    );

    const [newUser] = await dbPool.execute(
      'SELECT user_id, email, full_name, `role`, created_at FROM Users WHERE user_id = ?',
      [result.insertId]
    );

    sendTokenResponse(newUser[0], 201, res);
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: 'Nie udało się zarejestrować użytkownika — prawdopodobnie email już istnieje.',
    });
  }
});

module.exports = router;