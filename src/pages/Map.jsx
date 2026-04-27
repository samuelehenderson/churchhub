import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChurches } from '../hooks/useChurches.js';
import ChurchCard from '../components/ChurchCard.jsx';
import { IconPin } from '../components/Icons.jsx';

// Project lat/lng to a 0–100% box covering the continental US (rough).
const BOUNDS = { latMin: 24, latMax: 50, lngMin: -125, lngMax: -66 };
function project({ lat, lng }) {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
  const y = ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(4, Math.min(96, y)) };
}

export default function Map() {
  const churches = useChurches();
  const [selected, setSelected] = useState(null);
  const placeable = churches.filter((c) => c.state !== 'US'); // skip the online-only one

  return (
    <div className="page fade-in">
      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>Map</h2>
        <span className="link" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {placeable.length} pins
        </span>
      </div>

      <div className="banner">
        <strong>Map integration coming soon.</strong> This preview shows pin placement only.
        Real interactive maps via Google Maps or Mapbox are wired in later.
      </div>

      <div className="big-map" role="img" aria-label="Map of churches">
        {placeable.map((c) => {
          const { x, y } = project(c);
          return (
            <button
              key={c.id}
              className="pin"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => setSelected(c)}
              aria-label={c.name}
            >
              <span className="dot" />
              <span className="label">{c.name}</span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div style={{ marginTop: 18 }}>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2 style={{ fontStyle: 'italic', fontWeight: 400 }}>{selected.name}</h2>
            <button className="btn-link" onClick={() => setSelected(null)}>Clear</button>
          </div>
          <div className="church-grid">
            <ChurchCard church={selected} />
          </div>
        </div>
      ) : (
        <>
          <div className="section-head">
            <h2 style={{ fontStyle: 'italic', fontWeight: 400 }}>All locations</h2>
          </div>
          <div className="church-grid">
            {churches.map((c) => (
              <ChurchCard key={c.id} church={c} showTimes={false} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
