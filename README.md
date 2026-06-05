# 📚 ProjectFlow Edu App Documentation

## Project Overview

**ProjectFlow Edu App** is an academic project‑management platform that enables seamless collaboration between **students**, **mentors**, and **heads of department (HODs)**. The system allows:
- Students to create, manage, and submit project work.
- Mentors to allocate teams, monitor progress, and provide feedback.
- HODs to oversee mentor allocations, approve student registrations, and review project submissions.

It digitalises the entire lifecycle of semester‑long capstone projects, from team formation to final grading, with real‑time notifications and audit logging.

## Main Features

### Student Features
- Registration & JWT login
- Profile & academic profile management (branch, department, academic year)
- Team creation & joining
- Dynamic project form submission (customizable JSON schemas)
- File uploads (reports, designs, etc.)
- Submission tracking and status view
- Mentor information view
- Real‑time notifications

### Mentor Features
- Secure login
- Dashboard of assigned students and teams
- Team progress monitoring
- Review and feedback on project submissions
- Task creation & status updates
- Notification handling

### HOD Features
- HOD authentication & role‑based access
- Mentor allocation to teams (via **MentorAllocation**)
- Student registration approval workflow
- Submission review and approval
- Team monitoring & analytics dashboard
- Management of academic years, branches, and departments

## Technology Stack

### Frontend
- **React.js** with functional components & hooks
- **Vite** for fast development builds
- **Tailwind CSS** for utility‑first styling (dark mode ready)
- **Material UI** components for complex UI elements
- **Axios** for HTTP API calls
- **React Router** for SPA navigation

### Backend
- **Node.js** (v18+) runtime
- **Express.js** for RESTful API routing
- **JWT** for stateless authentication
- **bcrypt** for password hashing
- **Multer** for multipart file uploads
- **Prisma ORM** (v5) for type‑safe DB access
- **dotenv** for environment configuration

### Database
- **PostgreSQL** (Neon‑compatible) as the primary relational store
- **Prisma schema** (`schema.prisma`) defining models and migrations
- **SQL migrations** generated via `prisma migrate dev`

### Authentication & Security
- **Access & Refresh Tokens** (short‑lived access, long‑lived refresh)
- **Role‑Based Access Control (RBAC)** – `Student`, `Mentor`, `HOD`
- **Rate limiting & input validation** in middleware

### File Upload System
- **Multer** middleware stores temporary files
- **Cloudinary** (or local storage) for permanent asset hosting
- Metadata persisted in `ProjectFile` and generic `Upload` tables

### DevOps / Deployment
- **GitHub** for source control & CI/CD workflows
- **Render**/**Railway** (or Netlify for frontend) for production hosting
- Dockerfile (Node base) for containerised deployments
- Environment variables for DB URL, JWT secret, Cloudinary keys, etc.

## System Architecture

```
[Frontend React SPA] ⇄ (REST/JSON over HTTPS) ⇄ [Express Backend] ⇄ [PostgreSQL via Prisma]
```
- **Authentication Flow**: User posts credentials → `/auth/login` → returns JWT access & refresh tokens → stored client‑side (httpOnly cookie or local storage) → subsequent API calls validated by `authMiddleware`.
- **Mentor Allocation Flow**: HOD creates a **Team**, then posts to `/hod/assign-mentor` → creates `hod_mentor_management` entry and updates `MentorAllocation` → notifications sent to mentor & team.
- **Project Submission Flow**: Student fills a dynamic **ProjectForm**, submits via `/student/submit-form` → creates `ProjectFormSubmission` → Mentor reviews → HOD may approve via `/hod/review-submission`.

All flows are event‑driven; changes trigger rows in the **Notification** table, which the frontend polls or receives via WebSocket.

## Database Overview

| Domain | Core Tables | Additional Tables |
|--------|-------------|-------------------|
| Users & Auth | `User`, `UserSession`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`, `LoginAttempt`, `AuditLog` | `hods`, `hod_mentor_management`, `hod_student_approvals`, `hod_submission_reviews` |
| Profiles | `StudentProfile`, `MentorProfile` | — |
| Academic Structure | `Branch`, `Department`, `AcademicYear` | — |
| Projects | `Project`, `ProjectMember`, `Milestone`, `Task`, `ProjectMessage`, `ProjectFile` | `Team`, `TeamMember`, `MentorAllocation`, `ProjectForm`, `ProjectFormSubmission` |
| Notifications & Activity | `Notification`, `ActivityLog` | `Upload` |
| Registrations | `RegistrationForm`, `RegistrationFormSubmission` | — |

Relationships are visualised in the ER diagram below (textual):
```
User 1---* StudentProfile
User 1---* MentorProfile
Hods 1---* MentorProfile
Hods 1---* MentorAllocation
Hods 1---* hod_mentor_management
Hods 1---* hod_student_approvals
Hods 1---* hod_submission_reviews
Hods 1---* Team
Team 1---* TeamMember
Team *---1 MentorAllocation
Project 1---* ProjectMember
Project 1---* Milestone
Milestone 1---* Task
Project 1---* ProjectForm
ProjectForm 1---* ProjectFormSubmission
```

## User Roles

- **Student** – accesses student portal, creates/joins teams, submits projects.
- **Mentor** – manages assigned teams, reviews submissions.
- **HOD** – oversees the entire ecosystem, performs mentor allocation, approves students and submissions.

*No generic admin role exists; HODs hold administrative privileges.

## Authentication Flow

1. **Login** (`POST /auth/login`) – verifies email/password with bcrypt, issues **access token** (15 min) and **refresh token** (7 days).
2. **Protected Routes** – `authMiddleware` checks `Authorization: Bearer <token>`; validates token signature & expiry.
3. **Role Validation** – `roleMiddleware('HOD')`, `roleMiddleware('Mentor')`, etc., ensure only authorized roles can hit specific endpoints.
4. **Token Refresh** – `POST /auth/refresh` exchanges a valid refresh token for a new access token.
5. **Logout** – revokes refresh token by deleting its row in `UserSession`.

## Academic Year System

The `AcademicYear` table stores active sessions. Currently configured active years are:
- **2026‑27**
- **2027‑28**
- **2028‑29**

Only the `isActive` flag set to `true` is considered by the `yearFilter` middleware, which automatically scopes queries for students, mentors, and HODs.

## Future Enhancements

- **Analytics Dashboard** with project performance metrics.
- **Attendance Module** for lab/meeting check‑ins.
- **AI‑driven project recommendations** based on student skill profiles.
- **Advanced Reporting** (PDF export, export to LMS).
- **Real‑time Chat** between mentors and students.
- **Event Management** for hackathons, seminars.
- **Granular RBAC** with permission groups.

## Setup & Running

### Prerequisites
- **Node.js** (>=18)
- **npm** or **yarn**
- **PostgreSQL** instance (Neon URL recommended)
- **Cloudinary** account (optional for file storage)

### Backend
```bash
cd backend
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, CLOUDINARY_*, etc.
npm install
npx prisma migrate dev   # creates tables
npm run dev               # starts Express server on http://localhost:5000
```
### Frontend
```bash
cd frontend
npm install
npm run dev               # Vite dev server on http://localhost:3000
```
### Docker (optional)
```bash
docker compose up --build
```

---

*All sections above are generated from the current code‑base and inferred requirements. Adjustments can be made by editing Prisma models, adding missing tables, and re‑running migrations.*

## 🏫 HOD Module Architecture

### HOD Tables

| Table | Purpose | Primary Key | Foreign Keys | Key Columns |
|------|---------|--------------|--------------|-------------|
| **Hods** | Stores HOD authentication and department management data. | `id` (UUID) | — | `full_name`, `email`, `password`, `department`, `designation`, `mobile_number`, `profile_image`, `is_active`, `created_at`, `updated_at` |
| **hod_mentor_management** | Tracks mentor assignments performed by HODs. | `id` (UUID) | `hod_id → Hods.id`, `mentor_id → MentorProfile.id` | `action_type`, `created_at` |
| **hod_student_approvals** | Stores student registration approval history. | `id` (UUID) | `hod_id → Hods.id`, `student_id → User.id` | `approval_status`, `remarks`, `approved_at` |
| **hod_submission_reviews** | Stores HOD review actions for project submissions. | `id` (UUID) | `hod_id → Hods.id`, `submission_id → ProjectFile.id` | `status`, `feedback`, `reviewed_at` |

### Relationships

| Parent Table | Child Table | Relationship |
|--------------|-------------|--------------|
| **Hods** | **MentorProfile** | One‑to‑Many (HOD manages many mentors) |
| **Hods** | **MentorAllocation** | One‑to‑Many |
| **Hods** | **hod_mentor_management** | One‑to‑Many |
| **Hods** | **hod_student_approvals** | One‑to‑Many |
| **Hods** | **hod_submission_reviews** | One‑to‑Many |
| **Hods** | **Team** | One‑to‑Many (monitoring) |

### Authentication Flow
1. **Login** – HOD submits email & password → JWT issued (`/hod/login`).
2. **Protected Routes** – Middleware checks `role === 'HOD'`.
3. **Role‑Based Authorization** – Only HOD can access mentor‑management, student‑approval, and submission‑review endpoints.
4. **Permissions** – HOD can create/modify `MentorAllocation` and trigger related `Notification`s.

### HOD Workflow
1. **HOD login** – receives JWT.
2. **Assign mentors** – POST to `/hod/assign-mentor` creates `hod_mentor_management` entry & updates `MentorAllocation`.
3. **Student approvals** – POST to `/hod/approve-student` inserts into `hod_student_approvals`; updates `User` status.
4. **Monitor teams** – GET `/hod/teams` returns teams with progress metrics.
5. **Review submissions** – POST to `/hod/review-submission` writes `hod_submission_reviews`, updates submission status, sends `Notification`.
6. **Notifications** – Automatic creation of notifications for mentors, students, and admins on each action.

### ER Diagram (textual)
```
Hods 1---* MentorProfile
Hods 1---* MentorAllocation
Hods 1---* hod_mentor_management
Hods 1---* hod_student_approvals
Hods 1---* hod_submission_reviews
Hods 1---* Team
```

These additions complete the HOD module documentation and keep the database architecture consistent and ready for implementation.

---

*End of README*
