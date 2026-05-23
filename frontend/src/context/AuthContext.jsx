import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import logo from '../assets/projectflow-logo.png';

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

  const register = async (email, password, full_name, role = 'student', roll_number = '', branch_id = '1', section = '1', subsection = '1') => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      full_name,
      role,
      roll_number,
      branch_id,
      section,
      subsection,
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
      {loading ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999] transition-all duration-500">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-full animate-ping duration-1000 opacity-75"></div>
              {/* Logo with bounce animation */}
              <img 
                src={logo} 
                alt="ProjectFlow Logo" 
                className="w-32 h-auto object-contain relative z-10 animate-pulse" 
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4 animate-pulse mt-1">
              Initializing Secure Session
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
