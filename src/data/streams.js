// Stream URL helpers.
// People will paste all kinds of URLs into the Admin panel. This module turns
// whatever they paste into something we can embed, and tells us how each
// stream behaves (auto-live vs. fixed video).

// Strategies:
//   'youtube-channel-live'   -> always shows the channel's CURRENT live stream
//                               (or fallback content) — no admin updates needed
//   'youtube-channel-handle' -> @handle / /c/ / /user/ — needs API resolution to
//                               turn into a permanent channel-live embed
//   'youtube-video'          -> a specific YouTube video (sermon, archived stream)
//   'vimeo-event'            -> a Vimeo event (auto-shows live or upcoming)
//   'vimeo-video'            -> a specific Vimeo video
//   'facebook-page-live'     -> Facebook Page's current live stream
//   'iframe'                 -> any embed URL the church already has (Boxcast, etc.)
//   'unknown'                -> couldn't parse; show the raw URL with a warning

import { extractYouTubeIdentifier, buildLiveEmbedUrl } from './youtube.js';

// ---------- helpers ----------

function getVimeoEventId(url) {
  // https://vimeo.com/event/12345 or /event/12345/embed
  const m = url.match(/vimeo\.com\/event\/(\d+)/);
  return m ? m[1] : null;
}

function getVimeoVideoId(url) {
  // https://vimeo.com/123456789 (plain video, not event)
  const m = url.match(/vimeo\.com\/(\d{6,})(?:\/|$|\?)/);
  return m ? m[1] : null;
}

function getFacebookPageId(url) {
  // https://www.facebook.com/PageName/  or  facebook.com/pages/Name/12345
  const m = url.match(/facebook\.com\/([\w.-]+)\/?(?:$|\?|\/live)/);
  if (m && !['watch', 'video.php', 'plugins'].includes(m[1])) return m[1];
  return null;
}

// ---------- public API ----------

/**
 * Given whatever the church admin pastes (or stores), figure out what kind of
 * stream it is and return both an embed URL and metadata about its behavior.
 *
 * Synchronous — for @handle / /c/ / /user/ URLs we recognize the form but
 * cannot produce an embed URL without resolving via the YouTube Data API
 * first. Use resolveYouTubeChannel() (async) for those.
 *
 * @param {string} input  Channel ID, watch URL, embed URL, Vimeo URL, etc.
 * @returns {{
 *   strategy: string,
 *   embedUrl: string|null,
 *   autoLive: boolean,
 *   warning: string|null,
 *   needsResolution?: boolean
 * }}
 */
export function parseStreamUrl(input) {
  const raw = (input || '').trim();
  if (!raw) {
    return { strategy: 'unknown', embedUrl: null, autoLive: false, warning: 'Empty URL' };
  }

  const yt = extractYouTubeIdentifier(raw);

  if (yt?.kind === 'channelId') {
    return {
      strategy: 'youtube-channel-live',
      embedUrl: buildLiveEmbedUrl(yt.value),
      autoLive: true,
      warning: null
    };
  }

  if (yt?.kind === 'handle' || yt?.kind === 'customUrl' || yt?.kind === 'username') {
    return {
      strategy: 'youtube-channel-handle',
      embedUrl: null,
      autoLive: true,
      needsResolution: true,
      warning:
        'Resolve this URL to a permanent channel ID for a stable live embed.'
    };
  }

  if (yt?.kind === 'video') {
    return {
      strategy: 'youtube-video',
      embedUrl: `https://www.youtube.com/embed/${yt.value}`,
      autoLive: false,
      warning: null
    };
  }

  // Vimeo event
  const vimeoEvent = getVimeoEventId(raw);
  if (vimeoEvent) {
    return {
      strategy: 'vimeo-event',
      embedUrl: `https://vimeo.com/event/${vimeoEvent}/embed`,
      autoLive: true,
      warning: null
    };
  }

  // Vimeo plain video
  const vimeoVid = getVimeoVideoId(raw);
  if (vimeoVid) {
    return {
      strategy: 'vimeo-video',
      embedUrl: `https://player.vimeo.com/video/${vimeoVid}`,
      autoLive: false,
      warning: null
    };
  }

  // Facebook Page live
  const fbPage = getFacebookPageId(raw);
  if (fbPage && /facebook\.com/.test(raw)) {
    const target = encodeURIComponent(`https://www.facebook.com/${fbPage}/live`);
    return {
      strategy: 'facebook-page-live',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${target}&show_text=false`,
      autoLive: true,
      warning: 'Facebook Page must have "Live videos" set to public'
    };
  }

  // Already-embeddable iframe URL (Boxcast, Resi, ChurchStreaming, custom RTMP players)
  if (/^https?:\/\//i.test(raw) && (raw.includes('/embed') || raw.includes('player.') || raw.includes('boxcast'))) {
    return {
      strategy: 'iframe',
      embedUrl: raw,
      autoLive: false,
      warning: null
    };
  }

  return {
    strategy: 'unknown',
    embedUrl: raw,
    autoLive: false,
    warning: "Couldn't recognize this URL. Try a YouTube channel link, watch URL, or embed URL."
  };
}

/**
 * Human-readable description of how a stream behaves.
 */
export function describeStrategy(strategy) {
  switch (strategy) {
    case 'youtube-channel-live':
      return 'Auto-follows whatever this YouTube channel is broadcasting right now. No updates needed when they go live.';
    case 'youtube-channel-handle':
      return "YouTube handle / custom URL. Click Resolve to fetch the channel's permanent ID and lock in a stable live embed.";
    case 'youtube-video':
      return 'Plays this specific YouTube video. To always show the current live stream, paste the channel URL instead.';
    case 'vimeo-event':
      return 'Auto-follows this Vimeo event. Will show "live" when active, "upcoming" otherwise.';
    case 'vimeo-video':
      return 'Plays this specific Vimeo video.';
    case 'facebook-page-live':
      return "Auto-follows this Facebook Page's current live broadcast.";
    case 'iframe':
      return 'Custom embed URL. Whatever the provider serves at this URL will play.';
    default:
      return 'Unrecognized URL.';
  }
}
