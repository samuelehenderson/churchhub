import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../data/auth.js';
import { useAuth } from '../hooks/useAuth.js';

// Lands here from the password-reset email link. Supabase has already
// established a recovery session by the time this mounts.
export default function ResetPassword() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Wait for the URL fragment to be processed by Supabase before complaining
  // about not being signed in.
  const [grace, setGrace] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setGrace(false), 1500);
    return () => clearTimeout(t);
  }, []);

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
      setError(err.message || 'Could not update password.');
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/admin', { replace: true }), 1200);
  };

  if (!grace && status === 'signed-out') {
    return (
      <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
        <div className="card admin-form">
          <h2>Reset link expired</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            Try sending yourself a new password reset email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card admin-form">
        <h2 style={{ marginBottom: 6 }}>Choose a new password</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
          At least 8 characters. Use whatever you like — long passphrases work
          best.
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

        {done ? (
          <div
            className="banner"
            style={{
              background: '#e9f3ec',
              borderColor: '#bcd9c2',
              color: '#3d5a3d'
            }}
          >
            Password updated. Redirecting to admin…
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
