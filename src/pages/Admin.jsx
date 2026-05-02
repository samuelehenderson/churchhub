import React, { useEffect, useState } from 'react';
import { useChurches } from '../hooks/useChurches.js';
import { updateChurch, resetChurch, resetAll } from '../data/store.js';
import { parseStreamUrl, describeStrategy } from '../data/streams.js';
import NewChurchForm from '../components/NewChurchForm.jsx';
import YouTubeChannelInput from '../components/YouTubeChannelInput.jsx';
import { IconChurch, IconPlay, IconMail } from '../components/Icons.jsx';

const sections = [
  { key: 'profile', label: 'Profile' },
  { key: 'times', label: 'Service times' },
  { key: 'stream', label: 'Livestream' },
  { key: 'sermons', label: 'Sermons' },
  { key: 'ministries', label: 'Ministries' },
  { key: 'contact', label: 'Contact info' }
];

// Build a flat form object from a church record.
function churchToForm(c) {
  // Show the friendliest version of the channel reference: prefer the
  // original URL the admin typed, fall back to the embed URL we stored.
  const channelInput = c.youtubeChannelOriginalUrl || c.liveChannelUrl || '';
  return {
    name: c.name,
    description: c.description,
    address: c.address,
    times: c.serviceTimes.join('\n'),
    liveChannelUrl: channelInput,
    livestream: c.livestreamUrl,
    isLive: !!c.isLive,
    liveTitle: c.liveTitle || '',
    sermons: c.sermonVideos.map((s) => `${s.title} | ${s.date} | ${s.url}`).join('\n'),
    ministries: c.ministries.join(', '),
    phone: c.contact.phone,
    email: c.contact.email,
    website: c.website
  };
}

// Pre-populate the resolved-channel preview from a saved church, so reopening
// admin shows the resolved metadata even before the user re-resolves.
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

// Convert form fields back into the structured church patch.
function formToPatch(form, resolvedYouTube) {
  // Normalize the fallback livestream URL through the same parser so a pasted
  // watch URL becomes an embed URL automatically.
  const fallback = form.livestream.trim();
  const fallbackParsed = fallback ? parseStreamUrl(fallback) : null;

  // Prefer the resolved permanent embed URL when available — that's the whole
  // point of resolution: the admin pastes once, we lock in the channel ID,
  // and live streams play forever without further updates.
  const liveChannelUrl = resolvedYouTube?.embedUrl
    ? resolvedYouTube.embedUrl
    : form.liveChannelUrl.trim();

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    address: form.address.trim(),
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
    contact: { phone: form.phone.trim(), email: form.email.trim() },
    website: form.website.trim()
  };
}

// Passcode for unlocking "create new church" — set via VITE_ADMIN_PASSCODE.
// If no passcode is set, the create flow is hidden entirely.
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE;
const UNLOCK_KEY = 'churchhub:admin-unlocked:v1';

export default function Admin() {
  const churches = useChurches();
  const [selectedId, setSelectedId] = useState(churches[0]?.id);
  const [section, setSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Create-new-church flow.
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [creating, setCreating] = useState(false);

  const church = churches.find((c) => c.id === selectedId) || churches[0];
  const [form, setForm] = useState(() => churchToForm(church));
  const [resolvedYouTube, setResolvedYouTube] = useState(() => existingResolved(church));

  // When the user picks a different church, reload the form.
  useEffect(() => {
    if (church) {
      setForm(churchToForm(church));
      setResolvedYouTube(existingResolved(church));
    }
    setSaved(false);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = (e) => {
    e.preventDefault();
    updateChurch(selectedId, formToPatch(form, resolvedYouTube));
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const onReset = () => {
    if (confirm('Discard your edits to this church and restore the original?')) {
      resetChurch(selectedId);
    }
  };

  const onResetAll = () => {
    if (confirm('Discard ALL local edits across every church?')) {
      resetAll();
    }
  };

  const tryUnlock = (e) => {
    e.preventDefault();
    if (!ADMIN_PASSCODE) {
      setPassError(true);
      return;
    }
    if (passInput === ADMIN_PASSCODE) {
      setUnlocked(true);
      setPassError(false);
      try {
        sessionStorage.setItem(UNLOCK_KEY, '1');
      } catch {}
    } else {
      setPassError(true);
    }
  };

  const lock = () => {
    setUnlocked(false);
    setCreating(false);
    setPassInput('');
    try {
      sessionStorage.removeItem(UNLOCK_KEY);
    } catch {}
  };

  if (!church) return null;

  return (
    <div className="page fade-in">
      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>Church admin</h2>
        {unlocked && (
          <button className="btn-link" onClick={lock}>Lock</button>
        )}
      </div>

      {/* Unlock card — only shows if a passcode is configured */}
      {ADMIN_PASSCODE && !unlocked && (
        <form
          className="card"
          onSubmit={tryUnlock}
          style={{ marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div className="field" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
            <label>Owner passcode</label>
            <input
              type="password"
              value={passInput}
              onChange={(e) => { setPassInput(e.target.value); setPassError(false); }}
              placeholder="Enter passcode to add a new church"
            />
            {passError && (
              <p style={{ fontSize: '0.82rem', color: 'var(--rose)', marginTop: 6 }}>
                Incorrect passcode.
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary">Unlock</button>
        </form>
      )}

      {/* Create-new-church flow (only visible when unlocked) */}
      {unlocked && creating && (
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

      {unlocked && !creating && (
        <div
          className="card"
          style={{
            marginBottom: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--cream)',
            borderColor: 'rgba(200, 155, 60, 0.35)'
          }}
        >
          <div>
            <strong style={{ color: 'var(--gold-deep)' }}>Owner mode unlocked.</strong>
            <span style={{ color: 'var(--ink-soft)', marginLeft: 8 }}>
              You can add churches directly to the database.
            </span>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => setCreating(true)}>
            + Add new church
          </button>
        </div>
      )}

      <div className="banner">
        <strong>Editing existing churches:</strong> Changes save to this browser
        (<code>localStorage</code>) only — they don't update what other visitors see.
        For shared edits, use the Supabase dashboard. Auth + real saves coming soon.
      </div>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <div className="field">
          <label>Editing church</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.city}, {c.state}</option>
            ))}
          </select>
        </div>
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
          <div className="divider" style={{ margin: '12px 0' }} />
          <button onClick={onReset} style={{ color: 'var(--rose)' }}>
            Reset this church
          </button>
          <button onClick={onResetAll} style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>
            Reset all local edits
          </button>
        </aside>

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
              Saved to your browser. Visit <strong>Home</strong>, <strong>Churches</strong>,
              or this church's profile to see the change.
            </div>
          )}

          {section === 'profile' && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Profile</h3>
              <div className="field">
                <label>Church name</label>
                <input name="name" value={form.name} onChange={onChange} />
              </div>
              <div className="field">
                <label>Address</label>
                <input name="address" value={form.address} onChange={onChange} />
              </div>
              <div className="field">
                <label>About</label>
                <textarea name="description" value={form.description} onChange={onChange} />
              </div>
            </>
          )}

          {section === 'times' && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Service times</h3>
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
                Paste any YouTube channel link (/@handle, /channel/UC…, /c/, /user/) or a vimeo.com/event URL.
              </p>
              {/* Vimeo / other auto-live URLs still flow through the parser hint. */}
              {form.liveChannelUrl && !/youtube\.com|youtu\.be/i.test(form.liveChannelUrl) && (
                <StreamHint url={form.liveChannelUrl} expected="auto" />
              )}

              <div className="field">
                <label>Fallback video <span style={{ color: 'var(--ink-muted)', textTransform: 'none', letterSpacing: 0 }}>(shown when not live)</span></label>
                <input
                  name="livestream"
                  value={form.livestream}
                  onChange={onChange}
                  placeholder="https://www.youtube.com/watch?v=... (latest sermon, welcome video)"
                />
                <StreamHint url={form.livestream} expected="video" />
              </div>

              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
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
                  Manually toggles the "Live" badge and feature placement. With a backend you'd auto-detect this from the YouTube Data API every few minutes.
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

              <div className="banner" style={{ marginBottom: 0 }}>
                <strong>How "live" works:</strong> If you set an <em>Auto-live channel URL</em>,
                the embed always points at whatever your channel is currently broadcasting —
                you don't need to update it for each service. The Fallback Video plays for
                visitors who land on your profile when you're offline.
              </div>
            </>
          )}

          {section === 'sermons' && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Sermon videos</h3>
              <div className="field">
                <label>One per line: <code>Title | Date | URL</code></label>
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
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Ministries</h3>
              <div className="field">
                <label>Comma-separated tags</label>
                <input name="ministries" value={form.ministries} onChange={onChange} />
              </div>
            </>
          )}

          {section === 'contact' && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Contact info</h3>
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
            <button type="submit" className="btn btn-primary">Save changes</button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setForm(churchToForm(church))}
            >
              Discard unsaved
            </button>
          </div>
        </form>
      </div>

      <div className="divider" />

      <div className="section-head" style={{ marginTop: 0 }}>
        <h2 style={{ fontStyle: 'italic', fontWeight: 400 }}>Claim your church</h2>
      </div>
      <div className="church-grid">
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <IconChurch />
          <div>
            <h4 style={{ marginBottom: 4 }}>Not listed yet?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              Submit your church and we'll review it within a few days. Verified churches can manage their profile, livestream, and sermons.
            </p>
            <button className="btn btn-ghost btn-sm">Submit a church</button>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <IconPlay />
          <div>
            <h4 style={{ marginBottom: 4 }}>Already listed?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              Claim ownership using your church email. We'll verify before granting edit access.
            </p>
            <button className="btn btn-gold btn-sm">Claim profile</button>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <IconMail />
          <div>
            <h4 style={{ marginBottom: 4 }}>Need help?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              Email <a href="mailto:churches@churchhub.example">churches@churchhub.example</a> and our team will walk you through setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline hint that parses the URL the user is typing and tells them what
// strategy ChurchHub will use for it. `expected` is just for nudging:
//  - 'auto'  -> we'd love a channel/event URL here
//  - 'video' -> we'd love a specific video URL here
function StreamHint({ url, expected }) {
  if (!url || !url.trim()) return null;
  const parsed = parseStreamUrl(url);

  const tone =
    parsed.strategy === 'unknown'
      ? 'warn'
      : (expected === 'auto' && !parsed.autoLive) || (expected === 'video' && parsed.autoLive)
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
