import React, { useEffect, useState } from 'react';
import { parseStreamUrl } from '../data/streams.js';
import {
  buildLiveEmbedUrl,
  checkChannelLiveStatus,
  isYouTubeApiConfigured
} from '../data/youtube.js';
import { IconPlay, IconClock } from './Icons.jsx';

/**
 * Smart embed that picks the right video to show based on church state:
 *
 * 1. Church has a resolved YouTube channel ID -> always embed
 *    https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
 *    YouTube itself decides whether to show the active live stream or the
 *    channel's offline fallback / latest upload.
 *
 * 2. Church has a non-YouTube auto-live URL (Vimeo event, etc.) -> embed it.
 *
 * 3. No auto-live URL -> friendly offline poster with the fallback video.
 *
 * When VITE_YOUTUBE_API_KEY is configured we additionally poll the YouTube
 * Data API once per mount to detect whether the channel is currently live, so
 * the "Live Now" badge stays accurate without any admin action.
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

  // Resolve the embed source URL.
  // Preference order:
  //   1. The permanent channel-live embed built from the stored channel ID
  //   2. Whatever liveChannelUrl is on the record (legacy / non-YouTube)
  //   3. The fallback livestreamUrl (single video)
  const channelEmbedUrl = youtubeChannelId ? buildLiveEmbedUrl(youtubeChannelId) : null;
  const sourceUrl = channelEmbedUrl || liveChannelUrl || livestreamUrl;
  const parsed = sourceUrl ? parseStreamUrl(sourceUrl) : null;

  // Channel header shown when we have resolved metadata.
  const header =
    showChannelHeader && (youtubeChannelTitle || youtubeChannelThumbnail) ? (
      <ChannelHeader
        title={youtubeChannelTitle || name}
        thumbnail={youtubeChannelThumbnail}
        isLive={isLive}
        liveTitle={autoLiveStatus?.title}
      />
    ) : null;

  // Case A: no auto-follow URL at all and not currently live -> offline poster.
  if (!isLive && !channelEmbedUrl && !liveChannelUrl) {
    return (
      <>
        {header}
        <OfflinePoster
          name={name}
          serviceTimes={serviceTimes}
          fallbackUrl={livestreamUrl}
        />
      </>
    );
  }

  if (!parsed || !parsed.embedUrl) {
    return (
      <>
        {header}
        <OfflinePoster
          name={name}
          serviceTimes={serviceTimes}
          fallbackUrl={livestreamUrl}
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
        {isLive && <span className="tag tag-live live-now-badge">Live Now</span>}
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
          Stop back during a service time, or watch a recent sermon below.
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
