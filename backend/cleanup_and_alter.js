const db = require('./src/config/db');

async function cleanupAndAlter() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete duplicate students keeping the lowest id
    console.log('Cleaning up duplicate students...');
    await client.query(`
      DELETE FROM students
      WHERE user_id NOT IN (
        SELECT MIN(user_id)
        FROM students
        GROUP BY roll_number
      )
    `);

    // 2. Delete duplicate users keeping the lowest id
    console.log('Cleaning up duplicate users...');
    await client.query(`
      DELETE FROM users
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM users
        GROUP BY email
      )
    `);

    // 3. Add unique constraints if they don't exist
    console.log('Adding constraints...');
    
    // Check if users_email_unique exists
    const resUsers = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'users_email_unique'
    `);
    if (resUsers.rows.length === 0) {
      await client.query('ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)');
      console.log('Added users_email_unique constraint.');
    } else {
      console.log('users_email_unique constraint already exists.');
    }

    // Check if students_roll_number_unique exists
    const resStudents = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'students' AND constraint_name = 'students_roll_number_unique'
    `);
    if (resStudents.rows.length === 0) {
      await client.query('ALTER TABLE students ADD CONSTRAINT students_roll_number_unique UNIQUE (roll_number)');
      console.log('Added students_roll_number_unique constraint.');
    } else {
      console.log('students_roll_number_unique constraint already exists.');
    }

    await client.query('COMMIT');
    console.log('Successfully completed database cleanup and alteration.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup and alteration:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanupAndAlter();
