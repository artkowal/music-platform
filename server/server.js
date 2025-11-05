const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Trasa testowa
app.get('/', (req, res) => {
  res.send('Hello from the Music Platform Backend!');
});

// Trasa testująca połączenie z bazą danych
app.get('/api/db-test', async (req, res) => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    res.json({
      message: 'Database connection successful!',
      solution: rows[0].solution
    });
    await connection.end();
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed!',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});