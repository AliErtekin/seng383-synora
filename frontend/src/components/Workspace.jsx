import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Schedule from './Schedule.jsx';
import Tasks from './Tasks.jsx';
import Specialists from './Specialists.jsx';

// Parent and specialist home: pick a child, then Schedule / Tasks (/ Specialists for the parent).
// A specialist only sees the children currently linked to them (FR-M2-06).
export default function Workspace({ user }) {
  const isParent = user.role === 'parent';
  const tabs = isParent ? ['Schedule', 'Tasks', 'Specialists'] : ['Schedule', 'Tasks'];
  const [children, setChildren] = useState(null);
  const [childId, setChildId] = useState(null);
  const [tab, setTab] = useState('Schedule');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/children')
      .then(({ children: list }) => {
        setChildren(list);
        setChildId(list.length ? list[0].id : null);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!children) return <p className="muted">Loading…</p>;
  if (!children.length) {
    return (
      <section className="card" data-testid="no-children">
        <h2>No children yet</h2>
        <p className="muted">
          {isParent
            ? 'No child profile is attached to this account.'
            : 'You are not linked to any child. A parent can link you by your email address.'}
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="toolbar">
        <label className="inline">
          Child
          <select value={childId} onChange={(e) => setChildId(Number(e.target.value))} aria-label="Child">
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>
        <nav className="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'tab active' : 'tab'}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'Schedule' && <Schedule key={`s${childId}`} childId={childId} canAdd />}
      {tab === 'Tasks' && <Tasks key={`t${childId}`} childId={childId} user={user} />}
      {tab === 'Specialists' && isParent && <Specialists key={`p${childId}`} childId={childId} />}
    </>
  );
}
