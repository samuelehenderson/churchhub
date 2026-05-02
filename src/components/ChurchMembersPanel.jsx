import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchChurchMembers,
  inviteChurchMember,
  removeChurchMember,
  updateChurchMemberRole,
  cancelInvite
} from '../data/auth.js';
import { useAuth } from '../hooks/useAuth.js';

// Manage who can edit a given church.
//
// Visible to: super admins + admins of this specific church.
// (RLS will block non-admins from reading the underlying tables anyway, but
// we hide the UI for them too so it doesn't show empty state.)
export default function ChurchMembersPanel({ churchId, churchName }) {
  const { user, isSuperAdmin } = useAuth();
  const [data, setData] = useState({ members: [], invites: [] });
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await fetchChurchMembers(churchId);
    setData(next);
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onInvite = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!inviteEmail.trim()) {
      setError('Enter an email address.');
      return;
    }
    setSubmitting(true);
    const { error: err, warning } = await inviteChurchMember({
      churchId,
      email: inviteEmail,
      role: inviteRole,
      invitedBy: user?.id
    });
    setSubmitting(false);
    if (err) {
      setError(err.message || 'Could not send invite.');
      return;
    }
    setMessage(
      warning ||
        `Invite sent to ${inviteEmail}. They'll get a sign-in email and land in the admin for ${churchName}.`
    );
    setInviteEmail('');
    setInviteRole('user');
    refresh();
  };

  const onChangeRole = async (memberId, role) => {
    setError(null);
    const { error: err } = await updateChurchMemberRole(memberId, role);
    if (err) {
      setError(err.message || 'Could not update role.');
      return;
    }
    refresh();
  };

  const onRemove = async (memberId, label) => {
    if (!confirm(`Remove ${label} from ${churchName}? They'll lose edit access immediately.`)) return;
    setError(null);
    const { error: err } = await removeChurchMember(memberId);
    if (err) {
      setError(err.message || 'Could not remove member.');
      return;
    }
    refresh();
  };

  const onCancelInvite = async (inviteId, email) => {
    if (!confirm(`Cancel the pending invite for ${email}?`)) return;
    setError(null);
    const { error: err } = await cancelInvite(inviteId);
    if (err) {
      setError(err.message || 'Could not cancel invite.');
      return;
    }
    refresh();
  };

  return (
    <>
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
        Members & access
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
        <strong>Admins</strong> can edit the church <em>and</em> manage who else
        has access. <strong>Users</strong> can edit content but can't invite or
        remove other members.
      </p>

      {error && (
        <div
          className="banner"
          style={{
            background: '#fbecdb',
            borderColor: '#e6c89a',
            color: '#8a6a1f',
            marginBottom: 14
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="banner"
          style={{
            background: '#e9f3ec',
            borderColor: '#bcd9c2',
            color: '#3d5a3d',
            marginBottom: 14
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={onInvite} className="invite-row">
        <div className="field" style={{ flex: 2, marginBottom: 0 }}>
          <label>Invite by email</label>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="pastor@yourchurch.org"
          />
        </div>
        <div className="field" style={{ width: 130, marginBottom: 0 }}>
          <label>Role</label>
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send invite'}
        </button>
      </form>

      <h4 style={{ marginTop: 24, marginBottom: 8 }}>Current members</h4>
      {loading ? (
        <p style={{ color: 'var(--ink-muted)' }}>Loading…</p>
      ) : data.members.length === 0 ? (
        <p style={{ color: 'var(--ink-muted)' }}>
          No members yet. Invite someone above to give them access.
        </p>
      ) : (
        <ul className="member-list">
          {data.members.map((m) => (
            <li key={m.id} className="member-row">
              <div className="member-info">
                <div className="member-id">
                  {m.user_id === user?.id ? (
                    <strong>You ({user.email})</strong>
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {m.user_id.slice(0, 8)}…
                    </span>
                  )}
                </div>
                <div className="member-meta">
                  Added {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
              <select
                value={m.role}
                onChange={(e) => onChangeRole(m.id, e.target.value)}
                disabled={m.user_id === user?.id && !isSuperAdmin}
                title={
                  m.user_id === user?.id && !isSuperAdmin
                    ? "You can't change your own role."
                    : ''
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onRemove(m.id, m.user_id === user?.id ? 'yourself' : 'this member')}
                style={{ color: 'var(--rose)' }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {data.invites.length > 0 && (
        <>
          <h4 style={{ marginTop: 24, marginBottom: 8 }}>Pending invites</h4>
          <ul className="member-list">
            {data.invites.map((i) => (
              <li key={i.id} className="member-row">
                <div className="member-info">
                  <div className="member-id">{i.email}</div>
                  <div className="member-meta">
                    Invited as {i.role} ·{' '}
                    {new Date(i.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onCancelInvite(i.id, i.email)}
                  style={{ color: 'var(--rose)' }}
                >
                  Cancel invite
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
