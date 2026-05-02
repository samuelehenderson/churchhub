// YouTube channel resolver.
//
// Admins paste any of these URL forms when adding/editing a church:
//   https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx   (canonical — has the ID)
//   https://www.youtube.com/@handlename                         (modern handle)
//   https://www.youtube.com/c/customname                        (legacy custom URL)
//   https://www.youtube.com/user/legacyusername                 (very old username URL)
//
// Goal: turn ANY of those into a permanent channel ID (UC...) so we can build
//   https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
// which auto-shows whatever the channel is currently live-streaming, forever,
// without the admin needing to update anything per service.
//
// Channel IDs are baked in — handles can change, but UC... IDs never do.
//
// API key: set VITE_YOUTUBE_API_KEY (YouTube Data API v3). Without a key, only
// URLs that already embed a channel ID (the /channel/UC... form) can be
// resolved synchronously — for handles / custom URLs / usernames the resolver
// returns a "needs-api-key" error so the UI can prompt the admin gracefully.

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const API_BASE = 'https://www.googleapis.com/youtube/v3';

const YT_CHANNEL_ID_RE = /^UC[\w-]{20,}$/;

// ---------- URL parsing ----------

/**
 * Identify what kind of YouTube reference a string is.
 * Returns null for non-YouTube input. Does not perform any network calls.
 *
 * @param {string} input  Any URL or bare identifier.
 * @returns {null | { kind: 'channelId'|'handle'|'customUrl'|'username'|'video'|'liveEmbed', value: string }}
 */
export function extractYouTubeIdentifier(input) {
  const raw = (input || '').trim();
  if (!raw) return null;

  // Bare channel ID (no URL).
  if (YT_CHANNEL_ID_RE.test(raw)) {
    return { kind: 'channelId', value: raw };
  }

  // Already a live-stream embed URL — pull the channel out.
  const liveEmbed = raw.match(/youtube\.com\/embed\/live_stream\?(?:[^#]*&)?channel=(UC[\w-]+)/);
  if (liveEmbed) return { kind: 'channelId', value: liveEmbed[1] };

  // /channel/UC... — canonical.
  const chanId = raw.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (chanId) return { kind: 'channelId', value: chanId[1] };

  // @handle  (also handles youtube.com/@name and bare @name)
  const handle = raw.match(/youtube\.com\/@([^/?#\s]+)/) || raw.match(/^@([\w.\-_]{2,})$/);
  if (handle) return { kind: 'handle', value: handle[1] };

  // /c/customname  (legacy custom URL)
  const custom = raw.match(/youtube\.com\/c\/([^/?#\s]+)/);
  if (custom) return { kind: 'customUrl', value: decodeURIComponent(custom[1]) };

  // /user/legacyusername  (oldest form)
  const user = raw.match(/youtube\.com\/user\/([^/?#\s]+)/);
  if (user) return { kind: 'username', value: decodeURIComponent(user[1]) };

  // /watch?v=, /shorts/, /live/, youtu.be — single video, not a channel.
  const video =
    raw.match(/[?&]v=([\w-]{6,})/) ||
    raw.match(/youtu\.be\/([\w-]{6,})/) ||
    raw.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    raw.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    raw.match(/youtube\.com\/live\/([\w-]{6,})/);
  if (video && video[1] !== 'live_stream') {
    return { kind: 'video', value: video[1] };
  }

  return null;
}

/**
 * Lightweight synchronous validator for the form layer. Tells the admin
 * whether the URL they typed looks like a recognizable YouTube channel
 * reference, without doing any network work.
 *
 * @param {string} input
 * @returns {{ valid: boolean, kind: string|null, message: string }}
 */
export function validateYouTubeChannelInput(input) {
  const raw = (input || '').trim();
  if (!raw) {
    return { valid: false, kind: null, message: '' };
  }
  const id = extractYouTubeIdentifier(raw);
  if (!id) {
    return {
      valid: false,
      kind: null,
      message:
        "That doesn't look like a YouTube channel URL. Try a /channel/UC... link, a @handle, or /c/ or /user/ URL."
    };
  }
  if (id.kind === 'video') {
    return {
      valid: false,
      kind: 'video',
      message:
        'That looks like a single video URL. For permanent live streaming, paste the channel URL instead (so the embed always follows whatever you broadcast).'
    };
  }
  if (id.kind === 'channelId') {
    return {
      valid: true,
      kind: id.kind,
      message: 'Channel ID detected — ready to embed.'
    };
  }
  // handle / customUrl / username — need API to pin down the channel ID.
  return {
    valid: true,
    kind: id.kind,
    message: API_KEY
      ? 'Will resolve via YouTube API.'
      : 'Will store as-is. Set VITE_YOUTUBE_API_KEY for permanent live embeds.'
  };
}

// ---------- embed URL ----------

/**
 * Build the permanent live-stream embed URL for a channel ID.
 * This URL auto-shows whatever the channel is currently broadcasting.
 */
export function buildLiveEmbedUrl(channelId) {
  if (!channelId || !YT_CHANNEL_ID_RE.test(channelId)) return null;
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
}

// ---------- API resolution ----------

async function ytApi(endpoint, params) {
  if (!API_KEY) {
    throw new Error('YouTube API key not configured (set VITE_YOUTUBE_API_KEY).');
  }
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error?.message) detail = body.error.message;
    } catch {}
    throw new Error(`YouTube API error: ${detail}`);
  }
  return res.json();
}

function shapeChannel(item) {
  if (!item) return null;
  const sn = item.snippet || {};
  const thumbs = sn.thumbnails || {};
  const thumb = thumbs.medium?.url || thumbs.default?.url || thumbs.high?.url || null;
  return {
    channelId: item.id,
    title: sn.title || null,
    description: sn.description || null,
    thumbnail: thumb,
    customUrl: sn.customUrl || null
  };
}

async function fetchChannelById(channelId) {
  const data = await ytApi('channels', {
    part: 'snippet',
    id: channelId,
    maxResults: 1
  });
  return shapeChannel(data?.items?.[0]);
}

async function fetchChannelByHandle(handle) {
  const clean = handle.replace(/^@/, '');
  const data = await ytApi('channels', {
    part: 'snippet',
    forHandle: `@${clean}`,
    maxResults: 1
  });
  return shapeChannel(data?.items?.[0]);
}

async function fetchChannelByUsername(username) {
  const data = await ytApi('channels', {
    part: 'snippet',
    forUsername: username,
    maxResults: 1
  });
  return shapeChannel(data?.items?.[0]);
}

async function fetchChannelByCustomName(name) {
  // /c/ legacy custom URLs don't have a direct lookup; fall back to search.
  const data = await ytApi('search', {
    part: 'snippet',
    q: name,
    type: 'channel',
    maxResults: 1
  });
  const item = data?.items?.[0];
  if (!item) return null;
  return shapeChannel({ id: item.snippet?.channelId, snippet: item.snippet });
}

/**
 * Resolve any YouTube channel reference (URL or ID) into a normalized record
 * with channel ID + metadata + a permanent live embed URL.
 *
 * Network-free for /channel/UC... and bare UC... inputs.
 * For @handle, /c/, /user/: requires VITE_YOUTUBE_API_KEY.
 *
 * @param {string} input  Whatever the admin pasted.
 * @returns {Promise<{
 *   ok: true,
 *   channelId: string,
 *   channelTitle: string|null,
 *   channelThumbnail: string|null,
 *   embedUrl: string,
 *   originalUrl: string,
 *   resolvedFrom: 'channelId'|'handle'|'customUrl'|'username'
 * } | {
 *   ok: false,
 *   reason: 'empty'|'invalid'|'video'|'no-api-key'|'not-found'|'api-error',
 *   message: string,
 *   originalUrl: string
 * }>}
 */
export async function resolveYouTubeChannel(input) {
  const originalUrl = (input || '').trim();
  if (!originalUrl) {
    return { ok: false, reason: 'empty', message: 'No URL provided.', originalUrl };
  }

  const id = extractYouTubeIdentifier(originalUrl);
  if (!id) {
    return {
      ok: false,
      reason: 'invalid',
      message:
        "Not a recognizable YouTube channel URL. Use /channel/UC..., /@handle, /c/name, or /user/name.",
      originalUrl
    };
  }
  if (id.kind === 'video') {
    return {
      ok: false,
      reason: 'video',
      message:
        'That URL points at a single video, not a channel. Paste the channel URL so the live embed follows future streams.',
      originalUrl
    };
  }

  // /channel/UC... — we already have the ID. Try to enrich with metadata if
  // the API key is around, but don't fail if it isn't.
  if (id.kind === 'channelId') {
    const embedUrl = buildLiveEmbedUrl(id.value);
    if (!API_KEY) {
      return {
        ok: true,
        channelId: id.value,
        channelTitle: null,
        channelThumbnail: null,
        embedUrl,
        originalUrl,
        resolvedFrom: 'channelId'
      };
    }
    try {
      const meta = await fetchChannelById(id.value);
      return {
        ok: true,
        channelId: id.value,
        channelTitle: meta?.title || null,
        channelThumbnail: meta?.thumbnail || null,
        embedUrl,
        originalUrl,
        resolvedFrom: 'channelId'
      };
    } catch {
      // Fall back silently — we still have the ID, which is what matters.
      return {
        ok: true,
        channelId: id.value,
        channelTitle: null,
        channelThumbnail: null,
        embedUrl,
        originalUrl,
        resolvedFrom: 'channelId'
      };
    }
  }

  // Everything else needs the API.
  if (!API_KEY) {
    return {
      ok: false,
      reason: 'no-api-key',
      message:
        'This URL needs the YouTube Data API to find its permanent channel ID. Add VITE_YOUTUBE_API_KEY, or paste the /channel/UC... link instead.',
      originalUrl
    };
  }

  try {
    let meta = null;
    if (id.kind === 'handle') meta = await fetchChannelByHandle(id.value);
    else if (id.kind === 'username') meta = await fetchChannelByUsername(id.value);
    else if (id.kind === 'customUrl') meta = await fetchChannelByCustomName(id.value);

    if (!meta?.channelId) {
      return {
        ok: false,
        reason: 'not-found',
        message: `Couldn't find a YouTube channel for "${id.value}".`,
        originalUrl
      };
    }

    return {
      ok: true,
      channelId: meta.channelId,
      channelTitle: meta.title,
      channelThumbnail: meta.thumbnail,
      embedUrl: buildLiveEmbedUrl(meta.channelId),
      originalUrl,
      resolvedFrom: id.kind
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'api-error',
      message: err?.message || 'YouTube API request failed.',
      originalUrl
    };
  }
}

// ---------- live status ----------

/**
 * Check whether a channel is currently broadcasting a live stream. Costs ~100
 * units of YouTube Data API quota per call, so callers should cache.
 *
 * @param {string} channelId
 * @returns {Promise<{ live: boolean, videoId: string|null, title: string|null }>}
 */
export async function checkChannelLiveStatus(channelId) {
  if (!channelId || !API_KEY) {
    return { live: false, videoId: null, title: null };
  }
  try {
    const data = await ytApi('search', {
      part: 'snippet',
      channelId,
      eventType: 'live',
      type: 'video',
      maxResults: 1
    });
    const item = data?.items?.[0];
    if (!item) return { live: false, videoId: null, title: null };
    return {
      live: true,
      videoId: item.id?.videoId || null,
      title: item.snippet?.title || null
    };
  } catch {
    return { live: false, videoId: null, title: null };
  }
}

export const isYouTubeApiConfigured = Boolean(API_KEY);
