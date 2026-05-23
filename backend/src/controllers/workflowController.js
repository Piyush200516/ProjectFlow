const db = require('../config/db');

// =========================================================================
// HOD CONTROLLER ENDPOINTS
// =========================================================================

// @desc    HOD creates project registration form
// @route   POST /api/hod/forms
// @access  Private (HOD)
exports.createProjectForm = async (req, res) => {
  const { title, description, project_type, branch, academic_year, semester, section, deadline } = req.body;
  const hodId = req.user.id;

  if (!title || !project_type || !branch || !academic_year || !semester || !section || !deadline) {
    return res.status(400).json({ message: 'All fields are required to create a project form' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO project_forms 
       (title, description, project_type, branch, academic_year, semester, section, deadline, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', project_type, branch, academic_year, parseInt(semester), section, deadline, hodId]
    );

    res.status(201).json({
      message: 'Project registration form created successfully',
      formId: result.insertId
    });
  } catch (error) {
    console.error('createProjectForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    HOD lists all project registration forms
// @route   GET /api/hod/forms
// @access  Private (HOD)
exports.getProjectForms = async (req, res) => {
  try {
    const [forms] = await db.execute('SELECT * FROM project_forms ORDER BY created_at DESC');
    res.json(forms);
  } catch (error) {
    console.error('getProjectForms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    HOD gets all registration form submissions
// @route   GET /api/hod/submissions
// @access  Private (HOD)
exports.getProjectSubmissions = async (req, res) => {
  try {
    const [submissions] = await db.execute(
      `SELECT pfs.*, pf.title as form_title, pf.project_type, u.full_name as student_name
       FROM project_form_submissions pfs
       JOIN project_forms pf ON pfs.form_id = pf.id
       JOIN users u ON pfs.student_id = u.id
       ORDER BY pfs.created_at DESC`
    );

    // Fetch team members for each submission
    for (let sub of submissions) {
      const [members] = await db.execute(
        `SELECT tm.*, u.full_name, u.email 
         FROM team_members tm
         LEFT JOIN users u ON tm.student_id = u.id
         WHERE tm.submission_id = ?`,
        [sub.id]
      );
      sub.team_members = members;
    }

    res.json(submissions);
  } catch (error) {
    console.error('getProjectSubmissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    HOD assigns mentor based on section/year/branch/domain (Manual or Automatic)
// @route   POST /api/hod/assign-mentor
// @access  Private (HOD)
exports.assignMentor = async (req, res) => {
  const { submission_id, mentor_id, auto_assign } = req.body;
  const hodId = req.user.id;

  if (!submission_id) {
    return res.status(400).json({ message: 'Submission ID is required' });
  }

  try {
    // 1. Fetch the submission detail
    const [submissions] = await db.execute(
      `SELECT pfs.*, pf.section, pf.academic_year, pf.branch, pf.project_type
       FROM project_form_submissions pfs
       JOIN project_forms pf ON pfs.form_id = pf.id
       WHERE pfs.id = ?`,
      [submission_id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Project submission not found' });
    }

    const sub = submissions[0];
    let selectedMentorId = mentor_id;

    // 2. Automated assignment logic if selected
    if (auto_assign) {
      // Find mentors in same department (matching branch) or matching specialization (domain)
      const [availableMentors] = await db.execute(
        `SELECT m.user_id, u.full_name, m.specialization,
         (SELECT COUNT(*) FROM projects WHERE mentor_id = m.user_id) as active_projects
         FROM mentors m
         JOIN users u ON m.user_id = u.id
         WHERE m.specialization ILIKE ? OR u.full_name IS NOT NULL
         ORDER BY active_projects ASC LIMIT 1`,
        [`%${sub.domain}%`]
      );

      if (availableMentors.length > 0) {
        selectedMentorId = availableMentors[0].user_id;
      } else {
        // Fallback: get any mentor
        const [fallbackMentors] = await db.execute(
          `SELECT user_id FROM mentors LIMIT 1`
        );
        if (fallbackMentors.length > 0) {
          selectedMentorId = fallbackMentors[0].user_id;
        } else {
          return res.status(400).json({ message: 'No available mentors found to assign automatically' });
        }
      }
    }

    if (!selectedMentorId) {
      return res.status(400).json({ message: 'Mentor ID is required for assignment' });
    }

    // 3. Create active Project workspace for the team
    const [projResult] = await db.execute(
      `INSERT INTO projects (title, type, team_name, description, status, mentor_id, created_by) 
       VALUES (?, ?, ?, ?, 'In Progress', ?, ?)`,
      [sub.title, sub.project_type, `${sub.title} Team`, sub.description, selectedMentorId, sub.student_id]
    );
    const newProjectId = projResult.insertId;

    // Update submission status and set the project_id / mentor_id
    await db.execute(
      `UPDATE project_form_submissions SET status = 'Approved' WHERE id = ?`,
      [submission_id]
    );

    // Save mapping in mentor_assignments table
    await db.execute(
      `INSERT INTO mentor_assignments 
       (mentor_id, project_id, submission_id, assigned_by, section, academic_year, branch, domain) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [selectedMentorId, newProjectId, submission_id, hodId, sub.section, sub.academic_year, sub.branch, sub.domain]
    );

    // Link team members to the newly created project
    const [subMembers] = await db.execute(
      `SELECT student_id, is_leader FROM team_members WHERE submission_id = ?`,
      [submission_id]
    );

    for (let member of subMembers) {
      await db.execute(
        `INSERT INTO project_members (project_id, student_id, is_leader) VALUES (?, ?, ?)
         ON CONFLICT (project_id, student_id) DO NOTHING`,
        [newProjectId, member.student_id, member.is_leader]
      );
      
      // Update team_members record with project_id
      await db.execute(
        `UPDATE team_members SET project_id = ? WHERE submission_id = ? AND student_id = ?`,
        [newProjectId, submission_id, member.student_id]
      );

      // Initialize default Marks record for each student
      await db.execute(
        `INSERT INTO marks (project_id, submission_id, student_id, timeliness_score, doc_completion_score, contribution_score, github_score, mentor_review_score, total_score)
         VALUES (?, ?, ?, 10.00, 10.00, 10.00, 10.00, 10.00, 10.00)
         ON CONFLICT (student_id, project_id) DO NOTHING`,
        [newProjectId, submission_id, member.student_id]
      );

      // Create Notification for each student
      await db.execute(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [member.student_id, 'Project Registered & Mentor Assigned', `Your project "${sub.title}" has been approved! Mentor assigned: ${auto_assign ? 'Auto-Assigned' : 'Faculty Mentor'}.`, 'Success']
      );
    }

    res.json({
      message: 'Mentor assigned and project workspace activated successfully',
      projectId: newProjectId,
      mentorId: selectedMentorId
    });
  } catch (error) {
    console.error('assignMentor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =========================================================================
// STUDENT CONTROLLER ENDPOINTS
// =========================================================================

// @desc    Get active project forms for Student
// @route   GET /api/projects/forms/active
// @access  Private (Student)
exports.getActiveForms = async (req, res) => {
  const studentId = req.user.id;

  try {
    // Get student details (semester, branch name/code, etc)
    const [studentProfiles] = await db.execute(
      `SELECT s.*, b.name as branch_name 
       FROM students s
       JOIN branches b ON s.branch_id = b.id
       WHERE s.user_id = ?`,
      [studentId]
    );

    if (studentProfiles.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const s = studentProfiles[0];

    // Find forms matching student's branch, semester, academic_year
    const [forms] = await db.execute(
      `SELECT pf.* FROM project_forms pf
       WHERE pf.semester = ? AND pf.academic_year = ?
       ORDER BY pf.created_at DESC`,
      [s.semester, s.academic_year]
    );

    // Check if student has already submitted for these forms
    for (let form of forms) {
      const [submissions] = await db.execute(
        `SELECT id, status FROM project_form_submissions WHERE form_id = ? AND student_id = ?`,
        [form.id, studentId]
      );
      form.has_submitted = submissions.length > 0;
      form.submission_status = submissions.length > 0 ? submissions[0].status : null;
    }

    res.json(forms);
  } catch (error) {
    console.error('getActiveForms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Student registers a new project & adds 4 team details
// @route   POST /api/projects/forms/submit
// @access  Private (Student)
exports.submitProjectForm = async (req, res) => {
  const { form_id, title, description, domain, github_link, team_member_emails } = req.body;
  const studentId = req.user.id;

  if (!form_id || !title || !domain || !team_member_emails || team_member_emails.length !== 3) {
    return res.status(400).json({ message: 'Title, domain, and exactly 3 team member emails are required' });
  }

  try {
    // 1. Verify that the form exists
    const [forms] = await db.execute('SELECT * FROM project_forms WHERE id = ?', [form_id]);
    if (forms.length === 0) {
      return res.status(404).json({ message: 'Project registration form not found' });
    }

    const form = forms[0];

    // Check deadline
    if (new Date() > new Date(form.deadline)) {
      return res.status(400).json({ message: 'Form submission deadline has passed' });
    }

    // 2. Validate team size = exactly 4 (Leader + 3 members)
    // Check if the student leader is already in an active project or team
    const [leaderActiveProjects] = await db.execute(
      `SELECT p.id FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')`,
      [studentId]
    );

    const [leaderActiveSubmissions] = await db.execute(
      `SELECT pfs.id FROM project_form_submissions pfs
       JOIN team_members tm ON pfs.id = tm.submission_id
       WHERE tm.student_id = ? AND pfs.status = 'Pending'`,
      [studentId]
    );

    if (leaderActiveProjects.length > 0 || leaderActiveSubmissions.length > 0) {
      return res.status(400).json({ message: 'You are already working on an active project.' });
    }

    // Find all team member user profiles based on emails
    const uniqueEmails = [...new Set(team_member_emails)];
    if (uniqueEmails.includes(req.user.email)) {
      return res.status(400).json({ message: 'Do not include your own email in the team member emails list' });
    }

    const [teamUsers] = await db.execute(
      'SELECT id, email, full_name FROM users WHERE email IN (?, ?, ?)',
      uniqueEmails
    );

    if (teamUsers.length !== 3) {
      return res.status(400).json({ 
        message: 'All 3 team members must be registered users on ProjectFlow. Please check their emails.' 
      });
    }

    // Check if any teammate is already in an active project or team
    for (let u of teamUsers) {
      const [memberActiveProjects] = await db.execute(
        `SELECT p.id FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')`,
        [u.id]
      );

      const [memberActiveSubmissions] = await db.execute(
        `SELECT pfs.id FROM project_form_submissions pfs
         JOIN team_members tm ON pfs.id = tm.submission_id
         WHERE tm.student_id = ? AND pfs.status = 'Pending'`,
        [u.id]
      );

      if (memberActiveProjects.length > 0 || memberActiveSubmissions.length > 0) {
        return res.status(400).json({ message: `${u.full_name} is already working on another project.` });
      }
    }

    // 3. Create the project_form_submission
    const [subResult] = await db.execute(
      `INSERT INTO project_form_submissions 
       (form_id, student_id, title, description, domain, github_link) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [form_id, studentId, title, description || '', domain, github_link || '']
    );
    const submissionId = subResult.insertId;

    // 4. Save Leader details to team_members
    await db.execute(
      `INSERT INTO team_members (submission_id, student_id, role, is_leader) VALUES (?, ?, 'Leader', TRUE)`,
      [submissionId, studentId]
    );

    // 5. Save other members
    for (let u of teamUsers) {
      await db.execute(
        `INSERT INTO team_members (submission_id, student_id, role, is_leader) VALUES (?, ?, 'Member', FALSE)`,
        [submissionId, u.id]
      );
    }

    res.status(201).json({
      message: 'Project registration form submitted successfully with 4 team members',
      submissionId
    });
  } catch (error) {
    console.error('submitProjectForm error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You have already registered a project for this form' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =========================================================================
// MENTOR CONTROLLER ENDPOINTS
// =========================================================================

// @desc    Mentor uploads required document templates/formats
// @route   POST /api/mentor/document-templates
// @access  Private (Mentor/HOD)
exports.uploadDocumentTemplate = async (req, res) => {
  const { title, description, file_path, document_type, project_type, deadline_date } = req.body;
  const userId = req.user.id;

  if (!title || !file_path || !document_type) {
    return res.status(400).json({ message: 'Title, file path, and document type are required' });
  }

  try {
    // 1. Create document template
    const [result] = await db.execute(
      `INSERT INTO document_templates (title, description, file_path, document_type, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || '', file_path, document_type, userId]
    );
    const templateId = result.insertId;

    // 2. If deadline date & project type is provided, set a submission deadline
    if (project_type && deadline_date) {
      await db.execute(
        `INSERT INTO submission_deadlines (template_id, project_type, deadline_date, created_by) 
         VALUES (?, ?, ?, ?)`,
        [templateId, project_type, deadline_date, userId]
      );
    }

    res.status(201).json({
      message: 'Document template uploaded successfully',
      templateId
    });
  } catch (error) {
    console.error('uploadDocumentTemplate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Set document-wise deadline
// @route   POST /api/mentor/deadlines
// @access  Private (Mentor/HOD)
exports.setDocumentDeadline = async (req, res) => {
  const { template_id, project_type, deadline_date } = req.body;
  const userId = req.user.id;

  if (!template_id || !project_type || !deadline_date) {
    return res.status(400).json({ message: 'Template ID, project type, and deadline date are required' });
  }

  try {
    await db.execute(
      `INSERT INTO submission_deadlines (template_id, project_type, deadline_date, created_by) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT (template_id, project_type) 
       DO UPDATE SET deadline_date = EXCLUDED.deadline_date`,
      [template_id, project_type, deadline_date, userId]
    );

    res.json({ message: 'Submission deadline set successfully' });
  } catch (error) {
    console.error('setDocumentDeadline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all templates and deadlines
// @route   GET /api/projects/deadlines
// @access  Private
exports.getDeadlines = async (req, res) => {
  try {
    const [deadlines] = await db.execute(
      `SELECT sd.*, dt.title as template_title, dt.document_type, dt.file_path
       FROM submission_deadlines sd
       JOIN document_templates dt ON sd.template_id = dt.id
       ORDER BY sd.deadline_date ASC`
    );
    res.json(deadlines);
  } catch (error) {
    console.error('getDeadlines error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =========================================================================
// SUBMISSION & AUTO SCORING ENGINE
// =========================================================================

// @desc    Student submits document
// @route   POST /api/projects/documents/submit
// @access  Private (Student)
exports.submitDocument = async (req, res) => {
  const { project_id, template_id, document_type, file_name, file_path } = req.body;
  const studentId = req.user.id;

  if (!template_id || !document_type || !file_name || !file_path) {
    return res.status(400).json({ message: 'Required fields missing for document submission' });
  }

  try {
    // 1. Fetch deadline details
    let targetProjectId = project_id;
    if (!targetProjectId) {
      // Find student active project
      const [memberships] = await db.execute(
        `SELECT project_id FROM project_members WHERE student_id = ? LIMIT 1`,
        [studentId]
      );
      if (memberships.length > 0) {
        targetProjectId = memberships[0].project_id;
      }
    }

    if (!targetProjectId) {
      return res.status(400).json({ message: 'Student is not part of any active project team' });
    }

    // Get project details to know the project type
    const [projects] = await db.execute('SELECT type FROM projects WHERE id = ?', [targetProjectId]);
    const projectType = projects.length > 0 ? projects[0].type : 'Mini Project';

    // Find submission deadline
    const [deadlines] = await db.execute(
      `SELECT deadline_date FROM submission_deadlines 
       WHERE template_id = ? AND project_type = ?`,
      [template_id, projectType]
    );

    let isLate = false;
    let lateDays = 0;
    let finalScore = 10; // Out of 10

    if (deadlines.length > 0) {
      const deadline = new Date(deadlines[0].deadline_date);
      const submitTime = new Date();
      if (submitTime > deadline) {
        isLate = true;
        const diffTime = Math.abs(submitTime - deadline);
        lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Phase 7: Timeliness auto-scoring rules
        if (lateDays <= 0) {
          finalScore = 10;
        } else if (lateDays === 1 || lateDays === 2) {
          finalScore = 7;
        } else if (lateDays >= 3 && lateDays <= 5) {
          finalScore = 5;
        } else {
          finalScore = 2; // >5 days late
        }
      } else {
        finalScore = 10; // On-time
      }
    }


    // 2. Insert into document submissions
    const [subResult] = await db.execute(
      `INSERT INTO document_submissions 
       (project_id, student_id, template_id, document_type, file_name, file_path, status, is_late, late_days, marks_awarded) 
       VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?)`,
      [targetProjectId, studentId, template_id, document_type, file_name, file_path, isLate, lateDays, finalScore]
    );

    // 3. Recalculate Student marks automatically
    await exports.recalculateStudentMarks(studentId, targetProjectId);

    // 4. Create in-app Notification for Mentor
    const [projectDetails] = await db.execute(
      `SELECT mentor_id, title FROM projects WHERE id = ?`,
      [targetProjectId]
    );

    if (projectDetails.length > 0 && projectDetails[0].mentor_id) {
      await db.execute(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          projectDetails[0].mentor_id, 
          'New Document Submission', 
          `Team "${projectDetails[0].title}" submitted ${document_type} ${isLate ? '(LATE)' : '(ON-TIME)'}.`, 
          isLate ? 'Warning' : 'Info'
        ]
      );
    }

    res.status(201).json({
      message: 'Document submitted successfully',
      submissionId: subResult.insertId,
      isLate,
      lateDays,
      scoreAwarded: finalScore
    });
  } catch (error) {
    console.error('submitDocument error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mentor reviews a document submission
// @route   POST /api/mentor/submissions/:id/review
// @access  Private (Mentor)
exports.reviewSubmission = async (req, res) => {
  const { id } = req.params; // Submission ID
  const { status, comments } = req.body;
  const mentorId = req.user.id;

  if (!status || !['Approved', 'Needs Work'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required (Approved or Needs Work)' });
  }

  try {
    // 1. Fetch submission details
    const [submissions] = await db.execute(
      `SELECT ds.*, p.title as project_title, p.id as project_id
       FROM document_submissions ds
       JOIN projects p ON ds.project_id = p.id
       WHERE ds.id = ?`,
      [id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Document submission not found' });
    }

    const sub = submissions[0];

    // 2. Insert or update mentor review record
    await db.execute(
      `INSERT INTO mentor_reviews (submission_id, mentor_id, status, comments) 
       VALUES (?, ?, ?, ?)`,
      [id, mentorId, status, comments || '']
    );

    // Update document submission status
    await db.execute(
      `UPDATE document_submissions SET status = ? WHERE id = ?`,
      [status, id]
    );

    // 3. Recalculate student marks
    await exports.recalculateStudentMarks(sub.student_id, sub.project_id);

    // 4. Create Notification for Student
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [
        sub.student_id, 
        `Document Review: ${sub.document_type}`, 
        `Your submission was reviewed as "${status}" by the mentor. Comments: ${comments || 'No remarks'}`, 
        status === 'Approved' ? 'Success' : 'Warning'
      ]
    );

    res.json({ message: 'Review and feedback submitted successfully' });
  } catch (error) {
    console.error('reviewSubmission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =========================================================================
// AUTO MARKS RECALCULATION ENGINE
// =========================================================================
exports.recalculateStudentMarks = async (studentId, projectId) => {
  try {
    // 1. Calculate Timeliness Score: average marks of all submissions
    const [subStats] = await db.execute(
      `SELECT 
       COUNT(*) as total_docs,
       SUM(marks_awarded) as total_score
       FROM document_submissions 
       WHERE student_id = ? AND project_id = ?`,
      [studentId, projectId]
    );

    let timelinessScore = 10.00;
    if (subStats.length > 0 && subStats[0].total_docs > 0) {
      timelinessScore = parseFloat(subStats[0].total_score) / parseInt(subStats[0].total_docs);
    }
    
    // Scale Timeliness to 20 Marks (Timely Submission = 20 marks out of 100)
    const timelyMarks = (timelinessScore / 10.00) * 20.00;

    // 2. Document Completion Score: ratio of submitted documents to required document list
    // Required docs list: Poster, PPT, Project Report, Research Paper, Synopsis, SRS, Final Report (7 docs)
    const [compStats] = await db.execute(
      `SELECT COUNT(DISTINCT document_type) as unique_types
       FROM document_submissions 
       WHERE student_id = ? AND project_id = ? AND status = 'Approved'`,
      [studentId, projectId]
    );

    let completionScore = 0.00;
    let completionPercent = 0.00;
    if (compStats.length > 0) {
      completionScore = (parseInt(compStats[0].unique_types) / 7.00) * 10;
      completionPercent = (parseInt(compStats[0].unique_types) / 7.00) * 100.00;
    }

    // Scale Documentation to 30 Marks (Documentation = 30 marks out of 100)
    const docMarks = (completionPercent / 100.00) * 30.00;

    // 3. Mentor Evaluation = 20 Marks (defaults to 18 if project active, or scales with tasks/reviews)
    // 4. Final Demo/Viva = 20 Marks (default/evaluation)
    // 5. Innovation/Creativity = 10 Marks (default/evaluation)
    const mentorEvalMarks = 18.00;
    const demoVivaMarks = 18.00;
    const innovationMarks = 9.00;

    // Quality Marks = Documentation (30) + Mentor (20) + Viva (20) + Innovation (10) = 80 marks
    const qualityMarks = docMarks + mentorEvalMarks + demoVivaMarks + innovationMarks;
    const totalMarks = timelyMarks + qualityMarks; // 20 + 80 = 100 Marks

    // Save/Update in marks table
    await db.execute(
      `INSERT INTO marks 
       (project_id, student_id, timeliness_marks, quality_marks, total_marks, completeness, completion_percent,
        timeliness_score, doc_completion_score, contribution_score, github_score, mentor_review_score, total_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 10.00, 10.00, ?, ?)
       ON CONFLICT (student_id, project_id) 
       DO UPDATE SET 
         timeliness_marks = EXCLUDED.timeliness_marks,
         quality_marks = EXCLUDED.quality_marks,
         total_marks = EXCLUDED.total_marks,
         completeness = EXCLUDED.completeness,
         completion_percent = EXCLUDED.completion_percent,
         timeliness_score = EXCLUDED.timeliness_score,
         doc_completion_score = EXCLUDED.doc_completion_score,
         total_score = EXCLUDED.total_score,
         updated_at = CURRENT_TIMESTAMP`,
      [
        projectId, 
        studentId, 
        timelyMarks, 
        qualityMarks, 
        totalMarks, 
        docMarks, 
        completionPercent,
        timelinessScore, 
        completionScore, 
        mentorEvalMarks / 2.00, 
        totalMarks / 10.00
      ]
    );

    // Sync student summary score back to core student profile
    await db.execute(
      `UPDATE students SET 
       current_score = ?,
       contribution_score = ?,
       timeliness_score = ?
       WHERE user_id = ?`,
      [totalMarks, 90.00, timelyMarks * 5.00, studentId]
    );

  } catch (error) {
    console.error('recalculateStudentMarks error:', error);
  }
};

// @desc    Get student marks
// @route   GET /api/projects/marks
// @access  Private (Student/Mentor/HOD)
exports.getStudentMarks = async (req, res) => {
  const { studentId, projectId } = req.query;
  const currentUserId = req.user.id;
  const role = req.user.role;

  let queryStudentId = studentId || currentUserId;
  
  try {
    let query = '';
    let params = [];

    if (role === 'student') {
      // Students can only view their own marks
      query = `SELECT m.*, p.title as project_title 
               FROM marks m
               JOIN projects p ON m.project_id = p.id
               WHERE m.student_id = ?`;
      params = [currentUserId];
    } else {
      // HOD and Mentor can view any student's marks
      query = `SELECT m.*, p.title as project_title, u.full_name as student_name
               FROM marks m
               JOIN projects p ON m.project_id = p.id
               JOIN users u ON m.student_id = u.id
               WHERE 1=1`;
      
      if (studentId) {
        query += ` AND m.student_id = ?`;
        params.push(studentId);
      }
      if (projectId) {
        query += ` AND m.project_id = ?`;
        params.push(projectId);
      }
    }

    const [marks] = await db.execute(query, params);
    res.json(marks);
  } catch (error) {
    console.error('getStudentMarks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all mentors list for HOD assignment
// @route   GET /api/workflow/hod/mentors
// @access  Private (HOD)
exports.getMentorsList = async (req, res) => {
  try {
    const [mentors] = await db.execute(
      `SELECT u.id, u.full_name, u.email, m.specialization 
       FROM users u
       LEFT JOIN mentors m ON u.id = m.user_id
       WHERE u.role = 'mentor'`
    );
    res.json(mentors);
  } catch (error) {
    console.error('getMentorsList error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all document submissions assigned to the logged-in mentor
// @route   GET /api/workflow/mentor/submissions
// @access  Private (Mentor)
exports.getMentorSubmissions = async (req, res) => {
  const mentorId = req.user.id;
  try {
    const [submissions] = await db.execute(
      `SELECT ds.*, p.title as project_title, p.team_name, u.full_name as student_name, u.email as student_email
       FROM document_submissions ds
       JOIN projects p ON ds.project_id = p.id
       JOIN users u ON ds.student_id = u.id
       WHERE p.mentor_id = ?
       ORDER BY ds.created_at DESC`,
      [mentorId]
    );
    res.json(submissions);
  } catch (error) {
    console.error('getMentorSubmissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all document submissions for HOD monitoring
// @route   GET /api/workflow/hod/tracking
// @access  Private (HOD)
exports.getGlobalSubmissionTracking = async (req, res) => {
  try {
    const [tracking] = await db.execute(
      `SELECT ds.*, p.title as project_title, p.team_name, u.full_name as student_name, m.full_name as mentor_name
       FROM document_submissions ds
       JOIN projects p ON ds.project_id = p.id
       JOIN users u ON ds.student_id = u.id
       LEFT JOIN users m ON p.mentor_id = m.id
       ORDER BY ds.created_at DESC`
    );
    res.json(tracking);
  } catch (error) {
    console.error('getGlobalSubmissionTracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student active project or submission status
// @route   GET /api/workflow/student/active-status
// @access  Private (Student)
exports.getStudentActiveStatus = async (req, res) => {
  const studentId = req.user.id;
  try {
    // 1. Check active project
    const [activeProjects] = await db.execute(
      `SELECT p.id, p.title, p.status, p.team_name, m.full_name as mentor_name
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN users m ON p.mentor_id = m.id
       WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')`,
      [studentId]
    );

    if (activeProjects.length > 0) {
      return res.json({
        hasActive: true,
        type: 'project',
        details: activeProjects[0]
      });
    }

    // 2. Check active pending submission
    const [activeSubmissions] = await db.execute(
      `SELECT pfs.id, pfs.title, pfs.status, pfs.domain, f.project_type
       FROM project_form_submissions pfs
       JOIN team_members tm ON pfs.id = tm.submission_id
       JOIN project_forms f ON pfs.form_id = f.id
       WHERE tm.student_id = ? AND pfs.status = 'Pending'`,
      [studentId]
    );

    if (activeSubmissions.length > 0) {
      return res.json({
        hasActive: true,
        type: 'submission',
        details: activeSubmissions[0]
      });
    }

    res.json({
      hasActive: false,
      type: null,
      details: null
    });
  } catch (error) {
    console.error('getStudentActiveStatus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
