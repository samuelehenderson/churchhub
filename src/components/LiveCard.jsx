import React from 'react';
import { Link } from 'react-router-dom';
import { IconPlay } from './Icons.jsx';

export default function LiveCard({ church }) {
  return (
    <Link to={`/church/${church.id}`} className="card church-card live-card fade-in">
      <div className="live-thumb" style={{ background: `linear-gradient(135deg, ${church.logoColor}, var(--navy-deep))` }}>
        <span className="tag tag-live">Live</span>
        <IconPlay />
      </div>

      <div className="church-card-head" style={{ alignItems: 'flex-start' }}>
        <div className="church-meta">
          <span className="church-name">{church.name}</span>
          <span className="church-loc">{church.city}, {church.state} · {church.denomination}</span>
        </div>
      </div>

      {church.liveTitle && (
        <p className="church-desc" style={{ fontStyle: 'italic', color: 'var(--ink)' }}>
          “{church.liveTitle}”
        </p>
      )}

      <div className="tag-row">
        {church.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

      <span className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
        <IconPlay width="14" height="14" /> Watch live
      </span>
    </Link>
  );
}
