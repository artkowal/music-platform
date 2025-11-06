require('dotenv').config();
require('express-async-errors'); 

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = require('./swaggerConfig');
const mainRouter = require('./routes'); 
const { handleError } = require('./utils/errors'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5001'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser()); 

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- GŁÓWNE TRASY API ---
app.use('/api', mainRouter);

// --- Globalna Obsługa Błędów ---
app.use(handleError);

// --- Uruchomienie Serwera ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:5001/api-docs`);
});