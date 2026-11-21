// @ts-check
const { test, expect } = require('@playwright/test');

// First end-to-end test (v0.1): SRS Flow 1 and Flow 2 through the real UI and API.
// Uses only the synthetic demo accounts from `npm run seed`.
const PASSWORD = 'Demo1234!';

async function login(page, email) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

async function logout(page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
}

test('parent links a specialist, specialist assigns a task, child completes it, parent unlinks', async ({ page }) => {
  const taskTitle = `Draw a circle ${Date.now()}`;

  // M1 + M2: wrong password is rejected; the parent links the teacher.
  await page.goto('/');
  await page.getByLabel('Email').fill('parent@synora.test');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password');

  await login(page, 'parent@synora.test');
  await expect(page.getByTestId('current-user')).toContainText('parent');
  await page.getByRole('tab', { name: 'Specialists' }).click();
  await page.getByLabel('Specialist email').fill('teacher@synora.test');
  await page.getByLabel('Specialist type').fill('Teacher');
  await page.getByRole('button', { name: 'Link specialist' }).click();
  await expect(page.getByRole('list', { name: 'Linked specialists' })).toContainText('Demo Teacher');
  await logout(page);

  // M2 + M3 + M4: the teacher now sees the child, the seeded schedule, and assigns a task.
  await login(page, 'teacher@synora.test');
  await expect(page.getByRole('tab', { name: 'Specialists' })).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Events' })).toContainText('Speech therapy session');
  await page.getByRole('tab', { name: 'Tasks' }).click();
  await page.getByLabel('Task title').fill(taskTitle);
  await page.getByLabel('Development area').selectOption('motor');
  await page.getByRole('button', { name: 'Assign task' }).click();
  const teacherTask = page.getByTestId('task').filter({ hasText: taskTitle });
  await expect(teacherTask.getByTestId('task-status')).toHaveText('Pending');
  await logout(page);

  // M4: the child sees only their tasks and marks the new one as done.
  await login(page, 'child@synora.test');
  await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.getByRole('button', { name: `Mark "${taskTitle}" as done` }).click();
  await expect(page.getByTestId('task').filter({ hasText: taskTitle }).getByTestId('task-status')).toHaveText('Completed');
  await logout(page);

  // M4: the teacher sees "Completed" for the task they assigned (Flow 2).
  await login(page, 'teacher@synora.test');
  await page.getByRole('tab', { name: 'Tasks' }).click();
  await page.getByLabel('Only tasks I assigned').check();
  await expect(page.getByTestId('task')).toHaveCount(1);
  await expect(page.getByTestId('task').getByTestId('task-status')).toHaveText('Completed');
  const teacherToken = await page.evaluate(() => localStorage.getItem('synora.token'));
  await logout(page);

  // M2: the parent unlinks the teacher after confirming (Flow 1).
  await login(page, 'parent@synora.test');
  await page.getByRole('tab', { name: 'Specialists' }).click();
  const teacherRow = page.getByRole('listitem').filter({ hasText: 'Demo Teacher' });
  await teacherRow.getByRole('button', { name: 'Unlink' }).click();
  await teacherRow.getByRole('button', { name: 'Yes, unlink' }).click();
  await expect(page.getByRole('list', { name: 'Linked specialists' })).not.toContainText('Demo Teacher');
  await logout(page);

  // FR-M2-05: the teacher's still-valid JWT is now refused for the child's tasks.
  const denied = await page.request.get('/api/children/1/tasks', {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  expect(denied.status()).toBe(403);

  // ...and the teacher no longer sees the child.
  await login(page, 'teacher@synora.test');
  await expect(page.getByTestId('no-children')).toBeVisible();
});
