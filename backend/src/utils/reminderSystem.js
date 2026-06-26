const db = require('../config/db');

/**
 * Auto Reminder Engine:
 * Scans milestones and administrative registration form deadlines.
 * Automatically posts in-app alerts and mocks email triggers for:
 * - 7 days remaining
 * - 3 days remaining
 * - 1 day remaining
 * - Deadline day
 * - Overdue status
 */
async function checkDeadlinesAndSendReminders() {
  console.log('[AutoReminder] Executing daily deadline scan...');
  try {
    const now = new Date();

    // 1. Scan project_milestones document timeline (only if table exists)
    const { tableExists } = db;
    const hasMilestones = tableExists ? await tableExists('project_milestones') : false;
    if (hasMilestones) {
      const [milestones] = await db.execute(`
        SELECT m.*, p.title as project_title, pm.student_id
        FROM project_milestones m
        JOIN projects p ON m.project_id = p.id
        JOIN project_members pm ON p.id = pm.project_id
        WHERE m.project_id IS NOT NULL
      `);

      for (const milestone of milestones) {
        const deadline = new Date(milestone.deadline);
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if student has already submitted
        const [submissions] = await db.execute(
          `SELECT id FROM milestone_submissions WHERE milestone_id = ? AND submitted_by = ?`,
          [milestone.id, milestone.student_id]
        );

        if (submissions.length > 0) {
          continue; // Already submitted, skip reminders
        }

        let title = '';
        let message = '';
        let type = 'Warning';

        if (diffDays === 7) {
          title = `Milestone Reminder: 7 Days Remaining`;
          message = `The milestone "${milestone.title}" for your project "${milestone.project_title}" is due in 7 days (${deadline.toLocaleDateString()}). Please submit on time.`;
        } else if (diffDays === 3) {
          title = `Milestone Urgent Reminder: 3 Days Left`;
          message = `Urgent! Only 3 days left to submit the milestone "${milestone.title}" for "${milestone.project_title}". Please finalize your deliverable.`;
        } else if (diffDays === 1) {
          title = `Milestone Critical Alert: Due Tomorrow`;
          message = `Critical! The milestone "${milestone.title}" is due tomorrow. Avoid late submissions to secure full timeliness marks!`;
          type = 'Danger';
        } else if (diffDays === 0 && diffTime > 0) {
          title = `Milestone Due Today!`;
          message = `Today is the deadline for "${milestone.title}". Submit before midnight.`;
          type = 'Danger';
        } else if (diffDays < 0) {
          title = `Milestone OVERDUE: Submit Now`;
          message = `The milestone "${milestone.title}" is overdue by ${Math.abs(diffDays)} days. Submit immediately; late penalties are actively being applied!`;
          type = 'Danger';
        }

        if (title) {
          // Check if reminder was already sent today to avoid spamming
          const [existing] = await db.execute(
            `SELECT id FROM notifications 
             WHERE user_id = ? AND title = ? AND created_at > CURRENT_DATE`,
            [milestone.student_id, title]
          );

          if (existing.length === 0) {
            // Log Notification
            await db.execute(
              `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
              [milestone.student_id, title, message, type]
            );

            // Mock email-ready placeholder log
            console.log(`[AutoReminder MOCK EMAIL] Sent to student ${milestone.student_id}: "${title}" - "${message}"`);
          }
        }
      }
    } else {
      console.log('[AutoReminder] Skipping milestone scan: project_milestones table does not exist yet.');
    }

    // 2. Scan HOD Administrative Registration Form Deadlines
    const hasDeadlines = tableExists ? await tableExists('deadlines') : false;
    if (hasDeadlines) {
      const [deadlines] = await db.execute(`
        SELECT d.*, s.user_id as student_id, u.full_name
        FROM deadlines d
        CROSS JOIN students s
        JOIN users u ON s.user_id = u.id
      `);

      for (const dl of deadlines) {
        const deadlineDate = new Date(dl.deadline_date);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if student has already registered
        const [submissions] = await db.execute(
          `SELECT id FROM project_registrations WHERE deadline_id = ? AND created_by = ?`,
          [dl.id, dl.student_id]
        );

        if (submissions.length > 0) {
          continue;
        }

        let title = '';
        let message = '';
        let type = 'Warning';

        if (diffDays === 3) {
          title = `Project Registration Reminder`;
          message = `Hi ${dl.full_name}, the registration for "${dl.title}" is due in 3 days. Please form your team of 4 and submit the project registration.`;
        } else if (diffDays === 1) {
          title = `Urgent Project Registration due Tomorrow`;
          message = `Urgent: The project registration deadline for "${dl.title}" is tomorrow. Please submit details immediately.`;
          type = 'Danger';
        }

        if (title) {
          const [existing] = await db.execute(
            `SELECT id FROM notifications 
             WHERE user_id = ? AND title = ? AND created_at > CURRENT_DATE`,
            [dl.student_id, title]
          );

          if (existing.length === 0) {
            await db.execute(
              `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
              [dl.student_id, title, message, type]
            );
            console.log(`[AutoReminder MOCK EMAIL] Sent to student ${dl.student_id}: "${title}" - "${message}"`);
          }
        }
      }
    } else {
      console.log('[AutoReminder] Skipping deadline scan: deadlines table does not exist yet.');
    }

  } catch (error) {
    console.error('[AutoReminder] Error in auto reminder engine:', error);
  }
}

/**
 * Initializes the reminder system to scan every 24 hours.
 */
function startReminderSystem() {
  console.log('[AutoReminder] Initializing Auto Reminder Engine...');
  // Run immediately on server start
  checkDeadlinesAndSendReminders();
  // Set interval to run once a day (86400000 ms)
  setInterval(checkDeadlinesAndSendReminders, 24 * 60 * 60 * 1000);
}

module.exports = {
  startReminderSystem,
  checkDeadlinesAndSendReminders
};
