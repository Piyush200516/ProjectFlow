const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

const EMAIL = 'hodcs@acropolis.in';
const PLAIN_PASSWORD = 'hod@123';
const ROLE = 'hod';
const FULL_NAME = 'Head of Department';

(async () => {
  try {
    const hash = await bcrypt.hash(PLAIN_PASSWORD, 10);
    // Check if HOD exists
    const [rows] = await db.execute('SELECT id FROM users WHERE role = $1', [ROLE]);
    if (rows.length > 0) {
      const userId = rows[0].id;
      await db.execute('UPDATE users SET email = $1, password_hash = $2, role = $3 WHERE id = $4', [EMAIL, hash, ROLE, userId]);
      console.log(`✅ Updated HOD (id ${userId}) with new email/password`);
    } else {
      const [result] = await db.execute('INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [FULL_NAME, EMAIL, hash, ROLE]);
      console.log(`✅ Created new HOD with id ${result.insertId}`);
    }
    await db.pool.end();
  } catch (err) {
    console.error('❌ Error upserting HOD:', err);
    process.exit(1);
  }
})();
