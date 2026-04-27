// Single source of truth for church data reads/writes.
// Today: localStorage (overlays edits on top of the seed data).
// Tomorrow: replace the bodies of these functions with fetch() calls to your API.
// The page components don't need to change.

import { churches as seedChurches } from './churches.js';

const STORAGE_KEY = 'churchhub:churches:v1';

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

// Merge seed + saved edits. Edits win.
export function getAllChurches() {
  const overrides = loadOverrides();
  return seedChurches.map((c) => (overrides[c.id] ? { ...c, ...overrides[c.id] } : c));
}

export function getChurch(id) {
  return getAllChurches().find((c) => c.id === id) || null;
}

// Save a partial update for one church.
export function updateChurch(id, patch) {
  const overrides = loadOverrides();
  overrides[id] = { ...(overrides[id] || {}), ...patch };
  saveOverrides(overrides);
  // Tell the rest of the app something changed.
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

// Re-export the static lookups so existing imports keep working.
export { allTags, allStates, allDenominations } from './churches.js';
