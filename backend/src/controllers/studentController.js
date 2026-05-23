const db = require('../config/db');

// @desc    Get active registration forms for a student based on their profile
// @route   GET /api/student/registration-forms/active
// @access  Private (Student)
exports.getActiveRegistrationForms = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student details
    const [studentData] = await db.execute(`
      SELECT s.*, b.name as branch_name 
      FROM students s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.user_id = $1
    `, [userId]);

    let student = null;
    let sBranch = null;
    let sYear = null;
    let sSemester = null;
    let sSection = null;

    if (studentData.length > 0) {
      student = studentData[0];
      console.log("Student profile:", student);

      sBranch = student.branch || student.branch_name;
      sYear = student.year || student.academic_year;
      sSemester = student.semester;
      sSection = student.section;
    } else {
      console.log("Student profile not found. Using fallback.");
    }

    let forms = [];

    // Fallback 1: If student details are missing/null
    if (!student.branch_id || !sYear || !sSemester || !sSection) {
      console.log("Student profile missing details. Fetching all published forms.");
      const [allForms] = await db.execute(`
        SELECT * FROM registration_forms
        WHERE LOWER(status) = 'published'
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)
      `);
      forms = allForms;
    } else {
      // Find matching published forms for the exact student profile
      const [matchingForms] = await db.execute(`
        SELECT *
        FROM registration_forms
        WHERE LOWER(status)='published'
        AND branch_id=$1
        AND academic_year=$2
        AND semester=$3
        AND section=$4
        AND (start_date IS NULL OR deadline IS NULL OR CURRENT_TIMESTAMP BETWEEN start_date AND deadline)
      `, [student.branch_id, sYear, sSemester, sSection]);
      
      forms = matchingForms;
      console.log("Matched forms:", forms);

      // Fallback 2: If strict matching returns 0, return all published active forms for testing
      if (!forms || forms.length === 0) {
        console.log("Strict matching returned 0 forms. Falling back to all published forms for testing.");
        const [allFormsFallback] = await db.execute(`
          SELECT * FROM registration_forms WHERE LOWER(status)='published'
        `);
        forms = allFormsFallback || [];
      }
    }

    console.log("Active forms found:", forms.length);
    res.json({ success: true, forms });
  } catch (error) {
    console.error('getActiveRegistrationForms error:', error);
    res.json({ success: true, forms: [] });
  }
};

// @desc    Submit a project registration form
// @route   POST /api/student/registration-forms/:id/submit
// @access  Private (Student)
exports.submitRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      project_title, 
      project_type, 
      project_domain, 
      problem_statement, 
      abstract, 
      tech_stack, 
      github_link, 
      team_members 
    } = req.body;
    
    const leaderId = req.user.id;

    // Validation
    if (!project_title || !project_domain || !abstract) {
      return res.status(400).json({ message: 'Please provide all required project details' });
    }

    // Get form details
    const [formResult] = await db.execute('SELECT * FROM registration_forms WHERE id = $1', [id]);
    if (formResult.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }
    const form = formResult[0];

    if (form.status !== 'Published') {
      return res.status(400).json({ message: 'This form is not currently accepting submissions' });
    }

    // Total members = leader + other members
    const totalMembers = (team_members ? team_members.length : 0) + 1;
    if (totalMembers < form.team_size_min || totalMembers > form.team_size_max) {
      return res.status(400).json({ 
        message: `Team size must be between ${form.team_size_min} and ${form.team_size_max} members (including leader)`
      });
    }

    // Check for duplicate emails/roll numbers in the submission (if any are provided)
    if (team_members && team_members.length > 0) {
      const emails = new Set();
      const rollNumbers = new Set();
      for (const member of team_members) {
        if (!member.email || !member.roll_number) {
          return res.status(400).json({ message: 'All team members must have an email and roll number' });
        }
        if (emails.has(member.email.toLowerCase())) {
          return res.status(400).json({ message: `Duplicate email found: ${member.email}` });
        }
        if (rollNumbers.has(member.roll_number.toLowerCase())) {
          return res.status(400).json({ message: `Duplicate roll number found: ${member.roll_number}` });
        }
        emails.add(member.email.toLowerCase());
        rollNumbers.add(member.roll_number.toLowerCase());
      }
    }

    // Check if leader already has an active project or pending submission
    const [existingSubmissions] = await db.execute(`
      SELECT * FROM registration_form_submissions 
      WHERE leader_id = $1 AND status IN ('Pending', 'Approved')
    `, [leaderId]);

    if (existingSubmissions.length > 0) {
      return res.status(400).json({ message: 'You already have an active project or pending submission' });
    }

    // Insert the submission
    const [result] = await db.execute(`
      INSERT INTO registration_form_submissions 
      (form_id, project_title, project_domain, problem_statement, abstract, tech_stack, leader_id, team_members, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
      RETURNING *
    `, [id, project_title, project_domain, problem_statement, abstract, tech_stack, leaderId, JSON.stringify(team_members || [])]);

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('submitRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
