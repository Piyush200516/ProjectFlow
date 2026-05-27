-- Compatibility objects required by dashboard API routes after the Neon schema reset.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS registration_id INT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS semester INT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS section VARCHAR(10);

UPDATE projects p
SET branch = COALESCE(p.branch, b.name),
    academic_year = COALESCE(p.academic_year, '2025-26'),
    semester = COALESCE(p.semester, 6),
    section = COALESCE(p.section, '1')
FROM branches b
WHERE p.branch_id = b.id;

CREATE TABLE IF NOT EXISTS project_registrations (
  id SERIAL PRIMARY KEY,
  registration_form_id INT REFERENCES registration_forms(id) ON DELETE SET NULL,
  submission_id INT REFERENCES registration_form_submissions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  project_domain VARCHAR(150),
  problem_statement TEXT,
  abstract TEXT,
  tech_stack TEXT,
  team_name VARCHAR(150),
  github_link TEXT,
  status VARCHAR(50) DEFAULT 'Approved',
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
  branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
  academic_year VARCHAR(20),
  semester INT,
  section VARCHAR(10),
  subsection VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentor_assignments (
  id SERIAL PRIMARY KEY,
  mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
  mentor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
  submission_id INT REFERENCES registration_form_submissions(id) ON DELETE CASCADE,
  assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
  section VARCHAR(10),
  academic_year VARCHAR(20),
  branch VARCHAR(100),
  domain VARCHAR(150),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE project_members ADD COLUMN IF NOT EXISTS registration_id INT;
ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS project_registration_id INT;

ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS registration_form_id INT;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS project_registration_id INT;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS document_type VARCHAR(100);
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS sequence_no INT;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

INSERT INTO mentor_assignments (mentor_id, mentor_user_id, project_id, assigned_by, section, academic_year, branch, domain)
SELECT p.mentor_id, p.mentor_id, p.id, p.created_by, p.section, p.academic_year, p.branch, p.type
FROM projects p
WHERE p.mentor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM mentor_assignments ma
    WHERE ma.project_id = p.id
      AND COALESCE(ma.mentor_user_id, ma.mentor_id) = p.mentor_id
  );
