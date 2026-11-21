import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

// M2 – Linked specialists screen for the parent (FR-M2-01 … FR-M2-04).
export default function Specialists({ childId }) {
  const [list, setList] = useState(null);
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(() => {
    api(`/children/${childId}/specialists`)
      .then((data) => setList(data.specialists))
      .catch((err) => setError(err.message));
  }, [childId]);

  useEffect(load, [load]);

  async function link(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { specialist } = await api(`/children/${childId}/specialists`, {
        method: 'POST',
        body: { email, specialistType: type },
      });
      setMessage(`${specialist.displayName} is now linked.`);
      setEmail('');
      setType('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function unlink(s) {
    setError('');
    setMessage('');
    try {
      await api(`/children/${childId}/specialists/${s.id}`, { method: 'DELETE' });
      setConfirming(null);
      setMessage(`${s.displayName} was unlinked and can no longer see this child's data.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h2>Linked specialists</h2>
      {list === null ? (
        <p className="muted">Loading…</p>
      ) : list.length === 0 ? (
        <p className="muted">No specialists linked yet.</p>
      ) : (
        <ul className="list" aria-label="Linked specialists">
          {list.map((s) => (
            <li key={s.id} className="row">
              <div>
                <strong>{s.displayName}</strong> <span className="pill">{s.specialistType}</span>
                <div className="muted small">{s.email}</div>
              </div>
              {confirming === s.id ? (
                <span className="confirm">
                  Unlink {s.displayName}?{' '}
                  <button type="button" className="danger" onClick={() => unlink(s)}>
                    Yes, unlink
                  </button>
                  <button type="button" className="secondary" onClick={() => setConfirming(null)}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button type="button" className="secondary" onClick={() => setConfirming(s.id)}>
                  Unlink
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="form-row" onSubmit={link}>
        <h3>Link a specialist</h3>
        <label>
          Specialist email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Specialist type
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Teacher" required />
        </label>
        <button type="submit">Link specialist</button>
      </form>
      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
