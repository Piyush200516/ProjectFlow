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
        JOIN project_team_members ptm ON p.id = ptm.project_id
        WHERE ptm.user_id = ?
      `;
      params = [id];
    } else if (role === 'mentor') {
      query = 'SELECT * FROM projects WHERE mentor_id = ?';
      params = [id];
    } else if (role === 'hod' || role === 'cdc') {
      query = 'SELECT * FROM projects'; // Global access for HOD/CDC
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }

    const [projects] = await db.execute(query, params);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Student)
exports.createProject = async (req, res) => {
  const { title, type, description, team_members } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.execute(
      'INSERT INTO projects (title, type, description, created_by) VALUES (?, ?, ?, ?)',
      [title, type, description, userId]
    );

    const projectId = result.insertId;

    // Add creator as team member
    await db.execute(
      'INSERT INTO project_team_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'lead']
    );

    // Add other members if provided
    if (team_members && Array.isArray(team_members)) {
      for (const memberId of team_members) {
        await db.execute(
          'INSERT INTO project_team_members (project_id, user_id, role) VALUES (?, ?, ?)',
          [projectId, memberId, 'member']
        );
      }
    }

    res.status(201).json({ id: projectId, title, type, description });
  } catch (error) {
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

    // Get team members
    const [members] = await db.execute(
      'SELECT u.id, u.name, u.email, ptm.role FROM users u JOIN project_team_members ptm ON u.id = ptm.user_id WHERE ptm.project_id = ?',
      [req.params.id]
    );

    // Get tasks
    const [tasks] = await db.execute('SELECT * FROM tasks WHERE project_id = ?', [req.params.id]);

    res.json({ ...project, members, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
