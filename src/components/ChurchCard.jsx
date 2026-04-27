import React from 'react';
import { Link } from 'react-router-dom';
import { IconPin, IconClock } from './Icons.jsx';

export default function ChurchCard({ church, showTimes = true }) {
  const initials = church.name
    .split(' ')
    .filter((w) => /[A-Za-z]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Link to={`/church/${church.id}`} className="card church-card fade-in">
      <div className="church-card-head">
        <div className="church-logo" style={{ background: church.logoColor }}>
          {initials}
        </div>
        <div className="church-meta">
          <span className="church-name">{church.name}</span>
          <span className="church-loc">
            {church.city}, {church.state} · {church.denomination}
          </span>
        </div>
      </div>

      <p className="church-desc">{church.description}</p>

      {showTimes && (
        <div className="church-times">
          <IconClock width="14" height="14" style={{ color: 'var(--ink-muted)' }} />
          {church.serviceTimes.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}

      <div className="tag-row">
        {church.isLive && <span className="tag tag-live">Live</span>}
        {church.online && <span className="tag tag-cool">Online</span>}
        {church.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
    </Link>
  );
}
