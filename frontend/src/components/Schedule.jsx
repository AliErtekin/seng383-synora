import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import {
  addDays,
  formatDay,
  formatTime,
  localDateTimeWithOffset,
  mondayOf,
  toDateString,
  tzOffsetMinutes,
} from '../dates.js';

// M3 – Weekly schedule (FR-M3-01 … FR-M3-03).
// upcomingOnly: the child's view, which hides events that have already started.
export default function Schedule({ childId, canAdd, upcomingOnly = false }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf());
  const [events, setEvents] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => toDateString(new Date()));
  const [time, setTime] = useState('10:00');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const q = `weekStart=${toDateString(weekStart)}&tz=${tzOffsetMinutes(weekStart)}`;
    api(`/children/${childId}/events?${q}`)
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message));
  }, [childId, weekStart]);

  useEffect(load, [load]);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api(`/children/${childId}/events`, {
        method: 'POST',
        body: { title, startsAt: localDateTimeWithOffset(date, time) },
      });
      setTitle('');
      const added = mondayOf(new Date(`${date}T00:00:00`));
      if (added.getTime() !== weekStart.getTime()) setWeekStart(added);
      else load();
    } catch (err) {
      setError(err.message);
    }
  }

  const now = Date.now();
  const visible = (events || []).filter((ev) => !upcomingOnly || Date.parse(ev.startsAt) >= now);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <section className="card">
      <div className="card-head">
        <h2>{upcomingOnly ? 'Upcoming events' : 'Weekly schedule'}</h2>
        <div className="week-nav">
          <button type="button" className="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
            ‹
          </button>
          <span data-testid="week-label">Week of {formatDay(weekStart)}</span>
          <button type="button" className="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
            ›
          </button>
        </div>
      </div>

      {events === null ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="muted">No events this week.</p>
      ) : (
        <ol className="days" aria-label="Events">
          {days.map((d) => {
            const items = visible.filter((ev) => toDateString(new Date(ev.startsAt)) === toDateString(d));
            if (!items.length) return null;
            return (
              <li key={d.toISOString()}>
                <div className="day">{formatDay(d)}</div>
                <ul className="list">
                  {items.map((ev) => (
                    <li key={ev.id} className="row event">
                      <span className="time">{formatTime(ev.startsAt)}</span>
                      <span>{ev.title}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}

      {canAdd && (
        <form className="form-row" onSubmit={add}>
          <h3>Add event</h3>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
          <button type="submit">Add event</button>
        </form>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
