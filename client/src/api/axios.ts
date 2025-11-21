import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Błąd API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);