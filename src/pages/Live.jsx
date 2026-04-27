import React from 'react';
import { useChurches } from '../hooks/useChurches.js';
import LiveCard from '../components/LiveCard.jsx';
import ChurchCard from '../components/ChurchCard.jsx';

export default function Live() {
  const churches = useChurches();
  const live = churches.filter((c) => c.isLive);
  const upcoming = churches.filter((c) => !c.isLive && c.online).slice(0, 4);

  return (
    <div className="page fade-in">
      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>Live right now</h2>
        <span className="link" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {live.length} {live.length === 1 ? 'church' : 'churches'} streaming
        </span>
      </div>

      {live.length === 0 ? (
        <div className="empty">
          <h3>No churches live at the moment</h3>
          <p>Check back during a Sunday morning or weeknight service.</p>
        </div>
      ) : (
        <div className="church-grid">
          {live.map((c) => (
            <LiveCard key={c.id} church={c} />
          ))}
        </div>
      )}

      <div className="divider" />

      <div className="section-head">
        <h2>Streams online weekly</h2>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 18, fontSize: '0.95rem' }}>
        These churches don't broadcast right this minute, but they livestream every week.
      </p>
      <div className="church-grid">
        {upcoming.map((c) => (
          <ChurchCard key={c.id} church={c} />
        ))}
      </div>
    </div>
  );
}
