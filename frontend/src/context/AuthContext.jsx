import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistence
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password, role) => {
    // Premium Dummy Auth Logic
    const userData = { 
      email, 
      role, 
      name: email.split('@')[0], 
      id: Math.random().toString(36).substr(2, 9),
      lastLogin: new Date().toISOString()
    };
    
    // Save to localStorage as requested
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', 'premium-auth-token-' + Date.now());
    
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
