const { openDatabase } = require('./db');
const { hashPassword } = require('./auth');

// Synthetic demo accounts and records only. No real personal data is ever stored (NFR-02).
const DEMO_PASSWORD = 'Demo1234!';

const DEMO_USERS = [
  { email: 'parent@synora.test', displayName: 'Demo Parent', role: 'parent' },
  { email: 'teacher@synora.test', displayName: 'Demo Teacher', role: 'specialist' },
  { email: 'therapist@synora.test', displayName: 'Demo Therapist', role: 'specialist' },
  { email: 'child@synora.test', displayName: 'Demo Child', role: 'child' },
];

// Monday of the current week (UTC), as YYYY-MM-DD, shifted by `days`.
function dayOfThisWeek(days, now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7) + days);
  return monday.toISOString().slice(0, 10);
}

// Inserts the demo data. Running it again changes nothing.
// The teacher is NOT linked, so the demo can show linking (M2). The therapist is linked
// and owns a few events and tasks this week, so the schedule and task screens are not empty.
function seed(db, now = new Date()) {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const idOf = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;

  db.transaction(() => {
    for (const u of DEMO_USERS) {
      insertUser.run(u.email, u.displayName, hashPassword(DEMO_PASSWORD), u.role);
    }
    const parent = idOf('parent@synora.test');
    const child = idOf('child@synora.test');
    const therapist = idOf('therapist@synora.test');

    db.prepare('INSERT OR IGNORE INTO child_profiles (parent_user_id, child_user_id) VALUES (?, ?)').run(parent, child);
    const childId = db.prepare('SELECT id FROM child_profiles WHERE child_user_id = ?').get(child).id;
    db.prepare(
      'INSERT OR IGNORE INTO specialist_links (child_id, specialist_user_id, specialist_type) VALUES (?, ?, ?)'
    ).run(childId, therapist, 'Speech therapist');

    const hasRecords = db.prepare('SELECT COUNT(*) AS n FROM events WHERE child_id = ?').get(childId).n > 0;
    if (hasRecords) return;

    const addEvent = db.prepare(
      'INSERT INTO events (child_id, created_by_user_id, title, starts_at) VALUES (?, ?, ?, ?)'
    );
    addEvent.run(childId, therapist, 'Speech therapy session', `${dayOfThisWeek(1)}T07:00:00.000Z`);
    addEvent.run(childId, parent, 'Swimming lesson', `${dayOfThisWeek(3)}T13:30:00.000Z`);

    const addTask = db.prepare(
      `INSERT INTO tasks (child_id, assigned_by_user_id, title, description, development_area, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    addTask.run(childId, therapist, 'Name five animals', 'Look at the picture cards and say each animal aloud.', 'language', dayOfThisWeek(4));
    addTask.run(childId, parent, 'Put toys away', 'Tidy the toy box after playing.', 'self-care', dayOfThisWeek(5));
  })();
  return db;
}

if (require.main === module) {
  seed(openDatabase());
  console.log(`Seeded ${DEMO_USERS.length} demo accounts (password: ${DEMO_PASSWORD}).`);
}

module.exports = { seed, DEMO_USERS, DEMO_PASSWORD, dayOfThisWeek };
