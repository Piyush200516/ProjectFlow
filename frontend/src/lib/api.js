import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Bulletproof fallback for production Vercel environments
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://projectflow-backend-lsvr.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor to handle auth errors (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clean auth state on auth failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://projectflow-auth.vercel.app';
      const storedUser = localStorage.getItem('user');
      const role = storedUser ? JSON.parse(storedUser)?.role || 'student' : 'student';
      if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        window.location.href = `${AUTH_URL}/auth/${role}/login`;
      } else {
        window.location.href = `/auth/${role}/login`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
