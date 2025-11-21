const express = require('express');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');
const { sendTokenResponse } = require('../utils/jwt');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Operacje użytkownika (rejestracja, wyszukiwanie)
 */

/**
 * @swagger
 * /api/user/search:
 *   get:
 *     summary: Wyszukuje uczniów po fragmencie adresu email (autouzupełnianie)
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Początek adresu email (minimum 2 znaki)
 *     responses:
 *       200:
 *         description: Lista pasujących emaili
 */
router.get('/search', protect, async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.json({ success: true, emails: [] });
  }

  try {
    const [rows] = await dbPool.execute(
      "SELECT email FROM Users WHERE role = 'student' AND email LIKE ? LIMIT 5",
      [`${query}%`]
    );

    const emails = rows.map((r) => r.email);
    res.json({ success: true, emails });
  } catch (error) {
    console.error("Błąd wyszukiwania:", error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
});

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Rejestruje nowego użytkownika
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Użytkownik zarejestrowany
 */
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({
      success: false,
      message: 'Proszę podać wszystkie wymagane dane.',
    });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const [result] = await dbPool.execute(
      'INSERT INTO Users (email, password_hash, first_name, last_name, `role`) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, role]
    );

    const [newUser] = await dbPool.execute(
      'SELECT user_id, email, first_name, last_name, `role`, created_at FROM Users WHERE user_id = ?',
      [result.insertId]
    );

    sendTokenResponse(newUser[0], 201, res);
  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Ten adres email jest już zarejestrowany.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas rejestracji.',
    });
  }
});

module.exports = router;
