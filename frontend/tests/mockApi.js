import { vi } from 'vitest';

// Replaces fetch with a tiny router: routes['GET /api/children'] = (body, url) => [status, json].
export function mockApi(routes) {
  const calls = [];
  const fetchMock = vi.fn(async (url, init = {}) => {
    const method = init.method || 'GET';
    const path = url.split('?')[0];
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, body, headers: init.headers || {} });
    const handler = routes[`${method} ${url}`] || routes[`${method} ${path}`];
    if (!handler) return { status: 404, ok: false, json: async () => ({ error: `No mock for ${method} ${url}` }) };
    const [status, json] = handler(body, url);
    return { status, ok: status >= 200 && status < 300, json: async () => json };
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}
