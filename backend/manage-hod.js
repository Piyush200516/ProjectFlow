const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fetch = require('node-fetch');

// Build pool config – disable SSL for local DB, enable for remote (Neon)
const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString && connectionString.includes('localhost');
const pool = new Pool({
  connectionString,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

const HOD_EMAIL = 'hodcs@acropolis.in';
const HOD_PASSWORD = 'hod@123';
const HOD_NAME = 'HOD Computer Science';

async function upsertHOD() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT id, email, role, password_hash FROM users WHERE role = $1 OR email = $2",
      ['hod', HOD_EMAIL]
    );
    console.log('🔍 Existing HOD rows:', rows);
    const hash = await bcrypt.hash(HOD_PASSWORD, 10);
    if (rows.length > 0) {
      const hodId = rows[0].id;
      await client.query(
        "UPDATE users SET email = $1, password_hash = $2, role = $3 WHERE id = $4",
        [HOD_EMAIL, hash, 'hod', hodId]
      );
      console.log('✅ Updated HOD (id', hodId, ') with new email & password hash');
    } else {
      const { rows: ins } = await client.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
        [HOD_NAME, HOD_EMAIL, hash, 'hod']
      );
      console.log('✅ Created new HOD with id', ins[0].id);
    }
    console.log('🔐 Password hash used:', hash);
  } finally {
    client.release();
  }
}

async function testLogin() {
  // Adjust the URL to your deployed Netlify site or local dev server
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  const url = `${base}/api/auth/login`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: HOD_EMAIL, password: HOD_PASSWORD }),
    });
    const data = await res.json();
    console.log('🚀 Login API response (status', res.status, '):', data);
  } catch (e) {
    console.error('❌ Error calling login API:', e);
  }
}

(async () => {
  try {
    await upsertHOD();
    await testLogin();
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  } finally {
    await pool.end();
  }
})();
