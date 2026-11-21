const request = require('supertest');
const { createApp } = require('../src/app');
const { openDatabase } = require('../src/db');
const { signToken } = require('../src/auth');

// Builds an in-memory app with one child, its parent, a linked and an unlinked specialist,
// and another family. Returns helpers that send requests as each user.
function family() {
  const db = openDatabase(':memory:');
  const add = db.prepare('INSERT INTO users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)');
  const ids = {};
  const user = (name, role) => {
    ids[name] = add.run(`${name}@synora.test`, name, 'x', role).lastInsertRowid;
    return { id: ids[name], role };
  };
  const people = {
    parent: user('parent', 'parent'),
    teacher: user('teacher', 'specialist'),
    stranger: user('stranger', 'specialist'),
    child: user('child', 'child'),
    otherParent: user('otherParent', 'parent'),
    otherChild: user('otherChild', 'child'),
  };
  const addChild = db.prepare('INSERT INTO child_profiles (parent_user_id, child_user_id) VALUES (?, ?)');
  const childId = addChild.run(ids.parent, ids.child).lastInsertRowid;
  const otherChildId = addChild.run(ids.otherParent, ids.otherChild).lastInsertRowid;
  db.prepare('INSERT INTO specialist_links (child_id, specialist_user_id, specialist_type) VALUES (?, ?, ?)')
    .run(childId, ids.teacher, 'Teacher');

  const agent = request(createApp(db));
  const as = (name) => {
    const auth = `Bearer ${signToken(people[name])}`;
    return {
      get: (url) => agent.get(url).set('Authorization', auth),
      post: (url, body) => agent.post(url).set('Authorization', auth).send(body),
      patch: (url, body) => agent.patch(url).set('Authorization', auth).send(body),
      delete: (url) => agent.delete(url).set('Authorization', auth),
    };
  };
  return { db, agent, as, ids, childId, otherChildId };
}

module.exports = { family };
