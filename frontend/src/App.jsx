import React, { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api.js';
import Login from './components/Login.jsx';
import Workspace from './components/Workspace.jsx';
import ChildHome from './components/ChildHome.jsx';

// M1: shows the login page, then only the screens of the signed-in account's role (FR-M1-03).
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, [logout]);

  function handleLogin({ token, user: account }) {
    setToken(token);
    setUser(account);
  }

  if (checking) return <p className="center muted">Loading…</p>;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">SYNORA</span>
        <span className="who" data-testid="current-user">
          {user.displayName} · <span className={`role role-${user.role}`}>{user.role}</span>
        </span>
        <button type="button" className="link" onClick={logout}>
          Log out
        </button>
      </header>
      <main className="content">
        {user.role === 'child' ? <ChildHome user={user} /> : <Workspace user={user} />}
      </main>
    </div>
  );
}
