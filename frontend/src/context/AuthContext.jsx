import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('clinicify_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('clinicify_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('clinicify_token', token);
    localStorage.setItem('clinicify_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const registerPatient = async (registrationData) => {
    const response = await api.post('/auth/register-patient', registrationData);
    const { token, ...userData } = response.data;
    localStorage.setItem('clinicify_token', token);
    localStorage.setItem('clinicify_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('clinicify_token');
    localStorage.removeItem('clinicify_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, registerPatient, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

