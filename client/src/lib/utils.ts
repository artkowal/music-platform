import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// bazowy URL API
const API_URL = 'http://localhost:5001/api';

// główny klient API
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Kluczowe: Mówi Axiosowi, aby wysyłał ciasteczka (token) z każdym żądaniem
});

// Interceptor do logowania błędów sieciowych
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Błąd API:', error.response?.data || error.message);
    // Przekazujemy błąd dalej, aby formularz mógł go złapać
    return Promise.reject(error);
  }
);