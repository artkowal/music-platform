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
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token', 
        },
      },
    },
    security: [{
      cookieAuth: [],
    }],
  },
  apis: ['./server.js', './routes/*.js'],
};

module.exports = options;