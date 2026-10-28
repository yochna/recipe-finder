import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';

const BACKEND_URL = 'https://saffron-stove-backend.onrender.com';

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, favRes, reviewsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/stats`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/admin/favorites`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/admin/reviews?status=all`, { credentials: 'include' }),
      ]);
      if (!statsRes.ok || !usersRes.ok || !favRes.ok || !reviewsRes.ok) throw new Error('Failed to load admin data');
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setFavorites(await favRes.json());
      setReviews(await reviewsRes.json());
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setBusyId(u._id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${u._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Could not update role');
      const updated = await res.json();
      setUsers(prev => prev.map(x => x._id === updated._id ? updated : x));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This also removes their favorites.`)) return;
    setBusyId(u._id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${u._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete user');
      setUsers(prev => prev.filter(x => x._id !== u._id));
      setFavorites(prev => prev.filter(f => f.userId?._id !== u._id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const setReviewStatus = async (rv, status) => {
    setBusyId(rv._id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews/${rv._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated.error || 'Could not update review');
      setReviews(prev => prev.map(x => (x._id === updated._id ? updated : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteReview = async (rv) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusyId(rv._id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews/${rv._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Could not delete review');
      setReviews(prev => prev.filter(x => x._id !== rv._id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="admin"><p className="admin__msg">Loading admin dashboard…</p></div>;
  if (error) return <div className="admin"><p className="admin__msg admin__msg--error">{error}</p></div>;

  return (
    <div className="admin">
      <div className="admin__header">
        <h1>Admin Dashboard</h1>
        <p>Full visibility into every real user and saved recipe in the database.</p>
      </div>

      {stats && (
        <div className="admin__stats">
          <div className="admin__stat-card">
            <span className="admin__stat-num">{stats.userCount}</span>
            <span className="admin__stat-label">Total Users</span>
          </div>
          <div className="admin__stat-card">
            <span className="admin__stat-num">{stats.adminCount}</span>
            <span className="admin__stat-label">Admins</span>
          </div>
          <div className="admin__stat-card">
            <span className="admin__stat-num">{stats.favoriteCount}</span>
            <span className="admin__stat-label">Saved Recipes</span>
          </div>
          <div className="admin__stat-card">
            <span className="admin__stat-num">{stats.pendingReviewCount ?? 0}</span>
            <span className="admin__stat-label">Reviews Pending</span>
          </div>
        </div>
      )}

      <div className="admin__tabs">
        <button className={`admin__tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
          Users ({users.length})
        </button>
        <button className={`admin__tab${tab === 'favorites' ? ' active' : ''}`} onClick={() => setTab('favorites')}>
          Favorites ({favorites.length})
        </button>
        <button className={`admin__tab${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>
          Reviews ({reviews.filter(r => r.status === 'pending').length} pending)
        </button>
      </div>

      {tab === 'users' && (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`admin__badge${u.role === 'admin' ? ' admin__badge--admin' : ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="admin__actions">
                    <button disabled={busyId === u._id} onClick={() => toggleRole(u)}>
                      {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                    <button disabled={busyId === u._id} className="admin__danger" onClick={() => deleteUser(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" className="admin__empty">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'favorites' && (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Recipe</th>
                <th>Saved By</th>
                <th>Ready In</th>
                <th>Servings</th>
                <th>Saved On</th>
              </tr>
            </thead>
            <tbody>
              {favorites.map(f => (
                <tr key={f._id}>
                  <td>{f.title}</td>
                  <td>{f.userId ? `${f.userId.name} (${f.userId.email})` : 'Unknown user'}</td>
                  <td>{f.readyInMinutes ? `${f.readyInMinutes} min` : '—'}</td>
                  <td>{f.servings || '—'}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {favorites.length === 0 && (
                <tr><td colSpan="5" className="admin__empty">No saved recipes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="admin__table-wrap">
          <div className="admin__filters">
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button
                key={f}
                className={`admin__filter${reviewFilter === f ? ' active' : ''}`}
                onClick={() => setReviewFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <table className="admin__table">
            <thead>
              <tr>
                <th>Recipe</th>
                <th>By</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews
                .filter(rv => reviewFilter === 'all' || rv.status === reviewFilter)
                .map(rv => (
                <tr key={rv._id}>
                  <td>{rv.recipeTitle || `#${rv.recipeId}`}</td>
                  <td>{rv.userId ? `${rv.userId.name}` : 'Unknown'}</td>
                  <td>{'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}</td>
                  <td className="admin__comment">{rv.comment || '—'}</td>
                  <td>
                    <span className={`admin__badge admin__badge--${rv.status}`}>{rv.status}</span>
                  </td>
                  <td className="admin__actions">
                    {rv.status !== 'approved' && (
                      <button disabled={busyId === rv._id} onClick={() => setReviewStatus(rv, 'approved')}>Approve</button>
                    )}
                    {rv.status !== 'rejected' && (
                      <button disabled={busyId === rv._id} onClick={() => setReviewStatus(rv, 'rejected')}>Reject</button>
                    )}
                    <button disabled={busyId === rv._id} className="admin__danger" onClick={() => deleteReview(rv)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.filter(rv => reviewFilter === 'all' || rv.status === reviewFilter).length === 0 && (
                <tr><td colSpan="6" className="admin__empty">No {reviewFilter === 'all' ? '' : reviewFilter} reviews.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
