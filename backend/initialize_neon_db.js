const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const schemaPath = path.join(__dirname, '../database/projectflow_edu_postgres_schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

async function initializeNeonDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is not defined in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL using DATABASE_URL...');
  console.log(`Connection URL (obscured): ${dbUrl.substring(0, 30)}...`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false // Required for Neon PostgreSQL
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon PostgreSQL!');
    
    console.log('Executing projectflow_edu_postgres_schema.sql on Neon database...');
    await client.query(schemaSql);
    console.log('🎉 PostgreSQL Database Schema and Seed Data executed successfully on Neon!');

    // Let's verify that the seeded users exist
    console.log('Verifying seeded users in the users table...');
    const res = await client.query("SELECT email, role, full_name FROM users WHERE email IN ('student@college.edu', 'mentor@college.edu', 'hod@college.edu')");
    console.log('Found seeded users:');
    res.rows.forEach(row => {
      console.log(` - ${row.full_name} (${row.email}) as [${row.role}]`);
    });

    if (res.rows.length === 4) {
      console.log('✅ All 4 demo users successfully seeded and verified!');
    } else {
      console.warn(`⚠️ Seed verification warning: Expected 4 users, but found ${res.rows.length}.`);
    }

  } catch (error) {
    console.error('❌ Error initializing database on Neon:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

initializeNeonDb();
