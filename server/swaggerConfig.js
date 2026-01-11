const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MusicDesk API',
      version: '1.0.0',
      description: 'Official API documentation for the MusicDesk platform',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Local development server',
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