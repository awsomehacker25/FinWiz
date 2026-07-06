import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export const AuthContext = createContext();

const PROFILE_CACHE_KEY = 'userProfileCache';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase persists the auth session itself (via AsyncStorage), so this
    // fires with the restored user on app start without us managing it.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let cached = {};
        try {
          const stored = await SecureStore.getItemAsync(PROFILE_CACHE_KEY);
          cached = stored ? JSON.parse(stored) : {};
        } catch (e) {
          // ignore corrupt cache
        }
        setUser({
          ...cached,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          id: firebaseUser.email,
        });
      } else {
        setUser(null);
        await SecureStore.deleteItemAsync(PROFILE_CACHE_KEY);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Merges app-specific profile fields (firstName, isNewUser, etc.) on top of
  // the live Firebase session. Actual sign-in/sign-up happens via Firebase
  // Auth in LoginScreen/SignUpScreen before this is called.
  const login = useCallback(async (userData) => {
    setUser(prev => {
      const merged = { ...prev, ...userData, id: userData.email || userData.id || prev?.id };
      SecureStore.setItemAsync(PROFILE_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    await SecureStore.deleteItemAsync(PROFILE_CACHE_KEY);
    setUser(null);
  }, []);

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
