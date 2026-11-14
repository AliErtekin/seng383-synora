const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TOKEN_LIFETIME = '8h';

// The secret comes from the environment. The fallback is only for local development and tests.
function getSecret() {
  return process.env.JWT_SECRET || 'synora-dev-secret-change-me';
}

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, getSecret(), { expiresIn: TOKEN_LIFETIME });
}

// Express middleware: accepts only requests with a valid "Authorization: Bearer <token>" header.
// On success it sets req.user = { id, role }. Otherwise it answers 401 (FR-M1-04).
function requireSession(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, getSecret());
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Express middleware factory: allows only the listed roles. Use after requireSession (FR-M1-03).
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return next();
  };
}

module.exports = { hashPassword, verifyPassword, signToken, requireSession, requireRole };
