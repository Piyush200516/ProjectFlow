import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
      // Redirect to login page (student portal as default)
      window.location.href = '/auth/student/login';
    }
    return Promise.reject(error);
  }
);

export default api;
