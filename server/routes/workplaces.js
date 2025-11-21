const express = require('express');
const mysql = require('mysql2/promise');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

const dbPool = mysql.createPool(process.env.DATABASE_URL);

/**
 * @swagger
 * tags:
 *   - name: Workplaces
 *     description: Zarządzanie placówkami (szkołami)
 */

/**
 * @swagger
 * /api/workplaces:
 *   get:
 *     summary: Pobiera listę placówek zalogowanego nauczyciela
 *     tags: [Workplaces]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista placówek
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', protect, async (req, res) => {
  const [rows] = await dbPool.execute(
    'SELECT * FROM Workplaces WHERE teacher_id = ? ORDER BY sort_order ASC',
    [req.user.user_id]
  );

  res.json({ success: true, data: rows });
});

/**
 * @swagger
 * /api/workplaces:
 *   post:
 *     summary: Tworzy nową placówkę
 *     tags: [Workplaces]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               color_hex:
 *                 type: string
 *               payment_type:
 *                 type: string
 *                 enum: [per_lesson, monthly, none]
 *               payment_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Placówka utworzona
 *       400:
 *         description: Nieprawidłowe dane
 */
router.post('/', protect, async (req, res) => {
  const { name, color_hex, payment_type, payment_amount } = req.body;

  if (!name) return res.status(400).json({ message: 'Nazwa jest wymagana' });

  const validTypes = ['per_lesson', 'monthly', 'none'];
  const type = validTypes.includes(payment_type) ? payment_type : 'none';
  const amount = type !== 'none' && payment_amount ? parseFloat(payment_amount) : null;

  try {
    await dbPool.execute(
      'INSERT INTO Workplaces (teacher_id, name, color_hex, payment_type, payment_amount) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, name, color_hex || '#6366F1', type, amount]
    );

    res.status(201).json({ success: true, message: 'Utworzono placówkę.' });
  } catch (error) {
    console.error("Błąd tworzenia placówki:", error);
    res.status(500).json({ message: 'Wystąpił błąd serwera.' });
  }
});

/**
 * @swagger
 * /api/workplaces/reorder/all:
 *   put:
 *     summary: Aktualizuje kolejność wszystkich placówek (Drag & Drop)
 *     tags: [Workplaces]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     workplace_id:
 *                       type: integer
 *                     sort_order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Kolejność zaktualizowana
 *       400:
 *         description: Nieprawidłowe dane
 */
router.put('/reorder/all', protect, async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ message: 'Nieprawidłowe dane.' });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      await connection.execute(
        'UPDATE Workplaces SET sort_order = ? WHERE workplace_id = ? AND teacher_id = ?',
        [item.sort_order, item.workplace_id, req.user.user_id]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Kolejność zaktualizowana.' });
  } catch (error) {
    await connection.rollback();
    console.error("Błąd zmiany kolejności:", error);
    res.status(500).json({ message: 'Błąd zapisu kolejności.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/workplaces/{id}:
 *   get:
 *     summary: Pobiera szczegóły jednej placówki
 *     tags: [Workplaces]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Szczegóły placówki
 *       404:
 *         description: Nie znaleziono
 */
router.get('/:id', protect, async (req, res) => {
  const [rows] = await dbPool.execute(
    'SELECT * FROM Workplaces WHERE workplace_id = ? AND teacher_id = ?',
    [req.params.id, req.user.user_id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Nie znaleziono placówki.' });
  }

  res.json({ success: true, data: rows[0] });
});

/**
 * @swagger
 * /api/workplaces/{id}:
 *   put:
 *     summary: Aktualizuje nazwę placówki
 *     tags: [Workplaces]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zaktualizowano placówkę
 *       404:
 *         description: Nie znaleziono
 *       400:
 *         description: Nieprawidłowe dane
 */
router.put('/:id', protect, async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ message: 'Nazwa jest wymagana' });

  const [result] = await dbPool.execute(
    'UPDATE Workplaces SET name = ? WHERE workplace_id = ? AND teacher_id = ?',
    [name, req.params.id, req.user.user_id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Nie znaleziono placówki lub brak uprawnień.' });
  }

  res.json({ success: true, message: 'Zaktualizowano placówkę.' });
});

/**
 * @swagger
 * /api/workplaces/{id}:
 *   delete:
 *     summary: Usuwa placówkę
 *     tags: [Workplaces]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Placówka usunięta
 *       404:
 *         description: Nie znaleziono
 */
router.delete('/:id', protect, async (req, res) => {
  const [result] = await dbPool.execute(
    'DELETE FROM Workplaces WHERE workplace_id = ? AND teacher_id = ?',
    [req.params.id, req.user.user_id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Nie znaleziono placówki lub brak uprawnień.' });
  }

  res.json({ success: true, message: 'Placówka usunięta.' });
});

module.exports = router;
