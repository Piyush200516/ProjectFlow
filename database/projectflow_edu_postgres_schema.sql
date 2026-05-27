-- =========================================================================
-- ProjectFlow Edu: Complete PostgreSQL Database Schema
-- Author: Antigravity AI
-- Target System: PostgreSQL (12.0+)
-- Database Name: projectflow_edu
-- Purpose: Complete SaaS academic project lifecycle management portal schema
-- =========================================================================

-- =========================================================================
-- SYSTEM SETUP INSTRUCTIONS (pgAdmin Query Tool)
-- =========================================================================
-- 1. Connect to your PostgreSQL server in pgAdmin.
-- 2. Create the projectflow_edu database if it does not exist:
--    CREATE DATABASE projectflow_edu;
-- 3. Open the Query Tool connected to the 'projectflow_edu' database.
-- 4. Paste and execute this entire file.
-- =========================================================================

-- Clean up existing triggers, functions, and tables in reverse dependency order
-- This ensures the script is 100% re-runnable without constraint conflicts.
DROP TRIGGER IF EXISTS enforce_max_members ON project_members;
DROP TRIGGER IF EXISTS update_users_modtime ON users;
DROP TRIGGER IF EXISTS update_projects_modtime ON projects;
DROP TRIGGER IF EXISTS update_tasks_modtime ON tasks;

DROP FUNCTION IF EXISTS check_project_members_limit();
DROP FUNCTION IF EXISTS update_modified_column();

DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS industry_collaborations CASCADE;
DROP TABLE IF EXISTS startups CASCADE;
DROP TABLE IF EXISTS hackathons CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS mentor_feedback CASCADE;
DROP TABLE IF EXISTS final_submissions CASCADE;
DROP TABLE IF EXISTS milestone_submissions CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_submissions CASCADE;
DROP TABLE IF EXISTS document_assignments CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS sdlc_stages CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS mentors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- =========================================================================
-- 1. ACADEMIC STRUCTURE
-- =========================================================================

-- =========================================================================
-- TABLE: departments
-- Purpose: Stores the main academic departments in the institution (e.g. Engineering).
-- =========================================================================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE departments IS 'Academic departments in the college';

-- =========================================================================
-- TABLE: branches
-- Purpose: Stores specific academic streams/branches belonging to departments (e.g. CSE).
-- =========================================================================
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE branches IS 'Academic branches within departments';

-- =========================================================================
-- 2. AUTHENTICATION & PORTAL USERS
-- =========================================================================

-- =========================================================================
-- TABLE: users
-- Purpose: Core authentication table that supports role-based access control.
-- =========================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'mentor', 'hod', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'User authentication and core role management';

-- =========================================================================
-- TABLE: students
-- Purpose: Holds academic profile metrics and scoring elements specific to students.
-- =========================================================================
CREATE TABLE students (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    semester INT NOT NULL CONSTRAINT semester_check CHECK (semester BETWEEN 5 AND 8),
    academic_year VARCHAR(10) NOT NULL,
    current_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (current_score BETWEEN 0.00 AND 100.00),
    contribution_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (contribution_score BETWEEN 0.00 AND 100.00),
    timeliness_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (timeliness_score BETWEEN 0.00 AND 100.00)
);

COMMENT ON TABLE students IS 'Student profiles containing scores and academic identifiers';

-- =========================================================================
-- TABLE: mentors
-- Purpose: Profiles faculty members and tracks project allocation thresholds.
-- =========================================================================
CREATE TABLE mentors (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(255),
    max_projects INT DEFAULT 10 CHECK (max_projects > 0)
);

COMMENT ON TABLE mentors IS 'Faculty mentor profile metadata';

-- =========================================================================
-- 3. PROJECT WORKSPACE & TEAM MEMBERSHIP
-- =========================================================================

-- =========================================================================
-- TABLE: projects
-- Purpose: Represents a student project workspace, with an assigned mentor.
-- =========================================================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'Mini Project' CHECK (type IN ('Mini Project', 'Major Project', 'Hackathon Project', 'Final Year Project', 'Research Project')),
    team_name VARCHAR(100) DEFAULT 'Team Alpha',
    description TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Proposal' CHECK (status IN ('Proposal', 'In Progress', 'Review', 'Completed', 'On Hold', 'Rejected')),
    progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    branch_id INT DEFAULT 1 REFERENCES branches(id) ON DELETE RESTRICT,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE projects IS 'Academic projects submitted and tracked';

-- =========================================================================
-- TABLE: project_members
-- Purpose: Bridges students to their group projects. Max 5 members enforced by trigger.
-- =========================================================================
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_leader BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_member UNIQUE (project_id, student_id)
);

COMMENT ON TABLE project_members IS 'Project team membership lookup';

-- =========================================================================
-- 4. KANBAN WORKFLOW & MILESTONES
-- =========================================================================

-- =========================================================================
-- TABLE: sdlc_stages
-- Purpose: Stores columns/stages for the SDLC Kanban board.
-- =========================================================================
CREATE TABLE sdlc_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sequence_order INT NOT NULL UNIQUE,
    color_code VARCHAR(50) DEFAULT 'bg-slate-100'
);

COMMENT ON TABLE sdlc_stages IS 'SDLC workflow stages for Kanban column configuration';

-- =========================================================================
-- TABLE: tasks
-- Purpose: Tracks tasks in progress on a project Kanban board.
-- =========================================================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(100) DEFAULT 'Requirements',
    priority VARCHAR(20) DEFAULT 'Medium',
    members JSONB DEFAULT '[]'::jsonb,
    comments INT DEFAULT 0,
    attachments INT DEFAULT 0,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tasks IS 'Individual team tasks on the SDLC Kanban board';

-- =========================================================================
-- TABLE: milestones
-- Purpose: Represents timeline milestones for projects.
-- =========================================================================
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Missed')),
    completed_at DATE
);

COMMENT ON TABLE milestones IS 'Major project milestones and deadlines';

-- =========================================================================
-- TABLE: project_milestones
-- Purpose: Project-specific academic document timeline created by mentors/HODs.
-- =========================================================================
CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_milestone_order UNIQUE (project_id, sequence_order)
);

COMMENT ON TABLE project_milestones IS 'Document submission milestones such as Synopsis, SRS, PPT, Poster, Report, and GitHub final submission';

-- =========================================================================
-- TABLE: milestone_submissions
-- Purpose: Student uploads against project timeline milestones.
-- =========================================================================
CREATE TABLE milestone_submissions (
    id SERIAL PRIMARY KEY,
    milestone_id INT NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000),
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Reviewed', 'Rejected')),
    is_late BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    CONSTRAINT unique_milestone_student_submission UNIQUE (milestone_id, submitted_by)
);

COMMENT ON TABLE milestone_submissions IS 'Student file uploads for each project milestone with late status tracking';

-- =========================================================================
-- 5. DOCUMENT WORKSPACE & TEMPLATES
-- =========================================================================

-- =========================================================================
-- TABLE: document_templates
-- Purpose: Stores document templates (like SRS templates) uploaded by Mentors/HODs.
-- =========================================================================
CREATE TABLE document_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('SRS', 'Design', 'Code', 'Progress Report', 'Final Thesis', 'Presentation', 'Other')),
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE document_templates IS 'Syllabus and deliverable templates uploaded by administrators';

-- =========================================================================
-- TABLE: document_assignments
-- Purpose: Specific deliverable checkpoints assigned to a project.
-- =========================================================================
CREATE TABLE document_assignments (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id INT REFERENCES document_templates(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Submitted', 'Reviewed', 'Overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE document_assignments IS 'Required document submissions assigned to projects';

-- =========================================================================
-- TABLE: document_submissions
-- Purpose: Holds submissions made by students for assignments.
-- =========================================================================
CREATE TABLE document_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES document_assignments(id) ON DELETE CASCADE,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Needs Revision', 'Rejected')),
    score INT CHECK (score BETWEEN 0 AND 100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE document_submissions IS 'Students deliverables submissions records';

-- =========================================================================
-- TABLE: document_versions
-- Purpose: Stores absolute paths of each file upload revision.
-- =========================================================================
CREATE TABLE document_versions (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
    version_number VARCHAR(10) NOT NULL DEFAULT '1.0',
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL REFERENCES users(id),
    changelog TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE document_versions IS 'Submission version logs for audit and rollback';

-- =========================================================================
-- TABLE: final_submissions
-- Purpose: Stores the final thesis, presentation, and GitHub code repository.
-- =========================================================================
CREATE TABLE final_submissions (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    report_file_path VARCHAR(500) NOT NULL,
    code_repository_url VARCHAR(255) NOT NULL,
    presentation_file_path VARCHAR(500),
    plagiarism_percent DECIMAL(5,2) CHECK (plagiarism_percent BETWEEN 0.00 AND 100.00),
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE final_submissions IS 'Final year deliverables, GitHub links, and thesis documents';

-- =========================================================================
-- 6. EVALUATION, FEEDBACK & APPROVALS
-- =========================================================================

-- =========================================================================
-- TABLE: mentor_feedback
-- Purpose: Stores continuous mentoring advice and comments.
-- =========================================================================

-- =========================================================================
-- TABLE: documents
-- Purpose: Holds project deliverables and file uploads for API integration.
-- =========================================================================
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size VARCHAR(30),
    url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_project ON documents(project_id);

CREATE TABLE mentor_feedback (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    sentiment VARCHAR(20) DEFAULT 'Neutral' CHECK (sentiment IN ('Positive', 'Neutral', 'Critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mentor_feedback IS 'Mentors continuous review notes';

-- =========================================================================
-- TABLE: evaluations
-- Purpose: Academic scoring record across completion, speed, documentation, and skill.
-- =========================================================================
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    task_completion_score INT DEFAULT 0 CHECK (task_completion_score BETWEEN 0 AND 100),
    timeliness_score INT DEFAULT 0 CHECK (timeliness_score BETWEEN 0 AND 100),
    documentation_score INT DEFAULT 0 CHECK (documentation_score BETWEEN 0 AND 100),
    technical_skill_score INT DEFAULT 0 CHECK (technical_skill_score BETWEEN 0 AND 100),
    total_score INT DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE evaluations IS 'Marks and evaluation break-up';

-- =========================================================================
-- TABLE: approvals
-- Purpose: Handles multi-level workflow approval locks for HOD review.
-- =========================================================================
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('Project Proposal', 'Budget', 'Document', 'Startup Incubation', 'Final Submission')),
    target_id INT NOT NULL,
    approver_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Hold')),
    remarks TEXT,
    action_at TIMESTAMP
);

COMMENT ON TABLE approvals IS 'Formal approvals tracking log';

-- =========================================================================
-- 7. SYSTEM SERVICES (NOTIFICATIONS, CHAT, CALENDAR & AUDITING)
-- =========================================================================

-- =========================================================================
-- TABLE: notifications
-- Purpose: In-app real-time activity and status alert repository.
-- =========================================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Info',
    reference_id INT,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notifications IS 'System alerts for specific users';

-- =========================================================================
-- TABLE: chat_messages
-- Purpose: Supports workspace group discussions and private portal messages.
-- =========================================================================
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_chat_target CHECK (
        (project_id IS NOT NULL AND receiver_id IS NULL) OR 
        (project_id IS NULL AND receiver_id IS NOT NULL)
    )
);

COMMENT ON TABLE chat_messages IS 'Direct messages and project channel chats';

-- =========================================================================
-- TABLE: activity_logs
-- Purpose: Tracks changes and security logs for internal audits.
-- =========================================================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE activity_logs IS 'Audit logs recording administrative activity';

-- =========================================================================
-- TABLE: calendar_events
-- Purpose: Shared and private schedule dashboard markers and deadlines.
-- =========================================================================
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    event_type VARCHAR(50) DEFAULT 'Deadline' CHECK (event_type IN ('Deadline', 'Meeting', 'Evaluation', 'Presentation', 'Hackathon', 'General')),
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (start_time <= end_time)
);

COMMENT ON TABLE calendar_events IS 'Deadlines and calendar scheduler items';

-- =========================================================================
-- 8. INNOVATION TRACKING
-- =========================================================================

-- =========================================================================
-- TABLE: hackathons
-- Purpose: Lists incubation and national hackathons managed by HOD/Admin.
-- =========================================================================
CREATE TABLE hackathons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    venue VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Live', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE hackathons IS 'Hackathons organized and promoted by HOD/Admin';

-- =========================================================================
-- TABLE: startups
-- Purpose: Tracks innovative academic project spinoffs/startups.
-- =========================================================================
CREATE TABLE startups (
    id SERIAL PRIMARY KEY,
    project_id INT UNIQUE REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    founder_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    incubation_stage VARCHAR(50) DEFAULT 'Ideation' CHECK (incubation_stage IN ('Ideation', 'MVP', 'Seed', 'Scaling')),
    funding_status VARCHAR(50) DEFAULT 'Pending' CHECK (funding_status IN ('Self', 'Grant', 'VC', 'Pending')),
    website VARCHAR(255),
    innovation_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (innovation_score BETWEEN 0.00 AND 100.00),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE startups IS 'Incubated student-led startup ventures';

-- =========================================================================
-- TABLE: industry_collaborations
-- Purpose: Contains partnership agreements, training alignments, and corporate links.
-- =========================================================================
CREATE TABLE industry_collaborations (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    collaboration_type VARCHAR(50) NOT NULL CHECK (collaboration_type IN ('MoU', 'Training', 'Placement', 'R&D', 'Sponsorship')),
    contact_person VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE industry_collaborations IS 'Corporate agreements and university alignments';

-- =========================================================================
-- 9. TRIGGERS & FUNCTIONS (POSTGRESQL DIALECT)
-- =========================================================================

-- A. Auto-update modified timestamp function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger applications for updated_at tracking
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tasks_modtime
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- B. Enforce maximum 5 project team members trigger
CREATE OR REPLACE FUNCTION check_project_members_limit()
RETURNS TRIGGER AS $$
DECLARE
    member_count INT;
BEGIN
    SELECT COUNT(*) INTO member_count 
    FROM project_members 
    WHERE project_id = NEW.project_id;
    
    IF member_count >= 5 THEN
        RAISE EXCEPTION 'Constraint Violated: A project team cannot exceed the limit of 5 members.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_members
    BEFORE INSERT ON project_members
    FOR EACH ROW
    EXECUTE FUNCTION check_project_members_limit();

-- =========================================================================
-- 10. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- =========================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_students_branch ON students(branch_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_branch ON projects(branch_id);
CREATE INDEX idx_projects_mentor ON projects(mentor_id);
CREATE INDEX idx_projects_creator ON projects(created_by);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_student ON project_members(student_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);

CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestone_submissions_milestone ON milestone_submissions(milestone_id);
CREATE INDEX idx_milestone_submissions_project ON milestone_submissions(project_id);
CREATE INDEX idx_milestone_submissions_student ON milestone_submissions(submitted_by);
CREATE INDEX idx_document_assignments_project ON document_assignments(project_id);
CREATE INDEX idx_document_submissions_assignment ON document_submissions(assignment_id);
CREATE INDEX idx_document_submissions_project ON document_submissions(project_id);
CREATE INDEX idx_final_submissions_project ON final_submissions(project_id);
CREATE INDEX idx_mentor_feedback_project ON mentor_feedback(project_id);
CREATE INDEX idx_evaluations_project ON evaluations(project_id);
CREATE INDEX idx_evaluations_student ON evaluations(student_id);
CREATE INDEX idx_approvals_target ON approvals(target_type, target_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_time, end_time);
CREATE INDEX idx_startups_founder ON startups(founder_id);

-- =========================================================================
-- 11. SAMPLE DATA SEEDING
-- =========================================================================

-- A. Seed Academic Units
INSERT INTO departments (name, code) VALUES 
('Computer Science & Engineering', 'CSE_DEPT'),
('Electronics & Communication Engineering', 'ECE_DEPT'),
('Mechanical Engineering', 'ME_DEPT');

INSERT INTO branches (department_id, name, code) VALUES 
(1, 'Computer Science & Engineering', 'CSE'),
(1, 'Information Technology', 'IT'),
(2, 'Electronics & Communication Engineering', 'ECE'),
(3, 'Mechanical Engineering', 'ME');

-- B. Seed System Users (Credentials specified in requirements)
INSERT INTO users (id, email, password_hash, role, full_name, profile_image, is_active) VALUES
(1, 'admin@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'admin', 'System Administrator', NULL, TRUE),
(2, 'hod@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'hod', 'Dr. Alok Chandra', NULL, TRUE),
(3, 'mentor@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'mentor', 'Dr. Priya Sharma', NULL, TRUE),
(4, 'coordinator@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'hod', 'Dr. Neha Rao', NULL, TRUE),
(5, 'student@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Piyush Mishra', NULL, TRUE),
(6, 'student2@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Rohan Verma', NULL, TRUE),
(7, 'student3@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Anjali Gupta', NULL, TRUE);

SELECT setval('users_id_seq', 7, TRUE);

-- C. Seed Faculty Profile Details
INSERT INTO mentors (user_id, department_id, designation, specialization, max_projects) VALUES
(2, 1, 'Professor & HOD', 'Artificial Intelligence', 5),
(3, 1, 'Associate Professor', 'Software Engineering & Cloud', 8);

-- D. Seed Students Profile Details (Includes custom scoring metrics)
INSERT INTO students (user_id, roll_number, branch_id, semester, academic_year, current_score, contribution_score, timeliness_score) VALUES
(5, 'CS2026001', 1, 6, '2025-26', 88.50, 90.00, 87.00),
(6, 'CS2026002', 1, 6, '2025-26', 82.10, 80.00, 84.20),
(7, 'CS2026003', 1, 6, '2025-26', 91.00, 92.50, 89.50);

-- E. Seed Kanban Board SDLC Stages
INSERT INTO sdlc_stages (name, sequence_order, color_code) VALUES
('Requirements Analysis', 1, 'bg-slate-100 text-slate-700'),
('System Design', 2, 'bg-blue-50 text-blue-700'),
('Implementation & Coding', 3, 'bg-amber-50 text-amber-700'),
('Testing & QA', 4, 'bg-rose-50 text-rose-700'),
('Deployment & DevOps', 5, 'bg-purple-50 text-purple-700'),
('Final Documentation', 6, 'bg-emerald-50 text-emerald-700');

-- F. Seed Active Projects (ByteCraft & AgriTech)
INSERT INTO projects (title, type, team_name, description, start_date, end_date, status, progress_percent, branch_id, created_by, mentor_id) VALUES
('ProjectFlow Edu Platform', 'Major Project', 'ByteCraft', 'SaaS academic project lifecycle management portal featuring Kanban workflows, document management, and HOD review.', '2026-01-10', '2026-05-30', 'In Progress', 65, 1, 5, 3),
('AI-Powered Crop Disease Detection', 'Final Year Project', 'AgriTech AI', 'Deep learning model deployed on edge devices to help farmers detect leaf-based pathogens in real-time.', '2025-08-01', '2026-05-15', 'Review', 90, 1, 6, 2);

-- G. Seed Team Memberships
INSERT INTO project_members (project_id, student_id, is_leader) VALUES
(1, 5, TRUE), -- Piyush is the project leader of ProjectFlow Edu
(1, 6, FALSE),
(1, 7, FALSE),
(2, 6, TRUE);  -- Rohan is the leader of crop disease detection

-- H. Seed Milestones
INSERT INTO milestones (project_id, title, description, due_date, status, completed_at) VALUES
(1, 'SRS Submission', 'Compile and submit complete Software Requirements Specification.', '2026-02-15', 'Completed', '2026-02-14'),
(1, 'Mid-Term Review', 'Present architecture design and core module functioning.', '2026-03-20', 'Completed', '2026-03-20'),
(1, 'Final Prototype Demo', 'Deploy to staging and present full working application.', '2026-05-18', 'Pending', NULL);

-- I. Seed Tasks (SDLC Kanban Board Columns mapping)
INSERT INTO tasks (project_id, title, description, status, priority, members, comments, attachments, created_by, due_date) VALUES
(1, 'Create PostgreSQL Schema', 'Design 25 relational tables and triggers for academic data, templates, and evaluations.', 'Architecture', 'High', '["Piyush Mishra"]'::json, 0, 0, 5, '2026-05-20'),
(1, 'Setup JWT Auth & API Gateway', 'Isolate routes by portal roles (student, mentor, hod) and verify cookies.', 'Development', 'High', '["Rohan Verma"]'::json, 2, 1, 5, '2026-04-15'),
(1, 'Compile Final Thesis Report', 'Write detailed evaluation methodology, contribution score metrics, and user guides.', 'Requirements', 'Medium', '["Anjali Gupta"]'::json, 0, 0, 5, '2026-05-25');

-- J. Seed Document Templates
INSERT INTO document_templates (title, description, file_path, document_type, created_by) VALUES
('Standard SRS Template (IEEE Format)', 'Official template for writing and structuring Software Requirements Specification.', '/templates/srs_ieee_template.docx', 'SRS', 2),
('Academic Final Thesis Template', 'Standard LaTeX and Word templates for compiling academic thesis reports.', '/templates/final_thesis_template.zip', 'Final Thesis', 2);

-- K. Seed Deliverable Assignments
INSERT INTO document_assignments (project_id, template_id, title, description, due_date, status) VALUES
(1, 1, 'SRS Document Submission', 'Please submit your comprehensive SRS in PDF format using the IEEE template.', '2026-02-15 23:59:59', 'Reviewed');

-- L. Seed Student Submissions
INSERT INTO document_submissions (assignment_id, project_id, submitted_by, file_name, file_path, status, score) VALUES
(1, 1, 5, 'ByteCraft_SRS_ProjectFlow.pdf', '/uploads/projects/1/docs/ByteCraft_SRS_ProjectFlow.pdf', 'Approved', 95);

-- M. Seed Versions Log
INSERT INTO document_versions (submission_id, version_number, file_path, uploaded_by, changelog) VALUES
(1, '1.0', '/uploads/projects/1/docs/ByteCraft_SRS_ProjectFlow_v1.pdf', 5, 'Initial draft containing system architecture diagrams and schemas.'),
(1, '1.1', '/uploads/projects/1/docs/ByteCraft_SRS_ProjectFlow.pdf', 5, 'Fixed architectural labels and added HOD feedback changes.');

-- N. Seed final year GitHub submission details
INSERT INTO final_submissions (project_id, submitted_by, report_file_path, code_repository_url, presentation_file_path, plagiarism_percent, status) VALUES
(2, 6, '/uploads/projects/2/final/AgriTech_Final_Thesis.pdf', 'https://github.com/agritech-ai/disease-detection-core', '/uploads/projects/2/final/AgriTech_Presentation.pptx', 8.50, 'Submitted');

-- O. Seed Mentor Feedback
INSERT INTO mentor_feedback (project_id, mentor_id, comment, sentiment) VALUES
(1, 3, 'The team is progressing well on the Kanban boards and development. Schema designs look robust.', 'Positive'),
(2, 2, 'Ensure dataset imbalance is addressed in the crop disease machine learning models prior to final submission.', 'Critical');

-- P. Seed Evaluations
INSERT INTO evaluations (project_id, student_id, evaluator_id, task_completion_score, timeliness_score, documentation_score, technical_skill_score, total_score, comments) VALUES
(2, 6, 2, 92, 85, 90, 95, 91, 'Excellent technical implementation and execution. The model is highly accurate.');

-- Q. Seed Workflows Approvals
INSERT INTO approvals (target_type, target_id, approver_id, status, remarks, action_at) VALUES
('Project Proposal', 1, 2, 'Approved', 'The ProjectFlow Edu SaaS portal is a highly useful utility. Approved.', '2026-01-15 11:30:00');

-- R. Seed User Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(5, 'SRS Approved', 'Your submitted Software Requirements Specification has been approved by Dr. Priya Sharma with a score of 95/100.', 'Success', FALSE),
(5, 'New Task Assigned', 'You have been assigned task "Create PostgreSQL Schema" by Dr. Priya Sharma.', 'Info', TRUE);

-- S. Seed Conversations
INSERT INTO chat_messages (project_id, sender_id, receiver_id, message, is_read) VALUES
(1, 5, NULL, 'Hey team, let us organize the schema tables and write SQL constraints tonight.', FALSE),
(1, 6, NULL, 'Sounds great! I will add foreign keys and cascade operations.', FALSE),
(NULL, 3, 5, 'Piyush, please make sure you add check constraints for all ENUM fields in the database schema.', FALSE);

-- T. Seed Activity Audits
INSERT INTO activity_logs (user_id, action_type, description, table_name, record_id, ip_address) VALUES
(5, 'SUBMIT_DOCUMENT', 'Submitted document ByteCraft_SRS_ProjectFlow.pdf for assignment 1', 'document_submissions', 1, '127.0.0.1');

-- U. Seed Scheduler Events
INSERT INTO calendar_events (title, description, start_time, end_time, event_type, project_id, created_by) VALUES
('Mid-Term Presentation Evaluation', 'Evaluate major project milestones and core functional prototypes.', '2026-03-20 09:00:00', '2026-03-20 17:00:00', 'Evaluation', 1, 2),
('Hackathon Submission Deadline', 'Last day to submit prototype repositories for ProjectFlow Edu Hackathon.', '2026-06-05 00:00:00', '2026-06-05 23:59:59', 'Deadline', NULL, 4);

-- V. Seed Innovation Hackathons
INSERT INTO hackathons (title, description, event_date, venue, status) VALUES
('ProjectFlow Annual Innovation Hackathon', 'A 36-hour coding event to build innovative campus-focused software products.', '2026-06-04', 'Main Seminar Hall', 'Upcoming');

-- W. Seed Startups Incubations
INSERT INTO startups (project_id, name, founder_id, incubation_stage, funding_status, website, innovation_score) VALUES
(2, 'AgriTech AI Solutions', 6, 'Ideation', 'Grant', 'https://agritechai.college.edu', 88.00);

-- X. Seed Industry Partnership details
INSERT INTO industry_collaborations (company_name, collaboration_type, contact_person, expiry_date, status) VALUES
('TechCorp Industries', 'MoU', 'Dr. John Doe', '2027-12-31', 'Active'),
('Global Softworks Ltd', 'Placement', 'HR Manager', '2026-10-15', 'Active');
