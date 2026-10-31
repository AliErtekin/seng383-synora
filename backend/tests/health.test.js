const request = require('supertest');
const { createApp } = require('../src/app');
const { openDatabase } = require('../src/db');

describe('GET /api/health', () => {
  test('returns status ok when the database answers', async () => {
    const app = createApp(openDatabase(':memory:'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('returns 500 when the database fails', async () => {
    const brokenDb = {
      prepare() {
        throw new Error('db down');
      },
    };
    const res = await request(createApp(brokenDb)).get('/api/health');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: 'error' });
  });
});
