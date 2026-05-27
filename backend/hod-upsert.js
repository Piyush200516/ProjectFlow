const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

const HOD_EMAIL = 'hodcs@acropolis.in';
const HOD_PASSWORD = 'hod@123';
const HOD_ROLE = 'hod';
const HOD_NAME = 'Head of Department';

(async () => {
  try {
    // Generate hash
    const hash = await bcrypt.hash(HOD_PASSWORD, 10);
    console.log('Generated hash:', hash);

    // Check if a HOD record exists
    const [rows] = await db.execute('SELECT id, email FROM users WHERE role = $1', [HOD_ROLE]);
    if (rows.length > 0) {
      const hodId = rows[0].id;
      await db.execute('UPDATE users SET email = $1, password_hash = $2, role = $3 WHERE id = $4', [HOD_EMAIL, hash, HOD_ROLE, hodId]);
      console.log(`✅ Updated existing HOD (id ${hodId})`);
    } else {
      const [result] = await db.execute('INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id', [HOD_NAME, HOD_EMAIL, hash, HOD_ROLE]);
      console.log('✅ Inserted new HOD with id', result.insertId || result[0].id);
    }
  } catch (err) {
    console.error('❌ Error in HOD upsert script:', err);
    process.exit(1);
  }
})();
