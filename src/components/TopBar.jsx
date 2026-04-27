import React from 'react';
import { Link } from 'react-router-dom';

export default function TopBar() {
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
      <Link to="/admin" className="top-bar-cta">For churches</Link>
    </header>
  );
}
