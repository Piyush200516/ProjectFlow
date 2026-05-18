-- =========================================================================
-- ProjectFlow Edu: Workflow Digitization Database Migration
-- Target System: PostgreSQL (12.0+)
-- Database Name: projectflow_edu
-- =========================================================================

-- Clean up existing CDC tables as CDC is completely removed
DROP TABLE IF EXISTS startups CASCADE;
DROP TABLE IF EXISTS hackathons CASCADE;
DROP TABLE IF EXISTS industry_collaborations CASCADE;

-- Clean up existing workflow digitization tables to ensure script is re-runnable
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS mentor_reviews CASCADE;
DROP TABLE IF EXISTS mentor_assignments CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS document_submissions CASCADE;
DROP TABLE IF EXISTS submission_deadlines CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS project_form_submissions CASCADE;
DROP TABLE IF EXISTS project_forms CASCADE;

-- 1. TABLE: project_forms
-- HOD creates/sends project registration forms
CREATE TABLE project_forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Mini Project', 'Major Project', 'Hackathon Project', 'Final Year Project')),
    branch VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL,
    deadline TIMESTAMP NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE project_forms IS 'Project registration forms created by HOD';

-- 2. TABLE: project_form_submissions
-- Student fills project form
CREATE TABLE project_form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INT NOT NULL REFERENCES project_forms(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(100) NOT NULL,
    github_link VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_form UNIQUE (form_id, student_id)
);

COMMENT ON TABLE project_form_submissions IS 'Project form submissions filled by students';

-- 3. TABLE: team_members
-- Tracks the 4 students in a team
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES project_form_submissions(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    is_leader BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sub_member UNIQUE (submission_id, student_id),
    CONSTRAINT unique_proj_member_new UNIQUE (project_id, student_id)
);

COMMENT ON TABLE team_members IS 'Team member records for project submissions (exactly 4)';

-- 4. TABLE: mentor_assignments
-- Tracks HOD assignments of mentors to teams
CREATE TABLE mentor_assignments (
    id SERIAL PRIMARY KEY,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    submission_id INT REFERENCES project_form_submissions(id) ON DELETE CASCADE,
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
    section VARCHAR(10),
    academic_year VARCHAR(20),
    branch VARCHAR(50),
    domain VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mentor_assignments IS 'Mentor assignments made by HOD';

-- 5. TABLE: document_templates
-- Templates/document formats uploaded by HOD or Mentor
CREATE TABLE document_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Poster', 'PPT', 'Project Report', 'Research Paper', 'Synopsis', 'SRS', 'Final Report', 'Other')),
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE document_templates IS 'Required document templates uploaded by Mentors/HODs';

-- 6. TABLE: submission_deadlines
-- Deadlines for document templates
CREATE TABLE submission_deadlines (
    id SERIAL PRIMARY KEY,
    template_id INT NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Mini Project', 'Major Project', 'Hackathon Project', 'Final Year Project')),
    deadline_date TIMESTAMP NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_template_type UNIQUE (template_id, project_type)
);

COMMENT ON TABLE submission_deadlines IS 'Document-wise deadlines set by mentors/HODs';

-- 7. TABLE: document_submissions
-- Submissions made by students
CREATE TABLE document_submissions (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    submission_id INT REFERENCES project_form_submissions(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INT REFERENCES document_templates(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Poster', 'PPT', 'Project Report', 'Research Paper', 'Synopsis', 'SRS', 'Final Report')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Needs Work', 'Rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    late_days INT DEFAULT 0,
    marks_awarded INT DEFAULT 0
);

COMMENT ON TABLE document_submissions IS 'Required deliverables submitted by students';

-- 8. TABLE: mentor_reviews
-- Reviews given by mentors
CREATE TABLE mentor_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES document_submissions(id) ON DELETE CASCADE,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Approved', 'Needs Work')),
    comments TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mentor_reviews IS 'Deliverable review and comments by Mentor';

-- 9. TABLE: marks
-- Auto-scoring and final evaluation tracking
CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    submission_id INT REFERENCES project_form_submissions(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeliness_score DECIMAL(5, 2) DEFAULT 0.00,
    doc_completion_score DECIMAL(5, 2) DEFAULT 0.00,
    contribution_score DECIMAL(5, 2) DEFAULT 0.00,
    github_score DECIMAL(5, 2) DEFAULT 0.00,
    mentor_review_score DECIMAL(5, 2) DEFAULT 0.00,
    total_score DECIMAL(5, 2) DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_project_marks UNIQUE (student_id, project_id)
);

COMMENT ON TABLE marks IS 'Detailed auto-calculated marks breakout for students';

-- Seed initial HOD project form
INSERT INTO project_forms (title, description, project_type, branch, academic_year, semester, section, deadline, created_by) VALUES
('CSE VI Sem Mini Project Registration', 'Please fill this form to register your team of 4 for the CSE VI Semester Mini Project.', 'Mini Project', 'Computer Science & Engineering', '2025-26', 6, 'A', NOW() + INTERVAL '7 days', 2);
