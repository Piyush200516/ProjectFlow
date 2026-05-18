# ProjectFlow Edu 🚀

<div align="center">
  <img src="frontend/src/assets/projectflow-logo.png" alt="ProjectFlow Logo" width="140"/>
</div>

**AI‑Powered Academic Project Lifecycle & Collaborative SaaS Platform**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

*Transforming unstructured college final‑year project timelines into an industry‑grade Agile SDLC workflow.*

---

## 📖 Project Overview

**ProjectFlow Edu** is a comprehensive, multi‑role SaaS‑grade platform designed for a **single‑college deployment**. It bridges academic submissions with professional agile methodologies, providing a unified hub where students collaborate, mentors evaluate, HODs oversee, and CDC scouts top‑tier talent.

### Core Pillars
1. **👨‍🎓 Students** – Form teams, invite peers, manage Kanban progress, collaborate on deliverables, and submit GitHub repositories.
2. **👨‍🏫 Mentors** – Issue templates, review document iterations, and evaluate contributions via a built‑in rubric.
3. **🏛️ HOD (Head of Department)** – Global oversight, late‑submission monitoring, and department‑wide template enforcement.
4. **🏢 CDC (Career Development Cell)** – Innovation tracking, startup funnel, and hackathon selection.

---

## 📊 ProjectFlow Edu vs Jira
| Feature | ProjectFlow Edu | Jira |
| :--- | :--- | :--- |
| **Academic Project Lifecycle Management** | ✅ Built for colleges | ❌ Generic |
| **Student Team Formation** | ✅ Invite by email + roll number | ❌ Not built‑in |
| **Mentor Review Workflow** | ✅ Native | ❌ Requires customization |
| **HOD Approval Workflow** | ✅ Built‑in | ❌ Not available |
| **CDC / Innovation Tracking** | ✅ Built‑in | ❌ Not available |
| **Final Year Project Management** | ✅ Designed for academia | ❌ Generic |
| **Contribution‑Based Scoring** | ✅ Built‑in | ❌ Not available |
| **Timeliness Marks** | ✅ Automatic | ❌ Manual |
| **GitHub Validation** | ✅ Integrated | ⚠️ Plugin |
| **Document Workspace** | ✅ Academic workflow | ❌ Limited |
| **PPT / Report Submission** | ✅ Native | ❌ Manual attachment |
| **Team Member Cap (max 5)** | ✅ Enforced | ❌ No constraint |
| **Student Notifications** | ✅ Built‑in | ✅ Yes |
| **Internal Chat** | ✅ Planned/Built | ⚠️ Add‑ons |
| **Calendar / Deadlines** | ✅ Academic‑focused | ✅ Generic |
| **Role‑Based Dashboards** | ✅ Student / Mentor / HOD / CDC | ⚠️ Generic |
| **Department Analytics** | ✅ Built‑in | ❌ Not native |
| **Startup / Innovation Tracking** | ✅ CDC‑focused | ❌ No |
| **Hackathon / Incubation Support** | ✅ Future‑ready | ❌ No |
| **AI Academic Evaluation** | ✅ Planned | ❌ Not specific |

---

## 🏛️ Enterprise Multi‑Portal Architecture
```
               ┌─────────────────────────────────┐
               │         College Firewall        │
               └────────────────┬────────────────┘
                                │
                  [ Vercel Edge Server Routers ]
                        (TLS/SSL Edge Termination)
                                │
      ┌─────────────────────────┼─────────────────────────┐
      ▼                         ▼                         ▼
 ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
 │   Auth App    │         │ Student/Mentor│         │ HOD/CDC Admin │
 │ (Port 3000)   │         │ (Port 3001)   │         │ (Port 3002)   │
 └───────────────┘         └───────────────┘         └───────────────┘
 projectflow-auth          projectflow-portal       projectflow-admin
      │                         │                         │
      └─────────────────────────┼─────────────────────────┘
                                │
                     ┌──────────────▼──────────────┐
                     │   Central API Gateway (Express)│
                     └──────────────┬──────────────┘
                              (Node.js/Express)
                                │
      ┌─────────────────────────┴─────────────────────────┐
      ▼                                                   ▼
 ┌───────────────┐                                   ┌───────────────┐
 │   Express     │ ◄───────────[ Redis ]──────────────► │   Socket.io   │
 │ API Gateway   │       (Job Queues & Cache)        │ Server (5001)│
 └───────┬───────┘                                   └───────────────┘
         │
         ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │            PostgreSQL Cloud Database (Neon / Pool)               │
 └──────────────────────────────────────────────────────────────────┘
```

---

## ✅ Completed Frontend Work
- Student, Mentor, HOD, CDC portals with role‑based UI
- Auth pages (login, signup, reset) and role‑based login flows
- SaaS‑grade dashboard UI, Kanban, team workspace, document workspace
- Invitation workflow (email + roll number, accept/reject, auto‑cancellation)
- Max 5 students per project, one active project per student
- Document templates, version history, final submission with GitHub validation
- Contribution analytics, timeliness scoring, notifications, activity timeline
- Calendar view, basic chat UI, HOD analytics, CDC innovation tracking

## ✅ Completed Backend Work
- Node.js + Express server with JWT auth and role middleware
- PostgreSQL integration (SSL, pg‑pool)
- Comprehensive API routes: auth, projects, tasks, documents, invitations, evaluations, notifications, calendar, chat
- CORS configured for Vercel URLs and localhost
- Health endpoint (`GET /api/health`)
- Render deployment prepared (root `backend`, `npm install`, `npm start`)

## ✅ Completed Database Work
- PostgreSQL schema (`projectflow_edu_postgres_schema.sql`) with 25+ tables and indexes
- Neon PostgreSQL provisioned, SSL enabled, seeded with demo users
- Tables for users, students, mentors, projects, members, tasks, sdlc stages, documents, evaluations, notifications, chat, calendar, hackathons, startups, industry collaborations

## ✅ Deployment Work
- Frontend deployed on Vercel (auth, portal, admin apps)
- Backend prepared for Render (service `projectflow-backend` live at `https://projectflow-backend-lsvr.onrender.com`)
- Neon PostgreSQL live and seeded
- Micro‑service style architecture (Auth | Portal | Admin → API Gateway → DB)

## 📈 Current Project Status
- **Frontend**: Mostly completed, live on Vercel.
- **Backend**: Implemented, deployed on Render but health shows `database":"DISCONNECTED"` – DB URL fix needed.
- **Database**: Schema completed, Neon instance running.
- **Deployment**: Frontend live, backend awaiting DB connection verification.

## 🔐 Demo Credentials
```
student@college.edu / password123
mentor@college.edu   / password123
hod@college.edu      / password123
cdc@college.edu      / password123
```

## 📌 Remaining Work
- Fix Render backend `DATABASE_URL` (use Neon connection string with SSL) and verify health endpoint returns `database":"CONNECTED"`.
- Update Vercel `VITE_API_URL` to the live Render backend URL.
- Perform full production CORS verification.
- End‑to‑end API testing (auth, project, document, invitation flows).
- Optional AI‑powered document review integration.
- Optional real‑time Socket.io features (chat, notifications).

---

## ⚙️ Tech Stack & Deployed URLs
### Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js (modular routers & controllers).
- **Database**: PostgreSQL (Neon serverless, SSL pools).
- **Middlewares**: JWT auth cookies, rate limiting, Helmet security.

### Live Production Deployments
- **Auth App**: https://projectflow-auth.vercel.app
- **Student & Mentor Portal**: https://projectflow-portal.vercel.app
- **HOD & CDC Admin**: https://projectflow-admin.vercel.app
- **Express Backend API**: https://projectflow-backend-lsvr.onrender.com
  - Health Check: `/api/health` → https://projectflow-backend-lsvr.onrender.com/api/health

---

## 🚀 Installation & Local Development
### Backend
```bash
git clone https://github.com/Piyush200516/ProjectFlow.git
cd ProjectFlow/backend
npm install
cp .env.example .env   # edit with your DB credentials
npm run dev
```
### Frontend
```bash
cd ../frontend
npm install
npm run dev   # http://localhost:5173
```

---

## 🔮 Future Roadmap
- [ ] OnlyOffice / Collabora real‑time document co‑authoring.
- [ ] AI‑powered document quality reviews.
- [ ] Plagiarism checker for code & docs.
- [ ] GitHub webhook analytics for contribution mapping.
- [ ] AI Mentor Assistant for bottleneck alerts.
- [ ] SMS / WhatsApp deadline alerts.

---

<div align="center">
  Built with ❤️ by <b>Piyush Mishra</b>
</div>