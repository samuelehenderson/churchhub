import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChurches } from '../hooks/useChurches.js';
import LiveCard from '../components/LiveCard.jsx';
import { IconSearch, IconLive, IconPin, IconSparkle, IconPlay, IconChevron } from '../components/Icons.jsx';

export default function Home() {
  const navigate = useNavigate();
  const churches = useChurches();
  const [q, setQ] = useState('');

  const liveNow = useMemo(() => churches.filter((c) => c.isLive), [churches]);
  const recentSermons = useMemo(() => {
    return churches
      .flatMap((c) =>
        c.sermonVideos.map((s) => ({ ...s, church: c }))
      )
      .slice(0, 6);
  }, [churches]);

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/churches?q=${encodeURIComponent(q.trim())}`);
    else navigate('/churches');
  };

  return (
    <div className="page">
      <section className="hero fade-in">
        <div className="hero-eyebrow">Find a church · USA</div>
        <h1 className="hero-title">
          Find the right church for you — <em>online or nearby.</em>
        </h1>
        <p className="hero-sub">
          Live streams, sermon videos, and welcoming congregations across the country.
          One place to gather, watch, and connect.
        </p>

        <form className="search-wrap" onSubmit={onSearch} role="search">
          <IconSearch className="search-icon" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="search-input"
            placeholder="Search by church name, city, denomination, or worship style"
            aria-label="Search churches"
          />
        </form>

        <div className="hero-cta">
          <Link to="/live" className="btn btn-primary">
            <IconLive width="16" height="16" /> Watch live now
          </Link>
          <Link to="/map" className="btn btn-ghost">
            <IconPin width="16" height="16" /> Find churches near me
          </Link>
          <Link to="/quiz" className="btn btn-gold">
            <IconSparkle width="16" height="16" /> Take church match quiz
          </Link>
        </div>
      </section>

      {liveNow.length > 0 && (
        <>
          <div className="section-head">
            <h2>Featured live churches</h2>
            <Link to="/live" className="link">See all <IconChevron width="14" height="14" style={{ verticalAlign: 'middle' }} /></Link>
          </div>
          <div className="church-grid">
            {liveNow.slice(0, 3).map((c) => (
              <LiveCard key={c.id} church={c} />
            ))}
          </div>
        </>
      )}

      <div className="section-head">
        <h2>Recently added sermons</h2>
        <Link to="/churches" className="link">Browse churches <IconChevron width="14" height="14" style={{ verticalAlign: 'middle' }} /></Link>
      </div>
      <div className="sermon-row">
        {recentSermons.map((s, i) => (
          <Link
            key={`${s.church.id}-${i}`}
            to={`/church/${s.church.id}`}
            className="card sermon-card fade-in"
          >
            <div className="sermon-thumb"><IconPlay /></div>
            <div style={{ minWidth: 0 }}>
              <h4>{s.title}</h4>
              <div className="meta">{s.church.name} · {s.date}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="divider" />

      <div className="section-head">
        <h2>A few welcoming places</h2>
        <Link to="/churches" className="link">See directory <IconChevron width="14" height="14" style={{ verticalAlign: 'middle' }} /></Link>
      </div>
      <div className="church-grid">
        {churches.slice(0, 3).map((c) => (
          <Link
            key={c.id}
            to={`/church/${c.id}`}
            className="card church-card fade-in"
          >
            <div className="church-card-head">
              <div className="church-logo" style={{ background: c.logoColor }}>
                {c.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
              </div>
              <div className="church-meta">
                <span className="church-name">{c.name}</span>
                <span className="church-loc">{c.city}, {c.state}</span>
              </div>
            </div>
            <p className="church-desc">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
