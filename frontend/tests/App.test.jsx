import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from '../src/App.jsx';

afterEach(() => vi.restoreAllMocks());

describe('App health check page', () => {
  test('shows the backend status when the API answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ status: 'ok' }) })
    );
    render(<App />);
    expect(await screen.findByText('Backend status: ok')).toBeInTheDocument();
  });

  test('shows unreachable when the API cannot be called', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    render(<App />);
    expect(await screen.findByText('Backend status: unreachable')).toBeInTheDocument();
  });
});
