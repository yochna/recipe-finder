import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAdminUsers, getAdminFavorites } from '../api';
import './Admin.css';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Gate the page: only signed-in admins get past this.
  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    (async () => {
      try {
        setLoading(true);
        const [statsData, usersData, favoritesData] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
          getAdminFavorites(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setFavorites(favoritesData);
      } catch (err) {
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (authLoading || !user?.isAdmin) return null;

  return (
    <main className="admin">
      <div className="admin__header">
        <p className="eyebrow">Admin</p>
        <h1 className="admin__title">Dashboard</h1>
        <p className="admin__sub">Everything happening across Saffron &amp; Stove.</p>
      </div>

      {error && <p className="admin__error">{error}</p>}

      <div className="admin__stats">
        <StatCard label="Total Users" value={stats?.totalUsers} />
        <StatCard label="Admins" value={stats?.totalAdmins} />
        <StatCard label="Saved Recipes" value={stats?.totalFavorites} />
        <StatCard label="New (7 days)" value={stats?.newUsersLast7Days} />
        <StatCard label="New Today" value={stats?.newUsersToday} />
      </div>

      <div className="admin__tabs">
        <button
          className={`admin__tab${tab === 'users' ? ' active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`admin__tab${tab === 'favorites' ? ' active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          Saved Recipes ({favorites.length})
        </button>
      </div>

      {loading ? (
        <p className="admin__loading">Loading…</p>
      ) : tab === 'users' ? (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`admin__badge${u.isAdmin ? ' admin__badge--admin' : ''}`}>
                      {u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="4" className="admin__empty">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Recipe</th>
                <th>Saved By</th>
                <th>Ready In</th>
                <th>Saved On</th>
              </tr>
            </thead>
            <tbody>
              {favorites.map(f => (
                <tr key={f._id}>
                  <td>{f.title}</td>
                  <td>{f.userId ? `${f.userId.name} (${f.userId.email})` : 'Deleted user'}</td>
                  <td>{f.readyInMinutes ? `${f.readyInMinutes} min` : '—'}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {favorites.length === 0 && (
                <tr><td colSpan="4" className="admin__empty">No saved recipes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin__stat-card">
      <p className="admin__stat-value">{value ?? '—'}</p>
      <p className="admin__stat-label">{label}</p>
    </div>
  );
}