const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// @desc    Get all documents for a project
// @route   GET /api/documents/project/:projectId
// @access  Private
exports.getDocumentsByProject = async (req, res) => {
  try {
    const [docs] = await db.execute(
      'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json(docs);
  } catch (error) {
    console.error('getDocumentsByProject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const fileExt = path.extname(req.file.originalname).replace('.', '').toUpperCase();
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';

    // Build a URL the frontend can use to download the file
    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;

    const [result] = await db.execute(
      `INSERT INTO documents (project_id, uploaded_by, original_name, file_path, file_type, file_size, url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        req.user.id,
        req.file.originalname,
        req.file.filename,
        fileExt,
        fileSizeMB,
        fileUrl,
      ]
    );

    const docId = result.insertId;
    const [rows] = await db.execute('SELECT * FROM documents WHERE id = ?', [docId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('uploadDocument error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    const doc = rows[0];

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove file from disk if it exists
    if (doc.file_path) {
      const filePath = path.join(__dirname, '../../public/uploads', doc.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('deleteDocument error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
