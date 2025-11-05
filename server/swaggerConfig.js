// Plik: server/swaggerConfig.js
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MusicDesk API',
      version: '1.0.0',
      description: 'Oficjalna dokumentacja API dla platformy MusicDesk',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Lokalny serwer deweloperski',
      },
    ],
  },
  // Ścieżka do plików komentarzy Swagger
  apis: ['./server.js'], 
};

module.exports = options;