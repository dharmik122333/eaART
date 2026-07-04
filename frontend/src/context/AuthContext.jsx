import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on startup if token exists
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await api.get('/api/auth/me');
          if (data.success) {
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Failed to authenticate token on startup:', err.message);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await api.post('/api/auth/register', userData);
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const data = await api.put('/api/users/profile', profileData);
      if (data.success) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const uploadProfileImage = async (formData) => {
    setError(null);
    try {
      const data = await api.post('/api/users/profile/image', formData, true);
      if (data.success) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadProfileImage,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
