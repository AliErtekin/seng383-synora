const express = require('express');
const cors = require('cors');

// Builds the Express app. The database is injected so tests can use an in-memory one.
function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check: proves the API is up and that the database answers a query.
  app.get('/api/health', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(500).json({ status: 'error' });
    }
  });

  return app;
}

module.exports = { createApp };
