// Inline icons — no external icon library, keeps the bundle lean.
import React from 'react';

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const IconHome = (p) => (
  <svg {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
);
export const IconLive = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M5.6 5.6a9 9 0 000 12.8M18.4 5.6a9 9 0 010 12.8M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7" /></svg>
);
export const IconChurch = (p) => (
  <svg {...base} {...p}><path d="M12 3v6M9 6h6" /><path d="M5 21V11l7-3 7 3v10" /><path d="M10 21v-5h4v5" /></svg>
);
export const IconMap = (p) => (
  <svg {...base} {...p}><path d="M9 3l-6 2v16l6-2 6 2 6-2V3l-6 2-6-2z" /><path d="M9 3v16M15 5v16" /></svg>
);
export const IconQuiz = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></svg>
);
export const IconAdmin = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
);
export const IconSearch = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);
export const IconPlay = (p) => (
  <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>
);
export const IconChevron = (p) => (
  <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>
);
export const IconArrowLeft = (p) => (
  <svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconHeart = (p) => (
  <svg {...base} {...p}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
);
export const IconHand = (p) => (
  <svg {...base} {...p}><path d="M9 11V5a1.5 1.5 0 013 0v6M12 11V4a1.5 1.5 0 013 0v7M15 11V6a1.5 1.5 0 013 0v8c0 4-3 7-7 7s-7-2-7-7v-4l2-1" /></svg>
);
export const IconWave = (p) => (
  <svg {...base} {...p}><path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /><path d="M3 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /></svg>
);
export const IconUsers = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20c0-3 2-5 4.5-5" /></svg>
);
export const IconPhone = (p) => (
  <svg {...base} {...p}><path d="M5 4h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-2h-1z" /></svg>
);
export const IconMail = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);
export const IconGlobe = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>
);
export const IconPin = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const IconClock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconSparkle = (p) => (
  <svg {...base} {...p}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z" /></svg>
);
