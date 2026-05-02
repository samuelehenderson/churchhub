// Single source of truth for church data reads/writes.
//
// Data flow:
//   1. On app load, fetch all churches from Supabase (one query, cached in memory).
//   2. Local edits made via Admin overlay on top of the server data (localStorage).
//      This means an edit shows up immediately for the editor without needing auth.
//      Once we add auth, updateChurch() will write to Supabase instead.
//   3. Components subscribe via the useChurches() hook and re-render automatically.
//
// If Supabase isn't configured (no env vars), falls back to the seed file so
// local dev still works without a database.
//
// --- Schema additions for the YouTube channel resolver ----------------------
// Run once on the Supabase `churches` table to back the new fields:
//
//   alter table churches
//     add column if not exists youtube_channel_id           text,
//     add column if not exists youtube_channel_title        text,
//     add column if not exists youtube_channel_thumbnail    text,
//     add column if not exists youtube_channel_original_url text;
//
// `live_channel_url` continues to hold the permanent live embed URL
// (https://www.youtube.com/embed/live_stream?channel=UC...) so existing
// rendering paths keep working. The new columns let us show the channel
// name + thumbnail in the UI and re-resolve later if the handle ever
// changes.
// ---------------------------------------------------------------------------

import { churches as seedChurches } from './churches.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const STORAGE_KEY = 'churchhub:churches:v1';
const CACHE_KEY = 'churchhub:server-cache:v1';

// In-memory cache of the server data. Populated by the initial fetch.
let serverChurches = null;
let fetchPromise = null;

// ---------- shape conversion ----------

// Postgres returns snake_case column names; the rest of the app expects camelCase.
function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    denomination: row.denomination,
    size: row.size,
    description: row.description,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    serviceTimes: row.service_times || [],
    online: !!row.online,
    isLive: !!row.is_live,
    liveTitle: row.live_title,
    liveChannelUrl: row.live_channel_url,
    youtubeChannelId: row.youtube_channel_id || null,
    youtubeChannelTitle: row.youtube_channel_title || null,
    youtubeChannelThumbnail: row.youtube_channel_thumbnail || null,
    youtubeChannelOriginalUrl: row.youtube_channel_original_url || null,
    livestreamUrl: row.livestream_url,
    sermonVideos: row.sermon_videos || [],
    tags: row.tags || [],
    ministries: row.ministries || [],
    contact: row.contact || {},
    website: row.website,
    socials: row.socials || {},
    logoColor: row.logo_color
  };
}

// ---------- localStorage overlay (unchanged) ----------

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('ChurchHub: could not save to localStorage', e);
  }
}

// ---------- server cache (so the UI doesn't flash empty on reload) ----------

function loadCachedServer() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedServer(churches) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(churches));
  } catch (e) {
    console.warn('ChurchHub: could not cache server data', e);
  }
}

// ---------- public API ----------

// Triggers the initial fetch (idempotent — safe to call repeatedly).
// Returns a promise so callers can await the first load if they want.
export function loadChurches() {
  if (fetchPromise) return fetchPromise;

  if (!isSupabaseConfigured) {
    serverChurches = seedChurches;
    return Promise.resolve(seedChurches);
  }

  fetchPromise = supabase
    .from('churches')
    .select('*')
    .order('name', { ascending: true })
    .then(({ data, error }) => {
      if (error) {
        console.error('ChurchHub: Supabase fetch failed, using seed data', error);
        serverChurches = loadCachedServer() || seedChurches;
      } else {
        serverChurches = data.map(fromRow);
        saveCachedServer(serverChurches);
      }
      window.dispatchEvent(new CustomEvent('churchhub:data-changed'));
      return serverChurches;
    });

  return fetchPromise;
}

// Synchronous accessor used by the React hook. Returns whatever's in memory
// right now; if the fetch hasn't finished, returns the cached or seed data
// so the UI never flashes empty.
function getServerSnapshot() {
  if (serverChurches) return serverChurches;
  const cached = loadCachedServer();
  if (cached) return cached;
  return seedChurches;
}

// Merge server data + local edits.
export function getAllChurches() {
  const overrides = loadOverrides();
  return getServerSnapshot().map((c) =>
    overrides[c.id] ? { ...c, ...overrides[c.id] } : c
  );
}

export function getChurch(id) {
  return getAllChurches().find((c) => c.id === id) || null;
}

// Save a partial update for one church (still local-only for now — auth comes next).
export function updateChurch(id, patch) {
  const overrides = loadOverrides();
  overrides[id] = { ...(overrides[id] || {}), ...patch };
  saveOverrides(overrides);
  window.dispatchEvent(new CustomEvent('churchhub:data-changed', { detail: { id } }));
  return getChurch(id);
}

// Wipe local edits for one church (or all of them).
export function resetChurch(id) {
  const overrides = loadOverrides();
  if (id) delete overrides[id];
  else Object.keys(overrides).forEach((k) => delete overrides[k]);
  saveOverrides(overrides);
  window.dispatchEvent(new CustomEvent('churchhub:data-changed', { detail: { id: id || null } }));
}

export function resetAll() {
  resetChurch(null);
}

// ---------- Supabase writes ----------
// These write directly to the database (unlike updateChurch which is local-only for now).

// Convert our camelCase shape back into snake_case for Postgres.
function toRow(church) {
  return {
    id: church.id,
    name: church.name,
    city: church.city,
    state: church.state,
    denomination: church.denomination,
    size: church.size,
    description: church.description,
    address: church.address,
    lat: church.lat,
    lng: church.lng,
    service_times: church.serviceTimes || [],
    online: !!church.online,
    is_live: !!church.isLive,
    live_title: church.liveTitle,
    live_channel_url: church.liveChannelUrl,
    youtube_channel_id: church.youtubeChannelId || null,
    youtube_channel_title: church.youtubeChannelTitle || null,
    youtube_channel_thumbnail: church.youtubeChannelThumbnail || null,
    youtube_channel_original_url: church.youtubeChannelOriginalUrl || null,
    livestream_url: church.livestreamUrl,
    sermon_videos: church.sermonVideos || [],
    tags: church.tags || [],
    ministries: church.ministries || [],
    contact: church.contact || {},
    website: church.website,
    socials: church.socials || {},
    logo_color: church.logoColor
  };
}

// Insert a new church row in Supabase.
// Returns { data, error } — caller handles UI feedback.
export async function createChurch(church) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  const { data, error } = await supabase
    .from('churches')
    .insert([toRow(church)])
    .select()
    .single();

  if (!error) {
    // Refresh the local cache by re-fetching everything.
    fetchPromise = null;
    serverChurches = null;
    await loadChurches();
  }
  return { data, error };
}

// Delete a church row in Supabase.
export async function deleteChurchFromServer(id) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  const { error } = await supabase.from('churches').delete().eq('id', id);
  if (!error) {
    fetchPromise = null;
    serverChurches = null;
    await loadChurches();
  }
  return { error };
}

// ---------- derived lookups ----------
// Backward-compatible static exports — snapshots taken at module load from seed data.
// Live values are also reflected because Directory rebuilds these in-memo from useChurches().
export const allStates = [...new Set(seedChurches.map((c) => c.state))].sort();
export const allDenominations = [...new Set(seedChurches.map((c) => c.denomination))].sort();
export { allTags } from './churches.js';
