const db = require('../config/db');

// @desc    Get all projects for the logged-in user (based on role)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  const { id, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'student') {
      query = `
        SELECT p.* FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.student_id = ?
        ORDER BY p.created_at DESC
      `;
      params = [id];
    } else if (role === 'mentor') {
      query = 'SELECT * FROM projects WHERE mentor_id = ? ORDER BY created_at DESC';
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
    const [projects] = await db.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
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
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    // Get feedback
    const [feedback] = await db.execute(
      `SELECT f.*, u.full_name as mentor_name
       FROM mentor_feedback f
       JOIN users u ON f.mentor_id = u.id
       WHERE f.project_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.id]
    );

    // Get evaluations
    const [evaluations] = await db.execute(
      'SELECT * FROM evaluations WHERE project_id = ?',
      [req.params.id]
    );

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
