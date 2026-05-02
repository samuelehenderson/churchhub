// Curated list of social platforms ChurchHub supports out of the box.
// Each platform has:
//   key       — stored as the JSON key in churches.socials (lowercase, stable)
//   label     — what the admin sees in the dropdown / what visitors see
//   placeholder — example URL for the input field
//   icon      — a small inline SVG marker
//
// To add a new platform, append a new entry here. Existing data isn't
// affected. Unknown keys (e.g. legacy data with platforms we no longer
// list) still display under a generic "Link" label.

import React from 'react';

const svgBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'currentColor'
};

const FacebookIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M13 22v-9h3l1-4h-4V6.5c0-1.2.4-2 2.1-2H17V1.1A29 29 0 0014.2 1c-3 0-5.2 1.8-5.2 5.2V9H6v4h3v9h4z" />
  </svg>
);

const InstagramIcon = (p) => (
  <svg {...svgBase} {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M19 8.3a6.5 6.5 0 01-3.8-1.2v7.5a5.4 5.4 0 11-5.4-5.4c.3 0 .6 0 .9.1v3a2.4 2.4 0 102 2.3V2h2.9a3.6 3.6 0 003.6 3.4V8.3z" />
  </svg>
);

const YouTubeIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4A2.5 2.5 0 002.4 7.2C2 9 2 12 2 12s0 3 .4 4.8a2.5 2.5 0 001.8 1.8C6 19 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 001.8-1.8c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15.5v-7l5.2 3.5-5.2 3.5z" />
  </svg>
);

const XIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M17.5 3h2.7l-5.9 6.7L21.6 21H16l-4.5-5.9L6.4 21H3.7l6.3-7.2L3 3h5.7l4 5.4L17.5 3zm-1 16.4h1.5L7.7 4.5H6.1l10.4 14.9z" />
  </svg>
);

const ThreadsIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.6 15.5c-3.4 0-5.2-2-5.4-4.7l1.7-.4c.1 1.5 1.2 2.6 3.6 2.6 1.2 0 2.3-.5 2.3-1.6 0-1.5-1.7-1.5-3.6-2-2-.5-3.6-1-3.6-3 0-1.9 1.8-3.4 4.7-3.4 2.6 0 4.5 1.2 5 3.5l-1.7.5c-.4-1.6-1.5-2.4-3.4-2.4-1.4 0-2.7.6-2.7 1.7 0 1 .9 1.2 2.7 1.6 2.4.6 4.5 1 4.5 3.5 0 2.3-2.1 3.7-5.1 3.7z" />
  </svg>
);

const LinkedInIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M4 4a2 2 0 100 4 2 2 0 000-4zM2 9h4v12H2zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.7 2.6 4.7 6V21h-4v-5.6c0-1.3 0-3-1.9-3-1.9 0-2.2 1.5-2.2 3V21h-4V9z" />
  </svg>
);

const LinkIcon = (p) => (
  <svg {...svgBase} {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a5 5 0 007.1 0l3-3a5 5 0 00-7.1-7.1l-1 1" />
    <path d="M14 10a5 5 0 00-7.1 0l-3 3a5 5 0 007.1 7.1l1-1" />
  </svg>
);

const SpotifyIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.6.6 0 01-.9.2c-2.4-1.5-5.5-1.8-9.1-1a.6.6 0 11-.3-1.2c4-.9 7.4-.5 10.1 1.1.3.2.4.6.2.9zm1.2-2.7a.8.8 0 01-1.1.3c-2.8-1.7-7-2.2-10.3-1.2a.8.8 0 11-.4-1.5c3.8-1.1 8.4-.6 11.6 1.4.3.2.4.7.2 1zm.1-2.8c-3.3-2-8.8-2.1-12-1.2a1 1 0 11-.5-1.8c3.7-1.1 9.7-.9 13.5 1.4a1 1 0 11-1 1.6z" />
  </svg>
);

const TwitchIcon = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M4 3l-1 4v12h4v3h3l3-3h4l5-5V3H4zm15 11l-3 3h-4l-3 3v-3H6V5h13v9zm-3-7v5h-2V7h2zm-5 0v5H9V7h2z" />
  </svg>
);

export const SOCIAL_PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourchurch',
    color: '#1877f2',
    icon: FacebookIcon
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourchurch',
    color: '#e4405f',
    icon: InstagramIcon
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@yourchurch',
    color: '#000000',
    icon: TikTokIcon
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@yourchurch',
    color: '#ff0000',
    icon: YouTubeIcon
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/yourchurch',
    color: '#000000',
    icon: XIcon
  },
  {
    key: 'threads',
    label: 'Threads',
    placeholder: 'https://threads.net/@yourchurch',
    color: '#000000',
    icon: ThreadsIcon
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/yourchurch',
    color: '#0a66c2',
    icon: LinkedInIcon
  },
  {
    key: 'spotify',
    label: 'Spotify',
    placeholder: 'https://open.spotify.com/show/...',
    color: '#1db954',
    icon: SpotifyIcon
  },
  {
    key: 'twitch',
    label: 'Twitch',
    placeholder: 'https://twitch.tv/yourchurch',
    color: '#9146ff',
    icon: TwitchIcon
  },
  {
    key: 'other',
    label: 'Other link',
    placeholder: 'https://...',
    color: 'var(--navy-soft)',
    icon: LinkIcon
  }
];

const platformByKey = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.key, p])
);

export function getPlatform(key) {
  return platformByKey[key] || {
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    placeholder: 'https://...',
    color: 'var(--navy-soft)',
    icon: LinkIcon
  };
}

// Friendly URL normalization. The admin can paste anything reasonable —
// "facebook.com/foo", "@handle", a full https URL — and we coerce it into a
// well-formed URL. Returns null if we genuinely can't make sense of it.
export function normalizeSocialUrl(platformKey, raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  // Already a full URL — leave alone.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Bare @handle — map to the platform's handle URL when we know how.
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1);
    switch (platformKey) {
      case 'instagram': return `https://instagram.com/${handle}`;
      case 'tiktok':    return `https://tiktok.com/@${handle}`;
      case 'youtube':   return `https://youtube.com/@${handle}`;
      case 'threads':   return `https://threads.net/@${handle}`;
      case 'x':         return `https://x.com/${handle}`;
      default:          return `https://${trimmed}`;
    }
  }

  // Bare domain — slap https:// on the front.
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed; // best-effort
}
