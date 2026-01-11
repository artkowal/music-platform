const mysql = require('mysql2/promise');
require('dotenv').config();

// Sprawdzamy czy mamy DATABASE_URL (z Dockera)
const dbUrl = process.env.DATABASE_URL;

const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'music-platform-db',
  port: process.env.DB_PORT || 3308, //  3308 dla localhost, 3306 dla Dockera
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbUrl || localConfig);

module.exports = pool;