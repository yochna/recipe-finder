import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <main className="reset">
      <div className="reset__box">
        <p className="reset__error">Invalid reset link.</p>
        <button className="reset__btn" onClick={() => navigate('/')}>Go Home</button>
      </div>
    </main>
  );

  if (done) return (
    <main className="reset">
      <div className="reset__box">
        <p style={{ fontSize: '2.5rem' }}>✅</p>
        <h2 className="reset__title">Password updated!</h2>
        <p className="reset__sub">You can now sign in with your new password.</p>
        <button className="reset__btn" onClick={() => navigate('/')}>Go to Home</button>
      </div>
    </main>
  );

  return (
    <main className="reset">
      <div className="reset__box">
        <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Saffron &amp; Stove</p>
        <h2 className="reset__title">Set new password</h2>
        <p className="reset__sub">Choose a strong password for your account.</p>
        <form className="reset__form" onSubmit={handleSubmit}>
          <div className="reset__field">
            <label className="reset__label eyebrow">New Password</label>
            <input
              className="reset__input"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="At least 6 characters"
              required
              autoFocus
            />
          </div>
          <div className="reset__field">
            <label className="reset__label eyebrow">Confirm Password</label>
            <input
              className="reset__input"
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              placeholder="Same password again"
              required
            />
          </div>
          {error && <p className="reset__error">{error}</p>}
          <button className="reset__btn" type="submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  );
}