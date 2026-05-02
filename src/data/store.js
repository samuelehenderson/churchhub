// Single source of truth for church data reads/writes.
//
// Data flow:
//   1. On app load, fetch all churches from Supabase (one query, cached in memory).
//   2. Authenticated edits write directly to Supabase via updateChurch() /
//      deleteChurch() / createChurch(), guarded by Row Level Security policies
//      defined in supabase/migrations/0002_auth_and_permissions.sql.
//   3. Components subscribe via the useChurches() hook and re-render
//      automatically once each write completes.
//
// If Supabase isn't configured (no env vars), falls back to the seed file so
// local dev still works without a database. In that mode all writes no-op.
//
// --- Schema ---------------------------------------------------------------
// The churches table needs columns for the YouTube channel resolver. See:
//   supabase/migrations/0001_youtube_channel_columns.sql
// And the auth/permissions tables + policies live in:
//   supabase/migrations/0002_auth_and_permissions.sql
// -------------------------------------------------------------------------

import { churches as seedChurches } from './churches.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

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

// Convert our camelCase shape back into snake_case for Postgres. Only includes
// keys that are actually present in the patch — that way an `updateChurch`
// call doesn't accidentally null out columns it didn't touch.
function toRow(patch) {
  const map = {
    id: 'id',
    name: 'name',
    city: 'city',
    state: 'state',
    denomination: 'denomination',
    size: 'size',
    description: 'description',
    address: 'address',
    lat: 'lat',
    lng: 'lng',
    serviceTimes: 'service_times',
    online: 'online',
    isLive: 'is_live',
    liveTitle: 'live_title',
    liveChannelUrl: 'live_channel_url',
    youtubeChannelId: 'youtube_channel_id',
    youtubeChannelTitle: 'youtube_channel_title',
    youtubeChannelThumbnail: 'youtube_channel_thumbnail',
    youtubeChannelOriginalUrl: 'youtube_channel_original_url',
    livestreamUrl: 'livestream_url',
    sermonVideos: 'sermon_videos',
    tags: 'tags',
    ministries: 'ministries',
    contact: 'contact',
    website: 'website',
    socials: 'socials',
    logoColor: 'logo_color'
  };
  const row = {};
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      row[col] = patch[k];
    }
  }
  return row;
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

function notifyChange(detail) {
  window.dispatchEvent(new CustomEvent('churchhub:data-changed', { detail }));
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
      notifyChange({});
      return serverChurches;
    });

  return fetchPromise;
}

// Force a re-fetch on next read (used after writes).
export function invalidateChurches() {
  fetchPromise = null;
  serverChurches = null;
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

export function getAllChurches() {
  return getServerSnapshot();
}

export function getChurch(id) {
  return getAllChurches().find((c) => c.id === id) || null;
}

// ---------- writes (RLS-guarded by Supabase) ----------

// Update an existing church row. Returns { data, error }.
// Only sends columns that are actually present in `patch` so we never blank
// out fields we didn't intend to touch.
export async function updateChurch(id, patch) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  const row = toRow(patch);
  delete row.id; // never overwrite the primary key
  if (Object.keys(row).length === 0) {
    return { data: getChurch(id), error: null };
  }

  const { data, error } = await supabase
    .from('churches')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error };

  invalidateChurches();
  await loadChurches();
  notifyChange({ id });
  return { data: fromRow(data), error: null };
}

// Insert a new church row.
export async function createChurch(church) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  const { data, error } = await supabase
    .from('churches')
    .insert([toRow(church)])
    .select()
    .single();

  if (error) return { data: null, error };

  invalidateChurches();
  await loadChurches();
  notifyChange({ id: data.id });
  return { data: fromRow(data), error: null };
}

// Delete a church row.
export async function deleteChurch(id) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  const { error } = await supabase.from('churches').delete().eq('id', id);
  if (error) return { error };

  invalidateChurches();
  await loadChurches();
  notifyChange({ id, deleted: true });
  return { error: null };
}

// Back-compat alias — old code imported this name.
export const deleteChurchFromServer = deleteChurch;

// ---------- derived lookups ----------
// Backward-compatible static exports — snapshots taken at module load from seed data.
export const allStates = [...new Set(seedChurches.map((c) => c.state))].sort();
export const allDenominations = [...new Set(seedChurches.map((c) => c.denomination))].sort();
export { allTags } from './churches.js';
