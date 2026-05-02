import React from 'react';
import { SOCIAL_PLATFORMS, getPlatform } from '../data/socials.jsx';

// Edit a church's social links. Stored shape: { facebook: 'url', tiktok: 'url', ... }.
// The admin sees one row per link; can pick any platform from the dropdown,
// add as many as needed, and remove individual rows.
//
// Props:
//   value     — current { platform: url } object (may be undefined)
//   onChange  — called with the new object on every keystroke
export default function SocialsEditor({ value, onChange }) {
  // Convert object → array of [platform, url] preserving order.
  const rows = Object.entries(value || {});

  const updateRow = (index, nextKey, nextUrl) => {
    const next = rows.slice();
    next[index] = [nextKey, nextUrl];
    // Drop duplicates: if the user picked a platform that's already in another
    // row, consolidate to the latest edit.
    const seen = new Set();
    const dedup = [];
    for (let i = next.length - 1; i >= 0; i--) {
      const [k] = next[i];
      if (!k || seen.has(k)) continue;
      seen.add(k);
      dedup.unshift(next[i]);
    }
    onChange(Object.fromEntries(dedup));
  };

  const removeRow = (index) => {
    const next = rows.slice();
    next.splice(index, 1);
    onChange(Object.fromEntries(next));
  };

  const addRow = () => {
    const used = new Set(rows.map(([k]) => k));
    const nextPlatform = SOCIAL_PLATFORMS.find((p) => !used.has(p.key)) || SOCIAL_PLATFORMS[0];
    onChange({ ...(value || {}), [nextPlatform.key]: '' });
  };

  return (
    <div className="socials-editor">
      <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
        Add as many or as few as you'd like. They'll show up as buttons on your
        church profile page. Pick the platform from the dropdown, then paste
        the link (or your <code>@handle</code>).
      </p>

      {rows.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: 10 }}>
          No social links yet — click <strong>+ Add social link</strong> below.
        </p>
      )}

      <div className="socials-rows">
        {rows.map(([platformKey, url], i) => (
          <SocialRow
            key={`${platformKey}-${i}`}
            platformKey={platformKey}
            url={url}
            takenKeys={rows.filter((_, j) => j !== i).map(([k]) => k)}
            onChange={(nextKey, nextUrl) => updateRow(i, nextKey, nextUrl)}
            onRemove={() => removeRow(i)}
          />
        ))}
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={addRow}
        style={{ marginTop: 10 }}
      >
        + Add social link
      </button>
    </div>
  );
}

function SocialRow({ platformKey, url, takenKeys, onChange, onRemove }) {
  const platform = getPlatform(platformKey);
  const Icon = platform.icon;
  const taken = new Set(takenKeys);

  return (
    <div className="social-row">
      <div className="social-row-icon" style={{ color: platform.color }}>
        <Icon />
      </div>

      <select
        value={platformKey}
        onChange={(e) => onChange(e.target.value, url)}
        className="social-platform-select"
      >
        {SOCIAL_PLATFORMS.map((p) => (
          <option key={p.key} value={p.key} disabled={taken.has(p.key)}>
            {p.label}
          </option>
        ))}
        {/* Allow keeping a legacy/unknown platform that's not in the list. */}
        {!SOCIAL_PLATFORMS.find((p) => p.key === platformKey) && (
          <option value={platformKey}>{platform.label}</option>
        )}
      </select>

      <input
        type="text"
        value={url}
        onChange={(e) => onChange(platformKey, e.target.value)}
        placeholder={platform.placeholder}
        className="social-url-input"
        autoComplete="off"
        spellCheck={false}
      />

      <button
        type="button"
        className="social-remove-btn"
        onClick={onRemove}
        aria-label={`Remove ${platform.label}`}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}
