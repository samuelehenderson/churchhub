// Auth helpers built on top of Supabase Auth.
//
// Roles:
//   super-admin  — listed in VITE_SUPER_ADMIN_EMAILS (or defaults to a
//                  hardcoded address). Can do everything.
//   church admin — has a row in church_members with role='admin' for one or
//                  more churches. Can edit those churches AND manage their
//                  members.
//   church user  — has a row in church_members with role='user'. Can edit
//                  the church's content but not its membership.
//   visitor      — not signed in. Public read-only.
//
// The Supabase Postgres side mirrors these checks via RLS so even a
// hand-crafted API request from a logged-in user can't bypass them.

import { supabase, isSupabaseConfigured } from './supabase.js';

// Comma-separated list of super admin emails (case-insensitive).
const SUPER_ADMIN_EMAILS = (
  import.meta.env.VITE_SUPER_ADMIN_EMAILS ||
  'samuelehenderson@gmail.com,longtimegenie@gmail.com'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdminEmail(email) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

// ---------- session ----------

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data?.subscription?.unsubscribe();
}

// ---------- sign in / out ----------

export async function signInWithPassword(email, password) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signOut() {
  if (!isSupabaseConfigured) return { error: null };
  return supabase.auth.signOut();
}

// ---------- password reset ----------

export async function sendPasswordReset(email) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/reset`
  });
}

export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  return supabase.auth.updateUser({ password: newPassword });
}

// ---------- invite flow ----------

// Send a magic link that creates a Supabase user (if needed) and signs them
// in. The pending_invites trigger on the SQL side wires them to their church.
export async function sendInviteMagicLink(email) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
}

// Frontend calls this after every sign-in so previously-issued invites for
// users who already had accounts get applied.
export async function claimMyInvites() {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.rpc('claim_my_invites');
  if (error) {
    console.warn('ChurchHub: claim_my_invites failed', error);
    return 0;
  }
  return data || 0;
}

// ---------- membership ----------

// All church_members rows for the current user. Uses RLS — returns just the
// rows the user can see (their own).
export async function fetchMyMemberships() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('church_members')
    .select('church_id, role');
  if (error) {
    console.warn('ChurchHub: fetchMyMemberships failed', error);
    return [];
  }
  return data || [];
}

// Members + pending invites for one church. Used by the members panel.
export async function fetchChurchMembers(churchId) {
  if (!isSupabaseConfigured) return { members: [], invites: [] };

  const [{ data: members, error: mErr }, { data: invites, error: iErr }] =
    await Promise.all([
      supabase
        .from('church_members')
        .select('id, role, user_id, created_at')
        .eq('church_id', churchId)
        .order('created_at'),
      supabase
        .from('pending_invites')
        .select('id, email, role, created_at')
        .eq('church_id', churchId)
        .order('created_at')
    ]);

  if (mErr) console.warn('ChurchHub: fetchChurchMembers members error', mErr);
  if (iErr) console.warn('ChurchHub: fetchChurchMembers invites error', iErr);

  return { members: members || [], invites: invites || [] };
}

// Insert a pending invite then trigger the magic-link email so the invitee
// gets a single tap to come online.
export async function inviteChurchMember({ churchId, email, role, invitedBy }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { error: new Error('Email is required.') };
  if (role !== 'admin' && role !== 'user') {
    return { error: new Error('Role must be admin or user.') };
  }

  const { error: insertErr } = await supabase
    .from('pending_invites')
    .insert([{ church_id: churchId, email: cleanEmail, role, invited_by: invitedBy }]);

  if (insertErr) return { error: insertErr };

  const { error: mailErr } = await sendInviteMagicLink(cleanEmail);
  if (mailErr) {
    // Invite row is still in the DB — they can sign up later by any means and
    // the trigger will pick it up — so this is a soft failure.
    return {
      error: null,
      warning:
        'Invite saved, but the magic-link email could not be sent right now.'
    };
  }

  return { error: null };
}

export async function removeChurchMember(memberId) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  return supabase.from('church_members').delete().eq('id', memberId);
}

export async function updateChurchMemberRole(memberId, role) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  if (role !== 'admin' && role !== 'user') {
    return { error: new Error('Role must be admin or user.') };
  }
  return supabase.from('church_members').update({ role }).eq('id', memberId);
}

export async function cancelInvite(inviteId) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  return supabase.from('pending_invites').delete().eq('id', inviteId);
}
