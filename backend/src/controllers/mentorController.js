const db = require('../config/db');
const {
  ensureAdvancedWorkflowTables,
  recalculateProjectScores,
  notifyProjectTeam,
  getProjectRegistrationForProject
} = require('../utils/advancedProjectWorkflow');

const ALLOWED_TEMPLATE_EXTENSIONS = new Set([
  'doc',
  'docx',
  'ppt',
  'pptx',
  'pdf',
  'xlsx',
  'zip',
  'png',
  'jpg',
  'jpeg',
  'mp4',
  'txt'
]);

const getFileExtension = (fileName = '') => String(fileName).split('.').pop().toLowerCase();

const templateFileAllowed = (file) => file && ALLOWED_TEMPLATE_EXTENSIONS.has(getFileExtension(file.originalname));
const getUploadedTemplateFile = (req) => (
  req.file
  || req.files?.template_file?.[0]
  || req.files?.file?.[0]
  || null
);
const storedTemplatePath = (file) => file ? `templates/${file.filename}` : null;

const getAssignedProjectAccess = async (projectIdentifier, mentorId) => {
  const result = await db.pool.query(`
    SELECT p.*,
           COALESCE(p.registration_id, ma.registration_id) AS project_registration_id,
           ma.submission_id
    FROM mentor_assignments ma
    JOIN projects p
      ON p.id = ma.project_id
      OR p.registration_id = ma.registration_id
    WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = $2
      AND (
        p.id = $1
        OR ma.project_id = $1
        OR p.registration_id = $1
        OR ma.registration_id = $1
      )
    LIMIT 1
  `, [projectIdentifier, mentorId]);
  return result.rows[0] || null;
};

const getAssignedTemplateAccess = async (templateId, mentorId) => {
  const result = await db.pool.query(`
    SELECT dt.*,
           p.id AS project_id,
           COALESCE(dt.project_registration_id, pm.project_registration_id, p.registration_id, ma.registration_id) AS resolved_registration_id
    FROM document_templates dt
    LEFT JOIN project_milestones pm ON pm.id = dt.project_milestone_id
    LEFT JOIN projects p ON p.id = pm.project_id OR p.registration_id = dt.project_registration_id
    JOIN mentor_assignments ma
      ON COALESCE(ma.mentor_user_id, ma.mentor_id) = $2
     AND (ma.project_id = p.id OR ma.registration_id = dt.project_registration_id OR ma.registration_id = pm.project_registration_id)
    WHERE dt.id = $1
    LIMIT 1
  `, [templateId, mentorId]);
  return result.rows[0] || null;
};

const ensureTemplateMilestone = async ({
  projectId,
  projectRegistrationId,
  mentorId,
  documentName,
  documentType,
  deadline,
  maxMarks,
  instructions
}) => {
  const existing = await db.pool.query(`
    SELECT id
    FROM project_milestones
    WHERE project_id = $1
      AND LOWER(COALESCE(document_type, title)) = LOWER($2)
    ORDER BY id DESC
    LIMIT 1
  `, [projectId, documentType || documentName]);

  if (existing.rows[0]?.id) {
    await db.pool.query(`
      UPDATE project_milestones
      SET title = $2,
          document_type = $3,
          project_registration_id = COALESCE(project_registration_id, $4),
          deadline = COALESCE($5, deadline),
          max_marks = COALESCE($6, max_marks),
          instructions = COALESCE($7, instructions),
          updated_at = NOW()
      WHERE id = $1
    `, [
      existing.rows[0].id,
      documentName,
      documentType,
      projectRegistrationId || null,
      deadline || null,
      Number(maxMarks) || null,
      instructions || null
    ]);
    return existing.rows[0].id;
  }

  const sequenceResult = await db.pool.query(
    `SELECT COALESCE(MAX(COALESCE(sequence_no, sequence_order)), 0) + 1 AS next_sequence FROM project_milestones WHERE project_id = $1`,
    [projectId]
  );
  const fallbackDeadline = deadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const inserted = await db.pool.query(`
    INSERT INTO project_milestones
    (project_id, project_registration_id, title, document_type, instructions, max_marks, sequence_no, sequence_order, deadline, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, 'published', $9)
    RETURNING id
  `, [
    projectId,
    projectRegistrationId || null,
    documentName,
    documentType,
    instructions || '',
    Number(maxMarks) || 10,
    sequenceResult.rows[0].next_sequence,
    fallbackDeadline,
    mentorId
  ]);
  return inserted.rows[0].id;
};

const ensureTasksTable = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(100) DEFAULT 'Requirements',
      priority VARCHAR(20) DEFAULT 'Medium',
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      members JSONB DEFAULT '[]'::jsonb,
      comments INT DEFAULT 0,
      attachments INT DEFAULT 0,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureMentorAllocationTables = async (client = db.pool) => {
  const query = (sql, params = []) => client.query(sql, params);

  // Ensure projects table has academic cohort columns
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`);
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS semester INT`);
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20)`);

  // Ensure students table has academic cohort & mentor columns
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS year INT`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS branch VARCHAR(100)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mentor_id INT REFERENCES users(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mentor_name VARCHAR(150)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mentor_email VARCHAR(150)`);
  await query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  // Initialize seed students with section/subsection to match cohort queries
  await query(`UPDATE students SET section = COALESCE(section, '1'), subsection = COALESCE(subsection, '1') WHERE semester = 6`);
  await query(`UPDATE students SET year = CEIL(semester::numeric / 2)::int WHERE year IS NULL AND semester IS NOT NULL`);

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
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_allocations_unique_cohort
    ON mentor_allocations (academic_year, semester, UPPER(section), UPPER(subsection))
  `);
};

// @desc    Get mentor dashboard stats
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor)
exports.getMentorStats = async (req, res) => {
  try {
    await ensureTasksTable();
    await ensureMentorAllocationTables();
    const mentorId = req.user.id;

    // Count assigned projects
    const [assigned] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM projects p
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = ?`,
      [mentorId]
    );

    // Count pending reviews (tasks in 'Review' status for projects mentored by this user)
    const [pending] = await db.execute(
      `SELECT COUNT(*) as count
       FROM milestone_submissions ms
       JOIN projects p ON p.id = ms.project_id
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = ?
         AND COALESCE(ms.review_status, LOWER(ms.status)) = 'submitted'`,
      [mentorId]
    );

    // Count completed projects
    const [completed] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM projects p
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = ? AND p.status = 'Completed'`,
      [mentorId]
    );

    const [late] = await db.execute(
      `SELECT COUNT(*) as count
       FROM milestone_submissions ms
       JOIN projects p ON p.id = ms.project_id
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = ? AND ms.is_late = TRUE`,
      [mentorId]
    );

    const [average] = await db.execute(
      `SELECT ROUND(COALESCE(AVG(ps.total_marks), 0), 2) as average_marks
       FROM project_scores ps
       JOIN mentor_assignments ma ON ma.registration_id = ps.project_registration_id
       WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = ?`,
      [mentorId]
    );

    const allocatedStudents = await db.pool.query(`
      SELECT COUNT(DISTINCT s.user_id)::int AS count
      FROM mentor_allocations ma
      JOIN students s
        ON s.semester = ma.semester
       AND (ma.year IS NULL OR COALESCE(s.year, CEIL(s.semester::numeric / 2)::int) = ma.year)
       AND (ma.academic_year = '' OR COALESCE(s.academic_year, '') = '' OR s.academic_year = ma.academic_year)
       AND (ma.section = 'ALL' OR UPPER(COALESCE(s.section, '')) = UPPER(ma.section))
       AND (ma.subsection = 'ALL' OR UPPER(COALESCE(s.subsection, '')) = UPPER(ma.subsection))
      WHERE ma.mentor_id = $1
    `, [mentorId]);

    res.json({
      assigned: parseInt(assigned[0].count || 0, 10),
      pending: parseInt(pending[0].count || 0, 10),
      completed: parseInt(completed[0].count || 0, 10),
      lateSubmissions: parseInt(late[0].count || 0, 10),
      averageMarks: average[0].average_marks || 0,
      allocatedStudents: allocatedStudents.rows[0]?.count || 0,
      feedback: parseInt(pending[0].count || 0, 10)
    });
  } catch (error) {
    console.error('getMentorStats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllocatedStudents = async (req, res) => {
  try {
    await ensureMentorAllocationTables();
    const mentorId = req.user.id;

    const result = await db.pool.query(`
      SELECT DISTINCT
             u.id,
             u.full_name,
             u.email,
             u.mobile_number,
             u.is_active,
             s.roll_number,
             s.year,
             s.academic_year,
             s.semester,
             s.section,
             s.subsection,
             s.mentor_name,
             s.mentor_email,
             b.name AS branch_name,
             COALESCE(b.name, s.branch, s.department) AS department,
             COALESCE(p.title, pr.title, rfs.project_title) AS project_title,
             ma.id AS allocation_id,
             ma.year AS allocation_year,
             ma.academic_year AS allocation_academic_year,
             ma.created_at AS allocated_at,
             0 AS score
      FROM mentor_allocations ma
      JOIN students s
        ON s.semester = ma.semester
       AND (ma.year IS NULL OR COALESCE(s.year, CEIL(s.semester::numeric / 2)::int) = ma.year)
       AND (ma.academic_year = '' OR COALESCE(s.academic_year, '') = '' OR s.academic_year = ma.academic_year)
       AND (ma.section = 'ALL' OR UPPER(COALESCE(s.section, '')) = UPPER(ma.section))
       AND (ma.subsection = 'ALL' OR UPPER(COALESCE(s.subsection, '')) = UPPER(ma.subsection))
      JOIN users u ON u.id = s.user_id
      LEFT JOIN branches b ON b.id = s.branch_id
      LEFT JOIN project_team_members ptm ON COALESCE(ptm.user_id, ptm.student_id, ptm.student_user_id) = u.id
      LEFT JOIN project_registrations pr ON pr.id = ptm.project_registration_id
      LEFT JOIN registration_form_submissions rfs ON rfs.id = ptm.submission_id
      LEFT JOIN projects p ON p.registration_id = pr.id OR p.created_by = u.id
      WHERE ma.mentor_id = $1
        AND u.role = 'student'
        AND u.is_active = TRUE
        AND (s.academic_year >= '2025-26' OR s.academic_year IS NULL)
      ORDER BY u.full_name ASC
    `, [mentorId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('getAllocatedStudents error:', {
      message: error.message,
      stack: error.stack,
      mentorId: req.user?.id
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get review queue for mentor
// @route   GET /api/mentor/reviews
// @access  Private (Mentor)
exports.getReviewQueue = async (req, res) => {
  try {
    await ensureTasksTable();
    const mentorId = req.user.id;
    const [tasks] = await db.execute(
      `SELECT t.*, p.title as project_title, p.team_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.mentor_id = ? AND t.status = 'Review'
       ORDER BY t.updated_at DESC`,
      [mentorId]
    );
    res.json(tasks);
  } catch (error) {
    console.error('getReviewQueue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAssignedProjects = async (req, res) => {
  try {
    await ensureAdvancedWorkflowTables();
    await ensureMentorAllocationTables();
    const result = await db.pool.query(`
      SELECT p.id,
             p.registration_id AS project_registration_id,
             rfs.id AS submission_id,
             p.title AS project_title,
             p.title,
             COALESCE(p.status, pr.status, rfs.status, 'Approved') AS status,
             p.type,
             COALESCE(p.team_name, p.title) AS team_name,
             COALESCE(p.progress_percent, 0) AS progress_percent,
             COALESCE(p.progress_percent, 0) AS progress,
             p.academic_year,
             CEIL(p.semester::numeric / 2)::int AS year,
             p.semester,
             p.section,
             p.subsection,
             ps.total_marks,
             leader.full_name AS team_leader,
             COALESCE(rfs.status, pr.status, p.status, 'Pending') AS submission_status,
             COALESCE(pr.status, p.status, rfs.status, 'Pending') AS approval_status,
             COALESCE(rfs.remarks, '') AS mentor_remarks,
             COALESCE(
               jsonb_agg(
                 DISTINCT jsonb_build_object(
                   'id', COALESCE(u.id, ptm.user_id, ptm.student_id, ptm.student_user_id),
                   'full_name', COALESCE(u.full_name, ptm.full_name),
                   'email', COALESCE(u.email, ptm.email),
                   'mobile_number', u.mobile_number,
                   'department', COALESCE(b.name, s.branch, s.department),
                   'roll_number', ptm.roll_number,
                   'role', ptm.role,
                   'is_leader', COALESCE(ptm.is_leader, ptm.is_team_leader, false)
                 )
               ) FILTER (WHERE COALESCE(u.id, ptm.user_id, ptm.student_id, ptm.student_user_id) IS NOT NULL),
               '[]'::jsonb
             ) AS team_members,
             COUNT(DISTINCT ms.id) FILTER (WHERE COALESCE(ms.review_status, ms.status) = 'submitted') AS pending_reviews,
             COUNT(DISTINCT ms.id) FILTER (WHERE ms.is_late = TRUE) AS late_submissions
      FROM mentor_allocations ma
      JOIN projects p
        ON p.mentor_id = ma.mentor_id
       AND p.semester = ma.semester
       AND (ma.year IS NULL OR CEIL(p.semester::numeric / 2)::int = ma.year)
       AND (ma.academic_year = '' OR COALESCE(p.academic_year, '') = '' OR p.academic_year = ma.academic_year)
       AND (ma.section = 'ALL' OR UPPER(COALESCE(p.section, '')) = UPPER(ma.section))
       AND (ma.subsection = 'ALL' OR UPPER(COALESCE(p.subsection, '')) = UPPER(ma.subsection))
      LEFT JOIN project_registrations pr ON pr.id = p.registration_id
      LEFT JOIN registration_form_submissions rfs
        ON rfs.project_title = p.title
       AND rfs.leader_id = p.created_by
      LEFT JOIN project_scores ps ON ps.project_registration_id = p.registration_id
      LEFT JOIN project_team_members ptm
        ON ptm.project_registration_id = p.registration_id
        OR ptm.submission_id = rfs.id
      LEFT JOIN users u ON u.id = COALESCE(ptm.user_id, ptm.student_id, ptm.student_user_id)
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN branches b ON b.id = s.branch_id
      LEFT JOIN users leader ON leader.id = p.created_by
      LEFT JOIN milestone_submissions ms
        ON ms.project_registration_id = p.registration_id
        OR ms.project_id = p.id
      WHERE ma.mentor_id = $1
      GROUP BY p.id, p.registration_id, rfs.id, pr.status, rfs.status, rfs.remarks, ps.total_marks, leader.full_name
      ORDER BY MAX(COALESCE(p.updated_at, p.created_at, pr.created_at, rfs.submitted_at, NOW())) DESC
    `, [req.user.id]);
    res.json({ success: true, projects: result.rows, teams: result.rows, data: result.rows });
  } catch (error) {
    console.error('getAssignedProjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMentorMilestones = async (req, res) => {
  const { project_id, project_registration_id, start_date, interval_days = 15, milestones } = req.body;
  let resolvedProjectId = project_id;
  if (!resolvedProjectId && project_registration_id) {
    const projectResult = await db.pool.query(
      `SELECT id FROM projects WHERE registration_id = $1 ORDER BY id DESC LIMIT 1`,
      [project_registration_id]
    );
    resolvedProjectId = projectResult.rows[0]?.id;
  }
  req.body = {
    project_id: resolvedProjectId,
    start_date,
    interval_days,
    milestones: milestones || [
      { title: 'Synopsis', document_type: 'synopsis', max_marks: 10 },
      { title: 'SRS', document_type: 'srs', max_marks: 10 },
      { title: 'PPT', document_type: 'ppt', max_marks: 10 },
      { title: 'Poster', document_type: 'poster', max_marks: 10 },
      { title: 'Project Report', document_type: 'report', max_marks: 10 },
      { title: 'Final Demo', document_type: 'demo', max_marks: 10 },
    ],
  };
  return require('./milestoneController').createTimeline(req, res);
};

exports.updateMentorMilestone = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    document_type,
    deadline,
    max_marks,
    instructions,
    allowed_formats,
    status
  } = req.body;

  try {
    await ensureAdvancedWorkflowTables();
    const access = await db.pool.query(`
      SELECT pm.*, COALESCE(pm.project_registration_id, p.registration_id) AS resolved_registration_id
      FROM project_milestones pm
      JOIN projects p ON p.id = pm.project_id
      JOIN mentor_assignments ma ON ma.project_id = p.id
      WHERE pm.id = $1 AND COALESCE(ma.mentor_user_id, ma.mentor_id) = $2
      LIMIT 1
    `, [id, req.user.id]);

    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Milestone not found or not assigned to this mentor' });
    }

    const allowedFields = {
      title,
      document_type,
      deadline,
      max_marks,
      instructions,
      allowed_formats,
      status
    };
    const entries = Object.entries(allowedFields).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const fields = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const values = entries.map(([, value]) => value);
    values.push(id);
    const result = await db.pool.query(`
      UPDATE project_milestones
      SET ${fields}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);

    const registrationId = access.rows[0].resolved_registration_id;
    if (registrationId) {
      await notifyProjectTeam({
        projectRegistrationId: registrationId,
        title: deadline ? 'Document Deadline Updated' : 'Document Milestone Updated',
        message: deadline
          ? `Mentor changed the deadline for ${result.rows[0].title}.`
          : `Mentor updated ${result.rows[0].title}.`,
        type: deadline ? 'deadline_updated' : 'project_timeline_updated',
        referenceId: Number(id),
        referenceType: 'project_milestone'
      });
    }

    res.json({ success: true, milestone: result.rows[0] });
  } catch (error) {
    console.error('updateMentorMilestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.uploadMilestoneTemplate = async (req, res) => {
  const {
    project_id,
    project_registration_id,
    project_milestone_id,
    document_name,
    document_type,
    deadline,
    max_marks,
    instructions,
    is_published
  } = req.body;
  const templateFile = getUploadedTemplateFile(req);

  if (!templateFile) {
    return res.status(400).json({ message: 'Template file is required' });
  }
  if (!templateFileAllowed(templateFile)) {
    return res.status(400).json({ message: 'Unsupported template file type' });
  }

  try {
    await ensureAdvancedWorkflowTables();
    let project = null;
    let milestone = null;

    if (project_milestone_id) {
      const milestoneResult = await db.pool.query(`
        SELECT pm.*, p.id AS project_id, COALESCE(pm.project_registration_id, p.registration_id, ma.registration_id) AS project_registration_id
        FROM project_milestones pm
        JOIN projects p ON p.id = pm.project_id
        JOIN mentor_assignments ma ON ma.project_id = p.id
        WHERE pm.id = $1 AND COALESCE(ma.mentor_user_id, ma.mentor_id) = $2
        LIMIT 1
      `, [project_milestone_id, req.user.id]);
      milestone = milestoneResult.rows[0] || null;
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found or not assigned to this mentor' });
      }
      project = { id: milestone.project_id, project_registration_id: milestone.project_registration_id };
    } else {
      project = await getAssignedProjectAccess(project_registration_id || project_id, req.user.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found or not assigned to this mentor' });
      }
    }

    const finalDocumentName = document_name || milestone?.title || templateFile.originalname;
    const finalDocumentType = document_type || milestone?.document_type || finalDocumentName;
    const finalDeadline = deadline || milestone?.deadline || null;
    const finalMaxMarks = Number(max_marks || milestone?.max_marks || 10);
    const finalInstructions = instructions || milestone?.instructions || '';
    const milestoneId = project_milestone_id || await ensureTemplateMilestone({
      projectId: project.id,
      projectRegistrationId: project.project_registration_id,
      mentorId: req.user.id,
      documentName: finalDocumentName,
      documentType: finalDocumentType,
      deadline: finalDeadline,
      maxMarks: finalMaxMarks,
      instructions: finalInstructions
    });
    const fileType = getFileExtension(templateFile.originalname);
    const published = is_published === undefined ? true : String(is_published || '').toLowerCase() === 'true';

    const result = await db.pool.query(`
      INSERT INTO document_templates
      (project_milestone_id, project_registration_id, mentor_id, mentor_user_id, document_name, document_type, template_name, file_name, file_path, file_type, mime_type, deadline, max_marks, instructions, is_published, allowed_formats, updated_at)
      VALUES ($1, $2, $3, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *
    `, [
      milestoneId,
      project.project_registration_id || null,
      req.user.id,
      finalDocumentName,
      finalDocumentType,
      templateFile.originalname,
      storedTemplatePath(templateFile),
      fileType,
      templateFile.mimetype,
      finalDeadline,
      finalMaxMarks,
      finalInstructions,
      published,
      [...ALLOWED_TEMPLATE_EXTENSIONS].join(',')
    ]);

    await db.pool.query(`
      UPDATE project_milestones
      SET title = $2,
          document_type = $3,
          deadline = COALESCE($4, deadline),
          max_marks = $5,
          instructions = $6,
          updated_at = NOW()
      WHERE id = $1
    `, [milestoneId, finalDocumentName, finalDocumentType, finalDeadline, finalMaxMarks, finalInstructions]);

    if (project.project_registration_id) {
      await notifyProjectTeam({
        projectRegistrationId: project.project_registration_id,
        title: published ? 'Document Template Published' : 'Document Template Uploaded',
        message: `Mentor uploaded ${finalDocumentName}.`,
        type: 'document_template',
        referenceId: result.rows[0].id,
        referenceType: 'document_template'
      });
    }

    res.status(201).json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('uploadMilestoneTemplate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjectSubmissions = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureAdvancedWorkflowTables();
    const access = await db.pool.query(`
      SELECT p.*, COALESCE(p.registration_id, ma.registration_id) AS project_registration_id
      FROM projects p
      JOIN mentor_assignments ma ON ma.project_id = p.id
      WHERE p.id = $1 AND COALESCE(ma.mentor_user_id, ma.mentor_id) = $2
      LIMIT 1
    `, [id, req.user.id]);

    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found or not assigned to this mentor' });
    }

    const submissions = await db.pool.query(`
      SELECT pm.id AS milestone_id,
             pm.title,
             pm.document_type,
             pm.deadline,
             pm.max_marks,
             pm.instructions,
             pm.allowed_formats,
             dt.id AS template_id,
             dt.template_name,
             dt.file_path AS template_file_path,
             dt.file_type AS template_file_type,
             ms.id AS submission_id,
             ms.file_name,
             ms.file_path,
             ms.file_url,
             ms.version_no,
             ms.status,
             ms.review_status,
             ms.feedback,
             ms.marks,
             ms.is_late,
             ms.submitted_at,
             u.full_name AS submitted_by_name,
             u.email AS submitted_by_email
      FROM project_milestones pm
      LEFT JOIN LATERAL (
        SELECT *
        FROM document_templates
        WHERE project_milestone_id = pm.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) dt ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM milestone_submissions
        WHERE milestone_id = pm.id
        ORDER BY submitted_at DESC, id DESC
        LIMIT 1
      ) ms ON TRUE
      LEFT JOIN users u ON u.id = ms.submitted_by
      WHERE pm.project_id = $1
      ORDER BY pm.sequence_order ASC, pm.deadline ASC
    `, [id]);

    res.json({ success: true, project: access.rows[0], submissions: submissions.rows });
  } catch (error) {
    console.error('getProjectSubmissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProjectTemplates = async (req, res) => {
  try {
    await ensureAdvancedWorkflowTables();
    const project = await getAssignedProjectAccess(req.params.projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found or not assigned to this mentor' });
    }

    const templates = await db.pool.query(`
      SELECT dt.*,
             pm.project_id,
             pm.title AS milestone_title,
             COALESCE(pm.sequence_no, pm.sequence_order) AS sequence_no,
             ('/uploads/' || dt.file_path) AS file_url
      FROM document_templates dt
      LEFT JOIN project_milestones pm ON pm.id = dt.project_milestone_id
      WHERE (pm.project_id = $1 OR dt.project_registration_id = $2)
        AND COALESCE(dt.mentor_user_id, dt.mentor_id) = $3
      ORDER BY COALESCE(pm.sequence_no, pm.sequence_order, dt.id) ASC, dt.updated_at DESC, dt.created_at DESC
    `, [project.id, project.project_registration_id || null, req.user.id]);

    res.json({ success: true, project, templates: templates.rows });
  } catch (error) {
    console.error('getProjectTemplates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProjectTemplate = async (req, res) => {
  const { id } = req.params;
  const {
    document_name,
    document_type,
    deadline,
    max_marks,
    instructions,
    is_published
  } = req.body;

  try {
    await ensureAdvancedWorkflowTables();
    const template = await getAssignedTemplateAccess(id, req.user.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found or not assigned to this mentor' });
    }
    const templateFile = getUploadedTemplateFile(req);
    if (templateFile && !templateFileAllowed(templateFile)) {
      return res.status(400).json({ message: 'Unsupported template file type' });
    }

    const updates = {
      document_name,
      document_type,
      deadline,
      max_marks: max_marks === undefined ? undefined : Number(max_marks) || 10,
      instructions,
      is_published: is_published === undefined ? undefined : String(is_published).toLowerCase() === 'true'
    };

    if (templateFile) {
      updates.template_name = templateFile.originalname;
      updates.file_name = templateFile.originalname;
      updates.file_path = storedTemplatePath(templateFile);
      updates.file_type = getFileExtension(templateFile.originalname);
      updates.mime_type = templateFile.mimetype;
    }

    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const fields = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const values = entries.map(([, value]) => value);
    values.push(id);
    const result = await db.pool.query(`
      UPDATE document_templates
      SET ${fields}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);

    if (template.project_milestone_id) {
      await db.pool.query(`
        UPDATE project_milestones
        SET title = COALESCE($2, title),
            document_type = COALESCE($3, document_type),
            deadline = COALESCE($4, deadline),
            max_marks = COALESCE($5, max_marks),
            instructions = COALESCE($6, instructions),
            updated_at = NOW()
        WHERE id = $1
      `, [
        template.project_milestone_id,
        document_name || null,
        document_type || null,
        deadline || null,
        max_marks === undefined ? null : Number(max_marks) || 10,
        instructions || null
      ]);
    }

    if (template.resolved_registration_id) {
      await notifyProjectTeam({
        projectRegistrationId: template.resolved_registration_id,
        title: result.rows[0].is_published ? 'Document Template Published' : 'Document Template Updated',
        message: `Mentor updated ${result.rows[0].document_name || result.rows[0].template_name}.`,
        type: 'document_template',
        referenceId: result.rows[0].id,
        referenceType: 'document_template'
      });
    }

    res.json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('updateProjectTemplate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProjectTemplate = async (req, res) => {
  try {
    await ensureAdvancedWorkflowTables();
    const template = await getAssignedTemplateAccess(req.params.id, req.user.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found or not assigned to this mentor' });
    }

    await db.pool.query('DELETE FROM document_templates WHERE id = $1', [req.params.id]);

    if (template.resolved_registration_id) {
      await notifyProjectTeam({
        projectRegistrationId: template.resolved_registration_id,
        title: 'Document Template Removed',
        message: `Mentor removed ${template.document_name || template.template_name}.`,
        type: 'document_template',
        referenceId: Number(req.params.id),
        referenceType: 'document_template'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('deleteProjectTemplate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.upsertContribution = async (req, res) => {
  const { project_registration_id, student_user_id, task_title, contribution_percent, remarks } = req.body;
  const contribution = Math.max(0, Math.min(Number(contribution_percent) || 0, 150));

  if (!project_registration_id || !student_user_id) {
    return res.status(400).json({ message: 'project_registration_id and student_user_id are required' });
  }

  try {
    await ensureAdvancedWorkflowTables();
    const assignment = await db.pool.query(`
      SELECT 1
      FROM mentor_assignments
      WHERE COALESCE(mentor_user_id, mentor_id) = $1 AND registration_id = $2
      LIMIT 1
    `, [req.user.id, project_registration_id]);

    if (assignment.rows.length === 0) {
      return res.status(403).json({ message: 'Project is not assigned to this mentor' });
    }

    const result = await db.pool.query(`
      INSERT INTO student_contributions
      (project_registration_id, student_user_id, task_title, contribution_percent, remarks)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [project_registration_id, student_user_id, task_title || 'Overall Contribution', contribution, remarks || '']);

    await recalculateProjectScores(project_registration_id);
    res.status(201).json({ success: true, contribution: result.rows[0] });
  } catch (error) {
    console.error('upsertContribution error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMeetingLog = async (req, res) => {
  const { project_registration_id, meeting_date, agenda, remarks, attendance_json = [] } = req.body;

  if (!project_registration_id || !meeting_date) {
    return res.status(400).json({ message: 'project_registration_id and meeting_date are required' });
  }

  try {
    await ensureAdvancedWorkflowTables();
    const assignment = await db.pool.query(`
      SELECT 1
      FROM mentor_assignments
      WHERE COALESCE(mentor_user_id, mentor_id) = $1 AND registration_id = $2
      LIMIT 1
    `, [req.user.id, project_registration_id]);

    if (assignment.rows.length === 0) {
      return res.status(403).json({ message: 'Project is not assigned to this mentor' });
    }

    const result = await db.pool.query(`
      INSERT INTO meeting_logs
      (project_registration_id, mentor_id, meeting_date, agenda, remarks, attendance_json)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [project_registration_id, req.user.id, meeting_date, agenda || '', remarks || '', JSON.stringify(attendance_json)]);

    await db.pool.query(`
      INSERT INTO calendar_events
      (project_registration_id, title, event_type, event_date, audience, created_by)
      VALUES ($1, $2, 'mentor_meeting', $3, 'team', $4)
    `, [project_registration_id, agenda || 'Mentor Meeting', meeting_date, req.user.id]);

    await notifyProjectTeam({
      projectRegistrationId: project_registration_id,
      title: 'Mentor Meeting Scheduled',
      message: 'A mentor meeting has been added to your project calendar.',
      type: 'meeting_log',
      referenceId: result.rows[0].id,
      referenceType: 'meeting_log'
    });

    res.status(201).json({ success: true, meeting: result.rows[0] });
  } catch (error) {
    console.error('createMeetingLog error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDocumentVersions = async (req, res) => {
  try {
    await ensureAdvancedWorkflowTables();
    const { id } = req.params;
    const access = await db.pool.query(`
      SELECT 1
      FROM milestone_submissions ms
      JOIN projects p ON p.id = ms.project_id
      JOIN mentor_assignments ma ON ma.project_id = p.id
      WHERE ms.id = $1 AND COALESCE(ma.mentor_user_id, ma.mentor_id) = $2
      LIMIT 1
    `, [id, req.user.id]);

    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found or not assigned to this mentor' });
    }

    const versions = await db.pool.query(`
      SELECT dv.*,
             u.full_name as uploaded_by_name,
             u.email as uploaded_by_email
      FROM document_versions dv
      LEFT JOIN users u ON u.id = dv.uploaded_by
      WHERE dv.milestone_submission_id = $1
      ORDER BY dv.version_no DESC
    `, [id]);

    res.json({ success: true, versions: versions.rows });
  } catch (error) {
    console.error('getDocumentVersions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
