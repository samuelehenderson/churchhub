import React, { useEffect, useState } from 'react';
import { parseStreamUrl } from '../data/streams.js';
import {
  buildLiveEmbedUrl,
  checkChannelLiveStatus,
  isYouTubeApiConfigured
} from '../data/youtube.js';
import { IconPlay, IconClock } from './Icons.jsx';

/**
 * Smart embed that picks the right video to show based on church state.
 *
 * The YouTube `embed/live_stream?channel=…` URL only works when the channel
 * is currently broadcasting; when offline, that URL renders as
 * "Video unavailable." So we use it only when we believe the channel is
 * live, and fall back to the fallback video URL (or a friendly poster)
 * the rest of the time.
 *
 * Live detection sources (in priority order):
 *   1. YouTube Data API live-status check (when VITE_YOUTUBE_API_KEY is set
 *      and we have a stored channel ID). Authoritative.
 *   2. The manual `isLive` flag on the church record. Used as a fallback
 *      when the API isn't configured, or while the API check is in flight.
 */
export default function LiveEmbed({ church, autoplayWhenLive = false, showChannelHeader = true }) {
  const {
    isLive: manualLive,
    liveChannelUrl,
    livestreamUrl,
    name,
    serviceTimes = [],
    youtubeChannelId,
    youtubeChannelTitle,
    youtubeChannelThumbnail
  } = church;

  // Auto-detected live status (overrides the manual flag when available).
  // null = not yet checked, { live: true|false, ... } = check completed.
  const [autoLiveStatus, setAutoLiveStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!youtubeChannelId || !isYouTubeApiConfigured) {
      setAutoLiveStatus(null);
      return;
    }
    checkChannelLiveStatus(youtubeChannelId).then((res) => {
      if (!cancelled) setAutoLiveStatus(res);
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeChannelId]);

  const isLive = autoLiveStatus?.live ?? manualLive;

  // Pick the right embed URL based on live state.
  //   Live:    use the auto-live URL (YouTube channel-live, Vimeo event, etc.)
  //   Offline: use the fallback video — the live URL would render
  //            "video unavailable" for most YouTube channels.
  const channelEmbedUrl = youtubeChannelId ? buildLiveEmbedUrl(youtubeChannelId) : null;
  const liveSource = channelEmbedUrl || liveChannelUrl;
  const offlineSource = livestreamUrl;
  const sourceUrl = isLive ? (liveSource || offlineSource) : (offlineSource || null);

  const parsed = sourceUrl ? parseStreamUrl(sourceUrl) : null;

  const header =
    showChannelHeader && (youtubeChannelTitle || youtubeChannelThumbnail) ? (
      <ChannelHeader
        title={youtubeChannelTitle || name}
        thumbnail={youtubeChannelThumbnail}
        isLive={isLive}
        liveTitle={autoLiveStatus?.title}
      />
    ) : null;

  // Nothing to show — friendly poster.
  if (!parsed || !parsed.embedUrl) {
    return (
      <>
        {header}
        <OfflinePoster
          name={name}
          serviceTimes={serviceTimes}
          fallbackUrl={offlineSource}
        />
      </>
    );
  }

  // Build the final src. Add autoplay only when actually live and requested.
  let src = parsed.embedUrl;
  if (isLive && autoplayWhenLive && /youtube\.com\/embed/.test(src)) {
    src += (src.includes('?') ? '&' : '?') + 'autoplay=1&mute=1';
  }

  return (
    <>
      {header}
      <div className="video-frame">
        {isLive ? (
          <span className="tag tag-live live-now-badge">Live Now</span>
        ) : (
          <span className="offline-pill">Latest sermon — not live right now</span>
        )}
        <iframe
          src={src}
          title={`${name} stream`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </>
  );
}

function ChannelHeader({ title, thumbnail, isLive, liveTitle }) {
  return (
    <div className="channel-header">
      <div className="channel-header-thumb" aria-hidden>
        {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <IconPlay />}
      </div>
      <div className="channel-header-meta">
        <div className="channel-header-title">
          {title}
          {isLive && <span className="tag tag-live">Live</span>}
        </div>
        {isLive && liveTitle && (
          <div className="channel-header-now" title={liveTitle}>
            “{liveTitle}”
          </div>
        )}
      </div>
    </div>
  );
}

function OfflinePoster({ name, serviceTimes, fallbackUrl }) {
  const nextService = serviceTimes[0];

  return (
    <div className="offline-poster">
      <div className="offline-poster-inner">
        <div className="offline-badge">
          <IconClock width="14" height="14" />
          {nextService ? `Next service ${nextService}` : 'Not streaming right now'}
        </div>
        <h3 className="offline-title">
          {name} isn't live at the moment
        </h3>
        <p className="offline-sub">
          {fallbackUrl
            ? 'Stop back during a service time, or watch a recent sermon.'
            : 'Stop back during a service time. The team hasn\'t added a fallback video yet.'}
        </p>
        {fallbackUrl && (
          <a
            href={fallbackUrl.replace('/embed/', '/watch?v=')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-gold btn-sm"
          >
            <IconPlay width="14" height="14" /> Watch latest sermon
          </a>
        )}
      </div>
    </div>
  );
}
