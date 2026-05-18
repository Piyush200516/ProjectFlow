# ProjectFlow Edu 🚀

**AI‑Powered Jira‑Inspired Academic Project Lifecycle Management SaaS Platform**

---

## 1. Project Overview
ProjectFlow Edu is a full‑stack SaaS platform built for a single college to manage final‑year project lifecycles. It provides role‑based portals for students, mentors, heads of department (HOD) and the career‑development cell (CDC), enabling collaborative project planning, execution, and evaluation.

## 2. Problem Statement
Traditional academic project management relies on ad‑hoc spreadsheets, email threads, and manual grading, leading to:
- Poor team coordination
- Inconsistent evaluation criteria
- Lack of analytics for departments and industry partners
- No single source of truth for project artefacts

## 3. Why ProjectFlow Edu?
- **Academic‑focused**: Tailored workflows for student teams, mentor reviews, HOD approvals, and CDC innovation tracking.
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
| **CDC** | Track innovative projects, startup ideas, and hackathon participation |

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
- **CDC Login**: https://project-flow-git-main-piyushmishra21052003-6587s-projects.vercel.app/auth/cdc/login

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
    B --> E[HOD & CDC Admin]
    C & D & E --> F[Central API Gateway (Express)]
    F --> G[PostgreSQL (Neon)]
    F --> H[Redis / BullMQ]
    F --> I[Socket.io (future real‑time)]
```

## 9. Database Tables
- `users`, `students`, `mentors`, `hods`, `cdcs`
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
| CDC innovation tracking | ✅ | ❌ |
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
cdc@college.edu      / password123
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
