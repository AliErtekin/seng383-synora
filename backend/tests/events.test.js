const { family } = require('./helpers');

const url = (childId) => `/api/children/${childId}/events`;

describe('M3 events API', () => {
  test('parent and linked specialist add events; everyone with access sees the week', async () => {
    const { as, childId } = family();
    const a = await as('parent').post(url(childId), { title: 'Speech therapy', startsAt: '2026-11-24T10:00:00+03:00' });
    expect(a.status).toBe(201);
    expect(a.body.event).toMatchObject({ title: 'Speech therapy', startsAt: '2026-11-24T07:00:00.000Z' });
    await as('teacher').post(url(childId), { title: 'Reading class', startsAt: '2026-11-23T09:30:00+03:00' }).expect(201);
    await as('parent').post(url(childId), { title: 'Next week', startsAt: '2026-12-01T09:00:00+03:00' }).expect(201);

    for (const who of ['parent', 'teacher', 'child']) {
      const res = await as(who).get(`${url(childId)}?weekStart=2026-11-23&tz=180`).expect(200);
      expect(res.body.events.map((e) => e.title)).toEqual(['Reading class', 'Speech therapy']);
    }
  });

  test('uses the viewer time zone for the week boundary', async () => {
    const { as, childId } = family();
    // 01:00 on Monday in Istanbul is still Sunday in UTC.
    await as('parent').post(url(childId), { title: 'Early', startsAt: '2026-11-23T01:00:00+03:00' }).expect(201);
    const local = await as('parent').get(`${url(childId)}?weekStart=2026-11-23&tz=180`);
    const utc = await as('parent').get(`${url(childId)}?weekStart=2026-11-23`);
    expect(local.body.events).toHaveLength(1);
    expect(utc.body.events).toHaveLength(0);
  });

  test('the child cannot add events', async () => {
    const { as, childId } = family();
    await as('child').post(url(childId), { title: 'x', startsAt: '2026-11-24T10:00:00Z' }).expect(403);
  });

  test.each(['stranger', 'otherParent', 'otherChild'])('denies %s', async (who) => {
    const { as, childId } = family();
    await as(who).get(`${url(childId)}?weekStart=2026-11-23`).expect(403);
    await as(who).post(url(childId), { title: 'x', startsAt: '2026-11-24T10:00:00Z' }).expect(403);
  });

  test.each([
    [{ startsAt: '2026-11-24T10:00:00Z' }],
    [{ title: '   ', startsAt: '2026-11-24T10:00:00Z' }],
    [{ title: 'x'.repeat(121), startsAt: '2026-11-24T10:00:00Z' }],
    [{ title: 'No offset', startsAt: '2026-11-24T10:00:00' }],
    [{ title: 'Bad date', startsAt: 'tomorrow' }],
  ])('rejects invalid input %j', async (body) => {
    const { as, childId } = family();
    await as('parent').post(url(childId), body).expect(400);
  });

  test.each(['', '?weekStart=2026-13-01', '?weekStart=23-11-2026', '?weekStart=2026-11-23&tz=abc'])(
    'rejects an invalid week query %s',
    async (query) => {
      const { as, childId } = family();
      await as('parent').get(`${url(childId)}${query}`).expect(400);
    }
  );
});
