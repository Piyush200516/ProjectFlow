const db = require('../config/db');
const {
  ensureAdvancedWorkflowTables,
  recalculateProjectScores,
  notifyProjectTeam
} = require('../utils/advancedProjectWorkflow');

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

// @desc    Get mentor dashboard stats
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor)
exports.getMentorStats = async (req, res) => {
  try {
    await ensureTasksTable();
    const mentorId = req.user.id;

    // Count assigned projects
    const [assigned] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM projects p
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE ma.mentor_id = ?`,
      [mentorId]
    );

    // Count pending reviews (tasks in 'Review' status for projects mentored by this user)
    const [pending] = await db.execute(
      `SELECT COUNT(*) as count
       FROM milestone_submissions ms
       JOIN projects p ON p.id = ms.project_id
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE ma.mentor_id = ?
         AND COALESCE(ms.review_status, LOWER(ms.status)) = 'submitted'`,
      [mentorId]
    );

    // Count completed projects
    const [completed] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM projects p
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE ma.mentor_id = ? AND p.status = 'Completed'`,
      [mentorId]
    );

    const [late] = await db.execute(
      `SELECT COUNT(*) as count
       FROM milestone_submissions ms
       JOIN projects p ON p.id = ms.project_id
       JOIN mentor_assignments ma ON ma.project_id = p.id
       WHERE ma.mentor_id = ? AND ms.is_late = TRUE`,
      [mentorId]
    );

    const [average] = await db.execute(
      `SELECT ROUND(COALESCE(AVG(ps.total_marks), 0), 2) as average_marks
       FROM project_scores ps
       JOIN mentor_assignments ma ON ma.registration_id = ps.project_registration_id
       WHERE ma.mentor_id = ?`,
      [mentorId]
    );

    res.json({
      assigned: parseInt(assigned[0].count || 0, 10),
      pending: parseInt(pending[0].count || 0, 10),
      completed: parseInt(completed[0].count || 0, 10),
      lateSubmissions: parseInt(late[0].count || 0, 10),
      averageMarks: average[0].average_marks || 0,
      feedback: parseInt(pending[0].count || 0, 10)
    });
  } catch (error) {
    console.error('getMentorStats error:', error);
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
    const [projects] = await db.execute(`
      SELECT DISTINCT p.*,
             ma.registration_id as project_registration_id,
             ma.submission_id,
             ps.total_marks,
             COUNT(ms.id) FILTER (WHERE COALESCE(ms.review_status, ms.status) = 'submitted') AS pending_reviews,
             COUNT(ms.id) FILTER (WHERE ms.is_late = TRUE) AS late_submissions
      FROM mentor_assignments ma
      JOIN projects p ON p.id = ma.project_id
      LEFT JOIN project_scores ps ON ps.project_registration_id = ma.registration_id
      LEFT JOIN milestone_submissions ms ON ms.project_id = p.id
      WHERE ma.mentor_id = ?
      GROUP BY p.id, ma.registration_id, ma.submission_id, ps.total_marks
      ORDER BY p.updated_at DESC, p.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, projects });
  } catch (error) {
    console.error('getAssignedProjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMentorMilestones = async (req, res) => {
  const { project_id, start_date, interval_days = 15, milestones } = req.body;
  req.body = {
    project_id,
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
      WHERE mentor_id = $1 AND registration_id = $2
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
      WHERE mentor_id = $1 AND registration_id = $2
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
      WHERE ms.id = $1 AND ma.mentor_id = $2
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
