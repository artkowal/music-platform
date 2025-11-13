const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

let dbPool;
const getPool = () => {
  if (!dbPool) {
    dbPool = mysql.createPool(process.env.DATABASE_URL);
  }
  return dbPool;
};

// 'generateTokenId' TWORZY nowy token w tabeli 'User_Tokens' ===
const generateTokenId = async (user) => {
  const pool = getPool();
  const tokenId = uuidv4(); // Generujemy nowy, unikalny ID

  // Zapisz nowy token ID w nowej tabeli
  await pool.execute(
    'INSERT INTO User_Tokens (token_id, user_id) VALUES (?, ?)',
    [tokenId, user.user_id]
  );

  return tokenId;
};

// Tworzy podpisany token JWT
const createToken = (tokenId) => {
  const payload = { id: tokenId }; // 'id' w tokenie JWT to nasz 'token_id' z tabeli 'User_Tokens'
  const expiresIn = '30d'; 
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

// Główna funkcja
const sendTokenResponse = async (user, statusCode, res) => {
  const tokenId = await generateTokenId(user);
  const token = createToken(tokenId);

  const options = {
    expires: new Date(
      Date.now() + token.expiresInDays * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  const userResponse = { ...user };
  delete userResponse.password_hash;

  res
    .status(statusCode)
    .cookie('token', token.accessToken, options)
    .json({
      success: true,
      user: userResponse,
    });
};

// ==='decodeToken' sprawdza tabelę 'User_Tokens' ===
const decodeToken = async (tokenPayload) => {
  try {
    if (!tokenPayload) return null;

    const pool = getPool();
    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(tokenPayload, jwtSecret); // 'decoded.id' to nasz 'token_id'

    // 1. Sprawdź, czy ten token ID istnieje w naszej tabeli sesji
    const [tokenRows] = await pool.execute(
      'SELECT user_id FROM User_Tokens WHERE token_id = ?',
      [decoded.id]
    );

    if (!tokenRows[0]) {
      // Token nie istnieje w bazie (np. został wylogowany)
      return null;
    }
    
    const { user_id } = tokenRows[0];

    // 2. Pobierz dane użytkownika
    const [userRows] = await pool.execute(
      'SELECT user_id, email, first_name, last_name, `role`, created_at FROM Users WHERE user_id = ?',
      [user_id]
    );

    if (!userRows[0]) {
      // Użytkownik powiązany z tym tokenem nie istnieje
      return null;
    }

    // Zwracamy obiekt zawierający użytkownika ORAZ token ID tej sesji
    return {
      user: userRows[0],
      tokenId: decoded.id 
    };

  } catch (err) {
    // Jeśli token wygasł lub jest niepoprawny
    return null;
  }
};

// Czyści ciasteczko
const deleteJwtCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
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