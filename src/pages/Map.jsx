import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useChurches } from '../hooks/useChurches.js';
import ChurchCard from '../components/ChurchCard.jsx';
import { IconPin } from '../components/Icons.jsx';
import { buildPinIcon } from '../components/mapPin.js';

// Continental US center + zoom
const US_CENTER = [39.5, -98.35];
const US_ZOOM = 4;

// Some Postgres types come back from Supabase as strings; coerce safely.
function num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim()) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Helper component that gives us imperative access to the map instance
// (for "locate me" + flyTo on pin click). Calls back to parent with the ref.
function MapRefHandler({ onReady }) {
  const map = useMap();
  React.useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function Map() {
  const churches = useChurches();
  const [selected, setSelected] = useState(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);

  const withCoords = churches
    .map((c) => ({ ...c, lat: num(c.lat), lng: num(c.lng) }))
    .filter((c) => c.state !== 'US');
  const placeable = withCoords.filter((c) => c.lat !== null && c.lng !== null);
  const missingCoords = withCoords.length - placeable.length;

  const flyTo = (lat, lng, zoom = 11) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  const onPinClick = (church) => {
    setSelected(church);
    flyTo(church.lat, church.lng, 11);
  };

  const onLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyTo(pos.coords.latitude, pos.coords.longitude, 9);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <div className="page fade-in">
      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>Map</h2>
        <span className="link" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {placeable.length} {placeable.length === 1 ? 'church' : 'churches'}
          {missingCoords > 0 && ` · ${missingCoords} missing coordinates`}
        </span>
      </div>

      {missingCoords > 0 && (
        <div className="banner" style={{ marginBottom: 12 }}>
          <strong>{missingCoords}</strong> {missingCoords === 1 ? 'church is' : 'churches are'} hidden from the map because {missingCoords === 1 ? 'it has' : 'they have'} no coordinates.
          Open a church in <a href="/admin">Admin</a> and use <em>Look up coordinates</em> to fix.
        </div>
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '460px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)',
          background: 'var(--bg-tinted)',
        }}
      >
        <MapContainer
          center={US_CENTER}
          zoom={US_ZOOM}
          minZoom={3}
          maxZoom={16}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
          worldCopyJump
        >
          <MapRefHandler onReady={(m) => (mapRef.current = m)} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {placeable.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={buildPinIcon(selected?.id === c.id)}
              eventHandlers={{ click: () => onPinClick(c) }}
            />
          ))}
        </MapContainer>

        <button
          type="button"
          onClick={onLocateMe}
          aria-label="Locate me"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            background: 'var(--bg-elevated)',
            color: 'var(--navy-deep)',
            border: '1px solid var(--line-strong)',
            borderRadius: '999px',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            opacity: locating ? 0.6 : 1,
          }}
          disabled={locating}
        >
          <IconPin width="14" height="14" />
          {locating ? 'Locating…' : 'Locate me'}
        </button>
      </div>

      {selected ? (
        <div style={{ marginTop: 18 }}>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2 style={{ fontStyle: 'italic', fontWeight: 400 }}>{selected.name}</h2>
            <button className="btn-link" onClick={() => setSelected(null)}>
              Clear
            </button>
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
