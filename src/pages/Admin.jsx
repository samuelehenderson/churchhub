import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChurches } from '../hooks/useChurches.js';
import { useAuth, useEditableChurchIds, useIsChurchAdmin } from '../hooks/useAuth.js';
import { updateChurch } from '../data/store.js';
import { parseStreamUrl, describeStrategy } from '../data/streams.js';
import { isYouTubeApiConfigured } from '../data/youtube.js';
import NewChurchForm from '../components/NewChurchForm.jsx';
import YouTubeChannelInput from '../components/YouTubeChannelInput.jsx';
import ChurchMembersPanel from '../components/ChurchMembersPanel.jsx';
import DeleteChurchDialog from '../components/DeleteChurchDialog.jsx';
import SocialsEditor from '../components/SocialsEditor.jsx';
import { normalizeSocialUrl } from '../data/socials.jsx';
import { IconChurch, IconPlay, IconMail } from '../components/Icons.jsx';

const baseSections = [
  { key: 'profile', label: 'Profile' },
  { key: 'times', label: 'Service times' },
  { key: 'stream', label: 'Livestream' },
  { key: 'sermons', label: 'Sermons' },
  { key: 'ministries', label: 'Ministries' },
  { key: 'socials', label: 'Social media' },
  { key: 'engage', label: 'Engagement buttons' },
  { key: 'contact', label: 'Contact info' }
];

// The four canonical engagement buttons that appear on every profile.
// Add a fifth here later if needed — both admin form + Profile read from
// this list, so adding a new entry is the only change needed.
const ENGAGEMENT_BUTTONS = [
  {
    key: 'prayer',
    label: 'Request prayer',
    helper: 'Where visitors can submit a prayer request — your form, contact email, or a Tally / Google Form link.'
  },
  {
    key: 'visitor',
    label: "I'm new here",
    helper: "Page introducing your church to first-time visitors (e.g. /im-new)."
  },
  {
    key: 'visit',
    label: 'Plan a visit',
    helper: 'Form or page where someone can let you know they\'re coming to a service.'
  },
  {
    key: 'community',
    label: 'Join online community',
    helper: 'Discord, Slack, Facebook group, app — wherever your online community lives.'
  }
];

// Build a flat form object from a church record.
function churchToForm(c) {
  const channelInput = c.youtubeChannelOriginalUrl || c.liveChannelUrl || '';
  // Filter out the legacy '#' placeholder values from seed data.
  const cleanSocials = Object.fromEntries(
    Object.entries(c.socials || {}).filter(([, v]) => v && v !== '#')
  );
  return {
    name: c.name,
    description: c.description,
    address: c.address,
    lat: c.lat != null ? String(c.lat) : '',
    lng: c.lng != null ? String(c.lng) : '',
    times: c.serviceTimes.join('\n'),
    liveChannelUrl: channelInput,
    livestream: c.livestreamUrl,
    isLive: !!c.isLive,
    liveTitle: c.liveTitle || '',
    sermons: c.sermonVideos.map((s) => `${s.title} | ${s.date} | ${s.url}`).join('\n'),
    ministries: c.ministries.join(', '),
    socials: cleanSocials,
    engagementLinks: { ...(c.engagementLinks || {}) },
    phone: c.contact.phone,
    email: c.contact.email,
    website: c.website
  };
}

function existingResolved(c) {
  if (!c.youtubeChannelId) return null;
  return {
    ok: true,
    channelId: c.youtubeChannelId,
    channelTitle: c.youtubeChannelTitle || null,
    channelThumbnail: c.youtubeChannelThumbnail || null,
    embedUrl: c.liveChannelUrl,
    originalUrl: c.youtubeChannelOriginalUrl || c.liveChannelUrl,
    resolvedFrom: 'channelId'
  };
}

function formToPatch(form, resolvedYouTube) {
  const fallback = form.livestream.trim();
  const fallbackParsed = fallback ? parseStreamUrl(fallback) : null;

  const liveChannelUrl = resolvedYouTube?.embedUrl
    ? resolvedYouTube.embedUrl
    : form.liveChannelUrl.trim();

  const latNum = form.lat ? parseFloat(form.lat) : null;
  const lngNum = form.lng ? parseFloat(form.lng) : null;
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    address: form.address.trim(),
    lat: Number.isFinite(latNum) ? latNum : null,
    lng: Number.isFinite(lngNum) ? lngNum : null,
    serviceTimes: form.times.split('\n').map((s) => s.trim()).filter(Boolean),
    liveChannelUrl,
    youtubeChannelId: resolvedYouTube?.channelId || null,
    youtubeChannelTitle: resolvedYouTube?.channelTitle || null,
    youtubeChannelThumbnail: resolvedYouTube?.channelThumbnail || null,
    youtubeChannelOriginalUrl: resolvedYouTube?.originalUrl || form.liveChannelUrl.trim() || null,
    livestreamUrl: fallbackParsed?.embedUrl || fallback,
    isLive: !!form.isLive,
    liveTitle: form.liveTitle.trim(),
    sermonVideos: form.sermons
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title = '', date = '', url = ''] = line.split('|').map((p) => p.trim());
        const embedded = parseStreamUrl(url);
        return { title, date, url: embedded.embedUrl || url };
      }),
    ministries: form.ministries.split(',').map((m) => m.trim()).filter(Boolean),
    socials: cleanSocials(form.socials),
    engagementLinks: cleanLinks(form.engagementLinks),
    contact: { phone: form.phone.trim(), email: form.email.trim() },
    website: form.website.trim()
  };
}

// Trim each URL and drop empties. Bare strings without https:// get the
// scheme prepended so the link actually opens.
function cleanLinks(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    const trimmed = (v || '').trim();
    if (!trimmed) continue;
    out[k] = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
  return out;
}

// Drop empty entries and normalize each URL (add https://, etc.).
function cleanSocials(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    const url = normalizeSocialUrl(k, v);
    if (url) out[k] = url;
  }
  return out;
}

export default function Admin() {
  const { status, isSuperAdmin } = useAuth();
  const allChurches = useChurches();
  const { all: canSeeAll, ids: editableIds } = useEditableChurchIds();

  // Filter to churches the current user can edit. Super admin sees everything.
  const editableChurches = useMemo(() => {
    if (canSeeAll) return allChurches;
    return allChurches.filter((c) => editableIds?.has(c.id));
  }, [allChurches, canSeeAll, editableIds]);

  const [selectedId, setSelectedId] = useState(editableChurches[0]?.id);
  const [section, setSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // When the editable list changes (sign-in, invites claimed, deletes), keep
  // the selection valid.
  useEffect(() => {
    if (!editableChurches.length) {
      setSelectedId(undefined);
      return;
    }
    if (!editableChurches.find((c) => c.id === selectedId)) {
      setSelectedId(editableChurches[0].id);
    }
  }, [editableChurches]); // eslint-disable-line react-hooks/exhaustive-deps

  const church = editableChurches.find((c) => c.id === selectedId) || editableChurches[0];
  const isChurchAdmin = useIsChurchAdmin(church?.id);

  const sections = useMemo(() => {
    if (!church) return baseSections;
    return isChurchAdmin
      ? [...baseSections, { key: 'members', label: 'Members' }]
      : baseSections;
  }, [church, isChurchAdmin]);

  const [form, setForm] = useState(() => (church ? churchToForm(church) : null));
  const [resolvedYouTube, setResolvedYouTube] = useState(() =>
    church ? existingResolved(church) : null
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState(null);

  const onGeocode = async () => {
    if (!form) return;
    const query = form.address?.trim() || `${church?.city || ''}, ${church?.state || ''}`.trim().replace(/^,\s*/, '');
    if (!query || query === ',') {
      setGeocodeMsg('Enter an address first.');
      return;
    }
    setGeocoding(true);
    setGeocodeMsg(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        const { lat, lon } = json[0];
        setForm((f) => ({ ...f, lat: String(lat), lng: String(lon) }));
        setGeocodeMsg(`Found: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`);
      } else {
        setGeocodeMsg('No match — try a more specific address.');
      }
    } catch {
      setGeocodeMsg('Lookup failed — check your connection and try again.');
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (church) {
      setForm(churchToForm(church));
      setResolvedYouTube(existingResolved(church));
    } else {
      setForm(null);
      setResolvedYouTube(null);
    }
    setSaved(false);
    setSaveError(null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    if (!church) return;
    setSubmitting(true);
    setSaveError(null);
    const { error } = await updateChurch(church.id, formToPatch(form, resolvedYouTube));
    setSubmitting(false);
    if (error) {
      setSaveError(error.message || 'Save failed.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  // ----- gating -----

  if (status === 'loading') {
    return (
      <div className="page fade-in">
        <p style={{ color: 'var(--ink-muted)', textAlign: 'center', marginTop: 40 }}>
          Loading…
        </p>
      </div>
    );
  }

  if (status === 'signed-out') {
    return (
      <div className="page fade-in" style={{ maxWidth: 460, margin: '0 auto' }}>
        <div className="card admin-form">
          <h2 style={{ marginBottom: 6 }}>Admin sign-in required</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>
            Church admins manage their profile, livestream, sermons, and team
            from here. Sign in to continue.
          </p>
          <Link to="/auth/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Signed in but no churches editable AND not super admin.
  if (editableChurches.length === 0 && !isSuperAdmin) {
    return (
      <div className="page fade-in" style={{ maxWidth: 540, margin: '0 auto' }}>
        <div className="card admin-form">
          <h2 style={{ marginBottom: 6 }}>You're signed in</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            You don't have edit access to any churches yet. Ask the church
            owner to add you, then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>Church admin</h2>
        {isSuperAdmin && !creating && (
          <button className="btn btn-gold btn-sm" onClick={() => setCreating(true)}>
            + Add new church
          </button>
        )}
      </div>

      {isSuperAdmin && creating && (
        <div style={{ marginBottom: 24 }}>
          <NewChurchForm
            onCreated={(c) => {
              setCreating(false);
              if (c?.id) setSelectedId(c.id);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {church && (
        <>
          <div className="filter-bar" style={{ marginBottom: 18 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Editing church</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {editableChurches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.city}, {c.state}
                  </option>
                ))}
              </select>
            </div>
            {isSuperAdmin && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleting(true)}
                style={{ color: 'var(--rose)', alignSelf: 'flex-end' }}
              >
                Delete this church
              </button>
            )}
          </div>

          <div className="admin-grid">
            <aside className="admin-side">
              {sections.map((s) => (
                <button
                  key={s.key}
                  className={s.key === section ? 'active' : ''}
                  onClick={() => setSection(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </aside>

            {section === 'members' ? (
              <div className="card admin-form">
                <ChurchMembersPanel churchId={church.id} churchName={church.name} />
              </div>
            ) : (
              <form className="card admin-form" onSubmit={onSave}>
                {saved && (
                  <div
                    className="banner"
                    style={{
                      background: '#e9f3ec',
                      borderColor: '#bcd9c2',
                      color: '#3d5a3d',
                      marginBottom: 0
                    }}
                  >
                    Saved. Visit <strong>Home</strong>, <strong>Churches</strong>,
                    or this church's profile to see the change.
                  </div>
                )}
                {saveError && (
                  <div
                    className="banner"
                    style={{
                      background: '#fbecdb',
                      borderColor: '#e6c89a',
                      color: '#8a6a1f',
                      marginBottom: 0
                    }}
                  >
                    {saveError}
                  </div>
                )}

                {section === 'profile' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Profile
                    </h3>
                    <div className="field">
                      <label>Church name</label>
                      <input name="name" value={form.name} onChange={onChange} />
                    </div>
                    <div className="field">
                      <label>Address</label>
                      <input name="address" value={form.address} onChange={onChange} />
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 14, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={onGeocode}
                        disabled={geocoding}
                        className="btn btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                      >
                        {geocoding ? 'Looking up…' : 'Look up coordinates from address'}
                      </button>
                      {geocodeMsg && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{geocodeMsg}</span>
                      )}
                    </div>
                    <div className="field">
                      <label>About</label>
                      <textarea name="description" value={form.description} onChange={onChange} />
                    </div>
                  </>
                )}

                {section === 'times' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Service times
                    </h3>
                    <div className="field">
                      <label>One per line (e.g. "Sun 9:00 AM")</label>
                      <textarea name="times" value={form.times} onChange={onChange} />
                    </div>
                  </>
                )}

                {section === 'stream' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Livestream
                    </h3>

                    <YouTubeChannelInput
                      label={
                        <>
                          Auto-live channel URL{' '}
                          <span style={{ color: 'var(--gold-deep)', textTransform: 'none', letterSpacing: 0 }}>
                            (recommended)
                          </span>
                        </>
                      }
                      value={form.liveChannelUrl}
                      onChange={(v) => setForm((f) => ({ ...f, liveChannelUrl: v }))}
                      resolved={resolvedYouTube}
                      onResolved={setResolvedYouTube}
                      onCleared={() => setResolvedYouTube(null)}
                    />
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: -8, marginBottom: 14 }}>
                      {isYouTubeApiConfigured
                        ? 'Paste any YouTube channel link (/@handle, /channel/UC…, /c/, /user/) or a vimeo.com/event URL.'
                        : 'Paste a YouTube /channel/UC… URL or a vimeo.com/event URL. (For /@handle, /c/, /user/ URLs, set VITE_YOUTUBE_API_KEY in Vercel.)'}
                    </p>
                    {form.liveChannelUrl && !/youtube\.com|youtu\.be/i.test(form.liveChannelUrl) && (
                      <StreamHint url={form.liveChannelUrl} expected="auto" />
                    )}

                    <div className="field">
                      <label>
                        Fallback video{' '}
                        <span style={{ color: 'var(--ink-muted)', textTransform: 'none', letterSpacing: 0 }}>
                          (shown when not live)
                        </span>
                      </label>
                      <input
                        name="livestream"
                        value={form.livestream}
                        onChange={onChange}
                        placeholder="https://www.youtube.com/watch?v=... (latest sermon, welcome video)"
                      />
                      <StreamHint url={form.livestream} expected="video" />
                    </div>

                    <div className="field">
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          textTransform: 'none',
                          letterSpacing: 0,
                          fontWeight: 500
                        }}
                      >
                        <input
                          type="checkbox"
                          name="isLive"
                          checked={form.isLive}
                          onChange={(e) => setForm({ ...form, isLive: e.target.checked })}
                          style={{ width: 18, height: 18 }}
                        />
                        Mark this church as live right now
                      </label>
                      <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                        Manually toggles the "Live" badge and feature placement.
                        With the YouTube API key set, the embed also auto-detects
                        live status and shows a "Live Now" badge on the player.
                      </p>
                    </div>

                    {form.isLive && (
                      <div className="field">
                        <label>Current sermon / stream title</label>
                        <input
                          name="liveTitle"
                          value={form.liveTitle}
                          onChange={onChange}
                          placeholder="Sunday Morning — Anchored in Hope"
                        />
                      </div>
                    )}
                  </>
                )}

                {section === 'sermons' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Sermon videos
                    </h3>
                    <div className="field">
                      <label>
                        One per line: <code>Title | Date | URL</code>
                      </label>
                      <textarea
                        name="sermons"
                        value={form.sermons}
                        onChange={onChange}
                        style={{ minHeight: 160 }}
                      />
                    </div>
                  </>
                )}

                {section === 'ministries' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Ministries
                    </h3>
                    <div className="field">
                      <label>Comma-separated tags</label>
                      <input name="ministries" value={form.ministries} onChange={onChange} />
                    </div>
                  </>
                )}

                {section === 'socials' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Social media
                    </h3>
                    <SocialsEditor
                      value={form.socials}
                      onChange={(next) => setForm((f) => ({ ...f, socials: next }))}
                    />
                  </>
                )}

                {section === 'engage' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Engagement buttons
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
                      These four buttons appear at the bottom of your church
                      profile page. Set a URL for each one you want to use —
                      blank fields are hidden automatically.
                    </p>
                    {ENGAGEMENT_BUTTONS.map((b) => (
                      <div className="field" key={b.key}>
                        <label>{b.label}</label>
                        <input
                          type="url"
                          value={form.engagementLinks?.[b.key] || ''}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              engagementLinks: {
                                ...(f.engagementLinks || {}),
                                [b.key]: e.target.value
                              }
                            }))
                          }
                          placeholder="https://..."
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                          {b.helper}
                        </p>
                      </div>
                    ))}
                  </>
                )}

                {section === 'contact' && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                      Contact info
                    </h3>
                    <div className="field">
                      <label>Phone</label>
                      <input name="phone" value={form.phone} onChange={onChange} />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input name="email" type="email" value={form.email} onChange={onChange} />
                    </div>
                    <div className="field">
                      <label>Website</label>
                      <input name="website" value={form.website} onChange={onChange} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setForm(churchToForm(church))}
                    disabled={submitting}
                  >
                    Discard unsaved
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {deleting && church && (
        <DeleteChurchDialog
          church={church}
          onClose={() => setDeleting(false)}
          onDeleted={() => {
            setDeleting(false);
            setSelectedId(undefined);
          }}
        />
      )}

      <div className="divider" />

      <div className="section-head" style={{ marginTop: 0 }}>
        <h2 style={{ fontStyle: 'italic', fontWeight: 400 }}>Help</h2>
      </div>
      <div className="church-grid">
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <IconChurch />
          <div>
            <h4 style={{ marginBottom: 4 }}>Not listed yet?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              Reach out to the ChurchHub owner — they can add your church and
              invite you as an admin.
            </p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <IconPlay />
          <div>
            <h4 style={{ marginBottom: 4 }}>Already listed?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              Your church owner can invite you with the email you'd like to
              sign in with — you'll get a one-tap email to set your password.
            </p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <IconMail />
          <div>
            <h4 style={{ marginBottom: 4 }}>Need help?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              Email{' '}
              <a href="mailto:churches@churchhub.example">
                churches@churchhub.example
              </a>{' '}
              and our team will walk you through setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline hint that parses the URL the user is typing and tells them what
// strategy ChurchHub will use for it.
function StreamHint({ url, expected }) {
  if (!url || !url.trim()) return null;
  const parsed = parseStreamUrl(url);

  const tone =
    parsed.strategy === 'unknown'
      ? 'warn'
      : (expected === 'auto' && !parsed.autoLive) ||
        (expected === 'video' && parsed.autoLive)
      ? 'info'
      : 'good';

  const colors = {
    good: { bg: '#e9f3ec', bd: '#bcd9c2', fg: '#3d5a3d' },
    info: { bg: '#eaf2f6', bd: '#bcd0db', fg: '#1a3a52' },
    warn: { bg: '#fbecdb', bd: '#e6c89a', fg: '#8a6a1f' }
  }[tone];

  return (
    <div
      style={{
        marginTop: 8,
        padding: '8px 12px',
        background: colors.bg,
        border: `1px solid ${colors.bd}`,
        color: colors.fg,
        borderRadius: 8,
        fontSize: '0.82rem',
        lineHeight: 1.45
      }}
    >
      <strong style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
        {parsed.strategy.replace(/-/g, ' ')}
      </strong>
      <div>{describeStrategy(parsed.strategy)}</div>
      {parsed.warning && <div style={{ marginTop: 4 }}>{parsed.warning}</div>}
    </div>
  );
}
