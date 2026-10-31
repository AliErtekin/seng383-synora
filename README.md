# SYNORA – AI-Assisted Child Development Platform

SYNORA is a web platform that brings parents, specialists and children together around a shared schedule, task list and record of observations, with role-based AI summaries that support (but never replace) human decisions.

Course project for SENG 383 – Software Project III, Fall 2026 (Çankaya University).

**Current version:** `v0.0` – walking skeleton (React page → Express API → SQLite).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Tests | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
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
npm start

# 3. Start the frontend (terminal 2) – http://localhost:5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The page shows `Backend status: ok` when the frontend, API and database are connected. You can also check the API directly: http://localhost:3001/api/health returns `{"status":"ok"}`.

## Run the tests

```bash
cd backend && npm test      # Jest + Supertest, with coverage
cd frontend && npm test     # Vitest + Testing Library, with coverage
```

## Project structure

```
backend/    Express API and SQLite access (src/), tests (tests/)
frontend/   React app (src/), tests (tests/)
docs/       PMP.md (project management plan), SRS.md (requirements)
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
