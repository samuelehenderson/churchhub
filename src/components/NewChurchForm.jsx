import React, { useState } from 'react';
import { createChurch } from '../data/store.js';
import { parseStreamUrl } from '../data/streams.js';
import { isYouTubeApiConfigured } from '../data/youtube.js';
import YouTubeChannelInput from './YouTubeChannelInput.jsx';

const blank = {
  id: '',
  name: '',
  city: '',
  state: '',
  denomination: '',
  size: 'medium',
  description: '',
  address: '',
  lat: '',
  lng: '',
  serviceTimes: '',          // newline-separated in form, array on save
  online: true,
  liveChannelUrl: '',
  livestreamUrl: '',
  sermonVideos: '',          // "Title | Date | URL" per line
  tags: '',                  // comma-separated
  ministries: '',            // comma-separated
  phone: '',
  email: '',
  website: '',
  logoColor: '#1a3a52'
};

const colorChoices = [
  { name: 'Navy', value: '#1a3a52' },
  { name: 'Blue', value: '#2d6a8a' },
  { name: 'Teal', value: '#0e7c7b' },
  { name: 'Sage', value: '#7a8d5a' },
  { name: 'Forest', value: '#3d5a3d' },
  { name: 'Brown', value: '#6b3e2e' },
  { name: 'Orange', value: '#c87533' },
  { name: 'Gold', value: '#d4a857' }
];

// Generate a URL-safe slug from a church name + city.
function slugify(name, city) {
  const base = `${name} ${city}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.slice(0, 60);
}

export default function NewChurchForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedYouTube, setResolvedYouTube] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  // Auto-fill the slug as the user types name/city, but only if they haven't
  // edited the slug field manually.
  const onNameOrCityBlur = () => {
    if (!form.id && form.name && form.city) {
      setForm((f) => ({ ...f, id: slugify(f.name, f.city) }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) {
      setError('Name, city, and state are required.');
      return;
    }

    const id = form.id.trim() || slugify(form.name, form.city);

    // Normalize the streaming URLs through the parser.
    const fallback = form.livestreamUrl.trim();
    const fallbackParsed = fallback ? parseStreamUrl(fallback) : null;

    // If the YouTube channel resolved successfully, persist the canonical
    // channel ID + permanent live embed URL so the church profile can show
    // future live streams automatically without any further admin action.
    const liveChannelUrl = resolvedYouTube?.embedUrl
      ? resolvedYouTube.embedUrl
      : form.liveChannelUrl.trim() || null;

    const church = {
      id,
      name: form.name.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      denomination: form.denomination.trim() || null,
      size: form.size,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      serviceTimes: form.serviceTimes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      online: !!form.online,
      isLive: false,
      liveTitle: null,
      liveChannelUrl,
      youtubeChannelId: resolvedYouTube?.channelId || null,
      youtubeChannelTitle: resolvedYouTube?.channelTitle || null,
      youtubeChannelThumbnail: resolvedYouTube?.channelThumbnail || null,
      youtubeChannelOriginalUrl: resolvedYouTube?.originalUrl || form.liveChannelUrl.trim() || null,
      livestreamUrl: fallbackParsed?.embedUrl || fallback || null,
      sermonVideos: form.sermonVideos
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [title = '', date = '', url = ''] = line.split('|').map((p) => p.trim());
          const e = parseStreamUrl(url);
          return { title, date, url: e.embedUrl || url };
        }),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      ministries: form.ministries.split(',').map((m) => m.trim()).filter(Boolean),
      contact: { phone: form.phone.trim(), email: form.email.trim() },
      website: form.website.trim() || null,
      socials: {},
      logoColor: form.logoColor
    };

    setSubmitting(true);
    const { data, error: dbError } = await createChurch(church);
    setSubmitting(false);

    if (dbError) {
      setError(dbError.message || 'Could not save. Please try again.');
      return;
    }

    onCreated?.(data);
  };

  return (
    <form className="card admin-form" onSubmit={onSubmit}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
        Add a new church
      </h3>

      {error && (
        <div className="banner" style={{ background: '#fbecdb', borderColor: '#e6c89a', color: '#8a6a1f', marginBottom: 0 }}>
          {error}
        </div>
      )}

      <div className="field">
        <label>Church name *</label>
        <input name="name" value={form.name} onChange={onChange} onBlur={onNameOrCityBlur} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="field">
          <label>City *</label>
          <input name="city" value={form.city} onChange={onChange} onBlur={onNameOrCityBlur} required />
        </div>
        <div className="field">
          <label>State *</label>
          <input name="state" value={form.state} onChange={onChange} placeholder="FL" maxLength={2} required />
        </div>
      </div>

      <div className="field">
        <label>URL slug (auto-generated from name + city)</label>
        <input name="id" value={form.id} onChange={onChange} placeholder="first-baptist-ocala" />
      </div>

      <div className="field">
        <label>Denomination</label>
        <input name="denomination" value={form.denomination} onChange={onChange} placeholder="Baptist, Methodist, Non-denominational, etc." />
      </div>

      <div className="field">
        <label>Size</label>
        <select name="size" value={form.size} onChange={onChange}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="field">
        <label>About (1–2 sentences)</label>
        <textarea name="description" value={form.description} onChange={onChange} />
      </div>

      <div className="field">
        <label>Full address</label>
        <input name="address" value={form.address} onChange={onChange} placeholder="1450 Harbor Way, Seattle, WA 98101" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Latitude</label>
          <input name="lat" value={form.lat} onChange={onChange} placeholder="29.1872" />
        </div>
        <div className="field">
          <label>Longitude</label>
          <input name="lng" value={form.lng} onChange={onChange} placeholder="-82.1401" />
        </div>
      </div>

      <div className="field">
        <label>Service times (one per line)</label>
        <textarea
          name="serviceTimes"
          value={form.serviceTimes}
          onChange={onChange}
          placeholder={'Sun 9:30 AM\nSun 11:00 AM\nWed 7:00 PM'}
        />
      </div>

      <YouTubeChannelInput
        label="YouTube channel URL (auto-live)"
        value={form.liveChannelUrl}
        onChange={(v) => setForm((f) => ({ ...f, liveChannelUrl: v }))}
        resolved={resolvedYouTube}
        onResolved={setResolvedYouTube}
        onCleared={() => setResolvedYouTube(null)}
      />
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: -8, marginBottom: 14 }}>
        {isYouTubeApiConfigured
          ? 'Paste a /channel/UC…, /@handle, /c/, or /user/ URL. We pin the channel ID so future live streams play automatically — no manual updates needed per service.'
          : 'Paste a /channel/UC… URL — that locks in a permanent live embed. (For /@handle, /c/, /user/ URLs, set VITE_YOUTUBE_API_KEY in Vercel.)'}
      </p>

      <div className="field">
        <label>Fallback video URL (latest sermon)</label>
        <input
          name="livestreamUrl"
          value={form.livestreamUrl}
          onChange={onChange}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <div className="field">
        <label>Tags (comma-separated)</label>
        <input
          name="tags"
          value={form.tags}
          onChange={onChange}
          placeholder="Modern Worship, Bible Teaching, Kids Ministry"
        />
      </div>

      <div className="field">
        <label>Ministries (comma-separated)</label>
        <input
          name="ministries"
          value={form.ministries}
          onChange={onChange}
          placeholder="Kids Ministry, Youth Ministry, Small Groups"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={onChange} />
        </div>
        <div className="field">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} />
        </div>
      </div>

      <div className="field">
        <label>Website</label>
        <input name="website" value={form.website} onChange={onChange} placeholder="https://..." />
      </div>

      <div className="field">
        <label>Logo color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {colorChoices.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setForm({ ...form, logoColor: c.value })}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: c.value,
                border: form.logoColor === c.value ? '3px solid var(--gold)' : '2px solid var(--line)',
                cursor: 'pointer'
              }}
              title={c.name}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add church'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
