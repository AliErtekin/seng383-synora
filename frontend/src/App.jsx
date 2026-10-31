import React, { useEffect, useState } from 'react';

// Walking skeleton page: calls the backend health endpoint and shows the result.
export default function App() {
  const [state, setState] = useState({ loading: true, status: null });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setState({ loading: false, status: data.status }))
      .catch(() => setState({ loading: false, status: 'unreachable' }));
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>SYNORA</h1>
      <p>AI-Assisted Child Development Platform</p>
      <p data-testid="health">
        {state.loading ? 'Checking backend...' : `Backend status: ${state.status}`}
      </p>
    </main>
  );
}
