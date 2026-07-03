// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { BACKEND_URL } from '../api';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;
//     fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' })
//       .then(res => (res.ok ? res.json() : Promise.reject()))
//       .then(data => { if (!cancelled) setUser(data.user); })
//       .catch(() => { if (!cancelled) setUser(null); })
//        .finally(() => { if (!cancelled) setLoading(false); });
//     return () => { cancelled = true; };
//   }, []);

//   // AuthModal performs the actual login/register fetch itself (it needs
//   // the response body to show field-specific errors). This just commits
//   // the returned user to global state once that fetch succeeds.
//   const login = (userData) => setUser(userData);

//   const logout = async () => {
//     try {
//       await fetch(`${BACKEND_URL}/api/auth/logout`, {
//         method: 'POST',
//         credentials: 'include',
//       });
//     } finally {
//       setUser(null);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);



import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BACKEND_URL = 'https://saffron-stove-backend.onrender.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load (so refreshing /admin doesn't log you out)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // no valid session — stay logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      setUser(userData.user || userData);
    } catch (err) {
      console.error(err);
      if (typeof setError === 'function') {
        setError(err.message || "Invalid email or password");
      }
    }
  };

  // Used by AuthModal, which already hits /login or /register itself and
  // just needs the resulting user object dropped into context.
  const setSessionUser = (userObj) => setUser(userObj);

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
    <AuthContext.Provider value={{ user, loading, login, logout, setSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);