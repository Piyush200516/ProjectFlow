import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user if token exists
  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      const userData = data.user || data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to fetch user:', err);
      logout();
    }
  };

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, []);

  const login = async (email, password, expectedRole) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (expectedRole && data.user.role !== expectedRole) {
      throw new Error(`Access denied. You are registered as ${data.user.role}.`);
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, full_name, role = 'student', roll_number = '') => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      full_name,
      role,
      roll_number,
    });
    // Auto‑login after registration
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // expose both names so Signup.jsx (which calls signup) still works
  const signup = register;

  return (
    <AuthContext.Provider value={{ user, login, register, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
