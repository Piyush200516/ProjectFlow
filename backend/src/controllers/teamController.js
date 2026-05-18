const db = require('../config/db');

// @desc    Invite a student to the team
// @route   POST /api/team/invite
// @access  Private (Student)
exports.inviteMember = async (req, res) => {
  const { email, rollNumber } = req.body;
  const inviterId = req.user.id;

  if (!email || !rollNumber) {
    return res.status(400).json({ message: 'Both Email and Roll Number are required' });
  }

  try {
    // 1. Find the inviter's active project where they are the leader
    const [inviterProjects] = await db.execute(
      `SELECT p.id, p.title, p.team_name 
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.student_id = ? AND pm.is_leader = true AND p.status NOT IN ('Completed', 'Rejected')`,
      [inviterId]
    );

    if (inviterProjects.length === 0) {
      return res.status(400).json({ 
        message: 'You must be the team leader of an active project to invite members.' 
      });
    }

    const project = inviterProjects[0];
    const projectId = project.id;

    // 2. Enforce the max 5 members limit
    const [memberCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM project_members WHERE project_id = ?',
      [projectId]
    );

    const currentCount = parseInt(memberCountResult[0].count || memberCountResult[0].COUNT || 0);
    if (currentCount >= 5) {
      return res.status(400).json({ 
        message: 'Your project team has already reached the maximum limit of 5 members.' 
      });
    }

    // 3. Find the invited student by email and roll number (with robust logging & matching)
    const trimmedEmail = email.trim();
    const trimmedRollNumber = rollNumber.trim();
    console.log(`[Team Invite] Invite lookup request - email: "${trimmedEmail}", rollNumber: "${trimmedRollNumber}"`);

    const [users] = await db.execute(
      `SELECT u.id, u.role, u.full_name, u.is_active 
       FROM users u
       JOIN students s ON u.id = s.user_id
       WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?)) AND TRIM(s.roll_number) = TRIM(?) AND u.role = 'student'`,
      [trimmedEmail, trimmedRollNumber]
    );

    console.log(`[Team Invite] Match found in DB count: ${users.length}`);

    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'Student with the specified Email and Roll Number does not exist.' 
      });
    }

    const invitedStudent = users[0];
    const invitedStudentId = invitedStudent.id;

    // Debug logs as requested
    console.log('[Team Invite DEBUG] current user id:', inviterId);
    console.log('[Team Invite DEBUG] invited user id:', invitedStudentId);
    console.log('[Team Invite DEBUG] invited email:', trimmedEmail);
    console.log('[Team Invite DEBUG] invited roll number:', trimmedRollNumber);

    // 4. Ensure they aren't inviting themselves (comparing current logged-in student id with invited student id only, cast to number)
    const inviterIdNum = Number(inviterId);
    const invitedStudentIdNum = Number(invitedStudentId);

    if (isNaN(inviterIdNum) || isNaN(invitedStudentIdNum)) {
      console.log('[Team Invite DEBUG] Warning: One of the IDs is NaN. Preventing false self-detection.');
    }

    if (!isNaN(inviterIdNum) && !isNaN(invitedStudentIdNum) && invitedStudentIdNum === inviterIdNum) {
      return res.status(400).json({ message: 'You cannot invite yourself to your own team.' });
    }

    // 5. Ensure the invited user role is "student"
    if (invitedStudent.role !== 'student') {
      return res.status(400).json({ message: 'Only students can be invited to a project team.' });
    }

    // 6. Ensure the student is not already in this project team
    const [alreadyMember] = await db.execute(
      'SELECT 1 FROM project_members WHERE project_id = ? AND student_id = ?',
      [projectId, invitedStudentId]
    );

    if (alreadyMember.length > 0) {
      return res.status(400).json({ message: 'Student is already a member of your project team.' });
    }

    // 7. Ensure the invited student is not working on another active project
    const [studentActiveProjects] = await db.execute(
      `SELECT p.id, p.title 
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')`,
      [invitedStudentId]
    );

    const [studentActiveSubmissions] = await db.execute(
      `SELECT pfs.id FROM project_form_submissions pfs
       JOIN team_members tm ON pfs.id = tm.submission_id
       WHERE tm.student_id = ? AND pfs.status = 'Pending'`,
      [invitedStudentId]
    );

    if (studentActiveProjects.length > 0 || studentActiveSubmissions.length > 0) {
      return res.status(400).json({ 
        message: 'This student is already working on another project.' 
      });
    }

    // 8. Ensure no duplicate pending invitation exists
    const [existingInvites] = await db.execute(
      `SELECT invite_id FROM team_invitations 
       WHERE project_id = ? AND invited_student_id = ? AND status = 'Pending'`,
      [projectId, invitedStudentId]
    );

    if (existingInvites.length > 0) {
      return res.status(400).json({ 
        message: 'An invitation is already pending for this student.' 
      });
    }

    // 9. Create the invitation
    await db.execute(
      `INSERT INTO team_invitations (project_id, inviter_id, invited_student_id, status)
       VALUES (?, ?, ?, 'Pending') RETURNING invite_id`,
      [projectId, inviterId, invitedStudentId]
    );

    // 10. Generate real-time in-app notification in notifications table
    const inviteMessage = `You have been invited to join Team ${project.team_name} for Project ${project.title}`;
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, 'Team Invitation', ?, 'Info', false)`,
      [invitedStudentId, inviteMessage]
    );

    res.status(201).json({ 
      success: true,
      message: 'Team invitation sent successfully!' 
    });
  } catch (error) {
    console.error('inviteMember error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all pending team invitations for the student
// @route   GET /api/team/invitations
// @access  Private (Student)
exports.getInvitations = async (req, res) => {
  const studentId = req.user.id;

  try {
    const [invitations] = await db.execute(
      `SELECT ti.invite_id, ti.project_id, ti.inviter_id, ti.status, ti.created_at,
              p.title as project_title, p.team_name,
              u.full_name as inviter_name
       FROM team_invitations ti
       JOIN projects p ON ti.project_id = p.id
       JOIN users u ON ti.inviter_id = u.id
       WHERE ti.invited_student_id = ? AND ti.status = 'Pending'
       ORDER BY ti.created_at DESC`,
      [studentId]
    );

    res.json(invitations);
  } catch (error) {
    console.error('getInvitations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept a team invitation
// @route   POST /api/team/accept
// @access  Private (Student)
exports.acceptInvitation = async (req, res) => {
  const { inviteId } = req.body;
  const studentId = req.user.id;

  if (!inviteId) {
    return res.status(400).json({ message: 'Invite ID is required' });
  }

  try {
    // 1. Find the invitation
    const [invitations] = await db.execute(
      `SELECT ti.*, p.title as project_title, p.team_name, u.full_name as inviter_name
       FROM team_invitations ti
       JOIN projects p ON ti.project_id = p.id
       JOIN users u ON ti.inviter_id = u.id
       WHERE ti.invite_id = ? AND ti.invited_student_id = ? AND ti.status = 'Pending'`,
      [inviteId, studentId]
    );

    if (invitations.length === 0) {
      return res.status(404).json({ message: 'Invitation not found or already processed.' });
    }

    const invite = invitations[0];
    const projectId = invite.project_id;
    const inviterId = invite.inviter_id;

    // 2. Ensure student does not already belong to an active project
    const [activeProjects] = await db.execute(
      `SELECT p.id FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.student_id = ? AND p.status NOT IN ('Completed', 'Rejected')`,
      [studentId]
    );

    const [activeSubmissions] = await db.execute(
      `SELECT pfs.id FROM project_form_submissions pfs
       JOIN team_members tm ON pfs.id = tm.submission_id
       WHERE tm.student_id = ? AND pfs.status = 'Pending'`,
      [studentId]
    );

    if (activeProjects.length > 0 || activeSubmissions.length > 0) {
      return res.status(400).json({ 
        message: 'You are already part of an active team.' 
      });
    }

    // 3. Ensure the project is still active
    const [projects] = await db.execute(
      `SELECT status FROM projects WHERE id = ?`,
      [projectId]
    );

    if (projects.length === 0 || projects[0].status === 'Completed' || projects[0].status === 'Rejected') {
      return res.status(400).json({ message: 'The project is no longer active.' });
    }

    // 4. Enforce team capacity of 5 members at the time of accepting
    const [memberCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM project_members WHERE project_id = ?',
      [projectId]
    );

    const currentCount = parseInt(memberCountResult[0].count || memberCountResult[0].COUNT || 0);
    if (currentCount >= 5) {
      return res.status(400).json({ 
        message: 'The project team has already reached its maximum capacity of 5 members.' 
      });
    }

    // 5. Update invitation status to 'Accepted'
    await db.execute(
      `UPDATE team_invitations SET status = 'Accepted' WHERE invite_id = ?`,
      [inviteId]
    );

    // 6. Add student to project_members
    await db.execute(
      `INSERT INTO project_members (project_id, student_id, is_leader) VALUES (?, ?, false)`,
      [projectId, studentId]
    );

    // 7. Auto-reject all other pending invitations for this student
    await db.execute(
      `UPDATE team_invitations SET status = 'Rejected' WHERE invited_student_id = ? AND status = 'Pending'`,
      [studentId]
    );

    // 8. Send notification to the team leader/inviter
    const acceptMessage = `${req.user.full_name} has accepted your invitation to join Team ${invite.team_name} for Project ${invite.project_title}.`;
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, 'Invitation Accepted', ?, 'Success', false)`,
      [inviterId, acceptMessage]
    );

    res.json({ 
      success: true, 
      message: 'Invitation accepted successfully! You have joined the team.' 
    });
  } catch (error) {
    console.error('acceptInvitation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject a team invitation
// @route   POST /api/team/reject
// @access  Private (Student)
exports.rejectInvitation = async (req, res) => {
  const { inviteId } = req.body;
  const studentId = req.user.id;

  if (!inviteId) {
    return res.status(400).json({ message: 'Invite ID is required' });
  }

  try {
    // 1. Find the invitation
    const [invitations] = await db.execute(
      `SELECT ti.*, p.team_name 
       FROM team_invitations ti
       JOIN projects p ON ti.project_id = p.id
       WHERE ti.invite_id = ? AND ti.invited_student_id = ? AND ti.status = 'Pending'`,
      [inviteId, studentId]
    );

    if (invitations.length === 0) {
      return res.status(404).json({ message: 'Invitation not found or already processed.' });
    }

    const invite = invitations[0];
    const inviterId = invite.inviter_id;

    // 2. Update status to 'Rejected'
    await db.execute(
      `UPDATE team_invitations SET status = 'Rejected' WHERE invite_id = ?`,
      [inviteId]
    );

    // 3. Send rejection notification to the inviter
    const rejectMessage = `${req.user.full_name} has rejected your invitation to join Team ${invite.team_name}.`;
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, 'Invitation Rejected', ?, 'Warning', false)`,
      [inviterId, rejectMessage]
    );

    res.json({ 
      success: true, 
      message: 'Invitation rejected successfully.' 
    });
  } catch (error) {
    console.error('rejectInvitation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complete team project workspace details
// @route   GET /api/team/project/:projectId
// @access  Private
exports.getTeamProject = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // 1. Check access: user must be a member of this project, or be a mentor/hod/cdc/admin
    if (role === 'student') {
      const [memberships] = await db.execute(
        'SELECT 1 FROM project_members WHERE project_id = ? AND student_id = ?',
        [projectId, userId]
      );
      if (memberships.length === 0) {
        return res.status(403).json({ message: 'Access denied. You are not a member of this project team.' });
      }
    }

    // 2. Fetch project metadata
    const [projects] = await db.execute(
      `SELECT p.*, m.full_name as mentor_name, m.email as mentor_email 
       FROM projects p
       LEFT JOIN users m ON p.mentor_id = m.id
       WHERE p.id = ?`,
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const project = projects[0];

    // 3. Fetch team members list with students metadata (like roll number)
    const [members] = await db.execute(
      `SELECT pm.id as member_id, pm.is_leader, pm.joined_at, u.id as user_id, u.full_name, u.email, s.roll_number
       FROM project_members pm
       JOIN users u ON pm.student_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       WHERE pm.project_id = ?
       ORDER BY pm.is_leader DESC, u.full_name ASC`,
      [projectId]
    );

    // 4. Fetch milestones/deadlines
    const [milestones] = await db.execute(
      'SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC',
      [projectId]
    );

    // 5. Fetch tasks
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    // 6. Fetch documents
    const [documents] = await db.execute(
      'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    // 7. Fetch submissions
    const [submissions] = await db.execute(
      `SELECT ds.*, da.title as assignment_title, da.due_date as assignment_due_date
       FROM document_submissions ds
       JOIN document_assignments da ON ds.assignment_id = da.id
       WHERE ds.project_id = ?
       ORDER BY ds.submitted_at DESC`,
      [projectId]
    );

    res.json({
      project,
      members,
      milestones,
      tasks,
      documents,
      submissions
    });
  } catch (error) {
    console.error('getTeamProject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/team/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const [notifications] = await db.execute(
      'SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/team/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.execute(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
