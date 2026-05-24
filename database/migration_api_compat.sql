-- ProjectFlow Edu: Working Migration (adds/fixes tables for API compatibility)
-- Run this AFTER the main schema to patch it for the REST API.

USE projectflow_edu;

-- ─── Disable FK checks so drops work regardless of references ─────────────────
SET FOREIGN_KEY_CHECKS = 0;

-- ─── DROP strict schema tables and replace with API-compatible ones ────────────
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS mentor_feedback;
DROP TABLE IF EXISTS startups;
DROP TABLE IF EXISTS industry_collaborations;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS milestones;
DROP TABLE IF EXISTS project_mentors;
DROP TABLE IF EXISTS project_team_members;
DROP TABLE IF EXISTS projects;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Projects (simplified, no strict FKs that break on minimal data) ──────────
CREATE TABLE projects (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    type          VARCHAR(100) DEFAULT 'Mini Project',
    description   TEXT,
    progress      INT DEFAULT 0,
    status        VARCHAR(50) DEFAULT 'In Progress',
    created_by    INT NOT NULL,
    mentor_id     INT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Project Team Members ──────────────────────────────────────────────────────
CREATE TABLE project_team_members (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    user_id     INT NOT NULL,
    role        VARCHAR(50) DEFAULT 'member',
    joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (project_id, user_id)
);

-- ─── Tasks (Kanban-compatible) ─────────────────────────────────────────────────
CREATE TABLE tasks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(100) DEFAULT 'Requirements',
    priority    ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    members     JSON,
    comments    INT DEFAULT 0,
    attachments INT DEFAULT 0,
    created_by  INT NULL,
    due_date    DATE NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Documents (file upload compatible) ───────────────────────────────────────
CREATE TABLE documents (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    project_id    INT NOT NULL,
    uploaded_by   INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_type     VARCHAR(50),
    file_size     VARCHAR(30),
    url           VARCHAR(1000),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ─── Mentor Feedback ──────────────────────────────────────────────────────────
CREATE TABLE mentor_feedback (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    mentor_id   INT NOT NULL,
    subject     VARCHAR(255),
    comment     TEXT NOT NULL,
    status      VARCHAR(50) DEFAULT 'Reviewed',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id)  REFERENCES users(id)
);

-- ─── Evaluations ──────────────────────────────────────────────────────────────
CREATE TABLE evaluations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    project_id          INT NOT NULL,
    student_id          INT NOT NULL,
    innovation_score    INT DEFAULT 0,
    technical_score     INT DEFAULT 0,
    documentation_score INT DEFAULT 0,
    presentation_score  INT DEFAULT 0,
    total_credits       INT DEFAULT 0,
    tier                VARCHAR(50) DEFAULT 'Premier A+',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Innovation Tracking ──────────────────────────────────────────────────────
CREATE TABLE startups (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    project_id    INT NULL,
    founder_id    INT NOT NULL,
    name          VARCHAR(255) NOT NULL,
    stage         VARCHAR(50) DEFAULT 'Ideation',
    funding       VARCHAR(100) DEFAULT 'Pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (founder_id) REFERENCES users(id)
);

CREATE TABLE industry_collaborations (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    partner_name      VARCHAR(255) NOT NULL,
    type              VARCHAR(100),
    status            VARCHAR(50) DEFAULT 'Active',
    expiry_date       DATE NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
