const db = require('../config/db');
const {
  ensureAdvancedWorkflowTables,
  getProjectRegistrationForProject,
  recordDocumentVersion,
  recordMilestoneSubmissionScore,
  recalculateProjectScores,
  notifyProjectTeam
} = require('../utils/advancedProjectWorkflow');

const defaultMilestones = [
  'Synopsis',
  'SRS',
  'PPT',
  'Poster',
  'Project Report',
  'GitHub Final Submission'
];

const ensureMilestoneTables = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS project_milestones (
      id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      sequence_order INT NOT NULL,
      deadline TIMESTAMP NOT NULL,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_project_milestone_order UNIQUE (project_id, sequence_order)
    )
  `);

  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS project_id INT REFERENCES projects(id) ON DELETE CASCADE`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS sequence_order INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS document_type VARCHAR(100)`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS instructions TEXT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS max_marks NUMERIC(6,2) DEFAULT 10`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.execute(`
    DO $$
    BEGIN
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
        UPDATE project_milestones
        SET sequence_order = sequence_no
        WHERE sequence_order IS NULL AND sequence_no IS NOT NULL;
      END IF;
    END $$;
  `);
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_project_milestone_order_idx
    ON project_milestones(project_id, sequence_order)
    WHERE project_id IS NOT NULL AND sequence_order IS NOT NULL
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS milestone_submissions (
      id SERIAL PRIMARY KEY,
      milestone_id INT NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
      project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      submitted_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_url VARCHAR(1000),
      status VARCHAR(20) DEFAULT 'Submitted',
      is_late BOOLEAN DEFAULT FALSE,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      remarks TEXT,
      CONSTRAINT unique_milestone_student_submission UNIQUE (milestone_id, submitted_by)
    )
  `);

  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS file_path VARCHAR(500)`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000)`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) DEFAULT 'submitted'`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS feedback TEXT`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS marks NUMERIC(6,2) DEFAULT 0`);
  await db.execute(`ALTER TABLE milestone_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.execute(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'milestone_submissions' AND column_name = 'submission_timestamp'
      ) THEN
        UPDATE milestone_submissions
        SET submitted_at = submission_timestamp
        WHERE submitted_at IS NULL AND submission_timestamp IS NOT NULL;
      END IF;
    END $$;
  `);
  await db.execute(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'milestone_submissions_milestone_id_fkey'
          AND conrelid = 'milestone_submissions'::regclass
      ) THEN
        ALTER TABLE milestone_submissions DROP CONSTRAINT milestone_submissions_milestone_id_fkey;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'milestone_submissions_project_milestone_id_fkey'
          AND conrelid = 'milestone_submissions'::regclass
      ) THEN
        ALTER TABLE milestone_submissions
        ADD CONSTRAINT milestone_submissions_project_milestone_id_fkey
        FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE CASCADE NOT VALID;
      END IF;
    END $$;
  `);
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_milestone_student_submission_idx
    ON milestone_submissions(milestone_id, submitted_by)
  `);

  await ensureAdvancedWorkflowTables();
};

const getAccessibleProject = async (projectId, user) => {
  if (projectId) {
    if (user.role === 'student') {
      const [projects] = await db.execute(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         WHERE p.id = ? AND pm.student_id = ?`,
        [projectId, user.id]
      );
      return projects[0];
    }

    if (user.role === 'mentor') {
      const [projects] = await db.execute('SELECT * FROM projects WHERE id = ? AND mentor_id = ?', [projectId, user.id]);
      return projects[0];
    }

    const [projects] = await db.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
    return projects[0];
  }

  const [projects] = await db.execute(
    `SELECT p.* FROM projects p
     JOIN project_members pm ON p.id = pm.project_id
     WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')
     ORDER BY p.created_at DESC
     LIMIT 1`,
    [user.id]
  );
  return projects[0];
};

exports.createTimeline = async (req, res) => {
  const { project_id, start_date, interval_days = 15, milestones = defaultMilestones } = req.body;
  const intervalDays = Number(interval_days);

  if (!project_id || !start_date) {
    return res.status(400).json({ message: 'project_id and start_date are required' });
  }

  if (!Array.isArray(milestones) || milestones.length === 0) {
    return res.status(400).json({ message: 'At least one milestone is required' });
  }

  if (!Number.isFinite(intervalDays) || intervalDays < 1) {
    return res.status(400).json({ message: 'interval_days must be a positive number' });
  }

  try {
    await ensureMilestoneTables();
    const project = await getAccessibleProject(project_id, req.user);

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not accessible' });
    }

    const baseDate = new Date(start_date);
    if (Number.isNaN(baseDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start_date' });
    }

    const created = [];
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM project_milestones WHERE project_id = $1', [project_id]);

      for (let index = 0; index < milestones.length; index += 1) {
        const title = typeof milestones[index] === 'string' ? milestones[index] : milestones[index].title;
        const description = typeof milestones[index] === 'string' ? '' : milestones[index].description || '';
        const documentType = typeof milestones[index] === 'string' ? title.toLowerCase().replace(/\s+/g, '_') : milestones[index].document_type || milestones[index].documentType || '';
        const instructions = typeof milestones[index] === 'string' ? '' : milestones[index].instructions || '';
        const maxMarks = Number(typeof milestones[index] === 'string' ? 10 : milestones[index].max_marks || milestones[index].maxMarks || 10);
        const deadline = new Date(baseDate);
        deadline.setDate(baseDate.getDate() + intervalDays * (index + 1));

        if (!title) {
          throw new Error('Milestone title is required');
        }

        const result = await client.query(
          `INSERT INTO project_milestones (project_id, title, description, document_type, instructions, max_marks, sequence_order, deadline, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [project_id, title, description, documentType, instructions, maxMarks, index + 1, deadline.toISOString(), req.user.id]
        );
        created.push(result.rows[0]);
      }

      const registration = await getProjectRegistrationForProject(project_id, client);
      if (registration?.project_registration_id) {
        const values = created.flatMap((milestone) => [
          registration.project_registration_id,
          project_id,
          milestone.title,
          'milestone_deadline',
          milestone.deadline,
          'team',
          req.user.id
        ]);
        const placeholders = created.map((_, index) => {
          const offset = index * 7;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
        }).join(', ');
        if (placeholders) {
          await client.query(`
            INSERT INTO calendar_events
            (project_registration_id, project_id, title, event_type, event_date, audience, created_by)
            VALUES ${placeholders}
          `, values);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.status(201).json({ success: true, project, milestones: created });
  } catch (error) {
    console.error('createTimeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStudentTimeline = async (req, res) => {
  try {
    await ensureMilestoneTables();
    const project = await getAccessibleProject(req.query.projectId, req.user);

    if (!project) {
      return res.json({ project: null, milestones: [] });
    }

    const [milestones] = await db.execute(
      `SELECT pm.*,
              ms.id as submission_id,
              ms.file_name,
              ms.file_path,
              ms.file_url,
              ms.status as submission_status,
              ms.is_late,
              ms.submitted_at,
              CASE
                WHEN ms.id IS NOT NULL AND ms.is_late = TRUE THEN 'Late'
                WHEN ms.id IS NOT NULL THEN 'Submitted'
                WHEN pm.deadline < CURRENT_TIMESTAMP THEN 'Late'
                ELSE 'Pending'
              END as timeline_status
       FROM project_milestones pm
       LEFT JOIN milestone_submissions ms
         ON ms.milestone_id = pm.id AND ms.submitted_by = ?
       WHERE pm.project_id = ?
       ORDER BY pm.sequence_order ASC`,
      [req.user.id, project.id]
    );

    res.json({ project, milestones });
  } catch (error) {
    console.error('getStudentTimeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjectTimeline = async (req, res) => {
  try {
    await ensureMilestoneTables();
    const project = await getAccessibleProject(req.params.projectId, req.user);

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not accessible' });
    }

    const [milestones] = await db.execute(
      `SELECT pm.*,
              COUNT(ms.id) as submissions_count,
              COUNT(ms.id) FILTER (WHERE ms.is_late = TRUE) as late_count
       FROM project_milestones pm
       LEFT JOIN milestone_submissions ms ON ms.milestone_id = pm.id
       WHERE pm.project_id = ?
       GROUP BY pm.id
       ORDER BY pm.sequence_order ASC`,
      [project.id]
    );

    res.json({ project, milestones });
  } catch (error) {
    console.error('getProjectTimeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitMilestone = async (req, res) => {
  const { milestoneId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'A file is required' });
  }

  try {
    await ensureMilestoneTables();

    const [milestones] = await db.execute(
      `SELECT pm.*, p.title as project_title
       FROM project_milestones pm
       JOIN projects p ON pm.project_id = p.id
       JOIN project_members member ON member.project_id = p.id
       WHERE pm.id = ? AND member.student_id = ?`,
      [milestoneId, req.user.id]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ message: 'Milestone not found or not accessible' });
    }

    const milestone = milestones[0];
    const isLate = new Date() > new Date(milestone.deadline);
    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;

    const result = await db.pool.query(
      `INSERT INTO milestone_submissions
       (milestone_id, project_id, submitted_by, file_name, file_path, file_url, status, is_late, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, 'Submitted', $7, $8)
       ON CONFLICT (milestone_id, submitted_by)
       DO UPDATE SET
         file_name = EXCLUDED.file_name,
         file_path = EXCLUDED.file_path,
         file_url = EXCLUDED.file_url,
         status = 'Submitted',
         is_late = EXCLUDED.is_late,
         remarks = EXCLUDED.remarks,
         submitted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        milestoneId,
        milestone.project_id,
        req.user.id,
        req.file.originalname,
        req.file.filename,
        fileUrl,
        isLate,
        req.body.remarks || ''
      ]
    );

    await recordDocumentVersion(result.rows[0]);
    await recordMilestoneSubmissionScore(result.rows[0]);

    res.status(201).json({
      success: true,
      status: isLate ? 'Late' : 'Submitted',
      submission: result.rows[0]
    });
  } catch (error) {
    console.error('submitMilestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reviewMilestoneSubmission = async (req, res) => {
  const { id } = req.params;
  const { review_status, feedback, marks = 0 } = req.body;
  const allowedStatuses = new Set(['submitted', 'approved', 'rejected', 'needs_revision']);
  const normalizedStatus = String(review_status || 'approved').toLowerCase();

  if (!allowedStatuses.has(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid review status' });
  }

  try {
    await ensureMilestoneTables();
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const submissionResult = await client.query(`
        SELECT ms.*,
               pm.project_id,
               p.registration_id as project_registration_id
        FROM milestone_submissions ms
        JOIN project_milestones pm ON pm.id = ms.milestone_id
        JOIN projects p ON p.id = pm.project_id
        JOIN mentor_assignments ma ON ma.project_id = p.id
        WHERE ms.id = $1
          AND ma.mentor_id = $2
        LIMIT 1
      `, [id, req.user.id]);

      if (submissionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Submission not found or not assigned to this mentor' });
      }

      const submission = submissionResult.rows[0];
      const registration = submission.project_registration_id
        ? { project_registration_id: submission.project_registration_id }
        : await getProjectRegistrationForProject(submission.project_id, client);

      const boundedMarks = Math.max(0, Math.min(Number(marks) || 0, 10));
      const statusLabel = {
        submitted: 'Submitted',
        approved: 'Approved',
        rejected: 'Rejected',
        needs_revision: 'Needs Work'
      }[normalizedStatus];
      const updatedResult = await client.query(`
        UPDATE milestone_submissions
        SET review_status = $1,
            status = $2,
            feedback = $3,
            marks = $4,
            remarks = COALESCE($3, remarks)
        WHERE id = $5
        RETURNING *
      `, [normalizedStatus, statusLabel, feedback || null, boundedMarks, id]);

      await client.query(`
        INSERT INTO mentor_reviews
        (submission_id, milestone_submission_id, project_registration_id, mentor_id, status, remarks, comments, quality_marks, feedback, marks, review_status, updated_at)
        VALUES ($1, $1, $2, $3, $4, $5, $5, $6, $5, $6, $7, NOW())
      `, [id, registration?.project_registration_id, req.user.id, statusLabel, feedback || '', boundedMarks, normalizedStatus]);

      await client.query(`
        UPDATE milestone_scores
        SET mentor_marks = $1,
            total_marks = timeliness_marks + documentation_marks + $1,
            updated_at = NOW()
        WHERE milestone_submission_id = $2
      `, [boundedMarks, id]);

      if (registration?.project_registration_id) {
        await recalculateProjectScores(registration.project_registration_id, client);
      }

      await client.query('COMMIT');

      if (registration?.project_registration_id) {
        await notifyProjectTeam({
          projectRegistrationId: registration.project_registration_id,
          title: 'Milestone Reviewed',
          message: `Mentor reviewed a milestone submission: ${normalizedStatus}.`,
          type: 'mentor_review',
          referenceId: Number(id),
          referenceType: 'milestone_submission'
        });
      }

      res.json({ success: true, submission: updatedResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('reviewMilestoneSubmission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
