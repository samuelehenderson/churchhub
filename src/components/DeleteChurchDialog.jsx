import React, { useState } from 'react';
import { deleteChurch } from '../data/store.js';

// Type-the-name confirmation modal so a misclick can't nuke a church.
export default function DeleteChurchDialog({ church, onClose, onDeleted }) {
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const matches = typed.trim() === church.name;

  const onConfirm = async () => {
    if (!matches) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await deleteChurch(church.id);
    setSubmitting(false);
    if (err) {
      setError(err.message || 'Could not delete church.');
      return;
    }
    onDeleted?.();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 style={{ color: 'var(--rose)', marginBottom: 6 }}>Delete church</h3>
        <p style={{ color: 'var(--ink-soft)' }}>
          This permanently removes <strong>{church.name}</strong> from
          ChurchHub, including its profile, livestream link, sermons, members,
          and pending invites. This cannot be undone.
        </p>
        <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>
          Type the church name below to confirm:
        </p>
        <div className="field">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={church.name}
            autoFocus
          />
        </div>

        {error && (
          <div
            className="banner"
            style={{
              background: '#fbecdb',
              borderColor: '#e6c89a',
              color: '#8a6a1f',
              marginBottom: 12
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            style={{
              background: 'var(--rose)',
              color: '#fff',
              opacity: matches && !submitting ? 1 : 0.5,
              cursor: matches && !submitting ? 'pointer' : 'not-allowed'
            }}
            onClick={onConfirm}
            disabled={!matches || submitting}
          >
            {submitting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
