const Database = require('better-sqlite3');

// Tables needed for M1 (login and roles). Later modules add their own tables here.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child'))
  );

  CREATE TABLE IF NOT EXISTS child_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_user_id INTEGER NOT NULL REFERENCES users(id),
    child_user_id INTEGER NOT NULL UNIQUE REFERENCES users(id)
  );
`;

function createSchema(db) {
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

// Opens a SQLite database and creates the tables. ':memory:' is used in tests, a file in development.
function openDatabase(file = process.env.DB_FILE || 'synora.db') {
  return createSchema(new Database(file));
}

module.exports = { openDatabase, createSchema };
