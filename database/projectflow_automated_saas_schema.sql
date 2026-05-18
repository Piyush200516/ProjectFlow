-- =========================================================================
-- ProjectFlow Edu: Fully Automated SaaS Relational Database Schema
-- Target System: PostgreSQL (12.0+)
-- Database Name: projectflow_edu
-- =========================================================================

-- Clean up existing triggers, functions, and tables in reverse dependency order
DROP TRIGGER IF EXISTS enforce_project_members_limit ON project_members;
DROP FUNCTION IF EXISTS check_project_members_limit();

-- Drop tables with CASCADE to ensure a completely clean database structure
DROP TABLE IF EXISTS project_status_history CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS deadlines CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS mentor_reviews CASCADE;
DROP TABLE IF EXISTS submission_versions CASCADE;
DROP TABLE IF EXISTS milestone_submissions CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS mentor_assignments CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS project_registrations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS hod_admins CASCADE;
DROP TABLE IF EXISTS mentors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- =========================================================================
-- 1. ACADEMIC STRUCTURE SUPPORT
-- =========================================================================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. USER AUTHENTICATION & PROFILES
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

CREATE TABLE students (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    academic_year VARCHAR(10) NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    current_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (current_score BETWEEN 0.00 AND 100.00),
    contribution_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (contribution_score BETWEEN 0.00 AND 100.00),
    timeliness_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (timeliness_score BETWEEN 0.00 AND 100.00)
);

CREATE TABLE mentors (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(255),
    max_projects INT DEFAULT 10 CHECK (max_projects > 0)
);

CREATE TABLE hod_admins (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL
);

-- =========================================================================
-- 3. ADMINISTRATIVE DEADLINES (HOD FORM REGISTRATION CARDS)
-- =========================================================================

CREATE TABLE deadlines (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Minor Project', 'Major Project', 'Research Project', 'Hackathon Project')),
    branch VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL,
    deadline_date TIMESTAMP NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 4. PROJECT PROPOSALS & REGISTRATIONS
-- =========================================================================

CREATE TABLE project_registrations (
    id SERIAL PRIMARY KEY,
    deadline_id INT REFERENCES deadlines(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Minor Project', 'Major Project', 'Research Project', 'Hackathon Project')),
    branch VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    abstract TEXT,
    github_link VARCHAR(255),
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_leader_deadline UNIQUE (deadline_id, created_by)
);

-- =========================================================================
-- 5. ACTIVE PROJECT WORKSPACES
-- =========================================================================

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    registration_id INT REFERENCES project_registrations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'Minor Project' CHECK (type IN ('Minor Project', 'Major Project', 'Research Project', 'Hackathon Project')),
    team_name VARCHAR(100) DEFAULT 'Team Alpha',
    description TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Review', 'Completed', 'Rejected')),
    progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    branch VARCHAR(100) DEFAULT 'Computer Science & Engineering',
    academic_year VARCHAR(20) DEFAULT '2025-26',
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================================
-- 6. TEAM MEMBERSHIP (UNIFIED FOR REGISTRATIONS & PROJECTS)
-- =========================================================================

CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member' CHECK (role IN ('Leader', 'Member')),
    is_leader BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_student UNIQUE (project_id, student_id),
    CONSTRAINT unique_registration_student UNIQUE (registration_id, student_id)
);

-- =========================================================================
-- 7. MENTOR ASSIGNMENTS & MILESTONES
-- =========================================================================

CREATE TABLE mentor_assignments (
    id SERIAL PRIMARY KEY,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
    submission_id INT, -- backward compatibility
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
    section VARCHAR(10),
    academic_year VARCHAR(20),
    branch VARCHAR(100),
    domain VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    deadline TIMESTAMP NOT NULL,
    max_marks INT DEFAULT 10,
    required_file_types VARCHAR(100) DEFAULT 'PDF, PPT, ZIP',
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 8. SUBMISSIONS, FILE UPLOADS & AUDIT LOGGING
-- =========================================================================

CREATE TABLE milestone_submissions (
    id SERIAL PRIMARY KEY,
    milestone_id INT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timely_marks DECIMAL(5, 2) DEFAULT 0.00 CHECK (timely_marks BETWEEN 0.00 AND 10.00),
    quality_marks DECIMAL(5, 2) DEFAULT 0.00 CHECK (quality_marks BETWEEN 0.00 AND 10.00),
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Needs Work', 'Rejected'))
);

CREATE TABLE submission_versions (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES milestone_submissions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changelog TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mentor_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES milestone_submissions(id) ON DELETE CASCADE,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Approved', 'Needs Work', 'Rejected')),
    remarks TEXT,
    comments TEXT, -- backward compatibility
    quality_marks DECIMAL(5, 2) DEFAULT 0.00,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id INT, -- backward compatibility
    timeliness_marks DECIMAL(5, 2) DEFAULT 0.00 CHECK (timeliness_marks BETWEEN 0.00 AND 20.00),
    quality_marks DECIMAL(5, 2) DEFAULT 0.00 CHECK (quality_marks BETWEEN 0.00 AND 80.00),
    total_marks DECIMAL(5, 2) DEFAULT 0.00 CHECK (total_marks BETWEEN 0.00 AND 100.00),
    completeness DECIMAL(5, 2) DEFAULT 0.00 CHECK (completeness BETWEEN 0.00 AND 100.00),
    completion_percent DECIMAL(5, 2) DEFAULT 0.00 CHECK (completion_percent BETWEEN 0.00 AND 100.00),
    
    -- Legacy scoring fields
    timeliness_score DECIMAL(5, 2) DEFAULT 10.00,
    doc_completion_score DECIMAL(5, 2) DEFAULT 10.00,
    contribution_score DECIMAL(5, 2) DEFAULT 10.00,
    github_score DECIMAL(5, 2) DEFAULT 10.00,
    mentor_review_score DECIMAL(5, 2) DEFAULT 10.00,
    total_score DECIMAL(5, 2) DEFAULT 10.00,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_project_marks_saas UNIQUE (student_id, project_id)
);


CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    uploader_id INT REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_status_history (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 9. NOTIFICATIONS & ALERTS
-- =========================================================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- PERFORMANCE INDICES
-- =========================================================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_project_members_proj ON project_members(project_id);
CREATE INDEX idx_project_members_stud ON project_members(student_id);
CREATE INDEX idx_project_regs_status ON project_registrations(status);
CREATE INDEX idx_milestones_proj ON milestones(project_id);
CREATE INDEX idx_milestone_subs_milestone ON milestone_submissions(milestone_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =========================================================================
-- 10. TRANSACTION SAFE SEED DATA (PASSWORD IS: password123)
-- =========================================================================

-- A. Departments & Branches
INSERT INTO departments (id, name, code) VALUES 
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Electronics & Communication Engineering', 'ECE');

INSERT INTO branches (id, department_id, name, code) VALUES
(1, 1, 'Computer Science & Engineering', 'CSE-BTECH'),
(2, 2, 'Electronics & Communication Engineering', 'ECE-BTECH');

-- B. User Accounts (Bcrypt Hash for 'password123')
-- IDs: 1 (Admin), 2 (HOD), 3 (Mentor), 4 (Student 1), 5 (Student 2), 6 (Student 3), 7 (Student 4)
INSERT INTO users (id, email, password_hash, role, full_name, profile_image) VALUES
(1, 'admin@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'admin', 'System Administrator', NULL),
(2, 'hod@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'hod', 'Dr. Piyush Mishra', NULL),
(3, 'mentor@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'mentor', 'Prof. Satish Verma', NULL),
(4, 'student1@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Rohan Sharma', NULL),
(5, 'student2@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Rahul Verma', NULL),
(6, 'student3@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Anjali Gupta', NULL),
(7, 'student4@college.edu', '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6', 'student', 'Preeti Sen', NULL);

-- Adjust SERIAL sequence after forcing IDs
SELECT setval('users_id_seq', 10);

-- C. Faculty & Student Profile Details
INSERT INTO hod_admins (user_id, department_id, designation) VALUES
(2, 1, 'Head of Department - CSE');

INSERT INTO mentors (user_id, department_id, designation, specialization, max_projects) VALUES
(3, 1, 'Assistant Professor', 'Machine Learning & Web Architecture', 5);

INSERT INTO students (user_id, roll_number, branch_id, semester, academic_year, section) VALUES
(4, 'CS2023001', 1, 6, '2025-26', 'A'),
(5, 'CS2023002', 1, 6, '2025-26', 'A'),
(6, 'CS2023003', 1, 6, '2025-26', 'A'),
(7, 'CS2023004', 1, 6, '2025-26', 'A');

-- D. Initial Administrative Registration Deadline Cards
INSERT INTO deadlines (id, title, description, project_type, branch, academic_year, semester, section, deadline_date, created_by) VALUES
(1, 'CSE VI Sem Mini Project Registration', 'Please register your team of 4 for the CSE VI Semester Mini Project.', 'Minor Project', 'Computer Science & Engineering', '2025-26', 6, 'A', NOW() + INTERVAL '7 days', 2);

SELECT setval('deadlines_id_seq', 5);

-- =========================================================================
-- BACKWARD COMPATIBILITY VIEWS & TRIGGERS
-- =========================================================================

-- 1. VIEW: project_forms (maps to deadlines)
CREATE OR REPLACE VIEW project_forms AS
SELECT 
    id, 
    title, 
    description, 
    project_type, 
    branch, 
    academic_year, 
    semester, 
    section, 
    deadline_date AS deadline, 
    created_by, 
    created_at, 
    created_at AS updated_at
FROM deadlines;

CREATE OR REPLACE FUNCTION insert_project_forms() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deadlines 
    (title, description, project_type, branch, academic_year, semester, section, deadline_date, created_by)
    VALUES 
    (NEW.title, NEW.description, NEW.project_type, NEW.branch, NEW.academic_year, NEW.semester, NEW.section, NEW.deadline, NEW.created_by)
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_project_forms
INSTEAD OF INSERT ON project_forms
FOR EACH ROW EXECUTE FUNCTION insert_project_forms();


-- 2. VIEW: project_form_submissions (maps to project_registrations)
CREATE OR REPLACE VIEW project_form_submissions AS
SELECT
    id,
    deadline_id AS form_id,
    created_by AS student_id,
    title,
    description,
    domain,
    github_link,
    status,
    created_at,
    updated_at
FROM project_registrations;

CREATE OR REPLACE FUNCTION insert_project_form_submissions() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_registrations 
    (deadline_id, created_by, title, description, domain, github_link, status, project_type, branch, academic_year, semester, section)
    VALUES 
    (
        NEW.form_id, 
        NEW.student_id, 
        NEW.title, 
        NEW.description, 
        NEW.domain, 
        NEW.github_link, 
        COALESCE(NEW.status, 'Pending'),
        COALESCE((SELECT project_type FROM deadlines WHERE id = NEW.form_id), 'Minor Project'),
        COALESCE((SELECT branch FROM deadlines WHERE id = NEW.form_id), 'Computer Science & Engineering'),
        COALESCE((SELECT academic_year FROM deadlines WHERE id = NEW.form_id), '2025-26'),
        COALESCE((SELECT semester FROM deadlines WHERE id = NEW.form_id), 6),
        COALESCE((SELECT section FROM deadlines WHERE id = NEW.form_id), 'A')
    )
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_project_form_submissions
INSTEAD OF INSERT ON project_form_submissions
FOR EACH ROW EXECUTE FUNCTION insert_project_form_submissions();

CREATE OR REPLACE FUNCTION update_project_form_submissions() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE project_registrations
    SET 
        deadline_id = NEW.form_id,
        created_by = NEW.student_id,
        title = NEW.title,
        description = NEW.description,
        domain = NEW.domain,
        github_link = NEW.github_link,
        status = NEW.status,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_form_submissions
INSTEAD OF UPDATE ON project_form_submissions
FOR EACH ROW EXECUTE FUNCTION update_project_form_submissions();


-- 3. VIEW: team_members (maps to project_members)
CREATE OR REPLACE VIEW team_members AS
SELECT
    id,
    registration_id AS submission_id,
    project_id,
    student_id,
    CASE WHEN is_leader THEN 'Leader' ELSE 'Member' END AS role,
    is_leader,
    joined_at
FROM project_members;

CREATE OR REPLACE FUNCTION insert_team_members() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_members 
    (registration_id, project_id, student_id, role, is_leader)
    VALUES 
    (NEW.submission_id, NEW.project_id, NEW.student_id, NEW.role, NEW.is_leader)
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_team_members
INSTEAD OF INSERT ON team_members
FOR EACH ROW EXECUTE FUNCTION insert_team_members();

CREATE OR REPLACE FUNCTION update_team_members() 
RETURNS TRIGGER AS $$
BEGIN
    -- If a project_id mapping already exists for this project and student,
    -- delete the old redundant (project_id = NULL) registration_id row first to satisfy unique constraint.
    IF NEW.project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM project_members 
        WHERE student_id = NEW.student_id AND project_id = NEW.project_id
    ) THEN
        DELETE FROM project_members WHERE id = OLD.id;
        
        UPDATE project_members
        SET registration_id = NEW.submission_id
        WHERE student_id = NEW.student_id AND project_id = NEW.project_id;
    ELSE
        UPDATE project_members
        SET 
            registration_id = NEW.submission_id,
            project_id = NEW.project_id,
            student_id = NEW.student_id,
            role = NEW.role,
            is_leader = NEW.is_leader
        WHERE id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER trigger_update_team_members
INSTEAD OF UPDATE ON team_members
FOR EACH ROW EXECUTE FUNCTION update_team_members();


-- 4. VIEW: document_templates (maps to milestones)
CREATE OR REPLACE VIEW document_templates AS
SELECT
    id,
    title,
    description,
    'uploads/' AS file_path,
    required_file_types AS document_type,
    1 AS created_by,
    created_at
FROM milestones;

CREATE OR REPLACE FUNCTION insert_document_templates() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO milestones 
    (title, description, deadline, required_file_types)
    VALUES 
    (NEW.title, NEW.description, NOW() + INTERVAL '14 days', NEW.document_type)
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_document_templates
INSTEAD OF INSERT ON document_templates
FOR EACH ROW EXECUTE FUNCTION insert_document_templates();


-- 5. VIEW: submission_deadlines (maps to milestones)
CREATE OR REPLACE VIEW submission_deadlines AS
SELECT
    id,
    id AS template_id,
    'Minor Project' AS project_type,
    deadline AS deadline_date,
    1 AS created_by,
    created_at
FROM milestones;

CREATE OR REPLACE FUNCTION insert_submission_deadlines() 
RETURNS TRIGGER AS $$
BEGIN
    -- Update deadline on existing milestone/template
    UPDATE milestones
    SET deadline = NEW.deadline_date
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_submission_deadlines
INSTEAD OF INSERT ON submission_deadlines
FOR EACH ROW EXECUTE FUNCTION insert_submission_deadlines();


-- 6. VIEW: document_submissions (maps to milestone_submissions)
CREATE OR REPLACE VIEW document_submissions AS
SELECT
    id,
    project_id,
    0 AS submission_id,
    submitted_by AS student_id,
    milestone_id AS template_id,
    'Synopsis' AS document_type,
    'deliverable' AS file_name,
    'uploads/' AS file_path,
    status,
    submission_timestamp AS submitted_at,
    FALSE AS is_late,
    0 AS late_days,
    (timely_marks + quality_marks) AS marks_awarded
FROM milestone_submissions;

CREATE OR REPLACE FUNCTION insert_document_submissions() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO milestone_submissions 
    (milestone_id, project_id, submitted_by, timely_marks, quality_marks, remarks, status)
    VALUES 
    (NEW.template_id, NEW.project_id, NEW.student_id, NEW.marks_awarded, 0.00, 'Submitted deliverable', NEW.status)
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_document_submissions
INSTEAD OF INSERT ON document_submissions
FOR EACH ROW EXECUTE FUNCTION insert_document_submissions();

