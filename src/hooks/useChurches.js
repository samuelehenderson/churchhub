import { useEffect, useState, useCallback } from 'react';
import { getAllChurches, getChurch } from '../data/store.js';

// Returns the live list of churches, re-rendering when edits happen.
export function useChurches() {
  const [churches, setChurches] = useState(getAllChurches);
  const refresh = useCallback(() => setChurches(getAllChurches()), []);

  useEffect(() => {
    window.addEventListener('churchhub:data-changed', refresh);
    // Also refresh when another tab edits.
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('churchhub:data-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return churches;
}

// Single church variant.
export function useChurch(id) {
  const [church, setChurch] = useState(() => getChurch(id));
  const refresh = useCallback(() => setChurch(getChurch(id)), [id]);

  useEffect(() => {
    refresh();
    window.addEventListener('churchhub:data-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('churchhub:data-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return church;
}
