const express = require('express');
const { requireSession, requireRole } = require('../auth');
const { requireChildAccess, parseId } = require('../access');
const { isValidDate } = require('./events');

// M4 – Tasks.
//   GET   /api/children/:childId/tasks[?assignedBy=me]   parent, linked specialist, child
//   POST  /api/children/:childId/tasks                   parent, linked specialist
//         { title, description, developmentArea, dueDate }
//   PATCH /api/children/:childId/tasks/:taskId/status     the child only, { status: 'completed' }

const DEVELOPMENT_AREAS = ['cognitive', 'language', 'motor', 'social-emotional', 'self-care'];

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    developmentArea: row.development_area,
    dueDate: row.due_date,
    status: row.status,
    completedAt: row.completed_at,
    assignedBy: { id: row.assigned_by_user_id, displayName: row.assigned_by_name },
  };
}

const SELECT_TASKS = `
  SELECT tasks.*, users.display_name AS assigned_by_name
  FROM tasks JOIN users ON users.id = tasks.assigned_by_user_id
`;

function tasksRouter(db) {
  const router = express.Router({ mergeParams: true });
  const access = [requireSession, requireChildAccess(db)];
  const findTask = (id) => db.prepare(`${SELECT_TASKS} WHERE tasks.id = ?`).get(id);

  router.get('/', ...access, (req, res) => {
    const mine = req.query.assignedBy === 'me';
    const rows = mine
      ? db.prepare(`${SELECT_TASKS} WHERE child_id = ? AND assigned_by_user_id = ? ORDER BY due_date, tasks.id`)
        .all(req.child.id, req.user.id)
      : db.prepare(`${SELECT_TASKS} WHERE child_id = ? ORDER BY due_date, tasks.id`).all(req.child.id);
    return res.json({ tasks: rows.map(toTask) });
  });

  router.post('/', ...access, requireRole('parent', 'specialist'), (req, res) => {
    const { title, description = '', developmentArea, dueDate } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({ error: 'Title is required (at most 120 characters)' });
    }
    if (typeof description !== 'string' || description.length > 1000) {
      return res.status(400).json({ error: 'Description must be text (at most 1000 characters)' });
    }
    if (!DEVELOPMENT_AREAS.includes(developmentArea)) {
      return res.status(400).json({ error: `developmentArea must be one of: ${DEVELOPMENT_AREAS.join(', ')}` });
    }
    if (!isValidDate(dueDate)) {
      return res.status(400).json({ error: 'dueDate must be a date in the form YYYY-MM-DD' });
    }
    const result = db
      .prepare(
        `INSERT INTO tasks (child_id, assigned_by_user_id, title, description, development_area, due_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(req.child.id, req.user.id, title.trim(), description.trim(), developmentArea, dueDate);
    return res.status(201).json({ task: toTask(findTask(result.lastInsertRowid)) });
  });

  router.patch('/:taskId/status', ...access, requireRole('child'), (req, res) => {
    const taskId = parseId(req.params.taskId);
    if (taskId === null) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    if ((req.body || {}).status !== 'completed') {
      return res.status(400).json({ error: "status must be 'completed'" });
    }
    const task = findTask(taskId);
    if (!task || task.child_id !== req.child.id) {
      return res.status(404).json({ error: 'Task not found' });
    }
    // Completing an already completed task keeps the first completion time.
    db.prepare(
      "UPDATE tasks SET status = 'completed', completed_at = COALESCE(completed_at, ?) WHERE id = ?"
    ).run(new Date().toISOString(), taskId);
    return res.json({ task: toTask(findTask(taskId)) });
  });

  return router;
}

module.exports = { tasksRouter, DEVELOPMENT_AREAS };
