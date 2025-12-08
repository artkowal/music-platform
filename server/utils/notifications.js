const { v4: uuidv4 } = require('uuid');

/**
 * Zapisuje powiadomienie w bazie i wysyła przez Socket.IO
 * @param {Object} dbPool - Pula połączeń MySQL
 * @param {Object} io - Instancja Socket.IO
 * @param {number} userId - ID odbiorcy
 * @param {Object} data - { title, description, link, type }
 */
const sendNotification = async (dbPool, io, userId, data) => {
  const { title, description, link, type = 'info' } = data;
  const notificationId = uuidv4();

  try {
    await dbPool.execute(
      `INSERT INTO Notifications (notification_id, user_id, title, description, link, type, is_read) 
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [notificationId, userId, title, description, link, type]
    );

    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notificationId,
        title,
        description,
        link,
        type,
        timestamp: new Date(),
        read: false
      });
    }

    console.log(`Powiadomienie wysłane do User ${userId}`);
  } catch (error) {
    console.error("Błąd wysyłania powiadomienia:", error);
  }
};

module.exports = { sendNotification };