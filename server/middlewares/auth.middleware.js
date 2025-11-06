const { decodeToken, deleteJwtCookie } = require('../utils/jwt');

const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Brak autoryzacji. Nie znaleziono tokena.',
    });
  }

  const user = await decodeToken(token);

  if (!user) {
    // Jeśli token jest niepoprawny, wygasł lub został unieważniony, czyścimy ciasteczko
    deleteJwtCookie(res);
    return res.status(401).json({
      success: false,
      message: 'Brak autoryzacji. Nieprawidłowy token.',
    });
  }

  // Użytkownik jest poprawny, dołączamy go do obiektu req
  req.user = user;
  next();
};

module.exports = {
  protect,
};