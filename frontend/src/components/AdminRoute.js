import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

/**
 * Wrap <AdminDashboard/> with this. It:
 *  - shows a loading state while the session is being restored
 *  - prompts sign-in (same login form everyone uses) if nobody is logged in
 *  - blocks with "Access denied" if the logged-in user's role isn't "admin"
 *  - renders the admin page only for real admins (role comes from the DB, via the JWT)
 */
export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return <div className="admin-gate"><p>Loading…</p></div>;
  }

  if (!user) {
    return (
      <div className="admin-gate">
        <h2>Admin sign in required</h2>
        <p>Sign in with an admin account to view this page.</p>
        <button className="admin-gate__btn" onClick={() => setShowLogin(true)}>Sign In</button>
        {showLogin && <AuthModal mode="login" onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-gate">
        <h2>Access denied</h2>
        <p>Your account ({user.email}) doesn't have admin access.</p>
      </div>
    );
  }

  return children;
}
