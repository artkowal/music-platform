const axios = require('axios');
const qs = require('qs');

let cachedToken = null;
let tokenExpiresAt = 0;

// Helper do pobierania tokenu OAuth (Server-to-Server)
const getZoomAccessToken = async () => {
  if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
    console.error('❌ ZOOM ERROR: Brak danych konfiguracyjnych w pliku .env');
    throw new Error('Brak konfiguracji Zoom.');
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const token = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      qs.stringify({ grant_type: 'account_credentials', account_id: process.env.ZOOM_ACCOUNT_ID }),
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;
    return cachedToken;
  } catch (error) {
    console.error('❌ ZOOM AUTH ERROR:', error.response?.data || error.message);
    throw new Error('Błąd autoryzacji Zoom. Sprawdź Account ID, Client ID i Secret.');
  }
};

const createMeeting = async (topic, startTime, duration) => {
  try {
    const token = await getZoomAccessToken();
    
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topic,
        type: 2, 
        start_time: startTime,
        duration: duration,
        timezone: 'Europe/Warsaw',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: 'none'
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ ZOOM CREATE ERROR:', error.response?.data || error.message);
    return null; 
  }
};

const getMeetingReport = async (meetingId) => {
  try {
    const token = await getZoomAccessToken();
    
    const response = await axios.get(
      `https://api.zoom.us/v2/report/meetings/${meetingId}/participants`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    
    // OBSŁUGA DARMOWEGO KONTA 
    if (msg && msg.includes('Only available for Paid')) {
        console.warn(`ZOOM INFO: Raport niedostępny dla darmowego konta (Meeting ID: ${meetingId}).`);
        return null;
    }

    // RATE LIMIT (429) 
    if (error.response?.status === 429) {
        console.warn(`⚠️ ZOOM RATE LIMIT: Zbyt wiele zapytań. Spróbuj później.`);
        return null;
    }

    // INNE BŁĘDY
    if (error.response?.status !== 404) {
        console.warn(`⚠️ ZOOM REPORT ERROR (${meetingId}):`, msg);
    }
    
    return null;
  }
};

module.exports = { createMeeting, getMeetingReport };