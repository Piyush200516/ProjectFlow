# Local Development Completion Plan

## Goal Description

Set up ProjectFlow Edu to run entirely on the local machine (frontend on `http://localhost:5173`, backend on `http://localhost:5000`, PostgreSQL local DB). Ensure database connectivity, seed required demo users, and fix all backend API endpoints and frontend integration so that the full user flow works without any deployment or Firebase dependencies.

## User Review Required

> [!IMPORTANT]
> The plan involves stopping any current Render deployment and focusing solely on the local environment. Confirm that you are okay with terminating the deployed services for the duration of this work.

> [!NOTE]
> No UI redesign will be performed; only functional fixes are included.

## Open Questions

> [!WARNING]
> 1. **Database Credentials**: The `.env` file currently contains Neon DB credentials. Should we replace them with the local PostgreSQL credentials (`DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=postgres`, `DB_PASSWORD` from your local setup, and `DB_NAME=projectflow_edu`)?
> 2. **Password Hashing**: The seed script uses bcrypt hashes generated for `password123`. Do you want to keep the existing hashes or regenerate them after switch to local DB?
> 3. **Port Conflicts**: Backend is currently running on port 5000. Is this ok, or do you prefer a different port?
> 4. **Team Invitation Flow**: The invite acceptance endpoint expects an email token. Do you have a sample invite token to test, or should we generate a dummy one during seeding?
> 5. **Document Upload Storage**: Current code stores uploads in a `uploads/` folder. Confirm that the folder exists and is writable in the local repo.

## Proposed Changes

---
### 1. Environment Configuration

- **Modify `backend/.env`**: Replace Neon `DATABASE_URL` with local connection string:
  `DATABASE_URL=postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/projectflow_edu`
- **Add missing DB variables** (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`) if the code uses them.
- **Update `frontend/.env`**: Set `VITE_API_URL=http://localhost:5000/api`.

---
### 2. Database Setup

- **Run schema**: Execute `psql -f database/projectflow_edu_postgres_schema.sql` against the local DB.
- **Create seed script** (`backend/scripts/seed_local.js`): Insert demo users with bcrypt-hashed password `password123` and corresponding `students`, `mentors`, and `hod` rows.
- **Add script to `package.json`** for easy execution: `npm run seed`.

---
### 3. Backend Fixes

| File | Issue | Fix |
|------|-------|-----|
| `src/app.js` | Missing health route or incorrect path | Ensure `app.get('/api/health', ...)` returns `{ success:true, message:'OK' }` and logs DB connection status. |
| `controllers/authController.js` | MySQL‑style `db.execute` and `result.insertId` | Replace with `pg` client queries using `RETURNING id`. Adjust register logic to insert into `users` then create role‑specific rows. |
| `controllers/authController.js` | Password compare may use wrong field name | Verify query selects `password_hash` and compare with `bcrypt.compare`. |
| `controllers/authController.js` | `/me` endpoint not returning user correctly | Query user by `req.user.id` and send sanitized user object. |
| Project, Task, Invite, Document controllers | Still referencing MySQL helper functions | Switch all DB calls to `pg` pool (`pool.query`) with parameterized queries. Add proper error handling and status codes. |
| CORS config | Allow only localhost origins | Update `cors` whitelist to include `http://localhost:5173` and `http://127.0.0.1:5173`. |

---
### 4. Frontend Adjustments

- **API Client** (`src/lib/api.js`): Ensure base URL reads from `import.meta.env.VITE_API_URL`. Remove any hard‑coded Render URLs.
- **Auth Flows**: Verify login, signup forms POST to `${API_URL}/auth/login` and `/auth/register`. Map role returned (`user.role`) to correct dashboard route (`/student`, `/mentor`, `/hod`).
- **Redirect Logic**: Update router guards to use local role mapping.
- **Dashboard Components**: Ensure they fetch data from local endpoints (`/projects`, `/tasks`, etc.).
- **Invite Flow**: Mock token generation on backend seed; frontend should read token from query param and call accept API.
- **Document Upload**: Ensure the form posts `multipart/form-data` to `/api/documents/upload` and the response URL is used to display the file.

---
### 5. Testing Procedure

1. **Start PostgreSQL locally** and confirm connection with `psql -U postgres -d projectflow_edu`.
2. **Run seed script**.
3. **Start backend**: `npm run dev` in `backend` (port 5000).
4. **Start frontend**: `npm run dev` in `frontend` (port 5173).
5. **Manual Test Checklist** (record results in `task.md`):
   - Student signup → success, token stored.
   - Student login → redirects to student dashboard.
   - Mentor/HOD login → respective dashboards.
   - Create a project → appears in list.
   - Invite a teammate → email token generated (log to console), accept via `/api/invites/accept?token=...`.
   - Add a task to a project → shows on kanban board.
   - Upload a document → file appears in documents view.
   - Submit final GitHub link → stored and displayed.
6. **Automated Checks**: Write a small script `tests/local_api.test.js` using `node-fetch` to hit each endpoint and assert HTTP 200/201 responses.

---
## Verification Plan

### Automated Tests
- Run `npm test` (Jest) for the backend test suite.
- Use `npm run lint` to ensure no lint errors.

### Manual Verification
- The user will follow the manual checklist above and report any failures.
- Capture screenshots of successful dashboard loads and API responses.

---
**Next Steps**

- Update environment files.
- Create/adjust seed script.
- Refactor backend DB calls.
- Adjust frontend API usage.
- Run schema and seed.
- Perform testing.

Please review the plan, answer the open questions, and approve to proceed.

--- 🚀

**AI‑Powered Jira‑Inspired Academic Project Lifecycle Management SaaS Platform**

---

## 1. Project Overview
ProjectFlow Edu is a full-stack SaaS platform built for a single college to manage final-year project lifecycles. It provides role-based portals for students, mentors, and heads of department (HOD/Admin), enabling collaborative project planning, execution, and evaluation.

## 2. Problem Statement
Traditional academic project management relies on ad‑hoc spreadsheets, email threads, and manual grading, leading to:
- Poor team coordination
- Inconsistent evaluation criteria
- Lack of analytics for departments and industry partners
- No single source of truth for project artefacts

## 3. Why ProjectFlow Edu?
- **Academic-focused**: Tailored workflows for student teams, mentor reviews, HOD approvals, and department analytics.
- **Jira‑inspired**: Kanban boards, sprint‑like stages, and real‑time analytics.
- **All‑in‑one**: Authentication, project management, document workspace, chat, calendar, and analytics in a single SaaS solution.

## 4. Features
- Role‑based JWT authentication
- Student signup & role‑based login
- Team creation (max 5 members) & invitation via email + roll number
- Invitation accept / reject workflow
- Shared team workspace with Kanban board
- Document workspace with version history and GitHub final‑submission validation
- Mentor‑provided project templates
- Real‑time notifications & activity timeline
- Calendar with academic deadlines
- Chat UI for team communication
- Analytics dashboards for contribution, timeliness, and department metrics
- Automated scoring & grading rubrics

## 5. User Roles
| Role | Capabilities |
|------|--------------|
| **Student** | Create / join teams, manage tasks, submit documents, view analytics |
| **Mentor** | Define templates, review documents, assign marks, view team progress |
| **HOD** | Oversight of all projects, enforce deadlines, department‑wide analytics |

## 6. Implemented Features
- **Backend**: Node.js + Express, JWT auth, PostgreSQL (Neon) with SSL, extensive REST API (auth, projects, tasks, documents, invitations, notifications, calendar, chat)
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, Lucide Icons – deployed on Vercel
- **Deployment**: Frontend on Vercel, backend on Render, database on Neon PostgreSQL
- **Branding**: ProjectFlow logo & colour scheme throughout UI

## 7. Live Deployment
### Frontend
- **Live App**: https://project-flow-git-main-piyushmishra21052003-6587s-projects.vercel.app
- **Student Login**: https://project-flow-git-main-piyushmishra21052003-6587s-projects.vercel.app/auth/student/login
- **Student Signup**: https://project-flow-git-main-piyushmishra21052003-6587s-projects.vercel.app/auth/student/register
- **Mentor Login**: https://project-flow-git-main-piyushmishra21052003-6587s-projects.vercel.app/auth/mentor/login
- **HOD Login**: https://project-flow-git-main-piyushmishra21052003-6587s-projects.vercel.app/auth/hod/login

### Backend
- **API URL**: https://projectflow-backend-lsvr.onrender.com/api
- **Health Check**: https://projectflow-backend-lsvr.onrender.com/api/health

### Database
- **Neon PostgreSQL** – cloud‑hosted, SSL‑enabled, fully seeded with demo users.

---

## 8. Architecture Diagram
```mermaid
flowchart TD
    A[College Firewall] --> B[Vercel Edge Routers]
    B --> C[Auth App]
    B --> D[Student/Mentor Portal]
    B --> E[HOD/Admin]
    C & D & E --> F[Central API Gateway (Express)]
    F --> G[PostgreSQL (Neon)]
    F --> H[Redis / BullMQ]
    F --> I[Socket.io (future real‑time)]
```

## 9. Database Tables
- `users`, `students`, `mentors`, `hods`
- `projects`, `project_members`, `team_invitations`
- `tasks`, `sdlc_stages`
- `document_templates`, `document_submissions`, `document_versions`
- `evaluations`, `notifications`
- `calendar_events`, `chat_messages`
- `activity_logs`, `hackathons`, `startups`, `industry_collaborations`

## 10. ProjectFlow Edu vs Jira
| Feature | ProjectFlow Edu | Jira |
|---|---|---|
| Academic lifecycle | ✅ Built‑in | ❌ Generic |
| Student team formation (email + roll) | ✅ | ❌ |
| Mentor review workflow | ✅ | ⚠️ Requires add‑on |
| HOD approval | ✅ | ❌ |
| Contribution‑based scoring | ✅ | ❌ |
| Timeliness auto‑scoring | ✅ | ❌ |
| GitHub repo validation | ✅ | ⚠️ Plugin |
| Document workspace | ✅ | ❌ |
| Role‑based dashboards | ✅ | ⚠️ Custom |

---

## 11. Installation Guide
```bash
# Clone repository
git clone https://github.com/Piyush200516/ProjectFlow.git
cd ProjectFlow

# Backend setup
cd backend
cp .env.example .env   # configure Neon DATABASE_URL and JWT_SECRET
npm install
npm run dev   # http://localhost:5000

# Frontend setup
cd ../frontend
cp .env.example .env   # optional VITE_API_URL for local dev
npm install
npm run dev   # http://localhost:5173
```

## 12. Demo Credentials
```
student@college.edu / password123
mentor@college.edu   / password123
hod@college.edu      / password123
```

## 13. Current Project Status
- **Frontend**: Live on Vercel, all portals functional.
- **Backend**: Deployed on Render, health endpoint returns `{"status":"OK","database":"CONNECTED"}`.
- **Database**: Neon PostgreSQL fully seeded, SSL enabled.
- **Features**: Core SaaS workflows complete; AI‑doc review & real‑time Socket.io pending.

## 14. Future Roadmap
- Real‑time Socket.io chat & notifications
- AI‑powered document quality review
- Integration with external plagiarism checker
- Advanced analytics dashboards with export to PDF
- Mobile‑first responsive redesign
- CI/CD pipelines for automated schema migrations

---

## 15. Author & License
**Author**: Piyush Mishra (<https://github.com/Piyush200516>)
**License**: MIT © 2026

---

*Built with ❤️ for academic innovators.*
