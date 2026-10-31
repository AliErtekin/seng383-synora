const { createApp } = require('./app');
const { openDatabase } = require('./db');

const PORT = process.env.PORT || 3001;
const app = createApp(openDatabase());

app.listen(PORT, () => {
  console.log(`SYNORA backend listening on http://localhost:${PORT}`);
});
