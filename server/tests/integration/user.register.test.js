const request = require('supertest');
const express = require('express');

// Mockujemy bazę danych
jest.mock('../../config/db', () => ({
  execute: jest.fn()
}));

// Mockujemy pomocnicze funkcje (żeby nie haszować naprawdę i nie wysyłać maili)
jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_secret_password')
}));

jest.mock('../../utils/jwt', () => ({
  sendTokenResponse: jest.fn((user, statusCode, res) => {
    return res.status(statusCode).json({ success: true, token: 'fake_jwt_token' });
  }),
  deleteJwtCookie: jest.fn()
}));

// Importujemy router użytkowników i mocka bazy
const userRoutes = require('../../routes/user');
const db = require('../../config/db');

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

describe('POST /api/user/register', () => {
  
  beforeEach(() => {
    jest.clearAllMocks(); // Czyścimy licznik wywołań przed każdym testem
  });

  test('powinien zarejestrować nowego użytkownika (201)', async () => {
    // Arrange
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'nowy@test.pl',
      password: 'StrongPassword1!', // Musi spełniać regex (duża, mała, cyfra, znak spec.)
      role: 'student'
    };

    // Mockujemy odpowiedzi bazy danych
    db.execute.mockResolvedValueOnce([{ insertId: 100 }]); 
    
    // Zwracamy tablicę wierszy
    db.execute.mockResolvedValueOnce([
      [{ user_id: 100, email: 'nowy@test.pl', role: 'student', first_name: 'Test' }]
    ]);

    // Act
    const res = await request(app)
      .post('/api/user/register')
      .send(newUser);

    // Assert
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    
    // Sprawdzamy czy baza została zapytana 2 razy (INSERT i SELECT)
    expect(db.execute).toHaveBeenCalledTimes(2);
  });

  test('powinien zwrócić 400 przy zbyt słabym haśle', async () => {
    // Arrange
    const weakUser = {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@test.pl',
      password: '123', // Za słabe hasło
      role: 'student'
    };

    // Act
    const res = await request(app)
      .post('/api/user/register')
      .send(weakUser);

    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Hasło jest za słabe/i);
    
    // Baza nie powinna być w ogóle pytana
    expect(db.execute).not.toHaveBeenCalled();
  });
});