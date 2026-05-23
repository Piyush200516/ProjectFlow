const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const [activeStartups] = await db.execute(
      "SELECT COUNT(*) as count FROM startups WHERE incubation_stage <> 'Scaling' OR incubation_stage IS NULL"
    );
    const [industryPartners] = await db.execute(
      "SELECT COUNT(*) as count FROM industry_collaborations WHERE status = 'Active'"
    );
    const [hackathons] = await db.execute(
      "SELECT COUNT(*) as count FROM hackathons WHERE status IN ('Upcoming', 'Live')"
    );
    const [innovation] = await db.execute(
      'SELECT COALESCE(ROUND(AVG(innovation_score), 2), 0) as score FROM startups'
    );

    res.json({
      activeStartups: parseInt(activeStartups[0]?.count || 0, 10),
      patents: parseInt(hackathons[0]?.count || 0, 10),
      industryPartners: parseInt(industryPartners[0]?.count || 0, 10),
      innovationValue: `${innovation[0]?.score || 0}/100`
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStartups = async (req, res) => {
  try {
    const [startups] = await db.execute(
      `SELECT s.id,
              s.name,
              s.incubation_stage as stage,
              s.funding_status as funding,
              s.website,
              s.innovation_score,
              p.title as project_title,
              u.full_name as founder_name
       FROM startups s
       LEFT JOIN projects p ON s.project_id = p.id
       JOIN users u ON s.founder_id = u.id
       ORDER BY s.created_at DESC`
    );

    res.json(startups);
  } catch (error) {
    console.error('getStartups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getIndustryCollaborations = async (req, res) => {
  try {
    const [collaborations] = await db.execute(
      `SELECT id,
              company_name as partner_name,
              collaboration_type as type,
              contact_person,
              expiry_date as expiry,
              status
       FROM industry_collaborations
       ORDER BY created_at DESC`
    );

    res.json(collaborations);
  } catch (error) {
    console.error('getIndustryCollaborations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
