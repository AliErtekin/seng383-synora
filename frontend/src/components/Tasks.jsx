import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { addDays, toDateString } from '../dates.js';

export const AREAS = [
  ['cognitive', 'Cognitive'],
  ['language', 'Language'],
  ['motor', 'Motor'],
  ['social-emotional', 'Social-emotional'],
  ['self-care', 'Self-care'],
];
const areaLabel = Object.fromEntries(AREAS);

// M4 – Tasks (FR-M4-01 … FR-M4-04).
// Parent/specialist: assign tasks and see their status. Child: own tasks with "Mark as done".
export default function Tasks({ childId, user }) {
  const isChild = user.role === 'child';
  const [tasks, setTasks] = useState(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    developmentArea: 'language',
    dueDate: toDateString(addDays(new Date(), 3)),
  });
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api(`/children/${childId}/tasks${mineOnly ? '?assignedBy=me' : ''}`)
      .then((data) => setTasks(data.tasks))
      .catch((err) => setError(err.message));
  }, [childId, mineOnly]);

  useEffect(load, [load]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function assign(e) {
    e.preventDefault();
    setError('');
    try {
      await api(`/children/${childId}/tasks`, { method: 'POST', body: form });
      setForm({ ...form, title: '', description: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function complete(task) {
    setError('');
    try {
      await api(`/children/${childId}/tasks/${task.id}/status`, { method: 'PATCH', body: { status: 'completed' } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>{isChild ? 'My tasks' : 'Tasks'}</h2>
        {!isChild && (
          <label className="inline small">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            Only tasks I assigned
          </label>
        )}
      </div>

      {tasks === null ? (
        <p className="muted">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="muted">No tasks yet.</p>
      ) : (
        <ul className="list" aria-label="Tasks">
          {tasks.map((t) => (
            <li key={t.id} className={`row task ${t.status}`} data-testid="task">
              <div>
                <strong>{t.title}</strong> <span className="pill">{areaLabel[t.developmentArea]}</span>
                {t.description && <div className="small">{t.description}</div>}
                <div className="muted small">
                  Due {t.dueDate}
                  {!isChild && ` · assigned by ${t.assignedBy.displayName}`}
                </div>
              </div>
              <div className="task-end">
                <span className={`status status-${t.status}`} data-testid="task-status">
                  {t.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
                {isChild && t.status !== 'completed' && (
                  <button type="button" onClick={() => complete(t)} aria-label={`Mark "${t.title}" as done`}>
                    Mark as done
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isChild && (
        <form className="form-row" onSubmit={assign}>
          <h3>Assign a task</h3>
          <label>
            Task title
            <input value={form.title} onChange={set('title')} maxLength={120} required />
          </label>
          <label>
            Description
            <input value={form.description} onChange={set('description')} maxLength={1000} />
          </label>
          <label>
            Development area
            <select value={form.developmentArea} onChange={set('developmentArea')}>
              {AREAS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
          </label>
          <button type="submit">Assign task</button>
        </form>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
