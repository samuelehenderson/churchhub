# ChurchHub

A mobile-first web app that helps people find live church streams, sermon videos, and welcoming congregations across the United States — without hopping between YouTube, Facebook, and a dozen church websites.

Built with **React + Vite**, no backend required for the MVP. Sample JSON data drives everything so you can run it locally today and swap in a real database later.

---

## Features

- **Home** — hero search, "Live now" highlights, recent sermons, featured churches.
- **Live** — every church currently streaming, plus weekly online services.
- **Directory** — searchable, filterable list (state, denomination, worship style, ministries, online availability).
- **Church profile** — about, livestream embed, sermon library, ministries, contact, "Request Prayer / I'm New / Plan a Visit / Join Online Community."
- **Match quiz** — 8 questions that score churches by tag fit and recommend matches.
- **Map** — placeholder map with positioned pins (ready to swap for Google Maps / Mapbox).
- **Admin (working)** — preview dashboard for churches to edit profile, times, livestream, sermons, ministries, contact info, plus claim flow. **Edits actually persist** to the browser via `localStorage` and update Home / Directory / Profile / Map / Quiz instantly.

### How "live" works

Each church has two stream fields:

- **`liveChannelUrl`** — a YouTube channel URL, Vimeo event URL, or Facebook Page URL.
  This is the auto-follow URL: it always shows whatever the channel is *currently broadcasting*.
  When the church goes live, viewers see the live stream automatically. When they're not live,
  YouTube / Vimeo show a fallback (latest video or "channel offline" placeholder).
  **No code or admin update is needed when the church goes live.** Set it once, forget it.

- **`livestreamUrl`** — a specific video URL (latest sermon, welcome video). Used as a fallback
  for viewers landing on the profile when the church isn't streaming.

The `LiveEmbed` component picks the right thing to show based on `isLive` and which fields
are populated. The Admin form parses any URL the user pastes (channel, watch, embed, youtu.be,
Vimeo, Facebook, or any iframe URL like Boxcast) and gives a live preview of what strategy it'll use.

The `isLive` flag is currently a manual toggle in Admin. To auto-detect it, run a backend job
every 2–5 minutes that calls the YouTube Data API:
```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet&channelId=UCxxxx&eventType=live&type=video&key=YOUR_KEY
```
If `items[]` is non-empty, set `isLive: true` and store the video ID. Otherwise `false`.
- Bottom tab navigation, mobile-first, scales to desktop.
- Custom design system: Fraunces (display) + Outfit (body), warm cream / navy / gold palette.

---

## Quick start

Requires Node.js 18+ (20+ recommended) and npm.

```bash
# from the project root
npm install
npm run dev
```

The dev server will open `http://localhost:5173`.

To build a production bundle:

```bash
npm run build
npm run preview   # serves the built bundle locally
```

---

## Project structure

```
churchhub/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              # React entry
    ├── App.jsx               # Routes + shell
    ├── components/
    │   ├── TopBar.jsx
    │   ├── TabBar.jsx        # Bottom mobile nav
    │   ├── ChurchCard.jsx
    │   ├── LiveCard.jsx
    │   └── Icons.jsx         # Inline SVG icons
    ├── pages/
    │   ├── Home.jsx
    │   ├── Live.jsx
    │   ├── Directory.jsx
    │   ├── Profile.jsx
    │   ├── Quiz.jsx
    │   ├── Map.jsx
    │   └── Admin.jsx
    ├── hooks/
    │   └── useChurches.js    # Subscribe to live data updates
    ├── data/
    │   ├── churches.js       # Seed: 8 sample fictional churches
    │   └── store.js          # Read/write API (localStorage today, fetch() later)
    └── styles/
        └── global.css        # Design tokens + components
```

The data layer is intentionally isolated. **Every page reads through `src/data/store.js`** —
when you wire up a real backend, replace the bodies of `getAllChurches`, `getChurch`,
`updateChurch`, and `resetChurch` with `fetch()` / TanStack Query calls. The page components
and the `useChurches` hook stay exactly the same.

Right now `store.js` keeps the seed data immutable and overlays your edits on top in
`localStorage` under the key `churchhub:churches:v1`. Saves are global within a browser:
edit in Admin, then Home / Directory / Profile / Map / Quiz all update without a page reload.

---

## Sample data

`src/data/churches.js` ships 8 fictional churches across WA, MA, TX, CO, FL, NY, NC, plus an online-only one. They span Non-denominational, Episcopal, Baptist, Presbyterian, Pentecostal, and Methodist, with a mix of modern, traditional, mixed, and liturgical worship styles. All livestream/sermon URLs are placeholder embeds.

---

## Hosting it online later

This is a static Vite SPA. After `npm run build`, the `dist/` folder is everything you need.

### Vercel
```bash
npm i -g vercel
vercel
```
Vercel auto-detects Vite. For SPA routing, add a `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

### Netlify
Drag `dist/` into Netlify's UI, or:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```
Add `public/_redirects` containing `/*  /index.html  200` for SPA routing.

### Render
Create a **Static Site**, build command `npm run build`, publish directory `dist`. Add a rewrite rule `/*` → `/index.html` (Status 200).

### Cloudflare Pages / GitHub Pages
Both work the same way — point the build output to `dist/`, add the SPA rewrite.

---

## Upgrade path

The MVP is intentionally minimal. Here's how each piece grows:

### 1. Real database
Replace `src/data/churches.js` with API calls. Good options:
- **Supabase** (Postgres + auth + storage in one) — fastest path.
- **Firebase Firestore** — easy realtime, great for live status.
- **Planetscale + Drizzle / Prisma** — if you want classic SQL.

Schema sketch:
```
churches      (id, name, slug, denomination, city, state, lat, lng, …)
service_times (church_id, day_of_week, time, label)
sermons       (id, church_id, title, date, embed_url)
tags          (id, name)
church_tags   (church_id, tag_id)
livestreams   (church_id, embed_url, platform, last_seen_live_at)
users         (id, email, role)               -- visitors, church admins, super admins
church_admins (user_id, church_id)
prayer_requests (id, church_id, user_id, message, created_at)
```

### 2. User accounts
- Add Supabase Auth / Clerk / Auth.js for email + Google sign-in.
- Lets visitors save churches, request prayer, RSVP to "Plan a Visit."

### 3. Church admin login
- Same auth, but with a `church_admins` join table.
- The Admin page already mocks the form structure — swap the `useState` form for a mutation against the API.
- Ownership claim: send a verification email to the address listed on the church's domain or a published contact email.

### 4. Video uploads & embeds
- Embeds (YouTube/Vimeo/Boxcast) work today — just paste the URL.
- For uploads, add Mux or Cloudflare Stream and store the playback URL in `sermons.embed_url`.

### 5. Livestream detection
- For YouTube: cron job hits `youtube.com/channel/CHANNEL_ID/live` or the YouTube Data API search endpoint with `eventType=live` and updates `livestreams.last_seen_live_at`.
- For Facebook: Graph API `live_videos` endpoint.
- The `isLive` flag in sample data already drives the UI — point it at the live status table.

### 6. Maps API
- The `Map.jsx` page already projects `lat`/`lng` to pin positions. Replace `<div className="big-map">` with:
  - **Mapbox GL JS** — `npm i mapbox-gl`, init a map, drop markers from the same lat/lng array.
  - **Google Maps** — `@vis.gl/react-google-maps` with markers and an info window.
  - Add an env var for the API key (`VITE_MAPBOX_TOKEN`) — Vite exposes anything prefixed `VITE_`.
- The Profile page's small map placeholder slots in the same way.

### 7. Verification system
- A `verified` boolean on `churches` plus a `verification_documents` table.
- Display a small "Verified" badge in `ChurchCard` once the flag is true.
- Verification flow: church admin uploads proof (501(c)(3) letter, official email confirmation), super admin approves.

### 8. Other quick wins
- **Search.** Replace the substring search in `Directory.jsx` with Algolia / Meilisearch / Postgres `tsvector` once data scales.
- **Geolocation.** "Find churches near me" → ask for browser geolocation, sort by haversine distance from each church's lat/lng.
- **Push notifications.** When a favorite church goes live, web push via Firebase Messaging or OneSignal.
- **Analytics.** Plausible or Umami — privacy-friendly, lightweight.

---

## Design notes

- **Type pairing:** Fraunces (variable serif, optical sizing) for display, Outfit for body — warm, modern, not generically religious.
- **Palette:** cream `#fbf8f3` background, deep navy `#1a3a52`, warm gold `#c89b3c`. Rose accent `#c25e4a` for live indicators only.
- **Geometry:** rounded everything (10–32px), generous spacing, single-column on phone scaling to two/three columns at 640px and 1000px.
- **Motion:** subtle fade-in on route change, pulsing live indicator, hover lift on primary buttons. Nothing distracting.

---

## License

This starter is yours to take in any direction — no attribution required. Sample church data, names, addresses, and contact info are fictional.
