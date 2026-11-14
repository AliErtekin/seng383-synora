# Project Management Plan (PMP)

> The purpose of this PMP is to practice planning and tracking work in Jira. Keep it short: most of the content is a summary of what you set up in Jira.
> Keep this file at `docs/PMP.md`. Each section is one Jira epic (PMP-1 … PMP-6); mark the epic Done when the section is complete.
> Save screenshots in `docs/img/`.

| Section | Content | Required by |
|---|---|---|
| PMP-1 | Project, Jira setup, team and roles | Week 6 |
| PMP-2 | Work packages (epics) and sprint plan | Week 6 |
| PMP-3 | Progress review: mid-term (v0.1) | Mid-term evaluation (Week 8 / 9) |
| PMP-4 | Progress review: v0.2 | Week 10 |
| PMP-5 | Progress review: final (v1.0) | Final evaluation |
| PMP-6 | Retrospective | Final evaluation |

---

## PMP-1. Project and Team

### Project and Jira Setup

**Project in one sentence:** An AI-assisted web platform that brings parents, specialists and children together around a shared schedule, task list and record of observations, with role-based AI summaries that support human decisions.
**Jira project key:**  SCRUM
**Jira board link:**  https://g9synora.atlassian.net/jira/software/projects/SCRUM/boards/1

### Team and Roles

| Name | Jira / GitHub username | Role |
|---|---|---|
| Ali Ertekin | AliErtekin | developer |
| Muhammed Eren Yanık | yanikeren | developer |
| Bora Yaman | BoraY400 | developer, project manager |

---

## PMP-2. Plan

### Work Packages (Epics)

> One row per Jira epic. Number of tasks = how many tasks you created under that epic.

| Epic | Owner | Number of tasks | Planned sprint(s) |
|---|---|---|---|
| M1 | Ali Ertekin | 7 | Sprint 1,2,4 |
| M2 | Ali Ertekin | 3 | Sprint 2 |
| M3 | Ali Ertekin | 2 | Sprint 2 |
| M4 | Ali Ertekin | 2 | Sprint 2 |
| M5 | Ali Ertekin | 2 | Sprint 3 |
| M6 | Ali Ertekin | 2 | Sprint 3 |
| M7 | Ali Ertekin | 2 | Sprint 3 |
| M8 | Ali Ertekin | 3 | Sprint 3,4|
| DESIGN | Ali Ertekin | 2 | Sprint 2 |

### Sprint Plan

> One row per Jira sprint. Align sprints with the weekly schedule.

| Sprint | Weeks | Sprint goal | Ends with |
|---|---|---|---|
| Sprint 1 | 5 | Walking skeleton and PMP section 2 | Walking skeleton (v0.0), Week 6 |
| Sprint 2 | 6-8 | M1-M4: login, specialist linking, schedule, tasks | Release v0.1, mid-term |
| Sprint 3 | 9-10 | M5-M8: entries, documents, statistics, AI summary | Release v0.2, Week 10 |
| Sprint 4 | 11-12 | Bug fixing, final polish, retrospective | Release v1.0, final |

---

## PMP-3. Progress Review: Mid-term (v0.1)

**Jira board screenshot:** ![Jira board, Week 7](img/jira-board-week7.png)

*Status as of 2026-11-14 (Week 7). Release v0.1 (M1–M4) is due in Week 8.*

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| PMP-1 | Project, Jira setup, team and roles | Done |
| PMP-2 | Work packages and sprint plan | Done |
| DESIGN | Final SRS and SDD (Week 6) | Done |
| M1 | Walking skeleton (v0.0), then login API and role-based screens for v0.1 | In progress (skeleton done: 4 of 7 tasks; login API and login page not started) |
| M2 | Link and unlink specialists, access check, for v0.1 | Not started |
| M3 | Schedule events API and weekly view, for v0.1 | Not started |
| M4 | Tasks API and task screens, for v0.1 | Not started |

**Changes to the plan (if any):**

- Added an extra epic, DESIGN, for the Week 6 requirements and design work (allowed by the Project Workflow Guide). It is listed in the PMP-2 table.
- The AI provider for M8 is the Gemini API, with a mock mode for tests and CI (SDD updated).
- Sprint 2 (Weeks 6–8) keeps its goal, M1–M4 for release v0.1. Development of M1–M4 has not started yet because Weeks 5–7 went to the walking skeleton, the SRS and the SDD; the remaining v0.1 tasks (SCRUM-25 to SCRUM-33) are scheduled for the rest of Sprint 2.

---

## PMP-4. Progress Review: v0.2

**Jira board screenshot:**  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| | | |
| | | |

**Changes to the plan (if any):**

---

## PMP-5. Progress Review: Final (v1.0)

**Jira board screenshot:**  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| | | |
| | | |

**Changes to the plan (if any):**

---

## PMP-6. Retrospective

- What worked well in using Jira:
- What we would do differently:
