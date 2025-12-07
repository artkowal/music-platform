const { parse } = require('cookie');
const { decodeToken } = require('../utils/jwt');
const mysql = require('mysql2/promise');

const dbPool = mysql.createPool(process.env.DATABASE_URL);

const initSocket = (io) => {
  // Middleware: Autoryzacja użytkownika przed połączeniem
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) return next(new Error("Authentication error: No cookies"));

      const cookies = parse(cookieHeader);
      const token = cookies.token;

      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = await decodeToken(token);
      if (!decoded || !decoded.user) return next(new Error("Authentication error: Invalid token"));

      socket.user = decoded.user;
      next();
    } catch (err) {
      console.error("Socket Auth Error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on('connection', (socket) => {
    // 1. Dołącz do pokoju prywatnego użytkownika (do powiadomień)
    const userRoom = `user_${socket.user.user_id}`;
    socket.join(userRoom);
    
    // 1b. Dołącz do pokoju lekcji (jeśli klient o to poprosi)
    socket.on('join_lesson', (lessonId) => {
      socket.join(`lesson_${lessonId}`);
    });

    // 2. Wysyłanie wiadomości
    socket.on('send_comment', async (data) => {
      const { lessonId, content } = data;
      const userId = socket.user.user_id;

      if (!content || !content.trim()) return;

      try {
        // A. Zapisz wiadomość w bazie
        const [result] = await dbPool.execute(
          'INSERT INTO Comments (lesson_id, user_id, content, is_read) VALUES (?, ?, ?, FALSE)',
          [lessonId, userId, content]
        );
        
        // B. Wyślij do czatu (pokój lekcji)
        const newComment = {
          comment_id: result.insertId,
          content: content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: 0,
          user_id: userId,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name,
          role: socket.user.role,
          email: socket.user.email
        };

        io.to(`lesson_${lessonId}`).emit('receive_comment', newComment);

        // C. WYŚLIJ POWIADOMIENIE (GLOBALNE)
        
        // Pobierz dane potrzebne do powiadomienia (TYTUŁ LEKCJI, ID KURSU, ID NAUCZYCIELA)
        const [lessonRows] = await dbPool.execute(`
            SELECT l.title as lesson_title, l.course_id, c.teacher_id
            FROM Lessons l
            JOIN Courses c ON l.course_id = c.course_id
            WHERE l.lesson_id = ? LIMIT 1
        `, [lessonId]);

        if (lessonRows.length === 0) return;
        const { lesson_title, course_id, teacher_id } = lessonRows[0];

        // Przygotuj treść powiadomienia
        const notificationPayload = {
            type: 'message',
            title: `Wiadomość od ${socket.user.first_name}`,
            description: `Lekcja: ${lesson_title}`,
            link: `/dashboard/courses/${course_id}/lessons/${lessonId}`
        };

        // Wyślij do odpowiednich osób
        if (socket.user.role === 'student') {
            io.to(`user_${teacher_id}`).emit('notification', notificationPayload);
        } else {
            const [students] = await dbPool.execute(
                'SELECT student_id FROM Enrollments WHERE course_id = ?', 
                [course_id]
            );

            students.forEach(s => {
                // Nie wysyłaj powiadomienia samemu sobie (gdyby nauczyciel był zapisany na swój kurs)
                if (s.student_id !== userId) {
                    io.to(`user_${s.student_id}`).emit('notification', notificationPayload);
                }
            });
        }

      } catch (error) {
        console.error("Błąd zapisu komentarza przez Socket:", error);
        socket.emit('error', { message: "Nie udało się wysłać wiadomości" });
      }
    });

    socket.on('disconnect', () => {});
  });
};

module.exports = { initSocket };