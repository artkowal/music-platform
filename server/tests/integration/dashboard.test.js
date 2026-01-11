const request = require('supertest');
const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');

const app = express();

app.get('/api/dashboard', protect, (req, res) => {
  res.status(200).json({ message: 'Access granted' });
});

describe('Dashboard Access', () => {
  test('powinien zablokować dostęp bez tokena (401)', async () => {
    // Act
    const res = await request(app).get('/api/dashboard');

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});