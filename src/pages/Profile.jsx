import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useChurch } from '../hooks/useChurches.js';
import LiveEmbed from '../components/LiveEmbed.jsx';
import { getPlatform } from '../data/socials.jsx';
import {
  IconArrowLeft, IconPin, IconClock, IconPhone, IconMail, IconGlobe,
  IconHeart, IconHand, IconWave, IconUsers, IconPlay
} from '../components/Icons.jsx';

export default function Profile() {
  const { id } = useParams();
  const church = useChurch(id);

  if (!church) {
    return (
      <div className="page">
        <Link to="/churches" className="back-link"><IconArrowLeft width="16" height="16" /> Back to directory</Link>
        <div className="empty">
          <h3>Church not found</h3>
          <p>The church you're looking for isn't in our directory yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <Link to="/churches" className="back-link"><IconArrowLeft width="16" height="16" /> Back to directory</Link>

      <section className="profile-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div className="church-logo" style={{ background: church.logoColor, width: 56, height: 56, fontSize: '1.3rem', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            {church.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
          </div>
          <div>
            <span className="church-loc">{church.denomination}</span>
            <h1 style={{ marginTop: 2 }}>{church.name}</h1>
          </div>
        </div>
        <div className="church-loc" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.78)' }}>
          <IconPin width="14" height="14" style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {church.address}
        </div>
        <div className="tag-row">
          {church.isLive && <span className="tag tag-live">Live</span>}
          {church.online && <span className="tag tag-cool">Streams online</span>}
          {church.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
      </section>

      <div className="profile-grid">
        {/* MAIN COLUMN */}
        <div>
          <section className="profile-section card" style={{ marginBottom: 18 }}>
            <h3>{church.isLive ? 'Watching live' : 'Livestream'}</h3>
            <LiveEmbed church={church} autoplayWhenLive />
            {church.isLive && church.liveTitle && (
              <p style={{ marginTop: 12, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                “{church.liveTitle}”
              </p>
            )}
          </section>

          <section className="profile-section card" style={{ marginBottom: 18 }}>
            <h3>About</h3>
            <p style={{ color: 'var(--ink-soft)' }}>{church.description}</p>
          </section>

          <section className="profile-section" style={{ marginBottom: 18 }}>
            <h3>Recent sermons</h3>
            <div className="sermon-row">
              {church.sermonVideos.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card sermon-card"
                >
                  <div className="sermon-thumb"><IconPlay /></div>
                  <div style={{ minWidth: 0 }}>
                    <h4>{s.title}</h4>
                    <div className="meta">{s.date}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="profile-section card">
            <h3>Engage with this church</h3>
            <div className="engage-grid">
              <button className="engage-btn"><IconHeart /> Request prayer</button>
              <button className="engage-btn"><IconWave /> I'm new here</button>
              <button className="engage-btn"><IconHand /> Plan a visit</button>
              <button className="engage-btn"><IconUsers /> Join online community</button>
            </div>
          </section>
        </div>

        {/* SIDE COLUMN */}
        <aside>
          <section className="profile-section card" style={{ marginBottom: 18 }}>
            <h3>Service times</h3>
            <ul className="contact-list">
              {church.serviceTimes.map((t) => (
                <li key={t}><IconClock /> {t}</li>
              ))}
            </ul>
          </section>

          <section className="profile-section card" style={{ marginBottom: 18 }}>
            <h3>Location</h3>
            <div className="map-placeholder" style={{ aspectRatio: '4 / 3' }}>
              <div className="dot" style={{ position: 'static' }} />
              <div className="map-note">Map integration coming soon</div>
            </div>
            <p style={{ marginTop: 10, fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
              <IconPin width="14" height="14" style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {church.address}
            </p>
          </section>

          <section className="profile-section card" style={{ marginBottom: 18 }}>
            <h3>Ministries</h3>
            <div className="tag-row">
              {church.ministries.map((m) => <span key={m} className="tag">{m}</span>)}
            </div>
          </section>

          <section className="profile-section card">
            <h3>Contact</h3>
            <ul className="contact-list">
              <li><IconPhone /> {church.contact.phone}</li>
              <li><IconMail /> {church.contact.email}</li>
              <li><IconGlobe /> <a href={church.website} target="_blank" rel="noreferrer">{church.website.replace(/^https?:\/\//, '')}</a></li>
            </ul>
            <SocialLinks socials={church.socials} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function SocialLinks({ socials }) {
  // Hide '#' placeholder values from old seed data and any blanks.
  const entries = Object.entries(socials || {}).filter(
    ([, url]) => url && url !== '#'
  );
  if (entries.length === 0) return null;

  return (
    <div className="social-buttons" style={{ marginTop: 12 }}>
      {entries.map(([key, url]) => {
        const p = getPlatform(key);
        const Icon = p.icon;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="social-button"
            style={{ '--social-color': p.color }}
            aria-label={`${p.label} (opens in new tab)`}
            title={p.label}
          >
            <Icon />
            <span>{p.label}</span>
          </a>
        );
      })}
    </div>
  );
}
