const db = require('../config/db');

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
exports.getTasksByProject = async (req, res) => {
  try {
    const [tasks] = await db.execute(
      `SELECT * FROM tasks
       WHERE project_id = ?
       ORDER BY due_date ASC NULLS LAST, created_at DESC`,
      [req.params.projectId]
    );
    // Parse JSON members field if present
    const parsed = tasks.map(t => ({
      ...t,
      members: (() => {
        try {
          if (typeof t.members === 'object' && t.members !== null) return t.members;
          return t.members ? JSON.parse(t.members) : [];
        }
        catch { return []; }
      })(),
    }));
    res.json(parsed);
  } catch (error) {
    console.error('getTasksByProject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  const { title, status, priority, projectId, members, comments, attachments, due_date } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: 'Title and projectId are required' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO tasks (title, status, priority, project_id, members, comments, attachments, created_by, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        status || 'Requirements',
        priority || 'Medium',
        projectId,
        JSON.stringify(members || []),
        comments || 0,
        attachments || 0,
        req.user.id,
        due_date || null,
      ]
    );

    const taskId = result.insertId;
    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const task = rows[0];

    res.status(201).json({
      ...task,
      members: (() => {
        try {
          if (typeof task.members === 'object' && task.members !== null) return task.members;
          return task.members ? JSON.parse(task.members) : [];
        }
        catch { return []; }
      })(),
    });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a task (full or partial)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  const { title, status, priority, members, comments, attachments, due_date } = req.body;

  try {
    const fields = [];
    const values = [];

    if (title !== undefined)       { fields.push('title = ?');       values.push(title); }
    if (status !== undefined)      { fields.push('status = ?');      values.push(status); }
    if (priority !== undefined)    { fields.push('priority = ?');    values.push(priority); }
    if (members !== undefined)     { fields.push('members = ?');     values.push(JSON.stringify(members)); }
    if (comments !== undefined)    { fields.push('comments = ?');    values.push(comments); }
    if (attachments !== undefined) { fields.push('attachments = ?'); values.push(attachments); }
    if (due_date !== undefined)    { fields.push('due_date = ?');    values.push(due_date || null); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.params.id);
    await db.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    const task = rows[0];
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({
      ...task,
      members: (() => {
        try {
          if (typeof task.members === 'object' && task.members !== null) return task.members;
          return task.members ? JSON.parse(task.members) : [];
        }
        catch { return []; }
      })(),
    });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
