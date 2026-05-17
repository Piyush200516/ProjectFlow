const db = require('../config/db');

// @desc    Get mentor dashboard stats
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor)
exports.getMentorStats = async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Count assigned projects
    const [assigned] = await db.execute(
      'SELECT COUNT(*) as count FROM projects WHERE mentor_id = ?',
      [mentorId]
    );

    // Count pending reviews (tasks in 'Review' status for projects mentored by this user)
    const [pending] = await db.execute(
      `SELECT COUNT(*) as count FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.mentor_id = ? AND t.status = 'Review'`,
      [mentorId]
    );

    // Count completed projects
    const [completed] = await db.execute(
      "SELECT COUNT(*) as count FROM projects WHERE mentor_id = ? AND status = 'Completed'",
      [mentorId]
    );

    res.json({
      assigned: parseInt(assigned[0].count || 0, 10),
      pending: parseInt(pending[0].count || 0, 10),
      completed: parseInt(completed[0].count || 0, 10),
      feedback: 0 // Placeholder
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
