const express = require('express');
const { requireSession, requireRole } = require('../auth');

function parseId(value) {
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) ? id : null;
}

function childrenRouter(db) {
  const router = express.Router();
  const readChildren = [requireSession, requireRole('parent', 'specialist')];
  const manageLinks = [requireSession, requireRole('parent')];
  const specialistsPath = '/:childId/specialists';

  function requireOwnedChild(req, res, next) {
    const childId = parseId(req.params.childId);
    if (childId === null) {
      return res.status(400).json({ error: 'Invalid child ID' });
    }

    const child = db.prepare(
      'SELECT id FROM child_profiles WHERE id = ? AND parent_user_id = ?'
    ).get(childId, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child profile not found' });
    }

    req.childId = child.id;
    return next();
  }

  router.get('/', ...readChildren, (req, res) => {
    const selectChildren = `
      SELECT child_profiles.id, users.display_name AS displayName
      FROM child_profiles
      JOIN users ON users.id = child_profiles.child_user_id
    `;

    const children = req.user.role === 'parent'
      ? db.prepare(`${selectChildren} WHERE parent_user_id = ? ORDER BY child_profiles.id`)
        .all(req.user.id)
      : db.prepare(`
        ${selectChildren}
        JOIN specialist_links ON specialist_links.child_id = child_profiles.id
        WHERE specialist_links.specialist_user_id = ?
        ORDER BY child_profiles.id
      `).all(req.user.id);

    return res.json({ children });
  });

  router.get(specialistsPath, ...manageLinks, requireOwnedChild, (req, res) => {
    const specialists = db.prepare(`
      SELECT specialist_links.id, users.id AS specialistUserId, users.email,
        users.display_name AS displayName, specialist_links.specialist_type AS specialistType
      FROM specialist_links
      JOIN users ON users.id = specialist_links.specialist_user_id
      WHERE specialist_links.child_id = ?
      ORDER BY specialist_links.id
    `).all(req.childId);

    return res.json({ specialists });
  });

  router.post(specialistsPath, ...manageLinks, requireOwnedChild, (req, res) => {
    const { email, specialistType } = req.body || {};
    if (typeof email !== 'string' || !email.trim()
      || typeof specialistType !== 'string' || !specialistType.trim()) {
      return res.status(400).json({ error: 'Email and specialist type are required' });
    }

    const specialist = db.prepare(`
      SELECT id AS specialistUserId, email, display_name AS displayName
      FROM users
      WHERE email = ? AND role = 'specialist'
    `).get(email.trim().toLowerCase());

    if (!specialist) {
      return res.status(404).json({ error: 'No registered specialist found for this email' });
    }

    const type = specialistType.trim();
    const result = db.prepare(`
      INSERT INTO specialist_links (child_id, specialist_user_id, specialist_type)
      VALUES (?, ?, ?)
      ON CONFLICT (child_id, specialist_user_id) DO NOTHING
    `).run(req.childId, specialist.specialistUserId, type);

    if (!result.changes) {
      return res.status(409).json({ error: 'Specialist is already linked to this child' });
    }

    return res.status(201).json({
      specialist: { id: result.lastInsertRowid, ...specialist, specialistType: type },
    });
  });

  router.delete(`${specialistsPath}/:linkId`, ...manageLinks, requireOwnedChild, (req, res) => {
    const linkId = parseId(req.params.linkId);
    if (linkId === null) {
      return res.status(400).json({ error: 'Invalid link ID' });
    }

    const result = db.prepare(
      'DELETE FROM specialist_links WHERE id = ? AND child_id = ?'
    ).run(linkId, req.childId);
    if (!result.changes) {
      return res.status(404).json({ error: 'Specialist link not found' });
    }

    return res.status(204).end();
  });

  return router;
}

module.exports = { childrenRouter };
