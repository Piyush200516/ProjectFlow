const db = require('../config/db');

// @desc    Get CDC dashboard stats
// @route   GET /api/cdc/dashboard
// @access  Private (CDC)
exports.getCdcStats = async (req, res) => {
  try {
    const [startups] = await db.execute('SELECT COUNT(*) as count FROM startups');
    const [partners] = await db.execute('SELECT COUNT(*) as count FROM industry_collaborations');
    
    res.json({
      activeStartups: startups[0].count,
      industryPartners: partners[0].count,
      patents: 8, // Placeholder
      innovationValue: '$2.4M' // Placeholder
    });
  } catch (error) {
    console.error('getCdcStats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all startups
// @route   GET /api/cdc/startups
// @access  Private (CDC)
exports.getStartups = async (req, res) => {
  try {
    const [startups] = await db.execute(
      `SELECT s.*, p.title as project_title, u.full_name as founder_name 
       FROM startups s 
       LEFT JOIN projects p ON s.project_id = p.id 
       JOIN users u ON s.founder_id = u.id`
    );
    res.json(startups);
  } catch (error) {
    console.error('getStartups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
