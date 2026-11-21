# Demo Script – Release v0.1 (M1–M4)

About 8 minutes. Uses only the synthetic demo accounts (password `Demo1234!`).

## Before the demo

1. Pull `main`, then in `backend/`: delete `synora.db` if it exists, run `npm install`, `npm run seed`, `npm start`.
2. In `frontend/`: `npm install`, `npm run dev`, open http://localhost:5173.
3. Open the GitHub repository (Actions tab, release `v0.1`) and the Jira board in other tabs.

## Steps

| # | Account | Action | Shows |
|---|---|---|---|
| 1 | – | Sign in as `parent@synora.test` with a wrong password. | Error message; no role picker on the login page (FR-M1-01, FR-M1-02). |
| 2 | parent | Sign in correctly. Open **Schedule**. | Parent screens with Schedule, Tasks, Specialists tabs (FR-M1-03); seeded events of this week (FR-M3-02). |
| 3 | parent | Add an event, e.g. "Doctor visit" tomorrow at 14:00. | Event appears under the right day (FR-M3-01). |
| 4 | parent | **Specialists**: link `nobody@synora.test`, type "Teacher". | "No registered specialist" error (FR-M2-02). |
| 5 | parent | Link `teacher@synora.test`, type "Teacher". Log out. | Teacher appears in the list next to the linked therapist (FR-M2-01, FR-M2-04). |
| 6 | teacher | Sign in. | Only Schedule and Tasks tabs; Demo Child is listed (FR-M2-06). |
| 7 | teacher | **Tasks**: assign "Draw a circle", area Motor. Log out. | Task with status Pending (FR-M4-01). |
| 8 | child | Sign in as `child@synora.test`. | Only "My tasks" and "Upcoming events", no tabs (FR-M3-03, FR-M4-04). |
| 9 | child | Click **Mark as done** on "Draw a circle". Log out. | Status Completed (FR-M4-02). |
| 10 | teacher | Sign in, **Tasks**, tick "Only tasks I assigned". | "Draw a circle" shows Completed (FR-M4-03). Log out. |
| 11 | parent | **Specialists**: Unlink the teacher, confirm. Log out. | Confirmation step, teacher removed (FR-M2-03). |
| 12 | teacher | Sign in again. | "You are not linked to any child" – access removed (FR-M2-05). |
| 13 | – | GitHub: Actions run of `main`, release `v0.1`; Jira board. | Unit tests and end-to-end test green in CI; tracked work. |

## If something goes wrong

- Blank page or "Cannot reach the server": the backend is not running on port 3001.
- Old data on screen: stop the backend, delete `backend/synora.db`, run `npm run seed`, start again.
- The end-to-end test in `e2e/` runs the same flow automatically: `cd e2e && npm test`.
