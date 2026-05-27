const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const result = await pool.query(
    'SELECT id, email, role, password_hash FROM users WHERE email = $1 OR role = $2',
    ['hodcs@acropolis.in', 'hod']
  );
  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
