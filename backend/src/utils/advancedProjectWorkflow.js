const db = require('../config/db');
const { createTeamNotifications } = require('./studentNotifications');

const MAX_PROJECT_MARKS = 50;
const MARKS_BREAKUP = {
  timelySubmission: 20,
  documentationCompletion: 10,
  mentorReview: 10,
  finalDemoViva: 5,
  innovationQuality: 5,
};

const ensureAdvancedWorkflowTables = async (client = db.pool) => {
  const query = (sql, params = []) => client.query(sql, params);

  await query(`
    CREATE TABLE IF NOT EXISTS project_scores (
      id SERIAL PRIMARY KEY,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      max_marks NUMERIC(6,2) DEFAULT 50,
      timely_submission_marks NUMERIC(6,2) DEFAULT 0,
      documentation_marks NUMERIC(6,2) DEFAULT 0,
      mentor_review_marks NUMERIC(6,2) DEFAULT 0,
      final_demo_marks NUMERIC(6,2) DEFAULT 0,
      innovation_marks NUMERIC(6,2) DEFAULT 0,
      total_marks NUMERIC(6,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_registration_id)
    )
  `);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS project_id INT REFERENCES projects(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS max_marks NUMERIC(6,2) DEFAULT 50`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS timely_submission_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS documentation_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS mentor_review_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS final_demo_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS innovation_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS total_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE project_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_scores_registration_unique
    ON project_scores(project_registration_id)
    WHERE project_registration_id IS NOT NULL
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS student_scores (
      id SERIAL PRIMARY KEY,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      student_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      base_project_marks NUMERIC(6,2) DEFAULT 0,
      contribution_percent NUMERIC(6,2) DEFAULT 100,
      contribution_adjustment NUMERIC(6,2) DEFAULT 0,
      timeliness_score NUMERIC(6,2) DEFAULT 0,
      final_marks NUMERIC(6,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_registration_id, student_user_id)
    )
  `);
  await query(`ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS base_project_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS contribution_percent NUMERIC(6,2) DEFAULT 100`);
  await query(`ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS contribution_adjustment NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS timeliness_score NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS final_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_scores_registration_student_unique
    ON student_scores(project_registration_id, student_user_id)
    WHERE project_registration_id IS NOT NULL AND student_user_id IS NOT NULL
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS milestone_scores (
      id SERIAL PRIMARY KEY,
      milestone_submission_id INT REFERENCES milestone_submissions(id) ON DELETE CASCADE,
      milestone_id INT REFERENCES project_milestones(id) ON DELETE CASCADE,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      student_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      timeliness_marks NUMERIC(6,2) DEFAULT 0,
      documentation_marks NUMERIC(6,2) DEFAULT 0,
      mentor_marks NUMERIC(6,2) DEFAULT 0,
      total_marks NUMERIC(6,2) DEFAULT 0,
      is_late BOOLEAN DEFAULT FALSE,
      late_days INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(milestone_submission_id)
    )
  `);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS milestone_id INT REFERENCES project_milestones(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS student_user_id INT REFERENCES users(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS timeliness_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS documentation_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS mentor_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS total_marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS late_days INT DEFAULT 0`);
  await query(`ALTER TABLE milestone_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_scores_submission_unique
    ON milestone_scores(milestone_submission_id)
    WHERE milestone_submission_id IS NOT NULL
  `);

  await query(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) DEFAULT 'submitted'`);
  await query(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS feedback TEXT`);
  await query(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS marks NUMERIC(6,2) DEFAULT 0`);

  await query(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id SERIAL PRIMARY KEY,
      milestone_submission_id INT REFERENCES milestone_submissions(id) ON DELETE CASCADE,
      version_no INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'submitted',
      UNIQUE(milestone_submission_id, version_no)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS student_contributions (
      id SERIAL PRIMARY KEY,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      student_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      task_title VARCHAR(255),
      contribution_percent NUMERIC(6,2) DEFAULT 100,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS mentor_reviews (
      id SERIAL PRIMARY KEY,
      milestone_submission_id INT REFERENCES milestone_submissions(id) ON DELETE CASCADE,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
      feedback TEXT,
      marks NUMERIC(6,2) DEFAULT 0,
      review_status VARCHAR(30) DEFAULT 'submitted',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS milestone_submission_id INT REFERENCES milestone_submissions(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE`);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS mentor_id INT REFERENCES users(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS feedback TEXT`);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS marks NUMERIC(6,2) DEFAULT 0`);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) DEFAULT 'submitted'`);
  await query(`ALTER TABLE mentor_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  await query(`
    CREATE TABLE IF NOT EXISTS final_evaluations (
      id SERIAL PRIMARY KEY,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
      hod_id INT REFERENCES users(id) ON DELETE SET NULL,
      viva_marks NUMERIC(6,2) DEFAULT 0,
      demo_marks NUMERIC(6,2) DEFAULT 0,
      presentation_marks NUMERIC(6,2) DEFAULT 0,
      innovation_marks NUMERIC(6,2) DEFAULT 0,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS meeting_logs (
      id SERIAL PRIMARY KEY,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
      meeting_date TIMESTAMP NOT NULL,
      agenda TEXT,
      remarks TEXT,
      attendance_json JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      project_registration_id INT REFERENCES project_registrations(id) ON DELETE CASCADE,
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      event_type VARCHAR(50),
      event_date TIMESTAMP NOT NULL,
      audience VARCHAR(30) DEFAULT 'team',
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      actor_id INT REFERENCES users(id) ON DELETE SET NULL,
      project_registration_id INT,
      action VARCHAR(100) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const calculateLateDays = (submittedAt, deadline) => {
  if (!submittedAt || !deadline) return 0;
  const diff = new Date(submittedAt).getTime() - new Date(deadline).getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const calculateTimelinessMarks = (lateDays, maxMarks = MARKS_BREAKUP.timelySubmission) => {
  if (lateDays <= 0) return maxMarks;
  if (lateDays === 1) return maxMarks * 0.8;
  if (lateDays === 2) return maxMarks * 0.6;
  return maxMarks * 0.4;
};

const getProjectRegistrationForProject = async (projectId, client = db.pool) => {
  const result = await client.query(`
    SELECT COALESCE(p.registration_id, pr.id) as project_registration_id,
           p.id as project_id
    FROM projects p
    LEFT JOIN project_registrations pr
      ON pr.id = p.registration_id
      OR (pr.created_by = p.created_by AND pr.title = p.title)
    WHERE p.id = $1
    ORDER BY pr.id DESC NULLS LAST
    LIMIT 1
  `, [projectId]);
  return result.rows[0] || null;
};

const recalculateProjectScores = async (projectRegistrationId, client = db.pool) => {
  await ensureAdvancedWorkflowTables(client);

  const projectResult = await client.query(`
    SELECT pr.id as project_registration_id, p.id as project_id
    FROM project_registrations pr
    LEFT JOIN projects p ON p.registration_id = pr.id
    WHERE pr.id = $1
    ORDER BY p.id DESC NULLS LAST
    LIMIT 1
  `, [projectRegistrationId]);
  const project = projectResult.rows[0];
  if (!project) return null;

  const aggregateResult = await client.query(`
    SELECT COALESCE(AVG(msc.timeliness_marks), 0)::numeric AS timely_submission_marks,
           COALESCE(AVG(msc.documentation_marks), 0)::numeric AS documentation_marks,
           COALESCE(AVG(msc.mentor_marks), 0)::numeric AS mentor_review_marks
    FROM milestone_scores msc
    WHERE msc.project_registration_id = $1
  `, [projectRegistrationId]);

  const finalResult = await client.query(`
    SELECT COALESCE(AVG(viva_marks + demo_marks + presentation_marks), 0)::numeric AS final_demo_marks,
           COALESCE(AVG(innovation_marks), 0)::numeric AS innovation_marks
    FROM final_evaluations
    WHERE project_registration_id = $1
  `, [projectRegistrationId]);

  const aggregate = aggregateResult.rows[0] || {};
  const final = finalResult.rows[0] || {};
  const timely = Math.min(Number(aggregate.timely_submission_marks || 0), MARKS_BREAKUP.timelySubmission);
  const documentation = Math.min(Number(aggregate.documentation_marks || 0), MARKS_BREAKUP.documentationCompletion);
  const mentorReview = Math.min(Number(aggregate.mentor_review_marks || 0), MARKS_BREAKUP.mentorReview);
  const finalDemo = Math.min(Number(final.final_demo_marks || 0), MARKS_BREAKUP.finalDemoViva);
  const innovation = Math.min(Number(final.innovation_marks || 0), MARKS_BREAKUP.innovationQuality);
  const total = Math.min(timely + documentation + mentorReview + finalDemo + innovation, MAX_PROJECT_MARKS);

  let scoreResult = await client.query(`
    UPDATE project_scores
    SET project_id = $2,
        max_marks = $3,
        timely_submission_marks = $4,
        documentation_marks = $5,
        mentor_review_marks = $6,
        final_demo_marks = $7,
        innovation_marks = $8,
        total_marks = $9,
        updated_at = NOW()
    WHERE project_registration_id = $1
    RETURNING *
  `, [projectRegistrationId, project.project_id, MAX_PROJECT_MARKS, timely, documentation, mentorReview, finalDemo, innovation, total]);

  if (scoreResult.rows.length === 0) {
    scoreResult = await client.query(`
      INSERT INTO project_scores
      (project_registration_id, project_id, max_marks, timely_submission_marks, documentation_marks, mentor_review_marks, final_demo_marks, innovation_marks, total_marks, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `, [projectRegistrationId, project.project_id, MAX_PROJECT_MARKS, timely, documentation, mentorReview, finalDemo, innovation, total]);
  }

  const membersResult = await client.query(`
    SELECT DISTINCT COALESCE(user_id, student_id, student_user_id) as student_user_id
    FROM project_team_members
    WHERE project_registration_id = $1
      AND COALESCE(user_id, student_id, student_user_id) IS NOT NULL
    UNION
    SELECT DISTINCT student_id as student_user_id
    FROM project_members
    WHERE registration_id = $1
  `, [projectRegistrationId]);

  for (const member of membersResult.rows) {
    const contributionResult = await client.query(`
      SELECT COALESCE(AVG(contribution_percent), 100)::numeric AS contribution_percent
      FROM student_contributions
      WHERE project_registration_id = $1 AND student_user_id = $2
    `, [projectRegistrationId, member.student_user_id]);
    const contributionPercent = Number(contributionResult.rows[0]?.contribution_percent || 100);
    const finalMarks = Math.max(0, Math.min(total * (contributionPercent / 100), MAX_PROJECT_MARKS));

    const studentUpdate = await client.query(`
      UPDATE student_scores
      SET base_project_marks = $3,
          contribution_percent = $4,
          contribution_adjustment = $5,
          timeliness_score = $6,
          final_marks = $7,
          updated_at = NOW()
      WHERE project_registration_id = $1 AND student_user_id = $2
    `, [
      projectRegistrationId,
      member.student_user_id,
      total,
      contributionPercent,
      finalMarks - total,
      timely,
      finalMarks
    ]);
    if (studentUpdate.rowCount === 0) {
      await client.query(`
        INSERT INTO student_scores
        (project_registration_id, student_user_id, base_project_marks, contribution_percent, contribution_adjustment, timeliness_score, final_marks, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        projectRegistrationId,
        member.student_user_id,
        total,
        contributionPercent,
        finalMarks - total,
        timely,
        finalMarks
      ]);
    }
  }

  return scoreResult.rows[0];
};

const recordMilestoneSubmissionScore = async (submission, client = db.pool) => {
  await ensureAdvancedWorkflowTables(client);

  const milestoneResult = await client.query(`
    SELECT pm.id, pm.project_id, pm.deadline, pm.max_marks, p.registration_id
    FROM project_milestones pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.id = $1
  `, [submission.milestone_id]);
  const milestone = milestoneResult.rows[0];
  if (!milestone) return null;

  const registration = milestone.registration_id
    ? { project_registration_id: milestone.registration_id }
    : await getProjectRegistrationForProject(milestone.project_id, client);
  if (!registration?.project_registration_id) return null;

  const lateDays = calculateLateDays(submission.submitted_at, milestone.deadline);
  const timelinessMarks = calculateTimelinessMarks(lateDays);
  const documentationMarks = MARKS_BREAKUP.documentationCompletion;

  const result = await client.query(`
    INSERT INTO milestone_scores
    (milestone_submission_id, milestone_id, project_registration_id, student_user_id, timeliness_marks, documentation_marks, mentor_marks, total_marks, is_late, late_days, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, NOW())
    ON CONFLICT (milestone_submission_id)
    DO UPDATE SET
      timeliness_marks = EXCLUDED.timeliness_marks,
      documentation_marks = EXCLUDED.documentation_marks,
      is_late = EXCLUDED.is_late,
      late_days = EXCLUDED.late_days,
      total_marks = milestone_scores.mentor_marks + EXCLUDED.timeliness_marks + EXCLUDED.documentation_marks,
      updated_at = NOW()
    RETURNING *
  `, [
    submission.id,
    submission.milestone_id,
    registration.project_registration_id,
    submission.submitted_by,
    timelinessMarks,
    documentationMarks,
    timelinessMarks + documentationMarks,
    lateDays > 0,
    lateDays
  ]);

  await recalculateProjectScores(registration.project_registration_id, client);
  return result.rows[0];
};

const recordDocumentVersion = async (submission, client = db.pool) => {
  await ensureAdvancedWorkflowTables(client);
  const versionResult = await client.query(`
    SELECT COALESCE(MAX(version_no), 0) + 1 AS next_version
    FROM document_versions
    WHERE milestone_submission_id = $1
  `, [submission.id]);

  const result = await client.query(`
    INSERT INTO document_versions
    (milestone_submission_id, version_no, file_name, file_path, uploaded_by, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    submission.id,
    versionResult.rows[0].next_version,
    submission.file_name,
    submission.file_path,
    submission.submitted_by,
    String(submission.status || 'submitted').toLowerCase()
  ]);
  return result.rows[0];
};

const notifyProjectTeam = async ({ projectRegistrationId, title, message, type, referenceId, referenceType }) => {
  const submissionResult = await db.pool.query(`
    SELECT submission_id
    FROM project_team_members
    WHERE project_registration_id = $1 AND submission_id IS NOT NULL
    ORDER BY submission_id DESC
    LIMIT 1
  `, [projectRegistrationId]);

  if (!submissionResult.rows[0]?.submission_id) return 0;
  return createTeamNotifications({
    projectRegistrationId: submissionResult.rows[0].submission_id,
    title,
    message,
    type,
    referenceId,
    referenceType
  });
};

module.exports = {
  MARKS_BREAKUP,
  MAX_PROJECT_MARKS,
  ensureAdvancedWorkflowTables,
  calculateLateDays,
  calculateTimelinessMarks,
  getProjectRegistrationForProject,
  recordDocumentVersion,
  recordMilestoneSubmissionScore,
  recalculateProjectScores,
  notifyProjectTeam
};
