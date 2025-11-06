const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

// Tworzymy pulę połączeń, aby móc jej używać w różnych funkcjach
// (jest to wydajniejsze niż tworzenie nowego połączenia za każdym razem)
let dbPool;
const getPool = () => {
  if (!dbPool) {
    dbPool = mysql.createPool(process.env.DATABASE_URL);
  }
  return dbPool;
}

// Generuje unikalny token ID, zapisuje go w DB i zwraca.
const generateTokenId = async (user) => {
  const pool = getPool();
  let tokenId;
  let userWithThisToken = null;

  do {
    tokenId = uuidv4();
    const [rows] = await pool.execute(
      'SELECT user_id FROM Users WHERE current_token_id = ?',
      [tokenId]
    );
    userWithThisToken = rows[0];
  } while (userWithThisToken);

  // Zapisz nowy token ID w bazie danych dla tego użytkownika
  await pool.execute(
    'UPDATE Users SET current_token_id = ? WHERE user_id = ?',
    [tokenId, user.user_id]
  );

  return tokenId;
};

// Tworzy podpisany token JWT na podstawie unikalnego ID.
const createToken = (tokenId) => {
  const payload = { id: tokenId };
  const expiresIn = '30d'; // 30 dni
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET nie jest zdefiniowany w pliku .env');
  }

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn });

  return {
    accessToken,
    expiresInDays: 30,
  };
};


// Główna funkcja: generuje, tworzy i wysyła bezpieczne ciasteczko HttpOnly.

const sendTokenResponse = async (user, statusCode, res) => {
  const tokenId = await generateTokenId(user);
  const token = createToken(tokenId);

  const options = {
    expires: new Date(
      Date.now() + token.expiresInDays * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Wysyłaj tylko przez HTTPS na produkcji
    sameSite: 'strict',
  };

  // Usuń wrażliwe dane przed wysłaniem odpowiedzi
  const userResponse = { ...user };
  delete userResponse.password_hash;
  delete userResponse.current_token_id;

  res
    .status(statusCode)
    .cookie('token', token.accessToken, options) // Wyślij token w ciasteczku
    .json({
      success: true,
      user: userResponse,
    });
};

// Weryfikuje token z ciasteczka i zwraca użytkownika z DB.
const decodeToken = async (tokenPayload) => {
  try {
    if (!tokenPayload) return null;

    const pool = getPool();
    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(tokenPayload, jwtSecret);

    // Znajdź użytkownika na podstawie token ID z bazy danych
    const [rows] = await pool.execute(
      'SELECT user_id, email, full_name, `role`, created_at FROM Users WHERE current_token_id = ?',
      [decoded.id]
    );
    
    // Jeśli nie ma użytkownika (bo np. token został unieważniony przez wylogowanie), zwróć null
    return rows[0] ? rows[0] : null;

  } catch (err) {
    // Jeśli token wygasł lub jest niepoprawny
    return null;
  }
};

// Czyści ciasteczko po stronie klienta.
const deleteJwtCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Wygasa za 10 sekund
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};


module.exports = {
  sendTokenResponse,
  decodeToken,
  deleteJwtCookie,
};