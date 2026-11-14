const { openDatabase } = require('./db');
const { hashPassword } = require('./auth');

// Synthetic demo accounts only. No real personal data is ever stored (NFR-02).
const DEMO_PASSWORD = 'Demo1234!';

const DEMO_USERS = [
  { email: 'parent@synora.test', displayName: 'Demo Parent', role: 'parent' },
  { email: 'teacher@synora.test', displayName: 'Demo Teacher', role: 'specialist' },
  { email: 'child@synora.test', displayName: 'Demo Child', role: 'child' },
];

// Inserts the demo accounts and the child profile. Running it twice changes nothing.
function seed(db) {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const findUser = db.prepare('SELECT id FROM users WHERE email = ?');

  const run = db.transaction(() => {
    for (const u of DEMO_USERS) {
      insertUser.run(u.email, u.displayName, hashPassword(DEMO_PASSWORD), u.role);
    }
    const parent = findUser.get('parent@synora.test');
    const child = findUser.get('child@synora.test');
    db.prepare(
      'INSERT OR IGNORE INTO child_profiles (parent_user_id, child_user_id) VALUES (?, ?)'
    ).run(parent.id, child.id);
  });
  run();
  return db;
}

if (require.main === module) {
  seed(openDatabase());
  console.log(`Seeded ${DEMO_USERS.length} demo accounts (password: ${DEMO_PASSWORD}).`);
}

module.exports = { seed, DEMO_USERS, DEMO_PASSWORD };
