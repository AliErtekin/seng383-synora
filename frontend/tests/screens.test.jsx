import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Specialists from '../src/components/Specialists.jsx';
import Tasks from '../src/components/Tasks.jsx';
import Schedule from '../src/components/Schedule.jsx';
import { mockApi } from './mockApi.js';
import { localDateTimeWithOffset, mondayOf, toDateString } from '../src/dates.js';

afterEach(() => vi.unstubAllGlobals());

const parent = { id: 1, role: 'parent', displayName: 'Demo Parent' };
const child = { id: 4, role: 'child', displayName: 'Demo Child', childProfileId: 1 };

describe('M2 Specialists screen', () => {
  test('links a specialist, shows errors and unlinks after confirmation', async () => {
    let links = [];
    const calls = mockApi({
      'GET /api/children/1/specialists': () => [200, { specialists: links }],
      'POST /api/children/1/specialists': ({ email, specialistType }) => {
        if (email !== 'teacher@synora.test') return [404, { error: 'No registered specialist found for this email' }];
        links = [{ id: 7, email, displayName: 'Demo Teacher', specialistType }];
        return [201, { specialist: links[0] }];
      },
      'DELETE /api/children/1/specialists/7': () => {
        links = [];
        return [204, null];
      },
    });
    render(<Specialists childId={1} />);
    expect(await screen.findByText('No specialists linked yet.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Specialist email'), { target: { value: 'nobody@synora.test' } });
    fireEvent.change(screen.getByLabelText('Specialist type'), { target: { value: 'Teacher' } });
    fireEvent.click(screen.getByRole('button', { name: 'Link specialist' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No registered specialist');

    fireEvent.change(screen.getByLabelText('Specialist email'), { target: { value: 'teacher@synora.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Link specialist' }));
    const list = await screen.findByRole('list', { name: 'Linked specialists' });
    expect(within(list).getByText('Demo Teacher')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, unlink' }));
    expect(await screen.findByText('No specialists linked yet.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('can no longer see');
  });
});

describe('M4 Tasks screen', () => {
  const pending = {
    id: 3, title: 'Name five animals', description: '', developmentArea: 'language', dueDate: '2026-11-27',
    status: 'pending', completedAt: null, assignedBy: { id: 2, displayName: 'Demo Teacher' },
  };

  test('a parent assigns a task and can filter to their own tasks', async () => {
    let tasks = [pending];
    const calls = mockApi({
      'GET /api/children/1/tasks': () => [200, { tasks }],
      'GET /api/children/1/tasks?assignedBy=me': () => [200, { tasks: tasks.filter((t) => t.assignedBy.id === 1) }],
      'POST /api/children/1/tasks': (body) => {
        const task = { ...body, id: 9, status: 'pending', completedAt: null, assignedBy: { id: 1, displayName: 'Demo Parent' } };
        tasks = [...tasks, task];
        return [201, { task }];
      },
    });
    render(<Tasks childId={1} user={parent} />);
    expect(await screen.findByText('Name five animals')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Put toys away' } });
    fireEvent.change(screen.getByLabelText('Development area'), { target: { value: 'self-care' } });
    fireEvent.click(screen.getByRole('button', { name: 'Assign task' }));
    expect(await screen.findByText('Put toys away')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST').body).toMatchObject({ title: 'Put toys away', developmentArea: 'self-care' });

    fireEvent.click(screen.getByLabelText('Only tasks I assigned'));
    await waitFor(() => expect(screen.queryByText('Name five animals')).not.toBeInTheDocument());
    expect(screen.getByText('Put toys away')).toBeInTheDocument();
  });

  test('a child marks a task as done and cannot assign tasks', async () => {
    let task = pending;
    mockApi({
      'GET /api/children/1/tasks': () => [200, { tasks: [task] }],
      'PATCH /api/children/1/tasks/3/status': () => {
        task = { ...task, status: 'completed' };
        return [200, { task }];
      },
    });
    render(<Tasks childId={1} user={child} />);
    expect(await screen.findByTestId('task-status')).toHaveTextContent('Pending');
    expect(screen.queryByText('Assign a task')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark "Name five animals" as done' }));
    await waitFor(() => expect(screen.getByTestId('task-status')).toHaveTextContent('Completed'));
    expect(screen.queryByRole('button', { name: /Mark/ })).not.toBeInTheDocument();
  });

  test('shows the server error', async () => {
    mockApi({ 'GET /api/children/1/tasks': () => [403, { error: 'You do not have access to this child' }] });
    render(<Tasks childId={1} user={parent} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have access');
  });
});

describe('M3 Schedule screen', () => {
  const week = toDateString(mondayOf());

  test('requests the current week and adds an event with the local offset', async () => {
    let events = [];
    const calls = mockApi({
      'GET /api/children/1/events': () => [200, { events }],
      'POST /api/children/1/events': (body) => {
        events = [{ id: 1, title: body.title, startsAt: new Date(body.startsAt).toISOString() }];
        return [201, { event: events[0] }];
      },
    });
    render(<Schedule childId={1} canAdd />);
    expect(await screen.findByText('No events this week.')).toBeInTheDocument();
    expect(calls[0].url).toContain(`weekStart=${week}`);

    const today = toDateString(new Date());
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Speech therapy' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: today } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '23:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add event' }));
    expect(await screen.findByText('Speech therapy')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST').body.startsAt).toBe(localDateTimeWithOffset(today, '23:30'));
  });

  test('moves between weeks', async () => {
    const calls = mockApi({ 'GET /api/children/1/events': () => [200, { events: [] }] });
    render(<Schedule childId={1} canAdd={false} />);
    await screen.findByText('No events this week.');
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].url).not.toContain(`weekStart=${week}`);
    expect(screen.queryByText('Add event')).not.toBeInTheDocument();
  });

  test('the child view hides past events', async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    mockApi({
      'GET /api/children/1/events': () => [200, {
        events: [{ id: 1, title: 'Already done', startsAt: past }, { id: 2, title: 'Coming up', startsAt: future }],
      }],
    });
    render(<Schedule childId={1} canAdd={false} upcomingOnly />);
    expect(await screen.findByText('Coming up')).toBeInTheDocument();
    expect(screen.queryByText('Already done')).not.toBeInTheDocument();
  });
});

describe('date helpers', () => {
  test('mondayOf returns the Monday of the week', () => {
    expect(toDateString(mondayOf(new Date(2026, 10, 26)))).toBe('2026-11-23');
    expect(toDateString(mondayOf(new Date(2026, 10, 29)))).toBe('2026-11-23');
    expect(toDateString(mondayOf(new Date(2026, 10, 23)))).toBe('2026-11-23');
  });

  test('localDateTimeWithOffset adds the offset', () => {
    expect(localDateTimeWithOffset('2026-11-24', '10:30')).toMatch(/^2026-11-24T10:30:00[+-]\d{2}:\d{2}$/);
  });
});
