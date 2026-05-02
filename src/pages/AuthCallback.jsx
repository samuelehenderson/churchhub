import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { updatePassword } from '../data/auth.js';

// Lands here after a magic-link sign-in (invite acceptance). The Supabase JS
// SDK has already exchanged the URL fragment for a session by the time this
// mounts. We then nudge the new user to set a password so they can sign in
// the regular way next time.
export default function AuthCallback() {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(false);

  // Wait briefly for the SDK to process the URL hash.
  const [grace, setGrace] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setGrace(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (skip && status === 'signed-in') {
      navigate('/admin', { replace: true });
    }
  }, [skip, status, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await updatePassword(password);
    setSubmitting(false);
    if (err) {
      setError(err.message || 'Could not set password.');
      return;
    }
    navigate('/admin', { replace: true });
  };

  if (!grace && status === 'signed-out') {
    return (
      <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
        <div className="card admin-form">
          <h2>Invite link expired</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            Ask the church owner to send you a new invite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card admin-form">
        <h2 style={{ marginBottom: 6 }}>Welcome to ChurchHub</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
          {user?.email && (
            <>
              You're signed in as <strong>{user.email}</strong>.{' '}
            </>
          )}
          Set a password so you can sign in directly next time.
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
            <label>Choose a password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Set password & continue'}
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => setSkip(true)}
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
