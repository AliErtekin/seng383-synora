const request = require('supertest');
const express = require('express');
const { openDatabase } = require('../src/db');
const { signToken, requireSession } = require('../src/auth');
const { requireChildAccess } = require('../src/access');

function setup() {
  const db = openDatabase(':memory:');
  const add = db.prepare('INSERT INTO users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)');
  const id = (name, role) => add.run(`${name}@synora.test`, name, 'x', role).lastInsertRowid;
  const users = {
    parent: id('parent', 'parent'),
    otherParent: id('other-parent', 'parent'),
    linked: id('linked', 'specialist'),
    unlinked: id('unlinked', 'specialist'),
    child: id('child', 'child'),
    otherChild: id('other-child', 'child'),
  };
  const childId = db
    .prepare('INSERT INTO child_profiles (parent_user_id, child_user_id) VALUES (?, ?)')
    .run(users.parent, users.child).lastInsertRowid;
  db.prepare('INSERT INTO child_profiles (parent_user_id, child_user_id) VALUES (?, ?)')
    .run(users.otherParent, users.otherChild);
  db.prepare('INSERT INTO specialist_links (child_id, specialist_user_id, specialist_type) VALUES (?, ?, ?)')
    .run(childId, users.linked, 'Teacher');

  const app = express();
  app.get('/children/:childId', requireSession, requireChildAccess(db), (req, res) => res.json(req.child));
  const token = (name, role) => `Bearer ${signToken({ id: users[name], role })}`;
  return { db, app, childId, users, token };
}

describe('requireChildAccess', () => {
  test.each([
    ['parent', 'parent'],
    ['linked', 'specialist'],
    ['child', 'child'],
  ])('allows the %s', async (name, role) => {
    const { app, childId, token } = setup();
    const res = await request(app).get(`/children/${childId}`).set('Authorization', token(name, role));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(childId);
  });

  test.each([
    ['otherParent', 'parent'],
    ['unlinked', 'specialist'],
    ['otherChild', 'child'],
  ])('denies the %s with 403', async (name, role) => {
    const { app, childId, token } = setup();
    const res = await request(app).get(`/children/${childId}`).set('Authorization', token(name, role));
    expect(res.status).toBe(403);
  });

  test('denies a specialist whose link was removed, even with a still-valid JWT', async () => {
    const { app, db, childId, token } = setup();
    const auth = token('linked', 'specialist');
    await request(app).get(`/children/${childId}`).set('Authorization', auth).expect(200);
    db.prepare('DELETE FROM specialist_links').run();
    await request(app).get(`/children/${childId}`).set('Authorization', auth).expect(403);
  });

  test('answers 404 for a missing child and 400 for an invalid ID', async () => {
    const { app, token } = setup();
    await request(app).get('/children/999').set('Authorization', token('parent', 'parent')).expect(404);
    await request(app).get('/children/abc').set('Authorization', token('parent', 'parent')).expect(400);
  });

  test('answers 401 without a token', async () => {
    const { app, childId } = setup();
    await request(app).get(`/children/${childId}`).expect(401);
  });
});
