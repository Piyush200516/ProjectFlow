const db = require('./db');

const tableExists = async (tableName) => {
  const result = await db.pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [tableName]
  );
  return result.rows.length > 0;
};

const columnExists = async (tableName, columnName) => {
  const result = await db.pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return result.rows.length > 0;
};

const createIndexIfColumnsExist = async (tableName, indexName, columnsSql, requiredColumns) => {
  if (!(await tableExists(tableName))) return;

  for (const columnName of requiredColumns) {
    if (!(await columnExists(tableName, columnName))) return;
  }

  await db.pool.query(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnsSql})`);
};

const ensurePerformanceIndexes = async () => {
  const indexes = [
    ['students', 'idx_students_profile_match', 'branch_id, academic_year, semester, section, subsection', ['branch_id', 'academic_year', 'semester', 'section', 'subsection']],
    ['students', 'idx_students_email_lower', 'LOWER(email)', ['email']],
    ['students', 'idx_students_roll_upper', 'UPPER(roll_number)', ['roll_number']],
    ['registration_forms', 'idx_registration_forms_match', 'status, branch_id, academic_year, semester, section, subsection', ['status', 'branch_id', 'academic_year', 'semester', 'section', 'subsection']],
    ['registration_forms', 'idx_registration_forms_created_at', 'created_at DESC', ['created_at']],
    ['registration_form_submissions', 'idx_registration_submissions_status_submitted', 'status, submitted_at DESC', ['status', 'submitted_at']],
    ['registration_form_submissions', 'idx_registration_submissions_form', 'form_id', ['form_id']],
    ['notifications', 'idx_notifications_user_read', 'user_id, is_read, created_at DESC', ['user_id', 'is_read', 'created_at']],
    ['notifications', 'idx_notifications_created_at', 'created_at DESC', ['created_at']],
    ['notifications', 'idx_notifications_type', 'type', ['type']],
    ['project_team_members', 'idx_project_team_user', 'user_id', ['user_id']],
    ['project_team_members', 'idx_project_team_student', 'student_id', ['student_id']],
    ['project_team_members', 'idx_project_team_submission', 'submission_id', ['submission_id']],
    ['project_team_members', 'idx_project_team_form', 'form_id', ['form_id']],
    ['project_team_members', 'idx_project_team_email_lower', 'LOWER(email)', ['email']],
    ['project_team_members', 'idx_project_team_roll_upper', 'UPPER(roll_number)', ['roll_number']],
    ['project_milestones', 'idx_project_milestones_form', 'registration_form_id, deadline', ['registration_form_id', 'deadline']],
    ['project_milestones', 'idx_project_milestones_project', 'project_id, deadline', ['project_id', 'deadline']],
    ['projects', 'idx_projects_status_created', 'status, created_at DESC', ['status', 'created_at']],
    ['projects', 'idx_projects_mentor_status', 'mentor_id, status', ['mentor_id', 'status']]
  ];

  for (const [tableName, indexName, columnsSql, requiredColumns] of indexes) {
    await createIndexIfColumnsExist(tableName, indexName, columnsSql, requiredColumns);
  }
};

module.exports = { ensurePerformanceIndexes };
