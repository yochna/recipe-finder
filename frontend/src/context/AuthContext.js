import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_URL } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a valid session cookie already exists so the
  // user doesn't get bumped to "logged out" on every page refresh.
  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => { if (!cancelled) setUser(data.user); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // AuthModal performs the actual login/register fetch itself (it needs
  // the response body to show field-specific errors). This just commits
  // the returned user to global state once that fetch succeeds.
  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);