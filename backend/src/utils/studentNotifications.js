const db = require('../config/db');

const ensureNotificationsTable = async () => {
  await db.pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50),
      reference_id INT,
      reference_type VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INT`);
  await db.pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50)`);
  await db.pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
  await db.pool.query(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50)`);
  await db.pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
};

const insertNotifications = async ({ userIds, title, message, type, referenceId, referenceType }) => {
  await ensureNotificationsTable();
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return 0;
  }

  const values = [];
  const placeholders = uniqueUserIds.map((userId, index) => {
    const offset = index * 7;
    values.push(userId, title, message, type, referenceId || null, referenceType || null, false);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  }).join(', ');

  const result = await db.pool.query(`
    INSERT INTO notifications
    (user_id, title, message, type, reference_id, reference_type, is_read)
    VALUES ${placeholders}
  `, values);

  return result.rowCount;
};

const createStudentNotifications = async ({
  title,
  message,
  type,
  referenceId,
  referenceType,
  filters = {}
}) => {
  await ensureNotificationsTable();

  const result = await db.pool.query(`
    INSERT INTO notifications
    (user_id, title, message, type, reference_id, reference_type, is_read)
    SELECT s.user_id, $6, $7, $8, $9, $10, FALSE
    FROM students s
    WHERE s.branch_id = $1
      AND s.academic_year = $2
      AND s.semester = $3
      AND ($4 = 'ALL' OR s.section = $4)
      AND (
        $5 = 'ALL' OR s.subsection = $5 OR $5 IS NULL OR $5 = ''
      )
  `, [
    filters.branch_id,
    filters.academic_year,
    filters.semester,
    filters.section,
    filters.subsection || null,
    title,
    message,
    type,
    referenceId || null,
    referenceType || null
  ]);

  console.log('Notifications inserted:', result.rowCount);
  return result.rowCount;
};

const getSubmissionTeamUserIds = async (projectRegistrationId) => {
  try {
    const teamResult = await db.pool.query(`
      SELECT COALESCE(user_id, student_id) AS user_id
      FROM project_team_members
      WHERE submission_id = $1
    `, [projectRegistrationId]);

    if (teamResult.rows.length > 0) {
      return teamResult.rows.map((member) => member.user_id).filter(Boolean);
    }
  } catch (error) {
    if (error.code !== '42P01' && error.code !== '42703') {
      throw error;
    }
  }

  const submissionResult = await db.pool.query(`
    SELECT leader_id, team_members
    FROM registration_form_submissions
    WHERE id = $1
    LIMIT 1
  `, [projectRegistrationId]);

  if (submissionResult.rows.length === 0) {
    return [];
  }

  const submission = submissionResult.rows[0];
  const userIds = [submission.leader_id];
  const teamMembers = Array.isArray(submission.team_members)
    ? submission.team_members
    : JSON.parse(submission.team_members || '[]');

  const unresolvedMembers = teamMembers
    .filter((member) => !member.user_id && (member.email || member.roll_number))
    .map((member) => ({
      email: String(member.email || '').trim().toLowerCase(),
      roll_number: String(member.roll_number || '').trim().toUpperCase()
    }));

  userIds.push(...teamMembers.map((member) => member.user_id).filter(Boolean));

  if (unresolvedMembers.length > 0) {
    const studentResult = await db.pool.query(`
      WITH input_members AS (
        SELECT *
        FROM jsonb_to_recordset($1::jsonb) AS x(email text, roll_number text)
      )
      SELECT DISTINCT s.user_id
      FROM input_members i
      JOIN students s ON TRUE
      JOIN users u ON u.id = s.user_id AND LOWER(u.role) = 'student'
      WHERE (i.email = '' OR LOWER(COALESCE(s.email, u.email)) = i.email)
        AND (i.roll_number = '' OR UPPER(s.roll_number) = i.roll_number)
    `, [JSON.stringify(unresolvedMembers)]);

    userIds.push(...studentResult.rows.map((student) => student.user_id).filter(Boolean));
  }

  return userIds;
};

const createTeamNotifications = async ({
  projectRegistrationId,
  title,
  message,
  type,
  referenceId,
  referenceType
}) => {
  const userIds = await getSubmissionTeamUserIds(projectRegistrationId);
  console.log('Project team students for notification:', userIds.length);

  const count = await insertNotifications({
    userIds,
    title,
    message,
    type,
    referenceId,
    referenceType
  });
  console.log('Team notifications inserted:', count);
  return count;
};

module.exports = {
  ensureNotificationsTable,
  createStudentNotifications,
  createTeamNotifications
};
