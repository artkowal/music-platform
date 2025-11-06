// Przechwytuje błędy (dzięki 'express-async-errors')

const handleError = (err, req, res, next) => {
  console.error(err); // Loguj błąd na serwerze

  // Domyślny błąd serwera
  let statusCode = 500;
  let message = 'Wystąpił nieoczekiwany błąd serwera.';
  
  // Błąd MySQL dla zduplikowanego emaila
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    message = 'Ten adres e-mail jest już zajęty.';
  }

  // TODO: Dodać walidator dla hasła
  
  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

module.exports = {
  handleError,
};