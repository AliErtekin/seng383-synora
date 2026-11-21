const express = require('express');
const { requireSession, requireRole } = require('../auth');
const { requireChildAccess } = require('../access');

// M3 – Weekly schedule.
//   GET  /api/children/:childId/events?weekStart=YYYY-MM-DD[&tz=180]  parent, linked specialist, child
//   POST /api/children/:childId/events  { title, startsAt }             parent, linked specialist
// startsAt is an ISO 8601 date-time with an offset; it is stored in UTC.
// tz is the viewer's offset from UTC in minutes (e.g. 180 for Istanbul), so the week
// starts at the viewer's local midnight. It defaults to 0 (UTC).

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function weekRange(weekStart, tzMinutes) {
  const startMs = Date.parse(`${weekStart}T00:00:00Z`) - tzMinutes * 60 * 1000;
  return [new Date(startMs).toISOString(), new Date(startMs + 7 * DAY_MS).toISOString()];
}

function toEvent(row) {
  return { id: row.id, title: row.title, startsAt: row.starts_at, createdByUserId: row.created_by_user_id };
}

function eventsRouter(db) {
  const router = express.Router({ mergeParams: true });
  const access = [requireSession, requireChildAccess(db)];

  router.get('/', ...access, (req, res) => {
    const { weekStart } = req.query;
    const tz = req.query.tz === undefined ? 0 : Number(req.query.tz);
    if (!isValidDate(weekStart)) {
      return res.status(400).json({ error: 'weekStart must be a date in the form YYYY-MM-DD' });
    }
    if (!Number.isInteger(tz) || Math.abs(tz) > 14 * 60) {
      return res.status(400).json({ error: 'tz must be an offset in minutes' });
    }
    const [from, to] = weekRange(weekStart, tz);
    const rows = db
      .prepare(
        'SELECT * FROM events WHERE child_id = ? AND starts_at >= ? AND starts_at < ? ORDER BY starts_at, id'
      )
      .all(req.child.id, from, to);
    return res.json({ events: rows.map(toEvent) });
  });

  router.post('/', ...access, requireRole('parent', 'specialist'), (req, res) => {
    const { title, startsAt } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({ error: 'Title is required (at most 120 characters)' });
    }
    const ms = typeof startsAt === 'string' && DATETIME_RE.test(startsAt) ? Date.parse(startsAt) : NaN;
    if (Number.isNaN(ms)) {
      return res.status(400).json({ error: 'startsAt must be a date and time with an offset' });
    }
    const startsAtUtc = new Date(ms).toISOString();
    const result = db
      .prepare('INSERT INTO events (child_id, created_by_user_id, title, starts_at) VALUES (?, ?, ?, ?)')
      .run(req.child.id, req.user.id, title.trim(), startsAtUtc);
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ event: toEvent(row) });
  });

  return router;
}

module.exports = { eventsRouter, isValidDate };
