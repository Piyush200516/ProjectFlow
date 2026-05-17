# ProjectFlow Edu — PostgreSQL Database Schema

This directory contains the database definition and seeding instructions for **ProjectFlow Edu**, a production-grade academic project lifecycle management platform. The schema has been built natively for PostgreSQL, leveraging standard relational constraints, performance indexing, automatic modification triggers, and institutional business logic.

---

## 📂 Core Schema Files

* **PostgreSQL Schema & Seed File:** [projectflow_edu_postgres_schema.sql](file:///e:/ProjectFlow/database/projectflow_edu_postgres_schema.sql)
* **Legacy MySQL Schema (Reference):** [projectflow_edu_schema.sql](file:///e:/ProjectFlow/database/projectflow_edu_schema.sql)

---

## 🛠️ 1. How to Create the Database in pgAdmin

Follow these steps to initialize your database container using pgAdmin:

1. **Launch pgAdmin** and connect to your target PostgreSQL Server instance.
2. In the left-hand Browser panel, right-click on the **Databases** node under your server.
3. Select **Create** ➡️ **Database...**.
4. In the dialog window that appears:
   * **Database:** Enter `projectflow_edu`
   * **Owner:** Select `postgres` (or your preferred database administrator role).
5. Click **Save** to create the database.

---

## 🚀 2. How to Run the SQL Schema File

Once the database has been created, run the setup script:

1. Right-click on the newly created `projectflow_edu` database in the pgAdmin Browser panel.
2. Select **Query Tool** to open a new SQL editor session connected specifically to your new database.
3. Open the file [projectflow_edu_postgres_schema.sql](file:///e:/ProjectFlow/database/projectflow_edu_postgres_schema.sql), copy its entire contents, and paste it into the pgAdmin Query Editor.
4. Alternatively, click the **Folder icon (Open File)** in pgAdmin and import `projectflow_edu_postgres_schema.sql` directly.
5. Click the **Execute/Refresh button (Lightning Bolt / F5)** at the top of the Query Tool.
6. Look at the Messages panel at the bottom to verify that the tables, triggers, indexes, and seed records were created successfully.

> [!NOTE]
> This schema is engineered to be **100% re-runnable**. Running the script multiple times will safely tear down and rebuild all components in reverse dependency order without constraint conflicts.

---

## 🏗️ 3. Database Architecture & Table Mapping

The schema comprises exactly **25 highly specialized tables**, logically categorized to serve the academic workspace:

### Academic Structure
1. `departments` - College academic departments (e.g. Engineering & Technology).
2. `branches` - Specific fields of study within departments (e.g. CSE, IT).

### Authentication & Users
3. `users` - Secure core user table holding credentials, status, and role definitions.
4. `students` - Extends `users` with roll numbers, branches, semesters, and performance scoring.
5. `mentors` - Extends `users` with faculty designations, specialties, and maximum project capacities.

### Project Lifecycle
6. `projects` - Central workspace representing student teams, project types, progress, and mentors.
7. `project_members` - Maps student users to projects (enforcing a strictly configured team limit).

### Kanban Workspace & Schedules
8. `sdlc_stages` - Core master configuration columns for the SDLC Kanban workflow.
9. `tasks` - Task board cards mapped to stages, including priorities, progress, and assignees.
10. `milestones` - Project schedule markers (e.g., Mid-Term Review, Final Demo).

### Documentation Workspace
11. `document_templates` - Storage mappings for master document frames (e.g. SRS, Thesis templates).
12. `document_assignments` - Task deliverables requiring document submissions.
13. `document_submissions` - Core storage record for uploaded student files, reviews, and marks.
14. `document_versions` - Multi-version rollback ledger track history of draft revisions.
15. `final_submissions` - Records final university reports, presentations, and code repository links (GitHub).

### Evaluations & Approvals
16. `mentor_feedback` - Continuous mentorship commentary and sentiment tracking.
17. `evaluations` - Final rubrics tracking skill levels, completeness, documentation, and speed.
18. `approvals` - Formal multi-tier workflows tracking HOD and CDC approvals.

### Services & Communications
19. `notifications` - System-wide alerts, success logs, and task assignment notices.
20. `chat_messages` - Direct messages and workspace chat channels with target constraints.
21. `activity_logs` - Immutable audit logs tracking security modifications and uploads.
22. `calendar_events` - Event logs storing schedule deadlines, reviews, and hackathons.

### Innovation & Incubation (CDC)
23. `hackathons` - Event registrations and details hosted by the Career Development Cell.
24. `startups` - Seed incubation details tracking spinoff companies, funding, and websites.
25. `industry_collaborations` - Professional MoUs, placements, and R&D tie-ups.

---

## 🔐 4. Custom Database triggers (PostgreSQL Dialect)

To enforce institutional policies directly at the database layer, the schema compiles native PL/pgSQL functions:

1. **Auto-Updated Modification Timestamps:**
   Triggers monitor updates to the `users`, `projects`, and `tasks` tables, dynamically refreshing `updated_at` timestamps via the `update_modified_column()` trigger function.
2. **Maximum 5 Team Members Limit:**
   The `enforce_max_members` trigger fires `BEFORE INSERT` on the `project_members` table, evaluating the count of existing members. If a student tries to join a team that already has **5 active members**, PostgreSQL will abort the transaction with:
   `Constraint Violated: A project team cannot exceed the limit of 5 members.`

---

## 🔑 5. Pre-seeded Portals Credentials

To jumpstart development, the schema seeds users with realistic college profiles. All passwords are set to the requested placeholder hash.

| Email | Role | Full Name | Academic Assignment / Profile |
| :--- | :--- | :--- | :--- |
| `admin@college.edu` | `admin` | System Administrator | System-wide database and configuration control. |
| `hod@college.edu` | `hod` | Dr. Alok Chandra | HOD of CSE, AI Specialist, Approver. |
| `mentor@college.edu` | `mentor` | Dr. Priya Sharma | Associate Professor, Software Engineering & Cloud. |
| `cdc@college.edu` | `cdc` | Prof. Ramesh Anand | Training & Placement Head, Startup Incubator. |
| `student@college.edu` | `student` | Piyush Mishra | Leader of team **ByteCraft** (CSE Sem-6). |
| `student2@college.edu` | `student` | Rohan Verma | Leader of team **AgriTech AI** (CSE Sem-6). |
| `student3@college.edu` | `student` | Anjali Gupta | Developer in team **ByteCraft** (CSE Sem-6). |

> **Password Hash Placeholder:** `password123_hash_here`

---

## ⚙️ 6. Backend Integration Environment Variables

To connect your Node.js/Express or Python backend to the newly provisioned PostgreSQL instance, populate your local `.env` configuration file:

```env
# Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=projectflow_edu

# Database Connection Pool Settings (Optional but Recommended)
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_TIMEOUT=30000
DB_POOL_IDLE=10000
```
