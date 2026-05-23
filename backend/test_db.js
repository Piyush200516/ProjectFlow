const db = require('./src/config/db');

async function test() {
  try {
    console.log("=== 1. HOD form saved? ===");
    const [forms] = await db.execute(`
      SELECT id, title, branch, academic_year, semester, section, status, start_date, deadline
      FROM registration_forms
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    console.table(forms);

    console.log("\n=== 2. Student profile values? ===");
    const [students] = await db.execute(`
      SELECT u.id, u.email, s.branch_id, b.name as branch_name, s.academic_year, s.semester, s.section
      FROM users u
      JOIN students s ON s.user_id = u.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LIMIT 5;
    `);
    console.table(students);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
