const { family } = require('./helpers');

const url = (childId) => `/api/children/${childId}/tasks`;
const task = {
  title: 'Read a picture book',
  description: 'Read together for 15 minutes',
  developmentArea: 'language',
  dueDate: '2026-11-27',
};

describe('M4 tasks API', () => {
  test('a linked specialist assigns, the child completes, the assigner sees the status (Flow 2)', async () => {
    const { as, childId } = family();
    const created = await as('teacher').post(url(childId), task).expect(201);
    expect(created.body.task).toMatchObject({ ...task, status: 'pending', completedAt: null });
    expect(created.body.task.assignedBy.displayName).toBe('teacher');

    const childView = await as('child').get(url(childId)).expect(200);
    expect(childView.body.tasks).toHaveLength(1);

    const done = await as('child')
      .patch(`${url(childId)}/${created.body.task.id}/status`, { status: 'completed' })
      .expect(200);
    expect(done.body.task.status).toBe('completed');
    expect(done.body.task.completedAt).toEqual(expect.any(String));

    const mine = await as('teacher').get(`${url(childId)}?assignedBy=me`).expect(200);
    expect(mine.body.tasks.map((t) => t.status)).toEqual(['completed']);
  });

  test('assignedBy=me shows only the caller’s tasks', async () => {
    const { as, childId } = family();
    await as('teacher').post(url(childId), task).expect(201);
    await as('parent').post(url(childId), { ...task, title: 'Tidy toys', developmentArea: 'self-care' }).expect(201);
    expect((await as('parent').get(`${url(childId)}?assignedBy=me`)).body.tasks.map((t) => t.title)).toEqual(['Tidy toys']);
    expect((await as('parent').get(url(childId))).body.tasks).toHaveLength(2);
  });

  test('completing twice keeps the completed status and the first completion time', async () => {
    const { as, childId } = family();
    const { body } = await as('parent').post(url(childId), task);
    const path = `${url(childId)}/${body.task.id}/status`;
    const first = await as('child').patch(path, { status: 'completed' }).expect(200);
    const second = await as('child').patch(path, { status: 'completed' }).expect(200);
    expect(second.body.task.completedAt).toBe(first.body.task.completedAt);
  });

  test('only the child can change the status', async () => {
    const { as, childId } = family();
    const { body } = await as('parent').post(url(childId), task);
    const path = `${url(childId)}/${body.task.id}/status`;
    await as('parent').patch(path, { status: 'completed' }).expect(403);
    await as('teacher').patch(path, { status: 'completed' }).expect(403);
  });

  test('a child cannot see or complete another child’s tasks', async () => {
    const { as, childId, otherChildId } = family();
    const { body } = await as('parent').post(url(childId), task);
    await as('otherChild').get(url(childId)).expect(403);
    await as('otherChild').patch(`${url(childId)}/${body.task.id}/status`, { status: 'completed' }).expect(403);
    // The task ID exists, but not for this child.
    await as('otherChild').patch(`${url(otherChildId)}/${body.task.id}/status`, { status: 'completed' }).expect(404);
  });

  test('the child cannot assign tasks; strangers are denied', async () => {
    const { as, childId } = family();
    await as('child').post(url(childId), task).expect(403);
    await as('stranger').get(url(childId)).expect(403);
    await as('stranger').post(url(childId), task).expect(403);
  });

  test.each([
    [{ ...task, title: '' }],
    [{ ...task, title: 'x'.repeat(121) }],
    [{ ...task, description: 42 }],
    [{ ...task, developmentArea: 'music' }],
    [{ ...task, dueDate: '2026-02-30' }],
    [{ ...task, dueDate: undefined }],
  ])('rejects invalid task %#', async (body) => {
    const { as, childId } = family();
    await as('parent').post(url(childId), body).expect(400);
  });

  test('rejects an invalid status change', async () => {
    const { as, childId } = family();
    const { body } = await as('parent').post(url(childId), task);
    await as('child').patch(`${url(childId)}/${body.task.id}/status`, { status: 'pending' }).expect(400);
    await as('child').patch(`${url(childId)}/abc/status`, { status: 'completed' }).expect(400);
    await as('child').patch(`${url(childId)}/999/status`, { status: 'completed' }).expect(404);
  });
});

test('Flow 1: after the parent unlinks a specialist, the same JWT can no longer load tasks', async () => {
  const { as, childId } = family();
  await as('teacher').get(url(childId)).expect(200);
  const { specialists } = (await as('parent').get(`/api/children/${childId}/specialists`)).body;
  await as('parent').delete(`/api/children/${childId}/specialists/${specialists[0].id}`).expect(204);
  await as('teacher').get(url(childId)).expect(403);
  await as('teacher').post(url(childId), task).expect(403);
});
