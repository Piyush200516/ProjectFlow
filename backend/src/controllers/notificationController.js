const db = require('../config/db');

const ensureNotificationCompatibility = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'Info',
      reference_id INT,
      reference_type VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INT`);
  await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50)`);
  await db.execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
  await db.execute(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50)`);
  await db.execute(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
};

exports.getNotifications = async (req, res) => {
  try {
    await ensureNotificationCompatibility();
    const [notifications] = await db.execute(
      `SELECT id,
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
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 3`,
      [req.user.id]
    );

    res.json(notifications);
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    await ensureNotificationCompatibility();
    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?
       RETURNING id,
                 title,
                 message,
                 type,
                 reference_id,
                 reference_type,
                 is_read,
                 created_at,
                 TO_CHAR(created_at, 'DD Mon YYYY') as notification_date,
                 TO_CHAR(created_at, 'HH12:MI AM') as notification_time`,
      [req.params.id, req.user.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, notification: result[0] });
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await ensureNotificationCompatibility();
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
