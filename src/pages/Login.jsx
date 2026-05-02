import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithPassword } from '../data/auth.js';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from || '/admin';

  // If already signed in, bounce.
  if (status === 'signed-in') {
    navigate(redirectTo, { replace: true });
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (err) {
      setError(err.message || 'Could not sign in.');
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card admin-form">
        <h2 style={{ marginBottom: 6 }}>Sign in</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
          Church admins, sign in here to manage your church. New here? You'll
          get an invite email from your church owner.
        </p>

        {error && (
          <div
            className="banner"
            style={{
              background: '#fbecdb',
              borderColor: '#e6c89a',
              color: '#8a6a1f',
              marginBottom: 14
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <Link to="/auth/forgot" className="btn-link">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
