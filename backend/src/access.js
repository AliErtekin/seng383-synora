// Child-scoped access check (M2, FR-M2-05).
// A request about a child is allowed only for:
//   - the parent who owns the child profile,
//   - a specialist with a CURRENT link to the child (a valid JWT is not enough),
//   - the child's own account.
// Use after requireSession. Sets req.child = { id, parentUserId, childUserId }.

function parseId(value) {
  return /^[1-9]\d*$/.test(String(value)) ? Number(value) : null;
}

function canAccessChild(db, user, child) {
  if (user.role === 'parent') return child.parent_user_id === user.id;
  if (user.role === 'child') return child.child_user_id === user.id;
  if (user.role === 'specialist') {
    const link = db
      .prepare('SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_user_id = ?')
      .get(child.id, user.id);
    return Boolean(link);
  }
  return false;
}

function requireChildAccess(db) {
  return (req, res, next) => {
    const childId = parseId(req.params.childId);
    if (childId === null) {
      return res.status(400).json({ error: 'Invalid child ID' });
    }
    const child = db.prepare('SELECT * FROM child_profiles WHERE id = ?').get(childId);
    if (!child) {
      return res.status(404).json({ error: 'Child profile not found' });
    }
    if (!canAccessChild(db, req.user, child)) {
      return res.status(403).json({ error: 'You do not have access to this child' });
    }
    req.child = { id: child.id, parentUserId: child.parent_user_id, childUserId: child.child_user_id };
    return next();
  };
}

module.exports = { requireChildAccess, canAccessChild, parseId };
