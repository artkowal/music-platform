const express = require('express');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');
const bcrypt = require('bcryptjs');
const { sendTokenResponse } = require('../utils/jwt');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Operacje związane z użytkownikami
 */

/**
 * @swagger
 * /api/user/search:
 *   get:
 *     summary: Wyszukuje uczniów po fragmencie adresu email
 *     description: Zwraca maksymalnie 5 emaili zaczynających się od podanego fragmentu (min. 2 znaki).
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Fragment adresu email
 *     responses:
 *       200:
 *         description: Lista dopasowanych adresów email
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               emails:
 *                 - "jan.kowalski@example.com"
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
 *         description: Użytkownik został zarejestrowany
 *       400:
 *         description: Nieprawidłowe dane lub email już istnieje
 *       500:
 *         description: Błąd serwera
 */
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({
      success: false,
      message: 'Proszę podać wszystkie wymagane dane.',
    });
  }

  const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Hasło jest za słabe. Wymagane: min. 8 znaków, 1 duża litera, 1 mała litera, 1 cyfra i znak specjalny.',
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
      return res.status(400).json({ success: false, message: 'Ten adres email jest już zarejestrowany.' });
    }
    res.status(500).json({ success: false, message: 'Wystąpił błąd podczas rejestracji.' });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Aktualizuje dane profilowe użytkownika
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil został zaktualizowany
 *       500:
 *         description: Błąd serwera
 */
router.put('/profile', protect, async (req, res) => {
  const { first_name, last_name } = req.body;

  try {
    await dbPool.execute(
      'UPDATE Users SET first_name = ?, last_name = ? WHERE user_id = ?',
      [first_name, last_name, req.user.user_id]
    );
    res.json({ success: true, message: 'Profil zaktualizowany.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Zmienia hasło użytkownika
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hasło zostało zmienione
 *       400:
 *         description: Błędne dane lub za słabe hasło
 *       404:
 *         description: Użytkownik nie istnieje
 *       500:
 *         description: Błąd serwera
 */
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Wszystkie pola są wymagane.' });
  }

  const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'Hasło jest za słabe. Wymagane: min. 8 znaków, 1 duża litera, 1 mała litera, 1 cyfra i 1 znak specjalny.'
    });
  }

  try {
    const [users] = await dbPool.execute(
      'SELECT password_hash FROM Users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Obecne hasło jest nieprawidłowe.' });
    }

    const newHash = await hashPassword(newPassword);

    await dbPool.execute(
      'UPDATE Users SET password_hash = ? WHERE user_id = ?',
      [newHash, req.user.user_id]
    );

    res.json({ success: true, message: 'Hasło zostało zmienione.' });
  } catch (error) {
    console.error("Błąd zmiany hasła:", error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/users/delete:
 *   delete:
 *     summary: Trwale usuwa konto użytkownika
 *     description: Operacja wymaga podania poprawnego hasła użytkownika.
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Konto zostało usunięte
 *       400:
 *         description: Brak hasła
 *       403:
 *         description: Błędne hasło
 *       404:
 *         description: Użytkownik nie istnieje
 *       500:
 *         description: Błąd serwera
 */
router.delete('/delete', protect, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Wymagane podanie hasła do potwierdzenia.' });
  }

  try {
    const [users] = await dbPool.execute(
      'SELECT password_hash FROM Users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) return res.status(404).json({ message: 'Użytkownik nie istnieje.' });

    const isMatch = await bcrypt.compare(password, users[0].password_hash);
    if (!isMatch) {
      return res.status(403).json({ message: 'Nieprawidłowe hasło.' });
    }

    await dbPool.execute('DELETE FROM Users WHERE user_id = ?', [req.user.user_id]);

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ success: true, message: 'Konto zostało usunięte.' });
  } catch (error) {
    console.error("Błąd usuwania konta:", error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

module.exports = router;
