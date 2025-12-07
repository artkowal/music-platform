require('dotenv').config();
require('express-async-errors'); 

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const { initSocket } = require('./services/socket');

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

// --- Pobieranie/wysyłanie plików ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- GŁÓWNE TRASY API ---
app.use('/api', mainRouter);

// --- Globalna Obsługa Błędów ---
app.use(handleError);

// --- Konfiguracja SOCKET.IO ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true
  }
});
app.set('io', io);
initSocket(io);

// --- Uruchomienie Serwera ---
server.listen(PORT, () => {
  console.log(`Backend server (HTTP + WebSocket) running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:5001/api-docs`);
});