-- ProjectFlow Edu: Database Schema (MySQL 8.0+)
-- Author: Antigravity AI
-- Description: Comprehensive schema for academic project management, innovation tracking, and administration.

CREATE DATABASE IF NOT EXISTS projectflow_edu;
USE projectflow_edu;

-- ---------------------------------------------------------
-- 1. ACADEMIC STRUCTURE
-- ---------------------------------------------------------

-- Departments Table: Stores main academic blocks (e.g., Engineering, Science)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches Table: Stores specific branches within departments (e.g., CSE, IT, ECE)
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 2. USER MANAGEMENT
-- ---------------------------------------------------------

-- Users Table: Core authentication and role management
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'mentor', 'hod', 'cdc', 'admin') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (email),
    INDEX (role)
);

-- Students Table: Profile data specific to students
CREATE TABLE students (
    user_id INT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    branch_id INT NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    current_score DECIMAL(5, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Mentors Table: Profile data specific to faculty/mentors
CREATE TABLE mentors (
    user_id INT PRIMARY KEY,
    department_id INT NOT NULL,
    designation VARCHAR(100),
    specialization VARCHAR(255),
    max_projects INT DEFAULT 10,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ---------------------------------------------------------
-- 3. PROJECT MANAGEMENT
-- ---------------------------------------------------------

-- Projects Table: Main project details
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_type ENUM('Mini Project', 'Major Project', 'Hackathon Project', 'Final Year Project') NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('Proposal', 'In Progress', 'Review', 'Completed', 'On Hold', 'Rejected') DEFAULT 'Proposal',
    progress_percent INT DEFAULT 0,
    branch_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX (status),
    INDEX (project_type)
);

-- Project Team Members: Maps students to projects
CREATE TABLE project_team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    student_id INT NOT NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (project_id, student_id)
);

-- Project Mentors: Maps mentors to projects (can be multiple)
CREATE TABLE project_mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    mentor_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (project_id, mentor_id)
);

-- ---------------------------------------------------------
-- 4. KANBAN & WORKFLOW
-- ---------------------------------------------------------

-- SDLC Stages: Master table for Kanban columns
CREATE TABLE sdlc_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sequence_order INT NOT NULL,
    color_code VARCHAR(20) DEFAULT 'bg-slate-100'
);

-- Tasks Table: Individual work items on the Kanban board
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    stage_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id INT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('To Do', 'In Progress', 'Review', 'Completed') DEFAULT 'To Do',
    due_date DATE NULL,
    completion_percent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES sdlc_stages(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- Milestones Table: High-level goals and timeline tracking
CREATE TABLE milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status ENUM('Pending', 'Completed', 'Missed') DEFAULT 'Pending',
    completed_at DATE NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 5. DOCUMENTATION & FEEDBACK
-- ---------------------------------------------------------

-- Documents Table: Tracks uploaded files (SRS, Design, Reports)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_path VARCHAR(500) NOT NULL,
    document_type ENUM('SRS', 'Design', 'Code', 'Progress Report', 'Final Thesis', 'Other') NOT NULL,
    version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Mentor Feedback: Comments from mentors on projects/tasks
CREATE TABLE mentor_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    mentor_id INT NOT NULL,
    comment TEXT NOT NULL,
    sentiment ENUM('Positive', 'Neutral', 'Critical') DEFAULT 'Neutral',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id)
);

-- Evaluations Table: Stores student marks and scoring breakdowns
CREATE TABLE evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    student_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    task_completion_score INT DEFAULT 0,
    timeliness_score INT DEFAULT 0,
    documentation_score INT DEFAULT 0,
    technical_skill_score INT DEFAULT 0,
    total_score INT DEFAULT 0,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

-- ---------------------------------------------------------
-- 6. CDC & INNOVATION
-- ---------------------------------------------------------

-- Hackathons Table: Events managed by CDC
CREATE TABLE hackathons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    venue VARCHAR(255),
    status ENUM('Upcoming', 'Live', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Startups Table: Incubated projects/startups under CDC
CREATE TABLE startups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NULL,
    name VARCHAR(255) NOT NULL,
    founder_id INT NOT NULL,
    incubation_stage ENUM('Ideation', 'MVP', 'Seed', 'Scaling') DEFAULT 'Ideation',
    funding_status ENUM('Self', 'Grant', 'VC', 'Pending') DEFAULT 'Pending',
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (founder_id) REFERENCES users(id)
);

-- Industry Collaborations: Corporate partners and MoUs
CREATE TABLE industry_collaborations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    collaboration_type ENUM('MoU', 'Training', 'Placement', 'R&D') NOT NULL,
    contact_person VARCHAR(100),
    expiry_date DATE NULL,
    status ENUM('Active', 'Expired') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 7. SYSTEM & ACTIVITY
-- ---------------------------------------------------------

-- Notifications: User alerts and system messages
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Success', 'Info', 'Warning', 'Error') DEFAULT 'Info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Approvals Table: Generic approval workflow for HOD/CDC
CREATE TABLE approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_type ENUM('Project', 'Budget', 'Document', 'Startup') NOT NULL,
    target_id INT NOT NULL,
    approver_id INT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Hold') DEFAULT 'Pending',
    remarks TEXT,
    action_at TIMESTAMP NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Settings Table: Portal-wide and user-specific settings
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL, -- NULL if system-wide
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (user_id, setting_key)
);

-- Audit Logs Table: Tracks every sensitive action in the system
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- 8. SAMPLE DATA SEEDING
-- ---------------------------------------------------------

-- Seed Academic Data
INSERT INTO departments (name, code) VALUES ('Engineering & Technology', 'SET');
INSERT INTO branches (department_id, name, code) VALUES 
(1, 'Computer Science', 'CSE'),
(1, 'Information Technology', 'IT'),
(1, 'Electronics & Communication', 'ECE'),
(1, 'Electrical Engineering', 'EE'),
(1, 'Mechanical Engineering', 'ME');

-- Seed SDLC Stages
INSERT INTO sdlc_stages (name, sequence_order, color_code) VALUES 
('Requirement Analysis', 1, 'bg-slate-100'),
('Planning', 2, 'bg-blue-50'),
('UI/UX Design', 3, 'bg-indigo-50'),
('Development', 4, 'bg-amber-50'),
('Testing', 5, 'bg-rose-50'),
('Documentation', 6, 'bg-emerald-50'),
('Review', 7, 'bg-violet-50'),
('Completed', 8, 'bg-green-100');

-- Seed Admin User
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('admin@projectflow.edu', '$2b$10$ON/35qvuSXlWMZcQZO.Nr.K.9DHwWrBHwR8eJ3b9gDoeGzXtOgq6y', 'admin', 'System Administrator');

-- Seed Mentor (Faculty)
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('mentor@college.edu', '$2b$10$ON/35qvuSXlWMZcQZO.Nr.K.9DHwWrBHwR8eJ3b9gDoeGzXtOgq6y', 'mentor', 'Dr. Rajesh Kumar');
INSERT INTO mentors (user_id, department_id, designation, specialization) 
VALUES (LAST_INSERT_ID(), 1, 'Associate Professor', 'Cloud Computing');

-- Seed Student
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('student@college.edu', '$2b$10$ON/35qvuSXlWMZcQZO.Nr.K.9DHwWrBHwR8eJ3b9gDoeGzXtOgq6y', 'student', 'Piyush Mishra');
INSERT INTO students (user_id, roll_number, branch_id, semester, academic_year) 
VALUES (LAST_INSERT_ID(), 'CS2021001', 1, 6, '2023-24');

-- Seed HOD
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('hod@college.edu', '$2b$10$ON/35qvuSXlWMZcQZO.Nr.K.9DHwWrBHwR8eJ3b9gDoeGzXtOgq6y', 'hod', 'Dr. S. K. Singh');
INSERT INTO mentors (user_id, department_id, designation) 
VALUES (LAST_INSERT_ID(), 1, 'Head of Department');

-- Seed CDC User
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('cdc@college.edu', '$2b$10$ON/35qvuSXlWMZcQZO.Nr.K.9DHwWrBHwR8eJ3b9gDoeGzXtOgq6y', 'cdc', 'Amit Sharma');
