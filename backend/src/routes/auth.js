const express = require('express');
const { verifyPassword, signToken, requireSession } = require('../auth');

// M1 – Login and roles. The role always comes from the account; the client never chooses it.
function authRouter(db) {
  const router = express.Router();

  function childProfileIdFor(user) {
    if (user.role !== 'child') return null;
    const row = db.prepare('SELECT id FROM child_profiles WHERE child_user_id = ?').get(user.id);
    return row ? row.id : null;
  }

  function publicUser(user) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      childProfileId: childProfileIdFor(user),
    };
  }

  // POST /api/auth/login – email and password in, JWT and account role out (FR-M1-01, FR-M1-02).
  router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.trim().toLowerCase());

    // Same answer for an unknown email and a wrong password, so accounts cannot be guessed.
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  });

  // GET /api/auth/me – the signed-in account, used by the client to pick the role's screens.
  router.get('/me', requireSession, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    return res.json({ user: publicUser(user) });
  });

  return router;
}

module.exports = { authRouter };
