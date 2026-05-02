import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../data/auth.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setSubmitting(true);
    const { error: err } = await sendPasswordReset(email);
    setSubmitting(false);
    if (err) {
      setError(err.message || 'Could not send reset email.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card admin-form">
        <h2 style={{ marginBottom: 6 }}>Reset password</h2>

        {sent ? (
          <>
            <div
              className="banner"
              style={{
                background: '#e9f3ec',
                borderColor: '#bcd9c2',
                color: '#3d5a3d',
                marginBottom: 14
              }}
            >
              Check your inbox at <strong>{email}</strong>. Click the link in
              the email to set a new password.
            </div>
            <Link to="/auth/login" className="btn-link">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
              Enter the email you sign in with and we'll send you a link to
              choose a new password.
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
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
                <Link to="/auth/login" className="btn-link">
                  Back to sign in
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
