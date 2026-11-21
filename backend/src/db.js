const Database = require('better-sqlite3');

// Shared SQLite schema. New tables are created when an existing database is opened.
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

  CREATE TABLE IF NOT EXISTS specialist_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL REFERENCES child_profiles(id),
    specialist_user_id INTEGER NOT NULL REFERENCES users(id),
    specialist_type TEXT NOT NULL,
    UNIQUE (child_id, specialist_user_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL REFERENCES child_profiles(id),
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL
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
