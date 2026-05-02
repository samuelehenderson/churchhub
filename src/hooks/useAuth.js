import { useEffect, useState, useCallback } from 'react';
import {
  getSession,
  onAuthChange,
  isSuperAdminEmail,
  fetchMyMemberships,
  claimMyInvites
} from '../data/auth.js';

// Single global auth state. Components subscribe via useAuth().
let snapshot = {
  status: 'loading', // 'loading' | 'signed-out' | 'signed-in'
  user: null,
  isSuperAdmin: false,
  memberships: [], // [{ church_id, role }]
};

const listeners = new Set();

function setSnapshot(next) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l(snapshot));
}

async function refreshMemberships() {
  const memberships = await fetchMyMemberships();
  setSnapshot({ memberships });
}

let bootstrapped = false;
async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  const session = await getSession();
  if (session?.user) {
    setSnapshot({
      status: 'signed-in',
      user: session.user,
      isSuperAdmin: isSuperAdminEmail(session.user.email)
    });
    // Wire any pending invites (no-op if none) before pulling memberships.
    try {
      await claimMyInvites();
    } catch {}
    await refreshMemberships();
  } else {
    setSnapshot({ status: 'signed-out', user: null, isSuperAdmin: false, memberships: [] });
  }

  onAuthChange(async (newSession) => {
    if (newSession?.user) {
      setSnapshot({
        status: 'signed-in',
        user: newSession.user,
        isSuperAdmin: isSuperAdminEmail(newSession.user.email)
      });
      try {
        await claimMyInvites();
      } catch {}
      await refreshMemberships();
    } else {
      setSnapshot({
        status: 'signed-out',
        user: null,
        isSuperAdmin: false,
        memberships: []
      });
    }
  });
}

export function useAuth() {
  const [state, setState] = useState(snapshot);

  useEffect(() => {
    bootstrap();
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  const refresh = useCallback(refreshMemberships, []);

  return { ...state, refreshMemberships: refresh };
}

// Convenience: which churches can the current user edit?
export function useEditableChurchIds() {
  const { isSuperAdmin, memberships } = useAuth();
  if (isSuperAdmin) return { all: true, ids: null };
  return { all: false, ids: new Set(memberships.map((m) => m.church_id)) };
}

// Convenience: am I an 'admin' of this specific church (or a super admin)?
export function useIsChurchAdmin(churchId) {
  const { isSuperAdmin, memberships } = useAuth();
  if (isSuperAdmin) return true;
  return memberships.some((m) => m.church_id === churchId && m.role === 'admin');
}
