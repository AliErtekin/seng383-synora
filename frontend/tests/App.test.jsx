import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import App from '../src/App.jsx';
import { mockApi } from './mockApi.js';

const accounts = {
  'parent@synora.test': { id: 1, displayName: 'Demo Parent', role: 'parent', childProfileId: null },
  'teacher@synora.test': { id: 2, displayName: 'Demo Teacher', role: 'specialist', childProfileId: null },
  'child@synora.test': { id: 4, displayName: 'Demo Child', role: 'child', childProfileId: 1 },
};

function routes(extra = {}) {
  return {
    'POST /api/auth/login': ({ email, password }) =>
      accounts[email] && password === 'Demo1234!'
        ? [200, { token: `token-${email}`, user: accounts[email] }]
        : [401, { error: 'Invalid email or password' }],
    'GET /api/children': () => [200, { children: [{ id: 1, displayName: 'Demo Child' }] }],
    'GET /api/children/1/events': () => [200, { events: [] }],
    'GET /api/children/1/tasks': () => [200, { tasks: [] }],
    'GET /api/children/1/specialists': () => [200, { specialists: [] }],
    ...extra,
  };
}

async function login(email, password = 'Demo1234!') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('M1 login and role-based screens', () => {
  test('shows an error for wrong credentials and stays on the login page', async () => {
    mockApi(routes());
    render(<App />);
    await login('parent@synora.test', 'wrong');
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('a parent sees Schedule, Tasks and Specialists and the token is sent afterwards', async () => {
    const calls = mockApi(routes());
    render(<App />);
    await login('parent@synora.test');
    expect(await screen.findByRole('tab', { name: 'Specialists' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByTestId('current-user')).toHaveTextContent('Demo Parent');
    const childrenCall = calls.find((c) => c.url === '/api/children');
    expect(childrenCall.headers.Authorization).toBe('Bearer token-parent@synora.test');
  });

  test('a specialist does not get the Specialists tab', async () => {
    mockApi(routes());
    render(<App />);
    await login('teacher@synora.test');
    expect(await screen.findByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Specialists' })).not.toBeInTheDocument();
  });

  test('an unlinked specialist is told they have no children', async () => {
    mockApi(routes({ 'GET /api/children': () => [200, { children: [] }] }));
    render(<App />);
    await login('teacher@synora.test');
    expect(await screen.findByTestId('no-children')).toHaveTextContent('not linked to any child');
  });

  test('a child sees only their tasks and upcoming events, without tabs', async () => {
    mockApi(routes());
    render(<App />);
    await login('child@synora.test');
    expect(await screen.findByRole('heading', { name: 'My tasks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming events' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByText('Assign a task')).not.toBeInTheDocument();
  });

  test('restores the session from the stored token and logs out', async () => {
    localStorage.setItem('synora.token', 'saved');
    mockApi(routes({ 'GET /api/auth/me': () => [200, { user: accounts['parent@synora.test'] }] }));
    render(<App />);
    expect(await screen.findByTestId('current-user')).toHaveTextContent('Demo Parent');
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(localStorage.getItem('synora.token')).toBeNull();
  });

  test('an expired stored token returns to the login page', async () => {
    localStorage.setItem('synora.token', 'expired');
    mockApi(routes({ 'GET /api/auth/me': () => [401, { error: 'Invalid or expired token' }] }));
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('explains when the backend cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    render(<App />);
    await login('parent@synora.test');
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
  });
});
