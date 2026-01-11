const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser'); // <--- DODANO IMPORT
const { protect } = require('../../middlewares/auth.middleware');

// Mockujemy bazę danych
jest.mock('../../config/db', () => ({
  execute: jest.fn()
}));

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/auth/check', protect, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// Mockujemy utils/jwt, żeby 'decodeToken' zwracało poprawnego usera bez pytania prawdziwej bazy
jest.mock('../../utils/jwt', () => ({
  decodeToken: jest.fn().mockResolvedValue({
    user: { user_id: 123, email: 'student@test.pl', role: 'student' },
    tokenId: 'abc-123'
  }),
  deleteJwtCookie: jest.fn()
}));

describe('GET /api/auth/check', () => {
  test('zwraca dane użytkownika gdy token jest poprawny', async () => {
    // Arrange & Act
    const res = await request(app)
      .get('/api/auth/check')
      .set('Cookie', ['token=validToken123']);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('student@test.pl');
  });
});