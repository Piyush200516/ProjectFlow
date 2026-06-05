# 📚 Database Architecture Overview

The **ProjectFlow Edu App** is a full‑stack campus project‑management platform. It uses **PostgreSQL (Neon‑compatible)** with **Prisma ORM** for the backend and **Express**/Serverless for APIs. All domain data lives in a normalized relational schema that powers authentication, mentor allocation, team‑work, project submission, notifications, academic‑year handling, and audit logging.

---

## 📦 Core Tables (Existing in Prisma Schema)

| Table | Purpose | Primary Key | Foreign Keys | Key Columns |
|-------|---------|--------------|--------------|-------------|
| **User** | Central identity for all actors (students, mentors, admins). | `id` (UUID) | — | `email`, `role`, `isEmailVerified`, `createdAt`, `updatedAt` |
| **StudentProfile** | Student‑specific data linked to a `User`. | `id` (UUID) | `userId → User.id` | `fullName`, `rollNumber`, `branchId`, `departmentId`, `academicYearId`, `createdAt`, `updatedAt` |
| **MentorProfile** | Mentor‑specific data linked to a `User`. | `id` (UUID) | `userId → User.id` | `fullName`, `employeeId`, `departmentId`, `createdAt`, `updatedAt` |
| **UserSession** | JWT refresh‑session tracking. | `id` (UUID) | `userId → User.id` | `refreshToken`, `expiresAt`, `createdAt` |
| **RefreshToken**, **PasswordResetToken**, **EmailVerificationToken**, **LoginAttempt** | Security‑related one‑time tokens and login audit. | `id` (UUID) | `userId → User.id` (where applicable) | `token`, `expiresAt`, `createdAt` |
| **AuditLog** | Immutable audit trail of critical actions. | `id` (UUID) | `userId → User.id` (optional) | `action`, `resource`, `resourceId`, `ip`, `userAgent`, `createdAt` |
| **Project** | Represents a capstone/semester project. | `id` (UUID) | `mentorId → MentorProfile.id`, `departmentId`, `branchId`, `academicYearId` | `title`, `description`, `status`, `createdAt`, `updatedAt` |
| **ProjectMember** | Many‑to‑many link between `Project` and student `User`s. | `id` (UUID) | `projectId → Project.id`, `studentId → User.id` | `role` (LEADER/DEVELOPER), `joinedAt` |
| **Milestone** | Project milestones (phases). | `id` (UUID) | `projectId → Project.id` | `title`, `deadline`, `status`, `createdAt`, `updatedAt` |
| **Task** | Individual tasks under a milestone. | `id` (UUID) | `milestoneId → Milestone.id`, `assigneeId → User.id` (optional) | `title`, `description`, `status`, `dueDate`, `createdAt`, `updatedAt` |
| **ProjectMessage** | Chat/communication within a project. | `id` (UUID) | `projectId → Project.id`, `senderId → User.id` | `content`, `createdAt` |
| **ProjectFile** | File uploads associated with a project (reports, designs, etc.). | `id` (UUID) | `projectId → Project.id`, `uploadedBy → User.id` | `fileName`, `fileUrl`, `fileType`, `size`, `createdAt` |
| **Notification** | System‑wide notifications (assignment, deadline, mentor allocation). | `id` (UUID) | `userId → User.id` | `type`, `payload`, `read`, `createdAt` |
| **AcademicYear** | Academic session (e.g., 2024‑2025) used for filtering. | `id` (UUID) | — | `yearLabel`, `startDate`, `endDate`, `isActive` |
| **Branch**, **Department** | Organizational hierarchy for students/mentors. | `id` (UUID) | — | `name`, `code` |

---

## 🔧 Additional Required Tables (Not Yet in Prisma Schema)

These tables are inferred from the UI flows, controller logic, and migration scripts, but are **absent** from the current Prisma model. Adding them makes the system fully functional for mentor allocation, team management, project submission, and academic‑year handling.

| Table | Purpose | Primary Key | Foreign Keys | Key Columns |
|------|---------|--------------|--------------|-------------|
| **Team** | Logical grouping of students for a project (used by HOD & Mentor portals). | `id` (UUID) | `mentorId → MentorProfile.id` (optional), `projectId → Project.id` | `name`, `createdAt`, `updatedAt` |
| **TeamMember** | Many‑to‑many link between `Team` and student `User`s. | `id` (UUID) | `teamId → Team.id`, `studentId → User.id` | `role` (LEADER/DEVELOPER), `joinedAt` |
| **MentorAllocation** | Tracks which mentor is allocated to which team/academic year. | `id` (UUID) | `mentorId → MentorProfile.id`, `teamId → Team.id`, `academicYearId → AcademicYear.id` | `allocationDate`, `status` |
| **ProjectForm** | Definition of a custom project submission form (dynamic fields). | `id` (UUID) | `createdBy → User.id` | `title`, `description`, `formSchema (JSON)`, `isActive`, `createdAt` |
| **ProjectFormSubmission** | Stores user‑filled form data for a specific project submission. | `id` (UUID) | `projectFormId → ProjectForm.id`, `projectId → Project.id`, `studentId → User.id` | `submissionData (JSON)`, `submittedAt`, `status` |
| **RegistrationForm** | HOD‑level registration of new student batches (used during onboarding). | `id` (UUID) | `createdBy → User.id` | `batchYear`, `branchId`, `departmentId`, `isPublished`, `createdAt` |
| **RegistrationFormSubmission** | Records each student’s registration information per batch. | `id` (UUID) | `registrationFormId → RegistrationForm.id`, `studentId → User.id` | `submittedData (JSON)`, `submittedAt` |
| **ActivityLog** | Fine‑grained user activity tracking (page visits, button clicks). | `id` (UUID) | `userId → User.id` | `action`, `metadata (JSON)`, `timestamp` |
| **Upload** | Generic file upload metadata for any module (profile pictures, documents). | `id` (UUID) | `uploadedBy → User.id` | `fileName`, `fileUrl`, `mimeType`, `size`, `context` (enum), `createdAt` |

---

## 🔗 Relationships Overview

- **User ↔︎ StudentProfile / MentorProfile** – One‑to‑One (polymorphic role).
- **StudentProfile ↔︎ Branch / Department / AcademicYear** – Many‑to‑One for organizational classification.
- **Project ↔︎ MentorProfile** – Many‑to‑One (a project has a single mentor).
- **Project ↔︎ ProjectMember ↔︎ User** – Many‑to‑Many through `ProjectMember` (students join projects).
- **Project ↔︎ Team ↔︎ TeamMember ↔︎ User** – Optional hierarchical grouping; a team belongs to a project and can have a dedicated mentor.
- **Team ↔︎ MentorAllocation ↔︎ MentorProfile / AcademicYear** – One‑to‑Many (a mentor may be allocated to multiple teams per academic year).
- **Project ↔︎ ProjectForm ↔︎ ProjectFormSubmission** – One‑to‑Many for dynamic project submission forms.
- **User ↔︎ Notification** – One‑to‑Many (notifications per user).
- **User ↔︎ AuditLog / ActivityLog** – One‑to‑Many for security and analytic purposes.
- **Branch ↔︎ Department ↔︎ StudentProfile / MentorProfile** – Hierarchical organizational mapping.
- **AcademicYear ↔︎ Project / MentorAllocation / RegistrationForm** – Temporal scoping of projects and mentor assignments.

---

## 📡 API / Controller Mapping

| Feature | Controllers / Services | Affected Tables |
|---------|------------------------|-----------------|
| **Auth** (login, signup, email‑verify, password‑reset) | `authController.js`, `authService.js` | `User`, `UserSession`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`, `LoginAttempt`, `AuditLog` |
| **Student Dashboard** (view projects, submit forms) | `studentController.js`, `projectService.js` | `Project`, `ProjectMember`, `ProjectForm`, `ProjectFormSubmission`, `ProjectFile`, `Notification` |
| **Mentor Portal** (allocate mentors, view team progress) | `mentorController.js`, `mentorService.js` | `MentorProfile`, `Team`, `TeamMember`, `MentorAllocation`, `Project`, `Task`, `Milestone` |
| **HOD Portal** (manage registrations, academic years) | `hodController.js`, `registrationService.js` | `RegistrationForm`, `RegistrationFormSubmission`, `AcademicYear`, `Branch`, `Department` |
| **Team Management** (create team, add/remove members) | `teamController.js`, `teamService.js` | `Team`, `TeamMember`, `User`, `Project` |
| **Project Submission** (upload files, submit form) | `submissionController.js`, `fileService.js` | `ProjectFile`, `ProjectFormSubmission`, `Upload` |
| **Notifications** (push, read) | `notificationController.js`, `notificationService.js` | `Notification` |
| **Audit / Activity** (log actions) | `auditService.js`, `activityService.js` | `AuditLog`, `ActivityLog` |
| **Academic Year Switching** (filter data by active year) | Middleware `yearFilter.js` | `AcademicYear` |

---

## 🛠️ Workflow Summary (High‑Level)

1. **User Registration & Email Verification** – Creates a `User` record, sends an email verification token, and logs the event in `AuditLog`.
2. **Student Profile Completion** – Populates `StudentProfile` (branch, department, academic year). The `yearFilter` middleware automatically scopes queries to the active `AcademicYear`.
3. **Mentor Allocation** – HOD creates a `Team`, then uses `MentorAllocation` to assign a `MentorProfile` to the team for a given academic year. Allocation status changes trigger `Notification`s to the mentor and team members.
4. **Project Creation & Membership** – A mentor creates a `Project` (linked to their `MentorProfile`). Students join via `ProjectMember` or indirectly through a `Team`.
5. **Milestones & Tasks** – `Milestone`s are defined on a project; each milestone spawns `Task`s assigned to students. Task updates fire `Notification`s.
6. **Dynamic Form Submission** – HOD defines a `ProjectForm` (JSON schema). Students submit via `ProjectFormSubmission`; the JSON payload is stored and can be reviewed by mentors.
7. **File Uploads** – `ProjectFile` stores metadata for any uploaded assets (reports, designs). Files are saved in cloud storage; the URL is stored in the DB.
8. **Notifications** – Real‑time (WebSocket) or polling consumes the `Notification` table. Users mark them as read, updating the `read` flag.
9. **Audit & Activity Logging** – Critical actions (project creation, mentor allocation, form submission) are recorded in `AuditLog`. UI interactions are captured in `ActivityLog` for analytics.
10. **Academic Year Cycle** – At the start of a new session, a new `AcademicYear` entry is added and set as `isActive`. All time‑sensitive queries automatically filter on the active year.

---

## 📄 Final Documentation Preview (Excerpt)

> The following excerpt shows the **exact** markdown that now lives in `README.md`. It replaces the previous database section (lines 490‑632) with a fresh, comprehensive design covering **all existing tables**, **newly required tables**, **relationships**, **API mappings**, and **workflow summaries**.

```markdown
## 📚 Database Architecture Overview

... (full content as shown above) ...
```

You can now navigate the repository and see that the backend is fully documented. Future developers can extend the schema, add new features, or generate migrations without guessing the data model.

---

*All sections above are generated from the current code‑base and the inferred requirements. Adjustments can be made by editing the Prisma models, adding the missing tables to `schema.prisma`, and re‑running `npx prisma migrate dev`. The README will stay in sync as long as the documentation block is refreshed after schema changes.*
