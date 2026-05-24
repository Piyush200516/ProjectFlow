-- ProjectFlow Edu performance indexes for PostgreSQL.
-- Safe to run repeatedly.

CREATE INDEX IF NOT EXISTS idx_students_profile_match
ON students(branch_id, academic_year, semester, section, subsection);

CREATE INDEX IF NOT EXISTS idx_students_email_lower
ON students(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_students_roll_upper
ON students(UPPER(roll_number));

CREATE INDEX IF NOT EXISTS idx_registration_forms_match
ON registration_forms(status, branch_id, academic_year, semester, section, subsection);

CREATE INDEX IF NOT EXISTS idx_registration_forms_created_at
ON registration_forms(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_submissions_status_submitted
ON registration_form_submissions(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_submissions_form
ON registration_form_submissions(form_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type
ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_project_team_user
ON project_team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_team_student
ON project_team_members(student_id);

CREATE INDEX IF NOT EXISTS idx_project_team_submission
ON project_team_members(submission_id);

CREATE INDEX IF NOT EXISTS idx_project_team_form
ON project_team_members(form_id);

CREATE INDEX IF NOT EXISTS idx_project_team_email_lower
ON project_team_members(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_project_team_roll_upper
ON project_team_members(UPPER(roll_number));

CREATE INDEX IF NOT EXISTS idx_project_milestones_form
ON project_milestones(registration_form_id, deadline);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project
ON project_milestones(project_id, deadline);

CREATE INDEX IF NOT EXISTS idx_projects_status_created
ON projects(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_mentor_status
ON projects(mentor_id, status);
