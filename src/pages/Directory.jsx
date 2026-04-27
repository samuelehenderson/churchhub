import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChurches } from '../hooks/useChurches.js';
import { allStates, allDenominations } from '../data/store.js';
import ChurchCard from '../components/ChurchCard.jsx';
import { IconSearch } from '../components/Icons.jsx';

const ministryFilters = [
  'Online Only',
  'Kids Ministry',
  'Youth Ministry',
  'Small Groups',
  'Counseling',
  'New Believer Friendly'
];

const worshipStyles = ['Modern Worship', 'Traditional', 'Mixed Worship', 'Liturgical'];

export default function Directory() {
  const churches = useChurches();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';

  const [q, setQ] = useState(initialQ);
  const [state, setState] = useState('');
  const [denom, setDenom] = useState('');
  const [worship, setWorship] = useState('');
  const [activeMinistries, setActiveMinistries] = useState(new Set());

  useEffect(() => {
    if (q) setParams({ q }, { replace: true });
    else setParams({}, { replace: true });
  }, [q, setParams]);

  const toggleMinistry = (m) => {
    setActiveMinistries((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return churches.filter((c) => {
      if (term) {
        const haystack = [
          c.name, c.city, c.state, c.denomination, c.description,
          ...c.tags, ...c.ministries
        ].join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (state && c.state !== state) return false;
      if (denom && c.denomination !== denom) return false;
      if (worship && !c.tags.includes(worship)) return false;
      for (const m of activeMinistries) {
        const inTags = c.tags.includes(m);
        const inMin = c.ministries.some((x) => x.toLowerCase().includes(m.toLowerCase().replace(' only', '')));
        if (m === 'Online Only' && !c.tags.includes('Online Only')) return false;
        if (m !== 'Online Only' && !(inTags || inMin)) return false;
      }
      return true;
    });
  }, [q, state, denom, worship, activeMinistries, churches]);

  const clearAll = () => {
    setQ('');
    setState('');
    setDenom('');
    setWorship('');
    setActiveMinistries(new Set());
  };

  return (
    <div className="page fade-in">
      <div className="section-head" style={{ marginTop: 8, marginBottom: 12 }}>
        <h2>Church directory</h2>
      </div>

      <div className="filter-bar">
        <div className="search-wrap" style={{ marginBottom: 14 }}>
          <IconSearch className="search-icon" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="search-input"
            placeholder="Search churches, cities, or styles"
          />
        </div>

        <div className="filter-grid">
          <div className="field">
            <label>State</label>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All states</option>
              {allStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Denomination</label>
            <select value={denom} onChange={(e) => setDenom(e.target.value)}>
              <option value="">All denominations</option>
              {allDenominations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Worship style</label>
            <select value={worship} onChange={(e) => setWorship(e.target.value)}>
              <option value="">Any style</option>
              {worshipStyles.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Ministries & access
          </label>
          <div className="checkbox-grid">
            {ministryFilters.map((m) => (
              <label key={m} className={`check-pill${activeMinistries.has(m) ? ' on' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeMinistries.has(m)}
                  onChange={() => toggleMinistry(m)}
                />
                {m}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-summary">
        <span>{filtered.length} {filtered.length === 1 ? 'church' : 'churches'} found</span>
        <button className="btn-link" onClick={clearAll}>Clear filters</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h3>No matches yet</h3>
          <p>Try removing a filter or broadening your search.</p>
        </div>
      ) : (
        <div className="church-grid">
          {filtered.map((c) => (
            <ChurchCard key={c.id} church={c} />
          ))}
        </div>
      )}
    </div>
  );
}
