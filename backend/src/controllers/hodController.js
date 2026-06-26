const db = require('../config/db');
const {
  createStudentNotifications,
  createTeamNotifications,
  ensureNotificationsTable
} = require('../utils/studentNotifications');
const {
  ensureAdvancedWorkflowTables,
  recalculateProjectScores
} = require('../utils/advancedProjectWorkflow');

// Lazy initialize tables just in case they don't exist (since sandboxing prevents migrations)
(async () => {
    try {
        const hasUsers = await db.tableExists('users');
        if (!hasUsers) {
            return;
        }

        const createRegistrationFormsTable = `
            CREATE TABLE IF NOT EXISTS registration_forms (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                instructions TEXT,
                branch VARCHAR(100) NOT NULL,
                academic_year VARCHAR(20),
                semester INT NOT NULL,
                section VARCHAR(10) NOT NULL,
                team_size_min INT DEFAULT 1,
                team_size_max INT DEFAULT 4,
                project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Minor Project', 'Major Project', 'Research Project', 'Hackathon Project')),
                start_date TIMESTAMP NOT NULL,
                deadline TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                subsection VARCHAR(10),
                created_by INT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.execute(createRegistrationFormsTable);
        
        await db.execute(`
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
            );
        `);
        await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INT;`);
        await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);`);
        await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`);
        await db.execute(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50);`);
        await db.execute(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;`);
        await db.execute(`ALTER TABLE registration_forms ALTER COLUMN team_size_min SET DEFAULT 1;`);
        await db.execute(`ALTER TABLE registration_forms ALTER COLUMN team_size_max SET DEFAULT 4;`);
        await db.execute(`ALTER TABLE registration_forms DROP CONSTRAINT IF EXISTS chk_team_size;`);
        await db.execute(`
            ALTER TABLE registration_forms
            ADD CONSTRAINT chk_team_size
            CHECK (
                team_size_min >= 1
                AND team_size_max <= 4
                AND team_size_min <= team_size_max
            );
        `);

        // Remove the old constraint safely to allow lowercase statuses
        try {
            await db.execute(`ALTER TABLE registration_forms DROP CONSTRAINT IF EXISTS registration_forms_status_check;`);
        } catch (err) {
            console.warn("Optional constraint not found or could not be dropped, skipping:", err.message);
        }
        try {
            await db.execute(`ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS branch_id INT;`);
            await db.execute(`ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS subsection VARCHAR(10);`);
        } catch (err) {
            console.warn("Column branch_id might already exist or error:", err.message);
        }
        await db.execute(`
            CREATE TABLE IF NOT EXISTS registration_form_submissions (
                id SERIAL PRIMARY KEY,
                form_id INT NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
                project_title VARCHAR(255) NOT NULL,
                project_domain VARCHAR(100) NOT NULL,
                problem_statement TEXT,
                abstract TEXT,
                tech_stack TEXT,
                leader_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                team_members JSONB, 
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                remarks TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        console.error('Failed to init HOD tables:', e);
    }
})();

const REGISTRATION_FORM_NOTIFICATION_TITLE = 'New Project Registration Campaign Published';
const REGISTRATION_FORM_NOTIFICATION_MESSAGE = 'New Project Registration Campaign Published';
const PROJECT_TIMELINE_NOTIFICATION_TITLE = 'Project Timeline Published';
const PROJECT_TIMELINE_NOTIFICATION_MESSAGE = 'Your project document submission timeline has been published.';

const getPagination = (query, defaultLimit = 50) => {
  const limit = Math.min(parseInt(query.limit, 10) || defaultLimit, 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
};

const formFilters = (form) => ({
  branch_id: form.branch_id,
  academic_year: form.academic_year,
  semester: form.semester,
  section: form.section,
  subsection: form.subsection || null
});

const normalizeTarget = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized === '' || normalized.toLowerCase() === 'all' ? 'ALL' : normalized;
};

const isAllTarget = (value) => normalizeTarget(value) === 'ALL';
const ALLOWED_ACADEMIC_YEARS = ['2026-27', '2027-28', '2028-29'];

const isEligibleAcademicYear = (value) => {
  const trimmed = String(value || '').trim();
  return ALLOWED_ACADEMIC_YEARS.includes(trimmed);
};

const eligibleAcademicYearSql = (column = 'academic_year') => (
  `${column} = ANY(ARRAY['2026-27','2027-28','2028-29'])`
);

const normalizeMentorAllocationPayload = (body) => {
  const rawYear = body.year ?? body.year_level ?? '';
  const academicYear = String(body.academic_year || '').trim();
  const yearText = String(rawYear).trim();
  const numericYear = /^\d+$/.test(yearText) ? parseInt(yearText, 10) : null;

  return {
    year: yearText || academicYear,
    academicYear: academicYear || (numericYear === null ? yearText : null),
    yearLevel: numericYear,
    semester: parseInt(body.semester, 10),
    section: normalizeTarget(body.section),
    subsection: normalizeTarget(body.subsection),
    mentorId: parseInt(body.mentorId || body.mentor_id, 10)
  };
};

const ensureMentorAllocationTables = async (client = db.pool) => {
  const query = (sql, params = []) => client.query(sql, params);

  // Ensure projects table has academic cohort columns
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`);
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS semester INT`);
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`);

  // Ensure students table has academic cohort & mentor columns
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS year INT`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mentor_id INT REFERENCES users(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mentor_name VARCHAR(150)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mentor_email VARCHAR(150)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active'`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  // Initialize seed students with section/subsection to match cohort queries
  await query(`UPDATE students SET section = COALESCE(section, '1'), subsection = COALESCE(subsection, '1') WHERE semester = 6`);
  await query(`UPDATE students SET year = CEIL(semester::numeric / 2)::int WHERE year IS NULL AND semester IS NOT NULL`);
  await query(`UPDATE students SET status = 'active' WHERE status IS NULL`);
  const archivedStudents = await query(`
    UPDATE students
    SET status = 'archived',
        mentor_id = NULL,
        mentor_name = NULL,
        mentor_email = NULL,
        updated_at = NOW()
    WHERE ${eligibleAcademicYearSql('academic_year')} IS NOT TRUE
      AND COALESCE(status, 'active') <> 'archived'
  `);
  if (archivedStudents.rowCount) {
    console.log('[ACADEMIC_YEAR_ARCHIVE]', {
      archivedStudentsCount: archivedStudents.rowCount,
      minAcademicYearStart: ALLOWED_ACADEMIC_YEARS
    });
  }
  await query(`
    CREATE TABLE IF NOT EXISTS mentor_assignments (
      id SERIAL PRIMARY KEY,
      mentor_id INT REFERENCES users(id) ON DELETE CASCADE,
      mentor_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      registration_id INT,
      submission_id INT,
      assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
      section VARCHAR(10),
      subsection VARCHAR(10),
      academic_year VARCHAR(20),
      branch VARCHAR(100),
      domain VARCHAR(100),
      allocation_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`ALTER TABLE IF EXISTS mentor_assignments ADD COLUMN IF NOT EXISTS mentor_user_id INT REFERENCES users(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE IF EXISTS mentor_assignments ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS mentor_assignments ADD COLUMN IF NOT EXISTS allocation_id INT`);
  await query(`ALTER TABLE IF EXISTS mentor_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  await query(`
    CREATE TABLE IF NOT EXISTS mentor_allocations (
      id SERIAL PRIMARY KEY,
      year INT,
      academic_year VARCHAR(20) NOT NULL,
      semester INT NOT NULL,
      section VARCHAR(10) NOT NULL,
      subsection VARCHAR(10) NOT NULL,
      mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentor_name VARCHAR(150) NOT NULL,
      mentor_email VARCHAR(150) NOT NULL,
      created_by_hod INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`ALTER TABLE mentor_allocations ADD COLUMN IF NOT EXISTS year INT`);
  await query(`ALTER TABLE mentor_allocations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_allocations_unique_cohort
    ON mentor_allocations (academic_year, semester, UPPER(section), UPPER(subsection))
  `);
};

const formatMentorAllocation = (allocation) => ({
  ...allocation,
  year: allocation.year || allocation.academic_year,
  academicYear: allocation.academic_year,
  mentorId: allocation.mentor_id,
  mentorName: allocation.mentor_name,
  mentorEmail: allocation.mentor_email,
  createdByHod: allocation.created_by_hod
});

const getMentorById = async (client, mentorId) => {
  const result = await client.query(`
    SELECT u.id, u.full_name, u.email
    FROM users u
    WHERE u.id = $1 AND u.role = 'mentor' AND COALESCE(u.is_active, TRUE) = TRUE
    LIMIT 1
  `, [mentorId]);
  return result.rows[0] || null;
};

const tableExistsForClient = async (client, tableName) => {
  const result = await client.query('SELECT to_regclass($1)::text AS table_name', [`public.${tableName}`]);
  return Boolean(result.rows[0]?.table_name);
};

const getTableColumns = async (client, tableName) => {
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
  `, [tableName]);
  return new Set(result.rows.map((row) => row.column_name));
};

const quoteIdentifier = (identifier) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

const ensureNotificationsTableForClient = async (client) => {
  await client.query(`
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
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INT`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50)`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
  await client.query(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50)`);
  await client.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
};

const insertMentorAllocationNotifications = async (client, allocation, syncedStudents) => {
  await ensureNotificationsTableForClient(client);

  const rows = [];
  const studentIds = [...new Set((syncedStudents || []).map((student) => student.user_id).filter(Boolean))];
  for (const studentId of studentIds) {
    rows.push({
      userId: studentId,
      title: 'Mentor Assigned',
      message: `You have been assigned to mentor ${allocation.mentor_name}.`,
      type: 'mentor_assignment',
      referenceId: allocation.id,
      referenceType: 'mentor_assignment'
    });
  }

  if (allocation.mentor_id) {
    rows.push({
      userId: allocation.mentor_id,
      title: 'Mentor Assigned',
      message: `You have been assigned to mentor Semester ${allocation.semester}, Section ${allocation.section}, Subsection ${allocation.subsection}.`,
      type: 'mentor_assignment',
      referenceId: allocation.id,
      referenceType: 'mentor_assignment'
    });
  }

  if (rows.length === 0) {
    return { inserted: 0, studentNotifications: 0, mentorNotifications: 0 };
  }

  const values = [];
  const placeholders = rows.map((row, index) => {
    const offset = index * 7;
    values.push(row.userId, row.title, row.message, row.type, row.referenceId, row.referenceType, false);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  }).join(', ');

  const result = await client.query(`
    INSERT INTO notifications
    (user_id, title, message, type, reference_id, reference_type, is_read)
    VALUES ${placeholders}
  `, values);

  return {
    inserted: result.rowCount || 0,
    studentNotifications: studentIds.length,
    mentorNotifications: allocation.mentor_id ? 1 : 0
  };
};

const syncOptionalMentorCacheTable = async (client, tableName, allocation) => {
  if (!await tableExistsForClient(client, tableName)) {
    return { table: tableName, updated: 0, skipped: true, reason: 'table_missing' };
  }

  const columns = await getTableColumns(client, tableName);
  const mentorUpdates = [];
  const values = [];

  if (columns.has('mentor_id')) {
    values.push(allocation.mentor_id);
    mentorUpdates.push(`mentor_id = $${values.length}`);
  }
  if (columns.has('mentor_name')) {
    values.push(allocation.mentor_name);
    mentorUpdates.push(`mentor_name = $${values.length}`);
  }
  if (columns.has('mentor_email')) {
    values.push(allocation.mentor_email);
    mentorUpdates.push(`mentor_email = $${values.length}`);
  }
  if (columns.has('updated_at')) {
    mentorUpdates.push('updated_at = NOW()');
  }

  if (mentorUpdates.length === 0) {
    return { table: tableName, updated: 0, skipped: true, reason: 'mentor_columns_missing' };
  }

  if (tableName === 'registration_form_submissions' && columns.has('form_id') && await tableExistsForClient(client, 'registration_forms')) {
    const formColumns = await getTableColumns(client, 'registration_forms');
    if (formColumns.has('semester') && formColumns.has('section')) {
      const formFilters = [];
      values.push(allocation.semester);
      formFilters.push(`f.semester = $${values.length}`);
      if (formColumns.has('academic_year')) {
        values.push(allocation.academic_year);
        formFilters.push(`${eligibleAcademicYearSql('f.academic_year')} AND f.academic_year = $${values.length}`);
      }
      values.push(allocation.section);
      formFilters.push(`($${values.length} = 'ALL' OR UPPER(COALESCE(f.section, '')) = UPPER($${values.length}))`);
      if (formColumns.has('subsection')) {
        values.push(allocation.subsection);
        formFilters.push(`($${values.length} = 'ALL' OR UPPER(COALESCE(f.subsection, '')) = UPPER($${values.length}))`);
      }

      const result = await client.query(`
        UPDATE registration_form_submissions rfs
        SET ${mentorUpdates.join(', ')}
        FROM registration_forms f
        WHERE f.id = rfs.form_id
          AND ${formFilters.join(' AND ')}
      `, values);

      return { table: tableName, updated: result.rowCount || 0, skipped: false, via: 'registration_forms' };
    }
  }

  const cohortFilters = [];
  if (columns.has('semester')) {
    values.push(allocation.semester);
    cohortFilters.push(`semester = $${values.length}`);
  }
  if (columns.has('year')) {
    values.push(allocation.year);
    cohortFilters.push(`($${values.length}::int IS NULL OR year = $${values.length})`);
  }
  if (columns.has('academic_year')) {
    values.push(allocation.academic_year);
    cohortFilters.push(`${eligibleAcademicYearSql('academic_year')} AND academic_year = $${values.length}`);
  }
  if (columns.has('section')) {
    values.push(allocation.section);
    cohortFilters.push(`($${values.length} = 'ALL' OR UPPER(COALESCE(section, '')) = UPPER($${values.length}))`);
  }
  if (columns.has('subsection')) {
    values.push(allocation.subsection);
    cohortFilters.push(`($${values.length} = 'ALL' OR UPPER(COALESCE(subsection, '')) = UPPER($${values.length}))`);
  }

  if (cohortFilters.length === 0) {
    return { table: tableName, updated: 0, skipped: true, reason: 'cohort_columns_missing' };
  }

  const result = await client.query(`
    UPDATE ${quoteIdentifier(tableName)}
    SET ${mentorUpdates.join(', ')}
    WHERE ${cohortFilters.join(' AND ')}
  `, values);

  return { table: tableName, updated: result.rowCount || 0, skipped: false };
};

const syncMentorAllocationAssignments = async (client, allocation, previousAllocation = null) => {
  let previousStudentClear = { rowCount: 0 };
  let previousProjectClear = { rowCount: 0 };
  if (previousAllocation) {
    previousStudentClear = await client.query(`
      UPDATE students
      SET mentor_id = NULL,
          mentor_name = NULL,
          mentor_email = NULL,
          updated_at = NOW()
      WHERE mentor_id = $1
        AND semester = $2
        AND ${eligibleAcademicYearSql('academic_year')}
        AND COALESCE(status, 'active') = 'active'
        AND ($3::int IS NULL OR COALESCE(year, CEIL(semester::numeric / 2)::int) = $3)
        AND ($4::text IS NULL OR $4 = '' OR COALESCE(academic_year, '') = '' OR academic_year = $4)
        AND ($5 = 'ALL' OR UPPER(COALESCE(section, '')) = UPPER($5))
        AND ($6 = 'ALL' OR UPPER(COALESCE(subsection, '')) = UPPER($6))
    `, [
      previousAllocation.mentor_id,
      previousAllocation.semester,
      previousAllocation.year,
      previousAllocation.academic_year,
      previousAllocation.section,
      previousAllocation.subsection
    ]);

    previousProjectClear = await client.query(`
      UPDATE projects
      SET mentor_id = NULL,
          updated_at = NOW()
      WHERE mentor_id = $1
        AND semester = $2
        AND ${eligibleAcademicYearSql('academic_year')}
        AND ($3::int IS NULL OR CEIL(semester::numeric / 2)::int = $3)
        AND ($4::text IS NULL OR $4 = '' OR COALESCE(academic_year, '') = '' OR academic_year = $4)
        AND ($5 = 'ALL' OR UPPER(COALESCE(section, '')) = UPPER($5))
        AND ($6 = 'ALL' OR UPPER(COALESCE(subsection, '')) = UPPER($6))
    `, [
      previousAllocation.mentor_id,
      previousAllocation.semester,
      previousAllocation.year,
      previousAllocation.academic_year,
      previousAllocation.section,
      previousAllocation.subsection
    ]);
  }

  const studentUpdate = await client.query(`
    UPDATE students
    SET mentor_id = $1,
        mentor_name = $2,
        mentor_email = $3,
        updated_at = NOW()
    WHERE semester = $4
      AND ${eligibleAcademicYearSql('academic_year')}
      AND COALESCE(status, 'active') = 'active'
      AND ($5::int IS NULL OR COALESCE(year, CEIL(semester::numeric / 2)::int) = $5)
      AND ($6::text IS NULL OR $6 = '' OR COALESCE(academic_year, '') = '' OR academic_year = $6)
      AND ($7 = 'ALL' OR UPPER(COALESCE(section, '')) = UPPER($7))
      AND ($8 = 'ALL' OR UPPER(COALESCE(subsection, '')) = UPPER($8))
  `, [
    allocation.mentor_id,
    allocation.mentor_name,
    allocation.mentor_email,
    allocation.semester,
    allocation.year,
    allocation.academic_year,
    allocation.section,
    allocation.subsection
  ]);

  const projectUpdate = await client.query(`
    UPDATE projects
    SET mentor_id = $1,
        updated_at = NOW()
    WHERE ${eligibleAcademicYearSql('academic_year')}
      AND ($2::text IS NULL OR $2 = '' OR COALESCE(academic_year, '') = '' OR academic_year = $2)
      AND semester = $3
      AND ($4::int IS NULL OR CEIL(semester::numeric / 2)::int = $4)
      AND ($5 = 'ALL' OR UPPER(COALESCE(section, '')) = UPPER($5))
      AND ($6 = 'ALL' OR UPPER(COALESCE(subsection, '')) = UPPER($6))
  `, [
    allocation.mentor_id,
    allocation.academic_year,
    allocation.semester,
    allocation.year,
    allocation.section,
    allocation.subsection
  ]);

  let registrationUpdate = { rowCount: 0 };
  if (await tableExistsForClient(client, 'project_registrations')) {
    registrationUpdate = await client.query(`
      UPDATE project_registrations
      SET mentor_id = $1,
          updated_at = NOW()
      WHERE semester = $2
        AND ${eligibleAcademicYearSql('academic_year')}
        AND ($3::int IS NULL OR CEIL(semester::numeric / 2)::int = $3)
        AND ($4::text IS NULL OR $4 = '' OR COALESCE(academic_year, '') = '' OR academic_year = $4)
        AND ($5 = 'ALL' OR UPPER(COALESCE(section, '')) = UPPER($5))
        AND ($6 = 'ALL' OR UPPER(COALESCE(subsection, '')) = UPPER($6))
    `, [
      allocation.mentor_id,
      allocation.semester,
      allocation.year,
      allocation.academic_year,
      allocation.section,
      allocation.subsection
    ]);
  }

  const assignmentUpdate = await client.query(`
    UPDATE mentor_assignments ma
    SET mentor_id = $1,
        mentor_user_id = $1,
        allocation_id = $2,
        updated_at = NOW()
    WHERE ($3::text IS NULL OR $3 = '' OR COALESCE(ma.academic_year, '') = '' OR ma.academic_year = $3)
      AND ($4::int IS NULL OR ma.academic_year IS NULL OR ma.academic_year = '' OR $4 = CEIL(COALESCE((SELECT p.semester FROM projects p WHERE p.id = ma.project_id LIMIT 1), 0)::numeric / 2)::int)
      AND ($5 = 'ALL' OR UPPER(COALESCE(ma.section, '')) = UPPER($5))
      AND ($6 = 'ALL' OR UPPER(COALESCE(ma.subsection, '')) = UPPER($6))
  `, [
    allocation.mentor_id,
    allocation.id,
    allocation.academic_year,
    allocation.year,
    allocation.section,
    allocation.subsection
  ]);

  const optionalCacheTables = [
    'teams',
    'submissions',
    'project_groups',
    'project_form_submissions',
    'registration_form_submissions',
    'document_submissions',
    'milestone_submissions',
    'final_submissions'
  ];
  const optionalCacheUpdates = [];
  for (const tableName of optionalCacheTables) {
    optionalCacheUpdates.push(await syncOptionalMentorCacheTable(client, tableName, allocation));
  }

  const syncedStudents = await client.query(`
    SELECT s.user_id,
           COALESCE(s.full_name, u.full_name) AS full_name,
           COALESCE(s.email, u.email) AS email,
           s.roll_number,
           s.year,
           s.academic_year,
           s.semester,
           s.section,
           s.subsection,
           s.mentor_id,
           s.mentor_name,
           s.mentor_email,
           s.updated_at
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE s.semester = $1
      AND ($2::int IS NULL OR COALESCE(s.year, CEIL(s.semester::numeric / 2)::int) = $2)
      AND ${eligibleAcademicYearSql('s.academic_year')}
      AND COALESCE(s.status, 'active') = 'active'
      AND ($3::text IS NULL OR $3 = '' OR COALESCE(s.academic_year, '') = '' OR s.academic_year = $3)
      AND ($4 = 'ALL' OR UPPER(COALESCE(s.section, '')) = UPPER($4))
      AND ($5 = 'ALL' OR UPPER(COALESCE(s.subsection, '')) = UPPER($5))
    ORDER BY COALESCE(s.full_name, u.full_name) ASC
  `, [
    allocation.semester,
    allocation.year,
    allocation.academic_year,
    allocation.section,
    allocation.subsection
  ]);

  const notificationResult = await insertMentorAllocationNotifications(client, allocation, syncedStudents.rows);

  const syncResult = {
    studentsUpdated: studentUpdate.rowCount || 0,
    projectsUpdated: projectUpdate.rowCount || 0,
    projectRegistrationsUpdated: registrationUpdate.rowCount || 0,
    mentorAssignmentsUpdated: assignmentUpdate.rowCount || 0,
    notificationsInserted: notificationResult.inserted,
    studentNotificationsInserted: notificationResult.studentNotifications,
    mentorNotificationsInserted: notificationResult.mentorNotifications,
    oldStudentsCleared: previousStudentClear.rowCount || 0,
    oldProjectsCleared: previousProjectClear.rowCount || 0,
    cachedTables: optionalCacheUpdates,
    teamsUpdated: optionalCacheUpdates
      .filter((item) => ['teams', 'project_groups'].includes(item.table))
      .reduce((sum, item) => sum + (item.updated || 0), 0),
    submissionsUpdated: optionalCacheUpdates
      .filter((item) => item.table.includes('submissions') || item.table === 'project_form_submissions')
      .reduce((sum, item) => sum + (item.updated || 0), 0),
    updatedStudents: syncedStudents.rows,
    oldMentor: previousAllocation
      ? {
          id: previousAllocation.mentor_id,
          name: previousAllocation.mentor_name,
          email: previousAllocation.mentor_email
        }
      : null,
    newMentor: {
      id: allocation.mentor_id,
      name: allocation.mentor_name,
      email: allocation.mentor_email
    }
  };

  console.log('[MENTOR_ALLOCATION_SYNC]', {
    allocationId: allocation.id,
    year: allocation.year || allocation.academic_year,
    semester: allocation.semester,
    section: allocation.section,
    subsection: allocation.subsection,
    sqlResult: {
      studentsRowCount: studentUpdate.rowCount || 0,
      projectsRowCount: projectUpdate.rowCount || 0,
      projectRegistrationsRowCount: registrationUpdate.rowCount || 0,
      mentorAssignmentsRowCount: assignmentUpdate.rowCount || 0,
      oldStudentsClearedRowCount: previousStudentClear.rowCount || 0,
      oldProjectsClearedRowCount: previousProjectClear.rowCount || 0,
      notificationsInserted: notificationResult.inserted,
      cachedTableResults: optionalCacheUpdates
    },
    ...syncResult
  });

  return syncResult;
};

const ensureRegistrationFormPublishColumns = async () => {
  await db.execute(`ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`);
  await db.execute(`UPDATE registration_forms SET is_published = TRUE WHERE LOWER(COALESCE(status, '')) = 'published'`);
};

const defaultTimelineMilestones = [
  { title: 'Synopsis', document_type: 'synopsis' },
  { title: 'SRS', document_type: 'srs' },
  { title: 'PPT', document_type: 'ppt' },
  { title: 'Poster', document_type: 'poster' },
  { title: 'Project Report', document_type: 'report' },
  { title: 'GitHub Final Submission', document_type: 'github' }
];

const ensureProjectApprovalCompatibility = async (client) => {
  await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS registration_id INT`);
  await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS branch VARCHAR(100)`);
  await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`);
  await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS semester INT`);
  await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
  await client.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS registration_id INT`);
  await client.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member'`);
  await client.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS is_leader BOOLEAN DEFAULT FALSE`);

  await client.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check`);
  await client.query(`
    ALTER TABLE projects
    ADD CONSTRAINT projects_type_check
    CHECK (type IN (
      'Mini Project',
      'Minor Project',
      'Major Project',
      'Hackathon Project',
      'Final Year Project',
      'Research Project'
    ))
  `);
};

const syncApprovedProjectForSubmission = async (client, submissionId, mentorId = null) => {
  await ensureProjectApprovalCompatibility(client);

  const submissionResult = await client.query(`
    SELECT s.id,
           s.form_id,
           s.project_title,
           s.project_domain,
           s.abstract,
           s.problem_statement,
           s.tech_stack,
           s.leader_id,
           f.project_type,
           f.branch,
           f.academic_year,
           f.semester,
           f.section,
           f.subsection,
           pr.id as project_registration_id
    FROM registration_form_submissions s
    JOIN registration_forms f ON f.id = s.form_id
    LEFT JOIN project_registrations pr
      ON pr.created_by = s.leader_id
     AND pr.title = s.project_title
    WHERE s.id = $1
    ORDER BY pr.id DESC NULLS LAST
    LIMIT 1
  `, [submissionId]);

  if (submissionResult.rows.length === 0) {
    return null;
  }

  const submission = submissionResult.rows[0];
  let projectRegistrationId = submission.project_registration_id;

  if (!projectRegistrationId) {
    const registrationResult = await client.query(`
      INSERT INTO project_registrations
      (title, description, project_type, branch, academic_year, semester, section, domain, abstract, created_by, status, problem_statement, tech_stack)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Approved', $11, $12)
      RETURNING id
    `, [
      submission.project_title,
      submission.abstract || submission.problem_statement || '',
      submission.project_type || 'Minor Project',
      submission.branch || 'CSE',
      submission.academic_year,
      submission.semester,
      submission.section,
      submission.project_domain,
      submission.abstract || '',
      submission.leader_id,
      submission.problem_statement || '',
      submission.tech_stack || ''
    ]);
    projectRegistrationId = registrationResult.rows[0].id;
  } else {
    await client.query(
      `UPDATE project_registrations SET status = 'Approved', updated_at = NOW() WHERE id = $1`,
      [projectRegistrationId]
    );
  }

  await client.query(`
    UPDATE project_team_members
    SET project_registration_id = $1
    WHERE submission_id = $2
      AND (project_registration_id IS NULL OR project_registration_id = $1)
  `, [projectRegistrationId, submission.id]);

  const existingProject = await client.query(`
    SELECT id
    FROM projects
    WHERE registration_id = $1
       OR (created_by = $2 AND title = $3)
    ORDER BY id DESC
    LIMIT 1
  `, [projectRegistrationId, submission.leader_id, submission.project_title]);

  let projectId = existingProject.rows[0]?.id || null;
  const projectStatus = 'In Progress';

  if (projectId) {
    await client.query(`
      UPDATE projects
      SET registration_id = $1,
          type = $2,
          description = $3,
          status = $4,
          branch = $5,
          academic_year = $6,
          semester = $7,
          section = $8,
          mentor_id = COALESCE($9, mentor_id),
          updated_at = NOW()
      WHERE id = $10
    `, [
      projectRegistrationId,
      submission.project_type || 'Minor Project',
      submission.abstract || submission.problem_statement || '',
      projectStatus,
      submission.branch,
      submission.academic_year,
      submission.semester,
      submission.section,
      mentorId,
      projectId
    ]);
  } else {
    const projectResult = await client.query(`
      INSERT INTO projects
      (registration_id, title, type, team_name, description, status, progress_percent, branch, academic_year, semester, section, created_by, mentor_id)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      projectRegistrationId,
      submission.project_title,
      submission.project_type || 'Minor Project',
      submission.project_title,
      submission.abstract || submission.problem_statement || '',
      projectStatus,
      submission.branch,
      submission.academic_year,
      submission.semester,
      submission.section,
      submission.leader_id,
      mentorId
    ]);
    projectId = projectResult.rows[0].id;
  }

  const membersResult = await client.query(`
    SELECT DISTINCT COALESCE(user_id, student_id, student_user_id) as student_id,
           COALESCE(is_leader, is_team_leader, false) as is_leader
    FROM project_team_members
    WHERE submission_id = $1
      AND COALESCE(user_id, student_id, student_user_id) IS NOT NULL
  `, [submission.id]);

  const members = membersResult.rows.length > 0
    ? membersResult.rows
    : [{ student_id: submission.leader_id, is_leader: true }];

  for (const member of members) {
    await client.query(`
      INSERT INTO project_members (project_id, registration_id, student_id, role, is_leader)
      SELECT $1, $2, $3, $4, $5
      WHERE NOT EXISTS (
        SELECT 1 FROM project_members WHERE project_id = $1 AND student_id = $3
      )
    `, [
      projectId,
      projectRegistrationId,
      member.student_id,
      member.is_leader ? 'Leader' : 'Member',
      member.is_leader
    ]);
  }

  return {
    ...submission,
    project_id: projectId,
    project_registration_id: projectRegistrationId
  };
};

const ensureRegistrationNotificationTable = async () => {
  await ensureNotificationsTable();
};

const notifyMatchingStudentsForRegistrationForm = async (form) => {
  return createStudentNotifications({
    title: REGISTRATION_FORM_NOTIFICATION_TITLE,
    message: REGISTRATION_FORM_NOTIFICATION_MESSAGE,
    type: 'registration_form',
    referenceId: form.id,
    referenceType: 'registration_form',
    filters: formFilters(form)
  });
};

const notifyMatchingStudents = async (form, notification) => {
  return createStudentNotifications({
    title: notification.title,
    message: notification.message,
    type: notification.type,
    referenceId: notification.referenceId || form.id,
    referenceType: notification.referenceType,
    filters: formFilters(form)
  });
};

const ensureRegistrationTimelineColumns = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS project_milestones (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      document_type VARCHAR(100),
      sequence_no INT,
      sequence_order INT,
      deadline TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS registration_form_id INT REFERENCES registration_forms(id) ON DELETE CASCADE`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS project_registration_id INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS document_type VARCHAR(100)`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS sequence_no INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS sequence_order INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.execute(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'project_id'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN project_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'project_registration_id'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN project_registration_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'document_type'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN document_type DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'sequence_no'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN sequence_no DROP NOT NULL;
      END IF;
    END $$;
  `);
  await db.execute(`
    UPDATE project_milestones
    SET registration_form_id = project_registration_id
    WHERE registration_form_id IS NULL
      AND project_registration_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM registration_forms
        WHERE registration_forms.id = project_milestones.project_registration_id
      )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_project_milestones_registration_form ON project_milestones(registration_form_id, sequence_no)`);
};

// @desc    Get HOD dashboard stats (department wide)
// @route   GET /api/hod/dashboard-stats
// @access  Private (HOD)
exports.getHodStats = async (req, res) => {
  try {
    await ensureAdvancedWorkflowTables();
    const [statsRows] = await db.execute(`
      SELECT
        (SELECT COUNT(*)::int FROM registration_forms) AS total_forms,
        (SELECT COUNT(*)::int FROM registration_forms WHERE LOWER(status) = 'published') AS published_forms,
        (SELECT COUNT(*)::int FROM registration_form_submissions) AS total_submissions,
        (SELECT COUNT(*)::int FROM registration_form_submissions WHERE status = 'Pending') AS pending_approvals,
        (SELECT COUNT(*)::int FROM registration_form_submissions WHERE status = 'Approved') AS approved_projects,
        (SELECT COUNT(*)::int FROM registration_form_submissions WHERE status = 'Rejected') AS rejected_projects,
        (SELECT COUNT(DISTINCT project_id)::int FROM mentor_assignments) AS mentor_assigned_projects,
        (SELECT COUNT(*)::int FROM milestone_scores WHERE is_late = TRUE) AS late_submissions,
        (SELECT COUNT(*)::int FROM projects WHERE status = 'Completed') AS completed_projects,
        (SELECT ROUND(COALESCE(AVG(final_marks), 0), 2) FROM student_scores) AS average_marks
    `);
    const stats = statsRows[0] || {};
    const topTeams = await db.pool.query(`
      SELECT pr.title,
             ps.total_marks
      FROM project_scores ps
      JOIN project_registrations pr ON pr.id = ps.project_registration_id
      ORDER BY ps.total_marks DESC NULLS LAST
      LIMIT 5
    `);
    
    res.json({
      totalForms: stats.total_forms || 0,
      publishedForms: stats.published_forms || 0,
      totalSubmissions: stats.total_submissions || 0,
      pendingApprovals: stats.pending_approvals || 0,
      approvedProjects: stats.approved_projects || 0,
      rejectedProjects: stats.rejected_projects || 0,
      mentorAssignedProjects: stats.mentor_assigned_projects || 0,
      lateSubmissions: stats.late_submissions || 0,
      completedProjects: stats.completed_projects || 0,
      averageMarks: stats.average_marks || 0,
      topTeams: topTeams.rows
    });
  } catch (error) {
    console.error('getHodStats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all projects for HOD oversight
// @route   GET /api/hod/projects
// @access  Private (HOD)
exports.getAllProjects = async (req, res) => {
  try {
    const { limit, offset } = getPagination(req.query);
    const [projects] = await db.execute(
      `SELECT p.id,
              p.title,
              p.type,
              p.team_name,
              p.status,
              p.progress_percent AS progress,
              p.created_at,
              u.full_name as mentor_name
       FROM projects p 
       LEFT JOIN users u ON p.mentor_id = u.id 
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [counts] = await db.execute(`SELECT COUNT(*)::int AS total FROM projects`);
    res.json({ data: projects, pagination: { limit, offset, total: counts[0]?.total || 0 } });
  } catch (error) {
    console.error('getAllProjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { limit, offset } = getPagination(req.query);
    const [students] = await db.execute(
      `SELECT u.id,
              u.full_name,
              u.email,
              u.is_active,
              s.roll_number,
              s.semester,
              s.academic_year,
              s.section,
              s.subsection,
              b.name as branch_name
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE u.role = 'student'
       ORDER BY u.full_name ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [counts] = await db.execute(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'student'`);
    res.json({ data: students, pagination: { limit, offset, total: counts[0]?.total || 0 } });
  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 1. Create Project Registration Form
exports.createRegistrationForm = async (req, res) => {
  try {
    await ensureRegistrationFormPublishColumns();
    console.log("HOD publish payload:", req.body);
    const {
      title, instructions, branch, branch_id, academic_year, semester,
      section, subsection, team_size_min, team_size_max, project_type, start_date, deadline, status
    } = req.body;
    const created_by = req.user.id;
    let resolvedBranch = branch ? normalizeTarget(branch) : null;
    let finalBranchId = isAllTarget(branch) || isAllTarget(branch_id) ? null : branch_id;

    if (!resolvedBranch && finalBranchId) {
      const branchResult = await db.pool.query('SELECT name FROM branches WHERE id = $1', [finalBranchId]);
      resolvedBranch = branchResult.rows[0]?.name;
    }
    resolvedBranch = normalizeTarget(resolvedBranch);

    if (!title || !resolvedBranch || !academic_year || !semester || !project_type || !start_date || !deadline) {
      return res.status(400).json({
        message: 'Title, branch, academic year, semester, project type, start date, and deadline are required.'
      });
    }

    const parsedSemester = parseInt(semester, 10);
    const parsedTeamSizeMin = parseInt(team_size_min, 10);
    const parsedTeamSizeMax = parseInt(team_size_max, 10);
    const parsedStartDate = new Date(start_date);
    const parsedDeadline = new Date(deadline);

    if (Number.isNaN(parsedSemester)) {
      return res.status(400).json({ message: 'Semester must be a valid number.' });
    }

    if (Number.isNaN(parsedTeamSizeMin) || Number.isNaN(parsedTeamSizeMax)) {
      return res.status(400).json({ message: 'Team size must be valid numbers.' });
    }

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: 'Start date and deadline must be valid dates.' });
    }

    if (parsedDeadline <= parsedStartDate) {
      return res.status(400).json({ message: 'Deadline must be after the start date.' });
    }

    if (academic_year) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentAcademicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;
      const submittedStartYear = parseInt(academic_year.split('-')[0], 10);
      
      if (submittedStartYear < currentAcademicStartYear) {
        return res.status(400).json({ message: 'Please select the current or a future academic year.' });
      }
    }

    if (project_type === 'Minor Project' && ![5, 6].includes(parsedSemester)) {
      return res.status(400).json({ message: 'Invalid semester for Minor Project. Must be 5 or 6.' });
    }
    if (project_type === 'Major Project' && ![7, 8].includes(parsedSemester)) {
      return res.status(400).json({ message: 'Invalid semester for Major Project. Must be 7 or 8.' });
    }

    if (parsedTeamSizeMin < 1 || parsedTeamSizeMax > 4 || parsedTeamSizeMin > parsedTeamSizeMax) {
      return res.status(400).json({ message: 'Team size must be between 1 and 4 members.' });
    }

    let finalStatus = status || 'published';
    if (finalStatus.toLowerCase() === 'published' || finalStatus.toLowerCase() === 'active') finalStatus = 'published';
    if (finalStatus.toLowerCase() === 'draft') finalStatus = 'draft';
    if (finalStatus.toLowerCase() === 'closed') finalStatus = 'closed';

    if (!finalBranchId && !isAllTarget(resolvedBranch)) {
      if (resolvedBranch === 'Electronics & Communication Engineering') finalBranchId = 2;
      else finalBranchId = 1;
    }

    const finalSection = normalizeTarget(section);
    const finalSubsection = normalizeTarget(subsection);
    const isPublished = finalStatus === 'published';

    const result = await db.pool.query(`
      INSERT INTO registration_forms 
      (title, instructions, branch, branch_id, academic_year, semester, section, subsection, team_size_min, team_size_max, project_type, start_date, deadline, status, is_published, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [title, instructions, resolvedBranch, finalBranchId, academic_year, parsedSemester, finalSection, finalSubsection, parsedTeamSizeMin, parsedTeamSizeMax, project_type, start_date, deadline, finalStatus, isPublished, created_by]);
    
    const newForm = result.rows[0];
    console.log("Created registration form:", newForm);
    console.log("Form created:", newForm.id);

    const notifiedStudentsCount = await notifyMatchingStudentsForRegistrationForm(newForm);
    console.log("Students notified:", notifiedStudentsCount);

    res.status(201).json({
      success: true,
      message: finalStatus === 'published'
        ? "Registration form published and notifications sent"
        : "Registration form created and notifications sent",
      notifiedStudents: notifiedStudentsCount,
      data: newForm
    });
  } catch (error) {
    console.error('createRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRegistrationForms = async (req, res) => {
  try {
    await ensureRegistrationFormPublishColumns();
    const { limit, offset } = getPagination(req.query);
    const [forms] = await db.execute(`
      SELECT f.id,
        f.title,
        f.instructions,
        f.branch,
        f.branch_id,
        f.academic_year,
        f.semester,
        f.section,
        f.subsection,
        f.team_size_min,
        f.team_size_max,
        f.project_type,
        f.start_date,
        f.deadline,
        f.status,
        f.is_published,
        f.created_at,
        f.updated_at,
        (SELECT COUNT(*) FROM registration_form_submissions s WHERE s.form_id = f.id) as submissions_count
      FROM registration_forms f
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    const [counts] = await db.execute(`SELECT COUNT(*)::int AS total FROM registration_forms`);
    res.json({ data: forms, pagination: { limit, offset, total: counts[0]?.total || 0 } });
  } catch (error) {
    console.error('getRegistrationForms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateRegistrationForm = async (req, res) => {
  try {
    await ensureRegistrationFormPublishColumns();
    const { id } = req.params;
    const updates = req.body;
    const beforeResult = await db.pool.query('SELECT * FROM registration_forms WHERE id = $1', [id]);
    if (beforeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }
    const existingForm = beforeResult.rows[0];

    const allowedFields = new Set([
      'title',
      'instructions',
      'branch',
      'branch_id',
      'academic_year',
      'semester',
      'section',
      'subsection',
      'team_size_min',
      'team_size_max',
      'project_type',
      'start_date',
      'deadline',
      'status'
    ]);
    const entries = Object.entries(updates)
      .filter(([key]) => allowedFields.has(key))
      .map(([key, value]) => {
        if (key === 'status') {
          const normalizedStatus = String(value).toLowerCase();
          if (normalizedStatus === 'published' || normalizedStatus === 'active') return [key, 'published'];
          if (normalizedStatus === 'draft') return [key, 'draft'];
          if (normalizedStatus === 'closed') return [key, 'closed'];
        }
        if (key === 'section' || key === 'subsection') {
          return [key, normalizeTarget(value)];
        }
        return [key, value];
      });

    const statusEntryForPublishFlag = entries.find(([key]) => key === 'status');
    if (statusEntryForPublishFlag) {
      entries.push(['is_published', statusEntryForPublishFlag[1] === 'published']);
    }

    if (entries.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const fields = entries.map(([key], idx) => `${key} = $${idx + 1}`).join(', ');
    const values = entries.map(([, value]) => value);
    values.push(id);
    
    const result = await db.pool.query(`
      UPDATE registration_forms 
      SET ${fields}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Form not found' });

    const updatedForm = result.rows[0];
    const statusEntry = entries.find(([key]) => key === 'status');
    const deadlineChanged = entries.some(([key, value]) => (
      key === 'deadline' && new Date(value).getTime() !== new Date(existingForm.deadline).getTime()
    ));

    let notification = null;
    if (statusEntry?.[1] === 'published' && (existingForm.status || '').toLowerCase() !== 'published') {
      notification = {
        title: REGISTRATION_FORM_NOTIFICATION_TITLE,
        message: REGISTRATION_FORM_NOTIFICATION_MESSAGE,
        type: 'registration_form',
        referenceType: 'registration_form'
      };
    } else if (statusEntry?.[1] === 'closed') {
      notification = {
        title: 'Project Registration Closed',
        message: `Project registration for "${updatedForm.title}" has been closed.`,
        type: 'registration_form_closed',
        referenceType: 'registration_form'
      };
    } else if (deadlineChanged) {
      notification = {
        title: 'Project Deadline Updated',
        message: `The deadline for "${updatedForm.title}" has been updated.`,
        type: 'deadline_updated',
        referenceType: 'registration_form'
      };
    } else {
      notification = {
        title: 'Project Registration Form Updated',
        message: `The project registration form "${updatedForm.title}" has been updated by HOD.`,
        type: 'registration_form_updated',
        referenceType: 'registration_form'
      };
    }

    if (notification) {
      const notifiedStudents = await notifyMatchingStudents(updatedForm, notification);
      console.log("Students notified:", notifiedStudents);
      return res.json({
        success: true,
        message: "Registration form updated and notifications sent",
        notifiedStudents,
        data: updatedForm
      });
    }

    res.json({ success: true, data: updatedForm });
  } catch (error) {
    console.error('updateRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.publishRegistrationForm = async (req, res) => {
  try {
    await ensureRegistrationFormPublishColumns();
    const { id } = req.params;
    console.log('Publish request for form id:', id);
    const result = await db.pool.query(`
      UPDATE registration_forms
      SET status = 'published',
          is_published = TRUE,
          section = COALESCE(NULLIF(section, ''), 'ALL'),
          subsection = COALESCE(NULLIF(subsection, ''), 'ALL'),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    console.log('Published form result:', result);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const publishedForm = result.rows[0];
    const notifiedStudents = await notifyMatchingStudentsForRegistrationForm(publishedForm);
    console.log("Students notified:", notifiedStudents);

    res.json({
      success: true,
      message: "Registration form published and notifications sent",
      notifiedStudents,
      data: publishedForm
    });
  } catch (error) {
    console.error('publishRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.closeRegistrationForm = async (req, res) => {
  try {
    await ensureRegistrationFormPublishColumns();
    const { id } = req.params;
    const result = await db.pool.query(`
      UPDATE registration_forms SET status = 'closed', is_published = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const closedForm = result.rows[0];
    const notifiedStudents = await notifyMatchingStudents(closedForm, {
      title: 'Project Registration Closed',
      message: `Project registration for "${closedForm.title}" has been closed.`,
      type: 'registration_form_closed',
      referenceType: 'registration_form'
    });

    res.json({
      success: true,
      message: 'Registration form closed and notifications sent',
      notifiedStudents,
      data: closedForm
    });
  } catch (error) {
    console.error('closeRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createRegistrationFormTimeline = async (req, res) => {
  const { formId } = req.params;
  const { start_date, interval_days = 15, milestones = defaultTimelineMilestones } = req.body;
  const intervalDays = Number(interval_days);

  if (!start_date) {
    return res.status(400).json({ message: 'start_date is required' });
  }

  if (!Array.isArray(milestones) || milestones.length === 0) {
    return res.status(400).json({ message: 'At least one timeline milestone is required' });
  }

  if (!Number.isFinite(intervalDays) || intervalDays < 1) {
    return res.status(400).json({ message: 'interval_days must be a positive number' });
  }

  try {
    await ensureRegistrationTimelineColumns();

    const formResult = await db.pool.query(`
      SELECT id, title, status, branch_id, academic_year, semester, section, subsection
      FROM registration_forms
      WHERE id = $1
    `, [formId]);
    if (formResult.rows.length === 0) {
      return res.status(404).json({ message: 'Registration form not found' });
    }

    const form = formResult.rows[0];
    if ((form.status || '').toLowerCase() !== 'published') {
      return res.status(400).json({ message: 'Publish the registration form before creating its timeline' });
    }

    const baseDate = new Date(start_date);
    if (Number.isNaN(baseDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start_date' });
    }

    const existingTimelineResult = await db.pool.query(
      'SELECT COUNT(*)::int AS count FROM project_milestones WHERE registration_form_id = $1 OR project_registration_id = $1',
      [form.id]
    );
    const isTimelineUpdate = (existingTimelineResult.rows[0]?.count || 0) > 0;

    const client = await db.pool.connect();
    let created = [];
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM project_milestones WHERE registration_form_id = $1 OR project_registration_id = $1',
        [form.id]
      );

      const milestoneRows = [];
      for (let index = 0; index < milestones.length; index += 1) {
        const item = milestones[index];
        const title = typeof item === 'string' ? item : item.title;
        const documentType = typeof item === 'string'
          ? item.toLowerCase().replace(/\s+/g, '_')
          : item.document_type || item.type || title?.toLowerCase().replace(/\s+/g, '_');
        const deadline = new Date(baseDate);
        deadline.setDate(baseDate.getDate() + intervalDays * (index + 1));

        if (!title) {
          throw new Error('Milestone title is required');
        }

        milestoneRows.push({
          title,
          document_type: documentType,
          sequence_no: index + 1,
          deadline: deadline.toISOString()
        });
      }

      const result = await client.query(`
        WITH input_milestones AS (
          SELECT *
          FROM jsonb_to_recordset($2::jsonb) AS x(title text, document_type text, sequence_no int, deadline timestamptz)
        )
        INSERT INTO project_milestones
        (registration_form_id, title, document_type, sequence_no, sequence_order, deadline, status, created_by)
        SELECT $1, title, document_type, sequence_no, sequence_no, deadline, 'pending', $3
        FROM input_milestones
        ORDER BY sequence_no
        RETURNING *
      `, [form.id, JSON.stringify(milestoneRows), req.user.id]);
      created = result.rows;

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const notifiedStudents = await notifyMatchingStudents(form, {
      title: isTimelineUpdate ? 'Project Timeline Updated' : PROJECT_TIMELINE_NOTIFICATION_TITLE,
      message: isTimelineUpdate
        ? 'Your project document submission timeline has been updated.'
        : PROJECT_TIMELINE_NOTIFICATION_MESSAGE,
      type: isTimelineUpdate ? 'project_timeline_updated' : 'project_timeline',
      referenceType: 'timeline'
    });

    res.status(201).json({
      success: true,
      form,
      timeline: created,
      notifiedStudents
    });
  } catch (error) {
    console.error('createRegistrationFormTimeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRegistrationSubmissions = async (req, res) => {
  try {
    const { limit, offset } = getPagination(req.query);
    const filters = [];
    const values = [];
    const addFilter = (field, value) => {
      if (value !== undefined && value !== null && value !== '') {
        values.push(value);
        filters.push(`${field} = $${values.length}`);
      }
    };

    addFilter('f.branch_id', req.query.branch_id);
    addFilter('f.academic_year', req.query.academic_year);
    addFilter('f.semester', req.query.semester ? Number(req.query.semester) : null);
    addFilter('f.section', req.query.section);
    addFilter('f.subsection', req.query.subsection);
    addFilter('s.status', req.query.status);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    values.push(limit, offset);

    const submissionsResult = await db.pool.query(`
      SELECT s.id,
             s.form_id,
             s.project_title,
             s.project_domain,
             s.problem_statement,
             s.abstract,
             s.tech_stack,
             s.leader_id,
             s.team_members,
             s.status,
             s.remarks,
             s.submitted_at,
             s.updated_at,
             f.title as form_title,
             f.branch,
             f.branch_id,
             f.academic_year,
             f.semester,
             f.section,
             f.subsection,
             u.full_name as leader_name,
             u.email as leader_email,
             st.roll_number as leader_roll_number,
             COALESCE(
               jsonb_agg(
                 jsonb_build_object(
                   'id', ptm.id,
                   'full_name', ptm.full_name,
                   'email', ptm.email,
                   'roll_number', ptm.roll_number,
                   'role', ptm.role,
                   'is_leader', COALESCE(ptm.is_leader, ptm.is_team_leader, false)
                 )
                 ORDER BY COALESCE(ptm.is_leader, ptm.is_team_leader, false) DESC, ptm.full_name
               ) FILTER (WHERE ptm.id IS NOT NULL),
               '[]'::jsonb
             ) as team_members_list
      FROM registration_form_submissions s
      JOIN registration_forms f ON s.form_id = f.id
      JOIN users u ON s.leader_id = u.id
      LEFT JOIN students st ON st.user_id = s.leader_id
      LEFT JOIN project_team_members ptm ON ptm.submission_id = s.id
      ${whereClause}
      GROUP BY s.id, f.id, u.id, st.roll_number
      ORDER BY s.submitted_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    const countResult = await db.pool.query(`
      SELECT COUNT(DISTINCT s.id)::int AS total
      FROM registration_form_submissions s
      JOIN registration_forms f ON s.form_id = f.id
      ${whereClause}
    `, values.slice(0, -2));

    res.json({
      data: submissionsResult.rows,
      pagination: { limit, offset, total: countResult.rows[0]?.total || 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRegistrationSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [submissions] = await db.execute(`
      SELECT s.*, f.title as form_title, f.branch, f.semester, f.section,
             u.full_name as leader_name, u.email as leader_email
      FROM registration_form_submissions s
      JOIN registration_forms f ON s.form_id = f.id
      JOIN users u ON s.leader_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (submissions.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(submissions[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveRegistrationSubmission = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    console.log('[HOD_APPROVE] request', {
      params: req.params,
      body: req.body,
      actor: req.user?.id,
    });

    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE registration_form_submissions 
      SET status = 'Approved', remarks = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [remarks || null, id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = result.rows[0];
    console.log('[HOD_APPROVE] submission updated', {
      id: submission.id,
      status: submission.status,
      project_title: submission.project_title,
    });

    const syncedProject = await syncApprovedProjectForSubmission(client, submission.id);
    console.log('[HOD_APPROVE] project sync result', syncedProject);
    await client.query('COMMIT');

    const notifiedStudents = await createTeamNotifications({
      projectRegistrationId: submission.id,
      title: 'Project Registration Approved',
      message: `Your project registration "${submission.project_title}" has been approved.`,
      type: 'approval',
      referenceId: submission.id,
      referenceType: 'approval'
    });

    res.json({
      success: true,
      notifiedStudents,
      data: {
        ...submission,
        project_id: syncedProject?.project_id,
        project_registration_id: syncedProject?.project_registration_id
      }
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('approveRegistrationSubmission rollback error:', rollbackError);
    }
    console.error('approveRegistrationSubmission error:', {
      params: req.params,
      body: req.body,
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

exports.rejectRegistrationSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const result = await db.pool.query(`
      UPDATE registration_form_submissions 
      SET status = 'Rejected', remarks = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [remarks || null, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = result.rows[0];
    const notifiedStudents = await createTeamNotifications({
      projectRegistrationId: submission.id,
      title: 'Project Registration Rejected',
      message: `Your project registration "${submission.project_title}" has been rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
      type: 'rejection',
      referenceId: submission.id,
      referenceType: 'rejection'
    });

    res.json({
      success: true,
      notifiedStudents,
      data: submission
    });
  } catch (error) {
    console.error('rejectRegistrationSubmission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.assignMentor = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { submission_id, mentor_id } = req.body;
    const assigned_by = req.user.id;

    await client.query('BEGIN');

    const submissionResult = await client.query(`
      SELECT s.id,
             s.project_title,
             s.abstract,
             s.leader_id,
             s.project_domain,
             f.branch,
             f.academic_year,
             f.section
      FROM registration_form_submissions s
      JOIN registration_forms f ON f.id = s.form_id
      WHERE s.id = $1
      FOR UPDATE
    `, [submission_id]);
    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Submission not found' });
    }
    const submission = submissionResult.rows[0];

    const syncedProject = await syncApprovedProjectForSubmission(client, submission.id, mentor_id);
    if (!syncedProject) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Submission not found' });
    }

    await client.query(`
      UPDATE registration_form_submissions
      SET status = CASE WHEN status = 'Rejected' THEN status ELSE 'Approved' END,
          updated_at = NOW()
      WHERE id = $1
    `, [submission.id]);

    await client.query(`
      UPDATE projects
      SET mentor_id = $1,
          status = CASE WHEN status = 'Rejected' THEN status ELSE 'In Progress' END,
          updated_at = NOW()
      WHERE id = $2
    `, [mentor_id, syncedProject.project_id]);

    await client.query(`ALTER TABLE IF EXISTS mentor_assignments ADD COLUMN IF NOT EXISTS mentor_user_id INT REFERENCES users(id) ON DELETE CASCADE`);

    const result = await client.query(`
      INSERT INTO mentor_assignments
      (mentor_id, mentor_user_id, project_id, registration_id, submission_id, assigned_by, section, academic_year, branch, domain)
      VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      mentor_id,
      syncedProject.project_id,
      syncedProject.project_registration_id,
      submission.id,
      assigned_by,
      submission.section,
      submission.academic_year,
      submission.branch,
      submission.project_domain
    ]);

    const mentorResult = await client.query('SELECT full_name FROM users WHERE id = $1', [mentor_id]);
    const mentorName = mentorResult.rows[0]?.full_name || 'your mentor';

    await client.query('COMMIT');

    const notifiedStudents = await createTeamNotifications({
      projectRegistrationId: submission.id,
      title: 'Mentor Assigned',
      message: 'Mentor assigned to your project.',
      type: 'mentor_assignment',
      referenceId: result.rows[0].id,
      referenceType: 'mentor_assignment'
    });
    
    res.status(201).json({
      success: true,
      notifiedStudents,
      mentorName,
      data: result.rows[0]
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('assignMentor rollback error:', rollbackError);
    }
    console.error('assignMentor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

exports.getMentorAllocations = async (req, res) => {
  try {
    await ensureMentorAllocationTables();
    const result = await db.pool.query(`
      SELECT ma.*,
             hod.full_name AS hod_name,
             COUNT(DISTINCT s.user_id)::int AS student_count
      FROM mentor_allocations ma
      LEFT JOIN users hod ON hod.id = ma.created_by_hod
      LEFT JOIN students s
        ON s.semester = ma.semester
       AND (ma.year IS NULL OR COALESCE(s.year, CEIL(s.semester::numeric / 2)::int) = ma.year)
       AND (ma.academic_year = '' OR COALESCE(s.academic_year, '') = '' OR s.academic_year = ma.academic_year)
       AND (ma.section = 'ALL' OR UPPER(COALESCE(s.section, '')) = UPPER(ma.section))
       AND (ma.subsection = 'ALL' OR UPPER(COALESCE(s.subsection, '')) = UPPER(ma.subsection))
      GROUP BY ma.id, hod.full_name
      ORDER BY ma.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(formatMentorAllocation)
    });
  } catch (error) {
    console.error('getMentorAllocations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMentorAllocation = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const payload = normalizeMentorAllocationPayload(req.body);
    console.log('[MENTOR_ALLOCATION_CREATE_BODY]', req.body);
    console.log('[MENTOR_ALLOCATION_CREATE] payload:', payload);

    if (!payload.year || Number.isNaN(payload.semester) || !payload.section || !payload.subsection || Number.isNaN(payload.mentorId)) {
      return res.status(400).json({ message: 'Academic year, semester, section, subsection, and mentor are required.' });
    }
    if (!isEligibleAcademicYear(payload.academicYear)) {
      return res.status(400).json({ message: 'Academic year must be 2025-26 or newer.' });
    }

    await client.query('BEGIN');
    await ensureMentorAllocationTables(client);

    const duplicate = await client.query(`
      SELECT id
      FROM mentor_allocations
      WHERE academic_year = $1
        AND semester = $2
        AND UPPER(section) = UPPER($3)
        AND UPPER(subsection) = UPPER($4)
      LIMIT 1
    `, [payload.academicYear || '', payload.semester, payload.section, payload.subsection]);

    if (duplicate.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This year, semester, section, and subsection already has a mentor allocation.' });
    }

    const mentor = await getMentorById(client, payload.mentorId);
    if (!mentor) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid mentor selection.' });
    }

    const result = await client.query(`
      INSERT INTO mentor_allocations
      (year, academic_year, semester, section, subsection, mentor_id, mentor_name, mentor_email, created_by_hod)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      payload.yearLevel,
      payload.academicYear || '',
      payload.semester,
      payload.section,
      payload.subsection,
      mentor.id,
      mentor.full_name,
      mentor.email,
      req.user.id
    ]);
    console.log('[MENTOR_ALLOCATION_CREATE_RESULT]', result.rows[0]);

    const sync = await syncMentorAllocationAssignments(client, result.rows[0]);
    console.log('[MENTOR_ALLOCATION_CREATE_STUDENT_UPDATE_RESULT]', {
      studentsUpdated: sync.studentsUpdated,
      updatedStudents: sync.updatedStudents,
      notificationsInserted: sync.notificationsInserted
    });
    await client.query('COMMIT');
    console.log('[MENTOR_ALLOCATION_CREATE_SUCCESS]', {
      allocationId: result.rows[0].id,
      mentorName: mentor.full_name,
      affectedStudentsCount: sync.studentsUpdated,
      year: result.rows[0].year || result.rows[0].academic_year,
      semester: result.rows[0].semester,
      section: result.rows[0].section,
      subsection: result.rows[0].subsection
    });

    res.status(201).json({
      success: true,
      message: 'Mentor allocation created successfully.',
      sync,
      data: formatMentorAllocation(result.rows[0])
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('createMentorAllocation rollback error:', rollbackError);
    }
    console.error('createMentorAllocation error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

exports.updateMentorAllocation = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const allocationId = parseInt(req.params.id, 10);
    const payload = normalizeMentorAllocationPayload(req.body);
    console.log('[MENTOR_ALLOCATION_UPDATE_BODY]', req.body);
    console.log('[MENTOR_ALLOCATION_UPDATE] params:', req.params, 'payload:', payload);

    if (Number.isNaN(allocationId)) {
      return res.status(400).json({ message: 'Valid allocation id is required.' });
    }

    if (!payload.year || Number.isNaN(payload.semester) || !payload.section || !payload.subsection || Number.isNaN(payload.mentorId)) {
      return res.status(400).json({ message: 'Academic year, semester, section, subsection, and mentor are required.' });
    }
    if (!isEligibleAcademicYear(payload.academicYear)) {
      return res.status(400).json({ message: 'Academic year must be 2025-26 or newer.' });
    }

    await client.query('BEGIN');
    await ensureMentorAllocationTables(client);

    const existing = await client.query('SELECT * FROM mentor_allocations WHERE id = $1 FOR UPDATE', [allocationId]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Mentor allocation not found.' });
    }

    const duplicate = await client.query(`
      SELECT id
      FROM mentor_allocations
      WHERE id <> $5
        AND academic_year = $1
        AND semester = $2
        AND UPPER(section) = UPPER($3)
        AND UPPER(subsection) = UPPER($4)
      LIMIT 1
    `, [payload.academicYear || '', payload.semester, payload.section, payload.subsection, allocationId]);

    if (duplicate.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This year, semester, section, and subsection already has a mentor allocation.' });
    }

    const mentor = await getMentorById(client, payload.mentorId);
    if (!mentor) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid mentor selection.' });
    }

    const result = await client.query(`
      UPDATE mentor_allocations
      SET year = $1,
          academic_year = $2,
          semester = $3,
          section = $4,
          subsection = $5,
          mentor_id = $6,
          mentor_name = $7,
          mentor_email = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      payload.yearLevel,
      payload.academicYear || '',
      payload.semester,
      payload.section,
      payload.subsection,
      mentor.id,
      mentor.full_name,
      mentor.email,
      allocationId
    ]);
    console.log('[MENTOR_ALLOCATION_UPDATE_RESULT]', result.rows[0]);

    const sync = await syncMentorAllocationAssignments(client, result.rows[0], existing.rows[0]);
    console.log('[MENTOR_ALLOCATION_UPDATE_STUDENT_UPDATE_RESULT]', {
      studentsUpdated: sync.studentsUpdated,
      updatedStudents: sync.updatedStudents,
      notificationsInserted: sync.notificationsInserted
    });
    await client.query('COMMIT');
    console.log('[MENTOR_ALLOCATION_UPDATE_SUCCESS]', {
      allocationId: result.rows[0].id,
      mentorName: mentor.full_name,
      affectedStudentsCount: sync.studentsUpdated,
      year: result.rows[0].year || result.rows[0].academic_year,
      semester: result.rows[0].semester,
      section: result.rows[0].section,
      subsection: result.rows[0].subsection,
      oldMentorId: existing.rows[0].mentor_id
    });

    res.json({
      success: true,
      message: 'Mentor allocation updated successfully.',
      sync,
      data: formatMentorAllocation(result.rows[0])
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('updateMentorAllocation rollback error:', rollbackError);
    }
    console.error('updateMentorAllocation error:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

exports.deleteMentorAllocation = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const allocationId = parseInt(req.params.id, 10);
    console.log('[MENTOR_ALLOCATION_DELETE] params:', req.params);

    if (Number.isNaN(allocationId)) {
      return res.status(400).json({ message: 'Valid allocation id is required.' });
    }

    await client.query('BEGIN');
    await ensureMentorAllocationTables(client);

    const result = await client.query('DELETE FROM mentor_allocations WHERE id = $1 RETURNING *', [allocationId]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Mentor allocation not found.' });
    }

    await client.query(`
      UPDATE mentor_assignments
      SET allocation_id = NULL,
          updated_at = NOW()
      WHERE allocation_id = $1
    `, [allocationId]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Mentor allocation deleted successfully.',
      data: formatMentorAllocation(result.rows[0])
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('deleteMentorAllocation rollback error:', rollbackError);
    }
    console.error('deleteMentorAllocation error:', {
      message: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type } = req.query; // 'submissions', 'approved', 'mentors'
    let query = '';
    
    if (type === 'submissions') {
      query = `SELECT * FROM registration_form_submissions`;
    } else if (type === 'approved') {
      query = `SELECT * FROM registration_form_submissions WHERE status = 'Approved'`;
    } else if (type === 'mentors') {
      query = `SELECT m.*, u.full_name as mentor_name, p.title as project_title
               FROM mentor_assignments m
               JOIN users u ON m.mentor_id = u.id
               JOIN projects p ON m.project_id = p.id`;
    } else if (type === 'marks') {
      query = `SELECT pr.title as project_title,
                      u.full_name as student_name,
                      u.email,
                      ss.base_project_marks,
                      ss.contribution_percent,
                      ss.final_marks,
                      ss.updated_at
               FROM student_scores ss
               JOIN project_registrations pr ON pr.id = ss.project_registration_id
               JOIN users u ON u.id = ss.student_user_id
               ORDER BY pr.title, u.full_name`;
    } else if (type === 'late-submissions') {
      query = `SELECT pr.title as project_title,
                      pm.title as milestone_title,
                      u.full_name as submitted_by,
                      ms.submitted_at,
                      pm.deadline,
                      msc.late_days
               FROM milestone_scores msc
               JOIN milestone_submissions ms ON ms.id = msc.milestone_submission_id
               JOIN project_milestones pm ON pm.id = msc.milestone_id
               JOIN project_registrations pr ON pr.id = msc.project_registration_id
               JOIN users u ON u.id = msc.student_user_id
               WHERE msc.is_late = TRUE
               ORDER BY ms.submitted_at DESC`;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }
    
    const [data] = await db.execute(query);
    // In a real app we'd convert this to CSV using json2csv, but for now we'll just send JSON which the frontend can convert
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMarksReport = async (req, res) => {
  try {
    await ensureAdvancedWorkflowTables();
    const result = await db.pool.query(`
      SELECT pr.id as project_registration_id,
             pr.title as project_title,
             p.id as project_id,
             u.id as student_user_id,
             u.full_name as student_name,
             u.email,
             ptm.roll_number,
             ps.total_marks as team_marks,
             ss.contribution_percent,
             ss.final_marks,
             ss.updated_at
      FROM student_scores ss
      JOIN project_registrations pr ON pr.id = ss.project_registration_id
      LEFT JOIN projects p ON p.registration_id = pr.id
      JOIN users u ON u.id = ss.student_user_id
      LEFT JOIN project_team_members ptm
        ON ptm.project_registration_id = pr.id
       AND COALESCE(ptm.user_id, ptm.student_id, ptm.student_user_id) = u.id
      LEFT JOIN project_scores ps ON ps.project_registration_id = pr.id
      ORDER BY pr.title ASC, u.full_name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getMarksReport error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createFinalEvaluation = async (req, res) => {
  const {
    project_registration_id,
    mentor_id,
    viva_marks = 0,
    demo_marks = 0,
    presentation_marks = 0,
    innovation_marks = 0,
    remarks
  } = req.body;

  if (!project_registration_id) {
    return res.status(400).json({ message: 'project_registration_id is required' });
  }

  try {
    await ensureAdvancedWorkflowTables();
    const result = await db.pool.query(`
      INSERT INTO final_evaluations
      (project_registration_id, mentor_id, hod_id, viva_marks, demo_marks, presentation_marks, innovation_marks, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      project_registration_id,
      mentor_id || null,
      req.user.id,
      Math.max(0, Number(viva_marks) || 0),
      Math.max(0, Number(demo_marks) || 0),
      Math.max(0, Number(presentation_marks) || 0),
      Math.max(0, Number(innovation_marks) || 0),
      remarks || ''
    ]);

    const projectScore = await recalculateProjectScores(project_registration_id);
    res.status(201).json({ success: true, evaluation: result.rows[0], project_score: projectScore });
  } catch (error) {
    console.error('createFinalEvaluation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMentors = async (req, res) => {
  try {
    const [mentors] = await db.execute(`
      SELECT m.*, u.full_name, u.email, u.profile_image 
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE u.role = 'mentor' AND u.is_active = TRUE
    `);
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
