import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ mode: initialMode = 'login', onClose }) {
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setForm({ name: '', email: '', password: '' });
    setShowForgot(false);
    setForgotSent(false);
  }, [initialMode]);

  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      login(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="auth-modal">
          <button className="auth-modal__close" onClick={onClose} aria-label="Close">✕</button>
          <div className="auth-modal__header">
            <p className="eyebrow auth-modal__eyebrow">Saffron &amp; Stove</p>
            <h2 className="auth-modal__title">Forgot password?</h2>
            <p className="auth-modal__sub">Enter your email and we'll send a reset link.</p>
          </div>
          {forgotSent ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p style={{ fontSize: '2rem' }}>📬</p>
              <p style={{ fontWeight: 600, margin: '0.5rem 0' }}>Check your inbox!</p>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                If <strong>{forgotEmail}</strong> is registered, a reset link is on its way.
              </p>
              <button
                className="auth-modal__switch-btn"
                style={{ marginTop: '1rem' }}
                onClick={() => { setShowForgot(false); setForgotSent(false); }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form className="auth-modal__form" onSubmit={handleForgot}>
              <div className="auth-modal__field">
                <label className="auth-modal__label eyebrow">Email</label>
                <input
                  className="auth-modal__input"
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button className="auth-modal__submit" type="submit" disabled={forgotLoading}>
                {forgotLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="auth-modal__switch" style={{ marginTop: '1rem' }}>
                <button className="auth-modal__switch-btn" onClick={() => setShowForgot(false)}>
                  Back to Sign In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <div className="auth-modal__header">
          <p className="eyebrow auth-modal__eyebrow">Saffron &amp; Stove</p>
          <h2 className="auth-modal__title">
            {mode === 'login' ? 'Welcome back.' : 'Join the table.'}
          </h2>
          <p className="auth-modal__sub">
            {mode === 'login'
              ? 'Sign in to access your saved recipes.'
              : 'Create an account to save your favourite recipes.'}
          </p>
        </div>
        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label eyebrow">Full Name</label>
              <input
                className="auth-modal__input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                autoFocus
              />
            </div>
          )}
          <div className="auth-modal__field">
            <label className="auth-modal__label eyebrow">Email</label>
            <input
              className="auth-modal__input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoFocus={mode === 'login'}
            />
          </div>
          <div className="auth-modal__field">
            <label className="auth-modal__label eyebrow">Password</label>
            <input
              className="auth-modal__input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              required
            />
            {mode === 'login' && (
              <button
                type="button"
                className="auth-modal__forgot"
                onClick={() => { setShowForgot(true); setError(''); }}
              >
                Forgot password?
              </button>
            )}
          </div>
          {error && <p className="auth-modal__error">{error}</p>}
          <button className="auth-modal__submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="auth-modal__switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="auth-modal__switch-btn"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Join' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}