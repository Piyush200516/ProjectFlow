const db = require('../config/db');

const tableExists = async (tableName) => {
  const result = await db.pool.query('SELECT to_regclass($1)::text as table_name', [tableName]);
  return Boolean(result.rows[0]?.table_name);
};

const columnExists = async (tableName, columnName) => {
  const result = await db.pool.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    LIMIT 1
  `, [tableName, columnName]);
  return result.rows.length > 0;
};

const ensureProjectRegistrationMembersTable = async () => {
  await db.pool.query(`
    CREATE TABLE IF NOT EXISTS project_registration_members (
      id SERIAL PRIMARY KEY,
      registration_id INT,
      submission_id INT,
      form_id INT,
      user_id INT,
      student_name VARCHAR(150),
      student_email VARCHAR(150),
      roll_number VARCHAR(50),
      team_role VARCHAR(50) DEFAULT 'Member',
      is_leader BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// @desc    Get all projects for the logged-in user (based on role)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  const { id, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'student') {
      await ensureProjectRegistrationMembersTable();
      query = `
        SELECT p.id,
               p.registration_id,
               p.title,
               p.type,
               p.team_name,
               p.description,
               p.start_date,
               p.end_date,
               p.status,
               p.progress_percent,
               p.branch_id,
               p.created_by,
               p.mentor_id,
               p.created_at,
               p.updated_at,
               rf.deadline as registration_deadline,
               rfs.status as registration_status
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN project_registrations pr ON pr.id = p.registration_id
        LEFT JOIN registration_form_submissions rfs
          ON rfs.leader_id = p.created_by
         AND rfs.project_title = p.title
        LEFT JOIN registration_forms rf ON rf.id = rfs.form_id
        WHERE pm.student_id = ?
        UNION ALL
        SELECT COALESCE(p.id, pr.id) AS id,
               pr.id AS registration_id,
               rfs.project_title AS title,
               rf.project_type AS type,
               pr.team_name,
               COALESCE(rfs.abstract, rfs.problem_statement) AS description,
               NULL::date AS start_date,
               NULL::date AS end_date,
               rfs.status,
               COALESCE(p.progress_percent, 0) AS progress_percent,
               rf.branch_id,
               rfs.leader_id AS created_by,
               COALESCE(p.mentor_id, pr.mentor_id) AS mentor_id,
               rfs.submitted_at AS created_at,
               rfs.updated_at,
               rf.deadline AS registration_deadline,
               rfs.status AS registration_status
        FROM registration_form_submissions rfs
        JOIN registration_forms rf ON rf.id = rfs.form_id
        LEFT JOIN project_team_members ptm
          ON ptm.submission_id = rfs.id
         AND (ptm.user_id = ? OR ptm.student_id = ? OR ptm.student_user_id = ?)
        LEFT JOIN project_registration_members prm
          ON prm.submission_id = rfs.id
         AND prm.user_id = ?
        LEFT JOIN project_registrations pr
          ON pr.id = COALESCE(ptm.project_registration_id, prm.registration_id)
          OR (pr.created_by = rfs.leader_id AND pr.title = rfs.project_title)
        LEFT JOIN projects p ON p.registration_id = pr.id
        WHERE (rfs.leader_id = ? OR ptm.id IS NOT NULL OR prm.id IS NOT NULL)
          AND p.id IS NULL
        ORDER BY created_at DESC
      `;
      params = [id, id, id, id, id, id];
    } else if (role === 'mentor') {
      query = `
        SELECT DISTINCT p.*
        FROM projects p
        JOIN mentor_assignments ma ON ma.project_id = p.id
        WHERE COALESCE(ma.mentor_user_id, ma.mentor_id) = ?
        ORDER BY p.created_at DESC
      `;
      params = [id];
    } else if (role === 'hod' || role === 'admin') {
      query = 'SELECT * FROM projects ORDER BY created_at DESC';
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }

    const [projects] = await db.execute(query, params);
    res.json(projects);
  } catch (error) {
    console.error('getProjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  const { title, type, description } = req.body;
  const userId = req.user.id;

  if (req.user.role === 'student') {
    return res.status(403).json({
      message: 'Students cannot create independent projects. Please use the HOD Project Registration Campaign.'
    });
  }

  if (!title) {
    return res.status(400).json({ message: 'Project title is required' });
  }

  try {
    // Check if student is already in an active project or team
    const [activeProjects] = await db.execute(
      `SELECT p.id FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')`,
      [userId]
    );

    const [activeSubmissions] = await db.execute(
      `SELECT pfs.id FROM project_form_submissions pfs
       JOIN team_members tm ON pfs.id = tm.submission_id
       WHERE tm.student_id = ? AND pfs.status = 'Pending'`,
      [userId]
    );

    if (activeProjects.length > 0 || activeSubmissions.length > 0) {
      return res.status(400).json({ message: 'You are already working on an active project.' });
    }

    const [result] = await db.execute(
      'INSERT INTO projects (title, type, description, created_by) VALUES (?, ?, ?, ?)',
      [title, type || 'Mini Project', description || '', userId]
    );

    const projectId = result.insertId;

    // Add creator as lead team member
    await db.execute(
      'INSERT INTO project_members (project_id, student_id, is_leader) VALUES (?, ?, ?)',
      [projectId, userId, true]
    );

    const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('createProject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const [projects] = await db.execute(
      `SELECT id, registration_id, title, type, team_name, description, start_date,
              end_date, status, progress_percent, branch, academic_year, semester,
              section, created_by, mentor_id, created_at, updated_at
       FROM projects
       WHERE id = ?`,
      [req.params.id]
    );
    const project = projects[0];

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get team members with full_name
    const [members] = await db.execute(
      `SELECT u.id, u.full_name, u.email, CASE WHEN pm.is_leader THEN 'lead' ELSE 'member' END as role
       FROM users u
       JOIN project_members pm ON u.id = pm.student_id
       WHERE pm.project_id = ?`,
      [req.params.id]
    );

    // Get tasks
    let tasks = [];
    if (await tableExists('tasks')) {
      const [taskRows] = await db.execute(
        `SELECT id, title, description, status, priority, project_id, members,
                comments, attachments, created_by, due_date, created_at, updated_at
         FROM tasks
         WHERE project_id = ?
         ORDER BY created_at DESC`,
        [req.params.id]
      );
      tasks = taskRows;
    }

    // Get feedback
    let feedback = [];
    if (await tableExists('mentor_feedback')) {
      const hasFeedbackColumn = await columnExists('mentor_feedback', 'feedback');
      const feedbackTextColumn = hasFeedbackColumn ? 'f.feedback' : 'f.comment';
      const [feedbackRows] = await db.execute(
        `SELECT f.id,
                f.project_id,
                f.mentor_id,
                ${feedbackTextColumn} as comment,
                ${feedbackTextColumn} as feedback,
                f.sentiment,
                f.created_at,
                u.full_name as mentor_name
         FROM mentor_feedback f
         JOIN users u ON f.mentor_id = u.id
         WHERE f.project_id = ?
         ORDER BY f.created_at DESC`,
        [req.params.id]
      );
      feedback = feedbackRows;
    }

    // Get evaluations
    let evaluations = [];
    if (await tableExists('evaluations')) {
      const [evaluationRows] = await db.execute(
        `SELECT id, project_id, student_id, evaluator_id, task_completion_score,
                timeliness_score, documentation_score, technical_skill_score,
                total_score, comments, created_at
         FROM evaluations
         WHERE project_id = ?`,
        [req.params.id]
      );
      evaluations = evaluationRows;
    }

    res.json({ 
      ...project, 
      members, 
      tasks, 
      feedback, 
      evaluations 
    });
  } catch (error) {
    console.error('getProjectById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id  or  PATCH /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  const { title, type, description, progress, status } = req.body;

  try {
    const fields = [];
    const values = [];

    if (title !== undefined)       { fields.push('title = ?');       values.push(title); }
    if (type !== undefined)        { fields.push('type = ?');        values.push(type); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (progress !== undefined)    { fields.push('progress = ?');    values.push(progress); }
    if (status !== undefined)      { fields.push('status = ?');      values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.params.id);
    await db.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('updateProject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('deleteProject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
