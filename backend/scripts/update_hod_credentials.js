const bcrypt = require('bcryptjs');
const db = require('../config/db');

const newEmail = 'hodcs@acropolis.in';
const plainPassword = 'hod@123';
const role = 'hod';

(async () => {
  try {
    const hashed = await bcrypt.hash(plainPassword, 10);
    // Check if HOD exists
    const [rows] = await db.execute('SELECT id FROM users WHERE role = ?', [role]);
    if (rows.length > 0) {
      // Update existing record(s)
      const result = await db.execute('UPDATE users SET email = ?, password_hash = ? WHERE role = ?', [newEmail, hashed, role]);
      console.log('HOD account updated. Rows affected:', result[0].affectedRows);
    } else {
      // Insert new HOD record
      const insert = await db.execute('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Head of Department', newEmail, hashed, role]);
      console.log('HOD account created with id:', insert[0].insertId);
    }
  } catch (err) {
    console.error('Error updating HOD credentials:', err);
  }
})();
