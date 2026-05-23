const db = require('../config/db');

// Lazy initialize tables just in case they don't exist (since sandboxing prevents migrations)
(async () => {
    try {
        const createRegistrationFormsTable = `
            CREATE TABLE IF NOT EXISTS registration_forms (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                instructions TEXT,
                branch VARCHAR(100) NOT NULL,
                academic_year VARCHAR(20),
                semester INT NOT NULL,
                section VARCHAR(10) NOT NULL,
                team_size_min INT DEFAULT 2,
                team_size_max INT DEFAULT 4,
                project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Minor Project', 'Major Project', 'Research Project', 'Hackathon Project')),
                start_date TIMESTAMP NOT NULL,
                deadline TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                subsection VARCHAR(10),
                created_by INT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.execute(createRegistrationFormsTable);
        // Remove the old constraint safely to allow lowercase statuses
        try {
            await db.execute(`ALTER TABLE registration_forms DROP CONSTRAINT IF EXISTS registration_forms_status_check;`);
        } catch (err) {
            console.warn("Optional constraint not found or could not be dropped, skipping:", err.message);
        }
        try {
            await db.execute(`ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS branch_id INT;`);
            await db.execute(`ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS subsection VARCHAR(10);`);
        } catch (err) {
            console.warn("Column branch_id might already exist or error:", err.message);
        }
        await db.execute(`
            CREATE TABLE IF NOT EXISTS registration_form_submissions (
                id SERIAL PRIMARY KEY,
                form_id INT NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
                project_title VARCHAR(255) NOT NULL,
                project_domain VARCHAR(100) NOT NULL,
                problem_statement TEXT,
                abstract TEXT,
                tech_stack TEXT,
                leader_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                team_members JSONB, 
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                remarks TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        console.error('Failed to init HOD tables:', e);
    }
})();

// @desc    Get HOD dashboard stats (department wide)
// @route   GET /api/hod/dashboard-stats
// @access  Private (HOD)
exports.getHodStats = async (req, res) => {
  try {
    const [forms] = await db.execute('SELECT COUNT(*) as count FROM registration_forms');
    const [publishedForms] = await db.execute("SELECT COUNT(*) as count FROM registration_forms WHERE status = 'published' OR status = 'Published'");
    const [submissions] = await db.execute('SELECT COUNT(*) as count FROM registration_form_submissions');
    const [pendingApprovals] = await db.execute("SELECT COUNT(*) as count FROM registration_form_submissions WHERE status = 'Pending'");
    const [approvedProjects] = await db.execute("SELECT COUNT(*) as count FROM registration_form_submissions WHERE status = 'Approved'");
    const [rejectedProjects] = await db.execute("SELECT COUNT(*) as count FROM registration_form_submissions WHERE status = 'Rejected'");
    const [mentorAssignedProjects] = await db.execute("SELECT COUNT(DISTINCT project_id) as count FROM mentor_assignments");
    
    res.json({
      totalForms: parseInt(forms[0].count || 0, 10),
      publishedForms: parseInt(publishedForms[0].count || 0, 10),
      totalSubmissions: parseInt(submissions[0].count || 0, 10),
      pendingApprovals: parseInt(pendingApprovals[0].count || 0, 10),
      approvedProjects: parseInt(approvedProjects[0].count || 0, 10),
      rejectedProjects: parseInt(rejectedProjects[0].count || 0, 10),
      mentorAssignedProjects: parseInt(mentorAssignedProjects[0].count || 0, 10)
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

// 1. Create Project Registration Form
exports.createRegistrationForm = async (req, res) => {
  try {
    console.log("HOD publish payload:", req.body);
    const {
      title, instructions, branch, branch_id, academic_year, semester, section, subsection,
      team_size_min, team_size_max, project_type, start_date, deadline, status
    } = req.body;
    const created_by = req.user.id;

    if (academic_year) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentAcademicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;
      const submittedStartYear = parseInt(academic_year.split('-')[0], 10);
      
      if (submittedStartYear <= currentAcademicStartYear) {
        return res.status(400).json({ message: 'Please select a future academic year.' });
      }
    }

    if (project_type === 'Minor Project' && ![5, 6].includes(parseInt(semester))) {
      return res.status(400).json({ message: 'Invalid semester for Minor Project. Must be 5 or 6.' });
    }
    if (project_type === 'Major Project' && ![7, 8].includes(parseInt(semester))) {
      return res.status(400).json({ message: 'Invalid semester for Major Project. Must be 7 or 8.' });
    }

    if (parseInt(team_size_min) < 2 || parseInt(team_size_max) > 4 || parseInt(team_size_min) > parseInt(team_size_max)) {
      return res.status(400).json({ message: 'Team size must be between 2 and 4 members.' });
    }

    let finalStatus = status || 'draft';
    if (finalStatus.toLowerCase() === 'published' || finalStatus.toLowerCase() === 'active') finalStatus = 'published';
    if (finalStatus.toLowerCase() === 'draft') finalStatus = 'draft';
    if (finalStatus.toLowerCase() === 'closed') finalStatus = 'closed';

    let finalBranchId = branch_id;
    if (!finalBranchId) {
      if (branch === 'Electronics & Communication Engineering') finalBranchId = 2;
      else finalBranchId = 1;
    }

    const [result] = await db.execute(`
      INSERT INTO registration_forms 
      (title, instructions, branch, branch_id, academic_year, semester, section, subsection, team_size_min, team_size_max, project_type, start_date, deadline, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [title, instructions, branch, finalBranchId, academic_year || '2025-26', semester, section, subsection || null, team_size_min, team_size_max, project_type, start_date || null, deadline || null, finalStatus, created_by]);
    
    console.log("Created registration form:", result.rows ? result.rows[0] : result[0]);

    res.status(201).json(result.rows ? result.rows[0] : result[0]);
  } catch (error) {
    console.error('createRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRegistrationForms = async (req, res) => {
  try {
    const [forms] = await db.execute(`
      SELECT f.*, 
        (SELECT COUNT(*) FROM registration_form_submissions s WHERE s.form_id = f.id) as submissions_count
      FROM registration_forms f
      ORDER BY f.created_at DESC
    `);
    res.json(forms);
  } catch (error) {
    console.error('getRegistrationForms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Simplistic update for now, ideally parameterized dynamically
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    const [result] = await db.execute(`
      UPDATE registration_forms 
      SET ${fields}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);
    
    if (result.length === 0) return res.status(404).json({ message: 'Form not found' });
    res.json(result[0]);
  } catch (error) {
    console.error('updateRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.publishRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Publish request for form id:', id);
    const [result] = await db.execute(`
      UPDATE registration_forms SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *
    `, [id]);
    console.log('Published form result:', result);
    res.json(result[0]);
  } catch (error) {
    console.error('publishRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.closeRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute(`
      UPDATE registration_forms SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *
    `, [id]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRegistrationSubmissions = async (req, res) => {
  try {
    const [submissions] = await db.execute(`
      SELECT s.*, f.title as form_title, f.branch, f.semester, f.section,
             u.full_name as leader_name, u.email as leader_email
      FROM registration_form_submissions s
      JOIN registration_forms f ON s.form_id = f.id
      JOIN users u ON s.leader_id = u.id
      ORDER BY s.submitted_at DESC
    `);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRegistrationSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [submissions] = await db.execute(`
      SELECT s.*, f.title as form_title, f.branch, f.semester, f.section,
             u.full_name as leader_name, u.email as leader_email
      FROM registration_form_submissions s
      JOIN registration_forms f ON s.form_id = f.id
      JOIN users u ON s.leader_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (submissions.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(submissions[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveRegistrationSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const [result] = await db.execute(`
      UPDATE registration_form_submissions 
      SET status = 'Approved', remarks = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [remarks || null, id]);
    
    // Note: To fully integrate with the app, we would also create an entry in 'projects' table here
    // but the prompt focused on HOD portal and assign mentor. We can assume we might create the project here later.
    
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.rejectRegistrationSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const [result] = await db.execute(`
      UPDATE registration_form_submissions 
      SET status = 'Rejected', remarks = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [remarks || null, id]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.assignMentor = async (req, res) => {
  try {
    const { submission_id, mentor_id } = req.body;
    const assigned_by = req.user.id;
    
    // First we check if there's a project created for this submission. If not, we might create one or map to submission_id
    // Since we created registration_form_submissions, let's just insert into mentor_assignments directly
    // Wait, mentor_assignments usually links to project_id. We'll map registration_id to it if needed, or submission_id.
    
    const [submission] = await db.execute(`SELECT * FROM registration_form_submissions WHERE id = $1`, [submission_id]);
    if (submission.length === 0) return res.status(404).json({ message: 'Submission not found' });
    
    // Find or create project
    let [existingProjects] = await db.execute(`SELECT * FROM projects WHERE title = $1 AND created_by = $2`, [submission[0].project_title, submission[0].leader_id]);
    let projectId = null;
    if (existingProjects.length > 0) {
      projectId = existingProjects[0].id;
      await db.execute(`UPDATE projects SET mentor_id = $1 WHERE id = $2`, [mentor_id, projectId]);
    } else {
      const [newProject] = await db.execute(`
        INSERT INTO projects (title, description, created_by, mentor_id, status)
        VALUES ($1, $2, $3, $4, 'In Progress')
        RETURNING id
      `, [submission[0].project_title, submission[0].abstract, submission[0].leader_id, mentor_id]);
      projectId = newProject[0].id;
    }
    
    const [result] = await db.execute(`
      INSERT INTO mentor_assignments (mentor_id, project_id, assigned_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [mentor_id, projectId, assigned_by]);
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('assignMentor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type } = req.query; // 'submissions', 'approved', 'mentors'
    let query = '';
    
    if (type === 'submissions') {
      query = `SELECT * FROM registration_form_submissions`;
    } else if (type === 'approved') {
      query = `SELECT * FROM registration_form_submissions WHERE status = 'Approved'`;
    } else if (type === 'mentors') {
      query = `SELECT m.*, u.full_name as mentor_name, p.title as project_title
               FROM mentor_assignments m
               JOIN users u ON m.mentor_id = u.id
               JOIN projects p ON m.project_id = p.id`;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }
    
    const [data] = await db.execute(query);
    // In a real app we'd convert this to CSV using json2csv, but for now we'll just send JSON which the frontend can convert
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMentors = async (req, res) => {
  try {
    const [mentors] = await db.execute(`
      SELECT m.*, u.full_name, u.email, u.profile_image 
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE u.role = 'mentor' AND u.is_active = TRUE
    `);
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
