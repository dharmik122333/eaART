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
            localStorage.removeItem('refreshToken');
          }
        } catch (err) {
          console.error('Failed to authenticate token on startup:', err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    checkUser();

    // Listen to dead session events from api.js
    const handleDeadSession = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleDeadSession);
    return () => window.removeEventListener('auth-logout', handleDeadSession);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setError(null);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
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
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const googleLogin = async (googlePayload) => {
    setError(null);
    try {
      const data = await api.post('/api/auth/google', googlePayload);
      if (data.success) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (err) {
      console.warn('Backend logout failed or offline:', err.message);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
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
    googleLogin,
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
