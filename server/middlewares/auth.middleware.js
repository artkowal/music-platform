const { decodeToken, deleteJwtCookie } = require('../utils/jwt');

const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Brak autoryzacji. Nie znaleziono tokena.',
    });
  }

  // ==='decodeToken' zwraca obiekt { user, tokenId } ===
  const decodedData = await decodeToken(token);

  if (!decodedData || !decodedData.user) {
    // Jeśli token jest niepoprawny, wygasł lub został unieważniony
    deleteJwtCookie(res);
    return res.status(401).json({
      success: false,
      message: 'Brak autoryzacji. Nieprawidłowy token.',
    });
  }

  // Użytkownik jest poprawny, dołączamy go ORAZ ID tokena do obiektu req
  req.user = decodedData.user;
  req.tokenId = decodedData.tokenId; // <-- Kluczowe dla wylogowania
  next();
};

module.exports = {
  protect,
};