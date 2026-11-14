const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { openDatabase } = require('../src/db');
const { seed, DEMO_PASSWORD } = require('../src/seed');
const { requireSession, requireRole } = require('../src/auth');

function seededApp() {
  const db = seed(openDatabase(':memory:'));
  return { app: createApp(db), db };
}

async function login(app, email, password = DEMO_PASSWORD) {
  return request(app).post('/api/auth/login').send({ email, password });
}

describe('POST /api/auth/login', () => {
  test('returns a token and the role stored on the account', async () => {
    const { app } = seededApp();
    const res = await login(app, 'parent@synora.test');
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: 'parent@synora.test', role: 'parent', childProfileId: null });
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('returns the child profile id for a child account', async () => {
    const { app } = seededApp();
    const res = await login(app, 'child@synora.test');
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('child');
    expect(res.body.user.childProfileId).toEqual(expect.any(Number));
  });

  test('ignores a role sent by the client', async () => {
    const { app } = seededApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'child@synora.test', password: DEMO_PASSWORD, role: 'parent' });
    expect(res.body.user.role).toBe('child');
  });

  test('accepts the email in any letter case', async () => {
    const { app } = seededApp();
    const res = await login(app, '  Teacher@Synora.TEST ');
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('specialist');
  });

  test('rejects a wrong password with 401', async () => {
    const { app } = seededApp();
    const res = await login(app, 'parent@synora.test', 'wrong');
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('gives the same 401 for an unknown email', async () => {
    const { app } = seededApp();
    const res = await login(app, 'nobody@synora.test');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test.each([
    [{}],
    [{ email: 'parent@synora.test' }],
    [{ password: DEMO_PASSWORD }],
    [{ email: '   ', password: DEMO_PASSWORD }],
    [{ email: 42, password: DEMO_PASSWORD }],
  ])('rejects missing or invalid input %j with 400', async (body) => {
    const { app } = seededApp();
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  test('returns the signed-in account for a valid token', async () => {
    const { app } = seededApp();
    const { body } = await login(app, 'teacher@synora.test');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'teacher@synora.test', role: 'specialist' });
  });

  test('rejects a request without a token', async () => {
    const { app } = seededApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects a token with a wrong signature', async () => {
    const { app } = seededApp();
    const forged = jwt.sign({ sub: 1, role: 'parent' }, 'not-the-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('rejects an expired token', async () => {
    const { app } = seededApp();
    const expired = jwt.sign({ sub: 1, role: 'parent' }, 'synora-dev-secret-change-me', { expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  test('rejects a valid token for a deleted account', async () => {
    const { app, db } = seededApp();
    const { body } = await login(app, 'teacher@synora.test');
    db.prepare('DELETE FROM users WHERE email = ?').run('teacher@synora.test');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(401);
  });
});

describe('requireRole', () => {
  function roleApp() {
    const { app: base } = seededApp();
    const app = express();
    app.get('/parent-only', requireSession, requireRole('parent'), (req, res) => res.json({ ok: true }));
    return { base, app };
  }

  test('lets the allowed role through', async () => {
    const { base, app } = roleApp();
    const { body } = await login(base, 'parent@synora.test');
    const res = await request(app).get('/parent-only').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
  });

  test('answers 403 to another role', async () => {
    const { base, app } = roleApp();
    const { body } = await login(base, 'child@synora.test');
    const res = await request(app).get('/parent-only').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(403);
  });
});

describe('seed', () => {
  test('can run twice without duplicating accounts', () => {
    const db = seed(seed(openDatabase(':memory:')));
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(3);
    expect(db.prepare('SELECT COUNT(*) AS n FROM child_profiles').get().n).toBe(1);
  });
});
