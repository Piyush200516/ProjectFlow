const db = require('../config/db');
const { ensureNotificationsTable } = require('../utils/studentNotifications');

const ensureStudentProfileCompatibility = async () => {
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)`);
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(100)`);
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100)`);
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`);
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_locked BOOLEAN DEFAULT FALSE`);
  await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP`);
  await db.execute(`
    UPDATE students s
    SET full_name = COALESCE(s.full_name, u.full_name),
        email = COALESCE(s.email, u.email),
        branch_name = COALESCE(s.branch_name, (SELECT name FROM branches WHERE id = s.branch_id))
    FROM users u
    WHERE u.id = s.user_id
  `);
};

const ensureStudentTimelineColumns = async () => {
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
};

const normalizeComparable = (value) => String(value ?? '').trim().toLowerCase();
const normalizeRollNumber = (value) => String(value ?? '').trim().toUpperCase();

const sameAcademicProfile = (leader, member) => {
  return Number(leader.branch_id) === Number(member.branch_id)
    && normalizeComparable(leader.academic_year) === normalizeComparable(member.academic_year)
    && Number(leader.semester) === Number(member.semester)
    && normalizeComparable(leader.section) === normalizeComparable(member.section)
    && normalizeComparable(leader.subsection) === normalizeComparable(member.subsection);
};

const ensureProjectTeamMembersCompatibility = async (client = db.pool) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_team_members (
      id SERIAL PRIMARY KEY,
      submission_id INT,
      form_id INT,
      user_id INT,
      student_id INT,
      full_name VARCHAR(100),
      email VARCHAR(150),
      roll_number VARCHAR(50),
      branch_id INT,
      branch_name VARCHAR(100),
      academic_year VARCHAR(20),
      semester INT,
      section VARCHAR(10),
      subsection VARCHAR(10),
      role VARCHAR(50) DEFAULT 'Member',
      is_leader BOOLEAN DEFAULT FALSE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const statements = [
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS submission_id INT`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS form_id INT`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS user_id INT`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS student_id INT`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS email VARCHAR(150)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS branch_id INT`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS semester INT`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS section VARCHAR(10)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS subsection VARCHAR(10)`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member'`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS is_leader BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE project_team_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE project_team_members ALTER COLUMN submission_id DROP NOT NULL`,
    `ALTER TABLE project_team_members ALTER COLUMN form_id DROP NOT NULL`,
    `ALTER TABLE project_team_members ALTER COLUMN project_id DROP NOT NULL`,
    `ALTER TABLE project_team_members ALTER COLUMN user_id DROP NOT NULL`,
    `ALTER TABLE project_team_members ALTER COLUMN student_id DROP NOT NULL`
  ];

  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (error) {
      if (error.code !== '42703') {
        throw error;
      }
    }
  }
};

const getStudentProfileByUserId = async (client, userId) => {
  const { rows } = await client.query(`
    SELECT s.user_id,
           s.roll_number,
           s.branch_id,
           COALESCE(s.branch_name, b.name) AS branch_name,
           s.academic_year,
           s.semester,
           s.section,
           s.subsection,
           COALESCE(s.full_name, u.full_name) AS full_name,
           COALESCE(s.email, u.email) AS email
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN branches b ON b.id = s.branch_id
    WHERE s.user_id = $1
    LIMIT 1
  `, [userId]);
  return rows[0];
};

const getStudentByEmailAndRoll = async (client, email, rollNumber) => {
  const { rows } = await client.query(`
    SELECT s.user_id,
           s.roll_number,
           s.branch_id,
           COALESCE(s.branch_name, b.name) AS branch_name,
           s.academic_year,
           s.semester,
           s.section,
           s.subsection,
           COALESCE(s.full_name, u.full_name) AS full_name,
           COALESCE(s.email, u.email) AS email
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN branches b ON b.id = s.branch_id
    WHERE LOWER(COALESCE(s.email, u.email)) = LOWER($1)
      AND LOWER(s.roll_number) = LOWER($2)
      AND LOWER(u.role) = 'student'
    LIMIT 1
  `, [email, rollNumber]);
  return rows[0];
};

const getStudentsByEmailAndRoll = async (client, members) => {
  if (!members.length) return [];

  const { rows } = await client.query(`
    WITH input_members AS (
      SELECT *
      FROM jsonb_to_recordset($1::jsonb) AS x(email text, roll_number text)
    )
    SELECT DISTINCT ON (i.email, i.roll_number)
           i.email AS input_email,
           i.roll_number AS input_roll_number,
           s.user_id,
           s.roll_number,
           s.branch_id,
           COALESCE(s.branch_name, b.name) AS branch_name,
           s.academic_year,
           s.semester,
           s.section,
           s.subsection,
           COALESCE(s.full_name, u.full_name) AS full_name,
           COALESCE(s.email, u.email) AS email
    FROM input_members i
    JOIN students s ON TRUE
    JOIN users u ON u.id = s.user_id
    LEFT JOIN branches b ON b.id = s.branch_id
    WHERE LOWER(COALESCE(s.email, u.email)) = i.email
      AND UPPER(s.roll_number) = i.roll_number
      AND LOWER(u.role) = 'student'
    ORDER BY i.email, i.roll_number, s.user_id
  `, [JSON.stringify(members)]);

  return rows;
};

const toTeamMemberPayload = (student, role = 'Member') => ({
  user_id: student.user_id,
  name: student.full_name,
  full_name: student.full_name,
  email: normalizeComparable(student.email),
  roll_number: normalizeRollNumber(student.roll_number),
  branch_id: student.branch_id,
  branch_name: student.branch_name,
  academic_year: student.academic_year,
  semester: student.semester,
  section: student.section,
  subsection: student.subsection,
  role
});

exports.getProfile = async (req, res) => {
  try {
    await ensureStudentProfileCompatibility();
    const [students] = await db.execute(`
      SELECT
        u.full_name,
        u.email,
        s.roll_number,
        s.branch_id,
        b.name as branch_name,
        s.academic_year,
        s.semester,
        s.section,
        s.subsection,
        COALESCE(s.profile_locked, FALSE) as profile_locked,
        s.profile_updated_at
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN branches b ON b.id = s.branch_id
      WHERE u.id = $1 AND u.role = 'student'
    `, [req.user.id]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.json({ success: true, student: students[0] });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { semester } = req.body;
  const parsedSemester = Number(semester);

  if (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
    return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8' });
  }

  try {
    await ensureStudentProfileCompatibility();
    const updateResult = await db.pool.query(
      `UPDATE students
       SET semester = $1
       WHERE user_id = $2
       RETURNING user_id`,
      [parsedSemester, req.user.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const studentResult = await db.pool.query(`
      SELECT
        u.full_name,
        u.email,
        s.roll_number,
        s.branch_id,
        b.name as branch_name,
        s.academic_year,
        s.semester,
        s.section,
        s.subsection,
        COALESCE(s.profile_locked, FALSE) as profile_locked,
        s.profile_updated_at
      FROM users u
      JOIN students s ON s.user_id = u.id
      LEFT JOIN branches b ON b.id = s.branch_id
      WHERE u.id = $1
    `, [req.user.id]);

    res.json({
      success: true,
      message: 'Semester updated successfully',
      student: studentResult.rows[0]
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get active registration forms for a student based on their profile
// @route   GET /api/student/registration-forms/active
// @access  Private (Student)
exports.getActiveRegistrationForms = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student details
    const [studentData] = await db.execute(`
      SELECT s.user_id,
             s.branch_id,
             s.academic_year,
             s.semester,
             s.section,
             s.subsection,
             b.name as branch_name
      FROM students s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.user_id = $1
    `, [userId]);

    let student = null;
    let sBranch = null;
    let sYear = null;
    let sSemester = null;
    let sSection = null;
    let sSubsection = null;

    if (studentData.length > 0) {
      student = studentData[0];
      console.log("Student profile:", student);

      sBranch = student.branch || student.branch_name;
      sYear = student.year || student.academic_year;
      sSemester = student.semester;
      sSection = student.section;
      sSubsection = student.subsection;
    } else {
      console.log("Student profile not found. Using fallback.");
    }

    let forms = [];

    if (!student || !student.branch_id || !sYear || !sSemester || !sSection) {
      console.log("Student profile missing required details. No active forms loaded.");
      forms = [];
    } else {
      // Find matching published forms for the exact student profile
      const [matchingForms] = await db.execute(`
        SELECT rf.id,
               rf.title,
               rf.instructions,
               rf.branch,
               rf.branch_id,
               rf.academic_year,
               rf.semester,
               rf.section,
               rf.subsection,
               rf.team_size_min,
               rf.team_size_max,
               rf.project_type,
               rf.start_date,
               rf.deadline,
               rf.status,
               EXISTS (
                 SELECT 1
                 FROM registration_form_submissions rfs
                 WHERE rfs.form_id = rf.id AND rfs.leader_id = $6
               ) as has_submitted
        FROM registration_forms rf
        WHERE LOWER(status)='published'
        AND branch_id=$1
        AND academic_year=$2
        AND semester=$3
        AND section=$4
        AND (
          subsection = $5 OR subsection IS NULL OR subsection = ''
        )
        AND (deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)
        ORDER BY created_at DESC
        LIMIT 20
      `, [student.branch_id, sYear, sSemester, sSection, sSubsection || null, userId]);
      
      forms = matchingForms;
      console.log("Matched forms:", forms);

      if (!forms || forms.length === 0) {
        console.log("Strict matching returned 0 forms. Falling back to all published forms for testing.");
        const [allPublishedForms] = await db.execute(`
          SELECT rf.id,
                 rf.title,
                 rf.instructions,
                 rf.branch,
                 rf.branch_id,
                 rf.academic_year,
                 rf.semester,
                 rf.section,
                 rf.subsection,
                 rf.team_size_min,
                 rf.team_size_max,
                 rf.project_type,
                 rf.start_date,
                 rf.deadline,
                 rf.status,
                 EXISTS (
                   SELECT 1
                   FROM registration_form_submissions rfs
                   WHERE rfs.form_id = rf.id AND rfs.leader_id = $1
                 ) as has_submitted
          FROM registration_forms rf
          WHERE LOWER(status) = 'published'
            AND (deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)
          ORDER BY created_at DESC
          LIMIT 20
        `, [userId]);
        forms = allPublishedForms || [];
      }
    }

    console.log("Active forms found:", forms.length);
    res.json({ success: true, forms });
  } catch (error) {
    console.error('getActiveRegistrationForms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get timeline for the student's matching published registration form
// @route   GET /api/student/timeline
// @access  Private (Student)
exports.getStudentTimeline = async (req, res) => {
  try {
    await ensureStudentTimelineColumns();
    const userId = req.user.id;

    const [studentData] = await db.execute(`
      SELECT s.user_id,
             s.branch_id,
             s.academic_year,
             s.semester,
             s.section,
             s.subsection,
             b.name as branch_name
      FROM students s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.user_id = $1
    `, [userId]);

    if (studentData.length === 0) {
      console.log('Matched student form:', null);
      console.log('Timeline rows:', 0);
      return res.json({ success: true, form: null, timeline: [] });
    }

    const student = studentData[0];
    const [forms] = await db.execute(`
      SELECT rf.id,
             rf.title,
             rf.branch_id,
             rf.academic_year,
             rf.semester,
             rf.section,
             rf.subsection,
             rf.updated_at,
             rf.created_at,
             (
               SELECT COUNT(*)
               FROM project_milestones pm
               WHERE pm.registration_form_id = rf.id
             ) as timeline_count
      FROM registration_forms
      rf
      WHERE LOWER(status) = 'published'
        AND branch_id = $1
        AND academic_year = $2
        AND semester = $3
        AND section = $4
        AND (
          subsection IS NOT DISTINCT FROM $5
          OR subsection IS NULL
          OR subsection = ''
        )
      ORDER BY timeline_count DESC, updated_at DESC, created_at DESC
      LIMIT 1
    `, [
      student.branch_id,
      student.academic_year,
      student.semester,
      student.section,
      student.subsection || null
    ]);

    const form = forms[0] || null;
    console.log('Matched student form:', form);

    if (!form) {
      console.log('Timeline rows:', 0);
      return res.json({ success: true, form: null, timeline: [] });
    }

    const [milestones] = await db.execute(`
      SELECT id,
             title,
             description,
             document_type,
             sequence_no,
             sequence_order,
             deadline,
             created_at,
             updated_at,
             COALESCE(sequence_no, sequence_order) as display_sequence_no,
             CASE
               WHEN deadline < CURRENT_TIMESTAMP THEN 'Late'
               ELSE 'Pending'
             END as status
      FROM project_milestones
      WHERE registration_form_id = $1
      ORDER BY COALESCE(sequence_no, sequence_order) ASC, deadline ASC
    `, [form.id]);

    console.log('Timeline rows:', milestones.length);

    res.json({
      success: true,
      form,
      timeline: milestones
    });
  } catch (error) {
    console.error('getStudentTimeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit a project registration form
// @route   POST /api/student/registration-forms/:id/submit
// @access  Private (Student)
exports.submitRegistrationForm = async (req, res) => {
  const client = await db.pool.connect();
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
    const postedMembers = Array.isArray(team_members)
      ? team_members
          .map((member) => ({
            ...member,
            name: String(member?.name || '').trim(),
            email: normalizeComparable(member?.email),
            roll_number: normalizeRollNumber(member?.roll_number)
          }))
          .filter((member) => member.name || member.email || member.roll_number)
      : [];

    // Validation
    if (!project_title || !project_domain || !abstract) {
      return res.status(400).json({ message: 'Please provide all required project details' });
    }

    await ensureStudentProfileCompatibility();
    await ensureProjectTeamMembersCompatibility(client);

    // Get form details
    const formResult = await client.query(`
      SELECT id, status, team_size_min, team_size_max
      FROM registration_forms
      WHERE id = $1
    `, [id]);
    if (formResult.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }
    const form = formResult.rows[0];

    if ((form.status || '').toLowerCase() !== 'published') {
      return res.status(400).json({ message: 'This form is not currently accepting submissions' });
    }

    // Total members = leader + other members
    const totalMembers = postedMembers.length + 1;
    if (totalMembers < form.team_size_min || totalMembers > form.team_size_max) {
      return res.status(400).json({ 
        message: `Team size must be between ${form.team_size_min} and ${form.team_size_max} members (including leader)`
      });
    }

    const leaderProfile = await getStudentProfileByUserId(client, leaderId);
    if (!leaderProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const teamMembersForDuplicateCheck = [
      {
        email: leaderProfile.email,
        roll_number: leaderProfile.roll_number
      },
      ...postedMembers
    ];

    const emails = teamMembersForDuplicateCheck
      .map((member) => member.email?.trim().toLowerCase())
      .filter(Boolean);
    const uniqueEmails = new Set(emails);
    console.log("Emails:", emails);
    console.log("Unique emails:", [...uniqueEmails]);

    if (emails.length !== uniqueEmails.size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email found in team members'
      });
    }

    const rollNumbers = teamMembersForDuplicateCheck
      .map((member) => member.roll_number?.trim().toUpperCase())
      .filter(Boolean);
    const uniqueRollNumbers = new Set(rollNumbers);

    if (rollNumbers.length !== uniqueRollNumbers.size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate roll number found in team members'
      });
    }

    for (const [index, member] of postedMembers.entries()) {
      if (!String(member.name || '').trim() || !member.email || !member.roll_number) {
        return res.status(400).json({ message: `Please fill all details for Member ${index + 2}` });
      }
    }

    const matchedStudents = await getStudentsByEmailAndRoll(client, postedMembers);
    const matchedByKey = new Map(
      matchedStudents.map((student) => [`${student.input_email}|${student.input_roll_number}`, student])
    );
    const verifiedMembers = [];

    for (const member of postedMembers) {
      const email = normalizeComparable(member.email);
      const rollNumber = normalizeRollNumber(member.roll_number);
      const student = matchedByKey.get(`${email}|${rollNumber}`);

      if (!student) {
        return res.status(400).json({ message: `Team member not found for email ${email} and roll number ${rollNumber}` });
      }

      if (!sameAcademicProfile(leaderProfile, student)) {
        return res.status(400).json({
          message: 'All team members must belong to the same branch, year, semester, section and subsection.'
        });
      }

      verifiedMembers.push(toTeamMemberPayload(student));
    }

    const candidateUserIds = [leaderId, ...verifiedMembers.map((member) => member.user_id)];
    const candidateEmails = new Set([normalizeComparable(leaderProfile.email), ...verifiedMembers.map((member) => normalizeComparable(member.email))]);
    const candidateRolls = new Set([normalizeComparable(leaderProfile.roll_number), ...verifiedMembers.map((member) => normalizeComparable(member.roll_number))]);

    const existingSubmissions = await client.query(`
      SELECT 1
      FROM registration_form_submissions
      WHERE status IN ('Pending', 'Approved')
        AND (
          leader_id = ANY($1::int[])
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(team_members, '[]'::jsonb)) AS member
            WHERE NULLIF(member->>'user_id', '')::int = ANY($1::int[])
               OR LOWER(member->>'email') = ANY($2::text[])
               OR UPPER(member->>'roll_number') = ANY($3::text[])
          )
        )
      LIMIT 1
    `, [candidateUserIds, [...candidateEmails], [...candidateRolls]]);

    if (existingSubmissions.rows.length > 0) {
      return res.status(400).json({ message: 'One or more team members already have an active project or pending submission' });
    }

    const activeProjectMemberships = await client.query(`
      SELECT 1
      FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.student_id = ANY($1::int[])
        AND COALESCE(p.status, '') NOT IN ('Completed', 'Rejected')
      LIMIT 1
    `, [candidateUserIds]);

    if (activeProjectMemberships.rows.length > 0) {
      return res.status(400).json({ message: 'One or more team members already have an active project or pending submission' });
    }

    const leaderPayload = toTeamMemberPayload(leaderProfile, 'Team Leader');
    const teamMembersPayload = verifiedMembers;

    await client.query('BEGIN');

    // Insert the submission
    const result = await client.query(`
      INSERT INTO registration_form_submissions 
      (form_id, project_title, project_domain, problem_statement, abstract, tech_stack, leader_id, team_members, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
      RETURNING *
    `, [id, project_title, project_domain, problem_statement, abstract, tech_stack, leaderId, JSON.stringify(teamMembersPayload)]);

    const submission = result.rows[0];
    const allMembersForInsert = [leaderPayload, ...teamMembersPayload];
    const insertValues = [];
    const insertPlaceholders = allMembersForInsert.map((member, index) => {
      const offset = index * 14;
      insertValues.push(
        submission.id,
        id,
        member.user_id,
        member.full_name,
        member.email,
        member.roll_number,
        member.branch_id,
        member.branch_name,
        member.academic_year,
        member.semester,
        member.section,
        member.subsection,
        member.role,
        member.role === 'Team Leader'
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`;
    }).join(', ');

    await client.query(`
      INSERT INTO project_team_members
      (submission_id, form_id, user_id, student_id, full_name, email, roll_number, branch_id, branch_name, academic_year, semester, section, subsection, role, is_leader)
      VALUES ${insertPlaceholders}
    `, insertValues);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Project and team details registered successfully',
      submission: {
        ...submission,
        team_leader: leaderPayload,
        team_members: teamMembersPayload
      }
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('submitRegistrationForm rollback error:', rollbackError);
    }
    console.error('submitRegistrationForm error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// @desc    Get student notifications
// @route   GET /api/student/notifications
// @access  Private (Student)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    await ensureNotificationsTable();

    const result = await db.pool.query(`
      SELECT id,
             title,
             message,
             type,
             reference_id,
             reference_type,
             is_read,
             created_at,
             TO_CHAR(created_at, 'DD Mon YYYY') as notification_date,
             TO_CHAR(created_at, 'HH12:MI AM') as notification_time
      FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC, id DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    const countResult = await db.pool.query(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1`,
      [userId]
    );
    const notifications = result.rows;
    console.log("Notifications loaded:", notifications.length);
    res.json({
      success: true,
      notifications,
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/student/notifications/:id/read
// @access  Private (Student)
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await ensureNotificationsTable();
    const result = await db.pool.query(`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }
    
    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark all student notifications as read
// @route   PATCH /api/student/notifications/read-all
// @access  Private (Student)
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await ensureNotificationsTable();
    const result = await db.pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ success: true, updated: result.rowCount });
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
