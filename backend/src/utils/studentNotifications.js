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
    SELECT user_id
    FROM students
    WHERE branch_id = $1
      AND academic_year = $2
      AND semester = $3
      AND section = $4
      AND (
        subsection = $5 OR $5 IS NULL OR $5 = ''
      )
  `, [
    filters.branch_id,
    filters.academic_year,
    filters.semester,
    filters.section,
    filters.subsection || null
  ]);

  const userIds = result.rows.map((student) => student.user_id);
  console.log('Matching students for notification:', userIds.length);

  const count = await insertNotifications({
    userIds,
    title,
    message,
    type,
    referenceId,
    referenceType
  });
  console.log('Notifications inserted:', count);
  return count;
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

  for (const member of teamMembers) {
    if (member.user_id) {
      userIds.push(member.user_id);
      continue;
    }

    if (member.email || member.roll_number) {
      const studentResult = await db.pool.query(`
        SELECT s.user_id
        FROM students s
        JOIN users u ON u.id = s.user_id
        WHERE ($1::text IS NULL OR LOWER(COALESCE(s.email, u.email)) = LOWER($1))
          AND ($2::text IS NULL OR LOWER(s.roll_number) = LOWER($2))
        LIMIT 1
      `, [member.email || null, member.roll_number || null]);
      if (studentResult.rows[0]?.user_id) {
        userIds.push(studentResult.rows[0].user_id);
      }
    }
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
