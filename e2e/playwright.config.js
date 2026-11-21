// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// Starts a fresh seeded backend (port 3001, its own SQLite file) and the Vite dev server
// (port 5173, which proxies /api to the backend), then runs the tests in Chromium.
const backend = path.join(__dirname, '..', 'backend');
const frontend = path.join(__dirname, '..', 'frontend');
const dbFile = path.join(__dirname, 'e2e.db');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Optional: use an already installed Chromium (e.g. CHROMIUM_PATH=/usr/bin/chromium).
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
      },
    },
  ],
  webServer: [
    {
      command: `node -e "require('fs').rmSync('${dbFile}', { force: true })" && node src/seed.js && node src/server.js`,
      cwd: backend,
      env: { DB_FILE: dbFile, PORT: '3001', JWT_SECRET: 'e2e-secret' },
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npx vite --port 5173 --strictPort',
      cwd: frontend,
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
