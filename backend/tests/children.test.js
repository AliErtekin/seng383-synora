const request = require('supertest');
const { createApp } = require('../src/app');
const { openDatabase } = require('../src/db');
const { signToken } = require('../src/auth');

let db;
let app;
let tokens;

beforeEach(() => {
  db = openDatabase(':memory:');
  const insert = db.prepare(
    'INSERT INTO users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const addUser = (name, role) => insert.run(`${name}@synora.test`, name, 'unused', role).lastInsertRowid;
  const parent = addUser('parent', 'parent');
  const otherParent = addUser('other-parent', 'parent');
  const specialist = addUser('teacher', 'specialist');
  const child = addUser('child', 'child');
  const sibling = addUser('sibling', 'child');
  const otherChild = addUser('other-child', 'child');
  const addChild = db.prepare('INSERT INTO child_profiles (parent_user_id, child_user_id) VALUES (?, ?)');
  addChild.run(parent, child);
  addChild.run(otherParent, otherChild);
  addChild.run(parent, sibling);

  tokens = {
    parent: signToken({ id: parent, role: 'parent' }),
    specialist: signToken({ id: specialist, role: 'specialist' }),
    child: signToken({ id: child, role: 'child' }),
  };
  app = request(createApp(db));
});

afterEach(() => db.close());

function as(role, method, path) {
  return app[method](path).set('Authorization', `Bearer ${tokens[role]}`);
}

const childrenPath = '/api/children';
const linksPath = `${childrenPath}/1/specialists`;
const teacher = { email: '  Teacher@Synora.TEST ', specialistType: 'Teacher' };

test('each parent sees only their children and a specialist sees current links', async () => {
  expect((await as('parent', 'get', childrenPath).expect(200)).body.children).toEqual([
    { id: 1, displayName: 'child' }, { id: 3, displayName: 'sibling' },
  ]);
  expect((await as('specialist', 'get', childrenPath).expect(200)).body.children).toEqual([]);

  const created = await as('parent', 'post', linksPath).send(teacher).expect(201);
  const link = created.body.specialist;
  expect(link).toMatchObject({ email: 'teacher@synora.test', specialistType: 'Teacher' });
  expect((await as('parent', 'get', linksPath).expect(200)).body.specialists).toEqual([link]);
  expect((await as('specialist', 'get', childrenPath).expect(200)).body.children).toEqual([
    { id: 1, displayName: 'child' },
  ]);

  await as('parent', 'delete', `${childrenPath}/3/specialists/${link.id}`).expect(404);
  await as('parent', 'delete', `${linksPath}/${link.id}`).expect(204);
  expect((await as('specialist', 'get', childrenPath).expect(200)).body.children).toEqual([]);
  expect((await as('parent', 'get', linksPath).expect(200)).body.specialists).toEqual([]);
});

test('only the owning parent can manage specialist links', async () => {
  await app.get(childrenPath).expect(401);
  await as('child', 'get', childrenPath).expect(403);
  await as('specialist', 'get', linksPath).expect(403);
  const otherLinks = `${childrenPath}/2/specialists`;
  await as('parent', 'get', otherLinks).expect(404);
  await as('parent', 'post', otherLinks).send(teacher).expect(404);
  await as('parent', 'delete', `${otherLinks}/1`).expect(404);
});

test('invalid IDs, unregistered or non-specialist accounts, and duplicate links are rejected', async () => {
  await as('parent', 'get', `${childrenPath}/1.5/specialists`).expect(400);
  await as('parent', 'delete', `${linksPath}/0`).expect(400);
  await as('parent', 'post', linksPath).send({ email: teacher.email }).expect(400);
  await as('parent', 'post', linksPath).send({ ...teacher, email: 'unknown@synora.test' }).expect(404);
  await as('parent', 'post', linksPath).send({ ...teacher, email: 'child@synora.test' }).expect(404);
  await as('parent', 'post', linksPath).send(teacher).expect(201);
  await as('parent', 'post', linksPath).send(teacher).expect(409);
  expect((await as('parent', 'get', linksPath).expect(200)).body.specialists).toHaveLength(1);
});
