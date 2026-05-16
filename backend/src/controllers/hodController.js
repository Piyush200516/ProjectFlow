const db = require('../config/db');

// @desc    Get HOD dashboard stats (department wide)
// @route   GET /api/hod/dashboard
// @access  Private (HOD)
exports.getHodStats = async (req, res) => {
  try {
    const [totalProjects] = await db.execute('SELECT COUNT(*) as count FROM projects');
    const [activeStudents] = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = TRUE");
    const [pendingApprovals] = await db.execute("SELECT COUNT(*) as count FROM projects WHERE status = 'Proposal'");
    
    res.json({
      totalProjects: totalProjects[0].count,
      activeStudents: activeStudents[0].count,
      pendingApprovals: pendingApprovals[0].count,
      completionRate: '85%' // Placeholder
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
    const [projects] = await db.execute(
      `SELECT p.*, u.full_name as mentor_name 
       FROM projects p 
       LEFT JOIN users u ON p.mentor_id = u.id 
       ORDER BY p.created_at DESC`
    );
    res.json(projects);
  } catch (error) {
    console.error('getAllProjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
