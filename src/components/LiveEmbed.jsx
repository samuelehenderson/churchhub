import React from 'react';
import { parseStreamUrl } from '../data/streams.js';
import { IconPlay, IconClock } from './Icons.jsx';

/**
 * Smart embed that picks the right video to show based on church state:
 *
 * 1. Church is live AND has a liveChannelUrl  -> embed the channel's current live stream
 * 2. Church is live AND has only livestreamUrl -> embed that video
 * 3. Church is NOT live AND has a liveChannelUrl -> embed it anyway
 *      (YouTube auto-shows latest video / "channel offline" placeholder)
 * 4. Church is NOT live AND has only livestreamUrl -> show fallback poster + button
 */
export default function LiveEmbed({ church, autoplayWhenLive = false }) {
  const { isLive, liveChannelUrl, livestreamUrl, name, serviceTimes = [] } = church;

  // Prefer the auto-live URL whenever we have it.
  const sourceUrl = liveChannelUrl || livestreamUrl;
  const parsed = sourceUrl ? parseStreamUrl(sourceUrl) : null;

  // Case 4: not live, no auto-follow URL — show a friendly poster.
  if (!isLive && !liveChannelUrl) {
    return (
      <OfflinePoster
        name={name}
        serviceTimes={serviceTimes}
        fallbackUrl={livestreamUrl}
      />
    );
  }

  if (!parsed || !parsed.embedUrl) {
    return (
      <OfflinePoster
        name={name}
        serviceTimes={serviceTimes}
        fallbackUrl={livestreamUrl}
      />
    );
  }

  // Build the final src. Add autoplay only when actually live and requested.
  let src = parsed.embedUrl;
  if (isLive && autoplayWhenLive && /youtube\.com\/embed/.test(src)) {
    src += (src.includes('?') ? '&' : '?') + 'autoplay=1&mute=1';
  }

  return (
    <div className="video-frame">
      <iframe
        src={src}
        title={`${name} stream`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
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
