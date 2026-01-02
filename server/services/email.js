const nodemailer = require('nodemailer');

// Funkcja tworząca transporter zależnie od środowiska
const createTransporter = async () => {
  // Sprawdź, czy mamy prawdziwe dane w .env (Produkcja)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true dla portu 465, false dla innych
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Jeśli brak danych, użyj konta testowego Ethereal (Development)
  console.log('⚠️ Brak danych SMTP w .env - Używam trybu testowego (Ethereal Email).');
  
  // Tworzy tymczasowe konto testowe
  const testAccount = await nodemailer.createTestAccount();
  
  console.log(`📧 Konto testowe: ${testAccount.user} / ${testAccount.pass}`);

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Zmienna globalna trzymająca transporter (promise)
let transporterPromise = createTransporter();

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await transporterPromise;

    const info = await transporter.sendMail({
      from: `"Music Platform" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email wysłany do: ${to}`);
    
    // Generuje link do podglądu, jeśli używamy Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🌐 PODGLĄD MAILA (kliknij): ${previewUrl}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Błąd wysyłania emaila:', error);
    return false;
  }
};

module.exports = { sendEmail };