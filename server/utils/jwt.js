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

/**
 * TWORZENIE TOKENA (Logowanie)
 */
const generateTokenId = async (user) => {
  const pool = getPool();
  const tokenId = uuidv4();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const expiresAtFormatted = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

  await pool.execute(
    `INSERT INTO User_Tokens (token_id, user_id, expires_at, type) VALUES (?, ?, ?, 'session')`,
    [tokenId, user.user_id, expiresAtFormatted]
  );

  return tokenId;
};

/**
 * TWORZENIE JWT
 */
const createToken = (tokenId) => {
  const payload = { id: tokenId }; 
  const expiresIn = process.env.JWT_EXPIRE || '30d'; 
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) throw new Error('JWT_SECRET nie jest zdefiniowany');

  return jwt.sign(payload, jwtSecret, { expiresIn });
};

/**
 * WERYFIKACJA TOKENA
 */
const decodeToken = async (tokenPayload) => {
  try {
    if (!tokenPayload) return null;

    const pool = getPool();
    const jwtSecret = process.env.JWT_SECRET;
    
    const decoded = jwt.verify(tokenPayload, jwtSecret); 

    const [tokenRows] = await pool.execute(
      'SELECT user_id FROM User_Tokens WHERE token_id = ? AND expires_at > NOW()',
      [decoded.id]
    );

    if (!tokenRows || tokenRows.length === 0) return null;
    
    const { user_id } = tokenRows[0];

    const [userRows] = await pool.execute(
      'SELECT user_id, email, first_name, last_name, `role`, created_at FROM Users WHERE user_id = ?',
      [user_id]
    );

    if (!userRows || userRows.length === 0) return null;

    return {
      user: userRows[0],
      tokenId: decoded.id 
    };

  } catch (err) {
    return null;
  }
};

/**
 * CZYSZCZENIE CIASTECZKA (Wylogowanie)
 */
const deleteJwtCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
};

/**
 * WYSYŁANIE ODPOWIEDZI
 */
const sendTokenResponse = async (user, statusCode, res) => {
  const tokenId = await generateTokenId(user);
  const token = createToken(tokenId);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
};

module.exports = {
  sendTokenResponse,
  createToken,
  generateTokenId,
  decodeToken,
  deleteJwtCookie
};