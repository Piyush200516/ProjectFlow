# ProjectFlow Edu App Documentation

## Project Overview

**ProjectFlow Edu App** is an academic project‑management platform that enables seamless collaboration between **students**, **mentors**, and **heads of department (HODs)**. It digitises the entire lifecycle of semester‑long capstone projects, from team formation to final grading, with real‑time notifications and audit logging.

- **Students** create, join teams, submit project forms and files, and track submission status.
- **Mentors** are allocated to teams, monitor progress, create tasks, and review submissions.
- **HODs** oversee mentor allocations, approve student registrations, review and approve submissions, and manage academic years.

## Main Features

### Student Features
- Registration & JWT login
- Profile & academic profile management (branch, department, academic year)
- Team creation & joining
- Dynamic project form submission (JSON schema driven)
- File uploads (reports, designs, etc.)
- Submission tracking & status view
- Mentor information view
- Real‑time notifications

### Mentor Features
- Secure login
- Dashboard of assigned students and teams
- Team progress monitoring
- Review & feedback on project submissions
- Task creation & status updates
- Notification handling

### HOD Features
- HOD authentication & role‑based access
- Mentor allocation to teams (via **MentorAllocation**)
- Student registration approval workflow
- Submission review & approval
- Team monitoring & analytics dashboard
- Management of academic years, branches, and departments

## Technology Stack

### Frontend
- **React.js** with functional components & hooks
- **Vite** for fast development builds
- **Tailwind CSS** (utility‑first styling, dark mode ready)
- **Material UI** for complex UI components
- **Axios** for HTTP API calls
- **React Router** for SPA navigation

### Backend
- **Node.js** (v18+)
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
- Access & Refresh tokens
- Role‑Based Access Control (RBAC) – `Student`, `Mentor`, `HOD`
- Rate limiting & input validation middleware

### File Upload System
- **Multer** stores temporary files
- **Cloudinary** (or local storage) for permanent asset hosting
- Metadata persisted in `ProjectFile` and generic `Upload` tables

### DevOps / Deployment
- **GitHub** for source control & CI/CD workflows
- **Render / Railway** (or Netlify for frontend) for production hosting
- Dockerfile (Node base) for containerised deployments
- Environment variables for DB URL, JWT secret, Cloudinary keys, etc.

## System Architecture

```text
[Frontend React SPA] ⇄ (REST/JSON over HTTPS) ⇄ [Express Backend] ⇄ [PostgreSQL via Prisma]
```

- **Authentication Flow** – `/auth/login` returns JWT access & refresh tokens; protected routes validate tokens via `authMiddleware`.
- **Mentor Allocation Flow** – HOD creates a **Team**, posts to `/hod/assign-mentor`; creates `hod_mentor_management` entry and updates `MentorAllocation`; notifications sent to mentor & team.
- **Project Submission Flow** – Student submits a dynamic **ProjectForm** via `/student/submit-form`; creates `ProjectFormSubmission`; Mentor reviews; HOD may approve via `/hod/review-submission`.
- All flows generate rows in the **Notification** table, consumed by the frontend via polling or WebSocket.

## Database Architecture

### 1. Authentication Tables
| Table | Purpose | Primary Key | Important Columns |
|-------|---------|-------------|-------------------|
| **User** | Central identity for all actors | `id` (UUID) | `email`, `passwordHash`, `role` (`STUDENT`/`MENTOR`/`HOD`), `isEmailVerified`, `createdAt`, `updatedAt` |
| **UserSession** | Refresh‑token tracking | `id` (UUID) | `userId → User.id`, `refreshToken`, `expiresAt`, `createdAt` |
| **RefreshToken**, **PasswordResetToken**, **EmailVerificationToken**, **LoginAttempt** | One‑time security tokens | `id` (UUID) | `userId → User.id`, token fields, expiry, createdAt |
| **Hods** | HOD authentication & department data | `id` (UUID) | `full_name`, `email`, `password`, `department`, `designation`, `mobile_number`, `profile_image`, `is_active`, `created_at`, `updated_at` |

### 2. Academic Structure Tables
| Table | Purpose | Primary Key | Important Columns |
|-------|---------|-------------|-------------------|
| **AcademicYear** | Active academic session | `id` (UUID) | `yearLabel` (e.g., `2026-27`), `startDate`, `endDate`, `isActive` |
| **Branch** | Student/mentor branch classification | `id` (UUID) | `name`, `code` |
| **Department** | Department hierarchy | `id` (UUID) | `name`, `code` |

### 3. Profile Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **StudentProfile** | Student‑specific details | `id` (UUID) | `userId → User.id` | `fullName`, `rollNumber`, `branchId`, `departmentId`, `academicYearId`, `createdAt`, `updatedAt` |
| **MentorProfile** | Mentor‑specific details | `id` (UUID) | `userId → User.id` | `fullName`, `employeeId`, `departmentId`, `createdAt`, `updatedAt` |

### 4. Team Management Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **Team** | Logical grouping of students for a project | `id` (UUID) | `mentorId → MentorProfile.id` (optional), `projectId → Project.id` | `name`, `createdAt`, `updatedAt` |
| **TeamMember** | Many‑to‑many link between Team and Student Users | `id` (UUID) | `teamId → Team.id`, `studentId → User.id` | `role` (`LEADER`/`DEVELOPER`), `joinedAt` |

### 5. Mentor Allocation Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **MentorAllocation** | Tracks which mentor is allocated to which team for a given academic year | `id` (UUID) | `mentorId → MentorProfile.id`, `teamId → Team.id`, `academicYearId → AcademicYear.id` | `allocationDate`, `status` |
| **hod_mentor_management** | Records HOD‑initiated mentor assignment actions | `id` (UUID) | `hodId → Hods.id`, `mentorId → MentorProfile.id` | `action_type` (e.g., `ASSIGN`, `REMOVE`), `created_at` |

### 6. Project Management Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **Project** | Represents a capstone/semester project | `id` (UUID) | `mentorId → MentorProfile.id`, `departmentId`, `branchId`, `academicYearId` | `title`, `description`, `status`, `createdAt`, `updatedAt` |
| **ProjectMember** | Student ↔ Project many‑to‑many link | `id` (UUID) | `projectId → Project.id`, `studentId → User.id` | `role` (`LEADER`/`DEVELOPER`), `joinedAt` |
| **Milestone** | Project phases | `id` (UUID) | `projectId → Project.id` | `title`, `deadline`, `status`, `createdAt`, `updatedAt` |
| **Task** | Individual tasks under a milestone | `id` (UUID) | `milestoneId → Milestone.id`, `assigneeId → User.id` (optional) | `title`, `description`, `status`, `dueDate`, `createdAt`, `updatedAt` |
| **ProjectMessage** | Chat / communication within a project | `id` (UUID) | `projectId → Project.id`, `senderId → User.id` | `content`, `createdAt` |
| **ProjectFile** | Metadata for uploaded project assets | `id` (UUID) | `projectId → Project.id`, `uploadedBy → User.id` | `fileName`, `fileUrl`, `fileType`, `size`, `createdAt` |
| **ProjectForm** | Definition of a custom project submission form (JSON schema) | `id` (UUID) | `createdBy → User.id` | `title`, `description`, `formSchema` (JSON), `isActive`, `createdAt` |
| **ProjectFormSubmission** | Stores user‑filled form data for a specific project submission | `id` (UUID) | `FormId → ProjectForm.id`, `projectId → Project.id`, `studentId → User.id` | `submissionData` (JSON), `submittedAt`, `status` |

### 7. Registration & Approval Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **RegistrationForm** | HOD‑level registration of new student batches | `id` (UUID) | `createdBy → User.id` | `batchYear`, `branchId`, `departmentId`, `isPublished`, `createdAt` |
| **RegistrationFormSubmission** | Individual student registration data per batch | `id` (UUID) | `registrationFormId → RegistrationForm.id`, `studentId → User.id` | `submittedData` (JSON), `submittedAt` |
| **hod_student_approvals** | History of HOD student approval actions | `id` (UUID) | `hodId → Hods.id`, `studentId → User.id` | `approval_status`, `remarks`, `approved_at` |
| **hod_submission_reviews** | HOD review actions for project submissions | `id` (UUID) | `hodId → Hods.id`, `submissionId → ProjectFile.id` | `status`, `feedback`, `reviewed_at` |

### 8. Notification & Upload Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **Notification** | System‑wide notifications (assignment, deadline, review) | `id` (UUID) | `userId → User.id` | `type`, `payload` (JSON), `read` (boolean), `createdAt` |
| **Upload** | Generic file metadata for any module (profile pictures, documents) | `id` (UUID) | `uploadedBy → User.id` | `fileName`, `fileUrl`, `mimeType`, `size`, `context` (enum), `createdAt` |

### 9. Activity & Audit Tables
| Table | Purpose | Primary Key | Foreign Keys | Important Columns |
|-------|---------|-------------|--------------|-------------------|
| **ActivityLog** | Fine‑grained user activity tracking (page visits, button clicks) | `id` (UUID) | `userId → User.id` | `action`, `metadata` (JSON), `timestamp` |
| **AuditLog** | Immutable audit trail of critical actions | `id` (UUID) | `userId → User.id` (optional) | `action`, `resource`, `resourceId`, `ip`, `userAgent`, `createdAt` |

### 10. Future Planned Tables (Roadmap)
- **mentor_feedback** – Structured feedback from mentors on student work.
- **attendance** – Attendance records for labs / meetings.
- **analytics_reports** – Pre‑computed analytics for dashboards.
- **archived_students** – Historical student records after graduation.
- **project_progress** – Snapshots of project milestone progress over time.
- **submission_history** – Versioned history of project submissions.
- **event_management** – Hackathon / seminar event data.

## Relationships & ER Summary

**Key Relationships**
- One **User** → one **StudentProfile** / one **MentorProfile** (polymorphic).
- One **Hod** → many **MentorProfile** (manages mentors).
- One **Hod** → many **MentorAllocation**, **hod_mentor_management**, **hod_student_approvals**, **hod_submission_reviews**, **Team**.
- One **Team** → many **TeamMember** (students).
- One **Team** → many **MentorAllocation** (each allocation ties a mentor to a team for a specific academic year).
- One **Project** → many **ProjectMember**, **Milestone**, **ProjectFile**, **ProjectMessage**.
- One **ProjectForm** → many **ProjectFormSubmission**.
- One **RegistrationForm** → many **RegistrationFormSubmission**.
- One **AcademicYear** → many **Project**, **MentorAllocation**, **RegistrationForm** (scoped data).
- One **Notification** belongs to a **User**.
- One **Upload** belongs to a **User**.

**Textual ER Diagram**
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
Project 1---* ProjectFile
Project 1---* ProjectMessage
ProjectForm 1---* ProjectFormSubmission
RegistrationForm 1---* RegistrationFormSubmission
User 1---* Notification
User 1---* Upload
User 1---* ActivityLog
User 1---* AuditLog
AcademicYear 1---* Project
AcademicYear 1---* MentorAllocation
AcademicYear 1---* RegistrationForm
```

## Mentor Allocation Workflow
1. **HOD login** → JWT.
2. **Create Team** via `/hod/create-team` (stores in `Team`).
3. **Assign Mentor** via `/hod/assign-mentor` → creates `hod_mentor_management` record and a `MentorAllocation` row linking the selected mentor, team, and current `AcademicYear`.
4. **Notification** created for the mentor and team members.
5. **Student dashboard** queries `TeamMember` & `MentorAllocation` to display assigned mentor.
6. **Mentor dashboard** lists teams where `MentorAllocation.mentorId = currentMentorId`.

## Project & Submission Workflow
1. **Student creates/joins Team** → `TeamMember` rows.
2. **Student fills ProjectForm** → `ProjectFormSubmission`.
3. **Mentor reviews** → updates `ProjectFormSubmission.status` and may add comments (stored in `ProjectMessage`).
4. **HOD final approval** via `/hod/review-submission` → creates `hod_submission_reviews` entry, updates `ProjectFile` status, and triggers a `Notification`.

## File Upload System
- **Multer** handles multipart uploads.
- Files are stored in Cloudinary (or local storage) and the URL plus metadata are saved in **ProjectFile** (project‑specific) or **Upload** (generic).
- `Upload.context` enum distinguishes purpose (`PROFILE_PIC`, `PROJECT_DOC`, `SUBMISSION_ASSET`).

## Migration & Prisma Commands
```bash
# Install dependencies
npm install

# Generate Prisma client & apply migrations
docker compose up -d db   # if using Docker PostgreSQL
npx prisma generate
npx prisma migrate dev   # creates/updates all tables defined below
```

## Setup & Running
### Backend
```bash
cd backend
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, CLOUDINARY_*, etc.
npm install
npx prisma migrate dev   # creates tables
npm run dev               # starts Express server (http://localhost:5000)
```
### Frontend
```bash
cd frontend
npm install
npm run dev               # Vite dev server (http://localhost:3000)
```
### Docker (optional)
```bash
docker compose up --build
```

---

*All sections above are generated from the current code‑base and inferred requirements. Adjustments can be made by editing Prisma models, adding missing tables, and re‑running migrations.*

*End of README*
