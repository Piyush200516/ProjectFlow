const db = require("../config/db");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows
    });

  } catch (error) {
    console.error("Notification fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    await db.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      `,
      [notificationId]
    );

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await db.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};