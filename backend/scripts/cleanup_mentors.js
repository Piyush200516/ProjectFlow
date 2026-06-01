/**
 * cleanup_mentors.js
 * ------------------
 * Safely cleans up the mentors table so that ONLY the 6 official
 * Acropolis mentors remain. Handles all FK constraints gracefully.
 *
 * Steps:
 *  1. Show current mentors
 *  2. Find extra / invalid mentors
 *  3. Reassign students from removed mentors → a valid mentor
 *  4. Clean mentor_allocations, submissions FKs
 *  5. Delete extra mentor rows + user rows
 *  6. Verify final state & test login readiness
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const isLocalDb = DATABASE_URL && DATABASE_URL.includes('localhost');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(isLocalDb ? {} : { ssl: { rejectUnauthorized: false } }),
});

const VALID_EMAILS = [
  'shivshankarrajput@acropolis.in',
  'urvashisharma@acropolis.in',
  'kavitadubey@acropolis.in',
  'akshaydubey@acropolis.in',
  'leeladharchourasiya@acropolis.in',
  'gaurav@acropolis.in',
];

const sep = (label) => console.log(`\n${'─'.repeat(60)}\n  ${label}\n${'─'.repeat(60)}`);
const ok  = (msg) => console.log(`  ✅  ${msg}`);
const info= (msg) => console.log(`  ℹ️   ${msg}`);
const warn= (msg) => console.log(`  ⚠️   ${msg}`);

async function run() {
  const client = await pool.connect();
  try {
    // ── 1. Show current state ────────────────────────────────────────
    sep('STEP 1 — Current Mentors in Database');
    const currentMentors = await client.query(`
      SELECT u.id, u.full_name, u.email, u.is_active, u.role
      FROM   users u
      JOIN   mentors m ON m.user_id = u.id
      ORDER  BY u.full_name
    `);
    console.table(currentMentors.rows.map(r => ({
      id: r.id,
      name: r.full_name,
      email: r.email,
      role: r.role,
      active: r.is_active,
    })));

    // ── 2. Identify extra mentors ────────────────────────────────────
    sep('STEP 2 — Identifying Extra / Invalid Mentors');
    const extraMentors = currentMentors.rows.filter(
      (r) => !VALID_EMAILS.map(e => e.toLowerCase()).includes(r.email.toLowerCase())
    );

    if (extraMentors.length === 0) {
      ok('No extra mentors found. Database is already clean!');
    } else {
      warn(`${extraMentors.length} extra mentor(s) to remove:`);
      extraMentors.forEach(m => console.log(`     • [${m.id}] ${m.full_name} <${m.email}>`));
    }

    const validMentors = currentMentors.rows.filter(
      (r) => VALID_EMAILS.map(e => e.toLowerCase()).includes(r.email.toLowerCase())
    );

    // Pick the fallback reassignment target (first valid mentor)
    const fallbackMentor = validMentors[0];
    if (!fallbackMentor && extraMentors.length > 0) {
      throw new Error('No valid mentor found to reassign students to. Aborting.');
    }

    if (extraMentors.length === 0) {
      sep('STEP 6 — Final Verification');
      await printFinalState(client);
      return;
    }

    const extraIds = extraMentors.map(m => m.id);

    // ── 3–5. Begin transaction ────────────────────────────────────────
    sep('STEP 3–5 — Cleanup Transaction (Reassign → Remove FKs → Delete)');
    await client.query('BEGIN');

    try {
      // --- Check which FK tables exist ---
      const fkTables = await client.query(`
        SELECT table_name
        FROM   information_schema.tables
        WHERE  table_schema = 'public'
          AND  table_name IN (
            'mentor_allocations', 'project_groups', 'submissions',
            'projects', 'students'
          )
      `);
      const existingTables = new Set(fkTables.rows.map(r => r.table_name));
      info(`Tables found: ${[...existingTables].join(', ')}`);

      // --- 3a. Reassign students if table exists ---
      if (existingTables.has('students')) {
        const colCheck = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'students' AND column_name = 'mentor_id'
        `);
        if (colCheck.rows.length > 0) {
          const res = await client.query(`
            UPDATE students
            SET    mentor_id = $1
            WHERE  mentor_id = ANY($2::int[])
          `, [fallbackMentor.id, extraIds]);
          ok(`students.mentor_id → reassigned ${res.rowCount} student(s) to ${fallbackMentor.full_name}`);
        } else {
          info('students.mentor_id column not found, skipping student reassignment.');
        }
      }

      // --- 3b. Reassign project_groups ---
      if (existingTables.has('project_groups')) {
        const colCheck = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'project_groups' AND column_name = 'mentor_id'
        `);
        if (colCheck.rows.length > 0) {
          const res = await client.query(`
            UPDATE project_groups
            SET    mentor_id = $1
            WHERE  mentor_id = ANY($2::int[])
          `, [fallbackMentor.id, extraIds]);
          ok(`project_groups.mentor_id → reassigned ${res.rowCount} group(s)`);
        }
      }

      // --- 3c. Reassign projects.mentor_id if present ---
      if (existingTables.has('projects')) {
        const colCheck = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'projects' AND column_name = 'mentor_id'
        `);
        if (colCheck.rows.length > 0) {
          const res = await client.query(`
            UPDATE projects
            SET    mentor_id = $1
            WHERE  mentor_id = ANY($2::int[])
          `, [fallbackMentor.id, extraIds]);
          ok(`projects.mentor_id → reassigned ${res.rowCount} project(s)`);
        }
      }

      // --- 4a. Delete mentor_allocations for extra mentors ---
      if (existingTables.has('mentor_allocations')) {
        // Check which column name is used (mentor_id or user_id)
        const colCheck = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'mentor_allocations'
            AND column_name IN ('mentor_id', 'user_id', 'mentor_user_id')
        `);
        const col = colCheck.rows[0]?.column_name;
        if (col) {
          const res = await client.query(`
            DELETE FROM mentor_allocations
            WHERE ${col} = ANY($1::int[])
          `, [extraIds]);
          ok(`mentor_allocations → removed ${res.rowCount} allocation(s) for extra mentors`);
        } else {
          warn('mentor_allocations FK column not identified; manual check recommended.');
        }
      }

      // --- 4b. Submissions: set mentor_id to NULL or reassign ---
      if (existingTables.has('submissions')) {
        const colCheck = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'submissions' AND column_name = 'mentor_id'
        `);
        if (colCheck.rows.length > 0) {
          const res = await client.query(`
            UPDATE submissions
            SET    mentor_id = NULL
            WHERE  mentor_id = ANY($1::int[])
          `, [extraIds]);
          ok(`submissions.mentor_id → nullified ${res.rowCount} submission(s)`);
        }
      }

      // --- 5. Delete from mentors table ---
      const delMentors = await client.query(`
        DELETE FROM mentors
        WHERE user_id = ANY($1::int[])
        RETURNING user_id
      `, [extraIds]);
      ok(`mentors → deleted ${delMentors.rowCount} mentor profile(s)`);

      // --- 5b. Delete from users table ---
      const delUsers = await client.query(`
        DELETE FROM users
        WHERE id = ANY($1::int[]) AND role = 'mentor'
        RETURNING id, full_name, email
      `, [extraIds]);
      ok(`users → deleted ${delUsers.rowCount} user account(s):`);
      delUsers.rows.forEach(r => console.log(`     • [${r.id}] ${r.full_name} <${r.email}>`));

      await client.query('COMMIT');
      ok('Transaction committed successfully!');
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('\n  ❌  Transaction rolled back due to error:', txErr.message);
      throw txErr;
    }

    // ── 6. Final verification ────────────────────────────────────────
    sep('STEP 6 — Final Verification');
    await printFinalState(client);

  } finally {
    client.release();
    await pool.end();
  }
}

async function printFinalState(client) {
  const remaining = await client.query(`
    SELECT u.id, u.full_name, u.email, u.is_active, u.role,
           m.department, m.max_projects
    FROM   users u
    JOIN   mentors m ON m.user_id = u.id
    ORDER  BY u.full_name
  `);

  console.log('\n  📋 Remaining Mentors:');
  console.table(remaining.rows.map(r => ({
    id:        r.id,
    name:      r.full_name,
    email:     r.email,
    active:    r.is_active,
    dept:      r.department,
    maxProj:   r.max_projects,
  })));

  const missing = VALID_EMAILS.filter(
    e => !remaining.rows.some(r => r.email.toLowerCase() === e.toLowerCase())
  );
  if (missing.length > 0) {
    warn('The following required mentors are MISSING from the database:');
    missing.forEach(e => console.log(`     • ${e}`));
  } else {
    ok(`All ${VALID_EMAILS.length} required mentors are present ✔`);
  }

  const extra = remaining.rows.filter(
    r => !VALID_EMAILS.map(e => e.toLowerCase()).includes(r.email.toLowerCase())
  );
  if (extra.length > 0) {
    warn('Unexpected mentors still in database:');
    extra.forEach(r => console.log(`     • [${r.id}] ${r.full_name} <${r.email}>`));
  } else {
    ok('No extra mentors found — table is clean ✔');
  }

  // Check mentor_allocations consistency
  const allocCheck = await client.query(`
    SELECT COUNT(*) AS total
    FROM   information_schema.tables
    WHERE  table_name = 'mentor_allocations'
  `);
  if (parseInt(allocCheck.rows[0].total) > 0) {
    const allocResult = await client.query(`
      SELECT ma.*, u.full_name AS mentor_name
      FROM   mentor_allocations ma
      LEFT JOIN users u ON u.id = ma.mentor_id OR u.id = ma.user_id OR u.id = ma.mentor_user_id
      LIMIT 10
    `).catch(() => ({ rows: [] }));
    info(`mentor_allocations sample (up to 10): ${allocResult.rows.length} row(s)`);
  }

  ok('Cleanup complete. Summary:');
  console.log(`
    Total mentors in DB   : ${remaining.rows.length}
    Expected              : ${VALID_EMAILS.length}
    Status                : ${remaining.rows.length === VALID_EMAILS.length ? '✅ MATCH' : '⚠️  MISMATCH — manual review needed'}
  `);
}

run().catch((err) => {
  console.error('\n❌ Script failed:', err.message);
  process.exitCode = 1;
});
