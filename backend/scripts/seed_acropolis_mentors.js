const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const defaultPassword = 'mentor@acro123';

const mentors = [
  { name: 'Shivshankar Rajput', email: 'shivshankarrajput@acropolis.in' },
  { name: 'Urvashi Sharma', email: 'urvashisharma@acropolis.in' },
  { name: 'Kavita Dubey', email: 'kavitadubey@acropolis.in' },
  { name: 'Akshay Dubey', email: 'akshaydubey@acropolis.in' },
  { name: 'Leeladhar Chourasiya', email: 'leeladharchourasiya@acropolis.in' },
  { name: 'Gaurav Sojatia', email: 'gaurav@acropolis.in' },
];

const ensureMentorSchema = async () => {
  await db.pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      profile_image VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.pool.query(`
    CREATE TABLE IF NOT EXISTS mentors (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      department VARCHAR(100),
      designation VARCHAR(100),
      specialization VARCHAR(255),
      max_projects INT DEFAULT 8,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)`);
  await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150)`);
  await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
  await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)`);
  await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
  await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)`);

  await db.pool.query(`ALTER TABLE mentors ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
  await db.pool.query(`ALTER TABLE mentors ADD COLUMN IF NOT EXISTS department_id INT`);
  await db.pool.query(`ALTER TABLE mentors ADD COLUMN IF NOT EXISTS designation VARCHAR(100)`);
  await db.pool.query(`ALTER TABLE mentors ADD COLUMN IF NOT EXISTS specialization VARCHAR(255)`);
  await db.pool.query(`ALTER TABLE mentors ADD COLUMN IF NOT EXISTS max_projects INT DEFAULT 8`);
  await db.pool.query(`ALTER TABLE mentors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
};

const getDefaultDepartmentId = async (client) => {
  const department = await client.query(`
    SELECT id
    FROM departments
    WHERE code IN ('CSE_DEPT', 'CSE')
       OR name ILIKE '%Computer Science%'
    ORDER BY id
    LIMIT 1
  `);

  if (department.rows[0]?.id) {
    return department.rows[0].id;
  }

  const inserted = await client.query(`
    INSERT INTO departments (name, code)
    VALUES ('Computer Science & Engineering', 'CSE_DEPT')
    ON CONFLICT DO NOTHING
    RETURNING id
  `);

  if (inserted.rows[0]?.id) {
    return inserted.rows[0].id;
  }

  const fallback = await client.query('SELECT id FROM departments ORDER BY id LIMIT 1');
  if (!fallback.rows[0]?.id) {
    throw new Error('No department found for mentor profile creation.');
  }
  return fallback.rows[0].id;
};

const seedMentors = async () => {
  await ensureMentorSchema();
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const departmentId = await getDefaultDepartmentId(client);

    const insertedUsers = [];
    const skippedUsers = [];

    for (const mentor of mentors) {
      const userResult = await client.query(`
        INSERT INTO users (full_name, email, password_hash, role, is_active, updated_at)
        VALUES ($1, LOWER($2), $3, 'mentor', TRUE, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id, full_name, email
      `, [mentor.name, mentor.email, passwordHash]);

      const existingOrInserted = userResult.rows[0] || (await client.query(`
        SELECT id, full_name, email
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `, [mentor.email])).rows[0];

      if (!existingOrInserted) {
        throw new Error(`Unable to resolve mentor user for ${mentor.email}`);
      }

      await client.query(`
        UPDATE users
        SET password_hash = $2,
            role = 'mentor',
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = $1
      `, [existingOrInserted.id, passwordHash]);

      await client.query(`
        INSERT INTO mentors (user_id, department_id, department, designation, specialization, max_projects, updated_at)
        VALUES ($1, $2, 'CSE', 'Mentor', 'Project Mentoring', 8, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET department_id = EXCLUDED.department_id,
            department = COALESCE(mentors.department, EXCLUDED.department),
            designation = COALESCE(mentors.designation, EXCLUDED.designation),
            specialization = COALESCE(mentors.specialization, EXCLUDED.specialization),
            updated_at = NOW()
      `, [existingOrInserted.id, departmentId]);

      if (userResult.rows.length > 0) {
        insertedUsers.push(existingOrInserted);
      } else {
        skippedUsers.push(existingOrInserted);
      }
    }

    await client.query('COMMIT');
    return { passwordHash, insertedUsers, skippedUsers };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

(async () => {
  try {
    const result = await seedMentors();
    console.log(JSON.stringify({
      success: true,
      inserted: result.insertedUsers.length,
      skippedDuplicates: result.skippedUsers.length,
      mentors: [...result.insertedUsers, ...result.skippedUsers].map((mentor) => ({
        id: mentor.id,
        name: mentor.full_name,
        email: mentor.email,
      })),
      passwordHash: result.passwordHash,
    }, null, 2));
  } catch (error) {
    console.error('Seed Acropolis mentors failed:', error);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
