import React, { useEffect, useRef, useState } from 'react';
import {
  validateYouTubeChannelInput,
  resolveYouTubeChannel,
  isYouTubeApiConfigured
} from '../data/youtube.js';

/**
 * Smart YouTube channel input.
 *
 * Accepts /channel/UC..., /@handle, /c/customname, /user/legacyname URLs (and
 * bare UC channel IDs). Validates instantly, then resolves to a permanent
 * channel ID + embed URL. The resolved record is what gets persisted, so
 * future live streams play automatically without admin intervention.
 *
 * Props:
 *   value           string  – current input text (URL the admin typed)
 *   onChange        (v)     – called as the admin types
 *   resolved        object|null – last successful resolve() output
 *   onResolved      (r)     – called with the result of a successful resolve
 *   onCleared       ()      – called when admin clears the resolved data
 *   label, placeholder      – optional UI overrides
 */
export default function YouTubeChannelInput({
  value,
  onChange,
  resolved,
  onResolved,
  onCleared,
  label = 'YouTube channel URL',
  placeholder = 'https://www.youtube.com/@yourchurch  or  /channel/UC...  or  /c/...  or  /user/...'
}) {
  const [status, setStatus] = useState('idle'); // idle | resolving | error
  const [error, setError] = useState(null);
  const lastResolvedFor = useRef(null);

  const trimmed = (value || '').trim();
  // Only chime in for YouTube-shaped inputs. Other URLs (Vimeo events, custom
  // embed URLs) are handled by their own hint elsewhere on the page.
  const looksLikeYouTube = /youtube\.com|youtu\.be|^@|^UC[\w-]{20,}$/.test(trimmed);
  const validation = looksLikeYouTube
    ? validateYouTubeChannelInput(trimmed)
    : { valid: false, kind: null, message: '' };

  // Auto-resolve when the admin pastes a URL (or finishes typing a valid one).
  // Debounced so we don't slam the API on every keystroke.
  useEffect(() => {
    if (!trimmed) {
      lastResolvedFor.current = null;
      setStatus('idle');
      setError(null);
      return;
    }
    if (!looksLikeYouTube || !validation.valid) {
      setStatus('idle');
      setError(null);
      return;
    }
    if (resolved && resolved.originalUrl === trimmed) return;
    if (lastResolvedFor.current === trimmed) return;

    const handle = setTimeout(() => {
      run(trimmed);
    }, 350);
    return () => clearTimeout(handle);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(url) {
    lastResolvedFor.current = url;
    setStatus('resolving');
    setError(null);
    const result = await resolveYouTubeChannel(url);
    if (result.ok) {
      setStatus('idle');
      onResolved?.(result);
    } else {
      setStatus('error');
      setError(result.message);
    }
  }

  const onPaste = (e) => {
    // Let onChange fire first; the effect above will trigger resolution.
    const pasted = (e.clipboardData?.getData('text') || '').trim();
    if (pasted) onChange(pasted);
  };

  const clear = () => {
    onChange('');
    onCleared?.();
    lastResolvedFor.current = null;
    setStatus('idle');
    setError(null);
  };

  return (
    <div className="field yt-channel-input">
      <label>{label}</label>
      <div className="yt-input-row">
        <input
          name="liveChannelUrl"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        {(value || resolved) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            Clear
          </button>
        )}
      </div>

      {status === 'resolving' && (
        <div className="yt-hint yt-hint-info">
          <span className="yt-spinner" /> Resolving channel…
        </div>
      )}

      {status === 'error' && error && (
        <div className="yt-hint yt-hint-warn">
          <strong>Could not resolve:</strong> {error}
          {!isYouTubeApiConfigured && (
            <div style={{ marginTop: 4 }}>
              Tip: paste the canonical <code>/channel/UC…</code> URL — that
              works without an API key.
            </div>
          )}
        </div>
      )}

      {looksLikeYouTube && status === 'idle' && validation.valid && !resolved && (
        <div className="yt-hint yt-hint-info">{validation.message}</div>
      )}

      {looksLikeYouTube && status === 'idle' && !validation.valid && validation.message && (
        <div className="yt-hint yt-hint-warn">{validation.message}</div>
      )}

      {resolved?.ok && (
        <ResolvedChannelPreview resolved={resolved} />
      )}
    </div>
  );
}

function ResolvedChannelPreview({ resolved }) {
  const { channelTitle, channelThumbnail, channelId, embedUrl, resolvedFrom } = resolved;
  const initials = (channelTitle || channelId || '??')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="yt-resolved">
      <div className="yt-resolved-thumb" aria-hidden>
        {channelThumbnail ? (
          <img src={channelThumbnail} alt="" loading="lazy" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="yt-resolved-meta">
        <div className="yt-resolved-title">
          {channelTitle || 'Channel resolved'}
          <span className="yt-badge" title={`Resolved from ${resolvedFrom}`}>
            ✓ Linked
          </span>
        </div>
        <div className="yt-resolved-id">
          <code>{channelId}</code>
        </div>
        <div className="yt-resolved-embed" title={embedUrl}>
          Embed: <code>{embedUrl}</code>
        </div>
      </div>
    </div>
  );
}
