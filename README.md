# SYNORA – AI-Assisted Child Development Platform

SYNORA is a web platform that brings parents, specialists and children together around a shared schedule, task list and record of observations, with role-based AI summaries that support (but never replace) human decisions.

Course project for SENG 383 – Software Project III, Fall 2026 (Çankaya University).

**Current version:** `v0.1` – M1–M4: login and roles, linking specialists, weekly schedule, tasks.

## Features in v0.1

| Module | What works |
|---|---|
| M1 – Login and roles | Email and password login (JWT, hashed passwords). Each role sees only its own screens. |
| M2 – Linking specialists | The parent links a registered specialist by email and type, sees the list and unlinks after a confirmation. An unlinked specialist loses access at once, even with a valid token. |
| M3 – Weekly schedule | The parent and linked specialists add events; everyone with access sees the week; the child sees upcoming events. |
| M4 – Tasks | The parent and linked specialists assign tasks with a development area and due date; the child marks them done; the assigner sees the status. |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Tests | Jest + Supertest (backend), Vitest + Testing Library (frontend), Playwright (end-to-end) |
| CI | GitHub Actions |

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Git

## Run the application

```bash
# 1. Get the code
git clone https://github.com/AliErtekin/seng383-synora.git
cd seng383-synora

# 2. Start the backend (terminal 1) – http://localhost:3001
cd backend
npm install
npm run seed     # creates the synthetic demo accounts (safe to run again)
npm start

# 3. Start the frontend (terminal 2) – http://localhost:5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with a demo account. You can check the API directly: http://localhost:3001/api/health returns `{"status":"ok"}`.

### Demo accounts

`npm run seed` creates synthetic demo data (no real personal data). All accounts use the password `Demo1234!`.

| Email | Role | Notes |
|---|---|---|
| parent@synora.test | parent | Parent of Demo Child |
| child@synora.test | child | Demo Child |
| therapist@synora.test | specialist | Already linked to Demo Child; owns two events and a task in the current week |
| teacher@synora.test | specialist | Not linked, so the parent can link them in a demo |

To start again from a clean state, stop the backend, delete `backend/synora.db` and run `npm run seed` again.

Log in through the API: `POST http://localhost:3001/api/auth/login` with `{"email": "...", "password": "..."}` returns a JWT. Send it as `Authorization: Bearer <token>` on protected routes such as `GET /api/auth/me`.

Set `JWT_SECRET` in the environment for anything beyond local development; a fixed development secret is used otherwise.

## Run the tests

```bash
cd backend && npm test      # Jest + Supertest, with coverage
cd frontend && npm test     # Vitest + Testing Library, with coverage

# End-to-end (starts its own seeded backend and the frontend; ports 3001 and 5173 must be free)
cd e2e && npm install && npx playwright install chromium && npm test
```

CI (GitHub Actions) runs the backend and frontend tests, then the end-to-end test, on every pull request to `main`.

## Project structure

```
backend/    Express API and SQLite access (src/), tests (tests/)
frontend/   React app (src/), tests (tests/)
e2e/        Playwright end-to-end tests
docs/       PMP.md (project management plan), SRS.md (requirements), SDD.md (design), DEMO.md (demo script), meetings/
.github/    GitHub Actions CI workflow
```

## Working agreement

- Planning and tracking are done in Jira (project key `SCRUM`): https://g9synora.atlassian.net/jira/software/projects/SCRUM/boards/1
- Every branch and commit message starts with the Jira issue key, for example `SCRUM-20 Add health endpoint`.
- All changes enter `main` through a reviewed pull request; CI must be green.

## Team

| Name | GitHub |
|---|---|
| Ali Ertekin | AliErtekin |
| Muhammed Eren Yanık | yanikeren |
| Bora Yaman | BoraY400 |
