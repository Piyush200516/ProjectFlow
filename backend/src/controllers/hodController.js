const db = require('../config/db');
const {
  createStudentNotifications,
  createTeamNotifications,
  ensureNotificationsTable
} = require('../utils/studentNotifications');

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
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50),
                reference_id INT,
                reference_type VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INT;`);
        await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);`);
        await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`);
        await db.execute(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50);`);
        await db.execute(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;`);

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

const REGISTRATION_FORM_NOTIFICATION_TITLE = 'New Project Registration Form';
const REGISTRATION_FORM_NOTIFICATION_MESSAGE = 'HOD has published a new project registration form. Please fill your project and team details before the deadline.';
const PROJECT_TIMELINE_NOTIFICATION_TITLE = 'Project Timeline Published';
const PROJECT_TIMELINE_NOTIFICATION_MESSAGE = 'Your project document submission timeline has been published.';

const formFilters = (form) => ({
  branch_id: form.branch_id,
  academic_year: form.academic_year,
  semester: form.semester,
  section: form.section,
  subsection: form.subsection || null
});

const defaultTimelineMilestones = [
  { title: 'Synopsis', document_type: 'synopsis' },
  { title: 'SRS', document_type: 'srs' },
  { title: 'PPT', document_type: 'ppt' },
  { title: 'Poster', document_type: 'poster' },
  { title: 'Project Report', document_type: 'report' },
  { title: 'GitHub Final Submission', document_type: 'github' }
];

const ensureRegistrationNotificationTable = async () => {
  await ensureNotificationsTable();
};

const notifyMatchingStudentsForRegistrationForm = async (form) => {
  return createStudentNotifications({
    title: 'New Project Registration Form',
    message: REGISTRATION_FORM_NOTIFICATION_MESSAGE,
    type: 'registration_form',
    referenceId: form.id,
    referenceType: 'registration_form',
    filters: formFilters(form)
  });
};

const notifyMatchingStudents = async (form, notification) => {
  return createStudentNotifications({
    title: notification.title,
    message: notification.message,
    type: notification.type,
    referenceId: notification.referenceId || form.id,
    referenceType: notification.referenceType,
    filters: formFilters(form)
  });
};

const ensureRegistrationTimelineColumns = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS project_milestones (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      document_type VARCHAR(100),
      sequence_no INT,
      sequence_order INT,
      deadline TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS registration_form_id INT REFERENCES registration_forms(id) ON DELETE CASCADE`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS project_registration_id INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS document_type VARCHAR(100)`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS sequence_no INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS sequence_order INT`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`);
  await db.execute(`ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.execute(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'project_id'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN project_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'project_registration_id'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN project_registration_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'document_type'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN document_type DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones' AND column_name = 'sequence_no'
      ) THEN
        ALTER TABLE project_milestones ALTER COLUMN sequence_no DROP NOT NULL;
      END IF;
    END $$;
  `);
  await db.execute(`
    UPDATE project_milestones
    SET registration_form_id = project_registration_id
    WHERE registration_form_id IS NULL
      AND project_registration_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM registration_forms
        WHERE registration_forms.id = project_milestones.project_registration_id
      )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_project_milestones_registration_form ON project_milestones(registration_form_id, sequence_no)`);
};

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

exports.getStudents = async (req, res) => {
  try {
    const [students] = await db.execute(
      `SELECT u.id,
              u.full_name,
              u.email,
              u.is_active,
              s.roll_number,
              s.semester,
              s.academic_year,
              s.section,
              s.subsection,
              b.name as branch_name
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE u.role = 'student'
       ORDER BY u.full_name ASC`
    );
    res.json(students);
  } catch (error) {
    console.error('getStudents error:', error);
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
    let resolvedBranch = branch;
    let finalBranchId = branch_id;

    if (!resolvedBranch && finalBranchId) {
      const branchResult = await db.pool.query('SELECT name FROM branches WHERE id = $1', [finalBranchId]);
      resolvedBranch = branchResult.rows[0]?.name;
    }

    if (!title || !resolvedBranch || !academic_year || !semester || !section || !project_type || !start_date || !deadline) {
      return res.status(400).json({
        message: 'Title, branch, academic year, semester, section, project type, start date, and deadline are required.'
      });
    }

    const parsedSemester = parseInt(semester, 10);
    const parsedTeamSizeMin = parseInt(team_size_min, 10);
    const parsedTeamSizeMax = parseInt(team_size_max, 10);
    const parsedStartDate = new Date(start_date);
    const parsedDeadline = new Date(deadline);

    if (Number.isNaN(parsedSemester)) {
      return res.status(400).json({ message: 'Semester must be a valid number.' });
    }

    if (Number.isNaN(parsedTeamSizeMin) || Number.isNaN(parsedTeamSizeMax)) {
      return res.status(400).json({ message: 'Team size must be valid numbers.' });
    }

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: 'Start date and deadline must be valid dates.' });
    }

    if (parsedDeadline <= parsedStartDate) {
      return res.status(400).json({ message: 'Deadline must be after the start date.' });
    }

    if (academic_year) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentAcademicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;
      const submittedStartYear = parseInt(academic_year.split('-')[0], 10);
      
      if (submittedStartYear < currentAcademicStartYear) {
        return res.status(400).json({ message: 'Please select the current or a future academic year.' });
      }
    }

    if (project_type === 'Minor Project' && ![5, 6].includes(parsedSemester)) {
      return res.status(400).json({ message: 'Invalid semester for Minor Project. Must be 5 or 6.' });
    }
    if (project_type === 'Major Project' && ![7, 8].includes(parsedSemester)) {
      return res.status(400).json({ message: 'Invalid semester for Major Project. Must be 7 or 8.' });
    }

    if (parsedTeamSizeMin < 2 || parsedTeamSizeMax > 4 || parsedTeamSizeMin > parsedTeamSizeMax) {
      return res.status(400).json({ message: 'Team size must be between 2 and 4 members.' });
    }

    let finalStatus = status || 'published';
    if (finalStatus.toLowerCase() === 'published' || finalStatus.toLowerCase() === 'active') finalStatus = 'published';
    if (finalStatus.toLowerCase() === 'draft') finalStatus = 'draft';
    if (finalStatus.toLowerCase() === 'closed') finalStatus = 'closed';

    if (!finalBranchId) {
      if (resolvedBranch === 'Electronics & Communication Engineering') finalBranchId = 2;
      else finalBranchId = 1;
    }

    const result = await db.pool.query(`
      INSERT INTO registration_forms 
      (title, instructions, branch, branch_id, academic_year, semester, section, subsection, team_size_min, team_size_max, project_type, start_date, deadline, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [title, instructions, resolvedBranch, finalBranchId, academic_year, parsedSemester, section, subsection || null, parsedTeamSizeMin, parsedTeamSizeMax, project_type, start_date, deadline, finalStatus, created_by]);
    
    const newForm = result.rows[0];
    console.log("Created registration form:", newForm);
    console.log("Form created:", newForm.id);

    const notifiedStudentsCount = await notifyMatchingStudentsForRegistrationForm(newForm);
    console.log("Students notified:", notifiedStudentsCount);

    res.status(201).json({
      success: true,
      message: finalStatus === 'published'
        ? "Registration form published and notifications sent"
        : "Registration form created and notifications sent",
      notifiedStudents: notifiedStudentsCount,
      data: newForm
    });
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
    const beforeResult = await db.pool.query('SELECT * FROM registration_forms WHERE id = $1', [id]);
    if (beforeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }
    const existingForm = beforeResult.rows[0];

    const allowedFields = new Set([
      'title',
      'instructions',
      'branch',
      'branch_id',
      'academic_year',
      'semester',
      'section',
      'subsection',
      'team_size_min',
      'team_size_max',
      'project_type',
      'start_date',
      'deadline',
      'status'
    ]);
    const entries = Object.entries(updates)
      .filter(([key]) => allowedFields.has(key))
      .map(([key, value]) => {
        if (key === 'status') {
          const normalizedStatus = String(value).toLowerCase();
          if (normalizedStatus === 'published' || normalizedStatus === 'active') return [key, 'published'];
          if (normalizedStatus === 'draft') return [key, 'draft'];
          if (normalizedStatus === 'closed') return [key, 'closed'];
        }
        return [key, value];
      });

    if (entries.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const fields = entries.map(([key], idx) => `${key} = $${idx + 1}`).join(', ');
    const values = entries.map(([, value]) => value);
    values.push(id);
    
    const result = await db.pool.query(`
      UPDATE registration_forms 
      SET ${fields}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Form not found' });

    const updatedForm = result.rows[0];
    const statusEntry = entries.find(([key]) => key === 'status');
    const deadlineChanged = entries.some(([key, value]) => (
      key === 'deadline' && new Date(value).getTime() !== new Date(existingForm.deadline).getTime()
    ));

    let notification = null;
    if (statusEntry?.[1] === 'published' && (existingForm.status || '').toLowerCase() !== 'published') {
      notification = {
        title: 'New Project Registration Form',
        message: 'HOD has published a new project registration form. Please fill your project and team details before the deadline.',
        type: 'registration_form',
        referenceType: 'registration_form'
      };
    } else if (statusEntry?.[1] === 'closed') {
      notification = {
        title: 'Project Registration Closed',
        message: `Project registration for "${updatedForm.title}" has been closed.`,
        type: 'registration_form_closed',
        referenceType: 'registration_form'
      };
    } else if (deadlineChanged) {
      notification = {
        title: 'Project Deadline Updated',
        message: `The deadline for "${updatedForm.title}" has been updated.`,
        type: 'deadline_updated',
        referenceType: 'registration_form'
      };
    } else {
      notification = {
        title: 'Project Registration Form Updated',
        message: `The project registration form "${updatedForm.title}" has been updated by HOD.`,
        type: 'registration_form_updated',
        referenceType: 'registration_form'
      };
    }

    if (notification) {
      const notifiedStudents = await notifyMatchingStudents(updatedForm, notification);
      console.log("Students notified:", notifiedStudents);
      return res.json({
        success: true,
        message: "Registration form updated and notifications sent",
        notifiedStudents,
        data: updatedForm
      });
    }

    res.json({ success: true, data: updatedForm });
  } catch (error) {
    console.error('updateRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.publishRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Publish request for form id:', id);
    const result = await db.pool.query(`
      UPDATE registration_forms SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *
    `, [id]);
    console.log('Published form result:', result);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const publishedForm = result.rows[0];
    const notifiedStudents = await notifyMatchingStudentsForRegistrationForm(publishedForm);
    console.log("Students notified:", notifiedStudents);

    res.json({
      success: true,
      message: "Registration form published and notifications sent",
      notifiedStudents,
      data: publishedForm
    });
  } catch (error) {
    console.error('publishRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.closeRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.pool.query(`
      UPDATE registration_forms SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const closedForm = result.rows[0];
    const notifiedStudents = await notifyMatchingStudents(closedForm, {
      title: 'Project Registration Closed',
      message: `Project registration for "${closedForm.title}" has been closed.`,
      type: 'registration_form_closed',
      referenceType: 'registration_form'
    });

    res.json({
      success: true,
      message: 'Registration form closed and notifications sent',
      notifiedStudents,
      data: closedForm
    });
  } catch (error) {
    console.error('closeRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createRegistrationFormTimeline = async (req, res) => {
  const { formId } = req.params;
  const { start_date, interval_days = 15, milestones = defaultTimelineMilestones } = req.body;
  const intervalDays = Number(interval_days);

  if (!start_date) {
    return res.status(400).json({ message: 'start_date is required' });
  }

  if (!Array.isArray(milestones) || milestones.length === 0) {
    return res.status(400).json({ message: 'At least one timeline milestone is required' });
  }

  if (!Number.isFinite(intervalDays) || intervalDays < 1) {
    return res.status(400).json({ message: 'interval_days must be a positive number' });
  }

  try {
    await ensureRegistrationTimelineColumns();

    const formResult = await db.pool.query('SELECT * FROM registration_forms WHERE id = $1', [formId]);
    if (formResult.rows.length === 0) {
      return res.status(404).json({ message: 'Registration form not found' });
    }

    const form = formResult.rows[0];
    if ((form.status || '').toLowerCase() !== 'published') {
      return res.status(400).json({ message: 'Publish the registration form before creating its timeline' });
    }

    const baseDate = new Date(start_date);
    if (Number.isNaN(baseDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start_date' });
    }

    const existingTimelineResult = await db.pool.query(
      'SELECT COUNT(*)::int AS count FROM project_milestones WHERE registration_form_id = $1 OR project_registration_id = $1',
      [form.id]
    );
    const isTimelineUpdate = (existingTimelineResult.rows[0]?.count || 0) > 0;

    const created = [];
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM project_milestones WHERE registration_form_id = $1 OR project_registration_id = $1',
        [form.id]
      );

      for (let index = 0; index < milestones.length; index += 1) {
        const item = milestones[index];
        const title = typeof item === 'string' ? item : item.title;
        const documentType = typeof item === 'string'
          ? item.toLowerCase().replace(/\s+/g, '_')
          : item.document_type || item.type || title?.toLowerCase().replace(/\s+/g, '_');
        const deadline = new Date(baseDate);
        deadline.setDate(baseDate.getDate() + intervalDays * (index + 1));

        if (!title) {
          throw new Error('Milestone title is required');
        }

        const result = await client.query(
          `INSERT INTO project_milestones
           (registration_form_id, title, document_type, sequence_no, sequence_order, deadline, status, created_by)
           VALUES ($1, $2, $3, $4, $4, $5, 'pending', $6)
           RETURNING *`,
          [form.id, title, documentType, index + 1, deadline.toISOString(), req.user.id]
        );
        created.push(result.rows[0]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const notifiedStudents = await notifyMatchingStudents(form, {
      title: isTimelineUpdate ? 'Project Timeline Updated' : PROJECT_TIMELINE_NOTIFICATION_TITLE,
      message: isTimelineUpdate
        ? 'Your project document submission timeline has been updated.'
        : PROJECT_TIMELINE_NOTIFICATION_MESSAGE,
      type: isTimelineUpdate ? 'project_timeline_updated' : 'project_timeline',
      referenceType: 'timeline'
    });

    res.status(201).json({
      success: true,
      form,
      timeline: created,
      notifiedStudents
    });
  } catch (error) {
    console.error('createRegistrationFormTimeline error:', error);
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
    const result = await db.pool.query(`
      UPDATE registration_form_submissions 
      SET status = 'Approved', remarks = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [remarks || null, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Note: To fully integrate with the app, we would also create an entry in 'projects' table here
    // but the prompt focused on HOD portal and assign mentor. We can assume we might create the project here later.
    const submission = result.rows[0];
    const notifiedStudents = await createTeamNotifications({
      projectRegistrationId: submission.id,
      title: 'Project Registration Approved',
      message: `Your project registration "${submission.project_title}" has been approved.`,
      type: 'approval',
      referenceId: submission.id,
      referenceType: 'approval'
    });

    res.json({
      success: true,
      notifiedStudents,
      data: submission
    });
  } catch (error) {
    console.error('approveRegistrationSubmission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.rejectRegistrationSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const result = await db.pool.query(`
      UPDATE registration_form_submissions 
      SET status = 'Rejected', remarks = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [remarks || null, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = result.rows[0];
    const notifiedStudents = await createTeamNotifications({
      projectRegistrationId: submission.id,
      title: 'Project Registration Rejected',
      message: `Your project registration "${submission.project_title}" has been rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
      type: 'rejection',
      referenceId: submission.id,
      referenceType: 'rejection'
    });

    res.json({
      success: true,
      notifiedStudents,
      data: submission
    });
  } catch (error) {
    console.error('rejectRegistrationSubmission error:', error);
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
    
    const submissionResult = await db.pool.query(`SELECT * FROM registration_form_submissions WHERE id = $1`, [submission_id]);
    if (submissionResult.rows.length === 0) return res.status(404).json({ message: 'Submission not found' });
    const submission = submissionResult.rows[0];
    
    // Find or create project
    const existingProjects = await db.pool.query(`SELECT * FROM projects WHERE title = $1 AND created_by = $2`, [submission.project_title, submission.leader_id]);
    let projectId = null;
    if (existingProjects.rows.length > 0) {
      projectId = existingProjects.rows[0].id;
      await db.pool.query(`UPDATE projects SET mentor_id = $1 WHERE id = $2`, [mentor_id, projectId]);
    } else {
      const newProject = await db.pool.query(`
        INSERT INTO projects (title, description, created_by, mentor_id, status)
        VALUES ($1, $2, $3, $4, 'In Progress')
        RETURNING id
      `, [submission.project_title, submission.abstract, submission.leader_id, mentor_id]);
      projectId = newProject.rows[0].id;
    }
    
    const result = await db.pool.query(`
      INSERT INTO mentor_assignments (mentor_id, project_id, assigned_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [mentor_id, projectId, assigned_by]);

    const mentorResult = await db.pool.query('SELECT full_name FROM users WHERE id = $1', [mentor_id]);
    const mentorName = mentorResult.rows[0]?.full_name || 'your mentor';
    const notifiedStudents = await createTeamNotifications({
      projectRegistrationId: submission.id,
      title: 'Mentor Assigned',
      message: `${mentorName} has been assigned as mentor for your project "${submission.project_title}".`,
      type: 'mentor_assignment',
      referenceId: result.rows[0].id,
      referenceType: 'mentor_assignment'
    });
    
    res.status(201).json({
      success: true,
      notifiedStudents,
      data: result.rows[0]
    });
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
