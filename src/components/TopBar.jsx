import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { signOut } from '../data/auth.js';

export default function TopBar() {
  const { status, user, isSuperAdmin, memberships } = useAuth();
  const signedIn = status === 'signed-in';

  return (
    <header className="top-bar">
      <Link to="/" className="brand" aria-label="ChurchHub home">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v6M9 6h6M5 21V11l7-3 7 3v10M10 21v-5h4v5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Church<em>Hub</em>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {signedIn ? (
          <AccountMenu
            email={user?.email}
            isSuperAdmin={isSuperAdmin}
            membershipCount={memberships.length}
          />
        ) : (
          <Link to="/auth/login" className="top-bar-cta">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function AccountMenu({ email, isSuperAdmin, membershipCount }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  const onSignOut = async () => {
    await signOut();
    setOpen(false);
    window.location.href = '/';
  };

  const initial = (email?.[0] || '?').toUpperCase();
  const label = isSuperAdmin
    ? 'Owner'
    : membershipCount > 0
    ? 'Admin'
    : 'Account';

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="account-avatar" aria-hidden>{initial}</span>
        <span className="account-label">{label}</span>
      </button>
      {open && (
        <div className="account-pop" role="menu">
          <div className="account-pop-email">{email}</div>
          <Link
            to="/admin"
            className="account-pop-item"
            onClick={() => setOpen(false)}
          >
            Admin dashboard
          </Link>
          <button
            type="button"
            className="account-pop-item danger"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
