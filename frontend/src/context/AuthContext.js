import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BACKEND_URL = 'https://saffron-stove-backend.onrender.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to safely handle API errors without crashing
  const getErrorMessage = (err) => {
    return err.response?.data?.message || err.message || "An unexpected error occurred.";
  };

  const login = async (email, password, setError) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Login failed");
      }

      const userData = await res.json();
      setUser(userData);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err)); // Pass string, not function
    }
  };

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