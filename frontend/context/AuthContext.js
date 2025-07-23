import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
  };

  if (loading) {
    // Optionally render a splash/loading screen here
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 