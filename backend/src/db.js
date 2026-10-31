const Database = require('better-sqlite3');

// Opens a SQLite database. ':memory:' is used in tests, a file in development.
function openDatabase(file = process.env.DB_FILE || 'synora.db') {
  return new Database(file);
}

module.exports = { openDatabase };
