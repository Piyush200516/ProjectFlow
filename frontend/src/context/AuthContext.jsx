import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../lib/api';
import logo from '../assets/projectflow-logo.png';
import { clearSession, selectUser, setSession, updateUser } from '../store/authSlice';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    dispatch(clearSession());
  };

  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      const userData = data.user || data;
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch(setSession({ user: userData, token }));
      connectSocket();
    } catch (err) {
      console.error('Failed to fetch user:', err);
      logout();
    }
  };

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => dispatch(clearSession());
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [dispatch]);

  const login = async (email, password, expectedRole) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (expectedRole && data.user.role !== expectedRole) {
      throw new Error(`Access denied. You are registered as ${data.user.role}.`);
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch(setSession({ user: data.user, token: data.token }));
    connectSocket();
    return data.user;
  };

  const register = async (email, password, full_name, role = 'student', roll_number = '', branch_id = '1', section = '1', subsection = '1', semester = '6') => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      full_name,
      role,
      roll_number,
      branch_id,
      section,
      subsection,
      semester,
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch(setSession({ user: data.user, token: data.token }));
    connectSocket();
    return data.user;
  };

  const signup = register;

  return (
    <AuthContext.Provider value={{ user, login, register, signup, logout, loading, updateUser: (nextUser) => dispatch(updateUser(nextUser)) }}>
      {loading ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999] transition-all duration-500">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-full animate-ping duration-1000 opacity-75"></div>
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
