import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconSearch, IconLive, IconPin, IconSparkle, IconChurch } from '../components/Icons.jsx';

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

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

      {/* Mission — featured block */}
      <section
        className="fade-in"
        style={{
          marginTop: '32px',
          padding: '40px 32px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--cream) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200, 155, 60, 0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: '720px' }}>
          <div className="hero-eyebrow" style={{ marginBottom: '14px' }}>Our mission</div>
          <h2 style={{ fontStyle: 'italic', fontWeight: 400, marginBottom: '18px', lineHeight: 1.2 }}>
            Bringing the church together — <span style={{ color: 'var(--gold-deep)' }}>one place, many communities.</span>
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--ink-soft)', marginBottom: '14px' }}>
            ChurchHub exists to make the body of Christ more visible, more accessible,
            and more connected. We bring live worship, sermons, and local congregations
            into one place so finding a church — or staying close to one — feels simple.
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0 }}>
            Whether you're searching for a Sunday service to stream from home, looking for
            a community to visit nearby, or simply curious about a tradition you've never
            experienced, you're welcome here.
          </p>
        </div>
      </section>

      {/* Quick value-prop strip */}
      <div
        className="fade-in"
        style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {[
          { label: 'Free to use', sub: 'Always — no sign-up required to explore.' },
          { label: 'Across all 50 states', sub: 'Churches and communities from coast to coast.' },
          { label: 'Built to welcome', sub: 'Made for seekers, members, and the curious alike.' },
        ].map((v) => (
          <div
            key={v.label}
            style={{
              padding: '16px 18px',
              borderLeft: '3px solid var(--gold)',
              background: 'var(--bg-elevated)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--navy-deep)', marginBottom: '4px' }}>
              {v.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.45 }}>
              {v.sub}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="section-head" style={{ marginTop: '40px' }}>
        <h2>How ChurchHub works</h2>
      </div>
      <div className="church-grid">
        {[
          { num: '01', icon: IconSearch, title: 'Discover', to: '/churches', body: 'Browse our directory, filter by denomination or worship style, and read about each congregation in their own words.' },
          { num: '02', icon: IconLive, title: 'Watch', to: '/live', body: 'Tune into live services from anywhere, or catch up on recent sermons from churches across the country.' },
          { num: '03', icon: IconPin, title: 'Visit', to: '/map', body: 'Find churches near you on the map, see service times, and plan a visit to a community that feels like home.' },
          { num: '04', icon: IconSparkle, title: 'Match', to: '/quiz', body: 'Not sure where to start? Take our quick church match quiz and we’ll point you toward a fitting community.' },
        ].map(({ num, icon: Icon, title, to, body }) => (
          <Link
            key={num}
            to={to}
            className="card fade-in"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              padding: '22px',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '14px',
                right: '18px',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '1.4rem',
                color: 'var(--gold)',
                opacity: 0.7,
                letterSpacing: '0.02em',
              }}
            >
              {num}
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--cream)',
                color: 'var(--gold-deep)',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid var(--line)',
              }}
            >
              <Icon width="22" height="22" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{title}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                {body}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="divider" />

      {/* Closing CTA */}
      <section className="hero fade-in" style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="hero-eyebrow">Ready to begin?</div>
        <h2 style={{ fontStyle: 'italic', fontWeight: 400, marginBottom: '14px' }}>
          Come as you are.
        </h2>
        <p className="hero-sub" style={{ marginBottom: '20px' }}>
          Step in, look around, and find a place to belong.
        </p>
        <div className="hero-cta" style={{ justifyContent: 'center' }}>
          <Link to="/churches" className="btn btn-primary">
            <IconChurch width="16" height="16" /> Browse churches
          </Link>
          <Link to="/quiz" className="btn btn-gold">
            <IconSparkle width="16" height="16" /> Take the quiz
          </Link>
        </div>
      </section>
    </div>
  );
}
